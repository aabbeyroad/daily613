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

export default function ReflectionForm({ date, type, existing, onClose }: Props) {
  const addReflection = useRoutineStore((s) => s.addReflection);
  const updateReflection = useRoutineStore((s) => s.updateReflection);
  const reflections = useRoutineStore((s) => s.reflections);
  const [keep, setKeep] = useState(existing?.keep || '');
  const [problem, setProblem] = useState(existing?.problem || '');
  const [tryText, setTryText] = useState(existing?.try || '');

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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" role="dialog" aria-labelledby="reflection-form-title" onClick={onClose}>
      <div className="bg-surface rounded-2xl p-5 w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 id="reflection-form-title" className="text-lg font-bold">{existing ? '회고 수정' : '회고 작성'}</h2>
          <button onClick={onClose} aria-label="닫기" className="p-2.5"><X size={20} /></button>
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
        <button onClick={handleSubmit} className="w-full mt-6 py-3 rounded-xl bg-primary-600 text-white font-semibold active:scale-[0.98] transition-all">{existing ? '수정하기' : '저장하기'}</button>
      </div>
    </div>
  );
}
