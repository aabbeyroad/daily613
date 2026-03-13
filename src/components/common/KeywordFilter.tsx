import { useRoutineStore } from '../../stores/routineStore';

export default function KeywordFilter() {
  const keywords = useRoutineStore((s) => s.keywords);
  const selectedKeyword = useRoutineStore((s) => s.selectedKeyword);
  const setSelectedKeyword = useRoutineStore((s) => s.setSelectedKeyword);

  if (keywords.length === 0) return null;

  return (
    <div className="chip-row">
      <button
        onClick={() => setSelectedKeyword(null)}
        className={`chip ${selectedKeyword === null ? 'chip--active' : ''}`}
      >
        전체
      </button>
      {keywords.map((kw) => (
        <button
          key={kw}
          onClick={() => setSelectedKeyword(selectedKeyword === kw ? null : kw)}
          className={`chip ${selectedKeyword === kw ? 'chip--active' : ''}`}
        >
          {kw}
        </button>
      ))}
    </div>
  );
}
