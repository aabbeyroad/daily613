// ========================================
// 미리정해 (PreDecide) - 데이터 모델
// ========================================

// 탭 네비게이션
export type TabType = 'dashboard' | 'grocery' | 'settings';

// 색상 테마
export type ColorTheme = 'indigo' | 'rose' | 'emerald' | 'amber' | 'sky' | 'violet';

// 요일 (0=일, 1=월, ..., 6=토)
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

// 시간대
export type TimeSlot = 'morning' | 'afternoon' | 'evening';

// ========================================
// 가정 (Household) - 부부가 함께 사용하는 단위
// ========================================
export interface Household {
  id: string;
  name: string;                    // "김수동 가정"
  inviteCode: string;              // 6자리 초대 코드
  members: HouseholdMember[];      // 가족 구성원 (최대 2명)
  categories: Category[];          // 결정 카테고리
  decisions: Decision[];           // 모든 반복 결정들
  groceryItems: GroceryItem[];     // 장보기 목록
  createdAt: string;
  updatedAt: string;
}

// 가정 구성원
export interface HouseholdMember {
  userId: string;
  name: string;
  emoji: string;                   // 구분용 이모지 (예: 🧑, 👩)
  role: 'owner' | 'member';
  joinedAt: string;
}

// ========================================
// 카테고리 - 반복 결정의 분류
// ========================================
export interface Category {
  id: string;
  name: string;                    // "식단/장보기"
  icon: string;                    // 이모지 아이콘
  description: string;
  isDefault: boolean;              // 기본 제공 카테고리 여부
  order: number;
  isSetup: boolean;                // Q&A 설정 완료 여부
}

// ========================================
// 결정 (Decision) - 핵심 데이터
// ========================================
export interface Decision {
  id: string;
  categoryId: string;
  title: string;                   // "월요일 저녁 요리"
  description?: string;            // 추가 설명
  schedule: Schedule;              // 반복 스케줄
  assigneeId: string | null;       // 담당자 userId
  details: string;                 // 구체적 내용 ("카레", "청소기")
  ingredients: string[];           // 재료 목록 (식단용)
  isDecided: boolean;              // 결정 완료 여부
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// 반복 스케줄
export interface Schedule {
  type: 'daily' | 'weekly' | 'monthly';
  daysOfWeek: DayOfWeek[];        // 해당 요일들
  timeSlot: TimeSlot;             // 아침/오후/저녁
}

// ========================================
// 장보기 목록
// ========================================
export interface GroceryItem {
  id: string;
  name: string;
  quantity: string;                // "2개", "500g" 등
  checked: boolean;
  fromDecisionId?: string;         // 식단 결정에서 자동 생성된 경우
  addedBy: string;                 // userId
  addedAt: string;
}

// ========================================
// 사용자 프로필 (Firestore users 컬렉션)
// ========================================
export interface UserProfile {
  householdId: string | null;
  name: string;
  email: string;
  settings: UserSettings;
  createdAt: string;
}

export interface UserSettings {
  darkMode: boolean;
  colorTheme: ColorTheme;
}

// ========================================
// 온보딩 상태
// ========================================
export type OnboardingStep = 'create-or-join' | 'create-household' | 'join-household' | 'select-categories' | 'setup-decisions' | 'done';

// ========================================
// 템플릿 (기본 제공 카테고리 & 결정 항목)
// ========================================
export interface CategoryTemplate {
  category: Omit<Category, 'id' | 'isSetup'>;
  decisionTemplates: DecisionTemplate[];
}

// 결정 항목 템플릿 - Q&A로 채워갈 항목들
export interface DecisionTemplate {
  title: string;
  description?: string;
  schedule: Schedule;
  needsAssignee: boolean;          // "누가?" 질문이 필요한지
  needsDetails: boolean;           // "뭘?" 질문이 필요한지
  detailsPlaceholder?: string;     // 상세내용 힌트
  hasIngredients: boolean;         // 재료 입력이 필요한지
}
