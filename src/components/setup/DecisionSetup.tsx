// ========================================
// 결정 설정 (Q&A 흐름)
// 카테고리별 템플릿 항목을 하나씩 채워가는 화면
// "누가?" + "뭘?" 을 답하는 심플한 Q&A
// ========================================

import { useState } from 'react';
import type { CategoryTemplate, Decision, HouseholdMember } from '../../types';
import { DAY_NAMES } from '../../data/templates';

interface Props {
  template: CategoryTemplate;
  categoryId: string;
  members: HouseholdMember[];
  currentStep: number;
  totalSteps: number;
  onComplete: (decisions: Omit<Decision, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'>[]) => void;
  onSkip: () => void;
}

interface DecisionDraft {
  assigneeId: string | null;
  details: string;
  ingredients: string[];
  isDecided: boolean;
}

export default function DecisionSetup({
  template, categoryId, members, currentStep, totalSteps, onComplete, onSkip,
}: Props) {
  // 각 결정 항목별 임시 데이터
  const [drafts, setDrafts] = useState<DecisionDraft[]>(
    template.decisionTemplates.map(() => ({
      assigneeId: null,
      details: '',
      ingredients: [],
      isDecided: false,
    }))
  );
  // 현재 편집 중인 항목 인덱스
  const [currentItem, setCurrentItem] = useState(0);
  const [ingredientInput, setIngredientInput] = useState('');

  const item = template.decisionTemplates[currentItem];
  const draft = drafts[currentItem];

  const updateDraft = (updates: Partial<DecisionDraft>) => {
    setDrafts((prev) =>
      prev.map((d, i) => (i === currentItem ? { ...d, ...updates } : d))
    );
  };

  const addIngredient = () => {
    if (!ingredientInput.trim()) return;
    updateDraft({ ingredients: [...draft.ingredients, ingredientInput.trim()] });
    setIngredientInput('');
  };

  const removeIngredient = (idx: number) => {
    updateDraft({ ingredients: draft.ingredients.filter((_, i) => i !== idx) });
  };

  const handleNext = () => {
    // 현재 항목을 "결정됨"으로 표시 (assignee나 details가 있으면)
    if (draft.assigneeId || draft.details) {
      updateDraft({ isDecided: true });
    }
    if (currentItem < template.decisionTemplates.length - 1) {
      setCurrentItem(currentItem + 1);
      setIngredientInput('');
    } else {
      // 모든 항목 완료 → 결정 목록 생성
      const decisions = template.decisionTemplates.map((tmpl, idx) => ({
        categoryId,
        title: tmpl.title,
        description: tmpl.description,
        schedule: tmpl.schedule,
        assigneeId: drafts[idx].assigneeId,
        details: drafts[idx].details,
        ingredients: drafts[idx].ingredients,
        isDecided: !!(drafts[idx].assigneeId || drafts[idx].details),
      }));
      onComplete(decisions);
    }
  };

  const isLast = currentItem === template.decisionTemplates.length - 1;
  const scheduleText = item.schedule.daysOfWeek.map((d) => DAY_NAMES[d]).join(', ');

  return (
    <div className="min-h-dvh bg-surface flex flex-col">
      {/* 헤더 */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-text-secondary">
            {template.category.icon} {template.category.name} ({currentStep}/{totalSteps})
          </span>
          <button onClick={onSkip} className="text-sm text-text-tertiary">
            건너뛰기
          </button>
        </div>
        {/* 진행 바 */}
        <div className="w-full h-1.5 bg-surface-tertiary rounded-full overflow-hidden">
          <div
            className="h-full bg-primary-500 rounded-full transition-all duration-300"
            style={{ width: `${((currentItem + 1) / template.decisionTemplates.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Q&A 본문 */}
      <div className="flex-1 px-6 overflow-auto">
        <div className="max-w-sm mx-auto">
          <h2 className="text-lg font-bold text-text-primary mt-4 mb-1">
            {item.title}
          </h2>
          {item.description && (
            <p className="text-text-secondary text-sm mb-1">{item.description}</p>
          )}
          <p className="text-text-tertiary text-xs mb-6">
            매주 {scheduleText}
          </p>

          {/* 질문 1: 누가? */}
          {item.needsAssignee && (
            <div className="mb-6">
              <p className="text-sm font-semibold text-text-primary mb-3">누가 담당하나요?</p>
              <div className="flex gap-2 flex-wrap">
                {members.map((m) => (
                  <button
                    key={m.userId}
                    onClick={() => updateDraft({
                      assigneeId: draft.assigneeId === m.userId ? null : m.userId,
                    })}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      draft.assigneeId === m.userId
                        ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 ring-2 ring-primary-400'
                        : 'bg-surface-secondary text-text-secondary hover:bg-surface-tertiary'
                    }`}
                  >
                    <span className="text-lg">{m.emoji}</span>
                    {m.name}
                  </button>
                ))}
                <button
                  onClick={() => updateDraft({ assigneeId: 'alternate' })}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    draft.assigneeId === 'alternate'
                      ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 ring-2 ring-primary-400'
                      : 'bg-surface-secondary text-text-secondary hover:bg-surface-tertiary'
                  }`}
                >
                  🔄 번갈아서
                </button>
              </div>
            </div>
          )}

          {/* 질문 2: 뭘? (상세 내용) */}
          {item.needsDetails && (
            <div className="mb-6">
              <p className="text-sm font-semibold text-text-primary mb-3">
                {template.category.name.includes('식단') ? '뭘 먹을까요?' : '구체적으로 뭘 할까요?'}
              </p>
              <input
                type="text"
                placeholder={item.detailsPlaceholder || '내용을 입력하세요'}
                value={draft.details}
                onChange={(e) => updateDraft({ details: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-surface-secondary border border-border text-text-primary text-[15px] outline-none focus:ring-2 focus:ring-primary-400"
              />
            </div>
          )}

          {/* 질문 3: 재료 (식단인 경우) */}
          {item.hasIngredients && (
            <div className="mb-6">
              <p className="text-sm font-semibold text-text-primary mb-3">
                필요한 재료가 있나요? <span className="font-normal text-text-tertiary">(선택)</span>
              </p>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  placeholder="재료 입력 (예: 감자)"
                  value={ingredientInput}
                  onChange={(e) => setIngredientInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addIngredient()}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-surface-secondary border border-border text-text-primary text-sm outline-none focus:ring-2 focus:ring-primary-400"
                />
                <button
                  onClick={addIngredient}
                  className="px-4 py-2.5 rounded-xl bg-primary-100 dark:bg-primary-900/30 text-primary-600 text-sm font-medium"
                >
                  추가
                </button>
              </div>
              {draft.ingredients.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {draft.ingredients.map((ing, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-surface-tertiary text-text-secondary text-sm"
                    >
                      {ing}
                      <button
                        onClick={() => removeIngredient(idx)}
                        className="text-text-tertiary hover:text-red-500 ml-0.5"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          <p className="text-text-tertiary text-xs mb-4">
            지금 정하지 않아도 괜찮아요. 나중에 대시보드에서 수정할 수 있습니다.
          </p>
        </div>
      </div>

      {/* 하단 버튼 */}
      <div className="px-6 pb-8 pt-4 safe-bottom">
        <button
          onClick={handleNext}
          className="w-full py-3 rounded-xl bg-primary-600 text-white font-semibold text-[15px] hover:bg-primary-700 active:scale-[0.98] transition-all"
        >
          {isLast ? '완료' : '다음'}
        </button>
        <p className="text-center text-text-tertiary text-xs mt-3">
          {currentItem + 1} / {template.decisionTemplates.length}
        </p>
      </div>
    </div>
  );
}
