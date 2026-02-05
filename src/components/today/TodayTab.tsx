import { useMemo } from 'react';
import { Trophy } from 'lucide-react';
import { useRoutineStore } from '../../stores/routineStore';
import { formatDate, formatDisplayDate } from '../../utils/date';
import RoutineCheckItem from './RoutineCheckItem';
import KeywordFilter from '../common/KeywordFilter';
import type { CheckLevel } from '../../types';

export default function TodayTab() {
  const routines = useRoutineStore((s) => s.routines);
  const records = useRoutineStore((s) => s.records);
  const setCheck = useRoutineStore((s) => s.setCheck);
  const selectedKeyword = useRoutineStore((s) => s.selectedKeyword);
  const getFilteredRoutines = useRoutineStore((s) => s.getFilteredRoutines);

  const today = new Date();
  const dateStr = formatDate(today);
  const todayRecord = records.find((r) => r.date === dateStr);
  
  const activeRoutines = useMemo(() => {
    return getFilteredRoutines().sort((a, b) => a.order - b.order);
  }, [routines, selectedKeyword]);

  const { completedCount, rate } = useMemo(() => {
    const total = activeRoutines.length;
    if (total === 0) return { completedCount: 0, rate: 0 };
    const completed = activeRoutines.filter((r) => todayRecord?.checks[r.id] && todayRecord.checks[r.id] !== 'none').length;
    return { completedCount: completed, rate: Math.round((completed / total) * 100) };
  }, [activeRoutines, todayRecord]);

  const handleToggle = (routineId: string, level: CheckLevel) => {
    setCheck(dateStr, routineId, level);
  };

  return (
    <div className="px-4 pt-6">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-text-primary">오늘의 루틴</h1>
        <p className="text-text-secondary mt-1">{formatDisplayDate(today)}</p>
      </div>

      {/* 키워드 필터 */}
      <div className="mb-4">
        <KeywordFilter />
      </div>

      {/* 진행률 */}
      <div className="mb-6 p-4 rounded-2xl bg-surface-secondary border border-border">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-text-secondary">
            {selectedKeyword ? `${selectedKeyword} 달성률` : '달성률'}
          </span>
          <span className="text-sm font-semibold text-text-primary">{completedCount}/{activeRoutines.length}</span>
        </div>
        <div className="w-full h-3 bg-surface-tertiary rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500 ease-out" style={{ width: `${rate}%`, background: rate === 100 ? 'linear-gradient(90deg, #22c55e, #a855f7)' : rate >= 50 ? 'linear-gradient(90deg, #22c55e, #3b82f6)' : '#22c55e' }} />
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-2xl font-bold text-text-primary">{rate}%</span>
          {rate === 100 && activeRoutines.length > 0 && <div className="flex items-center gap-1 text-done"><Trophy size={16} /><span className="text-sm font-semibold">완벽!</span></div>}
        </div>
      </div>

      {/* 루틴 목록 */}
      {activeRoutines.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-text-tertiary text-lg mb-2">
            {selectedKeyword ? `'${selectedKeyword}' 루틴이 없습니다` : '등록된 루틴이 없습니다'}
          </p>
          <p className="text-text-tertiary text-sm">설정 탭에서 루틴을 추가해보세요</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3 pb-4">
          {activeRoutines.map((routine) => (
            <RoutineCheckItem key={routine.id} routine={routine} currentLevel={todayRecord?.checks[routine.id] || 'none'} onToggle={handleToggle} />
          ))}
        </div>
      )}
    </div>
  );
}
