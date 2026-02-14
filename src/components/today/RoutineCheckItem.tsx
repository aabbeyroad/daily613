import { Check } from 'lucide-react';
import type { Routine, CheckLevel } from '../../types';

interface Props {
  routine: Routine;
  currentLevel: CheckLevel;
  onToggle: (routineId: string, level: CheckLevel) => void;
}

const levels: { key: CheckLevel; label: string; color: string; bg: string }[] = [
  { key: 'done', label: 'Done', color: 'text-done', bg: 'bg-done' },
  { key: 'more', label: 'More', color: 'text-more', bg: 'bg-more' },
  { key: 'max', label: 'Max', color: 'text-max', bg: 'bg-max' },
];

export default function RoutineCheckItem({ routine, currentLevel, onToggle }: Props) {
  const handleClick = (level: CheckLevel) => {
    onToggle(routine.id, currentLevel === level ? 'none' : level);
  };

  const getLevelIndex = (level: CheckLevel): number => {
    if (level === 'done') return 0;
    if (level === 'more') return 1;
    if (level === 'max') return 2;
    return -1;
  };

  const currentIndex = getLevelIndex(currentLevel);

  return (
    <div className={`p-4 rounded-xl border transition-all ${currentLevel !== 'none' ? 'bg-surface-secondary border-border' : 'bg-surface border-border'}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-text-primary">{routine.name}</h3>
        {routine.keywords.length > 0 && (
          <div className="flex gap-1">
            {routine.keywords.map((kw) => (
              <span key={kw} className="text-[10px] px-1.5 py-0.5 rounded bg-surface-tertiary text-text-tertiary">{kw}</span>
            ))}
          </div>
        )}
      </div>
      <div className="flex gap-2">
        {levels.map((level, idx) => {
          const isActive = currentIndex >= idx;
          const goalText = level.key === 'done' ? routine.doneGoal : level.key === 'more' ? routine.moreGoal : routine.maxGoal;
          return (
            <button
              key={level.key}
              onClick={() => handleClick(level.key)}
              className={`flex-1 py-1.5 px-3 rounded-lg border-2 transition-all active:scale-95 ${isActive ? `${level.bg} border-transparent text-white` : `border-border bg-surface ${level.color}`}`}
            >
              <div className="flex items-center justify-center gap-1.5">
                {isActive && <Check size={14} strokeWidth={3} />}
                <span className="text-xs font-bold">{level.label}</span>
              </div>
              <div className={`text-[10px] mt-0.5 truncate ${isActive ? 'text-white/80' : 'text-text-tertiary'}`}>{goalText}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
