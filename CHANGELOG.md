# Changelog

## StreamBDIX+ 1.4.1
- Saved source settings (enabled / forced sources) are imported once from `~/.streambdix`, so the same FTP sources keep working after the rename.
- Terminal box shows the plain `http://` manifest link; no log lines are printed under it.

## v1.5.0
- **New sources**: RoarZone, FTPBD, CircleFTP, ICC FTP
- **Web UI**: Configure sources at `http://127.0.0.1:7001`
- **Cloudflare Tunnel**: Access addon remotely with token validation
- **Developer Mode**: Enable unreachable sources, Persist sources across restarts
- **Removed**: cheerio dependency, auto-browser-open

## v1.0.1
- Initial release
## 1.4.1 - Security hardening
- Bind the addon server explicitly to 127.0.0.1.
- Restrict Host and browser Origin values to localhost.
- Restrict management APIs to loopback requests and validate JSON request size/content type.
- Write configuration atomically with restrictive file permissions.
- Disable Cloudflare Tunnel and token management in this public distribution build, as requested.
- Preserve the existing source selection, Stremio routes, and local web UI.
