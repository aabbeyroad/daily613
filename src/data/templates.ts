import type { CategoryTemplate } from '../types';

// ========================================
// 기본 제공 카테고리 템플릿
// 사용자가 온보딩 시 선택하고, Q&A로 채워가는 항목들
// ========================================

export const categoryTemplates: CategoryTemplate[] = [
  // ────────────────────────────────────
  // 1. 식단 / 장보기
  // ────────────────────────────────────
  {
    category: {
      name: '식단 / 장보기',
      icon: '🍳',
      description: '매일 저녁 메뉴, 주말 장보기 등 식사 관련 결정',
      isDefault: true,
      order: 0,
    },
    decisionTemplates: [
      // 평일 저녁 메뉴 (월~금)
      ...[1, 2, 3, 4, 5].map((day) => ({
        title: `${['', '월', '화', '수', '목', '금'][day]}요일 저녁 메뉴`,
        description: '저녁에 뭘 먹을지 미리 정해두세요',
        schedule: { type: 'weekly' as const, daysOfWeek: [day as 0 | 1 | 2 | 3 | 4 | 5 | 6], timeSlot: 'evening' as const },
        needsAssignee: true,
        needsDetails: true,
        detailsPlaceholder: '메뉴 (예: 카레, 파스타, 찌개)',
        hasIngredients: true,
      })),
      // 주말 장보기
      {
        title: '주말 장보기',
        description: '언제, 누가 장을 보러 갈지',
        schedule: { type: 'weekly' as const, daysOfWeek: [6] as (0 | 1 | 2 | 3 | 4 | 5 | 6)[], timeSlot: 'morning' as const },
        needsAssignee: true,
        needsDetails: false,
        hasIngredients: false,
      },
    ],
  },

  // ────────────────────────────────────
  // 2. 집안일 분담
  // ────────────────────────────────────
  {
    category: {
      name: '집안일 분담',
      icon: '🏠',
      description: '청소, 빨래, 설거지 등 집안일 역할 분담',
      isDefault: true,
      order: 1,
    },
    decisionTemplates: [
      {
        title: '설거지',
        description: '매일 저녁 식사 후 설거지 담당',
        schedule: { type: 'daily' as const, daysOfWeek: [1, 2, 3, 4, 5] as (0 | 1 | 2 | 3 | 4 | 5 | 6)[], timeSlot: 'evening' as const },
        needsAssignee: true,
        needsDetails: false,
        hasIngredients: false,
      },
      {
        title: '빨래 (세탁 + 건조)',
        description: '빨래를 돌리고 널기/건조기',
        schedule: { type: 'weekly' as const, daysOfWeek: [3, 6] as (0 | 1 | 2 | 3 | 4 | 5 | 6)[], timeSlot: 'evening' as const },
        needsAssignee: true,
        needsDetails: false,
        hasIngredients: false,
      },
      {
        title: '청소기 돌리기',
        description: '거실, 방 청소기 돌리기',
        schedule: { type: 'weekly' as const, daysOfWeek: [6] as (0 | 1 | 2 | 3 | 4 | 5 | 6)[], timeSlot: 'morning' as const },
        needsAssignee: true,
        needsDetails: false,
        hasIngredients: false,
      },
      {
        title: '화장실 청소',
        description: '화장실 청소 담당',
        schedule: { type: 'weekly' as const, daysOfWeek: [0] as (0 | 1 | 2 | 3 | 4 | 5 | 6)[], timeSlot: 'morning' as const },
        needsAssignee: true,
        needsDetails: false,
        hasIngredients: false,
      },
      {
        title: '쓰레기 버리기',
        description: '분리수거 및 쓰레기 배출',
        schedule: { type: 'weekly' as const, daysOfWeek: [2, 4] as (0 | 1 | 2 | 3 | 4 | 5 | 6)[], timeSlot: 'evening' as const },
        needsAssignee: true,
        needsDetails: false,
        hasIngredients: false,
      },
    ],
  },

  // ────────────────────────────────────
  // 3. 아이 등하원 / 학원
  // ────────────────────────────────────
  {
    category: {
      name: '아이 등하원 / 학원',
      icon: '🚗',
      description: '어린이집/유치원 등하원, 학원 픽업 담당',
      isDefault: true,
      order: 2,
    },
    decisionTemplates: [
      // 평일 등원 (월~금)
      ...[1, 2, 3, 4, 5].map((day) => ({
        title: `${['', '월', '화', '수', '목', '금'][day]}요일 등원`,
        description: '아침에 누가 아이를 데려다 주는지',
        schedule: { type: 'weekly' as const, daysOfWeek: [day as 0 | 1 | 2 | 3 | 4 | 5 | 6], timeSlot: 'morning' as const },
        needsAssignee: true,
        needsDetails: false,
        hasIngredients: false,
      })),
      // 평일 하원 (월~금)
      ...[1, 2, 3, 4, 5].map((day) => ({
        title: `${['', '월', '화', '수', '목', '금'][day]}요일 하원`,
        description: '오후에 누가 아이를 데려오는지',
        schedule: { type: 'weekly' as const, daysOfWeek: [day as 0 | 1 | 2 | 3 | 4 | 5 | 6], timeSlot: 'afternoon' as const },
        needsAssignee: true,
        needsDetails: false,
        hasIngredients: false,
      })),
    ],
  },

  // ────────────────────────────────────
  // 4. 주말 / 여가 계획
  // ────────────────────────────────────
  {
    category: {
      name: '주말 / 여가 계획',
      icon: '🎯',
      description: '주말 활동, 가족 외출 등 여가 계획',
      isDefault: true,
      order: 3,
    },
    decisionTemplates: [
      {
        title: '토요일 오전 활동',
        description: '토요일 오전에 뭘 할지',
        schedule: { type: 'weekly' as const, daysOfWeek: [6] as (0 | 1 | 2 | 3 | 4 | 5 | 6)[], timeSlot: 'morning' as const },
        needsAssignee: false,
        needsDetails: true,
        detailsPlaceholder: '활동 (예: 놀이터, 키즈카페, 집에서 휴식)',
        hasIngredients: false,
      },
      {
        title: '토요일 오후 활동',
        description: '토요일 오후에 뭘 할지',
        schedule: { type: 'weekly' as const, daysOfWeek: [6] as (0 | 1 | 2 | 3 | 4 | 5 | 6)[], timeSlot: 'afternoon' as const },
        needsAssignee: false,
        needsDetails: true,
        detailsPlaceholder: '활동 (예: 마트, 산책, 카페)',
        hasIngredients: false,
      },
      {
        title: '일요일 오전 활동',
        description: '일요일 오전에 뭘 할지',
        schedule: { type: 'weekly' as const, daysOfWeek: [0] as (0 | 1 | 2 | 3 | 4 | 5 | 6)[], timeSlot: 'morning' as const },
        needsAssignee: false,
        needsDetails: true,
        detailsPlaceholder: '활동 (예: 교회, 운동, 브런치)',
        hasIngredients: false,
      },
      {
        title: '일요일 오후 활동',
        description: '일요일 오후에 뭘 할지',
        schedule: { type: 'weekly' as const, daysOfWeek: [0] as (0 | 1 | 2 | 3 | 4 | 5 | 6)[], timeSlot: 'afternoon' as const },
        needsAssignee: false,
        needsDetails: true,
        detailsPlaceholder: '활동 (예: 가족외식, 집에서 영화)',
        hasIngredients: false,
      },
    ],
  },
];

// 요일 이름 매핑
export const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];
export const DAY_NAMES_FULL = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];

// 시간대 이름 매핑
export const TIME_SLOT_NAMES: Record<string, string> = {
  morning: '오전',
  afternoon: '오후',
  evening: '저녁',
};

// 초대 코드 생성 (6자리 숫자+영문 대문자)
export const generateInviteCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 혼동 방지: 0/O, 1/I 제외
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
};
