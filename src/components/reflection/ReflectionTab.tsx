import { useState, useMemo } from 'react';
import { Plus, Edit3, Trash2, ChevronLeft, ChevronRight, ThumbsUp, Minus, ThumbsDown } from 'lucide-react';
import { addWeeks, subWeeks, addDays, subDays } from 'date-fns';
import { useRoutineStore } from '../../stores/routineStore';
import { formatDate, formatDisplayDate, getWeekKey, getWeekDays } from '../../utils/date';
import { IconDisplay } from '../settings/RoutineForm';
import ReflectionForm from './ReflectionForm';
import ConfirmDialog from '../common/ConfirmDialog';
import type { Reflection, RoutineEvaluation } from '../../types';

const EVAL_DISPLAY: Record<RoutineEvaluation, { label: string; icon: typeof ThumbsUp; color: string; bg: string }> = {
  good: { label: 'Good', icon: ThumbsUp, color: 'text-done', bg: 'bg-green-50 dark:bg-green-900/10' },
  soso: { label: 'Soso', icon: Minus, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/10' },
  bad: { label: 'Bad', icon: ThumbsDown, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/10' },
};

export default function ReflectionTab() {
  const reflections = useRoutineStore((s) => s.reflections);
  const routines = useRoutineStore((s) => s.routines);
  const deleteReflection = useRoutineStore((s) => s.deleteReflection);
  const [viewType, setViewType] = useState<'daily' | 'weekly'>('daily');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showForm, setShowForm] = useState(false);
  const [editingReflection, setEditingReflection] = useState<Reflection | undefined>();
  const [confirmTarget, setConfirmTarget] = useState<Reflection | null>(null);

  const dateKey = viewType === 'daily' ? formatDate(currentDate) : getWeekKey(currentDate);
  const weekDays = getWeekDays(currentDate);
  const displayLabel = viewType === 'daily' ? formatDisplayDate(currentDate) : `${formatDate(weekDays[0])} ~ ${formatDate(weekDays[6])}`;
  const currentReflection = useMemo(() => reflections.find((r) => r.date === dateKey && r.type === viewType), [reflections, dateKey, viewType]);
  const allReflections = useMemo(() => reflections.filter((r) => r.type === viewType).sort((a, b) => b.date.localeCompare(a.date)), [reflections, viewType]);

  const navigate = (dir: 'prev' | 'next') => {
    if (viewType === 'daily') setCurrentDate((d) => (dir === 'prev' ? subDays(d, 1) : addDays(d, 1)));
    else setCurrentDate((d) => (dir === 'prev' ? subWeeks(d, 1) : addWeeks(d, 1)));
  };

  const handleEdit = (reflection: Reflection) => { setEditingReflection(reflection); setShowForm(true); };
  const handleDelete = (reflection: Reflection) => { setConfirmTarget(reflection); };
  const handleNew = () => { setEditingReflection(undefined); setShowForm(true); };

  // 루틴 이름 조회 헬퍼
  const getRoutineName = (routineId: string) => routines.find((r) => r.id === routineId)?.name || '삭제된 루틴';
  const getRoutineIcon = (routineId: string) => routines.find((r) => r.id === routineId)?.icon;

  return (
    <div className="px-4 pt-5 pb-4">
      {/* 세그먼트 컨트롤 */}
      <div className="flex p-1 rounded-xl bg-surface-secondary border border-border mb-4" role="tablist">
        <button onClick={() => setViewType('daily')} role="tab" aria-selected={viewType === 'daily'} className={`flex-1 py-2 rounded-lg text-[13px] font-semibold transition-all ${viewType === 'daily' ? 'bg-surface text-text-primary shadow-sm' : 'text-text-tertiary'}`}>일간 회고</button>
        <button onClick={() => setViewType('weekly')} role="tab" aria-selected={viewType === 'weekly'} className={`flex-1 py-2 rounded-lg text-[13px] font-semibold transition-all ${viewType === 'weekly' ? 'bg-surface text-text-primary shadow-sm' : 'text-text-tertiary'}`}>주간 회고</button>
      </div>

      {/* 날짜 네비게이션 */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => navigate('prev')} aria-label="이전 기간" className="p-2.5 rounded-xl hover:bg-surface-secondary transition-colors"><ChevronLeft size={20} className="text-text-secondary" /></button>
        <span className="font-semibold text-[13px] text-text-primary">{displayLabel}</span>
        <button onClick={() => navigate('next')} aria-label="다음 기간" className="p-2.5 rounded-xl hover:bg-surface-secondary transition-colors"><ChevronRight size={20} className="text-text-secondary" /></button>
      </div>

      {/* 현재 회고 */}
      <div className="mb-5 p-4 rounded-2xl bg-surface-secondary border border-border">
        {currentReflection ? (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-[13px] text-text-secondary uppercase tracking-wide">KPT 회고</h3>
              <div className="flex gap-0.5">
                <button onClick={() => handleEdit(currentReflection)} aria-label="회고 수정" className="p-2.5 rounded-xl hover:bg-surface-tertiary transition-colors"><Edit3 size={15} className="text-text-tertiary" /></button>
                <button onClick={() => handleDelete(currentReflection)} aria-label="회고 삭제" className="p-2.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"><Trash2 size={15} className="text-red-400" /></button>
              </div>
            </div>
            <div className="space-y-3">
              {currentReflection.keep && (
                <div className="p-3 rounded-xl bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/20">
                  <div className="text-[11px] font-bold text-done mb-1 uppercase tracking-wide">Keep</div>
                  <p className="text-[13px] text-text-primary whitespace-pre-wrap leading-relaxed">{currentReflection.keep}</p>
                </div>
              )}
              {currentReflection.problem && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20">
                  <div className="text-[11px] font-bold text-red-500 mb-1 uppercase tracking-wide">Problem</div>
                  <p className="text-[13px] text-text-primary whitespace-pre-wrap leading-relaxed">{currentReflection.problem}</p>
                </div>
              )}
              {currentReflection.try && (
                <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20">
                  <div className="text-[11px] font-bold text-more mb-1 uppercase tracking-wide">Try</div>
                  <p className="text-[13px] text-text-primary whitespace-pre-wrap leading-relaxed">{currentReflection.try}</p>
                </div>
              )}
            </div>

            {/* 루틴별 평가 표시 (주간 회고에서만) */}
            {currentReflection.routineEvals && currentReflection.routineEvals.length > 0 && (
              <div className="mt-4 pt-3 border-t border-border/50">
                <h4 className="text-[11px] font-bold text-text-secondary mb-2.5 uppercase tracking-wide">루틴별 평가</h4>
                <div className="space-y-2">
                  {currentReflection.routineEvals.map((evalItem) => {
                    const display = EVAL_DISPLAY[evalItem.evaluation];
                    const Icon = display.icon;
                    const routineIcon = getRoutineIcon(evalItem.routineId);
                    return (
                      <div key={evalItem.routineId} className={`p-2.5 rounded-lg ${display.bg} border border-border/30`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            {routineIcon && <IconDisplay icon={routineIcon} size={14} />}
                            <span className="text-[12px] font-medium text-text-primary">{getRoutineName(evalItem.routineId)}</span>
                          </div>
                          <div className={`flex items-center gap-1 ${display.color}`}>
                            <Icon size={12} />
                            <span className="text-[11px] font-bold">{display.label}</span>
                          </div>
                        </div>
                        {evalItem.improvement && (
                          <p className="mt-1.5 text-[11px] text-text-secondary leading-relaxed">{evalItem.improvement}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-text-tertiary text-[13px] mb-4">아직 회고가 없습니다</p>
            <button onClick={handleNew} className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-primary-600 text-white text-[13px] font-semibold active:scale-95 transition-all shadow-sm shadow-primary-600/20">
              <Plus size={16} />회고 작성하기
            </button>
          </div>
        )}
      </div>

      {/* 이전 회고 목록 */}
      {allReflections.length > 0 && (
        <div>
          <h3 className="font-semibold text-[13px] text-text-secondary mb-3 uppercase tracking-wide">이전 회고 ({allReflections.length})</h3>
          <div className="space-y-2">
            {allReflections.map((ref) => (
              <div key={ref.id} className="p-3 rounded-2xl bg-surface-secondary border border-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-semibold text-text-tertiary">{ref.date}</span>
                  <div className="flex gap-0.5">
                    <button onClick={() => handleEdit(ref)} aria-label="회고 수정" className="p-2 rounded-lg hover:bg-surface-tertiary transition-colors"><Edit3 size={13} className="text-text-tertiary" /></button>
                    <button onClick={() => handleDelete(ref)} aria-label="회고 삭제" className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"><Trash2 size={13} className="text-red-400" /></button>
                  </div>
                </div>
                <div className="space-y-1">
                  {ref.keep && <p className="text-[12px] text-text-secondary"><span className="text-done font-bold">K</span> {ref.keep.slice(0, 80)}{ref.keep.length > 80 ? '...' : ''}</p>}
                  {ref.problem && <p className="text-[12px] text-text-secondary"><span className="text-red-500 font-bold">P</span> {ref.problem.slice(0, 80)}{ref.problem.length > 80 ? '...' : ''}</p>}
                  {ref.try && <p className="text-[12px] text-text-secondary"><span className="text-more font-bold">T</span> {ref.try.slice(0, 80)}{ref.try.length > 80 ? '...' : ''}</p>}
                </div>
                {/* 루틴 평가 요약 */}
                {ref.routineEvals && ref.routineEvals.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {ref.routineEvals.map((evalItem) => {
                      const display = EVAL_DISPLAY[evalItem.evaluation];
                      const Icon = display.icon;
                      return (
                        <span key={evalItem.routineId} className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-medium ${display.color} ${display.bg}`}>
                          <Icon size={9} />
                          {getRoutineName(evalItem.routineId)}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {showForm && <ReflectionForm date={dateKey} type={viewType} existing={editingReflection} onClose={() => { setShowForm(false); setEditingReflection(undefined); }} />}
      {confirmTarget && (
        <ConfirmDialog
          title="회고 삭제"
          message="이 회고를 삭제하시겠습니까?"
          confirmLabel="삭제"
          variant="danger"
          onConfirm={() => { deleteReflection(confirmTarget.id); setConfirmTarget(null); }}
          onCancel={() => setConfirmTarget(null)}
        />
      )}
    </div>
  );
}
