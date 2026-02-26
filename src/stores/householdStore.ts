// ========================================
// 미리정해 - 핵심 상태 관리 (Zustand)
// 가정 데이터, 결정, 장보기 목록 등 관리
// ========================================

import { create } from 'zustand';
import type {
  Household, HouseholdMember, Category, Decision,
  GroceryItem, UserProfile, UserSettings, TabType,
  OnboardingStep, DayOfWeek,
} from '../types';
import {
  getHousehold, saveHousehold, getUserProfile, saveUserProfile,
  findHouseholdByInviteCode,
} from '../lib/firestore';
import { generateInviteCode } from '../data/templates';

interface AppStore {
  // ── 상태 ──
  userId: string | null;
  userProfile: UserProfile | null;
  household: Household | null;
  isLoading: boolean;
  syncError: string | null;
  activeTab: TabType;
  onboardingStep: OnboardingStep;

  // ── 초기화 ──
  loadData: (userId: string) => Promise<void>;
  clearSyncError: () => void;
  setActiveTab: (tab: TabType) => void;

  // ── 온보딩 ──
  setOnboardingStep: (step: OnboardingStep) => void;
  createHousehold: (name: string, memberName: string, memberEmoji: string) => Promise<string>;
  joinHousehold: (inviteCode: string, memberName: string, memberEmoji: string) => Promise<boolean>;

  // ── 카테고리 ──
  addCategory: (category: Omit<Category, 'id'>) => void;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  removeCategory: (id: string) => void;

  // ── 결정 ──
  addDecision: (decision: Omit<Decision, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'>) => void;
  updateDecision: (id: string, updates: Partial<Decision>) => void;
  removeDecision: (id: string) => void;
  getTodayDecisions: () => Decision[];
  getWeekDecisions: (dayOfWeek: DayOfWeek) => Decision[];
  getUndecidedCount: () => number;

  // ── 장보기 ──
  addGroceryItem: (item: Omit<GroceryItem, 'id' | 'addedBy' | 'addedAt'>) => void;
  toggleGroceryItem: (id: string) => void;
  removeGroceryItem: (id: string) => void;
  clearCheckedGrocery: () => void;
  generateGroceryFromMeals: () => void;

  // ── 설정 ──
  updateSettings: (settings: Partial<UserSettings>) => void;

  // ── 추천 ──
  getRecommendation: (decisionId: string) => string | null;
}

const generateId = (): string => crypto.randomUUID();

// Firestore 동기화 헬퍼
const syncHousehold = async (
  household: Household | null,
  setError: (err: string | null) => void
) => {
  if (!household) return;
  try {
    await saveHousehold(household);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    setError('저장 실패: ' + msg);
  }
};

export const useAppStore = create<AppStore>()((set, get) => ({
  // ── 초기 상태 ──
  userId: null,
  userProfile: null,
  household: null,
  isLoading: false,
  syncError: null,
  activeTab: 'dashboard',
  onboardingStep: 'create-or-join',

  // ── 초기화: 로그인 후 데이터 로드 ──
  loadData: async (userId) => {
    set({ isLoading: true, userId });
    try {
      const profile = await getUserProfile(userId);
      if (profile?.householdId) {
        // 이미 가정에 연결된 경우 → 가정 데이터 로드
        const household = await getHousehold(profile.householdId);
        set({
          userProfile: profile,
          household,
          onboardingStep: 'done',
          isLoading: false,
        });
      } else if (profile) {
        // 프로필은 있지만 가정 미연결
        set({
          userProfile: profile,
          onboardingStep: 'create-or-join',
          isLoading: false,
        });
      } else {
        // 완전 새 사용자
        set({
          userProfile: null,
          onboardingStep: 'create-or-join',
          isLoading: false,
        });
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      set({ isLoading: false, syncError: '로드 실패: ' + msg });
    }
  },

  clearSyncError: () => set({ syncError: null }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setOnboardingStep: (step) => set({ onboardingStep: step }),

  // ── 가정 생성 ──
  createHousehold: async (name, memberName, memberEmoji) => {
    const { userId } = get();
    if (!userId) throw new Error('로그인이 필요합니다');

    const householdId = generateId();
    const inviteCode = generateInviteCode();
    const now = new Date().toISOString();

    const member: HouseholdMember = {
      userId,
      name: memberName,
      emoji: memberEmoji,
      role: 'owner',
      joinedAt: now,
    };

    const household: Household = {
      id: householdId,
      name,
      inviteCode,
      members: [member],
      categories: [],
      decisions: [],
      groceryItems: [],
      createdAt: now,
      updatedAt: now,
    };

    const profile: UserProfile = {
      householdId,
      name: memberName,
      email: '',
      settings: { darkMode: false, colorTheme: 'indigo' },
      createdAt: now,
    };

    await saveHousehold(household);
    await saveUserProfile(userId, profile);

    set({
      household,
      userProfile: profile,
      onboardingStep: 'select-categories',
    });

    return inviteCode;
  },

  // ── 가정 참여 (초대 코드) ──
  joinHousehold: async (inviteCode, memberName, memberEmoji) => {
    const { userId } = get();
    if (!userId) throw new Error('로그인이 필요합니다');

    const household = await findHouseholdByInviteCode(inviteCode);
    if (!household) return false;

    // 이미 2명이면 참여 불가
    if (household.members.length >= 2) return false;

    const now = new Date().toISOString();
    const member: HouseholdMember = {
      userId,
      name: memberName,
      emoji: memberEmoji,
      role: 'member',
      joinedAt: now,
    };

    const updatedHousehold = {
      ...household,
      members: [...household.members, member],
    };

    const profile: UserProfile = {
      householdId: household.id,
      name: memberName,
      email: '',
      settings: { darkMode: false, colorTheme: 'indigo' },
      createdAt: now,
    };

    await saveHousehold(updatedHousehold);
    await saveUserProfile(userId, profile);

    set({
      household: updatedHousehold,
      userProfile: profile,
      onboardingStep: 'done', // 참여자는 바로 대시보드로
    });

    return true;
  },

  // ── 카테고리 관리 ──
  addCategory: (categoryData) => {
    const { household } = get();
    if (!household) return;
    const category: Category = { ...categoryData, id: generateId() };
    const updated = { ...household, categories: [...household.categories, category] };
    set({ household: updated });
    syncHousehold(updated, (err) => set({ syncError: err }));
  },

  updateCategory: (id, updates) => {
    const { household } = get();
    if (!household) return;
    const updated = {
      ...household,
      categories: household.categories.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    };
    set({ household: updated });
    syncHousehold(updated, (err) => set({ syncError: err }));
  },

  removeCategory: (id) => {
    const { household } = get();
    if (!household) return;
    const updated = {
      ...household,
      categories: household.categories.filter((c) => c.id !== id),
      decisions: household.decisions.filter((d) => d.categoryId !== id),
    };
    set({ household: updated });
    syncHousehold(updated, (err) => set({ syncError: err }));
  },

  // ── 결정 관리 ──
  addDecision: (decisionData) => {
    const { household, userId } = get();
    if (!household || !userId) return;
    const now = new Date().toISOString();
    const decision: Decision = {
      ...decisionData,
      id: generateId(),
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
    };
    const updated = { ...household, decisions: [...household.decisions, decision] };
    set({ household: updated });
    syncHousehold(updated, (err) => set({ syncError: err }));
  },

  updateDecision: (id, updates) => {
    const { household } = get();
    if (!household) return;
    const now = new Date().toISOString();
    const updated = {
      ...household,
      decisions: household.decisions.map((d) =>
        d.id === id ? { ...d, ...updates, updatedAt: now } : d
      ),
    };
    set({ household: updated });
    syncHousehold(updated, (err) => set({ syncError: err }));
  },

  removeDecision: (id) => {
    const { household } = get();
    if (!household) return;
    const updated = {
      ...household,
      decisions: household.decisions.filter((d) => d.id !== id),
    };
    set({ household: updated });
    syncHousehold(updated, (err) => set({ syncError: err }));
  },

  // 오늘의 결정 가져오기
  getTodayDecisions: () => {
    const { household } = get();
    if (!household) return [];
    const today = new Date().getDay() as DayOfWeek;
    return household.decisions.filter((d) =>
      d.schedule.type === 'daily' ||
      d.schedule.daysOfWeek.includes(today)
    );
  },

  // 특정 요일의 결정 가져오기
  getWeekDecisions: (dayOfWeek) => {
    const { household } = get();
    if (!household) return [];
    return household.decisions.filter((d) =>
      d.schedule.type === 'daily' ||
      d.schedule.daysOfWeek.includes(dayOfWeek)
    );
  },

  // 미결정 개수
  getUndecidedCount: () => {
    const { household } = get();
    if (!household) return 0;
    const today = new Date().getDay() as DayOfWeek;
    return household.decisions.filter((d) =>
      (d.schedule.type === 'daily' || d.schedule.daysOfWeek.includes(today)) &&
      !d.isDecided
    ).length;
  },

  // ── 장보기 목록 ──
  addGroceryItem: (itemData) => {
    const { household, userId } = get();
    if (!household || !userId) return;
    const item: GroceryItem = {
      ...itemData,
      id: generateId(),
      addedBy: userId,
      addedAt: new Date().toISOString(),
    };
    const updated = { ...household, groceryItems: [...household.groceryItems, item] };
    set({ household: updated });
    syncHousehold(updated, (err) => set({ syncError: err }));
  },

  toggleGroceryItem: (id) => {
    const { household } = get();
    if (!household) return;
    const updated = {
      ...household,
      groceryItems: household.groceryItems.map((i) =>
        i.id === id ? { ...i, checked: !i.checked } : i
      ),
    };
    set({ household: updated });
    syncHousehold(updated, (err) => set({ syncError: err }));
  },

  removeGroceryItem: (id) => {
    const { household } = get();
    if (!household) return;
    const updated = {
      ...household,
      groceryItems: household.groceryItems.filter((i) => i.id !== id),
    };
    set({ household: updated });
    syncHousehold(updated, (err) => set({ syncError: err }));
  },

  clearCheckedGrocery: () => {
    const { household } = get();
    if (!household) return;
    const updated = {
      ...household,
      groceryItems: household.groceryItems.filter((i) => !i.checked),
    };
    set({ household: updated });
    syncHousehold(updated, (err) => set({ syncError: err }));
  },

  // 식단 결정에서 장보기 목록 자동 생성
  generateGroceryFromMeals: () => {
    const { household, userId } = get();
    if (!household || !userId) return;

    // 식단 카테고리의 재료가 있는 결정들에서 추출
    const mealDecisions = household.decisions.filter(
      (d) => d.ingredients.length > 0 && d.isDecided
    );

    const existingNames = new Set(household.groceryItems.map((i) => i.name.toLowerCase()));
    const newItems: GroceryItem[] = [];
    const now = new Date().toISOString();

    for (const decision of mealDecisions) {
      for (const ingredient of decision.ingredients) {
        if (!existingNames.has(ingredient.toLowerCase())) {
          existingNames.add(ingredient.toLowerCase());
          newItems.push({
            id: generateId(),
            name: ingredient,
            quantity: '',
            checked: false,
            fromDecisionId: decision.id,
            addedBy: userId,
            addedAt: now,
          });
        }
      }
    }

    if (newItems.length === 0) return;

    const updated = {
      ...household,
      groceryItems: [...household.groceryItems, ...newItems],
    };
    set({ household: updated });
    syncHousehold(updated, (err) => set({ syncError: err }));
  },

  // ── 설정 ──
  updateSettings: (newSettings) => {
    const { userId, userProfile } = get();
    if (!userId || !userProfile) return;
    const updated = {
      ...userProfile,
      settings: { ...userProfile.settings, ...newSettings },
    };
    set({ userProfile: updated });
    saveUserProfile(userId, { settings: updated.settings }).catch((err) => {
      set({ syncError: '설정 저장 실패: ' + String(err) });
    });
  },

  // ── 스마트 추천 (라이트 버전) ──
  // 같은 요일의 이전 결정 내용을 추천
  getRecommendation: (decisionId) => {
    const { household } = get();
    if (!household) return null;
    const decision = household.decisions.find((d) => d.id === decisionId);
    if (!decision || !decision.details) return null;
    // "지난주와 같은 내용" 추천
    return decision.details;
  },
}));
