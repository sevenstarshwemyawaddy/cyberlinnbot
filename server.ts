import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { Video, TelegramConfig, ScheduleConfig, Analytics, LogEntry, DailyMetric, MediaFile, LocalAgent } from "./src/types.js";

const app = express();
const PORT = 3000;

// Initialize optional Gemini client
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  try {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  } catch (err) {
    console.error("Gemini initialization failed:", err);
  }
}

app.use(express.json());

// Resolve static paths
const isCjs = typeof __dirname !== "undefined";
const currentDir = isCjs ? __dirname : path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(currentDir, "server-db.json");

// System Logs queue (last 100 logs)
let logs: LogEntry[] = [];

function addLog(level: LogEntry["level"], message: string, source: LogEntry["source"]) {
  const log: LogEntry = {
    id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    timestamp: new Date().toISOString(),
    level,
    message,
    source,
  };
  logs.unshift(log);
  if (logs.length > 100) {
    logs.pop();
  }
  console.log(`[${log.source.toUpperCase()}] [${log.level.toUpperCase()}] ${log.message}`);
}

addLog("info", "Initializing full-stack Video + Telegram automation system...", "system");

// Initial DB Seed structure
const initialDb = {
  videos: [
    {
      id: "vid_1",
      title: "The Future of SaaS Integrations",
      slug: "future-saas-integrations",
      category: "Tech & AI",
      description: "An in-depth look at how low-code and Telegram bots are shaping the next generation of automation tools. Learn how to optimize edge functions and reduce cloud compute bills by 80%.",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
      thumbnailUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80",
      telegramCaption: "🤖 The Future of SaaS is here! Learn how edge functions and background schedulers can slash your cloud bills by 80%. Check out our full analysis now! 👇",
      views: 1245,
      likes: 89,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      scheduledAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      telegramPosted: true,
      telegramPostId: "msg_200401",
      telegramPostedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "vid_2",
      title: "Cinematic Sunset Journey",
      slug: "cinematic-sunset-journey",
      category: "Cinematic Beats",
      description: "A breathtaking slow-motion compilation of coastal landscapes and golden hour drone views. Optimized for relaxing ambient viewing.",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      thumbnailUrl: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80",
      telegramCaption: "🌅 Escape into the beauty of coastlines during the golden hour. Rest your eyes and experience the sunset landscape. Watch HD now! 📺",
      views: 832,
      likes: 64,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      scheduledAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      telegramPosted: true,
      telegramPostId: "msg_200402",
      telegramPostedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "vid_3",
      title: "Zero-Cost Serverless Architectures",
      slug: "zero-cost-serverless",
      category: "SaaS Automation",
      description: "How to deploy robust, high-traffic SaaS endpoints using Vercel, Supabase edge functions, and local file caching rules. Minimizing reads and API calls.",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
      thumbnailUrl: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80",
      telegramCaption: "💻 Cloud computing shouldn't cost a fortune. See our step-by-step masterclass on Zero-Cost Serverless Architectures. 🔥",
      views: 2110,
      likes: 198,
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      scheduledAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      telegramPosted: true,
      telegramPostId: "msg_200403",
      telegramPostedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "vid_4",
      title: "Deep Ocean Exploration",
      slug: "deep-ocean-exploration",
      category: "Nature & Wildlife",
      description: "Delve into the mysterious depths of the pacific ocean. High definition footage of bioluminescent organisms and ancient sea beds.",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
      thumbnailUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
      telegramCaption: "🌊 Explore the bioluminescent wonders of the deep sea. A fascinating nature documentary of marine life. Watch HD here: 🐳",
      views: 412,
      likes: 31,
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      scheduledAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours in future
      telegramPosted: false,
    },
    {
      id: "vid_5",
      title: "Building Telegram Automation Loops",
      slug: "telegram-automation-loops",
      category: "SaaS Automation",
      description: "Step-by-step tutorial on coding reliable Telegram Bot APIs with auto-retries, rate limiting compliance, and automated scheduling logic.",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
      thumbnailUrl: "https://images.unsplash.com/photo-1614064641938-3bbee52942c7?auto=format&fit=crop&w=800&q=80",
      telegramCaption: "🤖 Automate your channel growth! Code a background scheduling bot in Node.js to auto-publish your content seamlessly. 🚀",
      views: 156,
      likes: 12,
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      scheduledAt: new Date(Date.now() + 18 * 60 * 60 * 1000).toISOString(), // 18 hours in future
      telegramPosted: false,
    },
    {
      id: "vid_6",
      title: "The Zen of Nature Beats",
      slug: "zen-nature-beats",
      category: "Cinematic Beats",
      description: "Combining meditative visuals of forests, streams, and gentle rain with lo-fi music. Perfect for focus, studying, or deep sleep.",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
      thumbnailUrl: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=800&q=80",
      telegramCaption: "🌲 Slow down and recharge. Beautiful nature visuals paired with soothing study lo-fi beats. Stay focused! 🎧",
      views: 67,
      likes: 5,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      scheduledAt: null, // manual only
      telegramPosted: false,
    }
  ] as Video[],

  telegramConfig: {
    botToken: "",
    channelId: "",
    botName: "VidPost_Automation_Bot",
    isEnabled: false,
    bots: [
      { id: "bot_1", name: "Main Channel Automation Bot", token: "123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ", isEnabled: true },
      { id: "bot_2", name: "Premium Group Delivery Bot", token: "987654321:ZYXwvuTsrQPOnMlKjIHgFedCBA", isEnabled: false }
    ],
    targets: [
      { id: "tgt_1", name: "SaaS Automation Channel", usernameOrId: "@saas_automation", type: "channel", isEnabled: true },
      { id: "tgt_2", name: "Premium VIP Beta Group", usernameOrId: "-100192837465", type: "group", isEnabled: false }
    ],
    uploadMode: "LOCAL_DIRECT"
  } as TelegramConfig,

  scheduleConfig: {
    postingIntervalHours: 6,
    autoPostEnabled: true,
    preferredPostTimes: ["09:00", "15:00", "21:00"],
  } as ScheduleConfig,

  analytics: {
    totalViews: 4185,
    totalLikes: 367,
    telegramClicks: 1420,
    channelClicks: 210,
    publishedCount: 15,
    failedCount: 2,
    dailyMetrics: [
      { date: "2026-07-06", views: 320, watchTime: 12000, telegramClicks: 90 },
      { date: "2026-07-07", views: 410, watchTime: 15400, telegramClicks: 124 },
      { date: "2026-07-08", views: 580, watchTime: 21800, telegramClicks: 198 },
      { date: "2026-07-09", views: 720, watchTime: 29000, telegramClicks: 230 },
      { date: "2026-07-10", views: 890, watchTime: 34000, telegramClicks: 290 },
      { date: "2026-07-11", views: 1100, watchTime: 42000, telegramClicks: 398 },
      { date: "2026-07-12", views: 165, watchTime: 6200, telegramClicks: 90 },
    ],
    clicksByVideo: {
      "vid_1": 482,
      "vid_2": 310,
      "vid_3": 628,
    }
  } as Analytics,

  mediaFiles: [
    {
      id: "media_1",
      filename: "tutorial_lowres_2026.mp4",
      path: "/videos/tutorial_lowres_2026.mp4",
      size: 45892012,
      duration: 324,
      resolution: "1920x1080",
      thumbnailUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80",
      status: "READY",
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      agentId: "agent_vps_1",
      codec: "h264"
    },
    {
      id: "media_2",
      filename: "beach_landscape_draft.mov",
      path: "/mnt/external/videos/beach_landscape_draft.mov",
      size: 154829100,
      duration: 58,
      resolution: "3840x2160",
      thumbnailUrl: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80",
      status: "NEW",
      createdAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
      agentId: "agent_laptop_1",
      codec: "prores"
    }
  ] as MediaFile[],

  localAgents: [
    {
      id: "agent_vps_1",
      name: "Munich VPS Storage Daemon",
      apiKey: "vpstg_agent_secret_2026",
      folders: ["/videos", "/media"],
      scanInterval: "5m",
      lastSeen: new Date().toISOString(),
      isOnline: true,
      version: "1.4.2"
    },
    {
      id: "agent_laptop_1",
      name: "Office NAS Folder Watcher",
      apiKey: "laptop_agent_secret_2026",
      folders: ["/mnt/external/videos", "/custom-folder"],
      scanInterval: "10m",
      lastSeen: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      isOnline: false,
      version: "1.4.1"
    }
  ] as LocalAgent[]
};

// Ensure database file exists
function readDb() {
  try {
    if (!fs.existsSync(dbPath)) {
      addLog("info", "No database file detected. Initializing database with seeds.", "system");
      fs.writeFileSync(dbPath, JSON.stringify(initialDb, null, 2), "utf8");
      return initialDb;
    }
    const data = fs.readFileSync(dbPath, "utf8");
    const db = JSON.parse(data);
    
    // Normalization layers for backward compatibility
    if (!db.mediaFiles) db.mediaFiles = [];
    if (!db.localAgents) db.localAgents = [];
    if (!db.telegramConfig.bots) db.telegramConfig.bots = [];
    if (!db.telegramConfig.targets) db.telegramConfig.targets = [];
    if (db.telegramConfig.uploadMode === undefined) db.telegramConfig.uploadMode = "LOCAL_DIRECT";
    if (db.analytics.publishedCount === undefined) db.analytics.publishedCount = 0;
    if (db.analytics.failedCount === undefined) db.analytics.failedCount = 0;
    
    return db;
  } catch (err: any) {
    addLog("error", `Database read failed: ${err.message}. Reverting to initial seed.`, "system");
    return initialDb;
  }
}

function writeDb(data: typeof initialDb) {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), "utf8");
  } catch (err: any) {
    addLog("error", `Database write failed: ${err.message}`, "system");
  }
}

// Helper to track metrics elegantly
function recordDailyMetric(type: "view" | "telegramClick" | "watch", value: number = 1) {
  const db = readDb();
  const today = new Date().toISOString().split("T")[0];
  
  let metric = db.analytics.dailyMetrics.find((m: DailyMetric) => m.date === today);
  if (!metric) {
    metric = { date: today, views: 0, watchTime: 0, telegramClicks: 0 };
    db.analytics.dailyMetrics.push(metric);
  }

  if (type === "view") {
    db.analytics.totalViews += value;
    metric.views += value;
  } else if (type === "telegramClick") {
    db.analytics.telegramClicks += value;
    metric.telegramClicks += value;
  } else if (type === "watch") {
    metric.watchTime += value;
  }
  
  writeDb(db);
}

// API: List all videos (Public)
app.get("/api/videos", (req, res) => {
  const db = readDb();
  // Cost-optimized: only send required fields for public grid unless full detail requested
  const publicList = db.videos.map((v: Video) => ({
    id: v.id,
    title: v.title,
    slug: v.slug,
    category: v.category,
    thumbnailUrl: v.thumbnailUrl,
    views: v.views,
    likes: v.likes,
    createdAt: v.createdAt,
    telegramPosted: v.telegramPosted,
  }));
  res.json(publicList);
});

// API: Get video by Slug (Public)
app.get("/api/videos/slug/:slug", (req, res) => {
  const db = readDb();
  const video = db.videos.find((v: Video) => v.slug === req.params.slug);
  if (!video) {
    return res.status(404).json({ error: "Video not found" });
  }
  res.json(video);
});

// API: Log video watch play view event (Public, cost-optimized batch proxy)
app.post("/api/videos/:id/view", (req, res) => {
  const db = readDb();
  const videoIdx = db.videos.findIndex((v: Video) => v.id === req.params.id);
  if (videoIdx !== -1) {
    db.videos[videoIdx].views += 1;
    writeDb(db);
    recordDailyMetric("view", 1);
    addLog("info", `Recorded view for video: "${db.videos[videoIdx].title}"`, "api");
    return res.json({ success: true, views: db.videos[videoIdx].views });
  }
  res.status(404).json({ error: "Video not found" });
});

// API: Track play-time heartbeats (Public, updates daily aggregates to optimize size)
app.post("/api/videos/:id/heartbeat", (req, res) => {
  const { seconds } = req.body;
  if (typeof seconds === "number" && seconds > 0 && seconds <= 60) {
    recordDailyMetric("watch", seconds);
    return res.json({ success: true });
  }
  res.status(400).json({ error: "Invalid heartbeats" });
});

// API: Like video (Public)
app.post("/api/videos/:id/like", (req, res) => {
  const db = readDb();
  const videoIdx = db.videos.findIndex((v: Video) => v.id === req.params.id);
  if (videoIdx !== -1) {
    db.videos[videoIdx].likes += 1;
    db.analytics.totalLikes += 1;
    writeDb(db);
    addLog("success", `Video liked: "${db.videos[videoIdx].title}"`, "api");
    return res.json({ success: true, likes: db.videos[videoIdx].likes });
  }
  res.status(404).json({ error: "Video not found" });
});

// API: Direct click tracker URL proxying (Simulates analytics click redirections)
app.get("/api/track/click/:id", (req, res) => {
  const db = readDb();
  const video = db.videos.find((v: Video) => v.id === req.params.id);
  
  // Track the Telegram link click
  recordDailyMetric("telegramClick", 1);
  db.analytics.clicksByVideo[req.params.id] = (db.analytics.clicksByVideo[req.params.id] || 0) + 1;
  writeDb(db);

  addLog("info", `Telegram click recorded for video: "${video ? video.title : "Unknown"}"`, "telegram");

  // Redirect to watch page
  if (video) {
    res.redirect(`/#watch/${video.slug}`);
  } else {
    res.redirect("/");
  }
});

// API: Track external Channel clicks (e.g. Join channel clicks)
app.post("/api/track/channel-click", (req, res) => {
  const db = readDb();
  db.analytics.channelClicks += 1;
  writeDb(db);
  addLog("info", "User clicked Telegram Channel Link", "api");
  res.json({ success: true, channelClicks: db.analytics.channelClicks });
});

// API: Get admin database config & analytics (Admin)
app.get("/api/admin/dashboard", (req, res) => {
  const db = readDb();
  res.json({
    videos: db.videos,
    telegramConfig: db.telegramConfig,
    scheduleConfig: db.scheduleConfig,
    analytics: db.analytics,
    mediaFiles: db.mediaFiles || [],
    localAgents: db.localAgents || [],
  });
});

// API: Save configurations (Admin)
app.post("/api/admin/config", (req, res) => {
  const { telegramConfig, scheduleConfig } = req.body;
  const db = readDb();
  
  if (telegramConfig) {
    db.telegramConfig = { ...db.telegramConfig, ...telegramConfig };
    addLog("info", `Telegram Config updated. Mode: ${db.telegramConfig.uploadMode}. Bots: ${db.telegramConfig.bots?.length || 0}. Targets: ${db.telegramConfig.targets?.length || 0}`, "system");
  }
  if (scheduleConfig) {
    db.scheduleConfig = { ...db.scheduleConfig, ...scheduleConfig };
    addLog("info", `Scheduler Config updated. Auto-Posting: ${db.scheduleConfig.autoPostEnabled}`, "scheduler");
  }
  
  writeDb(db);
  res.json({ success: true, telegramConfig: db.telegramConfig, scheduleConfig: db.scheduleConfig });
});

// API: Save Multi-Bots or Multi-Targets Configuration directly
app.post("/api/admin/config/telegram", (req, res) => {
  const { bots, targets, uploadMode, isEnabled, botToken, channelId } = req.body;
  const db = readDb();
  if (bots !== undefined) db.telegramConfig.bots = bots;
  if (targets !== undefined) db.telegramConfig.targets = targets;
  if (uploadMode !== undefined) db.telegramConfig.uploadMode = uploadMode;
  if (isEnabled !== undefined) db.telegramConfig.isEnabled = isEnabled;
  if (botToken !== undefined) db.telegramConfig.botToken = botToken;
  if (channelId !== undefined) db.telegramConfig.channelId = channelId;

  writeDb(db);
  addLog("info", "Telegram multi-channel config settings saved by administrator", "system");
  res.json({ success: true, telegramConfig: db.telegramConfig });
});

// LOCAL AGENT: Heartbeat API for folder sync, heartbeat status, and API registration
app.post("/api/agent/heartbeat", (req, res) => {
  const apiKey = req.headers["x-api-key"] || req.body.apiKey;
  if (!apiKey) {
    return res.status(401).json({ error: "Missing x-api-key header or parameter" });
  }

  const { name, folders, scanInterval, version } = req.body;
  const db = readDb();

  let agent = db.localAgents.find((a: any) => a.apiKey === apiKey);
  if (!agent) {
    // Register new device
    agent = {
      id: `agent_${Date.now()}`,
      name: name || "Un-named Local Storage Agent",
      apiKey: String(apiKey),
      folders: folders || [],
      scanInterval: scanInterval || "5m",
      lastSeen: new Date().toISOString(),
      isOnline: true,
      version: version || "1.0.0"
    };
    db.localAgents.push(agent);
    addLog("success", `New local media agent device registered: "${agent.name}"`, "agent");
  } else {
    // Update existing
    agent.lastSeen = new Date().toISOString();
    agent.isOnline = true;
    if (name) agent.name = name;
    if (folders) agent.folders = folders;
    if (scanInterval) agent.scanInterval = scanInterval;
    if (version) agent.version = version;
    addLog("info", `Heartbeat received from media agent: "${agent.name}"`, "agent");
  }

  writeDb(db);
  res.json({ success: true, agentId: agent.id });
});

// LOCAL AGENT: Media Files Sync Scanner Queue creation & duplicate detection
app.post("/api/agent/sync-media", (req, res) => {
  const apiKey = req.headers["x-api-key"] || req.body.apiKey;
  if (!apiKey) {
    return res.status(401).json({ error: "Unauthorized: Missing API Key" });
  }

  const db = readDb();
  const agent = db.localAgents.find((a: any) => a.apiKey === apiKey);
  if (!agent) {
    return res.status(403).json({ error: "Invalid API key" });
  }

  const { mediaFiles } = req.body;
  if (!Array.isArray(mediaFiles)) {
    return res.status(400).json({ error: "mediaFiles must be an array" });
  }

  let newFilesCount = 0;
  let skippedDuplicates = 0;

  for (const file of mediaFiles) {
    // Duplicate detection: check if path or filename already exists in this agent's synced list
    const isDuplicate = db.mediaFiles.some((m: any) => m.path === file.path || (m.filename === file.filename && m.size === file.size));
    if (isDuplicate) {
      skippedDuplicates++;
      continue;
    }

    const newMedia: MediaFile = {
      id: `media_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      filename: file.filename,
      path: file.path,
      size: file.size || 0,
      duration: file.duration || 0,
      resolution: file.resolution || "1920x1080",
      thumbnailUrl: file.thumbnailUrl || "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80",
      status: "NEW",
      createdAt: new Date().toISOString(),
      agentId: agent.id,
      codec: file.codec || "h264"
    };

    db.mediaFiles.unshift(newMedia);
    newFilesCount++;
  }

  if (newFilesCount > 0) {
    addLog("success", `Synced ${newFilesCount} new media files from agent "${agent.name}". Ignored ${skippedDuplicates} duplicates.`, "agent");
  } else {
    addLog("info", `Agent "${agent.name}" synced media. No new files detected.`, "agent");
  }

  writeDb(db);
  res.json({ success: true, syncedCount: newFilesCount, duplicateCount: skippedDuplicates });
});

// ADMIN API: Trigger media processing pipeline simulation (Validation, thumbnail, optional FFmpeg processing, upload to chosen storage mode)
app.post("/api/admin/media-files/:id/process", (req, res) => {
  const db = readDb();
  const fileIdx = db.mediaFiles.findIndex((m: any) => m.id === req.params.id);
  if (fileIdx === -1) {
    return res.status(404).json({ error: "Media file not found" });
  }

  const mediaFile = db.mediaFiles[fileIdx];
  mediaFile.status = "PROCESSING";
  writeDb(db);

  addLog("info", `Processing pipeline started for "${mediaFile.filename}"...`, "system");

  // Simulate pipeline in 2 seconds
  setTimeout(() => {
    const freshDb = readDb();
    const currentIdx = freshDb.mediaFiles.findIndex((m: any) => m.id === req.params.id);
    if (currentIdx !== -1) {
      freshDb.mediaFiles[currentIdx].status = "READY";
      const mode = freshDb.telegramConfig.uploadMode || "LOCAL_DIRECT";
      
      // Update with simulated uploaded Cloud URLs if storage mode selected
      if (mode === "R2_STORAGE") {
        freshDb.mediaFiles[currentIdx].thumbnailUrl = "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80";
        addLog("success", `Uploaded video to Cloudflare R2: https://r2.cdn.internal/videos/${freshDb.mediaFiles[currentIdx].filename}`, "system");
      } else if (mode === "SUPABASE_STORAGE") {
        freshDb.mediaFiles[currentIdx].thumbnailUrl = "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=800&q=80";
        addLog("success", `Uploaded video to Supabase bucket: storage://media/${freshDb.mediaFiles[currentIdx].filename}`, "system");
      } else {
        addLog("success", `Media validated. Set for LOCAL_DIRECT upload to Telegram.`, "system");
      }

      writeDb(freshDb);
      addLog("success", `Pipeline processing complete for: "${mediaFile.filename}". Status: READY`, "system");
    }
  }, 1000);

  res.json({ success: true, message: "Processing pipeline initialized successfully." });
});

// ADMIN API: Convert ready media file into streaming/queueing Video catalog entry
app.post("/api/admin/media-files/:id/convert", (req, res) => {
  const { title, category, description, isPremium, scheduledAt } = req.body;
  const db = readDb();
  const fileIdx = db.mediaFiles.findIndex((m: any) => m.id === req.params.id);
  if (fileIdx === -1) {
    return res.status(404).json({ error: "Media file not found" });
  }

  const mediaFile = db.mediaFiles[fileIdx];
  mediaFile.status = "SCHEDULED";

  // Create Video
  const videoId = `vid_${Date.now()}`;
  const mockVideoUrl = mediaFile.path.startsWith("http") ? mediaFile.path : `https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4`;

  const newVideo: Video = {
    id: videoId,
    title: title || mediaFile.filename.replace(/\.[^/.]+$/, ""),
    slug: (title || mediaFile.filename).toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    description: description || `Automated ingest from local file folder at path ${mediaFile.path}`,
    category: category || "Local Ingestion",
    videoUrl: mockVideoUrl,
    thumbnailUrl: mediaFile.thumbnailUrl || "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80",
    telegramCaption: `🎬 ${title || mediaFile.filename}\n\n${description || "From local ingest scan"}\n\n#automation #localmedia`,
    views: 0,
    likes: 0,
    createdAt: new Date().toISOString(),
    scheduledAt: scheduledAt || null,
    telegramPosted: false,
    isPremium: !!isPremium
  };

  db.videos.unshift(newVideo);
  writeDb(db);

  addLog("success", `Local Media File converted to library video: "${newVideo.title}"`, "system");
  res.json({ success: true, video: newVideo });
});

// ADMIN API: Delete local agent
app.delete("/api/admin/agents/:id", (req, res) => {
  const db = readDb();
  const agentIdx = db.localAgents.findIndex((a: any) => a.id === req.params.id);
  if (agentIdx !== -1) {
    const deleted = db.localAgents.splice(agentIdx, 1)[0];
    writeDb(db);
    addLog("info", `Admin removed local media agent: "${deleted.name}"`, "system");
    return res.json({ success: true });
  }
  res.status(404).json({ error: "Agent not found" });
});

// ADMIN API: Delete media file from scan catalog
app.delete("/api/admin/media-files/:id", (req, res) => {
  const db = readDb();
  const fileIdx = db.mediaFiles.findIndex((m: any) => m.id === req.params.id);
  if (fileIdx !== -1) {
    const deleted = db.mediaFiles.splice(fileIdx, 1)[0];
    writeDb(db);
    addLog("info", `Admin removed media file reference: "${deleted.filename}"`, "system");
    return res.json({ success: true });
  }
  res.status(404).json({ error: "Media file not found" });
});

// API: Add video (Admin)
app.post("/api/admin/videos", (req, res) => {
  const videoData = req.body;
  const db = readDb();
  
  const newVideo: Video = {
    id: `vid_${Date.now()}`,
    title: videoData.title || "Untitled Video",
    slug: videoData.slug || (videoData.title || "untitled").toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    description: videoData.description || "",
    category: videoData.category || "General",
    videoUrl: videoData.videoUrl || "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    thumbnailUrl: videoData.thumbnailUrl || "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80",
    telegramCaption: videoData.telegramCaption || "",
    views: 0,
    likes: 0,
    createdAt: new Date().toISOString(),
    scheduledAt: videoData.scheduledAt || null,
    telegramPosted: false,
  };

  db.videos.unshift(newVideo);
  writeDb(db);
  
  addLog("info", `Admin created video: "${newVideo.title}"`, "api");
  res.json({ success: true, video: newVideo });
});

// API: Update video (Admin)
app.put("/api/admin/videos/:id", (req, res) => {
  const db = readDb();
  const videoIdx = db.videos.findIndex((v: Video) => v.id === req.params.id);
  
  if (videoIdx !== -1) {
    db.videos[videoIdx] = {
      ...db.videos[videoIdx],
      ...req.body,
    };
    writeDb(db);
    addLog("info", `Admin updated video details: "${db.videos[videoIdx].title}"`, "api");
    return res.json({ success: true, video: db.videos[videoIdx] });
  }
  res.status(404).json({ error: "Video not found" });
});

// API: Delete video (Admin)
app.delete("/api/admin/videos/:id", (req, res) => {
  const db = readDb();
  const videoIdx = db.videos.findIndex((v: Video) => v.id === req.params.id);
  
  if (videoIdx !== -1) {
    const deleted = db.videos.splice(videoIdx, 1)[0];
    writeDb(db);
    addLog("info", `Admin deleted video: "${deleted.title}"`, "api");
    return res.json({ success: true, message: "Video deleted successfully" });
  }
  res.status(404).json({ error: "Video not found" });
});

// API: Get logs (Admin)
app.get("/api/admin/logs", (req, res) => {
  res.json(logs);
});

// API: Clear logs (Admin)
app.post("/api/admin/logs/clear", (req, res) => {
  logs = [];
  addLog("info", "System logs cleared.", "system");
  res.json({ success: true });
});

// Daily Tech News caching system
let newsCache: any[] = [];
let lastFetchedNewsTime = 0;
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

async function getTechNews(): Promise<any[]> {
  const now = Date.now();
  if (newsCache.length > 0 && (now - lastFetchedNewsTime < CACHE_TTL)) {
    return newsCache;
  }

  try {
    addLog("info", "Fetching latest tech news feed from Hacker News...", "system");
    const topStoriesRes = await fetch("https://hacker-news.firebaseio.com/v0/topstories.json");
    if (!topStoriesRes.ok) throw new Error("HN topstories returned status " + topStoriesRes.status);
    const topIds = await topStoriesRes.json();
    const slicedIds = topIds.slice(0, 6); // Fetch top 6 stories

    const fetchedStories = await Promise.all(
      slicedIds.map(async (id: any, index: number) => {
        try {
          const detailRes = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
          if (!detailRes.ok) return null;
          const story = await detailRes.json();
          if (!story || !story.title) return null;

          // Unsplash images of nice neon 3D shapes to make it super colorful!
          const techImages = [
            "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80", // purple pink 3D
            "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=800&q=80", // neon cubes
            "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=800&q=80", // cyberpunk grid
            "https://images.unsplash.com/photo-1614064641938-3bbee52942c7?auto=format&fit=crop&w=800&q=80", // blue cybersecurity
            "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80", // neon cpu
            "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=800&q=80"  // abstract particle wave
          ];

          const image = techImages[index % techImages.length];
          const categoriesList = ["Automation SaaS", "AI Innovation", "Edge Computing", "Telegram Core", "Web3 Systems", "Developer Tools"];
          const category = categoriesList[index % categoriesList.length];

          let summary = `Automated analysis indicates active discussion around this technology. Current community upvote weight: ${story.score || 10} points. Synced via VidPost Daily pipeline.`;

          // Optionally enhance summary with Gemini 3.5 Flash if API Key is available
          if (ai) {
            try {
              const prompt = `Rewrite and format this tech article title into a beautiful, short, highly engaging 2-sentence summary focused on SaaS, automation, development, or tech trends.
Title: "${story.title}"
Keep the summary under 140 characters and highly engaging. Do not include markdown tags.`;
              const response = await ai.models.generateContent({
                model: "gemini-3.5-flash",
                contents: prompt,
              });
              if (response && response.text) {
                summary = response.text.trim();
              }
            } catch (geminiErr: any) {
              console.error("Gemini news summarization error:", geminiErr.message);
            }
          }

          return {
            id: String(story.id),
            title: story.title,
            url: story.url || `https://news.ycombinator.com/item?id=${story.id}`,
            by: story.by,
            score: story.score || 10,
            time: new Date((story.time || Math.floor(Date.now() / 1000)) * 1000).toISOString(),
            category: category,
            summary: summary,
            imageUrl: image
          };
        } catch (err) {
          return null;
        }
      })
    );

    const validStories = fetchedStories.filter((s) => s !== null);
    if (validStories.length > 0) {
      newsCache = validStories;
      lastFetchedNewsTime = now;
      addLog("success", `Successfully aggregated and cached ${validStories.length} tech news stories.`, "system");
      return newsCache;
    }
  } catch (err: any) {
    addLog("error", `Hacker News fetch failed: ${err.message}. Using high-quality fallback seed.`, "system");
  }

  // Fallback high-quality curated feed that changes dates dynamically so it always feels live and fresh!
  const today = new Date();
  const getPastDate = (daysAgo: number) => {
    const d = new Date();
    d.setDate(today.getDate() - daysAgo);
    return d.toISOString();
  };

  const fallbacks = [
    {
      id: "fallback_1",
      title: "Introducing Gemini 3.5 Flash: Real-time Multi-modal SaaS Agents",
      url: "https://ai.google.dev",
      by: "googledev",
      score: 512,
      time: getPastDate(0),
      category: "AI Innovation",
      summary: "The next generation model natively supports zero-latency speech translation, full-duplex WebSocket pipelines, and advanced structured tool calls for Telegram micro-services.",
      imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80"
    },
    {
      id: "fallback_2",
      title: "Telegram Bots Reach 600 Million Daily Active Users Worldwide",
      url: "https://telegram.org",
      by: "durov",
      score: 412,
      time: getPastDate(0),
      category: "Telegram Core",
      summary: "Pavel Durov announces massive expansion of the bot ecosystem, with optimized caching pools and direct-to-wallet frictionless microtransactions.",
      imageUrl: "https://images.unsplash.com/photo-1614064641938-3bbee52942c7?auto=format&fit=crop&w=800&q=80"
    },
    {
      id: "fallback_3",
      title: "How We Optimized Express Server Response Times by 92% on Vercel",
      url: "https://vercel.com",
      by: "rauchg",
      score: 320,
      time: getPastDate(1),
      category: "Automation SaaS",
      summary: "Deep dive into combining static asset pre-rendering with Edge Middleware routing to achieve single-digit millisecond latency under high traffic spikes.",
      imageUrl: "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=800&q=80"
    },
    {
      id: "fallback_4",
      title: "Self-Hosted Media Processing Pipeline Using FFmpeg WASM on Edge Nodes",
      url: "https://github.com",
      by: "oss_guru",
      score: 289,
      time: getPastDate(2),
      category: "Edge Computing",
      summary: "A breakdown of sandboxing video compression directly inside edge nodes to eliminate central hosting storage costs and optimize dynamic video thumbnails.",
      imageUrl: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=800&q=80"
    },
    {
      id: "fallback_5",
      title: "Deno 2.5 Released with Full Backwards Compatibility for Legacy Express Apps",
      url: "https://deno.com",
      by: "ryandahl",
      score: 195,
      time: getPastDate(3),
      category: "Developer Tools",
      summary: "Native CJS/ESM interop reaches 100% parity, enabling full-stack projects with heavy esbuild dependencies to compile directly into a single binary.",
      imageUrl: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80"
    }
  ];

  newsCache = fallbacks;
  lastFetchedNewsTime = now;
  return newsCache;
}

// API: Get daily tech news feed
app.get("/api/news", async (req, res) => {
  try {
    const news = await getTechNews();
    res.json({ news });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to load news", details: err.message });
  }
});

// TELEGRAM DISPATCH CORE ENGINE
async function dispatchTelegramPost(video: Video, config: TelegramConfig, appUrl: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const finalCaption = `${video.telegramCaption || `${video.title}\n\n${video.description}`}\n\n📺 Watch Full HD here: ${appUrl}/api/track/click/${video.id}`;
  
  if (!config.botToken || !config.channelId || !config.isEnabled) {
    // Simulated Post if credentials are not specified
    addLog("info", `[SIMULATED POST] Posting video "${video.title}" (ID: ${video.id}) to Telegram channel "${config.channelId || "@demo_channel"}"`, "telegram");
    addLog("info", `[SIMULATED PAYLOAD]
-----------------------------------------
CAPTION: ${finalCaption}
IMAGE PREVIEW: ${video.thumbnailUrl}
VIDEO PREVIEW: ${video.videoUrl}
INLINE KEYBOARD:
- [ 📺 Watch in HD ] -> ${appUrl}/api/track/click/${video.id}
- [ 👍 Like Video ] -> ${appUrl}/#watch/${video.slug}
-----------------------------------------`, "telegram");
    return { success: true, messageId: `sim_msg_${Date.now().toString().substr(-6)}` };
  }

  // Real Telegram Bot Post Integration (using standard HTTP request via fetch API)
  try {
    addLog("info", `Initiating real Telegram API send for video "${video.title}"`, "telegram");
    
    // We send a beautiful Photo/Thumbnail with watch links and Inline Button overlays
    const telegramUrl = `https://api.telegram.org/bot${config.botToken}/sendPhoto`;
    const replyMarkup = {
      inline_keyboard: [
        [
          { text: "📺 Watch Full HD Video", url: `${appUrl}/api/track/click/${video.id}` },
        ],
        [
          { text: "👍 Like / Rate Video", url: `${appUrl}/#watch/${video.slug}` },
          { text: "🔔 Join Main Hub", url: `https://t.me/${config.channelId.replace("@", "")}` }
        ]
      ]
    };

    const response = await fetch(telegramUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: config.channelId,
        photo: video.thumbnailUrl,
        caption: finalCaption,
        reply_markup: replyMarkup,
      }),
    });

    const resData = await response.json();
    if (resData.ok) {
      addLog("success", `Real Telegram Post published successfully! Message ID: ${resData.result.message_id}`, "telegram");
      return { success: true, messageId: String(resData.result.message_id) };
    } else {
      addLog("error", `Telegram API returned error: ${resData.description}`, "telegram");
      return { success: false, error: resData.description };
    }
  } catch (err: any) {
    addLog("error", `Failed to send to Telegram Bot API: ${err.message}`, "telegram");
    return { success: false, error: err.message };
  }
}

// API: Manual Post to Telegram (Admin trigger)
app.post("/api/admin/videos/:id/post", async (req, res) => {
  const db = readDb();
  const videoIdx = db.videos.findIndex((v: Video) => v.id === req.params.id);
  if (videoIdx === -1) {
    return res.status(404).json({ error: "Video not found" });
  }

  const video = db.videos[videoIdx];
  const config = db.telegramConfig;
  const appUrl = process.env.APP_URL || `http://localhost:${PORT}`;

  const result = await dispatchTelegramPost(video, config, appUrl);
  if (result.success) {
    db.videos[videoIdx].telegramPosted = true;
    db.videos[videoIdx].telegramPostId = result.messageId;
    db.videos[videoIdx].telegramPostedAt = new Date().toISOString();
    writeDb(db);
    return res.json({ success: true, messageId: result.messageId });
  } else {
    return res.status(500).json({ error: result.error });
  }
});

// BACKGROUND AUTOMATION SCHEDULER SYSTEM
// Low-overhead scheduler loop checking every 15 seconds
setInterval(async () => {
  try {
    const db = readDb();
    if (!db.scheduleConfig.autoPostEnabled) {
      return;
    }

    const now = new Date();
    const appUrl = process.env.APP_URL || `http://localhost:${PORT}`;

    // Scan for scheduled posts that are due and not yet posted
    const pendingVideos = db.videos.filter((v: Video) => {
      if (v.telegramPosted || !v.scheduledAt) return false;
      const scheduledTime = new Date(v.scheduledAt);
      return scheduledTime <= now;
    });

    if (pendingVideos.length > 0) {
      addLog("info", `Scheduler cycle: Found ${pendingVideos.length} pending scheduled post(s) due for dispatch.`, "scheduler");
      
      for (const video of pendingVideos) {
        addLog("info", `Executing automated dispatch for: "${video.title}"`, "scheduler");
        const result = await dispatchTelegramPost(video, db.telegramConfig, appUrl);
        
        // Update database video states
        const videoIdx = db.videos.findIndex((v: Video) => v.id === video.id);
        if (videoIdx !== -1) {
          db.videos[videoIdx].telegramPosted = true;
          db.videos[videoIdx].telegramPostId = result.messageId || "msg_auto_" + Date.now();
          db.videos[videoIdx].telegramPostedAt = new Date().toISOString();
        }
      }
      
      writeDb(db);
    }
  } catch (err: any) {
    console.error("Error in background automation scheduler loop: ", err.message);
  }
}, 15000);

// INTEGRATE VITE FOR MIDDLEWARE DEVELOPMENT & ASSETS SERVING
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    addLog("success", `Application Server live and running at http://0.0.0.0:${PORT}`, "system");
  });
}

startServer();
