import { useState, useMemo } from 'react';
import { Plus, Edit3, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { addWeeks, subWeeks, addDays, subDays, format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useRoutineStore } from '../../stores/routineStore';
import { formatDate, formatDisplayDate, getWeekKey, getWeekDays } from '../../utils/date';
import ReflectionForm from './ReflectionForm';
import type { Reflection } from '../../types';

export default function ReflectionTab() {
  const reflections = useRoutineStore((s) => s.reflections);
  const deleteReflection = useRoutineStore((s) => s.deleteReflection);
  const [viewType, setViewType] = useState<'daily' | 'weekly'>('daily');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showForm, setShowForm] = useState(false);
  const [editingReflection, setEditingReflection] = useState<Reflection | undefined>();

  const dateKey = viewType === 'daily' ? formatDate(currentDate) : getWeekKey(currentDate);
  const weekDays = getWeekDays(currentDate);
  const displayLabel = viewType === 'daily' ? formatDisplayDate(currentDate) : `${formatDate(weekDays[0])} ~ ${formatDate(weekDays[6])}`;
  const currentReflection = useMemo(() => reflections.find((r) => r.date === dateKey && r.type === viewType), [reflections, dateKey, viewType]);
  const allReflections = useMemo(() => reflections.filter((r) => r.type === viewType).sort((a, b) => b.date.localeCompare(a.date)), [reflections, viewType]);

  // 주간 회고 시: 해당 주의 일간 회고들을 K/P/T별로 모아서 보여주기
  const weeklyDailyKPT = useMemo(() => {
    if (viewType !== 'weekly') return null;
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
  }, [viewType, weekDays, reflections]);

  const navigate = (dir: 'prev' | 'next') => {
    if (viewType === 'daily') setCurrentDate((d) => (dir === 'prev' ? subDays(d, 1) : addDays(d, 1)));
    else setCurrentDate((d) => (dir === 'prev' ? subWeeks(d, 1) : addWeeks(d, 1)));
  };

  const handleEdit = (reflection: Reflection) => { setEditingReflection(reflection); setShowForm(true); };
  const handleDelete = (reflection: Reflection) => { if (confirm('이 회고를 삭제하시겠습니까?')) deleteReflection(reflection.id); };
  const handleNew = () => { setEditingReflection(undefined); setShowForm(true); };

  return (
    <div className="px-4 pt-6 pb-4">
      <h1 className="text-2xl font-bold text-text-primary mb-6">회고</h1>
      <div className="flex bg-surface-secondary rounded-xl p-1 mb-4 border border-border">
        <button onClick={() => setViewType('daily')} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${viewType === 'daily' ? 'bg-surface text-text-primary shadow-sm' : 'text-text-tertiary'}`}>일간 회고</button>
        <button onClick={() => setViewType('weekly')} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${viewType === 'weekly' ? 'bg-surface text-text-primary shadow-sm' : 'text-text-tertiary'}`}>주간 회고</button>
      </div>
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => navigate('prev')} className="p-1.5 rounded-lg hover:bg-surface-tertiary"><ChevronLeft size={20} /></button>
        <span className="font-medium text-sm text-text-primary">{displayLabel}</span>
        <button onClick={() => navigate('next')} className="p-1.5 rounded-lg hover:bg-surface-tertiary"><ChevronRight size={20} /></button>
      </div>
      {/* 주간 회고 시: 이번 주 일간 회고 KPT 요약 */}
      {viewType === 'weekly' && weeklyDailyKPT && (
        <div className="mb-4 p-4 rounded-xl bg-surface-secondary border border-border">
          <h3 className="font-semibold text-sm text-text-primary mb-3">이번 주 일간 회고 요약 ({weeklyDailyKPT.count}건)</h3>
          <div className="space-y-3">
            {weeklyDailyKPT.keeps.length > 0 && (
              <div>
                <div className="text-xs font-bold text-done mb-1.5">Keep - 잘한 것</div>
                <div className="space-y-1.5">
                  {weeklyDailyKPT.keeps.map((item, i) => (
                    <div key={i} className="flex gap-2 text-sm">
                      <span className="text-text-tertiary text-xs shrink-0 pt-0.5">{item.date}</span>
                      <p className="text-text-primary whitespace-pre-wrap">{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {weeklyDailyKPT.problems.length > 0 && (
              <div>
                <div className="text-xs font-bold text-red-500 mb-1.5">Problem - 아쉬운 점</div>
                <div className="space-y-1.5">
                  {weeklyDailyKPT.problems.map((item, i) => (
                    <div key={i} className="flex gap-2 text-sm">
                      <span className="text-text-tertiary text-xs shrink-0 pt-0.5">{item.date}</span>
                      <p className="text-text-primary whitespace-pre-wrap">{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {weeklyDailyKPT.tries.length > 0 && (
              <div>
                <div className="text-xs font-bold text-more mb-1.5">Try - 시도할 것</div>
                <div className="space-y-1.5">
                  {weeklyDailyKPT.tries.map((item, i) => (
                    <div key={i} className="flex gap-2 text-sm">
                      <span className="text-text-tertiary text-xs shrink-0 pt-0.5">{item.date}</span>
                      <p className="text-text-primary whitespace-pre-wrap">{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mb-6 p-4 rounded-xl bg-surface-secondary border border-border">
        {currentReflection ? (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm">KPT 회고</h3>
              <div className="flex gap-1">
                <button onClick={() => handleEdit(currentReflection)} className="p-1.5 rounded-lg hover:bg-surface-tertiary"><Edit3 size={14} className="text-text-secondary" /></button>
                <button onClick={() => handleDelete(currentReflection)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"><Trash2 size={14} className="text-red-500" /></button>
              </div>
            </div>
            <div className="space-y-3">
              {currentReflection.keep && <div><div className="text-xs font-bold text-done mb-0.5">Keep</div><p className="text-sm text-text-primary whitespace-pre-wrap">{currentReflection.keep}</p></div>}
              {currentReflection.problem && <div><div className="text-xs font-bold text-red-500 mb-0.5">Problem</div><p className="text-sm text-text-primary whitespace-pre-wrap">{currentReflection.problem}</p></div>}
              {currentReflection.try && <div><div className="text-xs font-bold text-more mb-0.5">Try</div><p className="text-sm text-text-primary whitespace-pre-wrap">{currentReflection.try}</p></div>}
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-text-tertiary text-sm mb-3">아직 회고가 없습니다</p>
            <button onClick={handleNew} className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium active:scale-95 transition-all"><Plus size={16} />회고 작성하기</button>
          </div>
        )}
      </div>
      {allReflections.length > 0 && (
        <div>
          <h3 className="font-semibold mb-3 text-text-secondary text-sm">이전 회고 ({allReflections.length})</h3>
          <div className="space-y-2">
            {allReflections.map((ref) => (
              <div key={ref.id} className="p-3 rounded-xl bg-surface-secondary border border-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-text-tertiary">{ref.date}</span>
                  <div className="flex gap-1">
                    <button onClick={() => handleEdit(ref)} className="p-1 rounded hover:bg-surface-tertiary"><Edit3 size={12} className="text-text-tertiary" /></button>
                    <button onClick={() => handleDelete(ref)} className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20"><Trash2 size={12} className="text-red-500" /></button>
                  </div>
                </div>
                <div className="space-y-1">
                  {ref.keep && <p className="text-xs text-text-secondary"><span className="text-done font-bold">K:</span> {ref.keep.slice(0, 80)}{ref.keep.length > 80 ? '...' : ''}</p>}
                  {ref.problem && <p className="text-xs text-text-secondary"><span className="text-red-500 font-bold">P:</span> {ref.problem.slice(0, 80)}{ref.problem.length > 80 ? '...' : ''}</p>}
                  {ref.try && <p className="text-xs text-text-secondary"><span className="text-more font-bold">T:</span> {ref.try.slice(0, 80)}{ref.try.length > 80 ? '...' : ''}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {showForm && <ReflectionForm date={dateKey} type={viewType} existing={editingReflection} onClose={() => { setShowForm(false); setEditingReflection(undefined); }} />}
    </div>
  );
}
