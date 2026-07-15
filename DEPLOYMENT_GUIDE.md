# Production Deployment Guide

Deploying the Platform using Docker Compose.

---

## 1. Quick Start Guide

Clone your code stack onto your production VPS, NAS system, or cloud VM:

```bash
git clone https://github.com/your-org/telegram-media-platform.git /opt/telegram-media-platform
cd /opt/telegram-media-platform
```

---

## 2. Environment Setup

Create `.env` using the template provided in `.env.example`:

```bash
cp .env.example .env
nano .env
```

Ensure you populate your `GEMINI_API_KEY` to let the auto-post scheduler craft descriptions, tags, and headlines.

---

## 3. Deploying the stack

Start the stack in detached background mode:

```bash
docker compose up -d
```

Check the active services health status:

```bash
docker compose ps
```

---

## 4. Setting up n8n Workflows

1. Access your local n8n portal at `http://your-ip:5678`.
2. Login with your secure credentials.
3. Import the JSON workflows provided under the **Workflows & Guides** tab in your main admin console.
4. Set the webhook variables to link your agent syncer instantly.
