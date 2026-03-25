import { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, ThumbsUp, Minus, ThumbsDown } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useRoutineStore } from '../../stores/routineStore';
import { formatDate, getWeekDays } from '../../utils/date';
import { IconDisplay } from '../settings/RoutineForm';
import type { Reflection, RoutineEvaluation, RoutineEval, CheckLevel } from '../../types';
import { Badge, Button, Modal, Notice, SectionCard, TextArea } from '../ui/primitives';

interface Props {
  date: string;
  type: 'daily' | 'weekly';
  existing?: Reflection;
  onClose: () => void;
}

function DailySummaryBlock({ items, color }: { items: { date: string; text: string }[]; color: string }) {
  const [open, setOpen] = useState(true);
  if (items.length === 0) return null;
  return (
    <div className="mb-2 rounded-[18px] border p-3" style={{ background: 'var(--ds-bg-secondary)', borderColor: 'var(--ds-border)' }}>
      <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between text-left">
        <span className="text-[10px] font-semibold" style={{ color }}>{`이번 주 일간 회고 (${items.length}건)`}</span>
        {open ? <ChevronUp size={12} style={{ color: 'var(--ds-text-tertiary)' }} /> : <ChevronDown size={12} style={{ color: 'var(--ds-text-tertiary)' }} />}
      </button>
      {open && (
        <div className="mt-2 space-y-1">
          {items.map((item, i) => (
            <div key={i} className="flex gap-1.5 text-[11px]">
              <span className="shrink-0" style={{ color: 'var(--ds-text-tertiary)' }}>{item.date}</span>
              <p className="line-clamp-2 whitespace-pre-wrap" style={{ color: 'var(--ds-text-secondary)' }}>{item.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const LEVEL_COLORS: Record<string, string> = {
  none: 'var(--ds-bg-tertiary)',
  done: 'var(--color-done)',
  more: 'var(--color-more)',
  max: 'var(--color-max)',
};

const EVAL_CONFIG: { key: RoutineEvaluation; label: string; icon: typeof ThumbsUp; color: string; bgColor: string; activeBg: string }[] = [
  { key: 'good', label: 'Good', icon: ThumbsUp, color: 'var(--color-done)', bgColor: 'rgba(52, 168, 83, 0.1)', activeBg: 'rgba(52, 168, 83, 0.16)' },
  { key: 'soso', label: 'Soso', icon: Minus, color: '#b78317', bgColor: 'rgba(255, 184, 0, 0.12)', activeBg: 'rgba(255, 184, 0, 0.18)' },
  { key: 'bad', label: 'Bad', icon: ThumbsDown, color: 'var(--ds-danger)', bgColor: 'rgba(201, 72, 92, 0.1)', activeBg: 'rgba(201, 72, 92, 0.16)' },
];

export default function ReflectionForm({ date, type, existing, onClose }: Props) {
  const addReflection = useRoutineStore((s) => s.addReflection);
  const updateReflection = useRoutineStore((s) => s.updateReflection);
  const reflections = useRoutineStore((s) => s.reflections);
  const routines = useRoutineStore((s) => s.routines);
  const records = useRoutineStore((s) => s.records);

  const [keep, setKeep] = useState(existing?.keep || '');
  const [problem, setProblem] = useState(existing?.problem || '');
  const [tryText, setTryText] = useState(existing?.try || '');

  // 루틴별 평가 상태 (주간 회고 전용)
  const activeRoutines = useMemo(() => routines.filter((r) => !r.archived).sort((a, b) => a.order - b.order), [routines]);

  const [routineEvals, setRoutineEvals] = useState<Record<string, { evaluation: RoutineEvaluation | null; improvement: string }>>(() => {
    const initial: Record<string, { evaluation: RoutineEvaluation | null; improvement: string }> = {};
    activeRoutines.forEach((r) => {
      const existingEval = existing?.routineEvals?.find((e) => e.routineId === r.id);
      initial[r.id] = {
        evaluation: existingEval?.evaluation || null,
        improvement: existingEval?.improvement || '',
      };
    });
    return initial;
  });

  // 주간 회고 시: 해당 주의 일간 회고들을 K/P/T별로 분리
  const weeklyDailyKPT = useMemo(() => {
    if (type !== 'weekly') return null;
    const weekDays = getWeekDays(new Date(date));
    const weekDateStrs = weekDays.map((d) => formatDate(d));
    const dailyReflections = reflections
      .filter((r) => r.type === 'daily' && weekDateStrs.includes(r.date))
      .sort((a, b) => a.date.localeCompare(b.date));
    if (dailyReflections.length === 0) return null;

    const keeps: { date: string; text: string }[] = [];
    const problems: { date: string; text: string }[] = [];
    const tries: { date: string; text: string }[] = [];

    dailyReflections.forEach((r) => {
      const dayLabel = format(new Date(r.date), 'M/d (EEE)', { locale: ko });
      if (r.keep) keeps.push({ date: dayLabel, text: r.keep });
      if (r.problem) problems.push({ date: dayLabel, text: r.problem });
      if (r.try) tries.push({ date: dayLabel, text: r.try });
    });

    return { keeps, problems, tries };
  }, [type, date, reflections]);

  // 일간 루틴 이행 현황 (daily 전용)
  const dailyStats = useMemo(() => {
    if (type !== 'daily') return null;
    const record = records.find(r => r.date === date);
    const completed = activeRoutines.filter(r => (record?.checks[r.id] || 'none') !== 'none').length;
    const total = activeRoutines.length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return {
      items: activeRoutines.map(routine => ({
        routine,
        level: ((record?.checks[routine.id]) || 'none') as CheckLevel,
      })),
      completed,
      total,
      rate,
    };
  }, [type, date, records, activeRoutines]);

  // 주간 루틴 현황 데이터
  const weeklyStats = useMemo(() => {
    if (type !== 'weekly') return null;
    const weekDays = getWeekDays(new Date(date));
    const todayStr = formatDate(new Date());

    const getLevel = (routineId: string, day: Date): CheckLevel => {
      const dateStr = formatDate(day);
      const record = records.find((r) => r.date === dateStr);
      return (record?.checks[routineId] || 'none') as CheckLevel;
    };

    const isPastOrToday = (day: Date): boolean => formatDate(day) <= todayStr;

    // 루틴별 이행률
    const pastDays = weekDays.filter((d) => isPastOrToday(d));
    const dayCount = pastDays.length;

    const routineData = activeRoutines.map((routine) => {
      const levels = weekDays.map((day) => getLevel(routine.id, day));
      const doneCount = dayCount > 0 ? pastDays.filter((day) => getLevel(routine.id, day) !== 'none').length : 0;
      const rate = dayCount > 0 ? Math.round((doneCount / dayCount) * 100) : 0;
      return { routine, levels, rate };
    });

    // 날짜별 전체 이행률
    const dailyRates = weekDays.map((day) => {
      if (!isPastOrToday(day)) return null;
      const total = activeRoutines.length;
      if (total === 0) return null;
      const done = activeRoutines.filter((r) => getLevel(r.id, day) !== 'none').length;
      return Math.round((done / total) * 100);
    });

    // 전체 이행률
    const totalRate = dayCount > 0 && activeRoutines.length > 0
      ? Math.round(routineData.reduce((sum, r) => sum + r.rate, 0) / routineData.length)
      : 0;

    return { weekDays, routineData, dailyRates, totalRate, todayStr };
  }, [type, date, records, activeRoutines]);

  const handleSubmit = () => {
    if (!keep.trim() && !problem.trim() && !tryText.trim()) return;

    // 루틴별 평가 데이터 수집 (주간 회고만)
    const evalData: RoutineEval[] = [];
    if (type === 'weekly') {
      Object.entries(routineEvals).forEach(([routineId, val]) => {
        if (val.evaluation) {
          evalData.push({
            routineId,
            evaluation: val.evaluation,
            improvement: val.improvement.trim(),
          });
        }
      });
    }

    if (existing) {
      updateReflection(existing.id, {
        keep: keep.trim(),
        problem: problem.trim(),
        try: tryText.trim(),
        routineEvals: evalData.length > 0 ? evalData : undefined,
      });
    } else {
      addReflection({
        date,
        type,
        keep: keep.trim(),
        problem: problem.trim(),
        try: tryText.trim(),
        routineEvals: evalData.length > 0 ? evalData : undefined,
      });
    }
    onClose();
  };

  const setEval = (routineId: string, evaluation: RoutineEvaluation) => {
    setRoutineEvals((prev) => ({
      ...prev,
      [routineId]: {
        ...prev[routineId],
        evaluation: prev[routineId]?.evaluation === evaluation ? null : evaluation,
      },
    }));
  };

  const setImprovement = (routineId: string, text: string) => {
    setRoutineEvals((prev) => ({
      ...prev,
      [routineId]: { ...prev[routineId], improvement: text },
    }));
  };

  return (
    <Modal
      open={true}
      title={existing ? '회고 수정' : '회고 작성'}
      description={type === 'weekly' ? '이번 주의 흐름과 다음 주의 시도를 함께 정리합니다.' : '하루를 Keep, Problem, Try 구조로 간결하게 남깁니다.'}
      onClose={onClose}
      size="lg"
      footer={
        <>
          <Button variant="secondary" size="lg" fullWidth onClick={onClose}>취소</Button>
          <Button variant="primary" size="lg" fullWidth onClick={handleSubmit}>{existing ? '수정하기' : '저장하기'}</Button>
        </>
      }
    >
      <div className="space-y-4">

        {/* ── 일간: 오늘 루틴 이행 현황 (컴팩트) ── */}
        {type === 'daily' && dailyStats && dailyStats.total > 0 && (
          <div className="rounded-2xl px-3 py-2.5" style={{ background: 'var(--ds-bg-secondary)', border: '1px solid var(--ds-border)' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--ds-text-tertiary)' }}>오늘 루틴 현황</span>
              <span className="text-[12px] font-bold" style={{ color: dailyStats.rate >= 80 ? 'var(--color-done)' : dailyStats.rate >= 50 ? 'var(--color-more)' : 'var(--ds-text-tertiary)' }}>
                {dailyStats.completed}/{dailyStats.total} ({dailyStats.rate}%)
              </span>
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-1.5">
              {dailyStats.items.map(({ routine, level }) => (
                <div key={routine.id} className="flex items-center gap-1.5">
                  <div style={{ width: 10, height: 10, borderRadius: 3, flexShrink: 0, background: LEVEL_COLORS[level] }} />
                  {routine.icon ? <IconDisplay icon={routine.icon} size={11} /> : null}
                  <span className="text-[11px]" style={{ color: level === 'none' ? 'var(--ds-text-tertiary)' : 'var(--ds-text-primary)', fontWeight: level !== 'none' ? 600 : 400 }}>
                    {routine.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── 주간: 루틴별 평가 (최상단) ── */}
        {type === 'weekly' && weeklyStats && weeklyStats.routineData.length > 0 && (
          <SectionCard title="루틴별 평가" subtitle="각 루틴에 대한 감정 평가와 개선 메모를 남깁니다.">
            <div className="space-y-3">
              {activeRoutines.map((routine) => {
                const evalState = routineEvals[routine.id];
                const rate = weeklyStats.routineData.find((r) => r.routine.id === routine.id)?.rate ?? 0;
                return (
                  <div key={routine.id} className="card p-3">
                    <div className="mb-2.5 flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2">
                        {routine.icon ? <IconDisplay icon={routine.icon} size={15} /> : null}
                        <span className="truncate text-[13px] font-semibold" style={{ color: 'var(--ds-text-primary)' }}>{routine.name}</span>
                      </div>
                      <Badge tone={rate >= 80 ? 'success' : rate >= 50 ? 'accent' : 'default'}>{rate}%</Badge>
                    </div>
                    <div className="mb-2 grid grid-cols-3 gap-2">
                      {EVAL_CONFIG.map(({ key, label, icon: Icon, color, bgColor, activeBg }) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setEval(routine.id, key)}
                          className="rounded-[18px] border px-3 py-2 text-[12px] font-semibold transition-all"
                          style={{
                            color: evalState?.evaluation === key ? color : 'var(--ds-text-secondary)',
                            background: evalState?.evaluation === key ? activeBg : bgColor,
                            borderColor: evalState?.evaluation === key ? color : 'transparent',
                          }}
                        >
                          <span className="flex items-center justify-center gap-1">
                            <Icon size={13} />
                            {label}
                          </span>
                        </button>
                      ))}
                    </div>
                    {evalState?.evaluation ? (
                      <TextArea
                        value={evalState.improvement}
                        onChange={(e) => setImprovement(routine.id, e.target.value)}
                        placeholder=""
                        rows={1}
                      />
                    ) : (
                      <Notice>평가를 선택하면 개선 방향을 더 자세히 적을 수 있습니다.</Notice>
                    )}
                  </div>
                );
              })}
            </div>
          </SectionCard>
        )}

        {/* ── Keep / Problem / Try ── */}
        <SectionCard title="Keep" subtitle="잘한 것과 앞으로도 유지하고 싶은 흐름을 적습니다.">
          {weeklyDailyKPT ? <DailySummaryBlock items={weeklyDailyKPT.keeps} color="var(--color-done)" /> : null}
          <TextArea value={keep} onChange={(e) => setKeep(e.target.value)} placeholder={type === 'weekly' ? '이번 주 잘한 것, 계속할 것...' : '오늘 잘한 것...'} rows={4} />
        </SectionCard>

        <SectionCard title="Problem" subtitle="아쉬웠던 점이나 반복된 문제를 적습니다.">
          {weeklyDailyKPT ? <DailySummaryBlock items={weeklyDailyKPT.problems} color="var(--ds-danger)" /> : null}
          <TextArea value={problem} onChange={(e) => setProblem(e.target.value)} placeholder={type === 'weekly' ? '아쉬웠던 점, 문제점...' : '아쉬웠던 점...'} rows={4} />
        </SectionCard>

        <SectionCard title="Try" subtitle="다음에 시도할 작은 변화나 실험을 적습니다.">
          {weeklyDailyKPT ? <DailySummaryBlock items={weeklyDailyKPT.tries} color="var(--color-more)" /> : null}
          <TextArea value={tryText} onChange={(e) => setTryText(e.target.value)} placeholder={type === 'weekly' ? '다음 주에 시도해볼 것...' : '다음에 시도해볼 것...'} rows={4} />
        </SectionCard>

        {/* ── 주간: 이번 주 루틴 현황 (통계탭 스타일) ── */}
        {type === 'weekly' && weeklyStats && weeklyStats.routineData.length > 0 && (
          <SectionCard
            title="이번 주 루틴 현황"
            subtitle="요일별 체크 흐름과 평균 이행률을 동시에 확인합니다."
            action={<Badge tone="accent">평균 {weeklyStats.totalRate}%</Badge>}
          >
            <div className="overflow-x-auto" style={{ margin: '0 -2px', padding: '0 2px' }}>
              <div style={{ minWidth: 300 }}>
                {/* 요일 헤더 */}
                <div className="flex mb-2">
                  <div style={{ width: 76, flexShrink: 0 }} />
                  <div className="flex flex-1 gap-1">
                    {weeklyStats.weekDays.map((day) => {
                      const isToday = formatDate(day) === weeklyStats.todayStr;
                      return (
                        <div key={day.toISOString()} className="flex-1 text-center">
                          <div className="text-[11px] font-medium" style={{ color: isToday ? 'var(--ds-accent)' : 'var(--ds-text-tertiary)' }}>
                            {format(day, 'EEE', { locale: ko })}
                          </div>
                          <div className="text-[10px]" style={{ color: isToday ? 'var(--ds-accent)' : 'var(--ds-text-tertiary)', fontWeight: isToday ? 700 : 400 }}>
                            {format(day, 'd')}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ width: 34, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span className="text-[10px]" style={{ color: 'var(--ds-text-tertiary)' }}>달성</span>
                  </div>
                </div>

                {/* 루틴별 행 */}
                <div className="space-y-1.5">
                  {weeklyStats.routineData.map(({ routine, levels, rate }) => (
                    <div key={routine.id} className="flex items-center">
                      <div style={{ width: 76, flexShrink: 0, paddingRight: 6 }}>
                        <span className="text-[11px] font-medium truncate block" style={{ color: 'var(--ds-text-primary)' }}>
                          {routine.name}
                        </span>
                      </div>
                      <div className="flex flex-1 gap-1">
                        {levels.map((level, i) => (
                          <div
                            key={i}
                            className="flex-1 rounded-md"
                            style={{
                              height: 20,
                              background: LEVEL_COLORS[level],
                              boxShadow: formatDate(weeklyStats.weekDays[i]) === weeklyStats.todayStr ? '0 0 0 2px rgba(54,90,168,0.28)' : 'none',
                            }}
                          />
                        ))}
                      </div>
                      <div style={{ width: 34, flexShrink: 0, textAlign: 'center' }}>
                        <span className="text-[10px] font-bold" style={{ color: rate >= 80 ? 'var(--color-done)' : rate >= 50 ? 'var(--color-more)' : 'var(--ds-text-tertiary)' }}>
                          {rate}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 날짜별 전체 이행률 */}
                <div className="flex items-center mt-2 pt-2" style={{ borderTop: '1px solid var(--ds-border)' }}>
                  <div style={{ width: 76, flexShrink: 0, paddingRight: 6 }}>
                    <span className="text-[10px]" style={{ color: 'var(--ds-text-tertiary)' }}>전체 이행률</span>
                  </div>
                  <div className="flex flex-1 gap-1">
                    {weeklyStats.dailyRates.map((rate, i) => (
                      <div key={i} className="flex-1 text-center">
                        {rate !== null ? (
                          <span className="text-[10px] font-bold" style={{ color: rate >= 80 ? 'var(--color-done)' : rate >= 50 ? 'var(--color-more)' : 'var(--ds-text-tertiary)' }}>
                            {rate}%
                          </span>
                        ) : (
                          <span className="text-[10px]" style={{ color: 'var(--ds-text-tertiary)' }}>-</span>
                        )}
                      </div>
                    ))}
                  </div>
                  <div style={{ width: 34, flexShrink: 0 }} />
                </div>

                {/* 범례 */}
                <div className="flex flex-wrap gap-3 mt-3 pt-3" style={{ borderTop: '1px solid var(--ds-border)' }}>
                  {([
                    { color: 'var(--ds-bg-tertiary)', label: '미완료' },
                    { color: 'var(--color-done)',     label: 'Done' },
                    { color: 'var(--color-more)',     label: 'More' },
                    { color: 'var(--color-max)',      label: 'Max' },
                  ] as const).map(({ color, label }) => (
                    <div key={label} className="flex items-center gap-1.5">
                      <div style={{ width: 10, height: 10, borderRadius: 3, background: color }} />
                      <span className="text-[10px]" style={{ color: 'var(--ds-text-tertiary)' }}>{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </SectionCard>
        )}

      </div>
    </Modal>
  );
}
