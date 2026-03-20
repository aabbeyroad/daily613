import { useState, useEffect, useMemo } from 'react';
import { Play, Square, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { subDays, addDays, subWeeks, addWeeks, format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useRoutineStore } from '../../stores/routineStore';
import { formatDate, formatDisplayDate, getWeekDays } from '../../utils/date';
import { IconDisplay } from '../settings/RoutineForm';
import RoutineDetailModal from './RoutineDetailModal';

const ROUTINE_COLORS = [
  '#6366f1', '#f43f5e', '#10b981', '#f59e0b', '#3b82f6',
  '#8b5cf6', '#ec4899', '#14b8a6', '#ef4444', '#06b6d4',
  '#84cc16', '#a855f7', '#f97316', '#22d3ee', '#e879f9',
];

const AVAILABLE_ROUTINE_ID = '__available__';
const AVAILABLE_COLOR = '#94a3b8';

function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function Clock24({ entries, colorMap, statusText, isTracking, activeRoutineIcon, activeRoutineName, showCurrentTime }: {
  entries: { routineId: string; startMin: number; endMin: number }[];
  colorMap: Record<string, string>;
  statusText: string;
  isTracking: boolean;
  activeRoutineIcon?: string;
  activeRoutineName?: string;
  showCurrentTime?: boolean;
}) {
  const size = 310;
  const cx = size / 2;
  const cy = size / 2;
  const outerR = 120;
  const innerR = 70;
  const totalMin = 24 * 60;

  const arcs = entries.map((e) => {
    const startAngle = (e.startMin / totalMin) * 360 - 90;
    const endAngle = (e.endMin / totalMin) * 360 - 90;
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;
    const largeArc = e.endMin - e.startMin > totalMin / 2 ? 1 : 0;

    const x1o = cx + outerR * Math.cos(startRad);
    const y1o = cy + outerR * Math.sin(startRad);
    const x2o = cx + outerR * Math.cos(endRad);
    const y2o = cy + outerR * Math.sin(endRad);
    const x1i = cx + innerR * Math.cos(endRad);
    const y1i = cy + innerR * Math.sin(endRad);
    const x2i = cx + innerR * Math.cos(startRad);
    const y2i = cy + innerR * Math.sin(startRad);

    const d = [
      `M ${x1o} ${y1o}`,
      `A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2o} ${y2o}`,
      `L ${x1i} ${y1i}`,
      `A ${innerR} ${innerR} 0 ${largeArc} 0 ${x2i} ${y2i}`,
      'Z',
    ].join(' ');

    return { ...e, d };
  });

  const hourTicks = Array.from({ length: 24 }, (_, i) => {
    const angle = (i / 24) * 360 - 90;
    const rad = (angle * Math.PI) / 180;
    const tickR = outerR + 8;
    const labelR = outerR + 20;
    return {
      hour: i,
      x1: cx + outerR * Math.cos(rad),
      y1: cy + outerR * Math.sin(rad),
      x2: cx + tickR * Math.cos(rad),
      y2: cy + tickR * Math.sin(rad),
      lx: cx + labelR * Math.cos(rad),
      ly: cy + labelR * Math.sin(rad),
    };
  });

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-[310px] mx-auto">
      <circle cx={cx} cy={cy} r={outerR} fill="none" className="stroke-border" strokeWidth={1} />
      <circle cx={cx} cy={cy} r={innerR} fill="none" className="stroke-border" strokeWidth={1} />

      {hourTicks.map((t) => (
        <g key={t.hour}>
          <line x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} className="stroke-text-tertiary" strokeWidth={t.hour % 6 === 0 ? 1.5 : 0.5} />
          {t.hour % 3 === 0 && (
            <text x={t.lx} y={t.ly} textAnchor="middle" dominantBaseline="central" className="fill-text-tertiary text-[9px]">
              {t.hour}
            </text>
          )}
        </g>
      ))}

      {arcs.map((arc, i) => (
        <path key={i} d={arc.d} fill={colorMap[arc.routineId] || '#6366f1'} opacity={0.8} />
      ))}

      {/* Current time indicator */}
      {showCurrentTime && (() => {
        const now = new Date();
        const nowMin = now.getHours() * 60 + now.getMinutes();
        const angle = (nowMin / totalMin) * 360 - 90;
        const rad = (angle * Math.PI) / 180;
        return (
          <line
            x1={cx + (innerR - 5) * Math.cos(rad)} y1={cy + (innerR - 5) * Math.sin(rad)}
            x2={cx + (outerR + 3) * Math.cos(rad)} y2={cy + (outerR + 3) * Math.sin(rad)}
            className="stroke-red-500" strokeWidth={2} strokeLinecap="round"
          />
        );
      })()}

      {/* Center status */}
      {isTracking && activeRoutineIcon && activeRoutineName ? (
        <g>
          {!activeRoutineIcon.startsWith('lucide:') && (
            <text x={cx} y={cy - 20} textAnchor="middle" dominantBaseline="central" style={{ fontSize: 22 }}>
              {activeRoutineIcon}
            </text>
          )}
          <text x={cx} y={cy + (activeRoutineIcon.startsWith('lucide:') ? -4 : 4)} textAnchor="middle" dominantBaseline="central" className="fill-text-primary font-medium" style={{ fontSize: 11 }}>
            {activeRoutineName.length > 8 ? activeRoutineName.slice(0, 8) + '…' : activeRoutineName}
          </text>
          <text x={cx} y={cy + 22} textAnchor="middle" dominantBaseline="central" className="fill-primary-600 font-semibold" style={{ fontSize: 10 }}>
            트래킹 중
            <animate attributeName="opacity" values="1;0.3;1" dur="1.5s" repeatCount="indefinite" />
          </text>
        </g>
      ) : (
        <text
          x={cx}
          y={cy}
          textAnchor="middle"
          dominantBaseline="central"
          className="fill-text-primary font-semibold"
          style={{ fontSize: 13 }}
        >
          {statusText}
          {isTracking && (
            <animate attributeName="opacity" values="1;0.3;1" dur="1.5s" repeatCount="indefinite" />
          )}
        </text>
      )}
    </svg>
  );
}

export default function TrackingTab() {
  const routines = useRoutineStore((s) => s.routines);
  const timeEntries = useRoutineStore((s) => s.timeEntries);
  const toggleTracking = useRoutineStore((s) => s.toggleTracking);
  const [, setTick] = useState(0);
  const [mode, setMode] = useState<'routine' | 'available'>('routine');
  const [viewMode, setViewMode] = useState<'daily' | 'weekly'>('daily');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedWeekDate, setSelectedWeekDate] = useState(new Date());
  const [selectedRoutineId, setSelectedRoutineId] = useState<string | null>(null);

  const todayStr = formatDate(new Date());
  const dateStr = formatDate(selectedDate);
  const isToday = dateStr === todayStr;

  const weekDays = getWeekDays(selectedWeekDate);
  const weekStart = formatDate(weekDays[0]);
  const weekEnd = formatDate(weekDays[6]);
  const currentWeekStart = formatDate(getWeekDays(new Date())[0]);
  const isCurrentWeek = weekStart === currentWeekStart;

  const activeRoutines = useMemo(() => routines.filter((r) => !r.archived), [routines]);

  const colorMap = useMemo(() => {
    const map: Record<string, string> = {};
    activeRoutines.forEach((r, i) => {
      map[r.id] = ROUTINE_COLORS[i % ROUTINE_COLORS.length];
    });
    map[AVAILABLE_ROUTINE_ID] = AVAILABLE_COLOR;
    return map;
  }, [activeRoutines]);

  // Daily entries for selected date
  const dailyEntries = useMemo(() =>
    timeEntries.filter((e) => e.date === dateStr),
    [timeEntries, dateStr]
  );

  // Weekly entries for selected week
  const weeklyEntries = useMemo(() =>
    timeEntries.filter((e) => e.date >= weekStart && e.date <= weekEnd),
    [timeEntries, weekStart, weekEnd]
  );

  const hasActive = timeEntries.some((e) => e.endTime === null);

  useEffect(() => {
    if (!hasActive) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [hasActive]);

  // Daily clock entries
  const clockEntries = useMemo(() => {
    const now = new Date();
    const filtered = mode === 'available'
      ? dailyEntries.filter((e) => e.routineId === AVAILABLE_ROUTINE_ID)
      : dailyEntries.filter((e) => e.routineId !== AVAILABLE_ROUTINE_ID);
    return filtered.map((e) => {
      const start = new Date(e.startTime);
      const end = e.endTime ? new Date(e.endTime) : now;
      const startMin = start.getHours() * 60 + start.getMinutes();
      const endMin = end.getHours() * 60 + end.getMinutes();
      return { routineId: e.routineId, startMin, endMin: endMin <= startMin ? endMin + 1 : endMin };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dailyEntries, mode, hasActive ? Math.floor(Date.now() / 1000) : 0]);

  // Daily cumulative time
  const cumulativeTime = useMemo(() => {
    const now = Date.now();
    const map: Record<string, number> = {};
    dailyEntries.forEach((e) => {
      const start = new Date(e.startTime).getTime();
      const end = e.endTime ? new Date(e.endTime).getTime() : now;
      map[e.routineId] = (map[e.routineId] || 0) + (end - start);
    });
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dailyEntries, hasActive ? Math.floor(Date.now() / 1000) : 0]);

  // Weekly cumulative time
  const weeklyCumulativeTime = useMemo(() => {
    const now = Date.now();
    const map: Record<string, number> = {};
    const filtered = mode === 'available'
      ? weeklyEntries.filter((e) => e.routineId === AVAILABLE_ROUTINE_ID)
      : weeklyEntries.filter((e) => e.routineId !== AVAILABLE_ROUTINE_ID);
    filtered.forEach((e) => {
      const start = new Date(e.startTime).getTime();
      const end = e.endTime ? new Date(e.endTime).getTime() : now;
      map[e.routineId] = (map[e.routineId] || 0) + (end - start);
    });
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weeklyEntries, mode, hasActive ? Math.floor(Date.now() / 1000) : 0]);

  // Weekly per-day totals
  const weeklyDayTotals = useMemo(() => {
    const now = Date.now();
    const map: Record<string, number> = {};
    const filtered = mode === 'available'
      ? weeklyEntries.filter((e) => e.routineId === AVAILABLE_ROUTINE_ID)
      : weeklyEntries.filter((e) => e.routineId !== AVAILABLE_ROUTINE_ID);
    filtered.forEach((e) => {
      const start = new Date(e.startTime).getTime();
      const end = e.endTime ? new Date(e.endTime).getTime() : now;
      map[e.date] = (map[e.date] || 0) + (end - start);
    });
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weeklyEntries, mode, hasActive ? Math.floor(Date.now() / 1000) : 0]);

  const routineTotalTime = Object.entries(cumulativeTime)
    .filter(([id]) => id !== AVAILABLE_ROUTINE_ID)
    .reduce((sum, [, ms]) => sum + ms, 0);

  const weeklyRoutineTotalTime = Object.values(weeklyCumulativeTime).reduce((sum, ms) => sum + ms, 0);

  const availableEntries = useMemo(() =>
    dailyEntries.filter((e) => e.routineId === AVAILABLE_ROUTINE_ID),
    [dailyEntries]
  );
  const isAvailableActive = availableEntries.some((e) => e.endTime === null);
  const availableCumMs = cumulativeTime[AVAILABLE_ROUTINE_ID] || 0;
  const weeklyAvailableMs = weeklyCumulativeTime[AVAILABLE_ROUTINE_ID] || 0;

  const currentTotalTime = mode === 'routine' ? routineTotalTime : availableCumMs;
  const currentWeeklyTotalTime = mode === 'routine' ? weeklyRoutineTotalTime : weeklyAvailableMs;

  const statusText = useMemo(() => {
    if (mode === 'available') {
      if (isAvailableActive) return '트래킹 중';
      if (availableCumMs > 0) return formatDuration(availableCumMs);
      return '시작하기';
    }
    if (hasActive) return '트래킹 중';
    if (routineTotalTime > 0) return formatDuration(routineTotalTime);
    return '시작하기';
  }, [mode, hasActive, isAvailableActive, routineTotalTime, availableCumMs]);

  const isCurrentlyTracking = mode === 'available' ? isAvailableActive : hasActive;

  const activeRoutineInfo = useMemo(() => {
    if (mode === 'available') return null;
    const activeEntry = timeEntries.find((e) => e.endTime === null && e.routineId !== AVAILABLE_ROUTINE_ID);
    if (!activeEntry) return null;
    const routine = activeRoutines.find((r) => r.id === activeEntry.routineId);
    return routine ? { icon: routine.icon, name: routine.name } : null;
  }, [mode, timeEntries, activeRoutines]);

  const weekLabel = `${format(weekDays[0], 'M월 d일', { locale: ko })} ~ ${format(weekDays[6], 'M월 d일', { locale: ko })}`;

  return (
    <div className="px-4 pt-5 pb-4">
      {/* 일간/주간 뷰 토글 */}
      <div className="flex bg-surface-tertiary rounded-full p-1 mb-4">
        <button
          onClick={() => setViewMode('daily')}
          className={`flex-1 py-1.5 rounded-full text-[12px] font-semibold transition-all ${
            viewMode === 'daily'
              ? 'bg-surface text-text-primary shadow-sm'
              : 'text-text-tertiary'
          }`}
        >
          일간
        </button>
        <button
          onClick={() => setViewMode('weekly')}
          className={`flex-1 py-1.5 rounded-full text-[12px] font-semibold transition-all ${
            viewMode === 'weekly'
              ? 'bg-surface text-text-primary shadow-sm'
              : 'text-text-tertiary'
          }`}
        >
          주간
        </button>
      </div>

      {/* 날짜/주간 네비게이션 */}
      {viewMode === 'daily' ? (
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setSelectedDate(subDays(selectedDate, 1))}
            className="p-2 rounded-xl bg-surface-secondary border border-border active:scale-95 transition-transform"
          >
            <ChevronLeft size={16} className="text-text-secondary" />
          </button>
          <button
            onClick={() => setSelectedDate(new Date())}
            className={`text-[14px] font-semibold transition-colors ${isToday ? 'text-primary-600' : 'text-text-primary'}`}
          >
            {isToday ? '오늘' : formatDisplayDate(selectedDate)}
          </button>
          <button
            onClick={() => setSelectedDate(addDays(selectedDate, 1))}
            className="p-2 rounded-xl bg-surface-secondary border border-border active:scale-95 transition-transform"
            disabled={isToday}
          >
            <ChevronRight size={16} className={isToday ? 'text-text-tertiary' : 'text-text-secondary'} />
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setSelectedWeekDate(subWeeks(selectedWeekDate, 1))}
            className="p-2 rounded-xl bg-surface-secondary border border-border active:scale-95 transition-transform"
          >
            <ChevronLeft size={16} className="text-text-secondary" />
          </button>
          <button
            onClick={() => setSelectedWeekDate(new Date())}
            className={`text-[14px] font-semibold transition-colors ${isCurrentWeek ? 'text-primary-600' : 'text-text-primary'}`}
          >
            {isCurrentWeek ? '이번 주' : weekLabel}
          </button>
          <button
            onClick={() => setSelectedWeekDate(addWeeks(selectedWeekDate, 1))}
            className="p-2 rounded-xl bg-surface-secondary border border-border active:scale-95 transition-transform"
            disabled={isCurrentWeek}
          >
            <ChevronRight size={16} className={isCurrentWeek ? 'text-text-tertiary' : 'text-text-secondary'} />
          </button>
        </div>
      )}

      {/* 일간 뷰 */}
      {viewMode === 'daily' && (
        <>
          {/* Chart section */}
          <div className="mb-5 p-4">
            <Clock24
              entries={clockEntries}
              colorMap={colorMap}
              statusText={statusText}
              isTracking={isCurrentlyTracking && isToday}
              activeRoutineIcon={isToday ? activeRoutineInfo?.icon : undefined}
              activeRoutineName={isToday ? activeRoutineInfo?.name : undefined}
              showCurrentTime={isToday}
            />
            {currentTotalTime > 0 && (
              <p className="text-center text-[12px] text-text-tertiary mt-2">
                {isToday ? '오늘' : formatDisplayDate(selectedDate)} 총 트래킹: <span className="font-bold text-text-primary">{formatDuration(currentTotalTime)}</span>
              </p>
            )}

            {/* Mode toggle */}
            <div className="flex bg-surface-tertiary rounded-full p-1 mt-3">
              <button
                onClick={() => setMode('routine')}
                className={`flex-1 py-1.5 rounded-full text-[12px] font-semibold transition-all ${
                  mode === 'routine'
                    ? 'bg-surface text-text-primary shadow-sm'
                    : 'text-text-tertiary'
                }`}
              >
                루틴
              </button>
              <button
                onClick={() => setMode('available')}
                className={`flex-1 py-1.5 rounded-full text-[12px] font-semibold transition-all ${
                  mode === 'available'
                    ? 'bg-surface text-text-primary shadow-sm'
                    : 'text-text-tertiary'
                }`}
              >
                가용시간
              </button>
            </div>
          </div>

          {/* Routine mode */}
          {mode === 'routine' && (
            <>
              <div className="space-y-2 mb-5">
                {activeRoutines.map((routine) => {
                  const isActive = isToday && timeEntries.some((e) => e.routineId === routine.id && e.endTime === null);
                  const cumMs = cumulativeTime[routine.id] || 0;
                  const color = colorMap[routine.id];

                  return (
                    <div key={routine.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${isActive ? 'bg-primary-50 dark:bg-primary-900/10 border-primary-200 dark:border-primary-800' : 'bg-surface-secondary border-border'}`}>
                      <div
                        className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                        onClick={() => setSelectedRoutineId(routine.id)}
                      >
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                          {routine.icon && <IconDisplay icon={routine.icon} size={16} />}
                          <span className="text-[13px] font-medium text-text-primary truncate">{routine.name}</span>
                        </div>
                        <span className="text-[12px] font-mono text-text-secondary flex-shrink-0">
                          {cumMs > 0 ? formatDuration(cumMs) : '--'}
                        </span>
                      </div>

                      {isToday && (
                        <button
                          onClick={() => toggleTracking(routine.id)}
                          className={`p-2 rounded-lg transition-all flex-shrink-0 ${
                            isActive
                              ? 'bg-red-500 text-white active:scale-95'
                              : 'bg-primary-600 text-white active:scale-95'
                          }`}
                        >
                          {isActive ? <Square size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {routineTotalTime > 0 && (
                <div className="p-4 rounded-2xl bg-surface-secondary border border-border">
                  <h3 className="font-semibold text-[13px] text-text-secondary mb-3 uppercase tracking-wide">일일 누적 시간</h3>
                  <div className="space-y-2">
                    {activeRoutines
                      .filter((r) => (cumulativeTime[r.id] || 0) > 0)
                      .sort((a, b) => (cumulativeTime[b.id] || 0) - (cumulativeTime[a.id] || 0))
                      .map((routine) => {
                        const ms = cumulativeTime[routine.id] || 0;
                        const pct = routineTotalTime > 0 ? (ms / routineTotalTime) * 100 : 0;
                        const color = colorMap[routine.id];
                        return (
                          <div key={routine.id}>
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                                {routine.icon && <IconDisplay icon={routine.icon} size={13} />}
                                <span className="text-[12px] font-medium text-text-primary">{routine.name}</span>
                              </div>
                              <span className="text-[11px] font-mono text-text-secondary">{formatDuration(ms)}</span>
                            </div>
                            <div className="h-2 rounded-full bg-surface-tertiary overflow-hidden">
                              <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Available time mode */}
          {mode === 'available' && (
            <div className="space-y-4">
              <div className={`p-4 rounded-2xl border transition-all ${isAvailableActive ? 'bg-primary-50 dark:bg-primary-900/10 border-primary-200 dark:border-primary-800' : 'bg-surface-secondary border-border'}`}>
                <div className="flex items-center gap-3">
                  <div
                    className="flex items-center gap-2 flex-1 cursor-pointer min-w-0"
                    onClick={() => setSelectedRoutineId(AVAILABLE_ROUTINE_ID)}
                  >
                    <Clock size={18} className="text-text-tertiary" />
                    <span className="text-[14px] font-medium text-text-primary">가용시간</span>
                    <span className="text-[13px] font-mono text-text-secondary ml-auto">
                      {availableCumMs > 0 ? formatDuration(availableCumMs) : '--'}
                    </span>
                  </div>
                  {isToday && (
                    <button
                      onClick={() => toggleTracking(AVAILABLE_ROUTINE_ID)}
                      className={`p-2.5 rounded-xl transition-all flex-shrink-0 ${
                        isAvailableActive
                          ? 'bg-red-500 text-white active:scale-95'
                          : 'bg-primary-600 text-white active:scale-95'
                      }`}
                    >
                      {isAvailableActive ? <Square size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* 주간 뷰 */}
      {viewMode === 'weekly' && (
        <>
          {/* Mode toggle */}
          <div className="flex bg-surface-tertiary rounded-full p-1 mb-5">
            <button
              onClick={() => setMode('routine')}
              className={`flex-1 py-1.5 rounded-full text-[12px] font-semibold transition-all ${
                mode === 'routine'
                  ? 'bg-surface text-text-primary shadow-sm'
                  : 'text-text-tertiary'
              }`}
            >
              루틴
            </button>
            <button
              onClick={() => setMode('available')}
              className={`flex-1 py-1.5 rounded-full text-[12px] font-semibold transition-all ${
                mode === 'available'
                  ? 'bg-surface text-text-primary shadow-sm'
                  : 'text-text-tertiary'
              }`}
            >
              가용시간
            </button>
          </div>

          {/* 주간 총 트래킹 시간 */}
          {currentWeeklyTotalTime > 0 && (
            <div className="p-4 rounded-2xl bg-primary-50 dark:bg-primary-900/10 border border-primary-200 dark:border-primary-800 mb-5">
              <p className="text-center text-[12px] text-text-tertiary">
                {isCurrentWeek ? '이번 주' : weekLabel} 총 트래킹
              </p>
              <p className="text-center text-[24px] font-bold text-text-primary mt-1">
                {formatDuration(currentWeeklyTotalTime)}
              </p>
            </div>
          )}

          {/* 요일별 트래킹 현황 */}
          <div className="p-4 rounded-2xl bg-surface-secondary border border-border mb-5">
            <h3 className="font-semibold text-[13px] text-text-secondary mb-3 uppercase tracking-wide">요일별 트래킹</h3>
            <div className="grid grid-cols-7 gap-1">
              {weekDays.map((day) => {
                const dayStr = formatDate(day);
                const dayMs = weeklyDayTotals[dayStr] || 0;
                const maxDayMs = Math.max(...Object.values(weeklyDayTotals), 1);
                const pct = (dayMs / maxDayMs) * 100;
                const dayLabel = format(day, 'EEE', { locale: ko });
                const isCurrentDay = dayStr === todayStr;
                return (
                  <div key={dayStr} className="flex flex-col items-center gap-1">
                    <span className={`text-[10px] font-medium ${isCurrentDay ? 'text-primary-600' : 'text-text-tertiary'}`}>{dayLabel}</span>
                    <div className="w-full h-16 rounded-lg bg-surface-tertiary overflow-hidden flex flex-col justify-end">
                      {dayMs > 0 && (
                        <div
                          className="w-full rounded-lg transition-all"
                          style={{
                            height: `${pct}%`,
                            backgroundColor: isCurrentDay ? '#6366f1' : '#94a3b8',
                            opacity: 0.8,
                          }}
                        />
                      )}
                    </div>
                    <span className="text-[9px] font-mono text-text-tertiary">
                      {dayMs > 0 ? formatDuration(dayMs) : '--'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 주간 루틴별 누적 시간 */}
          {mode === 'routine' && weeklyRoutineTotalTime > 0 && (
            <div className="p-4 rounded-2xl bg-surface-secondary border border-border mb-5">
              <h3 className="font-semibold text-[13px] text-text-secondary mb-3 uppercase tracking-wide">루틴별 주간 누적</h3>
              <div className="space-y-2">
                {activeRoutines
                  .filter((r) => (weeklyCumulativeTime[r.id] || 0) > 0)
                  .sort((a, b) => (weeklyCumulativeTime[b.id] || 0) - (weeklyCumulativeTime[a.id] || 0))
                  .map((routine) => {
                    const ms = weeklyCumulativeTime[routine.id] || 0;
                    const pct = weeklyRoutineTotalTime > 0 ? (ms / weeklyRoutineTotalTime) * 100 : 0;
                    const color = colorMap[routine.id];
                    return (
                      <div key={routine.id}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                            {routine.icon && <IconDisplay icon={routine.icon} size={13} />}
                            <span className="text-[12px] font-medium text-text-primary">{routine.name}</span>
                          </div>
                          <span className="text-[11px] font-mono text-text-secondary">{formatDuration(ms)}</span>
                        </div>
                        <div className="h-2 rounded-full bg-surface-tertiary overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* 주간 가용시간 */}
          {mode === 'available' && (
            <div className="p-4 rounded-2xl bg-surface-secondary border border-border mb-5">
              <div className="flex items-center gap-3">
                <Clock size={20} className="text-text-tertiary" />
                <div className="flex-1">
                  <div className="text-[13px] font-medium text-text-primary">가용시간 주간 합계</div>
                  <div className="text-[20px] font-bold text-text-primary mt-0.5">
                    {weeklyAvailableMs > 0 ? formatDuration(weeklyAvailableMs) : '--'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 데이터 없을 때 */}
          {currentWeeklyTotalTime === 0 && (
            <div className="text-center py-12 text-text-tertiary text-[13px]">
              이 주에 트래킹된 데이터가 없습니다
            </div>
          )}
        </>
      )}

      {/* Routine detail modal */}
      {selectedRoutineId && (() => {
        let routine;
        if (selectedRoutineId === AVAILABLE_ROUTINE_ID) {
          routine = {
            id: AVAILABLE_ROUTINE_ID,
            name: '가용시간',
            icon: '⏱️',
            color: AVAILABLE_COLOR,
            keywords: [] as string[],
            order: 0,
            createdAt: '',
            archived: false,
          };
        } else {
          routine = activeRoutines.find((r) => r.id === selectedRoutineId);
          if (!routine) return null;
        }
        const routineEntries = dailyEntries.filter((e) => e.routineId === selectedRoutineId);
        const routineTotalMs = cumulativeTime[selectedRoutineId] || 0;
        return (
          <RoutineDetailModal
            routine={routine}
            entries={routineEntries}
            totalMs={routineTotalMs}
            color={colorMap[selectedRoutineId]}
            onClose={() => setSelectedRoutineId(null)}
          />
        );
      })()}
    </div>
  );
}
