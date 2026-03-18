import { useState, useEffect } from 'react';
import { X, BookOpen } from 'lucide-react';
import { subDays } from 'date-fns';
import { useRoutineStore } from '../../stores/routineStore';
import { formatDate, formatDisplayDate } from '../../utils/date';

const STORAGE_KEY = 'lastReviewPopupDate';

export default function DailyReviewPopup() {
  const reflections = useRoutineStore((s) => s.reflections);
  const [visible, setVisible] = useState(false);
  const [yesterdayReflection, setYesterdayReflection] = useState<{
    keep: string; problem: string; try: string; date: string; displayDate: string;
  } | null>(null);

  useEffect(() => {
    const today = formatDate(new Date());
    const lastShown = localStorage.getItem(STORAGE_KEY);
    if (lastShown === today) return;
    const yesterday = subDays(new Date(), 1);
    const yesterdayStr = formatDate(yesterday);
    const ref = reflections.find((r) => r.date === yesterdayStr && r.type === 'daily');
    if (ref && (ref.keep || ref.problem || ref.try)) {
      setYesterdayReflection({ keep: ref.keep, problem: ref.problem, try: ref.try, date: yesterdayStr, displayDate: formatDisplayDate(yesterday) });
      setVisible(true);
    }
  }, [reflections]);

  const handleClose = () => { setVisible(false); localStorage.setItem(STORAGE_KEY, formatDate(new Date())); };
  if (!visible || !yesterdayReflection) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[90] px-4" onClick={handleClose}>
      <div className="bg-surface rounded-2xl p-5 w-full max-w-sm shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BookOpen size={18} className="text-primary-600" />
            <h2 className="font-bold text-[15px] text-text-primary">어제의 회고</h2>
          </div>
          <button onClick={handleClose} className="p-1.5 rounded-lg hover:bg-surface-secondary transition-colors">
            <X size={16} className="text-text-tertiary" />
          </button>
        </div>
        <p className="text-[12px] text-text-tertiary mb-3">{yesterdayReflection.displayDate}</p>
        <div className="space-y-2.5">
          {yesterdayReflection.keep && (<div className="p-3 rounded-xl bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/20"><div className="text-[10px] font-bold text-done mb-1 uppercase tracking-wide">Keep</div><p className="text-[13px] text-text-primary whitespace-pre-wrap leading-relaxed">{yesterdayReflection.keep}</p></div>)}
          {yesterdayReflection.problem && (<div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20"><div className="text-[10px] font-bold text-red-500 mb-1 uppercase tracking-wide">Problem</div><p className="text-[13px] text-text-primary whitespace-pre-wrap leading-relaxed">{yesterdayReflection.problem}</p></div>)}
          {yesterdayReflection.try && (<div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20"><div className="text-[10px] font-bold text-more mb-1 uppercase tracking-wide">Try</div><p className="text-[13px] text-text-primary whitespace-pre-wrap leading-relaxed">{yesterdayReflection.try}</p></div>)}
        </div>
        <button onClick={handleClose} className="w-full mt-4 py-2.5 rounded-xl bg-primary-600 text-white text-[13px] font-semibold active:scale-[0.98] transition-all">확인</button>
      </div>
    </div>
  );
}
