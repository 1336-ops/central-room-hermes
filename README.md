# Hermes Dashboard

[![Live Demo](https://img.shields.io/badge/Live-lexskripta.my.id-emerald?style=flat-square)](https://lexskripta.my.id/dashboard/stats)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)

**AI Agent Command Center** — Dashboard monitoring dan kontrol untuk sistem [Hermes](https://hermes-agent.nousresearch.com) multi-agent.

> Built for real-world use: tracking token usage, monitoring model health, dan mengelola 4 AI agent sekaligus dari satu interface.

---

## 🖥️ Live Demo

| URL | Keterangan |
|-----|-----------|
| [/dashboard](https://lexskripta.my.id/dashboard) | Dashboard utama (perlu login) |
| [/dashboard/stats](https://lexskripta.my.id/dashboard/stats) | Token usage — publik, no login |
| [/dashboard/stats?filter=mimo&period=30d](https://lexskripta.my.id/dashboard/stats?filter=mimo&period=30d) | Usage Mimo 30 hari |
| [/dashboard/stats?filter=minimax&period=7d](https://lexskripta.my.id/dashboard/stats?filter=minimax&period=7d) | Usage MiniMax 7 hari |

---

## ✨ Fitur Utama

### 📊 Token Usage Analytics
- Tracking real-time dari session files (`.jsonl`) — tidak perlu database
- Breakdown per model dan per provider
- Filter provider: Mimo, MiniMax, iFlow, SemutsSSH, 9Router, OpenRouter, Nvidia
- Filter periode: 1 hari, 7 hari, 1 bulan, 1 tahun, semua
- Cost estimasi dalam USD dan IDR
- Server-side rendered — cepat, ringan, bisa di-screenshot langsung

### 🤖 Multi-Profile Agent Control
- 4 profile: **Coding**, **Law**, **Research**, **Social**
- Switcher profile di sidebar — ganti context agent dalam satu klik
- Setiap profile punya sessions, skills, briefing, dan config sendiri

### 🏥 Model Health Monitor
- 47+ model AI ter-track
- 6 metrik per model: latency, inference time, tokens/sec, HTTP status, uptime %, history sparkline
- Filter: search, status (online/offline), role (primary/fallback), provider
- Auto-refresh 60 detik

### 💬 Agent Chat
- Interface chat langsung ke Hermes gateway
- Model selector dengan 47+ pilihan
- History session tersimpan

### 📋 Fitur Lainnya
- **Session Browser** — lihat semua sesi dengan detail token usage
- **Briefing** — daily briefing otomatis dari agent
- **Skills Manager** — kelola tools per agent
- **File Manager** — browse workspace agent
- **Schedule** — cron jobs aktif
- **System Monitor** — CPU, RAM, disk real-time
- **Perkara Tracker** — integrasi data perkara pengadilan (SIPP)
- **Finance** — cost tracking dan analisis pengeluaran

---

## 🛠️ Tech Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 15 (App Router + Server Components) |
| Styling | Tailwind CSS + shadcn/ui |
| Runtime | Node.js 22 via PM2 |
| Proxy | Nginx + Let's Encrypt SSL |
| Data | Hermes session files (`.jsonl`) — no database |
| Auth | Cookie-based dengan hash |

---

## 🚀 Deploy

### Requirements
- Node.js 18+
- PM2
- Nginx
- [Hermes Agent](https://hermes-agent.nousresearch.com) running

### Install

```bash
git clone https://github.com/1336-ops/central-room-hermes
cd central-room-hermes
npm install
npm run build
pm2 start npm --name hermes-dashboard -- start -- -p 3001
```

### Nginx

```nginx
server {
    listen 443 ssl;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Environment

```bash
# Optional — default: 12345678
export DASHBOARD_PASSWORD=your_secure_password
pm2 restart hermes-dashboard --update-env
```

---

## 📁 Struktur Project

```
src/
├── app/
│   ├── (public)/stats/     # Token stats — no auth required
│   ├── api/                # 15 API routes
│   │   ├── status/         # Gateway & session stats
│   │   ├── token-log/      # Token usage history
│   │   ├── model-status/   # Model health check
│   │   ├── sessions/       # Session browser
│   │   ├── briefing/       # Agent briefing
│   │   ├── skills/         # Skills manager
│   │   ├── finance/        # Cost tracking
│   │   ├── logs/           # Agent logs
│   │   ├── perkara/        # Court case data
│   │   └── system/         # System metrics
│   ├── chat/               # Agent chat UI
│   ├── model-status/       # Health monitor
│   ├── sessions/           # Session browser
│   └── ...                 # 15 pages total
├── components/
│   ├── layout/             # Sidebar, header, shell
│   └── dashboard/          # Widgets & charts
└── lib/
    └── hermes.ts           # Hermes helpers & types
```

---

## 📊 Token Stats Page

Halaman `/stats` dirancang khusus untuk laporan dan screenshot:

- **No login required** — bisa dibagikan langsung
- **Server-side rendered** — data fresh setiap request
- **Filter kombinasi** — provider + periode sekaligus
- **Mobile friendly** — layout responsif

```
?filter=all&period=all      → semua data
?filter=mimo&period=30d     → Mimo bulan ini
?filter=minimax&period=7d   → MiniMax minggu ini
?filter=iflow&period=1d     → iFlow hari ini
```

---

## 🔒 Security

- Cookie-based auth dengan base64 hash + salt
- Middleware proteksi semua routes kecuali `/login` dan `/stats`
- HTTPS via Let's Encrypt (auto-renew)
- Tidak ada data sensitif di repo

---

## 📝 License

MIT — Built with ❤️ for [Hermes Agent](https://hermes-agent.nousresearch.com)
