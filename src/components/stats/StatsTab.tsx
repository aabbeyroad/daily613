import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Flame, Target, TrendingUp, Trophy } from 'lucide-react';
import { useRoutineStore } from '../../stores/routineStore';
import { formatDate, getWeekDays, startOfMonth, endOfMonth } from '../../utils/date';
import KeywordFilter from '../common/KeywordFilter';
import Calendar from './Calendar';

const LEVEL_COLORS = { none: '#94a3b8', done: '#22c55e', more: '#3b82f6', max: '#a855f7' };

export default function StatsTab() {
  const routines = useRoutineStore((s) => s.routines);
  const records = useRoutineStore((s) => s.records);
  const selectedKeyword = useRoutineStore((s) => s.selectedKeyword);
  const getFilteredRoutines = useRoutineStore((s) => s.getFilteredRoutines);
  const getDailyRate = useRoutineStore((s) => s.getDailyRate);
  const getWeeklyRate = useRoutineStore((s) => s.getWeeklyRate);
  const getWeeklyScore = useRoutineStore((s) => s.getWeeklyScore);

  const today = new Date();
  const todayStr = formatDate(today);
  const weekDays = getWeekDays(today);
  const weekStart = formatDate(weekDays[0]);
  const weekEnd = formatDate(weekDays[6]);
  const monthStart = formatDate(startOfMonth(today));
  const monthEnd = formatDate(endOfMonth(today));

  const filteredRoutines = useMemo(() => getFilteredRoutines(), [routines, selectedKeyword]);

  const streak = useMemo(() => {
    const recordMap: Record<string, Record<string, string>> = {};
    records.forEach((r) => { recordMap[r.date] = r.checks; });
    
    // 필터된 루틴만 고려한 streak 계산
    let currentStreak = 0;
    const checkDate = (date: Date): boolean => {
      const dateStr = formatDate(date);
      const record = recordMap[dateStr];
      if (!record) return false;
      return filteredRoutines.some((r) => record[r.id] && record[r.id] !== 'none');
    };
    
    // 어제부터 역순으로 체크
    let d = new Date(today);
    d.setDate(d.getDate() - 1);
    while (checkDate(d)) {
      currentStreak++;
      d.setDate(d.getDate() - 1);
    }
    // 오늘 체크
    if (checkDate(today)) currentStreak++;
    
    return currentStreak;
  }, [records, filteredRoutines, today]);

  const todayRate = getDailyRate(todayStr, true);
  const weeklyRate = getWeeklyRate(weekStart, weekEnd, true);
  const monthlyRate = getWeeklyRate(monthStart, monthEnd, true);
  const weeklyScore = getWeeklyScore(weekStart, weekEnd, true);

  const levelDistribution = useMemo(() => {
    let doneCount = 0, moreCount = 0, maxCount = 0, noneCount = 0;
    records.forEach((record) => {
      filteredRoutines.forEach((r) => {
        const level = record.checks[r.id];
        if (level === 'max') maxCount++;
        else if (level === 'more') moreCount++;
        else if (level === 'done') doneCount++;
        else noneCount++;
      });
    });
    return [
      { name: 'Max', value: maxCount, color: LEVEL_COLORS.max },
      { name: 'More', value: moreCount, color: LEVEL_COLORS.more },
      { name: 'Done', value: doneCount, color: LEVEL_COLORS.done },
      { name: '미달성', value: noneCount, color: LEVEL_COLORS.none },
    ].filter((d) => d.value > 0);
  }, [filteredRoutines, records]);

  const statCards = [
    { icon: Flame, label: '연속 달성', value: `${streak}일`, color: 'text-orange-500' },
    { icon: Target, label: '오늘 달성률', value: `${todayRate}%`, color: 'text-done' },
    { icon: TrendingUp, label: '이번 주', value: `${weeklyRate}%`, color: 'text-more' },
    { icon: Trophy, label: '이번 달', value: `${monthlyRate}%`, color: 'text-max' },
  ];

  return (
    <div className="px-4 pt-6 pb-4">
      <h1 className="text-2xl font-bold text-text-primary mb-4">통계</h1>
      
      {/* 키워드 필터 */}
      <div className="mb-6">
        <KeywordFilter />
      </div>

      {selectedKeyword && (
        <div className="mb-4 px-3 py-2 rounded-lg bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-sm">
          📊 '{selectedKeyword}' 키워드 통계
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 mb-6">
        {statCards.map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="p-4 rounded-xl bg-surface-secondary border border-border">
            <Icon size={20} className={color} />
            <div className="text-2xl font-bold mt-2 text-text-primary">{value}</div>
            <div className="text-xs text-text-tertiary mt-0.5">{label}</div>
          </div>
        ))}
      </div>
      <div className="p-4 rounded-xl bg-surface-secondary border border-border mb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-text-tertiary">이번 주 점수</div>
            <div className="text-3xl font-bold text-text-primary mt-1">{weeklyScore}<span className="text-sm text-text-tertiary font-normal ml-1">pts</span></div>
          </div>
          <div className="text-right text-xs text-text-tertiary">
            <div>Done = 1pt</div><div>More = 2pt</div><div>Max = 3pt</div>
          </div>
        </div>
      </div>
      {levelDistribution.length > 0 && (
        <div className="p-4 rounded-xl bg-surface-secondary border border-border mb-6">
          <h3 className="font-semibold mb-4">달성 단계 비율</h3>
          <div className="flex items-center">
            <div className="w-32 h-32">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={levelDistribution} cx="50%" cy="50%" innerRadius={30} outerRadius={55} dataKey="value" strokeWidth={2} stroke="var(--color-surface-secondary)">
                    {levelDistribution.map((entry, index) => (<Cell key={index} fill={entry.color} />))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value}회`, '']} contentStyle={{ borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 ml-4 space-y-2">
              {levelDistribution.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: item.color }} />
                  <span className="text-sm text-text-secondary flex-1">{item.name}</span>
                  <span className="text-sm font-medium text-text-primary">{item.value}회</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      <div className="p-4 rounded-xl bg-surface-secondary border border-border mb-6">
        <h3 className="font-semibold mb-4">월간 캘린더</h3>
        <Calendar />
      </div>
    </div>
  );
}
