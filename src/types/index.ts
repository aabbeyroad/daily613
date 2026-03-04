export type CheckLevel = 'none' | 'done' | 'more' | 'max';

export type TabType = 'today' | 'tracking' | 'stats' | 'reflection' | 'settings';

export interface Routine {
  id: string;
  name: string;
  icon: string;
  color: string;
  keywords: string[];
  order: number;
  createdAt: string;
  archived: boolean;
}

export interface DailyRecord {
  date: string;
  checks: Record<string, CheckLevel>;
}

export interface Reflection {
  id: string;
  date: string;
  type: 'daily' | 'weekly';
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface TimeEntry {
  id: string;
  routineId: string;
  date: string;
  startTime: string;
  endTime: string | null;
}

export interface AppSettings {
  discordWebhookUrl: string;
  darkMode: boolean;
  username: string;
}
