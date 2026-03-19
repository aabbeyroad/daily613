import { useState, useMemo } from 'react';
import { Plus, Edit3, Trash2, ChevronLeft, ChevronRight, ThumbsUp, Minus, ThumbsDown } from 'lucide-react';
import { addWeeks, subWeeks, addDays, subDays } from 'date-fns';
import { useRoutineStore } from '../../stores/routineStore';
import { formatDate, formatDisplayDate, getWeekKey, getWeekDays } from '../../utils/date';
import { IconDisplay } from '../settings/RoutineForm';
import ReflectionForm from './ReflectionForm';
import ConfirmDialog from '../common/ConfirmDialog';
import type { Reflection, RoutineEvaluation } from '../../types';
import { Badge, Button, IconButton, Screen, ScreenHeader, SectionCard, SegmentedControl } from '../ui/primitives';

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
    <Screen>
      <ScreenHeader
        eyebrow="Reflection"
        title="회고 정리"
        description="일간과 주간 회고를 같은 언어와 구조로 정리해, 생각을 차분하게 남길 수 있도록 구성했습니다."
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <SegmentedControl
          value={viewType}
          onChange={setViewType}
          options={[
            { value: 'daily', label: '일간 회고' },
            { value: 'weekly', label: '주간 회고' },
          ]}
        />
        <div className="flex items-center gap-2">
          <IconButton onClick={() => navigate('prev')} aria-label="이전 기간">
            <ChevronLeft size={18} />
          </IconButton>
          <Badge tone="default">{displayLabel}</Badge>
          <IconButton onClick={() => navigate('next')} aria-label="다음 기간">
            <ChevronRight size={18} />
          </IconButton>
        </div>
      </div>

      <SectionCard
        title={viewType === 'daily' ? '현재 일간 회고' : '현재 주간 회고'}
        subtitle="Keep, Problem, Try를 같은 형식으로 모아 읽기 쉽도록 배치했습니다."
      >
        {currentReflection ? (
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-[13px] font-semibold uppercase tracking-wide" style={{ color: 'var(--ds-text-tertiary)' }}>KPT 회고</h3>
              <div className="flex gap-0.5">
                <IconButton onClick={() => handleEdit(currentReflection)} aria-label="회고 수정"><Edit3 size={15} /></IconButton>
                <IconButton onClick={() => handleDelete(currentReflection)} aria-label="회고 삭제" variant="danger"><Trash2 size={15} /></IconButton>
              </div>
            </div>
            <div className="space-y-3">
              {currentReflection.keep && (
                <div className="notice notice--success">
                  <div className="mb-1 text-[11px] font-bold uppercase tracking-wide">Keep</div>
                  <p className="whitespace-pre-wrap text-[13px] leading-relaxed" style={{ color: 'var(--ds-text-primary)' }}>{currentReflection.keep}</p>
                </div>
              )}
              {currentReflection.problem && (
                <div className="notice notice--danger">
                  <div className="mb-1 text-[11px] font-bold uppercase tracking-wide">Problem</div>
                  <p className="whitespace-pre-wrap text-[13px] leading-relaxed" style={{ color: 'var(--ds-text-primary)' }}>{currentReflection.problem}</p>
                </div>
              )}
              {currentReflection.try && (
                <div className="notice" style={{ background: 'var(--ds-bg-accent)', color: 'var(--ds-accent)', borderColor: 'rgba(54, 90, 168, 0.16)' }}>
                  <div className="mb-1 text-[11px] font-bold uppercase tracking-wide">Try</div>
                  <p className="whitespace-pre-wrap text-[13px] leading-relaxed" style={{ color: 'var(--ds-text-primary)' }}>{currentReflection.try}</p>
                </div>
              )}
            </div>

            {/* 루틴별 평가 표시 (주간 회고에서만) */}
            {currentReflection.routineEvals && currentReflection.routineEvals.length > 0 && (
              <div className="mt-4 pt-3 border-t border-border/50">
                <h4 className="mb-2.5 text-[11px] font-bold uppercase tracking-wide" style={{ color: 'var(--ds-text-tertiary)' }}>루틴별 평가</h4>
                <div className="space-y-2">
                  {currentReflection.routineEvals.map((evalItem) => {
                    const display = EVAL_DISPLAY[evalItem.evaluation];
                    const Icon = display.icon;
                    const routineIcon = getRoutineIcon(evalItem.routineId);
                    return (
                      <div key={evalItem.routineId} className={`rounded-[18px] border p-2.5 ${display.bg}`} style={{ borderColor: 'var(--ds-border)' }}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            {routineIcon && <IconDisplay icon={routineIcon} size={14} />}
                            <span className="text-[12px] font-medium" style={{ color: 'var(--ds-text-primary)' }}>{getRoutineName(evalItem.routineId)}</span>
                          </div>
                          <div className={`flex items-center gap-1 ${display.color}`}>
                            <Icon size={12} />
                            <span className="text-[11px] font-bold">{display.label}</span>
                          </div>
                        </div>
                        {evalItem.improvement && (
                          <p className="mt-1.5 text-[11px] leading-relaxed" style={{ color: 'var(--ds-text-secondary)' }}>{evalItem.improvement}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="py-8 text-center">
            <p className="mb-4 text-[13px]" style={{ color: 'var(--ds-text-tertiary)' }}>아직 회고가 없습니다</p>
            <Button onClick={handleNew} variant="primary" size="lg">
              <Plus size={16} />회고 작성하기
            </Button>
          </div>
        )}
      </SectionCard>

      {allReflections.length > 0 && (
        <SectionCard title={`이전 회고 (${allReflections.length})`} subtitle="과거 회고를 간결한 카드 리스트로 다시 훑어볼 수 있습니다.">
          <div className="space-y-2">
            {allReflections.map((ref) => (
              <div key={ref.id} className="card p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-semibold" style={{ color: 'var(--ds-text-tertiary)' }}>{ref.date}</span>
                  <div className="flex gap-0.5">
                    <IconButton onClick={() => handleEdit(ref)} aria-label="회고 수정"><Edit3 size={13} /></IconButton>
                    <IconButton onClick={() => handleDelete(ref)} aria-label="회고 삭제" variant="danger"><Trash2 size={13} /></IconButton>
                  </div>
                </div>
                <div className="space-y-1">
                  {ref.keep && <p className="text-[12px]" style={{ color: 'var(--ds-text-secondary)' }}><span className="font-bold text-done">K</span> {ref.keep.slice(0, 80)}{ref.keep.length > 80 ? '...' : ''}</p>}
                  {ref.problem && <p className="text-[12px]" style={{ color: 'var(--ds-text-secondary)' }}><span className="font-bold text-red-500">P</span> {ref.problem.slice(0, 80)}{ref.problem.length > 80 ? '...' : ''}</p>}
                  {ref.try && <p className="text-[12px]" style={{ color: 'var(--ds-text-secondary)' }}><span className="font-bold text-more">T</span> {ref.try.slice(0, 80)}{ref.try.length > 80 ? '...' : ''}</p>}
                </div>
                {ref.routineEvals && ref.routineEvals.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {ref.routineEvals.map((evalItem) => {
                      const display = EVAL_DISPLAY[evalItem.evaluation];
                      const Icon = display.icon;
                      return (
                        <span key={evalItem.routineId} className={`inline-flex items-center gap-0.5 rounded-full px-2 py-1 text-[10px] font-medium ${display.color} ${display.bg}`}>
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
        </SectionCard>
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
    </Screen>
  );
}
