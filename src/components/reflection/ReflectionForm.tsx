import { useState, useMemo } from 'react';
import { X, ChevronDown, ChevronUp, ThumbsUp, Minus, ThumbsDown } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useRoutineStore } from '../../stores/routineStore';
import { formatDate, getWeekDays } from '../../utils/date';
import { IconDisplay } from '../settings/RoutineForm';
import type { Reflection, RoutineEvaluation, RoutineEval, CheckLevel } from '../../types';

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
    <div className="mb-1.5 p-2 rounded-lg bg-surface-tertiary/50 border border-border/50">
      <button onClick={() => setOpen(!open)} className="flex items-center justify-between w-full text-left">
        <span className={`text-[10px] font-semibold ${color}`}>이번 주 일간 회고 ({items.length}건)</span>
        {open ? <ChevronUp size={12} className="text-text-tertiary" /> : <ChevronDown size={12} className="text-text-tertiary" />}
      </button>
      {open && (
        <div className="mt-1.5 space-y-0.5">
          {items.map((item, i) => (
            <div key={i} className="flex gap-1.5 text-[11px]">
              <span className="text-text-tertiary shrink-0">{item.date}</span>
              <p className="text-text-secondary whitespace-pre-wrap line-clamp-2">{item.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const LEVEL_COLORS: Record<string, string> = {
  none: 'bg-surface-tertiary',
  done: 'bg-done',
  more: 'bg-more',
  max: 'bg-max',
};

const EVAL_CONFIG: { key: RoutineEvaluation; label: string; icon: typeof ThumbsUp; color: string; bgColor: string; activeBg: string }[] = [
  { key: 'good', label: 'Good', icon: ThumbsUp, color: 'text-done', bgColor: 'bg-green-50 dark:bg-green-900/10', activeBg: 'bg-green-100 dark:bg-green-900/30 ring-2 ring-done' },
  { key: 'soso', label: 'Soso', icon: Minus, color: 'text-amber-500', bgColor: 'bg-amber-50 dark:bg-amber-900/10', activeBg: 'bg-amber-100 dark:bg-amber-900/30 ring-2 ring-amber-500' },
  { key: 'bad', label: 'Bad', icon: ThumbsDown, color: 'text-red-500', bgColor: 'bg-red-50 dark:bg-red-900/10', activeBg: 'bg-red-100 dark:bg-red-900/30 ring-2 ring-red-500' },
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
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50" role="dialog" aria-labelledby="reflection-form-title" onClick={onClose}>
      <div className="bg-surface rounded-t-3xl sm:rounded-2xl p-5 w-full sm:max-w-lg max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 id="reflection-form-title" className="text-lg font-bold">{existing ? '회고 수정' : '회고 작성'}</h2>
          <button onClick={onClose} aria-label="닫기" className="p-2.5 rounded-xl hover:bg-surface-secondary transition-colors"><X size={20} /></button>
        </div>

        <div className="space-y-4">
          {/* Keep */}
          <div>
            {weeklyDailyKPT && <DailySummaryBlock items={weeklyDailyKPT.keeps} color="text-done" />}
            <label className="block text-sm font-bold text-done mb-1">Keep - 잘한 것</label>
            <textarea value={keep} onChange={(e) => setKeep(e.target.value)} placeholder={type === 'weekly' ? '이번 주 잘한 것, 계속할 것...' : '오늘 잘한 것...'} rows={3} className="w-full px-3 py-2 rounded-lg border border-border bg-surface-secondary text-text-primary text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          {/* Problem */}
          <div>
            {weeklyDailyKPT && <DailySummaryBlock items={weeklyDailyKPT.problems} color="text-red-500" />}
            <label className="block text-sm font-bold text-red-500 mb-1">Problem - 아쉬운 점</label>
            <textarea value={problem} onChange={(e) => setProblem(e.target.value)} placeholder={type === 'weekly' ? '아쉬웠던 점, 문제점...' : '아쉬웠던 점...'} rows={3} className="w-full px-3 py-2 rounded-lg border border-border bg-surface-secondary text-text-primary text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          {/* Try */}
          <div>
            {weeklyDailyKPT && <DailySummaryBlock items={weeklyDailyKPT.tries} color="text-more" />}
            <label className="block text-sm font-bold text-more mb-1">Try - 시도할 것</label>
            <textarea value={tryText} onChange={(e) => setTryText(e.target.value)} placeholder={type === 'weekly' ? '다음 주에 시도해볼 것...' : '다음에 시도해볼 것...'} rows={3} className="w-full px-3 py-2 rounded-lg border border-border bg-surface-secondary text-text-primary text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
        </div>

        {/* === 주간 전용 섹션 === */}
        {type === 'weekly' && weeklyStats && weeklyStats.routineData.length > 0 && (
          <>
            {/* 이번 주 루틴 현황 */}
            <div className="mt-6 pt-5 border-t border-border">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-[13px] text-text-secondary uppercase tracking-wide">이번 주 루틴 현황</h3>
                <span className={`text-[13px] font-bold ${weeklyStats.totalRate >= 80 ? 'text-done' : weeklyStats.totalRate >= 50 ? 'text-more' : 'text-text-tertiary'}`}>
                  평균 {weeklyStats.totalRate}%
                </span>
              </div>

              <div className="rounded-xl bg-surface-secondary border border-border p-3 overflow-x-auto">
                <div className="min-w-[280px]">
                  {/* 요일 헤더 */}
                  <div className="flex mb-2">
                    <div className="w-20 flex-shrink-0" />
                    <div className="flex flex-1 gap-0.5">
                      {weeklyStats.weekDays.map((day) => (
                        <div
                          key={day.toISOString()}
                          className={`flex-1 text-center text-[10px] font-medium ${formatDate(day) === weeklyStats.todayStr ? 'text-primary-600 font-bold' : 'text-text-tertiary'}`}
                        >
                          {format(day, 'EEE', { locale: ko })}
                        </div>
                      ))}
                    </div>
                    <div className="w-9 flex-shrink-0 text-center text-[9px] text-text-tertiary font-medium">달성</div>
                  </div>

                  {/* 루틴 행 */}
                  <div className="space-y-1">
                    {weeklyStats.routineData.map(({ routine, levels, rate }) => (
                      <div key={routine.id} className="flex items-center">
                        <div className="w-20 flex-shrink-0 pr-1.5 flex items-center gap-1">
                          {routine.icon && <IconDisplay icon={routine.icon} size={13} />}
                          <span className="text-[11px] font-medium text-text-primary truncate">{routine.name}</span>
                        </div>
                        <div className="flex flex-1 gap-0.5">
                          {levels.map((level, i) => (
                            <div
                              key={i}
                              className={`flex-1 h-5 rounded ${LEVEL_COLORS[level]} ${formatDate(weeklyStats.weekDays[i]) === weeklyStats.todayStr ? 'ring-1 ring-primary-500 ring-offset-1' : ''}`}
                            />
                          ))}
                        </div>
                        <div className="w-9 flex-shrink-0 text-center">
                          <span className={`text-[10px] font-bold ${rate >= 80 ? 'text-done' : rate >= 50 ? 'text-more' : 'text-text-tertiary'}`}>
                            {rate}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* 날짜별 이행률 */}
                  <div className="flex items-center mt-1.5 pt-1.5 border-t border-border/50">
                    <div className="w-20 flex-shrink-0 text-[9px] text-text-tertiary">이행률</div>
                    <div className="flex flex-1 gap-0.5">
                      {weeklyStats.dailyRates.map((rate, i) => (
                        <div key={i} className="flex-1 text-center">
                          {rate !== null ? (
                            <span className={`text-[9px] font-bold ${rate >= 80 ? 'text-done' : rate >= 50 ? 'text-more' : 'text-text-tertiary'}`}>{rate}%</span>
                          ) : (
                            <span className="text-[9px] text-text-tertiary">-</span>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="w-9 flex-shrink-0" />
                  </div>

                  {/* 범례 */}
                  <div className="flex items-center justify-center gap-3 mt-2 pt-2 border-t border-border/50">
                    {[
                      { color: 'bg-surface-tertiary', label: '미완료' },
                      { color: 'bg-done', label: 'Done' },
                      { color: 'bg-more', label: 'More' },
                      { color: 'bg-max', label: 'Max' },
                    ].map(({ color, label }) => (
                      <div key={label} className="flex items-center gap-1">
                        <div className={`w-2 h-2 rounded ${color}`} />
                        <span className="text-[9px] text-text-tertiary">{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 루틴별 평가 */}
            <div className="mt-5">
              <h3 className="font-semibold text-[13px] text-text-secondary uppercase tracking-wide mb-3">루틴별 평가</h3>
              <div className="space-y-2.5">
                {activeRoutines.map((routine) => {
                  const evalState = routineEvals[routine.id];
                  const rate = weeklyStats.routineData.find((r) => r.routine.id === routine.id)?.rate ?? 0;
                  return (
                    <div key={routine.id} className="rounded-xl bg-surface-secondary border border-border p-3">
                      {/* 루틴 헤더 */}
                      <div className="flex items-center justify-between mb-2.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          {routine.icon && <IconDisplay icon={routine.icon} size={16} />}
                          <span className="font-medium text-[13px] text-text-primary truncate">{routine.name}</span>
                        </div>
                        <span className={`text-[11px] font-bold flex-shrink-0 ${rate >= 80 ? 'text-done' : rate >= 50 ? 'text-more' : 'text-text-tertiary'}`}>
                          {rate}%
                        </span>
                      </div>

                      {/* Good / Soso / Bad 버튼 */}
                      <div className="flex gap-1.5 mb-2">
                        {EVAL_CONFIG.map(({ key, label, icon: Icon, color, bgColor, activeBg }) => (
                          <button
                            key={key}
                            type="button"
                            onClick={() => setEval(routine.id, key)}
                            className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-[12px] font-semibold transition-all ${
                              evalState?.evaluation === key ? `${activeBg} ${color}` : `${bgColor} text-text-tertiary hover:text-text-secondary`
                            }`}
                          >
                            <Icon size={13} />
                            {label}
                          </button>
                        ))}
                      </div>

                      {/* 개선방향 입력 */}
                      {evalState?.evaluation && (
                        <textarea
                          value={evalState.improvement}
                          onChange={(e) => setImprovement(routine.id, e.target.value)}
                          placeholder="개선 방향 또는 메모..."
                          rows={2}
                          className="w-full px-2.5 py-2 rounded-lg border border-border bg-surface text-text-primary text-[12px] resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder:text-text-tertiary"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        <button onClick={handleSubmit} className="w-full mt-6 py-3 rounded-xl bg-primary-600 text-white font-semibold active:scale-[0.98] transition-all">{existing ? '수정하기' : '저장하기'}</button>
      </div>
    </div>
  );
}
