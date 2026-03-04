import { useState, useEffect, useMemo } from 'react';
import { Play, Square } from 'lucide-react';
import { useRoutineStore } from '../../stores/routineStore';
import { formatDate } from '../../utils/date';
import { IconDisplay } from '../settings/RoutineForm';

const ROUTINE_COLORS = [
  '#6366f1', '#f43f5e', '#10b981', '#f59e0b', '#3b82f6',
  '#8b5cf6', '#ec4899', '#14b8a6', '#ef4444', '#06b6d4',
  '#84cc16', '#a855f7', '#f97316', '#22d3ee', '#e879f9',
];

function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function Clock24({ entries, colorMap }: {
  entries: { routineId: string; startMin: number; endMin: number }[];
  colorMap: Record<string, string>;
}) {
  const size = 280;
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
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-[280px] mx-auto">
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

      {(() => {
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
    </svg>
  );
}

export default function TrackingTab() {
  const routines = useRoutineStore((s) => s.routines);
  const timeEntries = useRoutineStore((s) => s.timeEntries);
  const toggleTracking = useRoutineStore((s) => s.toggleTracking);
  const [, setTick] = useState(0);

  const today = formatDate(new Date());
  const activeRoutines = useMemo(() => routines.filter((r) => !r.archived), [routines]);

  const colorMap = useMemo(() => {
    const map: Record<string, string> = {};
    activeRoutines.forEach((r, i) => {
      map[r.id] = ROUTINE_COLORS[i % ROUTINE_COLORS.length];
    });
    return map;
  }, [activeRoutines]);

  const todayEntries = useMemo(() =>
    timeEntries.filter((e) => e.date === today),
    [timeEntries, today]
  );

  const hasActive = todayEntries.some((e) => e.endTime === null);

  useEffect(() => {
    if (!hasActive) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [hasActive]);

  const clockEntries = useMemo(() => {
    const now = new Date();
    return todayEntries.map((e) => {
      const start = new Date(e.startTime);
      const end = e.endTime ? new Date(e.endTime) : now;
      const startMin = start.getHours() * 60 + start.getMinutes();
      const endMin = end.getHours() * 60 + end.getMinutes();
      return { routineId: e.routineId, startMin, endMin: endMin <= startMin ? endMin + 1 : endMin };
    });
  }, [todayEntries, hasActive ? Math.floor(Date.now() / 1000) : 0]);

  const cumulativeTime = useMemo(() => {
    const now = Date.now();
    const map: Record<string, number> = {};
    todayEntries.forEach((e) => {
      const start = new Date(e.startTime).getTime();
      const end = e.endTime ? new Date(e.endTime).getTime() : now;
      map[e.routineId] = (map[e.routineId] || 0) + (end - start);
    });
    return map;
  }, [todayEntries, hasActive ? Math.floor(Date.now() / 1000) : 0]);

  const totalTime = Object.values(cumulativeTime).reduce((a, b) => a + b, 0);

  return (
    <div className="px-4 pt-5 pb-4">
      <h2 className="font-bold text-[15px] text-text-primary mb-4">시간 트래킹</h2>

      <div className="mb-5 p-4 rounded-2xl bg-surface-secondary border border-border">
        <Clock24 entries={clockEntries} colorMap={colorMap} />
        {totalTime > 0 && (
          <p className="text-center text-[12px] text-text-tertiary mt-2">
            오늘 총 트래킹: <span className="font-bold text-text-primary">{formatDuration(totalTime)}</span>
          </p>
        )}
      </div>

      <div className="space-y-2 mb-5">
        {activeRoutines.map((routine) => {
          const isActive = todayEntries.some((e) => e.routineId === routine.id && e.endTime === null);
          const cumMs = cumulativeTime[routine.id] || 0;
          const color = colorMap[routine.id];

          return (
            <div key={routine.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${isActive ? 'bg-primary-50 dark:bg-primary-900/10 border-primary-200 dark:border-primary-800' : 'bg-surface-secondary border-border'}`}>
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />

              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                {routine.icon && <IconDisplay icon={routine.icon} size={16} />}
                <span className="text-[13px] font-medium text-text-primary truncate">{routine.name}</span>
              </div>

              <span className="text-[12px] font-mono text-text-secondary flex-shrink-0">
                {cumMs > 0 ? formatDuration(cumMs) : '--'}
              </span>

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
            </div>
          );
        })}
      </div>

      {totalTime > 0 && (
        <div className="p-4 rounded-2xl bg-surface-secondary border border-border">
          <h3 className="font-semibold text-[13px] text-text-secondary mb-3 uppercase tracking-wide">일일 누적 시간</h3>
          <div className="space-y-2">
            {activeRoutines
              .filter((r) => (cumulativeTime[r.id] || 0) > 0)
              .sort((a, b) => (cumulativeTime[b.id] || 0) - (cumulativeTime[a.id] || 0))
              .map((routine) => {
                const ms = cumulativeTime[routine.id] || 0;
                const pct = totalTime > 0 ? (ms / totalTime) * 100 : 0;
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
    </div>
  );
}
