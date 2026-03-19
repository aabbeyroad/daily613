import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Flame, Target, TrendingUp, Trophy, Zap } from 'lucide-react';
import { useRoutineStore } from '../../stores/routineStore';
import { formatDate, getWeekDays, startOfMonth, endOfMonth } from '../../utils/date';
import KeywordFilter from '../common/KeywordFilter';
import Calendar from './Calendar';
import WeeklyRoutineGrid from './WeeklyRoutineGrid';
import { Badge, MetricCard, Screen, ScreenHeader, SectionCard } from '../ui/primitives';

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
    <Screen>
      <ScreenHeader
        eyebrow="Insights"
        title="기록에서 패턴 읽기"
        description="성과를 과장하지 않고, 지금의 흐름과 누적된 리듬을 담백하게 보여줍니다."
        trailing={selectedKeyword ? <Badge tone="accent">{selectedKeyword}</Badge> : null}
      />

      <SectionCard title="필터" subtitle="특정 키워드에 초점을 맞춰 통계를 볼 수 있습니다.">
        <KeywordFilter />
      </SectionCard>

      <div className="grid gap-3 sm:grid-cols-2">
        {statCards.map(({ icon: Icon, label, value }, index) => (
          <MetricCard
            key={label}
            label={label}
            value={value}
            icon={<Icon size={18} />}
            tone={index === 0 ? 'warning' : index === 1 ? 'success' : index === 2 ? 'accent' : 'default'}
          />
        ))}
      </div>

      <SectionCard
        title="이번 주 점수"
        subtitle="Done, More, Max의 가중치를 반영한 주간 종합 점수입니다."
        action={<Badge tone="warning"><Zap size={12} />{weeklyScore} pts</Badge>}
      >
        <div className="grid gap-2 sm:grid-cols-3">
          <div className="notice notice--success">Done = 1pt</div>
          <div className="notice" style={{ background: 'var(--ds-bg-accent)', color: 'var(--ds-accent)' }}>More = 2pt</div>
          <div className="notice" style={{ background: 'rgba(109, 91, 208, 0.14)', color: 'var(--color-max)' }}>Max = 3pt</div>
        </div>
      </SectionCard>

      <SectionCard title="이번 주 루틴 현황" subtitle="요일과 루틴별 이행 흐름을 한 번에 비교합니다.">
        <WeeklyRoutineGrid />
      </SectionCard>

      {levelDistribution.length > 0 ? (
        <SectionCard title="달성 단계 비율" subtitle="루틴 체크가 어떤 수준에서 가장 많이 쌓였는지 보여줍니다.">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="h-32 w-32">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={levelDistribution} cx="50%" cy="50%" innerRadius={34} outerRadius={54} dataKey="value" strokeWidth={2} stroke="var(--ds-bg-elevated)">
                    {levelDistribution.map((entry, index) => (<Cell key={index} fill={entry.color} />))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value}회`, '']} contentStyle={{ borderRadius: '18px', border: '1px solid var(--ds-border)', background: 'var(--ds-bg-elevated)', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-3">
              {levelDistribution.map((item) => (
                <div key={item.name} className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full" style={{ background: item.color }} />
                  <span className="flex-1 text-[14px]" style={{ color: 'var(--ds-text-secondary)' }}>{item.name}</span>
                  <span className="text-[14px] font-semibold" style={{ color: 'var(--ds-text-primary)' }}>{item.value}회</span>
                </div>
              ))}
            </div>
          </div>
        </SectionCard>
      ) : null}

      <SectionCard title="월간 캘린더" subtitle="월간 이행 흐름과 해당 날짜의 기록을 자세히 확인합니다.">
        <Calendar />
      </SectionCard>
    </Screen>
  );
}
