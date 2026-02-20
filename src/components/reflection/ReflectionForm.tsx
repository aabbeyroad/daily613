import { useState, useMemo } from 'react';
import { X, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useRoutineStore } from '../../stores/routineStore';
import { formatDate, getWeekDays } from '../../utils/date';
import type { Reflection } from '../../types';

interface Props {
  date: string;
  type: 'daily' | 'weekly';
  existing?: Reflection;
  onClose: () => void;
}

export default function ReflectionForm({ date, type, existing, onClose }: Props) {
  const addReflection = useRoutineStore((s) => s.addReflection);
  const updateReflection = useRoutineStore((s) => s.updateReflection);
  const reflections = useRoutineStore((s) => s.reflections);
  const [keep, setKeep] = useState(existing?.keep || '');
  const [problem, setProblem] = useState(existing?.problem || '');
  const [tryText, setTryText] = useState(existing?.try || '');
  const [showDailySummary, setShowDailySummary] = useState(true);

  // 주간 회고 시: 해당 주의 일간 회고들을 K/P/T별로 모아서 보여주기
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

    return { keeps, problems, tries, count: dailyReflections.length };
  }, [type, date, reflections]);

  const handleSubmit = () => {
    if (!keep.trim() && !problem.trim() && !tryText.trim()) return;
    if (existing) {
      updateReflection(existing.id, { keep: keep.trim(), problem: problem.trim(), try: tryText.trim() });
    } else {
      addReflection({ date, type, keep: keep.trim(), problem: problem.trim(), try: tryText.trim() });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-surface rounded-2xl p-5 w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">{existing ? '회고 수정' : '회고 작성'}</h2>
          <button onClick={onClose} className="p-1"><X size={20} /></button>
        </div>

        {/* 주간 회고 시: 이번 주 일간 회고 KPT 요약 */}
        {weeklyDailyKPT && (
          <div className="mb-4 p-3 rounded-xl bg-surface-secondary border border-border">
            <button
              onClick={() => setShowDailySummary(!showDailySummary)}
              className="flex items-center justify-between w-full text-left"
            >
              <h3 className="font-semibold text-xs text-text-secondary">이번 주 일간 회고 ({weeklyDailyKPT.count}건)</h3>
              {showDailySummary ? <ChevronUp size={16} className="text-text-tertiary" /> : <ChevronDown size={16} className="text-text-tertiary" />}
            </button>
            {showDailySummary && (
              <div className="mt-2.5 space-y-2.5">
                {weeklyDailyKPT.keeps.length > 0 && (
                  <div>
                    <div className="text-xs font-bold text-done mb-1">Keep</div>
                    <div className="space-y-1">
                      {weeklyDailyKPT.keeps.map((item, i) => (
                        <div key={i} className="flex gap-1.5 text-xs">
                          <span className="text-text-tertiary shrink-0">{item.date}</span>
                          <p className="text-text-secondary whitespace-pre-wrap">{item.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {weeklyDailyKPT.problems.length > 0 && (
                  <div>
                    <div className="text-xs font-bold text-red-500 mb-1">Problem</div>
                    <div className="space-y-1">
                      {weeklyDailyKPT.problems.map((item, i) => (
                        <div key={i} className="flex gap-1.5 text-xs">
                          <span className="text-text-tertiary shrink-0">{item.date}</span>
                          <p className="text-text-secondary whitespace-pre-wrap">{item.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {weeklyDailyKPT.tries.length > 0 && (
                  <div>
                    <div className="text-xs font-bold text-more mb-1">Try</div>
                    <div className="space-y-1">
                      {weeklyDailyKPT.tries.map((item, i) => (
                        <div key={i} className="flex gap-1.5 text-xs">
                          <span className="text-text-tertiary shrink-0">{item.date}</span>
                          <p className="text-text-secondary whitespace-pre-wrap">{item.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-done mb-1">Keep - 잘한 것</label>
            <textarea value={keep} onChange={(e) => setKeep(e.target.value)} placeholder="이번 주 잘한 것, 계속할 것..." rows={3} className="w-full px-3 py-2 rounded-lg border border-border bg-surface-secondary text-text-primary text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <div>
            <label className="block text-sm font-bold text-red-500 mb-1">Problem - 아쉬운 점</label>
            <textarea value={problem} onChange={(e) => setProblem(e.target.value)} placeholder="아쉬웠던 점, 문제점..." rows={3} className="w-full px-3 py-2 rounded-lg border border-border bg-surface-secondary text-text-primary text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <div>
            <label className="block text-sm font-bold text-more mb-1">Try - 시도할 것</label>
            <textarea value={tryText} onChange={(e) => setTryText(e.target.value)} placeholder="다음에 시도해볼 것..." rows={3} className="w-full px-3 py-2 rounded-lg border border-border bg-surface-secondary text-text-primary text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
        </div>
        <button onClick={handleSubmit} className="w-full mt-6 py-3 rounded-xl bg-primary-600 text-white font-semibold active:scale-[0.98] transition-all">{existing ? '수정하기' : '저장하기'}</button>
      </div>
    </div>
  );
}
