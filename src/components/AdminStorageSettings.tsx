import React, { useState } from "react";
import { HardDrive, Plus, Trash2, CheckCircle, ShieldAlert, Sliders, ToggleLeft, ToggleRight, Radio, ExternalLink, HelpCircle } from "lucide-react";
import { TelegramConfig, TelegramBot, TelegramTarget } from "../types";

interface AdminStorageSettingsProps {
  config: TelegramConfig;
  onSaveConfig: (updates: { telegramConfig: Partial<TelegramConfig> }) => void;
  onRefresh: () => void;
}

export default function AdminStorageSettings({ config, onSaveConfig, onRefresh }: AdminStorageSettingsProps) {
  // Configured Bots state
  const [bots, setBots] = useState<TelegramBot[]>(config.bots || []);
  const [targets, setTargets] = useState<TelegramTarget[]>(config.targets || []);
  const [uploadMode, setUploadMode] = useState<'LOCAL_DIRECT' | 'R2_STORAGE' | 'SUPABASE_STORAGE'>(config.uploadMode || 'LOCAL_DIRECT');

  // Input states for adding/editing bots
  const [newBotName, setNewBotName] = useState("");
  const [newBotToken, setNewBotToken] = useState("");
  const [showBotForm, setShowBotForm] = useState(false);

  // Input states for adding/editing targets
  const [newTargetName, setNewTargetName] = useState("");
  const [newTargetUsername, setNewTargetUsername] = useState("");
  const [newTargetType, setNewTargetType] = useState<'channel' | 'group'>('channel');
  const [showTargetForm, setShowTargetForm] = useState(false);

  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleAddBot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBotName || !newBotToken) return;

    const newBot: TelegramBot = {
      id: `bot_${Date.now()}`,
      name: newBotName,
      token: newBotToken,
      isEnabled: true
    };

    const updatedBots = [...bots, newBot];
    setBots(updatedBots);
    setNewBotName("");
    setNewBotToken("");
    setShowBotForm(false);
    triggerSave(updatedBots, targets, uploadMode);
  };

  const handleAddTarget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTargetName || !newTargetUsername) return;

    const newTarget: TelegramTarget = {
      id: `tgt_${Date.now()}`,
      name: newTargetName,
      usernameOrId: newTargetUsername,
      type: newTargetType,
      isEnabled: true
    };

    const updatedTargets = [...targets, newTarget];
    setTargets(updatedTargets);
    setNewTargetName("");
    setNewTargetUsername("");
    setShowTargetForm(false);
    triggerSave(bots, updatedTargets, uploadMode);
  };

  const handleToggleBot = (botId: string) => {
    const updatedBots = bots.map(b => b.id === botId ? { ...b, isEnabled: !b.isEnabled } : b);
    setBots(updatedBots);
    triggerSave(updatedBots, targets, uploadMode);
  };

  const handleToggleTarget = (targetId: string) => {
    const updatedTargets = targets.map(t => t.id === targetId ? { ...t, isEnabled: !t.isEnabled } : t);
    setTargets(updatedTargets);
    triggerSave(bots, updatedTargets, uploadMode);
  };

  const handleDeleteBot = (botId: string) => {
    const updatedBots = bots.filter(b => b.id !== botId);
    setBots(updatedBots);
    triggerSave(updatedBots, targets, uploadMode);
  };

  const handleDeleteTarget = (targetId: string) => {
    const updatedTargets = targets.filter(t => t.id !== targetId);
    setTargets(updatedTargets);
    triggerSave(bots, updatedTargets, uploadMode);
  };

  const handleModeChange = (mode: 'LOCAL_DIRECT' | 'R2_STORAGE' | 'SUPABASE_STORAGE') => {
    setUploadMode(mode);
    triggerSave(bots, targets, mode);
  };

  const triggerSave = async (
    currentBots: TelegramBot[],
    currentTargets: TelegramTarget[],
    currentMode: 'LOCAL_DIRECT' | 'R2_STORAGE' | 'SUPABASE_STORAGE'
  ) => {
    setSaving(true);
    setAlert(null);
    try {
      // Find the first active bot/channel to sync as primary values for scheduler
      const activeBot = currentBots.find(b => b.isEnabled);
      const activeTarget = currentTargets.find(t => t.isEnabled);

      const res = await fetch("/api/admin/config/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bots: currentBots,
          targets: currentTargets,
          uploadMode: currentMode,
          isEnabled: activeBot ? true : false,
          botToken: activeBot ? activeBot.token : "",
          channelId: activeTarget ? activeTarget.usernameOrId : ""
        })
      });

      if (res.ok) {
        setAlert({ type: "success", text: "Multi-channel and storage preferences updated successfully!" });
        onRefresh();
      } else {
        setAlert({ type: "error", text: "Failed to persist configuration state on the server." });
      }
    } catch (err) {
      setAlert({ type: "error", text: "Network connection loss to Express API backend." });
    } finally {
      setSaving(false);
    }
  };

  const handleTestBotConnection = async (token: string, usernameOrId: string) => {
    if (!token) {
      setAlert({ type: "error", text: "No bot token specified for connection test." });
      return;
    }
    try {
      const res = await fetch(`https://api.telegram.org/bot${token}/getMe`);
      const data = await res.json();
      if (data.ok) {
        setAlert({ type: "success", text: `Connection verified! Bot: @${data.result.username}` });
      } else {
        setAlert({ type: "error", text: `Connection failed: ${data.description}` });
      }
    } catch (err: any) {
      setAlert({ type: "error", text: `Connection error: ${err.message}` });
    }
  };

  return (
    <div className="space-y-8 text-stone-200" id="admin_storage_settings_container">
      {/* Header and Title */}
      <div>
        <h2 className="text-xl font-sans font-black text-white tracking-tight flex items-center gap-2">
          <HardDrive className="h-5 w-5 text-red-500 animate-bounce" />
          <span>Storage & Target Channels Configuration</span>
        </h2>
        <p className="text-stone-400 text-xs sm:text-sm mt-1">
          Select where local agent files are processed and define multiple Telegram delivery bots/channels.
        </p>
      </div>

      {alert && (
        <div className={`p-4 rounded-xl border flex items-center space-x-2 text-xs font-bold ${
          alert.type === "success" 
            ? "bg-emerald-950/40 border-emerald-500/20 text-emerald-400" 
            : "bg-red-950/40 border-red-500/20 text-red-400"
        }`}>
          {alert.type === "success" ? <CheckCircle className="h-4.5 w-4.5 text-emerald-500" /> : <ShieldAlert className="h-4.5 w-4.5 text-red-500" />}
          <span>{alert.text}</span>
        </div>
      )}

      {/* Module 4: Cloud Storage Ingest Pipeline Selector */}
      <div className="bg-stone-950 rounded-2xl border border-stone-850 p-6 shadow-2xl space-y-4">
        <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2 border-b border-stone-900 pb-3">
          <Radio className="h-4 w-4 text-yellow-500 animate-pulse" />
          <span>Ingested Video Storage Mode (UPLOAD_MODE)</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* LOCAL_DIRECT */}
          <div
            onClick={() => handleModeChange("LOCAL_DIRECT")}
            className={`cursor-pointer rounded-xl border p-4 transition-all relative ${
              uploadMode === "LOCAL_DIRECT"
                ? "border-red-500 bg-red-950/20 shadow-md shadow-red-500/5"
                : "border-stone-900 bg-stone-900/30 hover:border-stone-800 text-stone-300"
            }`}
          >
            <div className={`absolute top-4 right-4 h-4 w-4 rounded-full border-2 flex items-center justify-center ${
              uploadMode === "LOCAL_DIRECT" ? "border-red-500" : "border-stone-700"
            }`}>
              {uploadMode === "LOCAL_DIRECT" && <div className="h-2 w-2 rounded-full bg-red-500" />}
            </div>
            <h4 className="text-xs font-black text-white uppercase tracking-wider">LOCAL_DIRECT</h4>
            <p className="text-[10px] text-stone-400 mt-2">
              Direct upload from local disks to Telegram servers during publishing. Low-cost, zero cloud overhead.
            </p>
          </div>

          {/* Cloudflare R2 */}
          <div
            onClick={() => handleModeChange("R2_STORAGE")}
            className={`cursor-pointer rounded-xl border p-4 transition-all relative ${
              uploadMode === "R2_STORAGE"
                ? "border-red-500 bg-red-950/20 shadow-md shadow-red-500/5"
                : "border-stone-900 bg-stone-900/30 hover:border-stone-800 text-stone-300"
            }`}
          >
            <div className={`absolute top-4 right-4 h-4 w-4 rounded-full border-2 flex items-center justify-center ${
              uploadMode === "R2_STORAGE" ? "border-red-500" : "border-stone-700"
            }`}>
              {uploadMode === "R2_STORAGE" && <div className="h-2 w-2 rounded-full bg-red-500" />}
            </div>
            <h4 className="text-xs font-black text-white uppercase tracking-wider">CLOUDFLARE R2</h4>
            <p className="text-[10px] text-stone-400 mt-2">
              Store files in S3-compatible Cloudflare R2. Highly scalable, fast delivery, zero egress bandwidth costs.
            </p>
          </div>

          {/* Supabase Storage */}
          <div
            onClick={() => handleModeChange("SUPABASE_STORAGE")}
            className={`cursor-pointer rounded-xl border p-4 transition-all relative ${
              uploadMode === "SUPABASE_STORAGE"
                ? "border-red-500 bg-red-950/20 shadow-md shadow-red-500/5"
                : "border-stone-900 bg-stone-900/30 hover:border-stone-800 text-stone-300"
            }`}
          >
            <div className={`absolute top-4 right-4 h-4 w-4 rounded-full border-2 flex items-center justify-center ${
              uploadMode === "SUPABASE_STORAGE" ? "border-red-500" : "border-stone-700"
            }`}>
              {uploadMode === "SUPABASE_STORAGE" && <div className="h-2 w-2 rounded-full bg-red-500" />}
            </div>
            <h4 className="text-xs font-black text-white uppercase tracking-wider">SUPABASE BUCKET</h4>
            <p className="text-[10px] text-stone-400 mt-2">
              Stream directly from Supabase Storage buckets. Native integration with PostgreSQL tables, built-in security policies.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Module 5 Component 1: Multi-Bot Config */}
        <div className="bg-stone-950 rounded-2xl border border-stone-850 p-6 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-stone-900 pb-3">
            <h3 className="text-sm font-black text-white uppercase tracking-widest">Telegram Bot Managers ({bots.length})</h3>
            <button
              onClick={() => setShowBotForm(!showBotForm)}
              className="inline-flex items-center space-x-1 text-xs text-yellow-400 hover:text-yellow-300 font-bold uppercase tracking-wider cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Register Bot</span>
            </button>
          </div>

          {showBotForm && (
            <form onSubmit={handleAddBot} className="bg-stone-900 border border-stone-800 p-4 rounded-xl space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Add Telegram Bot</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  required
                  placeholder="Bot Display Name"
                  value={newBotName}
                  onChange={(e) => setNewBotName(e.target.value)}
                  className="rounded-xl border border-stone-800 bg-stone-950 px-3 py-1.5 text-xs text-white focus:border-red-500 focus:outline-none"
                />
                <input
                  type="text"
                  required
                  placeholder="Bot API Token (from @BotFather)"
                  value={newBotToken}
                  onChange={(e) => setNewBotToken(e.target.value)}
                  className="rounded-xl border border-stone-800 bg-stone-950 px-3 py-1.5 text-xs text-white focus:border-red-500 focus:outline-none font-mono"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowBotForm(false)}
                  className="px-3 py-1.5 rounded-lg border border-stone-800 text-[10px] font-bold bg-stone-950 text-stone-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-red-600 to-yellow-500 text-[10px] font-black text-black hover:brightness-110 cursor-pointer uppercase tracking-wider"
                >
                  Register Bot
                </button>
              </div>
            </form>
          )}

          {bots.length === 0 ? (
            <div className="py-8 text-center text-stone-500 text-xs font-bold uppercase tracking-widest">
              No custom dispatch bots registered. Click Register Bot.
            </div>
          ) : (
            <div className="space-y-2">
              {bots.map(bot => (
                <div key={bot.id} className="flex items-center justify-between p-3 rounded-xl border border-stone-850 bg-stone-900/40 text-xs">
                  <div className="space-y-0.5 min-w-0">
                    <span className="font-bold text-white block truncate">{bot.name}</span>
                    <span className="block font-mono text-[9px] text-stone-500 truncate max-w-[200px]" title={bot.token}>
                      {bot.token.substring(0, 15)}...
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <button
                      onClick={() => handleTestBotConnection(bot.token, "")}
                      className="text-[10px] font-bold text-yellow-400 hover:text-yellow-300 bg-stone-900 border border-stone-800 px-2 py-1 rounded-lg cursor-pointer"
                    >
                      Test
                    </button>
                    <button
                      onClick={() => handleToggleBot(bot.id)}
                      className="p-1 cursor-pointer"
                    >
                      {bot.isEnabled ? (
                        <ToggleRight className="h-7 w-7 text-red-500 fill-red-950/40" />
                      ) : (
                        <ToggleLeft className="h-7 w-7 text-stone-700" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDeleteBot(bot.id)}
                      className="text-stone-500 hover:text-red-500 p-1 cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Module 5 Component 2: Multi-Target Channels/Groups */}
        <div className="bg-stone-950 rounded-2xl border border-stone-850 p-6 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-stone-900 pb-3">
            <h3 className="text-sm font-black text-white uppercase tracking-widest">Posting Targets ({targets.length})</h3>
            <button
              onClick={() => setShowTargetForm(!showTargetForm)}
              className="inline-flex items-center space-x-1 text-xs text-yellow-400 hover:text-yellow-300 font-bold uppercase tracking-wider cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Add Target</span>
            </button>
          </div>

          {showTargetForm && (
            <form onSubmit={handleAddTarget} className="bg-stone-900 border border-stone-800 p-4 rounded-xl space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Add Telegram Group/Channel</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  required
                  placeholder="Target Name (e.g. VIP Group)"
                  value={newTargetName}
                  onChange={(e) => setNewTargetName(e.target.value)}
                  className="rounded-xl border border-stone-800 bg-stone-950 px-3 py-1.5 text-xs text-white focus:border-red-500 focus:outline-none"
                />
                <input
                  type="text"
                  required
                  placeholder="Username/ID (@channelname)"
                  value={newTargetUsername}
                  onChange={(e) => setNewTargetUsername(e.target.value)}
                  className="rounded-xl border border-stone-800 bg-stone-950 px-3 py-1.5 text-xs text-white focus:border-red-500 focus:outline-none font-mono"
                />
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Target Type:</span>
                <label className="flex items-center space-x-1.5 text-xs cursor-pointer text-stone-300">
                  <input
                    type="radio"
                    name="target_type"
                    checked={newTargetType === "channel"}
                    onChange={() => setNewTargetType("channel")}
                    className="text-red-500 focus:ring-red-500 bg-stone-950 border-stone-800"
                  />
                  <span>Channel</span>
                </label>
                <label className="flex items-center space-x-1.5 text-xs cursor-pointer text-stone-300">
                  <input
                    type="radio"
                    name="target_type"
                    checked={newTargetType === "group"}
                    onChange={() => setNewTargetType("group")}
                    className="text-red-500 focus:ring-red-500 bg-stone-950 border-stone-800"
                  />
                  <span>Group</span>
                </label>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowTargetForm(false)}
                  className="px-3 py-1.5 rounded-lg border border-stone-800 text-[10px] font-bold bg-stone-950 text-stone-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-red-600 to-yellow-500 text-[10px] font-black text-black hover:brightness-110 cursor-pointer uppercase tracking-wider"
                >
                  Save Target
                </button>
              </div>
            </form>
          )}

          {targets.length === 0 ? (
            <div className="py-8 text-center text-stone-500 text-xs font-bold uppercase tracking-widest">
              No targets (channels/groups) registered. Click Add Target.
            </div>
          ) : (
            <div className="space-y-2">
              {targets.map(tgt => (
                <div key={tgt.id} className="flex items-center justify-between p-3 rounded-xl border border-stone-850 bg-stone-900/40 text-xs">
                  <div className="space-y-0.5 min-w-0">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <span className="truncate">{tgt.name}</span>
                      <span className={`text-[9px] font-black uppercase px-1 rounded flex-shrink-0 ${
                        tgt.type === "channel" 
                          ? "bg-red-950/40 text-red-400 border border-red-500/15" 
                          : "bg-stone-900 text-yellow-400 border border-stone-800"
                      }`}>
                        {tgt.type}
                      </span>
                    </span>
                    <span className="block font-mono text-[9px] text-stone-500 truncate">
                      ID: {tgt.usernameOrId}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <button
                      onClick={() => handleToggleTarget(tgt.id)}
                      className="p-1 cursor-pointer"
                    >
                      {tgt.isEnabled ? (
                        <ToggleRight className="h-7 w-7 text-red-500 fill-red-950/40" />
                      ) : (
                        <ToggleLeft className="h-7 w-7 text-stone-700" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDeleteTarget(tgt.id)}
                      className="text-stone-500 hover:text-red-500 p-1 cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
