import { useMemo } from 'react';
import { useRoutineStore } from '../../stores/routineStore';
import { formatDate, getWeekDays } from '../../utils/date';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Badge } from '../ui/primitives';

const levelColors = {
  none: 'var(--ds-bg-tertiary)',
  done: 'var(--color-done)',
  more: 'var(--color-more)',
  max: 'var(--color-max)',
};

export default function WeeklyRoutineGrid() {
  const routines = useRoutineStore((s) => s.routines);
  const records = useRoutineStore((s) => s.records);
  const selectedKeyword = useRoutineStore((s) => s.selectedKeyword);
  const getFilteredRoutines = useRoutineStore((s) => s.getFilteredRoutines);

  const today = new Date();
  const todayStr = formatDate(today);
  const weekDays = getWeekDays(today);

  const filteredRoutines = useMemo(() =>
    getFilteredRoutines().sort((a, b) => a.order - b.order),
    [routines, selectedKeyword]
  );

  const getLevel = (routineId: string, date: Date): string => {
    const dateStr = formatDate(date);
    const record = records.find((r) => r.date === dateStr);
    return record?.checks[routineId] || 'none';
  };

  const isToday = (date: Date): boolean => {
    return formatDate(date) === todayStr;
  };

  const isPastOrToday = (date: Date): boolean => {
    return formatDate(date) <= todayStr;
  };

  // 날짜별 전체 이행률 (하단 행)
  const dailyRates = useMemo(() => {
    return weekDays.map((day) => {
      if (!isPastOrToday(day)) return null;
      const total = filteredRoutines.length;
      if (total === 0) return null;
      const done = filteredRoutines.filter((r) => {
        const level = getLevel(r.id, day);
        return level !== 'none';
      }).length;
      return Math.round((done / total) * 100);
    });
  }, [weekDays, filteredRoutines, records]);

  // 루틴별 이행률 (우측 열) - 월요일부터 오늘까지만
  const routineRates = useMemo(() => {
    const pastDays = weekDays.filter((d) => isPastOrToday(d));
    const dayCount = pastDays.length;
    if (dayCount === 0) return {};
    const rates: Record<string, number> = {};
    filteredRoutines.forEach((routine) => {
      const done = pastDays.filter((day) => {
        const level = getLevel(routine.id, day);
        return level !== 'none';
      }).length;
      rates[routine.id] = Math.round((done / dayCount) * 100);
    });
    return rates;
  }, [weekDays, filteredRoutines, records]);

  if (filteredRoutines.length === 0) {
    return (
      <div className="py-6 text-center text-sm" style={{ color: 'var(--ds-text-tertiary)' }}>
        등록된 루틴이 없습니다
      </div>
    );
  }

  return (
    <div>
      <div className="data-grid">
        <table className="data-grid__table">
          <thead>
            <tr>
              <th>루틴</th>
              {weekDays.map((day) => (
                <th key={day.toISOString()}>
                  <div className="text-center">
                    <div>{format(day, 'EEE', { locale: ko })}</div>
                    <div className="mt-1 text-[10px]" style={{ color: isToday(day) ? 'var(--ds-accent)' : 'var(--ds-text-tertiary)' }}>{format(day, 'd')}</div>
                  </div>
                </th>
              ))}
              <th>달성</th>
            </tr>
          </thead>
          <tbody>
            {filteredRoutines.map((routine) => (
              <tr key={routine.id}>
                <td style={{ color: 'var(--ds-text-primary)', fontWeight: 600 }}>{routine.name}</td>
                {weekDays.map((day) => {
                  const level = getLevel(routine.id, day) as keyof typeof levelColors;
                  return (
                    <td key={day.toISOString()}>
                      <div
                        className="mx-auto h-[22px] w-[22px] rounded-[8px]"
                        style={{
                          background: levelColors[level],
                          boxShadow: isToday(day) ? '0 0 0 2px rgba(54, 90, 168, 0.22)' : 'none',
                        }}
                        title={`${routine.name} - ${format(day, 'M/d')} - ${level === 'none' ? '미완료' : level.toUpperCase()}`}
                      />
                    </td>
                  );
                })}
                <td style={{ color: 'var(--ds-text-primary)', fontWeight: 700 }}>{routineRates[routine.id] ?? 0}%</td>
              </tr>
            ))}
            <tr>
              <td style={{ color: 'var(--ds-text-secondary)', fontWeight: 600 }}>전체 이행률</td>
              {dailyRates.map((rate, i) => (
                <td key={weekDays[i].toISOString()}>
                  <div className="text-center text-[10px]" style={{ color: rate === null ? 'var(--ds-text-tertiary)' : 'var(--ds-text-primary)', fontWeight: rate === null ? 500 : 700 }}>
                    {rate !== null ? `${rate}%` : '-'}
                  </div>
                </td>
              ))}
              <td />
            </tr>
          </tbody>
        </table>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Badge tone="default">미완료</Badge>
        <Badge tone="success">Done</Badge>
        <Badge tone="accent">More</Badge>
        <span className="badge" style={{ background: 'rgba(109, 91, 208, 0.14)', color: 'var(--color-max)' }}>Max</span>
      </div>
    </div>
  );
}
