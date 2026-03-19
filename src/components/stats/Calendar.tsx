import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, isSameMonth, isToday } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useRoutineStore } from '../../stores/routineStore';
import { formatDate } from '../../utils/date';
import { Badge, IconButton, Modal, Notice } from '../ui/primitives';

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

  const selectedReflection = selectedDate ? reflections.find((r) => r.date === selectedDate && r.type === 'daily') : null;
  const selectedRecord = selectedDate ? records.find((r) => r.date === selectedDate) : null;

  const getRateStyle = (rate: number) => {
    if (rate === 0) return { background: 'var(--ds-bg-secondary)', color: 'var(--ds-text-tertiary)' };
    if (rate < 30) return { background: 'rgba(201, 72, 92, 0.14)', color: 'var(--ds-danger)' };
    if (rate < 60) return { background: 'rgba(255, 184, 0, 0.16)', color: 'var(--ds-warning)' };
    if (rate < 100) return { background: 'rgba(52, 168, 83, 0.14)', color: 'var(--ds-success)' };
    return { background: 'var(--color-done)', color: '#fff' };
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <IconButton onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} aria-label="이전 달">
          <ChevronLeft size={18} />
        </IconButton>
        <span className="text-[15px] font-semibold" style={{ color: 'var(--ds-text-primary)' }}>{format(currentMonth, 'yyyy년 M월', { locale: ko })}</span>
        <IconButton onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} aria-label="다음 달">
          <ChevronRight size={18} />
        </IconButton>
      </div>
      <div className="mb-2 grid grid-cols-7 gap-2">
        {['월', '화', '수', '목', '금', '토', '일'].map((d) => (
          <div key={d} className="py-1 text-center text-xs" style={{ color: 'var(--ds-text-tertiary)' }}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: adjustedStartDay }).map((_, i) => (<div key={`empty-${i}`} />))}
        {days.map((day) => {
          const rate = getDayRate(day);
          const dateStr = formatDate(day);
          const style = getRateStyle(rate);
          return (
            <button
              key={dateStr}
              onClick={() => setSelectedDate(dateStr)}
              aria-label={`${format(day, 'M월 d일', { locale: ko })} 달성률 ${rate}%`}
              className="aspect-square rounded-[16px] text-xs font-semibold transition-all"
              style={{
                ...style,
                opacity: isSameMonth(day, currentMonth) ? 1 : 0.3,
                boxShadow: isToday(day) ? '0 0 0 2px rgba(54, 90, 168, 0.22)' : 'none',
              }}
            >
              {format(day, 'd')}
            </button>
          );
        })}
      </div>
      {selectedDate && (
        <Modal open={true} title={selectedDate} description="선택한 날짜의 루틴과 회고를 함께 확인합니다." onClose={() => setSelectedDate(null)} size="sm">
            {selectedKeyword && (
              <div className="mb-3">
                <Badge tone="accent">{selectedKeyword} 필터 적용 중</Badge>
              </div>
            )}
            {selectedRecord && (
              <div className="mb-4">
                <div className="mb-2 text-sm" style={{ color: 'var(--ds-text-secondary)' }}>루틴 달성</div>
                <div className="space-y-1">
                  {filteredRoutines.map((r) => {
                    const level = selectedRecord.checks[r.id] || 'none';
                    return (
                      <div key={r.id} className="flex items-center justify-between text-sm">
                        <span style={{ color: 'var(--ds-text-primary)' }}>{r.name}</span>
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
                <div className="mb-2 text-sm" style={{ color: 'var(--ds-text-secondary)' }}>회고</div>
                {selectedReflection.keep && <Notice tone="success" className="mb-2"><strong className="mr-1">K:</strong>{selectedReflection.keep}</Notice>}
                {selectedReflection.problem && <Notice tone="danger" className="mb-2"><strong className="mr-1">P:</strong>{selectedReflection.problem}</Notice>}
                {selectedReflection.try && <Notice><strong className="mr-1">T:</strong>{selectedReflection.try}</Notice>}
              </div>
            ) : (
              <p className="text-sm" style={{ color: 'var(--ds-text-tertiary)' }}>작성된 회고가 없습니다.</p>
            )}
        </Modal>
      )}
    </div>
  );
}
