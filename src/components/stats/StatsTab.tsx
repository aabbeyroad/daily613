import { useMemo, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Flame, Target, TrendingUp, Trophy, Zap } from 'lucide-react';
import { useRoutineStore } from '../../stores/routineStore';
import { formatDate, getWeekDays, startOfMonth, endOfMonth } from '../../utils/date';
import KeywordFilter from '../common/KeywordFilter';
import Calendar from './Calendar';
import WeeklyRoutineGrid from './WeeklyRoutineGrid';

const EVAL_CONFIG = {
  good: { label: '좋음', bg: '#22C55E22', border: '#22C55E66', dot: '#22C55E', text: '#16a34a' },
  soso: { label: '보통', bg: '#F59E0B22', border: '#F59E0B66', dot: '#F59E0B', text: '#d97706' },
  bad:  { label: '아쉬움', bg: '#EF444422', border: '#EF444466', dot: '#EF4444', text: '#dc2626' },
} as const;

const DAY_LABELS_SHORT = ['월', '화', '수', '목', '금', '토', '일'];

const LEVEL_COLORS = { none: '#94a3b8', done: '#22c55e', more: '#3b82f6', max: '#a855f7' };

type LevelDistPeriod = 'all' | 'week' | 'month';

export default function StatsTab() {
  const [levelDistPeriod, setLevelDistPeriod] = useState<LevelDistPeriod>('all');
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

  const scheduleBlocks = useRoutineStore((s) => s.scheduleBlocks) ?? [];

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

  const blockEvals = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('blockEvals') || '{}') as Record<string, string>; }
    catch { return {} as Record<string, string>; }
  }, []);

  const weeklyModeEvals = useMemo(() => {
    const modeLabels = [...new Set(scheduleBlocks.map(b => b.label).filter(Boolean))];
    return modeLabels.map(label => {
      const repBlock = scheduleBlocks.find(b => b.label === label);
      const color = repBlock?.color ?? '#94a3b8';
      const days = weekDays.map((day, dayIdx) => {
        const dateStr = formatDate(day);
        const block = scheduleBlocks.find(b => b.label === label && b.dayOfWeek === dayIdx);
        const evalVal = block ? (blockEvals[`${block.id}-${dateStr}`] ?? null) : null;
        return { dateStr, eval: evalVal as 'good' | 'soso' | 'bad' | null, hasBlock: !!block };
      });
      const counts = { good: 0, soso: 0, bad: 0 };
      days.forEach(d => { if (d.eval) counts[d.eval]++; });
      return { label, color, days, counts };
    });
  }, [scheduleBlocks, blockEvals, weekDays]);

  const levelDistribution = useMemo(() => {
    let filteredRecords = records;
    if (levelDistPeriod === 'week') {
      filteredRecords = records.filter((r) => r.date >= weekStart && r.date <= weekEnd);
    } else if (levelDistPeriod === 'month') {
      filteredRecords = records.filter((r) => r.date >= monthStart && r.date <= monthEnd);
    }
    let doneCount = 0, moreCount = 0, maxCount = 0, noneCount = 0;
    filteredRecords.forEach((record) => {
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
  }, [filteredRoutines, records, levelDistPeriod, weekStart, weekEnd, monthStart, monthEnd]);

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

      {/* 통계 카드 - 아이콘 우측에 수치 배치 */}
      <div className="grid grid-cols-2 gap-2.5 mb-5">
        {statCards.map(({ icon: Icon, label, value, color, bgColor }) => (
          <div key={label} className="p-3 rounded-2xl bg-surface-secondary border border-border flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${bgColor} flex items-center justify-center flex-shrink-0`}>
              <Icon size={19} className={color} />
            </div>
            <div className="min-w-0">
              <div className="text-[20px] font-bold text-text-primary leading-tight">{value}</div>
              <div className="text-[11px] text-text-tertiary font-medium">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* 이번 주 점수 - 좌측 아이콘 추가 */}
      <div className="p-4 rounded-2xl bg-surface-secondary border border-border mb-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 flex items-center justify-center flex-shrink-0">
              <Zap size={19} className="text-yellow-500" />
            </div>
            <div>
              <div className="text-[11px] text-text-tertiary font-medium uppercase tracking-wide">이번 주 점수</div>
              <div className="text-2xl font-bold text-text-primary leading-tight mt-0.5">{weeklyScore}<span className="text-sm text-text-tertiary font-normal ml-1">pts</span></div>
            </div>
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

      {/* 이번 주 모드 평가 현황 */}
      {weeklyModeEvals.length > 0 && (
        <div className="p-4 rounded-2xl bg-surface-secondary border border-border mb-5">
          <h3 className="font-semibold text-[13px] text-text-secondary mb-4 uppercase tracking-wide">이번 주 모드 평가 현황</h3>

          {/* 요일 헤더 */}
          <div className="flex items-center mb-1.5">
            <div style={{ width: 72, flexShrink: 0 }} />
            {weekDays.map((day, i) => {
              const isToday = formatDate(day) === todayStr;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                  <span
                    className="text-[10px] font-semibold"
                    style={{ color: i >= 5 ? '#EF4444' : 'var(--color-text-tertiary)' }}
                  >
                    {DAY_LABELS_SHORT[i]}
                  </span>
                  <span
                    className="text-[9px] leading-none"
                    style={{
                      color: isToday ? 'var(--ds-accent)' : 'var(--color-text-tertiary)',
                      fontWeight: isToday ? 700 : 400,
                    }}
                  >
                    {day.getDate()}
                  </span>
                </div>
              );
            })}
          </div>

          {/* 모드 행 */}
          <div className="flex flex-col gap-1.5">
            {weeklyModeEvals.map(({ label, color, days, counts }) => (
              <div key={label} className="flex items-center">
                {/* 모드 레이블 */}
                <div className="flex items-center gap-1.5" style={{ width: 72, flexShrink: 0 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: color, flexShrink: 0 }} />
                  <span className="text-[12px] font-medium truncate" style={{ color: 'var(--ds-text-primary)' }}>{label}</span>
                </div>

                {/* 요일별 평가 셀 */}
                {days.map((d, i) => (
                  <div key={i} className="flex-1 flex items-center justify-center">
                    {d.eval ? (
                      <div
                        style={{
                          width: 26, height: 26, borderRadius: '50%',
                          background: EVAL_CONFIG[d.eval].bg,
                          border: `1.5px solid ${EVAL_CONFIG[d.eval].border}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        <span style={{ fontSize: 11, lineHeight: 1 }}>
                          {d.eval === 'good' ? '👍' : d.eval === 'soso' ? '➖' : '👎'}
                        </span>
                      </div>
                    ) : d.hasBlock ? (
                      <div style={{ width: 26, height: 26, borderRadius: '50%', border: '1.5px dashed var(--ds-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--ds-border)' }} />
                      </div>
                    ) : (
                      <div style={{ width: 26, height: 26 }} />
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* 범례 */}
          <div className="flex items-center gap-3 mt-3 pt-3" style={{ borderTop: '1px solid var(--ds-border)' }}>
            {(Object.entries(EVAL_CONFIG) as [keyof typeof EVAL_CONFIG, typeof EVAL_CONFIG[keyof typeof EVAL_CONFIG]][]).map(([key, cfg]) => (
              <div key={key} className="flex items-center gap-1">
                <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: cfg.dot }} />
                <span className="text-[10px]" style={{ color: 'var(--color-text-tertiary)' }}>{cfg.label}</span>
              </div>
            ))}
            <div className="flex items-center gap-1">
              <div style={{ width: 8, height: 8, borderRadius: '50%', border: '1.5px dashed var(--ds-border)' }} />
              <span className="text-[10px]" style={{ color: 'var(--color-text-tertiary)' }}>미평가</span>
            </div>
          </div>
        </div>
      )}

      {/* 달성 비율 */}
      {levelDistribution.length > 0 && (
        <div className="p-4 rounded-2xl bg-surface-secondary border border-border mb-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-[13px] text-text-secondary uppercase tracking-wide">달성 비율</h3>
            <div className="flex bg-surface-tertiary rounded-full p-0.5">
              {(['all', 'week', 'month'] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setLevelDistPeriod(period)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
                    levelDistPeriod === period
                      ? 'bg-surface text-text-primary shadow-sm'
                      : 'text-text-tertiary'
                  }`}
                >
                  {period === 'all' ? '전체' : period === 'week' ? '이번 주' : '이번 달'}
                </button>
              ))}
            </div>
          </div>
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
