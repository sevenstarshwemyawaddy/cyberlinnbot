import React, { useState } from "react";
import { Send, CheckCircle2, AlertCircle, RefreshCw, Key, HelpCircle } from "lucide-react";
import { TelegramConfig } from "../types";

interface AdminTelegramBotProps {
  config: TelegramConfig;
  onSaveConfig: (updates: { telegramConfig: Partial<TelegramConfig> }) => void;
}

export default function AdminTelegramBot({ config, onSaveConfig }: AdminTelegramBotProps) {
  const [botToken, setBotToken] = useState(config.botToken);
  const [channelId, setChannelId] = useState(config.channelId);
  const [isEnabled, setIsEnabled] = useState(config.isEnabled);
  const [botName, setBotName] = useState(config.botName);

  const [testState, setTestState] = useState<"idle" | "testing" | "success" | "error">("idle");
  const [testError, setTestError] = useState("");

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig({
      telegramConfig: {
        botToken,
        channelId,
        botName,
        isEnabled,
      }
    });
  };

  const handleTestBot = async () => {
    if (!botToken || !channelId) {
      setTestError("Please enter both Bot Token and Channel ID to execute test.");
      setTestState("error");
      return;
    }

    setTestState("testing");
    setTestError("");

    try {
      // Direct call to Telegram API test (send message)
      const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
      const response = await fetch(telegramUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: channelId,
          text: `⚡ *VidPost Integration Test* ⚡\n\nYour Telegram Auto-Posting SaaS integration is successfully connected! 🎉\n\n🕒 *Checked:* ${new Date().toLocaleString()}\n🤖 *Bot:* ${botName}`,
          parse_mode: "Markdown",
        }),
      });

      const resData = await response.json();
      if (resData.ok) {
        setTestState("success");
      } else {
        setTestError(resData.description || "Telegram API rejected the request.");
        setTestState("error");
      }
    } catch (err: any) {
      setTestError(err.message || "Failed to make HTTP request to api.telegram.org");
      setTestState("error");
    }
  };

  return (
    <div className="space-y-6 text-stone-200" id="admin_telegram_bot_tab">
      
      {/* Configuration Card */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        
        {/* Form panel */}
        <div className="rounded-2xl border border-stone-850 bg-stone-950 p-6 shadow-2xl lg:col-span-2 space-y-4">
          <div className="border-b border-stone-900 pb-3">
            <h4 className="text-sm font-black text-white uppercase tracking-widest flex items-center space-x-2">
              <span className="h-2 w-2 rounded-full bg-red-600 animate-pulse"></span>
              <span>Telegram Bot Credentials</span>
            </h4>
            <p className="text-xs text-stone-400">Provide credentials to connect your automated server agent</p>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">Bot Name (Label Only)</label>
              <input
                type="text"
                value={botName}
                onChange={(e) => setBotName(e.target.value)}
                placeholder="VidPost_Automation_Bot"
                className="w-full rounded-xl border border-stone-800 bg-stone-900 px-3.5 py-2 text-sm text-white placeholder-stone-600 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500/20"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">Telegram Bot Token (HTTP API Token)</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-stone-500">
                  <Key className="h-4 w-4" />
                </span>
                <input
                  type="password"
                  value={botToken}
                  onChange={(e) => setBotToken(e.target.value)}
                  placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                  className="w-full rounded-xl border border-stone-800 bg-stone-900 py-2 pl-10 pr-3.5 text-sm text-white placeholder-stone-600 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500/20 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">Target Channel or Chat ID</label>
              <input
                type="text"
                value={channelId}
                onChange={(e) => setChannelId(e.target.value)}
                placeholder="e.g., @my_channel or -100123456789"
                className="w-full rounded-xl border border-stone-800 bg-stone-900 px-3.5 py-2 text-sm text-white placeholder-stone-600 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500/20 font-mono"
              />
            </div>

            <div className="flex items-center justify-between border-t border-stone-900 pt-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="bot_enable_chk"
                  checked={isEnabled}
                  onChange={(e) => setIsEnabled(e.target.checked)}
                  className="rounded border-stone-800 bg-stone-900 text-red-500 focus:ring-red-500"
                />
                <label htmlFor="bot_enable_chk" className="text-xs font-black text-stone-300 cursor-pointer uppercase tracking-wider">Enable Bot Integrations</label>
              </div>

              <div className="flex space-x-2.5">
                <button
                  type="button"
                  onClick={handleTestBot}
                  className="rounded-xl border border-stone-800 bg-stone-900 px-4 py-2 text-xs font-bold text-stone-300 hover:bg-stone-850 hover:text-white flex items-center space-x-1.5 transition-colors"
                >
                  <RefreshCw className={`h-3.5 w-3.5 text-yellow-400 ${testState === "testing" ? "animate-spin" : ""}`} />
                  <span>Test Channel Send</span>
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-gradient-to-r from-red-600 to-yellow-500 px-4 py-2 text-xs font-black text-black hover:brightness-110 transition-all duration-300 shadow-md shadow-red-500/10"
                >
                  Save Bot Details
                </button>
              </div>
            </div>
          </form>

          {/* Test Status Messages */}
          {testState === "success" && (
            <div className="rounded-xl bg-red-950/40 border border-red-500/20 p-4 text-xs text-red-300 flex items-start space-x-2 animate-fade-in">
              <CheckCircle2 className="h-4.5 w-4.5 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-bold uppercase tracking-widest text-white block mb-0.5">Test Message Sent Successfully!</span>
                Check your Telegram channel. A connection ping has been delivered. You are fully ready for background auto-posting.
              </div>
            </div>
          )}

          {testState === "error" && (
            <div className="rounded-xl bg-yellow-950/40 border border-yellow-500/20 p-4 text-xs text-yellow-300 flex items-start space-x-2 animate-fade-in">
              <AlertCircle className="h-4.5 w-4.5 text-yellow-500 mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-bold uppercase tracking-widest text-white block mb-0.5">Integration Test Failed</span>
                <p className="font-mono mt-1 text-[11px] bg-stone-950/80 p-2 rounded border border-yellow-500/20 text-yellow-400 max-w-full overflow-x-auto">{testError}</p>
                <p className="mt-2 text-stone-400">Ensure the Bot Token is correct and that your Bot is added as an <strong>Administrator</strong> inside the channel with <strong>Post Messages</strong> permission enabled.</p>
              </div>
            </div>
          )}
        </div>

        {/* Instructions panel */}
        <div className="rounded-2xl border border-stone-850 bg-stone-900/30 p-6 shadow-xl space-y-4">
          <div className="flex items-center space-x-2 border-b border-stone-900 pb-3">
            <HelpCircle className="h-5 w-5 text-yellow-500" />
            <h5 className="font-sans font-black text-white uppercase tracking-wider text-xs">Quick Setup Instructions</h5>
          </div>

          <ol className="list-decimal list-inside space-y-4 text-xs text-stone-300 leading-relaxed">
            <li>
              <span className="font-bold text-white">Create Telegram Bot</span>
              <p className="pl-5 text-stone-400 mt-0.5">Open Telegram and search for <a href="https://t.me/BotFather" target="_blank" rel="noreferrer" className="text-yellow-400 underline font-semibold">@BotFather</a>. Send <code className="bg-stone-900 border border-stone-800 px-1 py-0.5 rounded font-mono font-bold text-[10px] text-red-400">/newbot</code> and copy the API token.</p>
            </li>
            <li>
              <span className="font-bold text-white">Set Up Target Channel</span>
              <p className="pl-5 text-stone-400 mt-0.5">Create a public Channel or private Group. Enter the username as channel ID (e.g., <code className="bg-stone-900 border border-stone-800 px-1 py-0.5 rounded font-mono text-[10px] text-red-400">@MyChannel</code>).</p>
            </li>
            <li>
              <span className="font-bold text-white">Add Bot as Admin</span>
              <p className="pl-5 text-stone-400 mt-0.5">Add your newly created bot to the channel's <strong>Administrator</strong> list, granting <strong>Post Messages</strong> authorization.</p>
            </li>
            <li>
              <span className="font-bold text-white">Validate & Activate</span>
              <p className="pl-5 text-stone-400 mt-0.5">Save credentials and trigger "Test Channel Send" to verify connection. Toggle on "Enable Bot" for automated dispatch.</p>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
