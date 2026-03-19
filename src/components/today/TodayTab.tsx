import { useState, useMemo } from 'react';
import { Trophy, ChevronLeft, ChevronRight } from 'lucide-react';
import { addDays, subDays } from 'date-fns';
import { useRoutineStore } from '../../stores/routineStore';
import { formatDate, formatDisplayDate } from '../../utils/date';
import RoutineCheckItem from './RoutineCheckItem';
import KeywordFilter from '../common/KeywordFilter';
import type { CheckLevel } from '../../types';
import { Badge, Button, Card, ProgressBar, Screen, ScreenHeader, SectionCard } from '../ui/primitives';

export default function TodayTab() {
  const routines = useRoutineStore((s) => s.routines);
  const records = useRoutineStore((s) => s.records);
  const setCheck = useRoutineStore((s) => s.setCheck);
  const selectedKeyword = useRoutineStore((s) => s.selectedKeyword);
  const getFilteredRoutines = useRoutineStore((s) => s.getFilteredRoutines);

  const [currentDate, setCurrentDate] = useState(new Date());
  const todayStr = formatDate(new Date());
  const dateStr = formatDate(currentDate);
  const isToday = dateStr === todayStr;
  const dayRecord = records.find((r) => r.date === dateStr);

  const activeRoutines = useMemo(() => {
    return getFilteredRoutines().sort((a, b) => a.order - b.order);
  }, [routines, selectedKeyword]);

  const { completedCount, rate } = useMemo(() => {
    const total = activeRoutines.length;
    if (total === 0) return { completedCount: 0, rate: 0 };
    const completed = activeRoutines.filter((r) => dayRecord?.checks[r.id] && dayRecord.checks[r.id] !== 'none').length;
    return { completedCount: completed, rate: Math.round((completed / total) * 100) };
  }, [activeRoutines, dayRecord]);

  const handleToggle = (routineId: string, level: CheckLevel) => {
    setCheck(dateStr, routineId, level);
  };

  const goToToday = () => setCurrentDate(new Date());

  return (
    <Screen>
      <ScreenHeader
        eyebrow="Today"
        title="오늘의 루틴"
        description="복잡한 장식 없이, 지금 해야 할 일과 오늘의 진척만 선명하게 보여줍니다."
        trailing={rate === 100 && activeRoutines.length > 0 ? <Badge tone="success"><Trophy size={12} />완벽</Badge> : null}
      />

      <Card className="p-4 sm:p-5">
        <div className="mb-4 flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => setCurrentDate((d) => subDays(d, 1))} aria-label="이전 날짜">
            <ChevronLeft size={18} />
          </Button>
          <button
            onClick={goToToday}
            className="rounded-full px-4 py-2 text-[15px] font-semibold transition-colors"
            style={{ color: isToday ? 'var(--ds-text-secondary)' : 'var(--ds-accent)' }}
          >
            {formatDisplayDate(currentDate)}
          </button>
          <Button variant="ghost" size="icon" onClick={() => setCurrentDate((d) => addDays(d, 1))} aria-label="다음 날짜">
            <ChevronRight size={18} />
          </Button>
        </div>

        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <div className="text-[44px] font-bold leading-none tracking-[-0.06em]" style={{ color: 'var(--ds-text-primary)' }}>
              {rate}
              <span className="ml-1 text-lg font-medium" style={{ color: 'var(--ds-text-tertiary)' }}>%</span>
            </div>
            <p className="mt-2 text-[13px]" style={{ color: 'var(--ds-text-secondary)' }}>
              {completedCount} / {activeRoutines.length} 완료
            </p>
          </div>
          {selectedKeyword ? <Badge tone="accent">{selectedKeyword}</Badge> : null}
        </div>
        <ProgressBar value={rate} />
      </Card>

      <SectionCard title="필터" subtitle="키워드로 오늘의 집중 영역을 좁혀볼 수 있어요.">
        <KeywordFilter />
      </SectionCard>

      <SectionCard title="루틴 목록" subtitle="단계별 체크를 한 화면에서 빠르게 정리합니다.">
        {activeRoutines.length === 0 ? (
          <div className="py-12 text-center">
            <p className="mb-1 text-[15px]" style={{ color: 'var(--ds-text-secondary)' }}>
              {selectedKeyword ? `'${selectedKeyword}' 루틴이 없습니다` : '등록된 루틴이 없습니다'}
            </p>
            <p className="text-[13px]" style={{ color: 'var(--ds-text-tertiary)' }}>설정에서 루틴을 추가해보세요</p>
          </div>
        ) : (
          <div className="list">
            {activeRoutines.map((routine) => (
              <RoutineCheckItem key={routine.id} routine={routine} currentLevel={dayRecord?.checks[routine.id] || 'none'} onToggle={handleToggle} />
            ))}
          </div>
        )}
      </SectionCard>
    </Screen>
  );
}
