import { useRoutineStore } from '../../stores/routineStore';

export default function KeywordFilter() {
  const keywords = useRoutineStore((s) => s.keywords);
  const selectedKeyword = useRoutineStore((s) => s.selectedKeyword);
  const setSelectedKeyword = useRoutineStore((s) => s.setSelectedKeyword);

  if (keywords.length === 0) return null;

  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4">
      <button
        onClick={() => setSelectedKeyword(null)}
        className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
          selectedKeyword === null
            ? 'bg-primary-600 text-white'
            : 'bg-surface-tertiary text-text-secondary'
        }`}
      >
        전체
      </button>
      {keywords.map((kw) => (
        <button
          key={kw}
          onClick={() => setSelectedKeyword(selectedKeyword === kw ? null : kw)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
            selectedKeyword === kw
              ? 'bg-primary-600 text-white'
              : 'bg-surface-tertiary text-text-secondary'
          }`}
        >
          {kw}
        </button>
      ))}
    </div>
  );
}
