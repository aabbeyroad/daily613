import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, isSameMonth, isToday } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useRoutineStore } from '../../stores/routineStore';
import { formatDate } from '../../utils/date';

export default function Calendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const records = useRoutineStore((s) => s.records);
  const routines = useRoutineStore((s) => s.routines);
  const reflections = useRoutineStore((s) => s.reflections);
  const selectedKeyword = useRoutineStore((s) => s.selectedKeyword);
  const getFilteredRoutines = useRoutineStore((s) => s.getFilteredRoutines);

  const filteredRoutines = useMemo(() => getFilteredRoutines(), [routines, selectedKeyword]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDay = getDay(monthStart);
  const adjustedStartDay = startDay === 0 ? 6 : startDay - 1;

  const getDayRate = (date: Date): number => {
    const dateStr = formatDate(date);
    const record = records.find((r) => r.date === dateStr);
    if (!record || filteredRoutines.length === 0) return 0;
    const completed = filteredRoutines.filter((r) => record.checks[r.id] && record.checks[r.id] !== 'none').length;
    return Math.round((completed / filteredRoutines.length) * 100);
  };

  const getRateColor = (rate: number): string => {
    if (rate === 0) return 'bg-surface-tertiary';
    if (rate < 30) return 'bg-red-200 dark:bg-red-900';
    if (rate < 60) return 'bg-yellow-200 dark:bg-yellow-900';
    if (rate < 100) return 'bg-green-200 dark:bg-green-900';
    return 'bg-green-500';
  };

  const selectedReflection = selectedDate ? reflections.find((r) => r.date === selectedDate && r.type === 'daily') : null;
  const selectedRecord = selectedDate ? records.find((r) => r.date === selectedDate) : null;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} aria-label="이전 달" className="p-2.5"><ChevronLeft size={20} /></button>
        <span className="font-medium">{format(currentMonth, 'yyyy년 M월', { locale: ko })}</span>
        <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} aria-label="다음 달" className="p-2.5"><ChevronRight size={20} /></button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['월', '화', '수', '목', '금', '토', '일'].map((d) => (
          <div key={d} className="text-center text-xs text-text-tertiary py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: adjustedStartDay }).map((_, i) => (<div key={`empty-${i}`} />))}
        {days.map((day) => {
          const rate = getDayRate(day);
          const dateStr = formatDate(day);
          return (
            <button
              key={dateStr}
              onClick={() => setSelectedDate(dateStr)}
              aria-label={`${format(day, 'M월 d일', { locale: ko })} 달성률 ${rate}%`}
              className={`aspect-square rounded-lg flex items-center justify-center text-xs font-medium transition-all ${getRateColor(rate)} ${isToday(day) ? 'ring-2 ring-primary-500' : ''} ${!isSameMonth(day, currentMonth) ? 'opacity-30' : ''}`}
            >
              {format(day, 'd')}
            </button>
          );
        })}
      </div>
      {selectedDate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" role="dialog" aria-labelledby="cal-detail-title" onClick={() => setSelectedDate(null)}>
          <div className="bg-surface rounded-2xl p-5 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 id="cal-detail-title" className="font-bold text-lg">{selectedDate}</h3>
              <button onClick={() => setSelectedDate(null)} aria-label="닫기" className="p-2.5"><X size={20} /></button>
            </div>
            {selectedKeyword && (
              <div className="mb-3 text-xs text-primary-600 dark:text-primary-400">
                {selectedKeyword} 필터 적용 중
              </div>
            )}
            {selectedRecord && (
              <div className="mb-4">
                <div className="text-sm text-text-secondary mb-2">루틴 달성</div>
                <div className="space-y-1">
                  {filteredRoutines.map((r) => {
                    const level = selectedRecord.checks[r.id] || 'none';
                    return (
                      <div key={r.id} className="flex items-center justify-between text-sm">
                        <span>{r.name}</span>
                        <span className={level === 'max' ? 'text-max' : level === 'more' ? 'text-more' : level === 'done' ? 'text-done' : 'text-text-tertiary'}>
                          {level === 'none' ? '-' : level.toUpperCase()}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {selectedReflection ? (
              <div>
                <div className="text-sm text-text-secondary mb-2">회고</div>
                {selectedReflection.keep && <p className="text-sm mb-1"><span className="text-done font-bold">K:</span> {selectedReflection.keep}</p>}
                {selectedReflection.problem && <p className="text-sm mb-1"><span className="text-red-500 font-bold">P:</span> {selectedReflection.problem}</p>}
                {selectedReflection.try && <p className="text-sm"><span className="text-more font-bold">T:</span> {selectedReflection.try}</p>}
              </div>
            ) : (
              <p className="text-sm text-text-tertiary">작성된 회고가 없습니다.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
