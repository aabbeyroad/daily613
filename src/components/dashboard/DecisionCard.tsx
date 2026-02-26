// ========================================
// 결정 카드 - 개별 결정 항목 표시
// ========================================

import type { Decision, HouseholdMember } from '../../types';

interface Props {
  decision: Decision;
  members: HouseholdMember[];
  compact?: boolean;
  onEdit: () => void;
}

export default function DecisionCard({ decision, members, compact, onEdit }: Props) {
  const assignee = decision.assigneeId === 'alternate'
    ? { name: '번갈아서', emoji: '🔄' }
    : members.find((m) => m.userId === decision.assigneeId);

  return (
    <button
      onClick={onEdit}
      className={`w-full text-left rounded-xl border transition-all active:scale-[0.99] ${
        decision.isDecided
          ? 'bg-white dark:bg-surface-secondary border-border'
          : 'bg-amber-50/50 dark:bg-amber-900/10 border-amber-200/50 dark:border-amber-800/30'
      } ${compact ? 'p-3' : 'p-4'}`}
    >
      <div className="flex items-center gap-3">
        {/* 상태 아이콘 */}
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${
          decision.isDecided
            ? 'bg-green-100 dark:bg-green-900/20'
            : 'bg-amber-100 dark:bg-amber-900/20'
        }`}>
          {decision.isDecided ? '✅' : '❓'}
        </div>

        {/* 내용 */}
        <div className="flex-1 min-w-0">
          <p className={`font-medium text-text-primary ${compact ? 'text-sm' : 'text-[15px]'}`}>
            {decision.title}
          </p>
          {decision.details && (
            <p className="text-text-secondary text-xs mt-0.5 truncate">
              {decision.details}
            </p>
          )}
        </div>

        {/* 담당자 */}
        {assignee && (
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-surface-tertiary flex-shrink-0">
            <span className="text-sm">{assignee.emoji}</span>
            {!compact && (
              <span className="text-xs text-text-secondary">{assignee.name}</span>
            )}
          </div>
        )}

        {/* 미결정 표시 */}
        {!decision.isDecided && !assignee && (
          <span className="text-xs text-amber-600 dark:text-amber-400 font-medium flex-shrink-0">
            미결정
          </span>
        )}
      </div>

      {/* 재료 태그 (확장 뷰) */}
      {!compact && decision.ingredients.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2 ml-11">
          {decision.ingredients.map((ing, idx) => (
            <span
              key={idx}
              className="text-xs px-2 py-0.5 rounded-full bg-surface-tertiary text-text-tertiary"
            >
              {ing}
            </span>
          ))}
        </div>
      )}
    </button>
  );
}
