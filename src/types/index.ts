export type CheckLevel = 'none' | 'done' | 'more' | 'max';
export type TabType = 'today' | 'stats' | 'reflection' | 'settings';

export interface Routine {
  id: string;
  name: string;
  icon?: string;
  keywords: string[];
  doneGoal: string;
  moreGoal: string;
  maxGoal: string;
  order: number;
  createdAt: string;
  archived: boolean;
}

export interface DailyRecord {
  date: string;
  checks: Record<string, CheckLevel>;
}

export type RoutineEvaluation = 'good' | 'soso' | 'bad';

export interface RoutineEval {
  routineId: string;
  evaluation: RoutineEvaluation;
  improvement: string;
}

export interface Reflection {
  id: string;
  date: string;
  type: 'daily' | 'weekly';
  keep: string;
  problem: string;
  try: string;
  routineEvals?: RoutineEval[];
  createdAt: string;
  updatedAt: string;
}

export type ColorTheme = 'indigo' | 'rose' | 'emerald' | 'amber' | 'sky' | 'violet';

export interface AppSettings {
  discordWebhookUrl: string;
  darkMode: boolean;
  username: string;
  colorTheme?: ColorTheme;
}
