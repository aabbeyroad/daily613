import { create } from 'zustand';
import type { Routine, DailyRecord, Reflection, AppSettings, CheckLevel, TabType } from '../types';
import { formatDate } from '../utils/date';
import { getUserData, saveUserData, type UserData } from '../lib/firestore';

interface RoutineStore {
  // User
  userId: string | null;
  isLoading: boolean;
  
  // Data
  routines: Routine[];
  records: DailyRecord[];
  reflections: Reflection[];
  settings: AppSettings;
  keywords: string[];
  activeTab: TabType;
  selectedKeyword: string | null;
  
  // User actions
  setUserId: (userId: string | null) => void;
  loadUserData: (userId: string) => Promise<void>;
  
  // Tab
  setActiveTab: (tab: TabType) => void;
  setSelectedKeyword: (keyword: string | null) => void;
  
  // Routines
  addRoutine: (routine: Omit<Routine, 'id' | 'order' | 'createdAt' | 'archived'>) => void;
  updateRoutine: (id: string, updates: Partial<Routine>) => void;
  deleteRoutine: (id: string) => void;
  reorderRoutines: (routines: Routine[]) => void;
  
  // Records
  setCheck: (date: string, routineId: string, level: CheckLevel) => void;
  getRecord: (date: string) => DailyRecord | undefined;
  
  // Reflections
  addReflection: (reflection: Omit<Reflection, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateReflection: (id: string, updates: Partial<Reflection>) => void;
  deleteReflection: (id: string) => void;
  getReflection: (date: string, type: 'daily' | 'weekly') => Reflection | undefined;
  
  // Keywords
  addKeyword: (keyword: string) => void;
  removeKeyword: (keyword: string) => void;
  
  // Settings
  updateSettings: (settings: Partial<AppSettings>) => void;
  
  // Computed helpers
  getFilteredRoutines: () => Routine[];
  getDailyRate: (date: string, filteredOnly?: boolean) => number;
  getWeeklyRate: (startDate: string, endDate: string, filteredOnly?: boolean) => number;
  getWeeklyScore: (startDate: string, endDate: string, filteredOnly?: boolean) => number;
}

const generateId = (): string => crypto.randomUUID();

const defaultSettings: AppSettings = {
  discordWebhookUrl: '',
  darkMode: false,
  username: '',
};

// Firestore에 저장하는 헬퍼 함수
const syncToFirestore = (userId: string | null, data: Partial<UserData>) => {
  if (userId) {
    saveUserData(userId, data);
  }
};

export const useRoutineStore = create<RoutineStore>()((set, get) => ({
  userId: null,
  isLoading: false,
  routines: [],
  records: [],
  reflections: [],
  keywords: [],
  activeTab: 'today',
  selectedKeyword: null,
  settings: defaultSettings,

  setUserId: (userId) => set({ userId }),
  
  loadUserData: async (userId) => {
    set({ isLoading: true });
    const data = await getUserData(userId);
    set({
      userId,
      routines: data.routines || [],
      records: data.records || [],
      reflections: data.reflections || [],
      keywords: data.keywords || [],
      settings: data.settings || defaultSettings,
      isLoading: false,
    });
  },

  setActiveTab: (tab) => set({ activeTab: tab }),
  setSelectedKeyword: (keyword) => set({ selectedKeyword: keyword }),

  addRoutine: (routine) => {
    const { userId, routines } = get();
    const newRoutine: Routine = {
      ...routine,
      id: generateId(),
      order: routines.length,
      createdAt: new Date().toISOString(),
      archived: false,
    };
    const newRoutines = [...routines, newRoutine];
    set({ routines: newRoutines });
    syncToFirestore(userId, { routines: newRoutines });
  },

  updateRoutine: (id, updates) => {
    const { userId, routines } = get();
    const newRoutines = routines.map((r) => (r.id === id ? { ...r, ...updates } : r));
    set({ routines: newRoutines });
    syncToFirestore(userId, { routines: newRoutines });
  },

  deleteRoutine: (id) => {
    const { userId, routines } = get();
    const newRoutines = routines.filter((r) => r.id !== id);
    set({ routines: newRoutines });
    syncToFirestore(userId, { routines: newRoutines });
  },

  reorderRoutines: (routines) => {
    const { userId } = get();
    set({ routines });
    syncToFirestore(userId, { routines });
  },

  setCheck: (date, routineId, level) => {
    const { userId, records } = get();
    const existing = records.find((r) => r.date === date);
    let newRecords: DailyRecord[];
    
    if (existing) {
      newRecords = records.map((r) =>
        r.date === date ? { ...r, checks: { ...r.checks, [routineId]: level } } : r
      );
    } else {
      newRecords = [...records, { date, checks: { [routineId]: level } }];
    }
    
    set({ records: newRecords });
    syncToFirestore(userId, { records: newRecords });
  },

  getRecord: (date) => get().records.find((r) => r.date === date),

  addReflection: (reflection) => {
    const { userId, reflections } = get();
    const now = new Date().toISOString();
    const newReflection: Reflection = {
      ...reflection,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };
    const newReflections = [...reflections, newReflection];
    set({ reflections: newReflections });
    syncToFirestore(userId, { reflections: newReflections });
  },

  updateReflection: (id, updates) => {
    const { userId, reflections } = get();
    const newReflections = reflections.map((r) =>
      r.id === id ? { ...r, ...updates, updatedAt: new Date().toISOString() } : r
    );
    set({ reflections: newReflections });
    syncToFirestore(userId, { reflections: newReflections });
  },

  deleteReflection: (id) => {
    const { userId, reflections } = get();
    const newReflections = reflections.filter((r) => r.id !== id);
    set({ reflections: newReflections });
    syncToFirestore(userId, { reflections: newReflections });
  },

  getReflection: (date, type) =>
    get().reflections.find((r) => r.date === date && r.type === type),

  addKeyword: (keyword) => {
    const { userId, keywords } = get();
    if (keywords.includes(keyword)) return;
    const newKeywords = [...keywords, keyword];
    set({ keywords: newKeywords });
    syncToFirestore(userId, { keywords: newKeywords });
  },

  removeKeyword: (keyword) => {
    const { userId, keywords, routines, selectedKeyword } = get();
    const newKeywords = keywords.filter((k) => k !== keyword);
    const newRoutines = routines.map((r) => ({
      ...r,
      keywords: r.keywords.filter((k) => k !== keyword),
    }));
    set({
      keywords: newKeywords,
      routines: newRoutines,
      selectedKeyword: selectedKeyword === keyword ? null : selectedKeyword,
    });
    syncToFirestore(userId, { keywords: newKeywords, routines: newRoutines });
  },

  updateSettings: (newSettings) => {
    const { userId, settings } = get();
    const updated = { ...settings, ...newSettings };
    set({ settings: updated });
    syncToFirestore(userId, { settings: updated });
  },

  getFilteredRoutines: () => {
    const { routines, selectedKeyword } = get();
    const active = routines.filter((r) => !r.archived);
    if (!selectedKeyword) return active;
    return active.filter((r) => r.keywords.includes(selectedKeyword));
  },

  getDailyRate: (date, filteredOnly = false) => {
    const { routines, records, selectedKeyword } = get();
    let active = routines.filter((r) => !r.archived);
    if (filteredOnly && selectedKeyword) {
      active = active.filter((r) => r.keywords.includes(selectedKeyword));
    }
    if (active.length === 0) return 0;
    const record = records.find((r) => r.date === date);
    if (!record) return 0;
    const completed = active.filter(
      (r) => record.checks[r.id] && record.checks[r.id] !== 'none'
    ).length;
    return Math.round((completed / active.length) * 100);
  },

  getWeeklyRate: (startDate, endDate, filteredOnly = false) => {
    const { routines, records, selectedKeyword } = get();
    let active = routines.filter((r) => !r.archived);
    if (filteredOnly && selectedKeyword) {
      active = active.filter((r) => r.keywords.includes(selectedKeyword));
    }
    if (active.length === 0) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    let totalChecks = 0;
    let completedChecks = 0;
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = formatDate(d);
      const record = records.find((r) => r.date === dateStr);
      totalChecks += active.length;
      if (record) {
        completedChecks += active.filter(
          (r) => record.checks[r.id] && record.checks[r.id] !== 'none'
        ).length;
      }
    }
    return totalChecks > 0 ? Math.round((completedChecks / totalChecks) * 100) : 0;
  },

  getWeeklyScore: (startDate, endDate, filteredOnly = false) => {
    const { routines, records, selectedKeyword } = get();
    let active = routines.filter((r) => !r.archived);
    if (filteredOnly && selectedKeyword) {
      active = active.filter((r) => r.keywords.includes(selectedKeyword));
    }
    if (active.length === 0) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    let score = 0;
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = formatDate(d);
      const record = records.find((r) => r.date === dateStr);
      if (record) {
        active.forEach((r) => {
          const level = record.checks[r.id];
          if (level === 'done') score += 1;
          else if (level === 'more') score += 2;
          else if (level === 'max') score += 3;
        });
      }
    }
    return score;
  },
}));
