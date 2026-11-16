'use strict';
// One-time, silent import of saved source settings from earlier versions
// (~/.streambdix from 1.4.x, and the short-lived ~/.streambdplus / ~/.viewbdix names),
// so the same sources stay enabled/forced after the rename. Only config.json is read;
// no tokens or anything else are copied. Existing settings are never overwritten.
const fs = require('fs');
const path = require('path');

const LEGACY_DIRS = ['.streambdix', '.streambdplus', '.viewbdix'];

function migrateLegacyConfig({ home, dataDir, cfgPath }) {
    try {
        if (fs.existsSync(cfgPath)) return false;
        for (const name of LEGACY_DIRS) {
            const legacy = path.join(home, name, 'config.json');
            if (!fs.existsSync(legacy)) continue;
            const parsed = JSON.parse(fs.readFileSync(legacy, 'utf8'));
            const out = {};
            if (Array.isArray(parsed.sources)) out.sources = parsed.sources.filter(s => typeof s === 'string');
            if (Array.isArray(parsed.forcedSources)) out.forcedSources = parsed.forcedSources.filter(s => typeof s === 'string');
            fs.mkdirSync(dataDir, { recursive: true, mode: 0o700 });
            fs.writeFileSync(cfgPath, JSON.stringify(out, null, 2), { mode: 0o600 });
            return true;
        }
    } catch { /* best effort: fall back to defaults */ }
    return false;
}

module.exports = { migrateLegacyConfig };
