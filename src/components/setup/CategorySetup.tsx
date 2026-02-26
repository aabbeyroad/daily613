// ========================================
// 카테고리 선택 UI
// 온보딩에서 어떤 카테고리를 설정할지 선택
// ========================================

import type { CategoryTemplate } from '../../types';

interface Props {
  templates: CategoryTemplate[];
  selected: number[];
  onToggle: (index: number) => void;
}

export default function CategorySetup({ templates, selected, onToggle }: Props) {
  return (
    <div className="space-y-3">
      {templates.map((tmpl, idx) => {
        const isSelected = selected.includes(idx);
        return (
          <button
            key={idx}
            onClick={() => onToggle(idx)}
            className={`w-full text-left p-4 rounded-xl border-2 transition-all active:scale-[0.98] ${
              isSelected
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                : 'border-border bg-surface-secondary hover:bg-surface-tertiary'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{tmpl.category.icon}</span>
              <div className="flex-1">
                <h3 className="font-semibold text-text-primary text-[15px]">{tmpl.category.name}</h3>
                <p className="text-text-tertiary text-xs mt-0.5">{tmpl.category.description}</p>
              </div>
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                isSelected
                  ? 'border-primary-500 bg-primary-500'
                  : 'border-border'
              }`}>
                {isSelected && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12l5 5L20 7" />
                  </svg>
                )}
              </div>
            </div>
            <p className="text-text-tertiary text-xs mt-2 ml-10">
              {tmpl.decisionTemplates.length}개 항목
            </p>
          </button>
        );
      })}
    </div>
  );
}
