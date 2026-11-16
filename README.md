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

## ➕ Stremio-তে StreamBDIX+ Addon যোগ করার নিয়ম

### ১. Stremio ডাউনলোড ও ইনস্টল করুন

1. [stremio.com](https://www.stremio.com/) থেকে `Stremio` ডাউনলোড করুন, তারপর আপনার ডিভাইস অনুযায়ী ইনস্টল করুন।
2. একটি Stremio অ্যাকাউন্ট তৈরি করুন।

### ২. Addon ইনস্টল করুন

1. প্রথমে টার্মিনালে `npx streambdixplus` চালিয়ে addon চালু রাখুন।
2. Stremio খুলে **Addons** এ যান এবং **Add Addon** ক্লিক করুন।
3. নিচের URL পেস্ট করে addon ইনস্টল করুন:

```
http://127.0.0.1:7001/manifest.json
```

### ⚠️ গুরুত্বপূর্ণ নোট

এই addon PC ছাড়া অন্য প্ল্যাটফর্ম থেকে সরাসরি যোগ করা যায় না।

প্রথমে আপনার **PC-তে** Stremio অ্যাকাউন্টে লগইন করুন (বা অ্যাকাউন্ট তৈরি করুন) এবং সেখানে addon ইনস্টল করুন। এরপর অন্য ডিভাইসগুলোতে (Android TV, Android ইত্যাদি) একই Stremio অ্যাকাউন্টে লগইন করলেই addon নিজে থেকে সব ডিভাইসে সিঙ্ক হয়ে যাবে।

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