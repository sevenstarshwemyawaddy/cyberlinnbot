import React, { useEffect, useState, useRef } from "react";
import { Terminal, RefreshCw, Trash2, ShieldAlert, CircleCheck, Info, Radio } from "lucide-react";
import { LogEntry } from "../types";

interface AdminLogsProps {
  logs: LogEntry[];
  onRefreshLogs: () => void;
  onClearLogs: () => void;
}

export default function AdminLogs({ logs, onRefreshLogs, onClearLogs }: AdminLogsProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [autoScroll, setAutoScroll] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  // Poll for new logs every 4 seconds when looking at the tab (Cost-optimized polling!)
  useEffect(() => {
    onRefreshLogs();
    const timer = setInterval(() => {
      onRefreshLogs();
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  // Automatic scroll to bottom for live tail logging
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const filteredLogs = logs.filter((log) => {
    const matchesSearch = log.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = levelFilter === "all" || log.level === levelFilter;
    const matchesSource = sourceFilter === "all" || log.source === sourceFilter;
    return matchesSearch && matchesLevel && matchesSource;
  });

  const getLevelStyles = (level: LogEntry["level"]) => {
    switch (level) {
      case "success": return { bg: "bg-emerald-950/45 border-emerald-500/20", text: "text-emerald-400", icon: <CircleCheck className="h-4 w-4 text-emerald-500" /> };
      case "error": return { bg: "bg-red-950/45 border-red-500/20", text: "text-red-400", icon: <ShieldAlert className="h-4 w-4 text-red-500" /> };
      case "warn": return { bg: "bg-amber-950/45 border-amber-500/20", text: "text-amber-400", icon: <ShieldAlert className="h-4 w-4 text-amber-500" /> };
      default: return { bg: "bg-stone-900 border-stone-800", text: "text-stone-300", icon: <Info className="h-4 w-4 text-stone-500" /> };
    }
  };

  const formatTime = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleTimeString(undefined, { hour12: false }) + `.${d.getMilliseconds().toString().padStart(3, "0")}`;
  };

  return (
    <div className="space-y-4 text-stone-200" id="admin_logs_tab">
      
      {/* Search and Filters Controller */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-stone-950 border border-stone-850 p-4 rounded-2xl shadow-2xl">
        <div className="flex flex-wrap items-center gap-3">
          {/* Quick Search */}
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search diagnostic log feed..."
            className="rounded-xl border border-stone-800 bg-stone-900 px-3.5 py-1.5 text-xs text-white focus:border-red-500 focus:outline-none w-52 sm:w-64"
          />

          {/* Level Filter */}
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="rounded-xl border border-stone-800 bg-stone-900 px-3 py-1.5 text-xs text-stone-300 focus:border-red-500 focus:outline-none cursor-pointer"
          >
            <option value="all">All Levels</option>
            <option value="success">Success</option>
            <option value="info">Info</option>
            <option value="warn">Warnings</option>
            <option value="error">Errors</option>
          </select>

          {/* Source Filter */}
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="rounded-xl border border-stone-800 bg-stone-900 px-3 py-1.5 text-xs text-stone-300 focus:border-red-500 focus:outline-none cursor-pointer"
          >
            <option value="all">All Sources</option>
            <option value="system">System</option>
            <option value="scheduler">Scheduler</option>
            <option value="telegram">Telegram</option>
            <option value="api">API Endpoints</option>
          </select>
        </div>

        {/* Console Controls */}
        <div className="flex items-center space-x-3">
          <label className="flex items-center space-x-1.5 text-xs text-stone-400 select-none cursor-pointer">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              className="rounded bg-stone-900 border-stone-800 text-red-500 focus:ring-red-500 h-4 w-4"
            />
            <span>Auto Tail Scroll</span>
          </label>

          <button
            onClick={onRefreshLogs}
            className="rounded-xl border border-stone-800 bg-stone-900 p-2 text-stone-400 hover:text-white hover:border-stone-700 transition-colors cursor-pointer"
            title="Refresh Console Logs"
          >
            <RefreshCw className="h-4 w-4" />
          </button>

          {showConfirmClear ? (
            <div className="flex items-center space-x-1.5">
              <button
                onClick={() => setShowConfirmClear(false)}
                className="px-2 py-1 bg-stone-900 hover:bg-stone-800 border border-stone-800 rounded-lg text-[10px] font-bold text-stone-400 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onClearLogs();
                  setShowConfirmClear(false);
                }}
                className="px-2.5 py-1 bg-red-600 hover:bg-red-500 rounded-lg text-[10px] font-black text-black uppercase tracking-wider cursor-pointer animate-pulse"
              >
                Confirm Clear
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowConfirmClear(true)}
              className="rounded-xl bg-red-950/20 border border-red-500/20 p-2 text-red-400 hover:bg-red-950/40 hover:border-red-500/50 transition-colors cursor-pointer"
              title="Clear Logs Console"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Terminal Board */}
      <div className="rounded-2xl border border-stone-850 bg-stone-950 shadow-2xl p-4 relative overflow-hidden" id="console_terminal_board">
        {/* Terminal Header */}
        <div className="flex items-center justify-between border-b border-stone-900 pb-3 mb-3 text-xs text-stone-400 font-mono select-none">
          <div className="flex items-center space-x-2">
            <Terminal className="h-4 w-4 text-red-500 animate-pulse" />
            <span className="font-semibold tracking-wide text-white">SAAS_DAEMON_OUTPUT_CONSOLE</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <Radio className="h-3 w-3 text-yellow-500 animate-pulse" />
            <span className="text-[10px] uppercase font-bold tracking-wider text-yellow-500">Live feed active</span>
          </div>
        </div>

        {/* Logs Feed Container */}
        <div
          ref={scrollRef}
          className="h-[420px] overflow-y-auto font-mono text-[11px] sm:text-xs leading-relaxed text-stone-300 space-y-2 pr-1 scrollbar-thin scrollbar-thumb-stone-800"
        >
          {filteredLogs.length === 0 ? (
            <div className="py-20 text-center text-stone-600 font-mono select-none">
              &lt;Console empty - waiting for log stream hits&gt;
            </div>
          ) : (
            filteredLogs.slice().reverse().map((log) => {
              const styles = getLevelStyles(log.level);
              return (
                <div key={log.id} className="group flex flex-col sm:flex-row sm:items-start sm:space-x-3.5 hover:bg-stone-900/40 p-1.5 rounded transition-colors animate-fade-in border border-transparent hover:border-stone-900/60">
                  <div className="flex items-center space-x-2 flex-shrink-0 mb-1 sm:mb-0 select-none">
                    {/* Timestamp */}
                    <span className="text-stone-500 font-semibold">
                      [{formatTime(log.timestamp)}]
                    </span>

                    {/* Log Source Label */}
                    <span className="text-yellow-500/80 font-black uppercase tracking-wider text-[10px]">
                      {log.source}
                    </span>
                  </div>

                  {/* Divider */}
                  <span className="hidden sm:inline text-stone-700">|</span>

                  {/* Log Level Badge */}
                  <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest select-none flex-shrink-0 self-start border border-transparent ${styles.bg} ${styles.text}`}>
                    {log.level}
                  </span>

                  {/* Message Content */}
                  <span className="text-stone-100 font-medium break-all whitespace-pre-wrap flex-1 select-text">
                    {log.message}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
