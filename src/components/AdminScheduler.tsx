import React, { useState } from "react";
import { Clock, Calendar, ToggleLeft, ToggleRight, ArrowRight, Play, Check, RefreshCw } from "lucide-react";
import { Video, ScheduleConfig } from "../types";

interface AdminSchedulerProps {
  config: ScheduleConfig;
  videos: Video[];
  onSaveConfig: (updates: { scheduleConfig: Partial<ScheduleConfig> }) => void;
  onUpdateVideo: (id: string, updates: Partial<Video>) => void;
}

export default function AdminScheduler({ config, videos, onSaveConfig, onUpdateVideo }: AdminSchedulerProps) {
  const [postingIntervalHours, setPostingIntervalHours] = useState(config.postingIntervalHours);
  const [autoPostEnabled, setAutoPostEnabled] = useState(config.autoPostEnabled);
  const [preferredTimesInput, setPreferredTimesInput] = useState(config.preferredPostTimes.join(", "));

  const handleSaveScheduler = (e: React.FormEvent) => {
    e.preventDefault();
    const preferredPostTimes = preferredTimesInput
      .split(",")
      .map((t) => t.trim())
      .filter((t) => /^[0-2]\d:[0-5]\d$/.test(t)); // validate HH:MM

    onSaveConfig({
      scheduleConfig: {
        postingIntervalHours: Number(postingIntervalHours),
        autoPostEnabled,
        preferredPostTimes,
      }
    });
  };

  // Group videos for the schedule visualizer
  const postedVideos = [...videos]
    .filter((v) => v.telegramPosted)
    .sort((a, b) => new Date(b.telegramPostedAt || "").getTime() - new Date(a.telegramPostedAt || "").getTime());

  const upcomingVideos = [...videos]
    .filter((v) => !v.telegramPosted && v.scheduledAt)
    .sort((a, b) => new Date(a.scheduledAt || "").getTime() - new Date(b.scheduledAt || "").getTime());

  const unscheduledVideos = [...videos]
    .filter((v) => !v.telegramPosted && !v.scheduledAt);

  const handleRemoveFromQueue = (id: string) => {
    onUpdateVideo(id, { scheduledAt: null });
  };

  const handleQueueFirst = (id: string) => {
    // Schedule in 1 hour from now
    const nextHour = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    onUpdateVideo(id, { scheduledAt: nextHour });
  };

  return (
    <div className="space-y-6 text-stone-200" id="admin_scheduler_tab">
      
      {/* Config Panel and Fast-toggles */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        
        {/* Scheduler controls */}
        <div className="rounded-2xl border border-stone-850 bg-stone-950 p-6 shadow-2xl md:col-span-2 space-y-4">
          <div className="border-b border-stone-900 pb-3">
            <h4 className="text-sm font-black text-white uppercase tracking-widest flex items-center space-x-2">
              <span className="h-2 w-2 rounded-full bg-red-600 animate-pulse"></span>
              <span>Automated Dispatch Settings</span>
            </h4>
            <p className="text-xs text-stone-400">Configure core timers governing the server auto-posting routine</p>
          </div>

          <form onSubmit={handleSaveScheduler} className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-stone-900 border border-stone-800">
              <div>
                <span className="text-xs font-black text-white uppercase tracking-wider block">Auto-Posting Scheduler Loop</span>
                <span className="text-xs text-stone-400">Toggle whether the server actively dispatches due content</span>
              </div>
              <button
                type="button"
                onClick={() => setAutoPostEnabled(!autoPostEnabled)}
                className="text-stone-200 hover:opacity-85 focus:outline-none transition-transform active:scale-95 cursor-pointer"
              >
                {autoPostEnabled ? (
                  <ToggleRight className="h-11 w-11 text-red-500 fill-red-950" />
                ) : (
                  <ToggleLeft className="h-11 w-11 text-stone-700" />
                )}
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">Backup Posting Interval (Hours)</label>
                <input
                  type="number"
                  min="1"
                  max="72"
                  value={postingIntervalHours}
                  onChange={(e) => setPostingIntervalHours(Number(e.target.value))}
                  placeholder="6"
                  className="w-full rounded-xl border border-stone-800 bg-stone-900 px-3.5 py-2 text-sm text-white focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500/20"
                />
                <span className="text-[10px] text-stone-500 mt-1 block">Failsafe gap between automatic post dispatches</span>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">Target Times (Comma Separated)</label>
                <input
                  type="text"
                  value={preferredTimesInput}
                  onChange={(e) => setPreferredTimesInput(e.target.value)}
                  placeholder="09:00, 15:00, 21:00"
                  className="w-full rounded-xl border border-stone-800 bg-stone-900 px-3.5 py-2 text-sm text-white focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500/20 font-mono"
                />
                <span className="text-[10px] text-stone-500 mt-1 block">Daily HH:MM times (24h format) for publication</span>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-stone-900">
              <button
                type="submit"
                className="rounded-xl bg-gradient-to-r from-red-600 to-yellow-500 px-5 py-2.5 text-xs font-black text-black hover:brightness-110 transition-all duration-300 shadow-md shadow-red-500/10"
              >
                Apply Timing Schema
              </button>
            </div>
          </form>
        </div>

        {/* Stats card */}
        <div className="rounded-2xl border border-stone-850 bg-stone-900/30 p-6 shadow-xl space-y-4">
          <div className="flex items-center space-x-2 border-b border-stone-900 pb-3">
            <Clock className="h-5 w-5 text-yellow-500" />
            <h5 className="font-sans font-black text-white uppercase tracking-wider text-xs">Scheduler Overview</h5>
          </div>

          <div className="space-y-4 text-xs text-stone-300">
            <div className="flex justify-between border-b border-stone-900 pb-2">
              <span className="text-stone-400">Total Catalog Depth:</span>
              <span className="font-mono font-bold text-white">{videos.length} videos</span>
            </div>
            <div className="flex justify-between border-b border-stone-900 pb-2">
              <span className="text-stone-400">Upcoming Queued Posts:</span>
              <span className="font-mono font-bold text-yellow-400">{upcomingVideos.length} pending</span>
            </div>
            <div className="flex justify-between border-b border-stone-900 pb-2">
              <span className="text-stone-400">Completed Dispatches:</span>
              <span className="font-mono font-bold text-red-400">{postedVideos.length} synced</span>
            </div>
            <div className="flex justify-between pb-2">
              <span className="text-stone-400">Remaining Drafts:</span>
              <span className="font-mono font-bold text-stone-400">{unscheduledVideos.length} unassigned</span>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Timeline Queue Canvas */}
      <div className="rounded-2xl border border-stone-850 bg-stone-950 p-6 shadow-2xl space-y-6" id="queue_timeline_canvas">
        <h4 className="text-sm font-black text-white uppercase tracking-widest border-b border-stone-900 pb-3">Queue Pipeline & Scheduled Timeline</h4>

        {/* Deliveries Timeline Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          
          {/* Timeline Block: Upcoming Deliveries */}
          <div className="space-y-4 lg:col-span-2">
            <h5 className="text-xs font-black text-red-500 uppercase tracking-wider flex items-center space-x-1.5 border-b border-stone-900 pb-2">
              <Calendar className="h-4 w-4" />
              <span>Upcoming Delivery Sequence</span>
            </h5>

            {upcomingVideos.length === 0 ? (
              <div className="rounded-xl border border-dashed border-stone-800 py-12 text-center text-xs text-stone-500 uppercase tracking-widest font-bold">
                Queue timeline is empty. Add videos to schedule below.
              </div>
            ) : (
              <div className="relative border-l-2 border-stone-900 pl-4 ml-2 space-y-5">
                {upcomingVideos.map((video, idx) => {
                  const sTime = new Date(video.scheduledAt || "");
                  return (
                    <div key={video.id} className="relative group" id={`timeline_item_${video.id}`}>
                      {/* Timeline Node Icon */}
                      <span className="absolute -left-[23px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-stone-950 border-2 border-red-500 text-red-500 scale-100 group-hover:scale-110 transition-transform">
                        <Clock className="h-2 w-2" />
                      </span>

                      <div className="flex items-start justify-between rounded-xl border border-stone-850 bg-stone-900 p-3.5 hover:border-red-500/30 hover:bg-stone-900/60 transition-all">
                        <div className="flex items-center space-x-3.5 min-w-0">
                          <img src={video.thumbnailUrl} alt="" className="h-10 w-16 rounded object-cover border border-stone-800 shadow-md flex-shrink-0" referrerPolicy="no-referrer" />
                          <div className="min-w-0">
                            <h6 className="font-bold text-white text-xs sm:text-sm truncate">{video.title}</h6>
                            <span className="flex items-center text-[10px] text-yellow-400 font-bold tracking-wide uppercase mt-1">
                              <Calendar className="h-3.5 w-3.5 mr-1" />
                              <span>{sTime.toLocaleDateString()} at {sTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleRemoveFromQueue(video.id)}
                          className="rounded-lg border border-stone-800 bg-stone-950 px-2.5 py-1 text-[10px] font-bold text-stone-400 hover:text-red-500 hover:border-red-500/20 hover:bg-red-950/20 transition-all"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Timeline Block: Unassigned Video Repository */}
          <div className="space-y-4">
            <h5 className="text-xs font-black text-stone-500 uppercase tracking-wider border-b border-stone-900 pb-2">
              Unscheduled Drafts ({unscheduledVideos.length})
            </h5>

            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              {unscheduledVideos.length === 0 ? (
                <div className="rounded-xl border border-dashed border-stone-800 py-10 text-center text-xs text-stone-500 font-bold uppercase tracking-widest">
                  All videos assigned to schedule.
                </div>
              ) : (
                unscheduledVideos.map((video) => (
                  <div key={video.id} className="flex items-center justify-between rounded-xl border border-stone-850 bg-stone-900/40 p-2.5 hover:bg-stone-900 transition-colors">
                    <div className="flex items-center space-x-2 min-w-0">
                      <img src={video.thumbnailUrl} alt="" className="h-8 w-12 rounded object-cover border border-stone-800 flex-shrink-0 shadow-sm" referrerPolicy="no-referrer" />
                      <p className="font-bold text-stone-200 text-xs truncate max-w-[130px]">{video.title}</p>
                    </div>

                    <button
                      onClick={() => handleQueueFirst(video.id)}
                      className="rounded bg-stone-900 hover:bg-stone-800 border border-stone-800 px-2 py-1 text-[10px] font-bold text-yellow-400 flex items-center space-x-1"
                    >
                      <span>Queue</span>
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Historically Synced Dispatches */}
        <div className="border-t border-stone-900 pt-5 space-y-3">
          <h5 className="text-xs font-bold text-stone-500 uppercase tracking-wider">Historical Auto-Dispatched Posts Logs</h5>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            {postedVideos.slice(0, 3).map((video) => (
              <div key={video.id} className="flex items-center space-x-3 rounded-xl border border-stone-850 p-3 bg-stone-900/30">
                <img src={video.thumbnailUrl} alt="" className="h-9 w-16 rounded object-cover border border-stone-800 flex-shrink-0" referrerPolicy="no-referrer" />
                <div className="min-w-0 text-xs">
                  <p className="font-bold text-stone-200 truncate">{video.title}</p>
                  <p className="text-[10px] text-red-400 font-bold mt-0.5 flex items-center space-x-1">
                    <Check className="h-3.5 w-3.5 text-red-500" />
                    <span>Sent: {new Date(video.telegramPostedAt || "").toLocaleDateString()}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
