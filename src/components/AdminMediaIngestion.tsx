import React, { useState } from "react";
import { FolderDown, Server, Laptop, Cpu, Plus, Play, RefreshCw, CheckCircle, Trash2, Calendar, HardDrive, ShieldCheck } from "lucide-react";
import { MediaFile, LocalAgent } from "../types";

interface AdminMediaIngestionProps {
  mediaFiles: MediaFile[];
  localAgents: LocalAgent[];
  onRefresh: () => void;
}

export default function AdminMediaIngestion({ mediaFiles, localAgents, onRefresh }: AdminMediaIngestionProps) {
  const [selectedFile, setSelectedFile] = useState<MediaFile | null>(null);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Form states for converting a file to video
  const [convertTitle, setConvertTitle] = useState("");
  const [convertCategory, setConvertCategory] = useState("Tech & AI");
  const [convertDescription, setConvertDescription] = useState("");
  const [convertIsPremium, setConvertIsPremium] = useState(false);
  const [convertScheduledAt, setConvertScheduledAt] = useState("");

  const handleRefreshClick = async () => {
    setIsRefreshing(true);
    await onRefresh();
    setTimeout(() => setIsRefreshing(false), 800);
  };

  const handleProcessFile = async (id: string) => {
    setProcessingId(id);
    try {
      const res = await fetch(`/api/admin/media-files/${id}/process`, {
        method: "POST"
      });
      if (res.ok) {
        onRefresh();
      }
    } catch (err) {
      console.error("Process media file failed:", err);
    } finally {
      setTimeout(() => setProcessingId(null), 1200);
    }
  };

  const handleOpenConvert = (file: MediaFile) => {
    setSelectedFile(file);
    setConvertTitle(file.filename.replace(/\.[^/.]+$/, ""));
    setConvertDescription(`Ingested local video file located at local system folder. Filename: ${file.filename}`);
    setShowConvertModal(true);
  };

  const handleConvertSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    try {
      const res = await fetch(`/api/admin/media-files/${selectedFile.id}/convert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: convertTitle,
          category: convertCategory,
          description: convertDescription,
          isPremium: convertIsPremium,
          scheduledAt: convertScheduledAt ? new Date(convertScheduledAt).toISOString() : null
        })
      });

      if (res.ok) {
        setShowConvertModal(false);
        setSelectedFile(null);
        onRefresh();
      }
    } catch (err) {
      console.error("Convert file to video failed:", err);
    }
  };

  const handleDeleteFile = async (id: string) => {
    if (!confirm("Are you sure you want to delete this media file reference?")) return;
    try {
      const res = await fetch(`/api/admin/media-files/${id}`, { method: "DELETE" });
      if (res.ok) {
        onRefresh();
      }
    } catch (err) {
      console.error("Delete media file failed:", err);
    }
  };

  const handleDeleteAgent = async (id: string) => {
    if (!confirm("Are you sure you want to remove this local agent registry?")) return;
    try {
      const res = await fetch(`/api/admin/agents/${id}`, { method: "DELETE" });
      if (res.ok) {
        onRefresh();
      }
    } catch (err) {
      console.error("Delete agent failed:", err);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDuration = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}:${remainingSecs < 10 ? "0" : ""}${remainingSecs}`;
  };

  return (
    <div className="space-y-8 text-stone-200" id="admin_media_ingestion_container">
      {/* Upper Status Cards */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-sans font-black text-white tracking-tight flex items-center gap-2">
            <FolderDown className="h-5 w-5 text-red-500 animate-bounce" />
            <span>Local Media Ingestion Center</span>
          </h2>
          <p className="text-stone-400 text-xs sm:text-sm mt-1">
            Scan and synchronize media from local disks, VPS, external HDDs, and NAS.
          </p>
        </div>

        <button
          onClick={handleRefreshClick}
          className="inline-flex items-center justify-center space-x-2 rounded-xl border border-stone-800 bg-stone-900 px-4 py-2.5 text-xs font-bold text-stone-300 hover:text-white hover:bg-stone-850 shadow-md transition-all self-start sm:self-center cursor-pointer"
        >
          <RefreshCw className={`h-4.5 w-4.5 text-yellow-400 ${isRefreshing ? "animate-spin" : ""}`} />
          <span>Refresh Scan Logs</span>
        </button>
      </div>

      {/* Grid of registered local agents / watchers */}
      <div className="bg-stone-950 rounded-2xl border border-stone-850 p-6 shadow-2xl">
        <h3 className="text-sm font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
          <Server className="h-4.5 w-4.5 text-yellow-500" />
          <span>Registered Scanning Agents ({localAgents.length})</span>
        </h3>
        
        {localAgents.length === 0 ? (
          <div className="text-center py-8 text-stone-500 text-xs font-bold font-mono uppercase tracking-widest">
            No local scanner daemons registered. Use instructions in guides tab to connect.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {localAgents.map((agent) => (
              <div
                key={agent.id}
                className="rounded-xl border border-stone-850 bg-stone-900/40 p-4 relative overflow-hidden transition-all hover:border-stone-800"
              >
                {/* Online/Offline Status Indicator */}
                <div className="absolute top-4 right-4 flex items-center space-x-1.5 animate-pulse">
                  <span className={`h-2 w-2 rounded-full ${agent.isOnline ? "bg-red-500" : "bg-stone-600"}`} />
                  <span className={`text-[10px] font-black uppercase ${agent.isOnline ? "text-red-400" : "text-stone-500"}`}>
                    {agent.isOnline ? "Active" : "Offline"}
                  </span>
                </div>

                <div className="flex items-start space-x-3">
                  <div className={`p-2.5 rounded-lg ${agent.isOnline ? "bg-red-950/40 text-red-500 border border-red-500/15" : "bg-stone-900 text-stone-500"}`}>
                    <Cpu className="h-5 w-5" />
                  </div>
                  <div className="space-y-1 min-w-0">
                    <h4 className="text-xs font-black text-white uppercase tracking-wide truncate">{agent.name}</h4>
                    <p className="text-[11px] font-mono text-stone-400 truncate">
                      API Key: <span className="bg-stone-900 border border-stone-800 px-1.5 py-0.5 rounded text-yellow-400">{agent.apiKey}</span>
                    </p>
                    <p className="text-[10px] text-stone-500 uppercase font-bold tracking-wider">Version: {agent.version} | Ping: {new Date(agent.lastSeen).toLocaleTimeString()}</p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-stone-900 flex flex-wrap gap-2 items-center justify-between">
                  <div className="flex flex-wrap gap-1.5">
                    {agent.folders.map((folder, index) => (
                      <span key={index} className="text-[10px] font-mono font-bold text-stone-300 bg-stone-900 border border-stone-800 px-1.5 py-0.5 rounded-md">
                        {folder}
                      </span>
                    ))}
                  </div>
                  <button
                    onClick={() => handleDeleteAgent(agent.id)}
                    className="text-stone-500 hover:text-red-500 p-1 rounded-lg transition-colors ml-auto cursor-pointer"
                    title="Remove Agent"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main Table Ingest Scan Library */}
      <div className="bg-stone-950 rounded-2xl border border-stone-850 overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-stone-900 flex items-center justify-between flex-wrap gap-4">
          <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
            <FolderDown className="h-4.5 w-4.5 text-red-500" />
            <span>Folder Ingestion Pipeline Queue ({mediaFiles.length})</span>
          </h3>
          <span className="text-[10px] font-black text-yellow-400 bg-yellow-950/40 border border-yellow-500/10 px-3 py-1 rounded-full uppercase tracking-widest animate-pulse">
            Auto Scanner Active (Interval: 5m)
          </span>
        </div>

        {mediaFiles.length === 0 ? (
          <div className="p-16 text-center">
            <FolderDown className="mx-auto h-12 w-12 text-stone-700 animate-pulse" />
            <h4 className="text-white font-black text-sm uppercase tracking-widest mt-4">Ingestion Queue Empty</h4>
            <p className="text-stone-500 text-xs mt-1.5 max-w-sm mx-auto uppercase tracking-wider font-semibold">
              Deploy the local agent scanner or add folders to watch videos. Videos will pop up here instantly.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-stone-900/40 text-[10px] font-black text-stone-400 uppercase tracking-wider border-b border-stone-900">
                  <th className="py-3.5 px-6">Media File details</th>
                  <th className="py-3.5 px-4">Local Directory Path</th>
                  <th className="py-3.5 px-4">Resolution / Format</th>
                  <th className="py-3.5 px-4">File Size / Length</th>
                  <th className="py-3.5 px-4">Workflow Pipeline Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-900 text-xs">
                {mediaFiles.map((file) => (
                  <tr key={file.id} className="hover:bg-stone-900/40 transition-colors">
                    <td className="py-4 px-6 font-medium text-stone-200">
                      <div className="flex items-center space-x-3">
                        <img
                          src={file.thumbnailUrl}
                          className="h-10 w-16 object-cover rounded-lg bg-stone-900 border border-stone-800 flex-shrink-0 shadow-md"
                          alt="Video Preview"
                          referrerPolicy="no-referrer"
                        />
                        <span className="font-mono text-xs text-stone-200 font-bold line-clamp-1 truncate max-w-[200px]" title={file.filename}>
                          {file.filename}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-stone-400 font-mono text-[11px]">
                      {file.path}
                    </td>
                    <td className="py-4 px-4 font-mono text-stone-400">
                      <div className="space-y-0.5">
                        <span className="block text-white font-black">{file.resolution}</span>
                        <span className="text-[10px] uppercase text-red-400 font-black bg-red-950/40 px-1.5 py-0.25 rounded-md border border-red-500/15">
                          {file.codec || "h264"}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-stone-400">
                      <div className="space-y-0.5">
                        <span className="block font-bold">{formatBytes(file.size)}</span>
                        <span className="text-stone-500 text-[10px] block font-semibold uppercase">{formatDuration(file.duration)} minutes</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      {file.status === "NEW" && (
                        <span className="inline-flex items-center space-x-1 text-[10px] font-black text-yellow-400 bg-yellow-950/40 px-2.5 py-0.5 rounded-full border border-yellow-500/10 uppercase tracking-wider">
                          <span>●</span>
                          <span>NEW INGEST</span>
                        </span>
                      )}
                      {file.status === "PROCESSING" && (
                        <span className="inline-flex items-center space-x-1 text-[10px] font-black text-yellow-400 bg-yellow-950/60 px-2.5 py-0.5 rounded-full border border-yellow-500/30 animate-pulse uppercase tracking-wider">
                          <span>●</span>
                          <span>PROCESSING</span>
                        </span>
                      )}
                      {file.status === "READY" && (
                        <span className="inline-flex items-center space-x-1 text-[10px] font-black text-red-400 bg-red-950/40 px-2.5 py-0.5 rounded-full border border-red-500/15 uppercase tracking-wider animate-pulse">
                          <CheckCircle className="h-3 w-3 text-red-500" />
                          <span>READY TO SEND</span>
                        </span>
                      )}
                      {file.status === "SCHEDULED" && (
                        <span className="inline-flex items-center space-x-1 text-[10px] font-black text-stone-400 bg-stone-900 px-2.5 py-0.5 rounded-full border border-stone-800 uppercase tracking-wider">
                          <span>●</span>
                          <span>PUBLISHED/POSTED</span>
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {file.status === "NEW" && (
                          <button
                            onClick={() => handleProcessFile(file.id)}
                            disabled={processingId === file.id}
                            className="inline-flex items-center space-x-1 rounded-xl bg-stone-900 border border-stone-800 px-3 py-1.5 text-[10px] font-black text-white hover:bg-stone-800 shadow-sm transition-colors cursor-pointer"
                          >
                            <Play className="h-3 w-3 fill-white text-white" />
                            <span>{processingId === file.id ? "Analyzing..." : "Process Pipeline"}</span>
                          </button>
                        )}
                        {file.status === "READY" && (
                          <button
                            onClick={() => handleOpenConvert(file)}
                            className="inline-flex items-center space-x-1 rounded-xl bg-gradient-to-r from-red-600 to-yellow-500 px-3 py-1.5 text-[10px] font-black text-black hover:brightness-110 shadow-md shadow-red-500/10 transition-colors cursor-pointer"
                          >
                            <Plus className="h-3 w-3 stroke-[3]" />
                            <span>Convert to Post</span>
                          </button>
                        )}
                        {file.status === "SCHEDULED" && (
                          <span className="text-[11px] text-stone-500 font-bold px-2 py-1 uppercase tracking-wider">In Catalog</span>
                        )}
                        <button
                          onClick={() => handleDeleteFile(file.id)}
                          className="p-1.5 text-stone-500 hover:text-red-500 rounded-lg hover:bg-stone-900 transition-colors cursor-pointer"
                          title="Delete File Reference"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Convert Media File Modal Form Overlay */}
      {showConvertModal && selectedFile && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-stone-950 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-stone-850 space-y-4 animate-in fade-in zoom-in duration-150 text-stone-200">
            <div className="flex items-center justify-between pb-3 border-b border-stone-900">
              <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                <HardDrive className="h-4.5 w-4.5 text-red-500" />
                <span>Create Video Catalog Library Item</span>
              </h3>
              <button
                onClick={() => { setShowConvertModal(false); setSelectedFile(null); }}
                className="text-stone-500 hover:text-white font-black text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConvertSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">Video Post Title</label>
                <input
                  type="text"
                  required
                  value={convertTitle}
                  onChange={(e) => setConvertTitle(e.target.value)}
                  className="w-full rounded-xl border border-stone-800 bg-stone-900 px-3 py-2 text-xs text-white focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500/20"
                  placeholder="e.g. Beautiful Sunset Cinematic"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">Display Category</label>
                  <select
                    value={convertCategory}
                    onChange={(e) => setConvertCategory(e.target.value)}
                    className="w-full rounded-xl border border-stone-800 bg-stone-900 px-3 py-2 text-xs text-white focus:border-red-500 focus:outline-none"
                  >
                    <option value="Tech & AI" className="bg-stone-950">Tech & AI</option>
                    <option value="SaaS Automation" className="bg-stone-950">SaaS Automation</option>
                    <option value="Cinematic Beats" className="bg-stone-950">Cinematic Beats</option>
                    <option value="Nature & Wildlife" className="bg-stone-950">Nature & Wildlife</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">Pre-Schedule (Optional)</label>
                  <input
                    type="datetime-local"
                    value={convertScheduledAt}
                    onChange={(e) => setConvertScheduledAt(e.target.value)}
                    className="w-full rounded-xl border border-stone-800 bg-stone-900 px-3 py-2 text-xs text-white focus:border-red-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">SaaS Streaming Description / Telegram Body text</label>
                <textarea
                  required
                  rows={4}
                  value={convertDescription}
                  onChange={(e) => setConvertDescription(e.target.value)}
                  className="w-full rounded-xl border border-stone-800 bg-stone-900 px-3 py-2 text-xs text-white placeholder-stone-600 focus:border-red-500 focus:outline-none font-sans"
                  placeholder="Provide context and summary details for subscribers..."
                />
              </div>

              <div className="flex items-center space-x-2.5 bg-stone-900 border border-stone-800 p-3 rounded-xl">
                <input
                  type="checkbox"
                  id="premium_check"
                  checked={convertIsPremium}
                  onChange={(e) => setConvertIsPremium(e.target.checked)}
                  className="h-4 w-4 text-red-500 border-stone-850 rounded focus:ring-red-500 bg-stone-950"
                />
                <div>
                  <label htmlFor="premium_check" className="font-bold text-stone-300 cursor-pointer flex items-center gap-1.5 uppercase tracking-wide">
                    <ShieldCheck className="h-4 w-4 text-red-500" />
                    <span>Premium Exclusive Stream</span>
                  </label>
                  <span className="block text-[10px] text-stone-500 font-semibold uppercase mt-0.5">Lock playback. Require join of VIP Channels before unlocking link.</span>
                </div>
              </div>

              <div className="flex justify-end space-x-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowConvertModal(false); setSelectedFile(null); }}
                  className="rounded-xl border border-stone-800 bg-stone-900 px-4 py-2 font-bold text-stone-400 hover:text-white hover:bg-stone-850 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-gradient-to-r from-red-600 to-yellow-500 px-5 py-2 font-black text-black hover:brightness-110 shadow-lg shadow-red-500/10 transition-all duration-300 cursor-pointer uppercase tracking-wider"
                >
                  Generate & Add to Library
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
