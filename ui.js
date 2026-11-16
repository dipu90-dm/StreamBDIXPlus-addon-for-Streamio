'use strict';
// Terminal UI for StreamBDIX+. Dependency-free; shrinks to fit narrow (phone) terminals.
const useColor = Boolean(process.stdout.isTTY) && !process.env.NO_COLOR;
const paint = code => s => (useColor ? `\x1b[${code}m${s}\x1b[0m` : String(s));
const bold = paint('1'), dim = paint('2'), red = paint('31'), green = paint('32');
const yellow = paint('33'), cyan = paint('36'), magenta = paint('35');
const strip = s => String(s).replace(/\x1b\[[0-9;]*m/g, '');
const pad = (s, n) => s + ' '.repeat(Math.max(0, n - strip(s).length));

const MAX_WIDTH = 55; // total box width in columns, including borders

function layout() {
    const cols = process.stdout.columns || 80;
    const total = Math.max(26, Math.min(MAX_WIDTH, cols - 1));
    const inner = total - 2;
    const margin = total >= 48 ? 2 : 1; // side padding inside the box
    return { inner, margin, cw: inner - margin * 2 };
}

// Hard-wrap plain text to a width (used before colouring).
function wrap(text, w) {
    const out = [];
    for (let i = 0; i < text.length; i += w) out.push(text.slice(i, i + w));
    return out.length ? out : [''];
}

// Lines: strings, '' for a blank row, '---' for a divider.
function box(lines, { inner, margin, cw }, color = cyan) {
    const sp = ' '.repeat(margin);
    const row = l => (l === '---'
        ? color('├' + '─'.repeat(inner) + '┤')
        : color('│') + sp + pad(l, cw) + sp + color('│'));
    return [color('╭' + '─'.repeat(inner) + '╮'), ...lines.map(row), color('╰' + '─'.repeat(inner) + '╯')].join('\n');
}

const wrapWords = (t, w) => {
    const out = []; let cur = '';
    for (const word of t.split(' ')) {
        if ((cur + ' ' + word).trim().length > w) { out.push(cur); cur = word; } else cur = (cur + ' ' + word).trim();
    }
    out.push(cur);
    return out;
};
const ctr = (text, w) => ' '.repeat(Math.max(0, Math.floor((w - strip(text).length) / 2))) + text;

function banner({ version, url, installUrl }) {
    if (useColor) process.stdout.write('\x1b[2J\x1b[H');
    const L = layout();
    const title = bold(cyan('StreamBDIX+')) + dim('  v' + version);
    const status = green('● Running');
    const oneLine = title + '   ' + status;
    const header = strip(oneLine).length <= L.cw ? [ctr(oneLine, L.cw)] : [ctr(title, L.cw), ctr(status, L.cw)];

    // "LABEL  value" rows when they fit (kept aligned with each other, centred as a block);
    // otherwise label above value. Every line is centred.
    const LABEL = 7; // width of "STREMIO"
    const inline = L.cw >= LABEL + 2 + Math.max(url.length, installUrl.length);
    let items;
    if (inline) {
        const row = (label, value, colour) => ctr(dim(label) + '  ' + colour(value), L.cw);
        items = [row('WEB UI', url, bold), row('STREMIO', installUrl, cyan)];
    } else {
        items = [
            ctr(dim('WEB UI'), L.cw), ...wrap(url, L.cw).map(t => ctr(bold(t), L.cw)),
            ctr(dim('STREMIO'), L.cw), ...wrap(installUrl, L.cw).map(t => ctr(cyan(t), L.cw))
        ];
    }

    const note = wrapWords('Keep terminal open while streaming!', L.cw).map(t => ctr(yellow(t), L.cw));
    const lines = [...header, '---', ...items, ...note, '---', ctr(dim('Ctrl+C to stop'), L.cw)];
    console.log(box(lines, L));
    console.log('');
}

module.exports = { banner };
