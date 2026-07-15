# Local Agent Daemon Setup Guide

Setup your folder scanning daemon on your laptop, office server, NAS machine, or VPS storage box.

---

## 1. Directory Structure

Install the lightweight daemon agent in a dedicated directory:

```bash
mkdir -p /opt/media-automation-agent
cd /opt/media-automation-agent
```

---

## 2. Dependencies installation

Ensure Node.js is installed (Version 16+), then initialize the folder and fetch packages:

```bash
npm init -y
npm install axios chokidar
```

---

## 3. Configuration Setup (`agent.config.json`)

Create `agent.config.json` inside `/opt/media-automation-agent` with your target folders to scan:

```json
{
  "folders": [
    "/videos",
    "/media",
    "/external-drive/videos",
    "/custom-folder"
  ],
  "scan_interval": "5m",
  "upload_mode": "queue"
}
```

---

## 4. Deploying the Agent (`agent.js`)

Copy the complete code block displayed in the **Workflows & Guides** tab inside the web admin panel and save it as `agent.js`.

To start the agent as a background process, use `pm2` or a systemd daemon service:

```bash
# Using PM2
npm install -g pm2
pm2 start agent.js --name "media-syncer"
pm2 save
pm2 startup
```
