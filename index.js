#!/usr/bin/env node
// StreamBDIX+ - hardened local-only server. Cloudflare Tunnel is intentionally disabled.
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { getRouter } = require('stremio-addon-sdk');
const ui = require('./ui');
const { migrateLegacyConfig } = require('./config-migrate');
const VERSION = require('./package.json').version;

const PORT = Number.parseInt(process.env.PORT || '7001', 10);
if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535) {
    throw new Error('PORT must be a valid TCP port');
}
const HOST = '127.0.0.1';
const MAX_BODY_BYTES = 16 * 1024;
const SOURCES = {
    dflix: { name: 'Dflix', urls: ['https://movies.discoveryftp.net', 'https://cdn1.discoveryftp.net', 'https://cdn2.discoveryftp.net'] },
    dhakaflix: { name: 'DhakaFlix', urls: ['http://172.16.50.14/DHAKA-FLIX-14/', 'http://172.16.50.12/DHAKA-FLIX-12/', 'http://172.16.50.12'] },
    roarzone: { name: 'RoarZone', urls: ['https://play.roarzone.info'] },
    ftpbd: { name: 'FTPBD', urls: ['http://media.ftpbd.net:8096'] },
    circleftp: { name: 'CircleFTP', urls: ['http://new.circleftp.net'] },
    iccftp: { name: 'ICC FTP', urls: ['http://10.16.100.244'] }
};

const home = process.env.HOME || process.env.USERPROFILE;
if (!home) throw new Error('Unable to determine the user home directory');
const dataDir = path.join(home, '.streambdixplus');
const cfgPath = path.join(dataDir, 'config.json');

function ensureDataDir() {
    fs.mkdirSync(dataDir, { recursive: true, mode: 0o700 });
    try { fs.chmodSync(dataDir, 0o700); } catch { /* best effort on platforms without POSIX modes */ }
}
function getConfig() {
    try {
        const parsed = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
        return {
            sources: Array.isArray(parsed.sources) ? parsed.sources.filter(s => Object.hasOwn(SOURCES, s)) : Object.keys(SOURCES),
            forcedSources: Array.isArray(parsed.forcedSources) ? parsed.forcedSources.filter(s => Object.hasOwn(SOURCES, s)) : []
        };
    } catch {
        return { sources: Object.keys(SOURCES), forcedSources: [] };
    }
}
function saveConfig(cfg) {
    ensureDataDir();
    const tempPath = `${cfgPath}.${process.pid}.tmp`;
    fs.writeFileSync(tempPath, JSON.stringify({
        sources: cfg.sources,
        forcedSources: cfg.forcedSources
    }, null, 2), { mode: 0o600 });
    try { fs.chmodSync(tempPath, 0o600); } catch { /* best effort */ }
    fs.renameSync(tempPath, cfgPath);
}
function isLoopbackAddress(address) {
    return address === '127.0.0.1' || address === '::1' || address === '::ffff:127.0.0.1';
}
function isAllowedHost(hostHeader) {
    if (!hostHeader) return false;
    const host = String(hostHeader).toLowerCase();
    return host === `127.0.0.1:${PORT}` || host === `localhost:${PORT}` || host === `127.0.0.1` || host === 'localhost';
}
function isAllowedOrigin(origin) {
    if (!origin) return true; // Native Stremio clients may omit Origin.
    try {
        const parsed = new URL(origin);
        return (parsed.protocol === 'http:' && ['127.0.0.1', 'localhost', '[::1]'].includes(parsed.hostname)
            && (!parsed.port || Number(parsed.port) === PORT));
    } catch { return false; }
}
function sendJson(res, status, value) {
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify(value));
}
function readJson(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        let size = 0;
        req.on('data', chunk => {
            size += chunk.length;
            if (size > MAX_BODY_BYTES) {
                reject(Object.assign(new Error('Request body too large'), { statusCode: 413 }));
                req.destroy();
                return;
            }
            body += chunk.toString('utf8');
        });
        req.on('end', () => {
            try { resolve(JSON.parse(body || '{}')); }
            catch { reject(Object.assign(new Error('Invalid JSON'), { statusCode: 400 })); }
        });
        req.on('error', reject);
    });
}
async function checkSources() {
    const results = {};
    await Promise.all(Object.entries(SOURCES).map(async ([key, source]) => {
        const checks = await Promise.all(source.urls.map(async sourceUrl => {
            const start = Date.now();
            try {
                await axios.get(sourceUrl, { timeout: 3000, maxRedirects: 3, maxContentLength: 2 * 1024 * 1024 });
                return { ok: true, ping: Date.now() - start };
            } catch { return { ok: false }; }
        }));
        const good = checks.filter(check => check.ok);
        results[key] = {
            reachable: good.length > 0,
            working: good.length,
            total: source.urls.length,
            ping: good.length ? Math.round(good.reduce((sum, item) => sum + item.ping, 0) / good.length) : null
        };
    }));
    return results;
}

migrateLegacyConfig({ home, dataDir, cfgPath });
const initialConfig = getConfig();
process.env.STREAMBDIXPLUS_SOURCES = JSON.stringify(initialConfig.sources);
const addonInterface = require('./server');
const router = getRouter(addonInterface);

const server = http.createServer(async (req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
    res.setHeader('Cache-Control', 'no-store');

    const origin = req.headers.origin;
    if (!isAllowedHost(req.headers.host)) {
        sendJson(res, 403, { error: 'Local access only' });
        return;
    }
    const remote = req.socket && req.socket.remoteAddress;
    if (!isLoopbackAddress(remote)) {
        sendJson(res, 403, { error: 'Loopback access only' });
        return;
    }
    let pathname;
    try { pathname = new URL(req.url, `http://${HOST}:${PORT}`).pathname; }
    catch { sendJson(res, 400, { error: 'Bad request URL' }); return; }

    // Browser-facing management endpoints are same-origin/localhost only. The Stremio
    // addon routes remain compatible with native clients that use their own Origin.
    if (pathname.startsWith('/api/') && !isAllowedOrigin(origin)) {
        sendJson(res, 403, { error: 'Local browser origin required' });
        return;
    }
    if (origin && isAllowedOrigin(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Vary', 'Origin');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    }
    if (req.method === 'OPTIONS') {
        if (!isAllowedOrigin(origin)) { sendJson(res, 403, { error: 'Local browser origin required' }); return; }
        res.writeHead(204);
        res.end();
        return;
    }

    if (pathname.startsWith('/api/') && req.method !== 'GET' && req.method !== 'POST') {
        sendJson(res, 405, { error: 'Method not allowed' });
        return;
    }
    if (pathname === '/api/config' && req.method === 'GET') {
        const cfg = getConfig();
        sendJson(res, 200, {
            sources: cfg.sources,
            forcedSources: cfg.forcedSources,
            tunnelEnabled: false,
            hasToken: false,
            tunnelActive: false,
            cloudflaredInstalled: false
        });
        return;
    }
    if (pathname === '/api/config' && req.method === 'POST') {
        if (!String(req.headers['content-type'] || '').toLowerCase().startsWith('application/json')) {
            sendJson(res, 415, { error: 'Content-Type must be application/json' });
            return;
        }
        try {
            const data = await readJson(req);
            const cfg = getConfig();
            if (Array.isArray(data.sources)) cfg.sources = [...new Set(data.sources.filter(s => Object.hasOwn(SOURCES, s)))];
            if (Array.isArray(data.forcedSources)) cfg.forcedSources = [...new Set(data.forcedSources.filter(s => Object.hasOwn(SOURCES, s)))];
            saveConfig(cfg);
            process.env.STREAMBDIXPLUS_SOURCES = JSON.stringify(cfg.sources);
            sendJson(res, 200, { ok: true, tunnelEnabled: false });
        } catch (error) {
            sendJson(res, error.statusCode || 400, { error: error.statusCode === 413 ? 'Request too large' : 'Invalid request' });
        }
        return;
    }
    // This public build intentionally ships with remote tunnelling and token storage disabled.
    if (pathname === '/api/token' || pathname === '/api/token/validate') {
        sendJson(res, 410, { error: 'Cloudflare Tunnel is disabled in this build' });
        return;
    }
    if (pathname === '/api/sources/check' && req.method === 'GET') {
        try { sendJson(res, 200, await checkSources()); }
        catch { sendJson(res, 502, { error: 'Source check failed' }); }
        return;
    }
    if ((pathname === '/' || pathname === '/index.html') && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(fs.readFileSync(path.join(__dirname, 'public', 'index.html')));
        return;
    }
    if (pathname === '/manifest.json' || pathname.startsWith('/stream/') || pathname.startsWith('/catalog/') || pathname.startsWith('/meta/')) {
        router(req, res, () => { res.writeHead(404); res.end(); });
        return;
    }
    res.writeHead(404);
    res.end();
});

server.requestTimeout = 15000;
server.headersTimeout = 10000;
server.keepAliveTimeout = 5000;
server.listen(PORT, HOST, () => {
    const url = `http://${HOST}:${PORT}`;
    ui.banner({ version: VERSION, url, installUrl: `${url}/manifest.json` });
});

function shutdown() {
    // Stop immediately on Ctrl+C / terminate: no waiting for open connections.
    console.log('\nStreamBDIX+ stopped.');
    process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
process.on('SIGHUP', shutdown);
