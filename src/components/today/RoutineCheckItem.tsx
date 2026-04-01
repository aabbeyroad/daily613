import { Check } from 'lucide-react';
import { IconDisplay } from '../settings/RoutineForm';
import type { Routine, CheckLevel } from '../../types';
import { Badge } from '../ui/primitives';

interface Props {
  routine: Routine;
  currentLevel: CheckLevel;
  onToggle: (routineId: string, level: CheckLevel) => void;
}

const levels: { key: CheckLevel; label: string; color: string; bg: string }[] = [
  { key: 'done', label: 'Done', color: 'var(--color-done)', bg: 'rgba(52, 168, 83, 0.9)' },
  { key: 'more', label: 'Enough', color: 'var(--color-more)', bg: 'rgba(59, 130, 246, 0.9)' },
  { key: 'max', label: 'Full', color: 'var(--color-max)', bg: 'rgba(109, 91, 208, 0.92)' },
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
    <div
      className="card p-4 transition-all"
      style={{
        background: currentLevel !== 'none' ? 'var(--ds-bg-elevated)' : 'var(--ds-bg-secondary)',
        borderColor: currentLevel !== 'none' ? 'var(--ds-border-strong)' : 'var(--ds-border)',
      }}
    >
      <div className="mb-3 flex items-center gap-2.5">
        {routine.icon && <IconDisplay icon={routine.icon} size={20} />}
        <h3 className="flex-1 text-[15px] font-semibold" style={{ color: 'var(--ds-text-primary)' }}>{routine.name}</h3>
        {routine.keywords.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {routine.keywords.map((kw) => (
              <Badge key={kw} tone="accent">{kw}</Badge>
            ))}
          </div>
        )}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {levels.map((level, idx) => {
          const isActive = currentIndex >= idx;
          const goalText = level.key === 'done' ? routine.doneGoal : level.key === 'more' ? routine.moreGoal : routine.maxGoal;
          return (
            <button
              key={level.key}
              onClick={() => handleClick(level.key)}
              className="rounded-[20px] border px-2 py-3 text-center transition-all active:scale-95"
              style={{
                borderColor: isActive ? 'transparent' : 'var(--ds-border)',
                background: isActive ? level.bg : 'var(--ds-bg-secondary)',
                color: isActive ? '#fff' : level.color,
              }}
            >
              <div className="flex items-center justify-center gap-1">
                {isActive && <Check size={13} strokeWidth={3} />}
                <span className="text-xs font-bold">{level.label}</span>
              </div>
              {goalText ? (
                <div
                  className="mt-1 truncate text-center text-[10px]"
                  style={{ color: isActive ? 'rgba(255,255,255,0.76)' : 'var(--ds-text-tertiary)' }}
                >
                  {goalText}
                </div>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
