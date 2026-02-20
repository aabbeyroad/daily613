import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Flame, Target, TrendingUp, Trophy } from 'lucide-react';
import { useRoutineStore } from '../../stores/routineStore';
import { formatDate, getWeekDays, startOfMonth, endOfMonth } from '../../utils/date';
import KeywordFilter from '../common/KeywordFilter';
import Calendar from './Calendar';
import WeeklyRoutineGrid from './WeeklyRoutineGrid';

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

    let currentStreak = 0;
    const checkDate = (date: Date): boolean => {
      const dateStr = formatDate(date);
      const record = recordMap[dateStr];
      if (!record) return false;
      return filteredRoutines.some((r) => record[r.id] && record[r.id] !== 'none');
    };

    let d = new Date(today);
    d.setDate(d.getDate() - 1);
    while (checkDate(d)) {
      currentStreak++;
      d.setDate(d.getDate() - 1);
    }
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
    { icon: Flame, label: '연속 달성', value: `${streak}일`, color: 'text-orange-500', bgColor: 'bg-orange-50 dark:bg-orange-900/20' },
    { icon: Target, label: '오늘', value: `${todayRate}%`, color: 'text-done', bgColor: 'bg-green-50 dark:bg-green-900/20' },
    { icon: TrendingUp, label: '이번 주', value: `${weeklyRate}%`, color: 'text-more', bgColor: 'bg-blue-50 dark:bg-blue-900/20' },
    { icon: Trophy, label: '이번 달', value: `${monthlyRate}%`, color: 'text-max', bgColor: 'bg-purple-50 dark:bg-purple-900/20' },
  ];

  return (
    <div className="px-4 pt-5 pb-4">
      {/* 키워드 필터 */}
      <div className="mb-5">
        <KeywordFilter />
      </div>

      {selectedKeyword && (
        <div className="mb-4 px-3 py-2 rounded-xl bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 text-[13px] font-medium">
          '{selectedKeyword}' 키워드 통계
        </div>
      )}

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 gap-2.5 mb-5">
        {statCards.map(({ icon: Icon, label, value, color, bgColor }) => (
          <div key={label} className="p-3.5 rounded-2xl bg-surface-secondary border border-border">
            <div className={`w-8 h-8 rounded-xl ${bgColor} flex items-center justify-center mb-2`}>
              <Icon size={17} className={color} />
            </div>
            <div className="text-[22px] font-bold text-text-primary leading-tight">{value}</div>
            <div className="text-[11px] text-text-tertiary mt-0.5 font-medium">{label}</div>
          </div>
        ))}
      </div>

      {/* 이번 주 점수 */}
      <div className="p-4 rounded-2xl bg-surface-secondary border border-border mb-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[11px] text-text-tertiary font-medium uppercase tracking-wide">이번 주 점수</div>
            <div className="text-3xl font-bold text-text-primary mt-1">{weeklyScore}<span className="text-sm text-text-tertiary font-normal ml-1">pts</span></div>
          </div>
          <div className="text-right space-y-0.5">
            <div className="text-[10px] text-done font-medium">Done = 1pt</div>
            <div className="text-[10px] text-more font-medium">More = 2pt</div>
            <div className="text-[10px] text-max font-medium">Max = 3pt</div>
          </div>
        </div>
      </div>

      {/* 이번 주 루틴별 현황 */}
      <div className="p-4 rounded-2xl bg-surface-secondary border border-border mb-5">
        <h3 className="font-semibold text-[13px] text-text-secondary mb-4 uppercase tracking-wide">이번 주 루틴 현황</h3>
        <WeeklyRoutineGrid />
      </div>

      {/* 달성 단계 비율 */}
      {levelDistribution.length > 0 && (
        <div className="p-4 rounded-2xl bg-surface-secondary border border-border mb-5">
          <h3 className="font-semibold text-[13px] text-text-secondary mb-4 uppercase tracking-wide">달성 단계 비율</h3>
          <div className="flex items-center">
            <div className="w-28 h-28">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={levelDistribution} cx="50%" cy="50%" innerRadius={28} outerRadius={50} dataKey="value" strokeWidth={2} stroke="var(--color-surface-secondary)">
                    {levelDistribution.map((entry, index) => (<Cell key={index} fill={entry.color} />))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value}회`, '']} contentStyle={{ borderRadius: '12px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 ml-4 space-y-2.5">
              {levelDistribution.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }} />
                  <span className="text-[13px] text-text-secondary flex-1">{item.name}</span>
                  <span className="text-[13px] font-semibold text-text-primary">{item.value}회</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 월간 캘린더 */}
      <div className="p-4 rounded-2xl bg-surface-secondary border border-border mb-5">
        <h3 className="font-semibold text-[13px] text-text-secondary mb-4 uppercase tracking-wide">월간 캘린더</h3>
        <Calendar />
      </div>
    </div>
  );
}
