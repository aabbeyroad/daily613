import { useMemo } from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useRoutineStore } from '../../stores/routineStore';
import { formatDate, getWeekDays } from '../../utils/date';
import KeywordFilter from '../common/KeywordFilter';
import WeeklyRoutineGrid from '../stats/WeeklyRoutineGrid';

export default function WeeklyTab() {
  const getWeeklyScore = useRoutineStore((s) => s.getWeeklyScore);
  const getWeeklyRate = useRoutineStore((s) => s.getWeeklyRate);

  const today = new Date();
  const weekDays = getWeekDays(today);
  const weekStart = formatDate(weekDays[0]);
  const weekEnd = formatDate(weekDays[6]);

  const weeklyScore = useMemo(() => getWeeklyScore(weekStart, weekEnd), [weekStart, weekEnd]);
  const weeklyRate = useMemo(() => getWeeklyRate(weekStart, weekEnd), [weekStart, weekEnd]);

  const weekLabel = `${format(weekDays[0], 'M월 d일', { locale: ko })} – ${format(weekDays[6], 'M월 d일', { locale: ko })}`;

  return (
    <div className="px-4 pt-5 pb-32 space-y-5">
      {/* 헤더 */}
      <div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--ds-text-primary)' }}>주간</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--ds-text-tertiary)' }}>{weekLabel}</p>
      </div>

      {/* 주간 요약 카드 */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl p-4" style={{ background: 'var(--ds-surface)' }}>
          <p className="text-xs font-medium mb-1" style={{ color: 'var(--ds-text-tertiary)' }}>주간 이행률</p>
          <p className="text-2xl font-bold" style={{ color: 'var(--ds-accent)' }}>{weeklyRate}%</p>
        </div>
        <div className="rounded-2xl p-4" style={{ background: 'var(--ds-surface)' }}>
          <p className="text-xs font-medium mb-1" style={{ color: 'var(--ds-text-tertiary)' }}>주간 점수</p>
          <p className="text-2xl font-bold" style={{ color: 'var(--ds-accent)' }}>{weeklyScore}</p>
        </div>
      </div>

      {/* 키워드 필터 */}
      <KeywordFilter />

      {/* 주간 루틴 그리드 */}
      <div className="rounded-2xl p-4" style={{ background: 'var(--ds-surface)' }}>
        <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--ds-text-primary)' }}>루틴별 달성 현황</h2>
        <WeeklyRoutineGrid />
      </div>
    </div>
  );
}
