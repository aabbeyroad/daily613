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
    return formatDate(date) === formatDate(today);
  };

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
                      className={`flex-1 h-7 rounded-md ${levelColors[level as keyof typeof levelColors]} ${
                        isToday(day) ? 'ring-2 ring-primary-500 ring-offset-1' : ''
                      } transition-all`}
                      title={`${routine.name} - ${format(day, 'M/d')} - ${level === 'none' ? '미완료' : level.toUpperCase()}`}
                    />
                  );
                })}
              </div>
            </div>
          ))}
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
