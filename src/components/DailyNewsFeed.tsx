import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, TrendingUp, Newspaper, Clock, ExternalLink, Cpu, RefreshCw, Send, Radio } from "lucide-react";
import { NewsItem } from "../types";

export default function DailyNewsFeed() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const fetchNews = async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await fetch("/api/news");
      if (res.ok) {
        const data = await res.json();
        setNews(data.news || []);
      }
    } catch (err) {
      console.error("Failed to fetch news feed:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const formatTime = (isoString: string) => {
    try {
      const past = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - past.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      
      if (diffHours < 1) return "Just now";
      if (diffHours < 24) return `${diffHours}h ago`;
      const days = Math.floor(diffHours / 24);
      return `${days}d ago`;
    } catch (e) {
      return "Today";
    }
  };

  return (
    <div className="relative overflow-hidden rounded-3xl bg-stone-950 p-6 sm:p-8 text-white shadow-2xl border border-red-500/20 my-10 shadow-[0_10px_50px_rgba(239,68,68,0.07)]" id="daily_news_container">
      {/* 3D Electro Background Blur Blobs */}
      <div className="absolute -top-20 -left-20 h-72 w-72 rounded-full bg-gradient-to-br from-red-600 to-amber-500 opacity-20 blur-3xl pointer-events-none animate-pulse"></div>
      <div className="absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-gradient-to-br from-yellow-500 to-red-700 opacity-20 blur-3xl pointer-events-none animate-pulse" style={{ animationDelay: "2s" }}></div>

      {/* Section Header */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-stone-850 pb-6 mb-8">
        <div className="space-y-1.5">
          <div className="flex items-center space-x-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-red-500 animate-ping" />
            <span className="text-[10px] font-extrabold tracking-widest text-yellow-400 uppercase flex items-center space-x-1">
              <Radio className="h-3 w-3 animate-pulse" />
              <span>Auto-Publishing Feed Live</span>
            </span>
          </div>
          <h2 className="text-2xl font-black tracking-tight sm:text-3xl font-sans bg-gradient-to-r from-white via-yellow-200 to-red-400 bg-clip-text text-transparent flex items-center gap-2.5">
            <Newspaper className="h-7 w-7 text-red-500" />
            <span>Leading Daily Tech Updates</span>
          </h2>
          <p className="text-xs text-stone-400 leading-relaxed max-w-xl">
            Real-time industry tracking synced with our multi-channel Telegram automation bot list. Enhanced dynamically.
          </p>
        </div>

        <button
          onClick={() => fetchNews(true)}
          disabled={refreshing || loading}
          className="self-start sm:self-center inline-flex items-center space-x-2 rounded-xl bg-stone-900 border border-red-500/30 px-4 py-2.5 text-xs font-black tracking-wide text-white hover:bg-stone-800 hover:border-yellow-400/40 active:scale-95 disabled:opacity-50 transition-all cursor-pointer shadow-lg backdrop-blur-md"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin text-yellow-400" : ""}`} />
          <span>{refreshing ? "Synthesizing..." : "Force Sync Feed"}</span>
        </button>
      </div>

      {/* Grid Canvas */}
      <div className="relative z-10">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-red-600 via-amber-500 to-yellow-400 text-black animate-spin">
              <RefreshCw className="h-5 w-5" />
            </div>
            <p className="text-xs text-yellow-400 font-mono">Curating dynamic developer telemetry...</p>
          </div>
        ) : news.length === 0 ? (
          <div className="rounded-2xl border border-stone-900 bg-stone-900/50 p-12 text-center">
            <p className="text-xs text-stone-500">Daily news synchronization is refreshing. Please click Sync Feed.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {news.map((item, index) => {
              const isHovered = hoveredId === item.id;
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.08 }}
                  onMouseEnter={() => setHoveredId(item.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  style={{ perspective: 1000 }}
                  className="relative group cursor-pointer h-full"
                >
                  {/* Outer Glowing Neon Shadow Border */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-red-600 via-amber-500 to-yellow-400 opacity-0 group-hover:opacity-100 blur-xl transition-all duration-500 -z-10" />

                  {/* Glass Card Container with dynamic 3D-like hover tilting */}
                  <motion.div
                    whileHover={{
                      scale: 1.03,
                      rotateY: 6,
                      rotateX: -4,
                      translateZ: 15,
                    }}
                    transition={{ type: "spring", stiffness: 350, damping: 20 }}
                    className="relative flex flex-col h-full rounded-2xl overflow-hidden bg-stone-900/80 border border-stone-850 group-hover:border-red-500/50 backdrop-blur-xl transition-all duration-300"
                  >
                    {/* Visual Banner */}
                    <div className="relative h-40 w-full overflow-hidden bg-black">
                      <img
                        src={item.imageUrl}
                        alt=""
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-cover opacity-70 group-hover:opacity-100 transition-all duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-stone-900/40 to-transparent" />
                      
                      {/* Top labels */}
                      <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                        <span className="rounded-md bg-red-600/90 backdrop-blur-md px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-widest text-white shadow-sm shadow-red-600/20">
                          {item.category}
                        </span>
                      </div>

                      {/* Score Badge */}
                      <div className="absolute bottom-3 right-3 flex items-center space-x-1 rounded-md bg-stone-950/80 border border-red-500/20 backdrop-blur-md px-2 py-0.5 text-[9px] font-bold text-yellow-400">
                        <TrendingUp className="h-3 w-3 text-yellow-400" />
                        <span>Score {item.score}</span>
                      </div>
                    </div>

                    {/* Metadata */}
                    <div className="flex-grow p-5 flex flex-col justify-between bg-stone-950/40">
                      <div className="space-y-2.5">
                        <div className="flex items-center space-x-2 text-[10px] text-stone-500 font-mono">
                          <span className="flex items-center space-x-0.5">
                            <Clock className="h-3 w-3 text-red-500" />
                            <span>{formatTime(item.time)}</span>
                          </span>
                          <span>•</span>
                          <span>by {item.by}</span>
                        </div>

                        <h3 className="font-sans font-bold text-stone-100 text-sm sm:text-base line-clamp-2 leading-snug group-hover:text-yellow-400 transition-colors">
                          {item.title}
                        </h3>

                        <p className="text-xs text-stone-400 leading-relaxed line-clamp-3">
                          {item.summary}
                        </p>
                      </div>

                      {/* Launch external original post link */}
                      <div className="mt-5 pt-4 border-t border-stone-900 flex items-center justify-between">
                        <span className="inline-flex items-center space-x-1.5 text-[10px] font-bold text-red-500 uppercase group-hover:text-yellow-400 transition-colors">
                          <Cpu className="h-3.5 w-3.5" />
                          <span>Automation Pipeline ready</span>
                        </span>

                        <a
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-stone-900 text-stone-400 hover:bg-yellow-500 hover:text-black transition-all shadow-inner border border-stone-850"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
