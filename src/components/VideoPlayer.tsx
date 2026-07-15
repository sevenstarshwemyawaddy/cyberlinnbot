import React, { useRef, useState, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize, RotateCcw, Heart, Share2, Send, Info } from "lucide-react";
import { Video } from "../types";

interface VideoPlayerProps {
  video: Video;
  onLike: () => void;
  onNavigate: (hash: string) => void;
}

export default function VideoPlayer({ video, onLike, onNavigate }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [liked, setLiked] = useState(false);
  const [showShareTooltip, setShowShareTooltip] = useState(false);

  // 1. Send View Event once per session per video (Cost-Optimized!)
  useEffect(() => {
    const sessionKey = `viewed_${video.id}`;
    if (!sessionStorage.getItem(sessionKey)) {
      fetch(`/api/videos/${video.id}/view`, { method: "POST" })
        .then(() => {
          sessionStorage.setItem(sessionKey, "true");
        })
        .catch((err) => console.error("Error logging view:", err));
    }
  }, [video.id]);

  // 2. Track watch time heartbeats while playing
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        fetch(`/api/videos/${video.id}/heartbeat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ seconds: 5 }),
        }).catch((err) => console.error("Heartbeat fail:", err));
      }, 5000); // 5-sec heartbeat interval
    }
    return () => clearInterval(interval);
  }, [isPlaying, video.id]);

  // Video element handlers
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch(err => console.log("Play interrupted:", err));
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (videoRef.current) {
      const newTime = parseFloat(e.target.value);
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (videoRef.current) {
      const newVol = parseFloat(e.target.value);
      videoRef.current.volume = newVol;
      setVolume(newVol);
      setIsMuted(newVol === 0);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const nextMute = !isMuted;
    videoRef.current.muted = nextMute;
    setIsMuted(nextMute);
  };

  const handleFullscreen = () => {
    if (containerRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        containerRef.current.requestFullscreen().catch((err) => console.error(err));
      }
    }
  };

  const handleLocalLike = () => {
    if (!liked) {
      setLiked(true);
      onLike();
    }
  };

  const copyShareLink = () => {
    const shareUrl = `${window.location.origin}/#watch/${video.slug}`;
    navigator.clipboard.writeText(shareUrl);
    setShowShareTooltip(true);
    setTimeout(() => setShowShareTooltip(false), 2000);
  };

  // Helper formats seconds to MM:SS
  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="w-full" id={`video_player_container_${video.id}`}>
      {/* 1. Custom Player Stage */}
      <div 
        ref={containerRef}
        className="group relative aspect-video w-full overflow-hidden rounded-2xl bg-slate-950 shadow-2xl"
      >
        <video
          ref={videoRef}
          src={video.videoUrl}
          poster={video.thumbnailUrl}
          onClick={togglePlay}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          className="h-full w-full object-contain cursor-pointer"
          playsInline
        />

        {/* Floating Play/Pause Center Trigger */}
        <div 
          onClick={togglePlay}
          className={`absolute inset-0 flex items-center justify-center bg-slate-950/20 transition-opacity duration-300 ${
            isPlaying ? "opacity-0 group-hover:opacity-100" : "opacity-100"
          }`}
        >
          <button className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 text-slate-900 shadow-xl backdrop-blur-sm transition-transform hover:scale-110 active:scale-95">
            {isPlaying ? (
              <Pause className="h-6 w-6 fill-slate-900" />
            ) : (
              <Play className="h-6 w-6 fill-slate-900 translate-x-0.5" />
            )}
          </button>
        </div>

        {/* Video Custom Controller Overlay (Hidden during inactivity) */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent p-4 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-300">
          
          {/* Progress Slider */}
          <div className="flex items-center space-x-3 mb-3">
            <span className="text-xs font-mono text-slate-300">{formatTime(currentTime)}</span>
            <input
              type="range"
              min="0"
              max={duration || 100}
              step="0.1"
              value={currentTime}
              onChange={handleSeek}
              className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-white/20 accent-indigo-500 hover:bg-white/30 focus:outline-none"
            />
            <span className="text-xs font-mono text-slate-300">{formatTime(duration)}</span>
          </div>

          {/* Quick Controls Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Play / Pause Toggle */}
              <button 
                onClick={togglePlay} 
                className="text-white hover:text-indigo-400 transition-colors focus:outline-none"
              >
                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 fill-white" />}
              </button>

              {/* Volume / Mute */}
              <div className="flex items-center space-x-2">
                <button 
                  onClick={toggleMute} 
                  className="text-white hover:text-indigo-400 transition-colors focus:outline-none"
                >
                  {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="h-1 w-16 cursor-pointer appearance-none rounded-lg bg-white/20 accent-white"
                />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Reset Replay */}
              <button 
                onClick={() => {
                  if (videoRef.current) {
                    videoRef.current.currentTime = 0;
                    setCurrentTime(0);
                  }
                }}
                className="text-white hover:text-indigo-400 transition-colors focus:outline-none"
                title="Replay"
              >
                <RotateCcw className="h-4 w-4" />
              </button>

              {/* Fullscreen Toggle */}
              <button 
                onClick={handleFullscreen}
                className="text-white hover:text-indigo-400 transition-colors focus:outline-none"
              >
                <Maximize className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Content Info Panel */}
      <div className="mt-6 border-b border-slate-100 pb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="inline-flex items-center rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 uppercase tracking-wide">
              {video.category}
            </span>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
              {video.title}
            </h1>
          </div>

          {/* Social Interaction Buttons */}
          <div className="flex items-center space-x-2.5">
            <button
              onClick={handleLocalLike}
              className={`inline-flex items-center space-x-2 rounded-xl border px-4 py-2.5 text-xs font-semibold transition-all ${
                liked
                  ? "bg-rose-50 border-rose-200 text-rose-600 shadow-sm"
                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              <Heart className={`h-4 w-4 ${liked ? "fill-rose-500 text-rose-500" : "text-slate-400"}`} />
              <span>{video.likes + (liked ? 1 : 0)} Likes</span>
            </button>

            <div className="relative">
              <button
                onClick={copyShareLink}
                className="inline-flex items-center space-x-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Share2 className="h-4 w-4 text-slate-400" />
                <span>Share link</span>
              </button>
              {showShareTooltip && (
                <div className="absolute bottom-full left-1/2 mb-2 -translate-x-1/2 rounded-md bg-slate-900 px-2.5 py-1 text-[10px] font-bold text-white shadow-md uppercase tracking-wider whitespace-nowrap animate-fade-in">
                  Link copied!
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Video Synopsis / Description */}
        <div className="mt-5 rounded-2xl bg-slate-50 p-5 border border-slate-100">
          <div className="flex items-center space-x-2 font-semibold text-slate-800 text-xs sm:text-sm mb-2.5">
            <Info className="h-4 w-4 text-slate-500" />
            <span>Video Details & Automation Info</span>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
            {video.description}
          </p>

          {/* Connected Auto-post information */}
          {video.telegramPosted && (
            <div className="mt-4 flex items-center space-x-2 border-t border-slate-200/60 pt-4 text-xs text-sky-700">
              <Send className="h-4 w-4 fill-sky-500 text-sky-500" />
              <span className="font-semibold">Successfully Syndicated to Telegram:</span>
              <span className="bg-sky-100/80 px-2 py-0.5 rounded font-mono font-bold text-[10px] tracking-wide uppercase">
                ID {video.telegramPostId}
              </span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-500">
                Posted: {new Date(video.telegramPostedAt || "").toLocaleString()}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
