import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Routine, DailyRecord, Reflection, AppSettings, CheckLevel, TabType } from '../types';
import { formatDate } from '../utils/date';

interface RoutineStore {
  routines: Routine[];
  records: DailyRecord[];
  reflections: Reflection[];
  settings: AppSettings;
  keywords: string[];
  activeTab: TabType;
  selectedKeyword: string | null;
  setActiveTab: (tab: TabType) => void;
  setSelectedKeyword: (keyword: string | null) => void;
  addRoutine: (routine: Omit<Routine, 'id' | 'order' | 'createdAt' | 'archived'>) => void;
  updateRoutine: (id: string, updates: Partial<Routine>) => void;
  deleteRoutine: (id: string) => void;
  reorderRoutines: (routines: Routine[]) => void;
  setCheck: (date: string, routineId: string, level: CheckLevel) => void;
  getRecord: (date: string) => DailyRecord | undefined;
  addReflection: (reflection: Omit<Reflection, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateReflection: (id: string, updates: Partial<Reflection>) => void;
  deleteReflection: (id: string) => void;
  getReflection: (date: string, type: 'daily' | 'weekly') => Reflection | undefined;
  addKeyword: (keyword: string) => void;
  removeKeyword: (keyword: string) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  getFilteredRoutines: () => Routine[];
  getDailyRate: (date: string, filteredOnly?: boolean) => number;
  getWeeklyRate: (startDate: string, endDate: string, filteredOnly?: boolean) => number;
  getWeeklyScore: (startDate: string, endDate: string, filteredOnly?: boolean) => number;
}

const generateId = (): string => crypto.randomUUID();

export const useRoutineStore = create<RoutineStore>()(
  persist(
    (set, get) => ({
      routines: [],
      records: [],
      reflections: [],
      keywords: [],
      activeTab: 'today',
      selectedKeyword: null,
      settings: { discordWebhookUrl: '', darkMode: false, username: '' },

      setActiveTab: (tab) => set({ activeTab: tab }),
      setSelectedKeyword: (keyword) => set({ selectedKeyword: keyword }),

      addRoutine: (routine) =>
        set((state) => ({
          routines: [...state.routines, { ...routine, id: generateId(), order: state.routines.length, createdAt: new Date().toISOString(), archived: false }],
        })),

      updateRoutine: (id, updates) =>
        set((state) => ({ routines: state.routines.map((r) => (r.id === id ? { ...r, ...updates } : r)) })),

      deleteRoutine: (id) =>
        set((state) => ({ routines: state.routines.filter((r) => r.id !== id) })),

      reorderRoutines: (routines) => set({ routines }),

      setCheck: (date, routineId, level) =>
        set((state) => {
          const existing = state.records.find((r) => r.date === date);
          if (existing) {
            return { records: state.records.map((r) => (r.date === date ? { ...r, checks: { ...r.checks, [routineId]: level } } : r)) };
          }
          return { records: [...state.records, { date, checks: { [routineId]: level } }] };
        }),

      getRecord: (date) => get().records.find((r) => r.date === date),

      addReflection: (reflection) =>
        set((state) => {
          const now = new Date().toISOString();
          return { reflections: [...state.reflections, { ...reflection, id: generateId(), createdAt: now, updatedAt: now }] };
        }),

      updateReflection: (id, updates) =>
        set((state) => ({ reflections: state.reflections.map((r) => (r.id === id ? { ...r, ...updates, updatedAt: new Date().toISOString() } : r)) })),

      deleteReflection: (id) =>
        set((state) => ({ reflections: state.reflections.filter((r) => r.id !== id) })),

      getReflection: (date, type) => get().reflections.find((r) => r.date === date && r.type === type),

      addKeyword: (keyword) =>
        set((state) => ({ keywords: state.keywords.includes(keyword) ? state.keywords : [...state.keywords, keyword] })),

      removeKeyword: (keyword) =>
        set((state) => ({
          keywords: state.keywords.filter((k) => k !== keyword),
          routines: state.routines.map((r) => ({ ...r, keywords: r.keywords.filter((k) => k !== keyword) })),
          selectedKeyword: state.selectedKeyword === keyword ? null : state.selectedKeyword,
        })),

      updateSettings: (newSettings) =>
        set((state) => ({ settings: { ...state.settings, ...newSettings } })),

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
        const completed = active.filter((r) => record.checks[r.id] && record.checks[r.id] !== 'none').length;
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
            completedChecks += active.filter((r) => record.checks[r.id] && record.checks[r.id] !== 'none').length;
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
    }),
    { name: 'routine-tracker-storage' }
  )
);
