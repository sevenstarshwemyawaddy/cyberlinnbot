import React, { useState } from "react";
import { Plus, Trash2, Edit3, Send, Calendar, CheckCircle2, AlertTriangle, ExternalLink } from "lucide-react";
import { Video } from "../types";

interface AdminVideoManagerProps {
  videos: Video[];
  onAddVideo: (video: Partial<Video>) => void;
  onUpdateVideo: (id: string, updates: Partial<Video>) => void;
  onDeleteVideo: (id: string) => void;
  onManualPost: (id: string) => Promise<boolean>;
}

export default function AdminVideoManager({ videos, onAddVideo, onUpdateVideo, onDeleteVideo, onManualPost }: AdminVideoManagerProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [postingStates, setPostingStates] = useState<{ [id: string]: "idle" | "sending" | "success" | "error" }>({});
  
  // Form State
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [category, setCategory] = useState("Tech & AI");
  const [description, setDescription] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [telegramCaption, setTelegramCaption] = useState("");
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");

  const categories = ["Tech & AI", "Nature & Wildlife", "Cinematic Beats", "SaaS Automation"];

  // Auto generate slug from title
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""));
  };

  const handleAddVideoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !videoUrl) return;

    // Default thumbnails if empty
    const finalThumb = thumbnailUrl || `https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80`;

    onAddVideo({
      title,
      slug,
      category,
      description,
      videoUrl,
      thumbnailUrl: finalThumb,
      telegramCaption: telegramCaption || `${title}\n\n${description}`,
      scheduledAt: isScheduled && scheduledAt ? new Date(scheduledAt).toISOString() : null,
    });

    // Reset Form
    setTitle("");
    setSlug("");
    setDescription("");
    setVideoUrl("");
    setThumbnailUrl("");
    setTelegramCaption("");
    setIsScheduled(false);
    setScheduledAt("");
    setShowAddForm(false);
  };

  const handleInstantTelegramPublish = async (id: string) => {
    setPostingStates((prev) => ({ ...prev, [id]: "sending" }));
    try {
      const ok = await onManualPost(id);
      if (ok) {
        setPostingStates((prev) => ({ ...prev, [id]: "success" }));
        setTimeout(() => setPostingStates((prev) => ({ ...prev, [id]: "idle" })), 3000);
      } else {
        setPostingStates((prev) => ({ ...prev, [id]: "error" }));
        setTimeout(() => setPostingStates((prev) => ({ ...prev, [id]: "idle" })), 3000);
      }
    } catch {
      setPostingStates((prev) => ({ ...prev, [id]: "error" }));
      setTimeout(() => setPostingStates((prev) => ({ ...prev, [id]: "idle" })), 3000);
    }
  };

  return (
    <div className="space-y-6 text-stone-200" id="admin_video_manager_tab">
      
      {/* Header and Add Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-sans font-black text-white text-base tracking-tight">Video Content Library</h3>
          <p className="text-xs text-stone-400">Manage video inventory, adjust metadata, and broadcast direct posts</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="inline-flex items-center space-x-1.5 rounded-xl bg-gradient-to-r from-red-600 via-amber-500 to-yellow-500 px-4 py-2.5 text-xs font-black text-black hover:brightness-110 transition-all duration-300 shadow-lg shadow-red-500/10 cursor-pointer"
          id="toggle_add_form_btn"
        >
          <Plus className="h-4 w-4 stroke-[3]" />
          <span>{showAddForm ? "Hide Form" : "Upload Video Asset"}</span>
        </button>
      </div>

      {/* Expandable Video Upload/Form Card */}
      {showAddForm && (
        <form onSubmit={handleAddVideoSubmit} className="rounded-2xl border border-stone-850 bg-stone-950 p-6 shadow-xl space-y-4 animate-fade-in" id="add_video_form">
          <h4 className="text-sm font-black text-white uppercase tracking-widest border-b border-stone-900 pb-3 flex items-center space-x-2">
            <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>
            <span>Upload New Automated Video Stream</span>
          </h4>
          
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">Video Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={handleTitleChange}
                placeholder="e.g., Deep Learning with PyTorch"
                className="w-full rounded-xl border border-stone-800 bg-stone-900 px-3.5 py-2 text-sm text-white placeholder-stone-600 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500/20"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">Custom Access Slug (Auto-Generated)</label>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-"))}
                placeholder="slug-value"
                className="w-full rounded-xl border border-stone-800 bg-stone-900 px-3.5 py-2 text-sm text-white placeholder-stone-600 focus:border-red-500 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-stone-800 bg-stone-900 px-3.5 py-2 text-sm text-white focus:border-red-500 focus:outline-none"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat} className="bg-stone-950">{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">Video Source File URL (MP4 / HLS)</label>
              <input
                type="url"
                required
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://example.com/stream.mp4"
                className="w-full rounded-xl border border-stone-800 bg-stone-900 px-3.5 py-2 text-sm text-white placeholder-stone-600 focus:border-red-500 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">Cover Thumbnail URL (Unsplash/Img)</label>
              <input
                type="url"
                value={thumbnailUrl}
                onChange={(e) => setThumbnailUrl(e.target.value)}
                placeholder="https://images.unsplash.com/photo-..."
                className="w-full rounded-xl border border-stone-800 bg-stone-900 px-3.5 py-2 text-sm text-white placeholder-stone-600 focus:border-red-500 focus:outline-none font-mono"
              />
            </div>

            <div>
              <div className="flex items-center space-x-2 mt-6">
                <input
                  type="checkbox"
                  id="schedule_chk"
                  checked={isScheduled}
                  onChange={(e) => setIsScheduled(e.target.checked)}
                  className="rounded border-stone-800 bg-stone-900 text-red-500 focus:ring-red-500"
                />
                <label htmlFor="schedule_chk" className="text-xs font-bold text-stone-300 uppercase tracking-wide cursor-pointer">Enable Automation Scheduler</label>
              </div>
              {isScheduled && (
                <div className="mt-2 animate-fade-in">
                  <input
                    type="datetime-local"
                    required={isScheduled}
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="w-full rounded-xl border border-stone-800 bg-stone-900 px-3.5 py-2 text-sm text-white focus:border-red-500 focus:outline-none font-mono"
                  />
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">Video Synopsis / Public Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide context and summary for the playback screen..."
              className="w-full rounded-xl border border-stone-800 bg-stone-900 px-3.5 py-2 text-sm text-white placeholder-stone-600 focus:border-red-500 focus:outline-none font-sans"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">Telegram Post Caption Overlay</label>
            <textarea
              rows={2}
              value={telegramCaption}
              onChange={(e) => setTelegramCaption(e.target.value)}
              placeholder="Custom telegram post description. Leave empty to fallback on title and synopsis."
              className="w-full rounded-xl border border-stone-800 bg-stone-900 px-3.5 py-2 text-sm text-white placeholder-stone-600 focus:border-red-500 focus:outline-none font-sans"
            />
            <span className="text-[10px] text-stone-500 mt-1 block">A direct high-definition watch link and inline keyboard will be appended automatically during posting.</span>
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-stone-900">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="rounded-xl border border-stone-800 bg-stone-900 px-4 py-2 text-xs font-bold text-stone-300 hover:bg-stone-850 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-gradient-to-r from-red-600 to-yellow-500 px-4 py-2 text-xs font-black text-black hover:brightness-110 transition-colors shadow-md shadow-red-500/10"
            >
              Publish Video to Database
            </button>
          </div>
        </form>
      )}

      {/* Videos List Table */}
      <div className="rounded-2xl border border-stone-850 bg-stone-950 shadow-2xl overflow-hidden animate-fade-in" id="video_list_table">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-900 bg-stone-900/40 text-[10px] font-bold uppercase tracking-wider text-stone-400">
                <th className="py-3.5 px-4">Video Info</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Views / Likes</th>
                <th className="py-3.5 px-4">Scheduling State</th>
                <th className="py-3.5 px-4 text-center">Telegram Actions</th>
                <th className="py-3.5 px-4 text-right">Settings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-900 text-sm text-stone-300">
              {videos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-stone-500 font-bold uppercase tracking-widest text-xs">
                    No videos uploaded. Click "Upload Video Asset" to start.
                  </td>
                </tr>
              ) : (
                videos.map((video) => {
                  const state = postingStates[video.id] || "idle";
                  return (
                    <tr key={video.id} className="hover:bg-stone-900/40 transition-colors">
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="flex items-center space-x-3">
                          <div className="relative h-9 w-16 flex-shrink-0 rounded bg-stone-900 border border-stone-800 overflow-hidden shadow-md">
                            <img src={video.thumbnailUrl} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-white line-clamp-1">{video.title}</p>
                            <p className="font-mono text-[10px] text-stone-500 truncate">/{video.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex rounded-full bg-stone-900 border border-stone-800 px-2.5 py-0.5 text-xs font-semibold text-yellow-400 uppercase tracking-wider">
                          {video.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-stone-400 font-mono text-xs">
                        <div className="flex flex-col space-y-0.5">
                          <span className="flex items-center space-x-1">
                            <span className="text-red-500">👀</span>
                            <span>{video.views} Views</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <span className="text-yellow-500">❤️</span>
                            <span>{video.likes} Likes</span>
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        {video.telegramPosted ? (
                          <div className="flex flex-col text-xs text-red-400">
                            <span className="flex items-center font-black space-x-1 uppercase tracking-wider">
                              <CheckCircle2 className="h-3.5 w-3.5 fill-red-950 text-red-500 animate-pulse" />
                              <span>Syndicated</span>
                            </span>
                            <span className="text-[10px] font-mono text-stone-500">{new Date(video.telegramPostedAt || "").toLocaleDateString()}</span>
                          </div>
                        ) : video.scheduledAt ? (
                          <div className="flex flex-col text-xs text-yellow-400">
                            <span className="flex items-center font-black space-x-1 uppercase tracking-wider">
                              <Calendar className="h-3.5 w-3.5 text-yellow-500" />
                              <span>Queued</span>
                            </span>
                            <span className="text-[10px] font-mono text-stone-500">
                              {new Date(video.scheduledAt).toLocaleDateString()} {new Date(video.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-stone-500 font-bold uppercase tracking-widest">Draft Mode</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {video.telegramPosted ? (
                          <div className="inline-flex items-center space-x-1 rounded bg-red-950/40 border border-red-500/20 px-2.5 py-1 text-xs font-black text-red-400 font-mono">
                            <span>ID {video.telegramPostId}</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleInstantTelegramPublish(video.id)}
                            disabled={state === "sending"}
                            className={`inline-flex items-center space-x-1.5 rounded-lg border px-3 py-1.5 text-xs font-extrabold transition-all duration-300 cursor-pointer ${
                              state === "sending"
                                ? "bg-stone-900 text-stone-600 border-stone-800 cursor-not-allowed"
                                : state === "success"
                                ? "bg-red-950/40 text-red-400 border-red-500/20"
                                : state === "error"
                                ? "bg-yellow-950/40 text-yellow-500 border-yellow-500/20"
                                : "bg-stone-900 border-stone-800 text-yellow-400 hover:border-yellow-400/50 hover:bg-stone-850"
                            }`}
                          >
                            <Send className={`h-3 w-3 ${state === "sending" ? "animate-bounce" : ""}`} />
                            <span className="uppercase tracking-wider text-[10px]">
                              {state === "sending"
                                ? "Posting..."
                                : state === "success"
                                ? "Posted!"
                                : state === "error"
                                ? "Failed"
                                : "Manual Post"}
                            </span>
                          </button>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <a 
                            href={`/#watch/${video.slug}`}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-lg p-1.5 text-stone-500 hover:text-yellow-400 hover:bg-stone-900 transition-colors"
                            title="Open Playback Page"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                          <button
                            onClick={() => {
                              const toggleSched = !video.scheduledAt;
                              onUpdateVideo(video.id, {
                                scheduledAt: toggleSched ? new Date(Date.now() + 60 * 60 * 1000).toISOString() : null
                              });
                            }}
                            className="rounded-lg p-1.5 text-stone-500 hover:text-yellow-400 hover:bg-stone-900 transition-colors"
                            title={video.scheduledAt ? "Remove from Queue" : "Add to Auto-Post Queue"}
                          >
                            <Calendar className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete "${video.title}"?`)) {
                                onDeleteVideo(video.id);
                              }
                            }}
                            className="rounded-lg p-1.5 text-stone-500 hover:text-red-500 hover:bg-stone-900 transition-colors"
                            title="Delete Video"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
