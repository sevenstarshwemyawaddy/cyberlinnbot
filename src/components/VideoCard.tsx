import React from "react";
import { motion } from "motion/react";
import { Video } from "../types";
import { Eye, Heart, Send, Play, Sparkles } from "lucide-react";

interface VideoCardProps {
  key?: string | number;
  video: Video;
  onClick: () => void;
}

export default function VideoCard({ video, onClick }: VideoCardProps) {
  // Format long numbers
  const formatNumber = (num: number) => {
    if (num >= 1000) return (num / 1000).toFixed(1) + "k";
    return num.toString();
  };

  // Human-readable relative time
  const timeAgo = (dateStr: string) => {
    try {
      const now = new Date();
      const past = new Date(dateStr);
      const diffMs = now.getTime() - past.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      return `${diffDays}d ago`;
    } catch (e) {
      return "Recently";
    }
  };

  return (
    <motion.div
      onClick={onClick}
      style={{ perspective: 1000 }}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="relative cursor-pointer group h-full"
      id={`video_card_${video.id}`}
    >
      {/* 3D Red and Yellow Electro Neon Hover Glow */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-red-600 via-amber-500 to-yellow-500 opacity-0 group-hover:opacity-100 blur-xl transition-all duration-500 -z-10" />

      {/* Main Card container with 3D tilting dynamics on hover */}
      <motion.div
        whileHover={{
          scale: 1.04,
          rotateY: 5,
          rotateX: -3,
          translateZ: 12,
        }}
        transition={{ type: "spring", stiffness: 350, damping: 20 }}
        className="flex flex-col h-full overflow-hidden rounded-2xl bg-stone-950 border border-stone-900 shadow-sm group-hover:border-red-500/50 transition-all duration-300"
      >
        {/* Thumbnail + Overlays */}
        <div className="relative aspect-video w-full overflow-hidden bg-black">
          <img
            src={video.thumbnailUrl}
            alt={video.title}
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-80 group-hover:opacity-100"
          />
          
          {/* Glowing colorful overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-red-950/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
            <motion.div 
              whileHover={{ scale: 1.1 }}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-tr from-red-600 via-amber-500 to-yellow-400 text-black shadow-xl shadow-red-500/30"
            >
              <Play className="h-5 w-5 fill-black text-black translate-x-0.5" />
            </motion.div>
          </div>

          {/* Telegram Status Badge */}
          {video.telegramPosted ? (
            <div className="absolute top-3 left-3 flex items-center space-x-1.5 rounded-full bg-gradient-to-r from-red-600 to-amber-500 px-3 py-1 text-[9px] font-extrabold text-white uppercase tracking-wider shadow-sm">
              <Send className="h-3 w-3 fill-white text-white animate-pulse" />
              <span>Synced</span>
            </div>
          ) : video.scheduledAt ? (
            <div className="absolute top-3 left-3 flex items-center space-x-1.5 rounded-full bg-stone-900 border border-yellow-500/40 px-3 py-1 text-[9px] font-extrabold text-yellow-400 uppercase tracking-wider shadow-sm">
              <Sparkles className="h-3 w-3 text-yellow-400 animate-spin-slow" />
              <span>Scheduled</span>
            </div>
          ) : null}

          {/* Category tag - colorful gradient */}
          <div className="absolute bottom-3 right-3 rounded-md bg-stone-950 px-2 py-0.5 text-[9px] font-bold text-yellow-400 uppercase tracking-wide border border-red-500/20">
            {video.category}
          </div>
        </div>

        {/* Content Details */}
        <div className="p-4 flex-grow flex flex-col justify-between">
          <div>
            <h3 className="line-clamp-1 font-sans font-extrabold text-stone-100 transition-colors group-hover:text-yellow-400 text-sm sm:text-base">
              {video.title}
            </h3>
            <p className="mt-1 line-clamp-2 text-xs text-stone-400 leading-relaxed min-h-[32px]">
              {video.description}
            </p>
          </div>

          {/* Video Metadata Panel */}
          <div className="mt-4 flex items-center justify-between border-t border-stone-900 pt-3 text-xs text-stone-500">
            <div className="flex items-center space-x-3">
              <span className="flex items-center space-x-1 hover:text-yellow-400 transition-colors">
                <Eye className="h-3.5 w-3.5 text-stone-500 group-hover:text-red-400" />
                <span className="font-medium">{formatNumber(video.views)}</span>
              </span>
              <span className="flex items-center space-x-1 hover:text-red-500 transition-colors">
                <Heart className="h-3.5 w-3.5 text-red-500 fill-red-500/10" />
                <span className="font-medium">{formatNumber(video.likes)}</span>
              </span>
            </div>
            <span className="font-semibold text-stone-500 font-mono text-[10px]">
              {timeAgo(video.createdAt)}
            </span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
