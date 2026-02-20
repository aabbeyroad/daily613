import { Check } from 'lucide-react';
import type { Routine, CheckLevel } from '../../types';

interface Props {
  routine: Routine;
  currentLevel: CheckLevel;
  onToggle: (routineId: string, level: CheckLevel) => void;
}

const levels: { key: CheckLevel; label: string; color: string; bg: string; activeBorder: string }[] = [
  { key: 'done', label: 'Done', color: 'text-done', bg: 'bg-done', activeBorder: 'border-done' },
  { key: 'more', label: 'More', color: 'text-more', bg: 'bg-more', activeBorder: 'border-more' },
  { key: 'max', label: 'Max', color: 'text-max', bg: 'bg-max', activeBorder: 'border-max' },
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
    <div className={`p-3.5 rounded-2xl border transition-all ${currentLevel !== 'none' ? 'bg-surface-secondary border-border shadow-sm' : 'bg-surface border-border'}`}>
      <div className="flex items-center gap-2.5 mb-2.5">
        {routine.icon && (
          <span className="text-lg leading-none">{routine.icon}</span>
        )}
        <h3 className="font-semibold text-[15px] text-text-primary flex-1">{routine.name}</h3>
        {routine.keywords.length > 0 && (
          <div className="flex gap-1">
            {routine.keywords.map((kw) => (
              <span key={kw} className="text-[10px] px-1.5 py-0.5 rounded-md bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-medium">{kw}</span>
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
              className={`flex-1 py-2 px-2 rounded-xl border-2 transition-all active:scale-95 ${isActive ? `${level.bg} border-transparent text-white` : `border-border bg-surface-secondary ${level.color}`}`}
            >
              <div className="flex items-center justify-center gap-1">
                {isActive && <Check size={13} strokeWidth={3} />}
                <span className="text-xs font-bold">{level.label}</span>
              </div>
              {goalText && <div className={`text-[10px] mt-0.5 truncate text-center ${isActive ? 'text-white/70' : 'text-text-tertiary'}`}>{goalText}</div>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
