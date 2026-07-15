# System Architecture - Telegram Content Distribution Platform

## 1. High-Level Core Design Block Schema

```
       +--------------------------------------------------------------+
       |                  ADMIN DASHBOARD (React UI)                  |
       +------------------------------+-------------------------------+
                                      |
       +------------------------------v-------------------------------+
       |             API WEB GATEWAY (Express Express.js)             |
       +------------------------------+-------------------------------+
                                      |
         +----------------------------+----------------------------+
         |                            |                            |
+--------v---------+        +---------v---------+        +---------v---------+
|  Local Scanner   |        |  PostgreSQL DB    |        |  Telegram Bot API |
|  Agent Daemon    |        |  (Supabase Cache) |        |  (Multi-Channels) |
+------------------+        +-------------------+        +-------------------+
```

---

## 2. Media Ingestion Engine Workflow

1. **Scan Directory**: Scans `/videos`, `/media`, VPS folders or connected External HDDs on intervals.
2. **Device Handshake**: The lightweight agent signs heartbeats to API `/api/agent/heartbeat` using a secure API Key.
3. **Transmission**: Uploads scanned file list metrics to `/api/agent/sync-media`.
4. **Duplicate Safeguard**: The system runs checks against the filename/size matrix. Only fresh entries are synced with status `NEW`.
5. **Processing Pipeline**: Analyzes video, probes metadata details (duration, codec, scale), generates public URLs based on the active `UPLOAD_MODE` selection (`LOCAL_DIRECT`, `R2_STORAGE`, `SUPABASE_STORAGE`).

---

## 3. Storage Ingest Capabilities
- **LOCAL_DIRECT**: Direct streaming uploads of files from physical disks straight to Telegram servers upon publication. Zero hosting storage costs.
- **CLOUDFLARE R2**: Automated upload of validated local videos to Cloudflare R2 bucket. Serving occurs via ultra-fast, egress-free Cloudflare CDN URLs.
- **SUPABASE STORAGE**: Row-tied uploads to Supabase buckets. Fully integrated database trigger security.
