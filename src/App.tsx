import React, { useState, useEffect } from "react";
import { LayoutDashboard, LogOut, Play, Send, Calendar, Terminal, ShieldAlert, Sliders, PlayCircle, Eye, Heart, ArrowLeft, RefreshCw, Youtube, Compass, FolderDown, HardDrive, Cpu, BookOpen } from "lucide-react";
import { Video, TelegramConfig, ScheduleConfig, Analytics, LogEntry, MediaFile, LocalAgent } from "./types";

// Modular Sub-Components Imports
import PublicHeader from "./components/PublicHeader";
import VideoCard from "./components/VideoCard";
import VideoPlayer from "./components/VideoPlayer";
import AdminOverview from "./components/AdminOverview";
import AdminVideoManager from "./components/AdminVideoManager";
import AdminTelegramBot from "./components/AdminTelegramBot";
import AdminScheduler from "./components/AdminScheduler";
import AdminLogs from "./components/AdminLogs";
import AdminMediaIngestion from "./components/AdminMediaIngestion";
import AdminStorageSettings from "./components/AdminStorageSettings";
import AdminAutomationDeployment from "./components/AdminAutomationDeployment";
import DailyNewsFeed from "./components/DailyNewsFeed";

type RouteView =
  | { type: "home" }
  | { type: "watch"; slug: string }
  | { type: "trending" }
  | { type: "latest" }
  | { type: "categories"; category: string }
  | { type: "search"; query: string }
  | { type: "admin"; tab: string };

export default function App() {
  const [view, setView] = useState<RouteView>({ type: "home" });
  const [loading, setLoading] = useState(true);

  // Database States
  const [videos, setVideos] = useState<Video[]>([]);
  const [telegramConfig, setTelegramConfig] = useState<TelegramConfig>({
    botToken: "",
    channelId: "",
    botName: "",
    isEnabled: false,
    bots: [],
    targets: [],
    uploadMode: "LOCAL_DIRECT"
  });
  const [scheduleConfig, setScheduleConfig] = useState<ScheduleConfig>({
    postingIntervalHours: 6,
    autoPostEnabled: true,
    preferredPostTimes: [],
  });
  const [analytics, setAnalytics] = useState<Analytics>({
    totalViews: 0,
    totalLikes: 0,
    telegramClicks: 0,
    channelClicks: 0,
    dailyMetrics: [],
    clicksByVideo: {},
    publishedCount: 0,
    failedCount: 0,
  });
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [localAgents, setLocalAgents] = useState<LocalAgent[]>([]);

  // Local Client Filtering
  const [searchQuery, setSearchQuery] = useState("");

  // 1. URL Hash routing sync
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash || "#home";
      if (hash.startsWith("#watch/")) {
        const slug = hash.replace("#watch/", "");
        setView({ type: "watch", slug });
      } else if (hash === "#trending") {
        setView({ type: "trending" });
      } else if (hash === "#latest") {
        setView({ type: "latest" });
      } else if (hash.startsWith("#categories/")) {
        const cat = decodeURIComponent(hash.replace("#categories/", ""));
        setView({ type: "categories", category: cat });
      } else if (hash.startsWith("#search/")) {
        const q = decodeURIComponent(hash.replace("#search/", ""));
        setView({ type: "search", query: q });
      } else if (hash.startsWith("#admin")) {
        const tab = hash.split("/")[1] || "overview";
        setView({ type: "admin", tab });
      } else {
        setView({ type: "home" });
      }
    };

    window.addEventListener("hashchange", handleHashChange);
    handleHashChange(); // trigger initial route
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  // 2. Initial Data Loading (Loads both public and admin datasets)
  const fetchAllData = async () => {
    try {
      const res = await fetch("/api/admin/dashboard");
      if (res.ok) {
        const data = await res.json();
        setVideos(data.videos);
        setTelegramConfig(data.telegramConfig);
        setScheduleConfig(data.scheduleConfig);
        setAnalytics(data.analytics);
        setMediaFiles(data.mediaFiles || []);
        setLocalAgents(data.localAgents || []);
      }
    } catch (err) {
      console.error("Dashboard pull failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // 3. Dynamic Operations & Mutation proxings
  const handleNavigate = (hash: string) => {
    window.location.hash = hash;
  };

  const handleAddVideo = async (videoData: Partial<Video>) => {
    try {
      const res = await fetch("/api/admin/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(videoData),
      });
      if (res.ok) {
        fetchAllData();
      }
    } catch (err) {
      console.error("Add video failed:", err);
    }
  };

  const handleUpdateVideo = async (id: string, updates: Partial<Video>) => {
    try {
      const res = await fetch(`/api/admin/videos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        fetchAllData();
      }
    } catch (err) {
      console.error("Update video failed:", err);
    }
  };

  const handleDeleteVideo = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/videos/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchAllData();
      }
    } catch (err) {
      console.error("Delete video failed:", err);
    }
  };

  const handleSaveConfigs = async (updates: { telegramConfig?: Partial<TelegramConfig>; scheduleConfig?: Partial<ScheduleConfig> }) => {
    try {
      const res = await fetch("/api/admin/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        fetchAllData();
      }
    } catch (err) {
      console.error("Save config failed:", err);
    }
  };

  const handleManualPost = async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/admin/videos/${id}/post`, { method: "POST" });
      if (res.ok) {
        fetchAllData();
        return true;
      }
      return false;
    } catch (err) {
      console.error("Manual publish failed:", err);
      return false;
    }
  };

  const handleLikeVideo = async (id: string) => {
    try {
      const res = await fetch(`/api/videos/${id}/like`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        // Optimistic update
        setVideos((prev) =>
          prev.map((v) => (v.id === id ? { ...v, likes: data.likes } : v))
        );
      }
    } catch (err) {
      console.error("Liking failed:", err);
    }
  };

  const handleRefreshLogs = async () => {
    try {
      const res = await fetch("/api/admin/logs");
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (err) {
      console.error("Logs refresh failed:", err);
    }
  };

  const handleClearLogs = async () => {
    try {
      const res = await fetch("/api/admin/logs/clear", { method: "POST" });
      if (res.ok) {
        setLogs([]);
      }
    } catch (err) {
      console.error("Clear logs failed:", err);
    }
  };

  // Channel Click Analytics conversion proxy
  const handleChannelClick = async () => {
    try {
      await fetch("/api/track/channel-click", { method: "POST" });
      fetchAllData();
    } catch (err) {
      console.error("Channel click log fail:", err);
    }
  };

  // Client Filtering Video Catalogs
  const filteredVideos = videos.filter((video) => {
    const matchesSearch =
      video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      video.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (view.type === "trending") {
      return matchesSearch && video.views > 200;
    }
    if (view.type === "latest") {
      return matchesSearch; // Already sorted by default backend
    }
    if (view.type === "categories") {
      return matchesSearch && video.category === view.category;
    }
    if (view.type === "search") {
      const matchesSearchRoute =
        video.title.toLowerCase().includes(view.query.toLowerCase()) ||
        video.description.toLowerCase().includes(view.query.toLowerCase());
      return matchesSearchRoute;
    }
    return matchesSearch;
  });

  const featuredVideo = videos.length > 0 ? videos[0] : null;

  // Render Loader
  if (loading) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-stone-950 space-y-5">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-red-600 via-amber-500 to-yellow-400 text-black shadow-[0_0_30px_rgba(239,68,68,0.3)] animate-bounce relative">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-red-600 to-yellow-400 animate-ping opacity-40"></div>
          <Play className="h-6 w-6 fill-black translate-x-px relative z-10" />
        </div>
        <div className="flex items-center space-x-2.5 text-xs font-black uppercase tracking-widest text-yellow-400 font-sans">
          <RefreshCw className="h-4 w-4 animate-spin text-red-500" />
          <span>Starting SaaS Stream Platform...</span>
        </div>
      </div>
    );
  }

  // RENDER INTERFACE CASE 1: ADMINISTRATIVE CONSOLE DASHBOARD
  if (view.type === "admin") {
    const currentTab = view.tab;

    const sidebarTabs = [
      { id: "overview", label: "Analytics Hub", icon: <LayoutDashboard className="h-4 w-4" /> },
      { id: "ingestion", label: "Media Ingestion", icon: <FolderDown className="h-4 w-4" /> },
      { id: "videos", label: "Video Library", icon: <PlayCircle className="h-4 w-4" /> },
      { id: "storage", label: "Storage & Targets", icon: <HardDrive className="h-4 w-4" /> },
      { id: "bot", label: "Telegram Bot", icon: <Send className="h-4 w-4" /> },
      { id: "scheduler", label: "Auto Scheduler", icon: <Calendar className="h-4 w-4" /> },
      { id: "workflows", label: "Workflows & Guides", icon: <Cpu className="h-4 w-4" /> },
      { id: "logs", label: "System Logs", icon: <Terminal className="h-4 w-4" /> },
    ];

    return (
      <div className="flex h-screen w-screen overflow-hidden bg-stone-900 font-sans" id="admin_root_wrapper">
        
        {/* Left Side Navigation Sidebar */}
        <aside className="w-64 border-r border-stone-850 bg-stone-950 flex flex-col flex-shrink-0" id="admin_sidebar">
          {/* Brand header */}
          <div className="p-6 border-b border-stone-900 flex items-center justify-between">
            <div className="flex items-center space-x-2.5 cursor-pointer animate-fade-in" onClick={() => handleNavigate("#home")}>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-red-600 via-amber-500 to-yellow-400 text-black shadow-lg shadow-red-500/20 animate-electro">
                <Send className="h-4.5 w-4.5 fill-black text-black" />
              </div>
              <div>
                <span className="font-sans font-black text-base text-white tracking-tight flex items-center">
                  Vid<span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-yellow-400">Post</span>
                </span>
                <span className="block text-[9px] font-extrabold text-red-500 uppercase tracking-widest -mt-1">Admin Panel</span>
              </div>
            </div>
          </div>

          {/* Nav Tabs list */}
          <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
            {sidebarTabs.map((tab) => {
              const isSelected = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleNavigate(`#admin/${tab.id}`)}
                  className={`w-full flex items-center space-x-3 rounded-xl px-4 py-3 text-xs font-black tracking-wide transition-all duration-300 ${
                    isSelected
                      ? "bg-gradient-to-r from-red-600 via-amber-500 to-yellow-500 text-black shadow-lg shadow-red-500/10 scale-102"
                      : "text-stone-300 hover:bg-stone-900 hover:text-white"
                  }`}
                >
                  <span className={isSelected ? "text-black" : "text-red-500 animate-pulse"}>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-stone-900">
            <button
              onClick={() => handleNavigate("#home")}
              className="w-full flex items-center space-x-3 rounded-xl px-4 py-3 text-xs font-bold text-stone-400 hover:bg-stone-900 hover:text-stone-200 transition-colors"
            >
              <LogOut className="h-4 w-4 text-red-500" />
              <span>Exit Console</span>
            </button>
          </div>
        </aside>

        {/* Right Main Working Canvas */}
        <main className="flex-1 flex flex-col overflow-hidden bg-stone-900 text-white">
          {/* Top Panel bar */}
          <header className="h-16 border-b border-stone-850 bg-stone-950 px-6 sm:px-8 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Dashboard</span>
              <span className="text-stone-700">/</span>
              <span className="text-xs font-black text-yellow-400 uppercase tracking-wider font-mono">
                {currentTab.replace("-", " ")}
              </span>
            </div>

            {/* Quick status banner */}
            <div className="flex items-center space-x-3">
              <span className="flex items-center space-x-1.5 text-xs font-extrabold text-yellow-400 bg-yellow-950/60 px-2.5 py-1 rounded-full border border-yellow-500/20">
                <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                <span>Scheduler Daemon Live</span>
              </span>
              <a
                href="/"
                className="text-xs font-bold text-stone-300 hover:text-white border border-stone-800 rounded-xl px-3.5 py-1.5 bg-stone-900 shadow-sm hover:bg-stone-850 transition-colors"
              >
                Launch Public Site
              </a>
            </div>
          </header>

          {/* Subview Canvas Content scroll */}
          <div className="flex-1 overflow-y-auto p-6 sm:p-8">
            {currentTab === "overview" && (
              <AdminOverview analytics={analytics} videos={videos} />
            )}
            {currentTab === "ingestion" && (
              <AdminMediaIngestion
                mediaFiles={mediaFiles}
                localAgents={localAgents}
                onRefresh={fetchAllData}
              />
            )}
            {currentTab === "videos" && (
              <AdminVideoManager
                videos={videos}
                onAddVideo={handleAddVideo}
                onUpdateVideo={handleUpdateVideo}
                onDeleteVideo={handleDeleteVideo}
                onManualPost={handleManualPost}
              />
            )}
            {currentTab === "storage" && (
              <AdminStorageSettings
                config={telegramConfig}
                onSaveConfig={handleSaveConfigs}
                onRefresh={fetchAllData}
              />
            )}
            {currentTab === "bot" && (
              <AdminTelegramBot config={telegramConfig} onSaveConfig={handleSaveConfigs} />
            )}
            {currentTab === "scheduler" && (
              <AdminScheduler
                config={scheduleConfig}
                videos={videos}
                onSaveConfig={handleSaveConfigs}
                onUpdateVideo={handleUpdateVideo}
              />
            )}
            {currentTab === "workflows" && (
              <AdminAutomationDeployment />
            )}
            {currentTab === "logs" && (
              <AdminLogs logs={logs} onRefreshLogs={handleRefreshLogs} onClearLogs={handleClearLogs} />
            )}
          </div>
        </main>
      </div>
    );
  }

  // RENDER INTERFACE CASE 2: PUBLIC VIDEO WEBSITE
  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans selection:bg-red-500 selection:text-white" id="public_root_wrapper">
      <PublicHeader
        currentCategory={view.type === "categories" ? view.category : undefined}
        onNavigate={handleNavigate}
        onSearch={setSearchQuery}
      />

      <main className="flex-grow">
        {/* VIEW: Playback Watching Stage */}
        {view.type === "watch" ? (
          (() => {
            const currentVideo = videos.find((v) => v.slug === view.slug);
            if (!currentVideo) {
              return (
                <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 text-center space-y-4">
                  <ShieldAlert className="mx-auto h-12 w-12 text-red-500 animate-bounce" />
                  <h2 className="text-xl font-bold text-white">404 Video Stream Not Found</h2>
                  <p className="text-stone-400 text-sm">The video slug requested is invalid or has been retracted.</p>
                  <button
                    onClick={() => handleNavigate("#home")}
                    className="inline-flex items-center space-x-1 rounded-xl bg-gradient-to-r from-red-600 to-yellow-500 px-4 py-2 text-xs font-black text-black hover:brightness-110"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Return to Catalog</span>
                  </button>
                </div>
              );
            }

            // Related Videos same category or trending
            const related = videos
              .filter((v) => v.id !== currentVideo.id)
              .slice(0, 4);

            return (
              <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 animate-fade-in">
                <button
                  onClick={() => handleNavigate("#home")}
                  className="mb-6 inline-flex items-center space-x-1.5 text-xs font-bold text-stone-400 hover:text-yellow-400 uppercase tracking-wider"
                >
                  <ArrowLeft className="h-4 w-4 text-red-500" />
                  <span>Return to Feed</span>
                </button>

                <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                  {/* Custom Player + Title synopsis column */}
                  <div className="lg:col-span-2">
                    <VideoPlayer
                      video={currentVideo}
                      onLike={() => handleLikeVideo(currentVideo.id)}
                      onNavigate={handleNavigate}
                    />
                  </div>

                  {/* Related Videos sidebar */}
                  <div className="space-y-4" id="related_videos_sidebar">
                    <h2 className="font-sans font-bold text-white text-base flex items-center space-x-1.5 border-b border-stone-850 pb-2">
                      <Compass className="h-4 w-4 text-red-500 animate-spin-slow" />
                      <span>Recommended for You</span>
                    </h2>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1">
                      {related.length === 0 ? (
                        <p className="text-xs text-stone-500">No other videos in this catalog section.</p>
                      ) : (
                        related.map((video) => (
                          <div
                            key={video.id}
                            onClick={() => handleNavigate(`#watch/${video.slug}`)}
                            className="flex items-start space-x-3 cursor-pointer group rounded-xl p-2 hover:bg-stone-900/50 border border-transparent hover:border-red-500/10 transition-all"
                          >
                            <img src={video.thumbnailUrl} alt="" className="h-14 w-24 rounded object-cover border border-stone-900 flex-shrink-0" referrerPolicy="no-referrer" />
                            <div className="min-w-0">
                              <h3 className="font-semibold text-stone-200 text-xs sm:text-sm line-clamp-1 group-hover:text-yellow-400 transition-colors">
                                {video.title}
                              </h3>
                              <p className="text-[11px] text-red-400 mt-0.5 uppercase font-black">{video.category}</p>
                              <div className="flex items-center space-x-2 text-[10px] text-stone-500 mt-1">
                                <span className="flex items-center space-x-0.5">
                                  <Eye className="h-3 w-3" />
                                  <span>{video.views}</span>
                                </span>
                                <span>•</span>
                                <span>{new Date(video.createdAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Join Channel Call to Action */}
                    <div className="rounded-2xl bg-gradient-to-tr from-stone-900 via-red-950/60 to-stone-950 p-5 text-white shadow-xl border border-red-500/20 relative overflow-hidden" id="channel_cta_banner">
                      <div className="absolute inset-0 bg-gradient-to-br from-red-600/5 to-yellow-500/5 pointer-events-none"></div>
                      <Send className="absolute right-[-15px] bottom-[-15px] h-28 w-28 opacity-10 rotate-[22deg] text-yellow-400" />
                      <h4 className="font-sans font-black text-white text-sm sm:text-base flex items-center space-x-1">
                        <span className="h-2 w-2 rounded-full bg-red-500 animate-ping mr-1"></span>
                        <span>Join Our Automation Hub</span>
                      </h4>
                      <p className="text-xs text-stone-300 font-medium mt-1 leading-relaxed">
                        Get instant video updates directly on your device. Subscribe to the official Telegram channel today.
                      </p>
                      <a
                        href={telegramConfig.channelId ? `https://t.me/${telegramConfig.channelId.replace("@", "")}` : "https://t.me/"}
                        target="_blank"
                        rel="noreferrer"
                        onClick={handleChannelClick}
                        className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-red-600 to-yellow-500 px-4 py-2 text-xs font-black text-black hover:brightness-110 shadow-md transition-all uppercase tracking-wider"
                      >
                        Subscribe Channel
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()
        ) : (
          /* VIEW: Video Catalog grids (Home, Trending, Latest, Categories, Search) */
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-10 animate-fade-in">
            
            {/* Render featured Hero banner if on homepage and have videos */}
            {(view.type === "home" || view.type === "trending" || view.type === "latest") && featuredVideo && (
              <div 
                onClick={() => handleNavigate(`#watch/${featuredVideo.slug}`)}
                className="group relative cursor-pointer overflow-hidden rounded-3xl bg-stone-900 text-white aspect-[21/9] flex items-end shadow-2xl border border-stone-800 shadow-[0_4px_30px_rgba(239,68,68,0.1)]"
                id="featured_hero_stage"
              >
                <img
                  src={featuredVideo.thumbnailUrl}
                  alt=""
                  referrerPolicy="no-referrer"
                  className="absolute inset-0 h-full w-full object-cover opacity-50 transition-transform duration-700 group-hover:scale-101"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/20 to-transparent"></div>
                
                {/* 3D Colorful Tab-based filtering bar positioned top-right inside the hero stage */}
                <div 
                  className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20 flex bg-stone-950/90 backdrop-blur-lg rounded-2xl p-1 border border-stone-800 shadow-2xl scale-90 sm:scale-100" 
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNavigate("#home");
                    }}
                    className={`flex items-center space-x-1 px-3 py-1.5 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                      view.type === "home"
                        ? "bg-gradient-to-r from-red-600 via-amber-500 to-yellow-500 text-black shadow-md shadow-red-500/20"
                        : "text-stone-300 hover:text-white hover:bg-stone-900"
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNavigate("#trending");
                    }}
                    className={`flex items-center space-x-1 px-3 py-1.5 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                      view.type === "trending"
                        ? "bg-gradient-to-r from-red-600 via-amber-500 to-yellow-500 text-black shadow-md shadow-red-500/20"
                        : "text-stone-300 hover:text-white hover:bg-stone-900"
                    }`}
                  >
                    Trending
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNavigate("#latest");
                    }}
                    className={`flex items-center space-x-1 px-3 py-1.5 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                      view.type === "latest"
                        ? "bg-gradient-to-r from-red-600 via-amber-500 to-yellow-500 text-black shadow-md shadow-red-500/20"
                        : "text-stone-300 hover:text-white hover:bg-stone-900"
                    }`}
                  >
                    Recent
                  </button>
                </div>

                {/* Hero information panel */}
                <div className="relative z-10 p-6 sm:p-10 max-w-2xl space-y-3">
                  <span className="inline-flex items-center space-x-1 rounded-full bg-red-600 px-3 py-1 text-[10px] font-black text-white uppercase tracking-widest shadow-sm shadow-red-600/20">
                    <Youtube className="h-3.5 w-3.5 fill-white" />
                    <span>Featured Stream</span>
                  </span>
                  
                  <h2 className="text-2xl font-black tracking-tight md:text-4xl text-white group-hover:text-yellow-400 transition-colors">
                    {featuredVideo.title}
                  </h2>
                  <p className="hidden sm:block text-xs sm:text-sm text-stone-300 leading-relaxed line-clamp-2">
                    {featuredVideo.description}
                  </p>

                  <div className="flex flex-wrap gap-4 pt-2">
                    <button className="inline-flex items-center space-x-1.5 rounded-xl bg-gradient-to-r from-red-600 to-yellow-500 px-4 py-2.5 text-xs font-black text-black hover:brightness-110 shadow-lg">
                      <Play className="h-3.5 w-3.5 fill-black text-black translate-x-px" />
                      <span>Stream Now</span>
                    </button>
                    {featuredVideo.telegramPosted && (
                      <span className="inline-flex items-center space-x-1.5 rounded-xl bg-stone-950/80 border border-red-500/20 px-4 py-2.5 text-xs font-bold text-yellow-400 backdrop-blur-sm">
                        <Send className="h-3.5 w-3.5 fill-red-600 text-red-600" />
                        <span>Posted on Telegram</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Daily News Feed Section */}
            {(view.type === "home" || view.type === "trending" || view.type === "latest") && <DailyNewsFeed />}

            {/* Catalog Section Header */}
            <div>
              <div className="flex items-center justify-between border-b border-stone-900 pb-3 mb-6">
                <div>
                  <h2 className="text-xl font-black tracking-tight text-white md:text-2xl font-sans">
                    {view.type === "home" && "All Stream Catalog"}
                    {view.type === "trending" && "Trending Streams"}
                    {view.type === "latest" && "Latest Catalog Releases"}
                    {view.type === "categories" && `Section: ${view.category}`}
                    {view.type === "search" && `Search Query: "${view.query}"`}
                  </h2>
                  <p className="text-xs text-stone-400 mt-0.5">
                    {view.type === "home" && "Explore our production video library indexed for real-time Telegram distribution"}
                    {view.type === "trending" && "Our highest performing content and hot publications with active telemetry"}
                    {view.type === "latest" && "Our newest assets and recent uploads synchronized to queues"}
                    {view.type === "categories" && `Viewing all contents uploaded in the ${view.category} category`}
                    {view.type === "search" && `Displaying ${filteredVideos.length} assets matched in directory`}
                  </p>
                </div>
                
                {/* Mobile Catalog count badge */}
                <span className="rounded-full bg-stone-900 border border-stone-800 px-3 py-1 text-xs font-black text-yellow-400">
                  {filteredVideos.length} Assets
                </span>
              </div>

              {/* Videos Grid */}
              {filteredVideos.length === 0 ? (
                <div className="rounded-2xl bg-stone-900 border border-dashed border-stone-800 py-20 text-center space-y-3">
                  <PlayCircle className="mx-auto h-12 w-12 text-stone-600 animate-pulse" />
                  <h3 className="font-bold text-stone-300 text-base">No Matching Streams</h3>
                  <p className="text-stone-500 text-xs">Try selecting another filter or searching for alternative terms.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3" id="videos_feed_grid">
                  {filteredVideos.map((video) => (
                    <VideoCard
                      key={video.id}
                      video={video}
                      onClick={() => handleNavigate(`#watch/${video.slug}`)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Public Footer */}
      <footer className="bg-stone-950 border-t border-stone-900 mt-16 py-8" id="public_footer">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-stone-500">
          <div className="flex items-center space-x-2">
            <Send className="h-4 w-4 text-red-500 fill-red-950" />
            <span className="font-extrabold text-stone-300">VidPost SaaS Platform</span>
            <span>• © 2026 All rights reserved</span>
          </div>
          
          {/* Quick link tags */}
          <div className="flex items-center space-x-6">
            <a href="#admin/overview" className="hover:text-yellow-400 transition-colors font-extrabold text-stone-400">Administrative Console</a>
            <span className="text-stone-800">|</span>
            <span className="text-stone-500">Cost-Optimized Static Pipeline v1.4</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
