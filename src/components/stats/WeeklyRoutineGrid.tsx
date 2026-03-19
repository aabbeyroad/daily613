import { useMemo } from 'react';
import { useRoutineStore } from '../../stores/routineStore';
import { formatDate, getWeekDays } from '../../utils/date';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

const levelColors = {
  none: 'bg-surface-tertiary',
  done: 'bg-done',
  more: 'bg-more',
  max: 'bg-max',
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
      <div className="text-center py-6 text-text-tertiary text-sm">
        등록된 루틴이 없습니다
      </div>
    );
  }

  return (
    <div className="overflow-x-auto -mx-4 px-4">
      <div className="min-w-[320px]">
        {/* 요일 헤더 */}
        <div className="flex mb-2">
          <div className="w-24 flex-shrink-0" />
          <div className="flex flex-1 gap-1">
            {weekDays.map((day) => (
              <div
                key={day.toISOString()}
                className={`flex-1 text-center text-xs font-medium py-1 ${
                  isToday(day) ? 'text-primary-600' : 'text-text-tertiary'
                }`}
              >
                <div>{format(day, 'EEE', { locale: ko })}</div>
                <div className={`text-[10px] ${isToday(day) ? 'font-bold' : ''}`}>
                  {format(day, 'd')}
                </div>
              </div>
            ))}
          </div>
          {/* 이행률 열 헤더 */}
          <div className="w-10 flex-shrink-0 flex items-center justify-center">
            <span className="text-[10px] text-text-tertiary font-medium">달성</span>
          </div>
        </div>

        {/* 루틴별 행 */}
        <div className="space-y-1.5">
          {filteredRoutines.map((routine) => (
            <div key={routine.id} className="flex items-center">
              <div className="w-24 flex-shrink-0 pr-2">
                <span className="text-xs font-medium text-text-primary truncate block">
                  {routine.name}
                </span>
              </div>
              <div className="flex flex-1 gap-1">
                {weekDays.map((day) => {
                  const level = getLevel(routine.id, day);
                  return (
                    <div
                      key={day.toISOString()}
                      className={`flex-1 h-[22px] rounded-md ${levelColors[level as keyof typeof levelColors]} ${
                        isToday(day) ? 'ring-2 ring-primary-500 ring-offset-1' : ''
                      } transition-all`}
                      title={`${routine.name} - ${format(day, 'M/d')} - ${level === 'none' ? '미완료' : level.toUpperCase()}`}
                    />
                  );
                })}
              </div>
              {/* 루틴별 이행률 */}
              <div className="w-10 flex-shrink-0 flex items-center justify-center">
                <span className={`text-[10px] font-bold ${
                  (routineRates[routine.id] ?? 0) >= 80 ? 'text-done' :
                  (routineRates[routine.id] ?? 0) >= 50 ? 'text-more' :
                  'text-text-tertiary'
                }`}>
                  {routineRates[routine.id] ?? 0}%
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* 날짜별 전체 이행률 행 */}
        <div className="flex items-center mt-2 pt-2 border-t border-border">
          <div className="w-24 flex-shrink-0 pr-2">
            <span className="text-[10px] font-medium text-text-tertiary">전체 이행률</span>
          </div>
          <div className="flex flex-1 gap-1">
            {dailyRates.map((rate, i) => (
              <div key={weekDays[i].toISOString()} className="flex-1 text-center">
                {rate !== null ? (
                  <span className={`text-[10px] font-bold ${
                    rate >= 80 ? 'text-done' :
                    rate >= 50 ? 'text-more' :
                    'text-text-tertiary'
                  }`}>
                    {rate}%
                  </span>
                ) : (
                  <span className="text-[10px] text-text-tertiary">-</span>
                )}
              </div>
            ))}
          </div>
          <div className="w-10 flex-shrink-0" />
        </div>

        {/* 범례 */}
        <div className="flex items-center justify-center gap-4 mt-4 pt-3 border-t border-border">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-surface-tertiary" />
            <span className="text-[10px] text-text-tertiary">미완료</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-done" />
            <span className="text-[10px] text-text-tertiary">Done</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-more" />
            <span className="text-[10px] text-text-tertiary">More</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-max" />
            <span className="text-[10px] text-text-tertiary">Max</span>
          </div>
        </div>
      </div>
    </div>
  );
}
