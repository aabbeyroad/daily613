// ========================================
// 결정 수정 모달
// 대시보드에서 결정 항목을 탭하면 열리는 수정 화면
// ========================================

import { useState } from 'react';
import { useAppStore } from '../../stores/householdStore';
import type { Decision, HouseholdMember } from '../../types';
import { DAY_NAMES } from '../../data/templates';

interface Props {
  decision: Decision;
  members: HouseholdMember[];
  onClose: () => void;
}

export default function DecisionEditModal({ decision, members, onClose }: Props) {
  const updateDecision = useAppStore((s) => s.updateDecision);
  const removeDecision = useAppStore((s) => s.removeDecision);
  const getRecommendation = useAppStore((s) => s.getRecommendation);

  const [assigneeId, setAssigneeId] = useState(decision.assigneeId);
  const [details, setDetails] = useState(decision.details);
  const [ingredients, setIngredients] = useState(decision.ingredients);
  const [ingredientInput, setIngredientInput] = useState('');
  const [showDelete, setShowDelete] = useState(false);

  const recommendation = getRecommendation(decision.id);
  const scheduleText = decision.schedule.daysOfWeek.map((d) => DAY_NAMES[d]).join(', ');

  const handleSave = () => {
    updateDecision(decision.id, {
      assigneeId,
      details,
      ingredients,
      isDecided: !!(assigneeId || details),
    });
    onClose();
  };

  const handleDelete = () => {
    removeDecision(decision.id);
    onClose();
  };

  const addIngredient = () => {
    if (!ingredientInput.trim()) return;
    setIngredients([...ingredients, ingredientInput.trim()]);
    setIngredientInput('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* 배경 오버레이 */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* 모달 */}
      <div className="relative w-full max-w-lg bg-surface rounded-t-2xl sm:rounded-2xl max-h-[85vh] overflow-auto safe-bottom">
        {/* 핸들 바 */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 bg-surface-tertiary rounded-full" />
        </div>

        <div className="px-6 py-4">
          {/* 제목 */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-text-primary">{decision.title}</h2>
            <button onClick={onClose} className="text-text-tertiary p-1">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <p className="text-text-tertiary text-xs mb-5">매주 {scheduleText}</p>

          {/* 추천 (이전 내용이 있을 때) */}
          {recommendation && !details && (
            <button
              onClick={() => setDetails(recommendation)}
              className="w-full text-left p-3 mb-4 rounded-xl bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800"
            >
              <p className="text-xs text-primary-600 font-medium mb-0.5">💡 이전과 같이</p>
              <p className="text-sm text-text-primary">{recommendation}</p>
            </button>
          )}

          {/* 담당자 */}
          <div className="mb-5">
            <label className="text-sm font-semibold text-text-primary mb-2 block">담당</label>
            <div className="flex gap-2 flex-wrap">
              {members.map((m) => (
                <button
                  key={m.userId}
                  onClick={() => setAssigneeId(assigneeId === m.userId ? null : m.userId)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    assigneeId === m.userId
                      ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 ring-2 ring-primary-400'
                      : 'bg-surface-secondary text-text-secondary hover:bg-surface-tertiary'
                  }`}
                >
                  <span className="text-lg">{m.emoji}</span> {m.name}
                </button>
              ))}
              <button
                onClick={() => setAssigneeId(assigneeId === 'alternate' ? null : 'alternate')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  assigneeId === 'alternate'
                    ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 ring-2 ring-primary-400'
                    : 'bg-surface-secondary text-text-secondary hover:bg-surface-tertiary'
                }`}
              >
                🔄 번갈아서
              </button>
            </div>
          </div>

          {/* 상세 내용 */}
          <div className="mb-5">
            <label className="text-sm font-semibold text-text-primary mb-2 block">상세 내용</label>
            <input
              type="text"
              placeholder="예: 카레, 청소기 돌리기"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-surface-secondary border border-border text-text-primary text-[15px] outline-none focus:ring-2 focus:ring-primary-400"
            />
          </div>

          {/* 재료 */}
          <div className="mb-5">
            <label className="text-sm font-semibold text-text-primary mb-2 block">재료</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="재료 추가"
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
            {ingredients.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {ingredients.map((ing, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-surface-tertiary text-text-secondary text-sm"
                  >
                    {ing}
                    <button
                      onClick={() => setIngredients(ingredients.filter((_, i) => i !== idx))}
                      className="text-text-tertiary hover:text-red-500"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 버튼 */}
          <div className="flex gap-3 mt-6 mb-2">
            <button
              onClick={() => setShowDelete(true)}
              className="px-4 py-3 rounded-xl text-red-500 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/10 transition-all"
            >
              삭제
            </button>
            <button
              onClick={handleSave}
              className="flex-1 py-3 rounded-xl bg-primary-600 text-white font-semibold text-[15px] hover:bg-primary-700 active:scale-[0.98] transition-all"
            >
              저장
            </button>
          </div>

          {/* 삭제 확인 */}
          {showDelete && (
            <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 mt-3">
              <p className="text-sm text-red-700 dark:text-red-300 mb-3">정말 삭제할까요?</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowDelete(false)}
                  className="flex-1 py-2 rounded-lg text-sm bg-surface-secondary text-text-secondary"
                >
                  취소
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 py-2 rounded-lg text-sm bg-red-500 text-white font-medium"
                >
                  삭제
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
