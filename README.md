# 🎬 StreamBDIX+
**Stremio addon for streaming from BDIX sites.**

---

## 🔍 What It Does

• Fetches movies and series from BDIX sites based on what you select in Stremio  
• Shows available streams with quality info (1080p, 4K, BluRay, etc.)  
• Lets you play directly in Stremio from BDIX

---

## ⚡ Quick Start

```
npx streambdixplus
```

> Requires **[Stremio](https://www.stremio.com/downloads)**  
> Requires **[Node.js](https://nodejs.org/en/download)** 14+

---

## ➕ How to Add StreamBDIX+ to Stremio

### 1. Download & Install Stremio

1. Download `Stremio` from [stremio.com](https://www.stremio.com/), then follow the instructions for your device.
2. Create a Stremio account.

### 2. Install the Addon

1. First, start the addon by running `npx streambdixplus` in your terminal and keep it running.
2. Open Stremio, go to **Addons**, and click **Add Addon**.
3. Paste the following URL and install the addon:

```
http://127.0.0.1:7001/manifest.json
```

### ⚠️ Important Note

This addon cannot be added directly from platforms other than a PC.

First, create or log in to your Stremio account on your **PC** and install the addon there. Once installed, simply log in with the same Stremio account on your other devices (Android TV, Android, etc.). The addon will automatically sync across all your devices.

---

## 🌐 Sources

- [DFLIX](https://discoveryftp.net/)
- [DhakaFlix](http://172.16.50.12)
- [RoarZone](https://roarzone.info)
- [FTPBD](https://ftpbd.net)
- [CircleFTP](http://new.circleftp.net)
- [ICC FTP](http://10.16.100.244)

---

## ☁️ Cloudflare Tunnel (Optional)

Access your addon from anywhere using Cloudflare Tunnel.

1. Install cloudflared: `npm install -g cloudflared`
2. Create a tunnel at [Cloudflare Zero Trust](https://one.dash.cloudflare.com)
3. Paste your tunnel token in the web UI

---

## ⚠️ Important

• Run before Stremio startup — the addon must be running to fetch streams  
• Press Ctrl+C to stop the addon

---

## 🛠️ Troubleshooting

**No streams found?**  
• Make sure the addon is running (`npx streambdixplus`)  
• Check if the BDIX sites are reachable  
• The content might not be available

**Streams not playing?**  
• Try a different source/quality option

---

**Made for BDIX users**