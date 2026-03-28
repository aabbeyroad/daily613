import { useMemo, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Flame, Target, TrendingUp, Trophy, Zap } from 'lucide-react';
import { useRoutineStore } from '../../stores/routineStore';
import { formatDate, getWeekDays, startOfMonth, endOfMonth } from '../../utils/date';
import KeywordFilter from '../common/KeywordFilter';
import Calendar from './Calendar';
import WeeklyRoutineGrid from './WeeklyRoutineGrid';

const EVAL_CONFIG = {
  good: { label: '좋음',   fill: '#22C55E33', border: '#22C55E', text: '#16a34a' },
  soso: { label: '보통',   fill: '#F59E0B33', border: '#F59E0B', text: '#b45309' },
  bad:  { label: '아쉬움', fill: '#EF444433', border: '#EF4444', text: '#dc2626' },
} as const;

const DAY_LABELS_SHORT = ['월', '화', '수', '목', '금', '토', '일'];

// 미니 스케줄 그리드 상수 (WeeklyTab의 축소판)
const STAT_CELL_H = 6; // px per 30-min slot (WeeklyTab은 12px)
const statHourToSlot = (hour: number) => (hour - 3) * 2;
const statSlotToHour = (slot: number) => slot * 0.5 + 3;
const TIME_COL_W = 22;

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

  // 미니 그리드용: 블록이 존재하는 시간 범위만 추려서 표시
  const visibleSlotRange = useMemo(() => {
    if (scheduleBlocks.length === 0) return null;
    const starts = scheduleBlocks.map(b => statHourToSlot(b.startHour));
    const ends   = scheduleBlocks.map(b => statHourToSlot(b.endHour));
    const lo = Math.max(0,  Math.min(...starts) - 2);
    const hi = Math.min(41, Math.max(...ends)   + 2);
    return { lo, hi, slots: Array.from({ length: hi - lo + 1 }, (_, i) => lo + i) };
  }, [scheduleBlocks]);

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

      {/* 이번 주 모드 평가 현황 — 주간 배치표 축소판 */}
      {visibleSlotRange && (
        <div className="p-4 rounded-2xl bg-surface-secondary border border-border mb-5">
          <h3 className="font-semibold text-[13px] text-text-secondary mb-3 uppercase tracking-wide">이번 주 모드 평가 현황</h3>

          {/* 요일 헤더 (WeeklyTab과 동일한 구조) */}
          <div className="flex" style={{ paddingLeft: TIME_COL_W, borderBottom: '1px solid var(--ds-border)', paddingBottom: 4, marginBottom: 0 }}>
            {weekDays.map((day, i) => {
              const isToday = formatDate(day) === todayStr;
              return (
                <div key={i} className="flex-1 text-center">
                  <div className="text-[10px] font-semibold leading-tight"
                    style={{ color: i >= 5 ? '#EF4444' : 'var(--ds-text-secondary)' }}>
                    {DAY_LABELS_SHORT[i]}
                  </div>
                  <div className="text-[9px] leading-tight"
                    style={{ color: isToday ? 'var(--ds-accent)' : 'var(--ds-text-tertiary)', fontWeight: isToday ? 700 : 400 }}>
                    {day.getDate()}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 시간표 그리드 본체 */}
          <div className="flex">
            {/* 시간 레이블 컬럼 */}
            <div style={{ width: TIME_COL_W, flexShrink: 0 }}>
              {visibleSlotRange.slots.map(slot => (
                <div key={slot} style={{ height: STAT_CELL_H }} className="flex items-start justify-end pr-1">
                  {slot % 4 === 0 && (
                    <span className="text-[8px] leading-none pt-px" style={{ color: 'var(--ds-text-tertiary)' }}>
                      {String(Math.floor(statSlotToHour(slot))).padStart(2, '0')}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* 요일별 컬럼 */}
            {weekDays.map((day, dayIdx) => {
              const dateStr = formatDate(day);
              return (
                <div key={dayIdx} className="flex-1 relative" style={{ borderLeft: '1px solid var(--ds-border)' }}>
                  {/* 배경 셀 */}
                  {visibleSlotRange.slots.map((slot, i) => (
                    <div key={slot} style={{
                      height: STAT_CELL_H,
                      borderBottom: i % 2 === 1 ? '1px solid rgba(122,136,164,0.07)' : 'none',
                    }} />
                  ))}

                  {/* 스케줄 블록 */}
                  {scheduleBlocks.filter(b => b.dayOfWeek === dayIdx).map(block => {
                    const topSlot  = statHourToSlot(block.startHour) - visibleSlotRange.lo;
                    const spanSlots = (block.endHour - block.startHour) * 2;
                    const evalVal  = blockEvals[`${block.id}-${dateStr}`] as keyof typeof EVAL_CONFIG | undefined;
                    const cfg      = evalVal ? EVAL_CONFIG[evalVal] : null;

                    return (
                      <div
                        key={block.id}
                        style={{
                          position: 'absolute',
                          top:    topSlot  * STAT_CELL_H + 1,
                          height: spanSlots * STAT_CELL_H - 2,
                          left: 1, right: 1,
                          backgroundColor: cfg ? cfg.fill : block.color + '40',
                          borderLeft: `2.5px solid ${cfg ? cfg.border : block.color + 'BB'}`,
                          borderRadius: 3,
                          overflow: 'hidden',
                          transition: 'background-color 0.15s',
                        }}
                      >
                        {spanSlots >= 5 && (
                          <p className="truncate leading-tight"
                            style={{ fontSize: 8, fontWeight: 700, padding: '1px 2px', color: cfg ? cfg.text : '#fff' }}>
                            {block.label || '─'}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* 범례 */}
          <div className="flex items-center gap-3 mt-2.5 pt-2.5" style={{ borderTop: '1px solid var(--ds-border)' }}>
            {(Object.entries(EVAL_CONFIG) as [keyof typeof EVAL_CONFIG, typeof EVAL_CONFIG[keyof typeof EVAL_CONFIG]][]).map(([, cfg]) => (
              <div key={cfg.label} className="flex items-center gap-1">
                <div style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: cfg.border, opacity: 0.85 }} />
                <span className="text-[10px]" style={{ color: 'var(--ds-text-tertiary)' }}>{cfg.label}</span>
              </div>
            ))}
            <div className="flex items-center gap-1">
              <div style={{ width: 8, height: 8, borderRadius: 2, background: 'transparent', border: '1px solid var(--ds-border)' }} />
              <span className="text-[10px]" style={{ color: 'var(--ds-text-tertiary)' }}>미평가</span>
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
