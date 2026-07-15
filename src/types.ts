export interface Video {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  videoUrl: string;
  thumbnailUrl: string;
  telegramCaption: string;
  views: number;
  likes: number;
  createdAt: string; // ISO String
  scheduledAt: string | null; // ISO String of when it's scheduled to post
  telegramPosted: boolean;
  telegramPostId?: string;
  telegramPostedAt?: string; // ISO String of when it was posted
  isPremium?: boolean;
}

export interface TelegramBot {
  id: string;
  name: string;
  token: string;
  isEnabled: boolean;
}

export interface TelegramTarget {
  id: string;
  name: string;
  usernameOrId: string;
  type: 'channel' | 'group';
  isEnabled: boolean;
}

export interface TelegramConfig {
  botToken: string;
  channelId: string;
  botName: string;
  isEnabled: boolean;
  bots: TelegramBot[];
  targets: TelegramTarget[];
  uploadMode: 'LOCAL_DIRECT' | 'R2_STORAGE' | 'SUPABASE_STORAGE';
}

export interface ScheduleConfig {
  postingIntervalHours: number;
  autoPostEnabled: boolean;
  preferredPostTimes: string[]; // e.g., ["09:00", "15:00", "21:00"]
}

export interface DailyMetric {
  date: string; // YYYY-MM-DD
  views: number;
  watchTime: number; // in seconds
  telegramClicks: number;
}

export interface Analytics {
  totalViews: number;
  totalLikes: number;
  telegramClicks: number;
  channelClicks: number;
  dailyMetrics: DailyMetric[];
  clicksByVideo: { [videoId: string]: number };
  publishedCount: number;
  failedCount: number;
}

export interface LogEntry {
  id: string;
  timestamp: string; // ISO String
  level: 'info' | 'warn' | 'error' | 'success';
  message: string;
  source: 'scheduler' | 'telegram' | 'api' | 'system' | 'agent';
}

export interface MediaFile {
  id: string;
  filename: string;
  path: string;
  size: number;
  duration: number; // in seconds
  resolution: string; // e.g. "1920x1080"
  thumbnailUrl: string;
  status: 'NEW' | 'PROCESSING' | 'READY' | 'SCHEDULED' | 'PUBLISHED' | 'FAILED';
  error?: string;
  createdAt: string;
  agentId: string;
  codec?: string;
}

export interface LocalAgent {
  id: string;
  name: string;
  apiKey: string;
  folders: string[];
  scanInterval: string;
  lastSeen: string;
  isOnline: boolean;
  version: string;
}

export interface NewsItem {
  id: string;
  title: string;
  url: string;
  by: string;
  score: number;
  time: string;
  category: string;
  summary: string;
  imageUrl: string;
}

