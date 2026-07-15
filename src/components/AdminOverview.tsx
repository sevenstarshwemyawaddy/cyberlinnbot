import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from "recharts";
import { Eye, Heart, Send, MousePointerClick, TrendingUp, BarChart3, Users } from "lucide-react";
import { Analytics, Video } from "../types";

interface AdminOverviewProps {
  analytics: Analytics;
  videos: Video[];
}

export default function AdminOverview({ analytics, videos }: AdminOverviewProps) {
  // Compute key highlights
  const totalVideos = videos.length;
  const postedVideosCount = videos.filter((v) => v.telegramPosted).length;
  const pendingVideosCount = videos.filter((v) => !v.telegramPosted && v.scheduledAt).length;

  const totalViews = analytics.totalViews;
  const totalLikes = analytics.totalLikes;
  const telegramClicks = analytics.telegramClicks;
  const channelClicks = analytics.channelClicks;

  // Calculate overall Telegram Click Through Rate (CTR)
  const clickThroughRate = totalViews > 0 ? ((telegramClicks / totalViews) * 100).toFixed(1) : "0.0";

  // Re-map daily metrics for Recharts
  const chartData = analytics.dailyMetrics.map((item) => ({
    name: new Date(item.date).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    "Total Views": item.views,
    "TG Clicks": item.telegramClicks,
    "Watch Time (min)": Math.round(item.watchTime / 60),
  }));

  // Top performing videos in clicks
  const topVideos = [...videos]
    .map((v) => ({
      ...v,
      clicks: analytics.clicksByVideo[v.id] || 0,
    }))
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 3);

  return (
    <div className="space-y-6" id="admin_overview_tab">
      
      {/* 1. SaaS KPI Metrics Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        
        {/* Total Views Card */}
        <div className="rounded-2xl border border-stone-900 bg-stone-950 p-5 shadow-[0_4px_30px_rgba(239,68,68,0.03)] hover:border-red-500/40 hover:shadow-[0_4px_30px_rgba(239,68,68,0.1)] transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wide text-stone-400 uppercase">Total Video Views</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-950/60 text-red-500 border border-red-500/20 animate-pulse">
              <Eye className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold tracking-tight text-white">{totalViews.toLocaleString()}</h3>
            <p className="mt-1 flex items-center text-xs text-yellow-400 font-medium space-x-1">
              <TrendingUp className="h-3 w-3 text-yellow-500 animate-bounce" />
              <span>+18.3% organic lift this week</span>
            </p>
          </div>
        </div>

        {/* Telegram Clicks Card */}
        <div className="rounded-2xl border border-stone-900 bg-stone-950 p-5 shadow-[0_4px_30px_rgba(239,68,68,0.03)] hover:border-yellow-500/40 hover:shadow-[0_4px_30px_rgba(234,179,8,0.1)] transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wide text-stone-400 uppercase">Telegram Clicks</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-950/60 text-yellow-400 border border-yellow-500/20">
              <MousePointerClick className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold tracking-tight text-white">{telegramClicks.toLocaleString()}</h3>
            <p className="mt-1 flex items-center text-xs text-red-400 font-medium space-x-1">
              <Send className="h-3 w-3 text-red-500 animate-pulse" />
              <span>{clickThroughRate}% click-through rate</span>
            </p>
          </div>
        </div>

        {/* Channel Joins Card */}
        <div className="rounded-2xl border border-stone-900 bg-stone-950 p-5 shadow-[0_4px_30px_rgba(239,68,68,0.03)] hover:border-red-500/40 hover:shadow-[0_4px_30px_rgba(239,68,68,0.1)] transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wide text-stone-400 uppercase">Join Hub Click</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-950/60 text-red-400 border border-red-500/20">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold tracking-tight text-white">{channelClicks.toLocaleString()}</h3>
            <p className="mt-1 flex items-center text-xs text-stone-400 font-medium space-x-1">
              <span>Direct CTA conversions</span>
            </p>
          </div>
        </div>

        {/* Syndication Output */}
        <div className="rounded-2xl border border-stone-900 bg-stone-950 p-5 shadow-[0_4px_30px_rgba(239,68,68,0.03)] hover:border-yellow-500/40 hover:shadow-[0_4px_30px_rgba(234,179,8,0.1)] transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wide text-stone-400 uppercase">Automation Yield</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-900 text-stone-300 border border-stone-800">
              <Send className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold tracking-tight text-white">
              {postedVideosCount} <span className="text-xs text-stone-500 font-normal">/ {totalVideos} Posted</span>
            </h3>
            <p className="mt-1 text-xs text-stone-400">
              {pendingVideosCount} videos queued in active loop
            </p>
          </div>
        </div>
      </div>

      {/* 2. Interactive Charts Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        
        {/* Core Trend Area Chart */}
        <div className="rounded-2xl border border-stone-900 bg-stone-950 p-5 shadow-sm lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h4 className="font-sans font-bold text-white text-sm sm:text-base">Views & Telegram Traffic Drift</h4>
              <p className="text-xs text-stone-400">Comparing organic video hits with inbound automation clicks</p>
            </div>
            <BarChart3 className="h-4 w-4 text-red-500 animate-pulse" />
          </div>
          
          <div className="h-80 w-full text-xs" id="trend_chart_container">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#eab308" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#eab308" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1c1917" />
                <XAxis dataKey="name" stroke="#57534e" />
                <YAxis stroke="#57534e" />
                <Tooltip contentStyle={{ background: "#0c0a09", borderRadius: "12px", color: "#fff", border: "1px solid #ef4444" }} />
                <Legend iconType="circle" />
                <Area type="monotone" dataKey="Total Views" stroke="#ef4444" strokeWidth={2.5} fillOpacity={1} fill="url(#colorViews)" />
                <Area type="monotone" dataKey="TG Clicks" stroke="#eab308" strokeWidth={2.5} fillOpacity={1} fill="url(#colorClicks)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Watch Time Bar Chart */}
        <div className="rounded-2xl border border-stone-900 bg-stone-950 p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h4 className="font-sans font-bold text-white text-sm sm:text-base">Video Consumption</h4>
              <p className="text-xs text-stone-400">Total accumulated active watch time (minutes)</p>
            </div>
          </div>
          
          <div className="h-80 w-full text-xs" id="watch_chart_container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1c1917" />
                <XAxis dataKey="name" stroke="#57534e" />
                <YAxis stroke="#57534e" />
                <Tooltip contentStyle={{ background: "#0c0a09", borderRadius: "12px", color: "#fff", border: "1px solid #eab308" }} />
                <Bar dataKey="Watch Time (min)" fill="#eab308" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 3. Top Performing Videos List */}
      <div className="rounded-2xl border border-stone-900 bg-stone-950 p-5 shadow-sm">
        <h4 className="font-sans font-bold text-white text-sm sm:text-base mb-4">Top Converting Telegram Posts</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-900 text-xs font-semibold uppercase tracking-wider text-stone-500">
                <th className="py-3 px-4">Video Details</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Clicks Captured</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-900 text-sm text-stone-300">
              {topVideos.map((video) => (
                <tr key={video.id} className="hover:bg-stone-900/40 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-3">
                      <img src={video.thumbnailUrl} alt="" className="h-9 w-16 rounded-md object-cover border border-stone-900" referrerPolicy="no-referrer" />
                      <div>
                        <p className="font-semibold text-stone-100 line-clamp-1">{video.title}</p>
                        <p className="text-xs text-stone-500">Uploaded {new Date(video.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex rounded-full bg-stone-900 border border-stone-800 px-2.5 py-0.5 text-xs font-medium text-yellow-400">
                      {video.category}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {video.telegramPosted ? (
                      <span className="inline-flex items-center space-x-1 text-red-400 font-semibold text-xs">
                        <Send className="h-3 w-3 text-red-500 animate-pulse" />
                        <span>Posted</span>
                      </span>
                    ) : (
                      <span className="text-stone-500 text-xs">Unsent</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-yellow-400">
                    {video.clicks}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
