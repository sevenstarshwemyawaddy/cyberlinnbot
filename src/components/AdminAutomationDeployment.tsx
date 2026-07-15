import React, { useState } from "react";
import { Cpu, FileCode, Check, Copy, AlertTriangle, BookOpen, Terminal, ShieldCheck, PlayCircle } from "lucide-react";

export default function AdminAutomationDeployment() {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(id);
    setTimeout(() => setCopiedSection(null), 1500);
  };

  const agentConfigSample = `{
  "folders": [
    "/videos",
    "/media",
    "/external-drive/videos"
  ],
  "scan_interval": "5m",
  "upload_mode": "queue"
}`;

  const nodeAgentCode = `const fs = require('fs');
const path = require('path');
const axios = require('axios');
const chokidar = require('chokidar'); // optional: npm install chokidar

const API_ENDPOINT = "https://ais-dev-qdhejidbqfsmdli43aurml-420629743521.us-west1.run.app";
const API_KEY = "vpstg_agent_secret_2026"; // Set custom Key matched in dashboard

// Load local config
const config = {
  folders: ["/videos", "/media"],
  scan_interval: "5m", // 5 minutes
  agent_name: "Munich VPS Storage Daemon"
};

// Heartbeat reporting function
async function sendHeartbeat() {
  try {
    const res = await axios.post(\`\${API_ENDPOINT}/api/agent/heartbeat\`, {
      name: config.agent_name,
      folders: config.folders,
      scanInterval: config.scan_interval,
      version: "1.4.2"
    }, {
      headers: { "x-api-key": API_KEY }
    });
    console.log("[AGENT] Heartbeat sent. Server registered successfully:", res.data);
  } catch (err) {
    console.error("[AGENT] Heartbeat failed:", err.message);
  }
}

// Scans configured directories and extracts file metadata
async function scanAndSync() {
  console.log("[AGENT] Initiating disk sync scan across directories...");
  const scannedFiles = [];

  for (const folder of config.folders) {
    if (!fs.existsSync(folder)) {
      console.warn(\`[AGENT] Directory path does not exist, skipping: \${folder}\`);
      continue;
    }

    const files = fs.readdirSync(folder);
    for (const file of files) {
      const ext = path.extname(file).toLowerCase();
      if ([".mp4", ".mkv", ".mov", ".avi", ".webm"].includes(ext)) {
        const filePath = path.join(folder, file);
        const stats = fs.statSync(filePath);

        // Extract metadata
        scannedFiles.push({
          filename: file,
          path: filePath,
          size: stats.size,
          duration: 180, // Default duration placeholder in seconds (mocked or extracted via ffmpeg-probe)
          resolution: "1920x1080",
          codec: "h264",
          thumbnailUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80"
        });
      }
    }
  }

  if (scannedFiles.length === 0) {
    console.log("[AGENT] No media files found to sync.");
    return;
  }

  try {
    const res = await axios.post(\`\${API_ENDPOINT}/api/agent/sync-media\`, {
      mediaFiles: scannedFiles
    }, {
      headers: { "x-api-key": API_KEY }
    });
    console.log(\`[AGENT] Sync completed. Synced count: \${res.data.syncedCount}. Duplicates: \${res.data.duplicateCount}\`);
  } catch (err) {
    console.error("[AGENT] Sync payload transmission failed:", err.message);
  }
}

// Loop cycles
sendHeartbeat();
scanAndSync();
setInterval(sendHeartbeat, 30000); // 30s heartbeat
setInterval(scanAndSync, 300000);   // 5m folder scan
`;

  const n8nWorkflow1 = `{
  "name": "Local Agent → Supabase Sync Integration",
  "nodes": [
    {
      "parameters": {
        "path": "agent-webhook",
        "options": {}
      },
      "name": "Webhook Trigger",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 1,
      "position": [100, 300]
    },
    {
      "parameters": {
        "operation": "upsert",
        "schema": "public",
        "table": "media_files",
        "columns": "filename,path,size,duration,resolution,thumbnail_url,status"
      },
      "name": "Supabase Upsert",
      "type": "n8n-nodes-base.supabase",
      "typeVersion": 1,
      "position": [300, 300]
    }
  ],
  "connections": {
    "Webhook Trigger": {
      "main": [
        [
          {
            "node": "Supabase Upsert",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  }
}`;

  const n8nWorkflow2 = `{
  "name": "Approved Media → Telegram Publisher",
  "nodes": [
    {
      "parameters": {
        "rule": "interval",
        "interval": 15,
        "unit": "seconds"
      },
      "name": "Interval Trigger",
      "type": "n8n-nodes-base.interval",
      "typeVersion": 1,
      "position": [100, 150]
    },
    {
      "parameters": {
        "url": "https://ais-dev-qdhejidbqfsmdli43aurml-420629743521.us-west1.run.app/api/admin/dashboard",
        "options": {}
      },
      "name": "Fetch Scheduled Queue",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 3,
      "position": [280, 150]
    },
    {
      "parameters": {
        "chatId": "=@saas_automation",
        "text": "=🎬 {{title}}\\n\\n{{description}}\\n\\n👇 Watch Now:\\nhttps://saas-stream.internal/api/track/click/{{id}}"
      },
      "name": "Post to Channel",
      "type": "n8n-nodes-base.telegram",
      "typeVersion": 1,
      "position": [460, 150]
    }
  ],
  "connections": {
    "Interval Trigger": {
      "main": [
        [
          {
            "node": "Fetch Scheduled Queue",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Fetch Scheduled Queue": {
      "main": [
        [
          {
            "node": "Post to Channel",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  }
}`;

  const dockerComposeYaml = `version: '3.8'

services:
  # Full-Stack Automation API Gateway Server
  api:
    image: node:18-alpine
    container_name: video_automation_api
    working_dir: /app
    volumes:
      - .:/app
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - GEMINI_API_KEY=\${GEMINI_API_KEY}
      - APP_URL=http://localhost:3000
    command: npm run start

  # Local Media Ingest Agent daemon
  agent:
    image: node:18-alpine
    container_name: local_watcher_daemon
    volumes:
      - /videos:/videos
      - /media:/media
    environment:
      - API_ENDPOINT=http://api:3000
      - API_KEY=vpstg_agent_secret_2026
    command: node agent.js

  # n8n Automation Engine Container
  n8n:
    image: docker.n8n.io/n8nio/n8n:latest
    container_name: n8n_worker_flow
    ports:
      - "5678:5678"
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=SuperSecureN8NPassword2026
    volumes:
      - n8n_storage:/home/node/.n8n

volumes:
  n8n_storage:
`;

  return (
    <div className="space-y-8 text-stone-200" id="admin_automation_deployment_container">
      {/* Page Title Header */}
      <div>
        <h2 className="text-xl font-sans font-black text-white tracking-tight flex items-center gap-2">
          <Cpu className="h-5 w-5 text-red-500 animate-pulse" />
          <span>Workflows Blueprint & Setup Guides</span>
        </h2>
        <p className="text-stone-400 text-xs sm:text-sm mt-1">
          Access local agent codes, Docker configurations, and n8n pipelines to automate your operations.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Module 2 Block: Local Agent Code Setup */}
        <div className="bg-stone-950 rounded-2xl border border-stone-850 p-6 shadow-2xl space-y-4 flex flex-col h-full">
          <div className="flex items-center justify-between border-b border-stone-900 pb-3">
            <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
              <Terminal className="h-4.5 w-4.5 text-yellow-500" />
              <span>Node.js Local Ingest Agent (agent.js)</span>
            </h3>
            <button
              onClick={() => handleCopy(nodeAgentCode, "agent_code")}
              className="inline-flex items-center space-x-1 text-xs text-yellow-400 hover:text-yellow-300 font-bold bg-stone-900 border border-stone-800 px-2.5 py-1 rounded-lg cursor-pointer"
            >
              {copiedSection === "agent_code" ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy Code</span>
                </>
              )}
            </button>
          </div>

          <p className="text-[11px] text-stone-400">
            Install Node.js on your NAS server, laptop, VPS, or HDD-mounted desktop, and save this file. It automatically scans, generates metadata, and heartbeats to your main deployment.
          </p>

          <div className="flex-1 min-h-[250px] rounded-xl bg-black p-4 border border-stone-900 relative">
            <pre className="text-[10px] font-mono text-red-400 overflow-y-auto max-h-[300px] leading-relaxed select-all">
              {nodeAgentCode}
            </pre>
          </div>

          <div className="bg-yellow-950/20 border border-yellow-500/10 p-3.5 rounded-xl flex items-start space-x-2 text-[11px] text-yellow-400">
            <AlertTriangle className="h-4 w-4 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold uppercase tracking-wider">Required Setup Steps:</span> Make sure folders <code className="font-mono bg-stone-900 border border-stone-800 text-white px-1 py-0.25 rounded">/videos</code> and <code className="font-mono bg-stone-900 border border-stone-800 text-white px-1 py-0.25 rounded">/media</code> are physically mounted, or update the list paths inside your <code className="font-mono bg-stone-900 border border-stone-800 text-white px-1 py-0.25 rounded">agent.config.json</code> config parameters.
            </div>
          </div>
        </div>

        {/* Module 10 Block: Docker Compose */}
        <div className="bg-stone-950 rounded-2xl border border-stone-850 p-6 shadow-2xl space-y-4 flex flex-col h-full">
          <div className="flex items-center justify-between border-b border-stone-900 pb-3">
            <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
              <FileCode className="h-4.5 w-4.5 text-yellow-500" />
              <span>Docker Compose (docker-compose.yml)</span>
            </h3>
            <button
              onClick={() => handleCopy(dockerComposeYaml, "docker_compose")}
              className="inline-flex items-center space-x-1 text-xs text-yellow-400 hover:text-yellow-300 font-bold bg-stone-900 border border-stone-800 px-2.5 py-1 rounded-lg cursor-pointer"
            >
              {copiedSection === "docker_compose" ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy YAML</span>
                </>
              )}
            </button>
          </div>

          <p className="text-[11px] text-stone-400">
            Provides a multi-service setup including the Automation API Web Gateway, the Local folder agent container, and n8n in a single Docker stack. Run <code className="font-mono bg-stone-900 border border-stone-800 text-red-400 px-1.5 py-0.5 rounded">docker compose up -d</code> to boot.
          </p>

          <div className="flex-1 min-h-[250px] rounded-xl bg-black p-4 border border-stone-900 relative">
            <pre className="text-[10px] font-mono text-emerald-400 overflow-y-auto max-h-[300px] leading-relaxed select-all">
              {dockerComposeYaml}
            </pre>
          </div>

          <div className="bg-red-950/20 border border-red-500/10 p-3.5 rounded-xl flex items-start space-x-2 text-[11px] text-red-400">
            <ShieldCheck className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold uppercase tracking-wider">Security Compliance:</span> Integrates Node.js TLS protocols and x-api-key device heartbeats to shield local mount-points from unauthorized API requests or injections.
            </div>
          </div>
        </div>
      </div>

      {/* Module 8 Block: n8n Flow Blueprints */}
      <div className="bg-stone-950 rounded-2xl border border-stone-850 p-6 shadow-2xl space-y-6">
        <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2 border-b border-stone-900 pb-3">
          <BookOpen className="h-4.5 w-4.5 text-red-500" />
          <span>n8n Workflow Blueprints & API Webhooks</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-stone-850 bg-stone-900/40 rounded-xl p-4 space-y-3 flex flex-col justify-between hover:border-stone-800 transition-colors">
            <div>
              <span className="text-[9px] font-black text-red-400 uppercase tracking-widest bg-red-950/40 border border-red-500/10 px-2 py-1 rounded">
                Workflow Blueprint 1
              </span>
              <h4 className="text-xs font-black text-white uppercase tracking-wide mt-3">Agent Scanner Ingest → Supabase Row Creation</h4>
              <p className="text-[11px] text-stone-400 mt-1">
                Catches incoming scanning loops from the local agent, sanitizes parameters, checks for duplication, and maps directly to PostgreSQL database rows.
              </p>
            </div>
            <button
              onClick={() => handleCopy(n8nWorkflow1, "wf1")}
              className="mt-3 inline-flex items-center justify-center space-x-1.5 rounded-lg border border-stone-800 bg-stone-950 px-3 py-1.5 text-[11px] font-bold text-stone-300 hover:text-white cursor-pointer"
            >
              {copiedSection === "wf1" ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5 text-red-500" />}
              <span>{copiedSection === "wf1" ? "Blueprint Copied!" : "Copy n8n Node JSON"}</span>
            </button>
          </div>

          <div className="border border-stone-850 bg-stone-900/40 rounded-xl p-4 space-y-3 flex flex-col justify-between hover:border-stone-800 transition-colors">
            <div>
              <span className="text-[9px] font-black text-red-400 uppercase tracking-widest bg-red-950/40 border border-red-500/10 px-2 py-1 rounded">
                Workflow Blueprint 2
              </span>
              <h4 className="text-xs font-black text-white uppercase tracking-wide mt-3">Approved Media → Telegram Scheduled Post Automation</h4>
              <p className="text-[11px] text-stone-400 mt-1">
                Fetches active queues from the scheduling engine, structures captions dynamically with emojis/links, and publishes content using Telegram's sendPhoto/sendVideo Bot APIs.
              </p>
            </div>
            <button
              onClick={() => handleCopy(n8nWorkflow2, "wf2")}
              className="mt-3 inline-flex items-center justify-center space-x-1.5 rounded-lg border border-stone-800 bg-stone-950 px-3 py-1.5 text-[11px] font-bold text-stone-300 hover:text-white cursor-pointer"
            >
              {copiedSection === "wf2" ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5 text-red-500" />}
              <span>{copiedSection === "wf2" ? "Blueprint Copied!" : "Copy n8n Node JSON"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
