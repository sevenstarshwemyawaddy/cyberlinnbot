import React, { useState } from "react";
import { motion } from "motion/react";
import { Play, Send, Search, Sparkles, TrendingUp, Clock, LayoutDashboard } from "lucide-react";

interface PublicHeaderProps {
  currentCategory?: string;
  onNavigate: (hash: string) => void;
  onSearch: (query: string) => void;
}

export default function PublicHeader({ currentCategory, onNavigate, onSearch }: PublicHeaderProps) {
  const [searchVal, setSearchVal] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchVal.trim()) {
      onNavigate(`#search/${encodeURIComponent(searchVal.trim())}`);
    }
  };

  const categories = [
    "All",
    "Tech & AI",
    "Nature & Wildlife",
    "Cinematic Beats",
    "SaaS Automation",
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-red-500/20 bg-stone-950/95 backdrop-blur-xl shadow-[0_4px_30px_rgba(239,68,68,0.1)]" id="public_header">
      {/* 3D Electro Animated Glow Bar */}
      <div className="h-1 w-full bg-gradient-to-r from-red-600 via-amber-400 to-yellow-500 bg-[length:200%_auto] animate-flow-gradient"></div>

      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Brand Logo with dynamic 3D electro tilt and bounce effects */}
        <motion.div 
          onClick={() => onNavigate("#home")} 
          whileHover={{ scale: 1.05, rotateZ: [0, -1, 1, 0] }}
          whileTap={{ scale: 0.98 }}
          className="flex cursor-pointer items-center space-x-2.5"
          id="brand_logo"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-red-600 via-amber-500 to-yellow-400 text-black shadow-lg shadow-red-500/20 relative animate-electro">
            <div className="relative">
              <Play className="h-4.5 w-4.5 fill-black text-black translate-x-px" />
              <Send className="absolute -top-1.5 -right-2.5 h-3.5 w-3.5 text-stone-950 animate-bounce" />
            </div>
          </div>
          <div>
            <span className="font-sans font-black text-lg tracking-tight text-white flex items-center">
              Vid<span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-amber-400 to-yellow-400">Post</span>
              <Sparkles className="h-3.5 w-3.5 text-yellow-400 ml-1 fill-yellow-500/30 animate-pulse" />
            </span>
            <span className="block text-[9px] font-extrabold tracking-widest text-red-500 uppercase -mt-1">Electro Automation</span>
          </div>
        </motion.div>

        {/* Search Bar with cyber gold highlights */}
        <form onSubmit={handleSubmit} className="hidden md:flex w-full max-w-md mx-8" id="search_form">
          <div className="relative w-full">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-red-400">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              placeholder="Search automated streaming content..."
              value={searchVal}
              onChange={(e) => {
                setSearchVal(e.target.value);
                onSearch(e.target.value);
              }}
              className="w-full rounded-full border border-red-500/30 bg-stone-900 py-2 pl-10 pr-4 text-sm text-yellow-100 placeholder-stone-500 transition-all focus:border-yellow-400 focus:bg-stone-950 focus:outline-none focus:ring-2 focus:ring-yellow-400/20"
            />
          </div>
        </form>

        {/* Admin Navigation Button (Console) with electro glow */}
        <div className="flex items-center space-x-4">
          <motion.button
            onClick={() => onNavigate("#admin/overview")}
            whileHover={{ scale: 1.05, boxShadow: "0 0 15px rgba(239, 68, 68, 0.4)" }}
            whileTap={{ scale: 0.96 }}
            className="inline-flex items-center space-x-2 rounded-xl bg-gradient-to-r from-red-600 to-yellow-500 px-4 py-2.5 text-xs font-black tracking-wide text-black hover:brightness-110 transition-all cursor-pointer shadow-lg"
            id="nav_admin_btn"
          >
            <LayoutDashboard className="h-3.5 w-3.5 text-black" />
            <span>Console</span>
          </motion.button>
        </div>
      </div>

      {/* Subnavigation: Categories & Filters (Responsive styled) */}
      <div className="border-t border-red-500/10 bg-stone-950 py-3 overflow-x-auto scrollbar-none" id="sub_navigation">
        <div className="mx-auto flex max-w-7xl items-center space-x-2 px-4 sm:px-6 lg:px-8">
          <motion.button
            onClick={() => onNavigate("#trending")}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center space-x-1.5 rounded-full bg-red-950/60 border border-red-500/30 px-3.5 py-1.5 text-xs font-black text-red-400 hover:bg-red-900/40 transition-all cursor-pointer"
          >
            <TrendingUp className="h-3.5 w-3.5 text-yellow-400 animate-pulse" />
            <span>Trending</span>
          </motion.button>
          
          <motion.button
            onClick={() => onNavigate("#latest")}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center space-x-1.5 rounded-full bg-yellow-950/40 border border-yellow-500/20 px-3.5 py-1.5 text-xs font-black text-yellow-400 hover:bg-yellow-900/30 transition-all cursor-pointer"
          >
            <Clock className="h-3.5 w-3.5 text-red-500" />
            <span>Latest</span>
          </motion.button>

          <span className="h-4 w-px bg-stone-800 mx-2"></span>

          {categories.map((cat) => {
            const isSelected = currentCategory === cat || (cat === "All" && !currentCategory);
            return (
              <motion.button
                key={cat}
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  if (cat === "All") {
                    onNavigate("#home");
                  } else {
                    onNavigate(`#categories/${encodeURIComponent(cat)}`);
                  }
                }}
                className={`rounded-full px-4 py-1.5 text-xs font-bold tracking-wide transition-all cursor-pointer border ${
                  isSelected
                    ? "bg-gradient-to-r from-red-600 to-yellow-500 text-black border-transparent shadow-lg shadow-red-500/10"
                    : "bg-stone-900 text-stone-300 border-stone-800 hover:bg-stone-850 hover:text-white"
                }`}
              >
                {cat}
              </motion.button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
