import type { Routine, DailyRecord, CheckLevel } from '../types';
import { formatDate, getWeekDays } from './date';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

const LEVEL_COLORS: Record<CheckLevel, string> = {
  none: '#e2e8f0',
  done: '#22c55e',
  more: '#3b82f6',
  max: '#a855f7',
};

const BG_COLOR = '#1e293b';
const TEXT_COLOR = '#f1f5f9';
const TEXT_SECONDARY = '#94a3b8';
const TODAY_RING = '#6366f1';

interface GridImageData {
  routines: Routine[];
  records: DailyRecord[];
  date: Date;
}

function getRateColor(rate: number): string {
  if (rate >= 80) return LEVEL_COLORS.done;
  if (rate >= 50) return LEVEL_COLORS.more;
  return TEXT_SECONDARY;
}

export function generateWeeklyGridImage(data: GridImageData): Promise<Blob> {
  const { routines, records, date } = data;
  const activeRoutines = routines.filter((r) => !r.archived).sort((a, b) => a.order - b.order);
  const weekDays = getWeekDays(date);
  const todayStr = formatDate(date);

  // Layout constants - designed to be wide and compact (landscape)
  const padding = 14;
  const headerHeight = 32;
  const dayHeaderHeight = 28;
  const rowHeight = 20;
  const cellGap = 3;
  const nameColWidth = 100;
  const rateColWidth = 36;
  const dailyRateRowHeight = 20;
  const legendHeight = 26;

  const routineCount = activeRoutines.length;
  const cellWidth = 60;
  const gridWidth = 7 * (cellWidth + cellGap) - cellGap;
  const canvasWidth = padding * 2 + nameColWidth + 12 + gridWidth + 8 + rateColWidth;
  const canvasHeight = padding + headerHeight + dayHeaderHeight + routineCount * (rowHeight + cellGap) - cellGap + 6 + dailyRateRowHeight + 10 + legendHeight + padding;

  // Pre-calculate rates
  const pastDays = weekDays.filter((d) => formatDate(d) <= todayStr);
  const pastDayCount = pastDays.length;

  const getLevel = (routineId: string, day: Date): CheckLevel => {
    const dateStr = formatDate(day);
    const record = records.find((r) => r.date === dateStr);
    return (record?.checks[routineId] || 'none') as CheckLevel;
  };

  // Routine rates (right column) - Mon to today only
  const routineRates: Record<string, number> = {};
  if (pastDayCount > 0) {
    activeRoutines.forEach((routine) => {
      const done = pastDays.filter((day) => getLevel(routine.id, day) !== 'none').length;
      routineRates[routine.id] = Math.round((done / pastDayCount) * 100);
    });
  }

  // Daily rates (bottom row)
  const dailyRates: (number | null)[] = weekDays.map((day) => {
    if (formatDate(day) > todayStr) return null;
    const total = activeRoutines.length;
    if (total === 0) return null;
    const done = activeRoutines.filter((r) => getLevel(r.id, day) !== 'none').length;
    return Math.round((done / total) * 100);
  });

  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth * 2; // 2x for retina
  canvas.height = canvasHeight * 2;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(2, 2);

  // Background
  ctx.fillStyle = BG_COLOR;
  ctx.beginPath();
  roundRect(ctx, 0, 0, canvasWidth, canvasHeight, 12);
  ctx.fill();

  // Title
  ctx.fillStyle = TEXT_COLOR;
  ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.textBaseline = 'middle';
  const weekStart = format(weekDays[0], 'M/d');
  const weekEnd = format(weekDays[6], 'M/d');
  ctx.fillText(`이 주의 루틴현황  ${weekStart} - ${weekEnd}`, padding, padding + headerHeight / 2);

  const gridStartX = padding + nameColWidth + 12;
  const gridStartY = padding + headerHeight;
  const rateColX = gridStartX + gridWidth + 8;

  // Rate column header
  ctx.fillStyle = TEXT_SECONDARY;
  ctx.font = '9px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('달성', rateColX + rateColWidth / 2, gridStartY + dayHeaderHeight / 2);

  // Day headers
  weekDays.forEach((day, i) => {
    const x = gridStartX + i * (cellWidth + cellGap);
    const isToday = formatDate(day) === todayStr;

    if (isToday) {
      ctx.fillStyle = TODAY_RING + '20';
      ctx.beginPath();
      roundRect(ctx, x, gridStartY, cellWidth, dayHeaderHeight - 2, 4);
      ctx.fill();
    }

    ctx.fillStyle = isToday ? TODAY_RING : TEXT_SECONDARY;
    ctx.font = `${isToday ? 'bold ' : ''}10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${format(day, 'EEE', { locale: ko })} ${format(day, 'd')}`, x + cellWidth / 2, gridStartY + dayHeaderHeight / 2);
  });

  ctx.textAlign = 'left';

  // Routine rows
  const rowStartY = gridStartY + dayHeaderHeight;
  activeRoutines.forEach((routine, ri) => {
    const y = rowStartY + ri * (rowHeight + cellGap);

    // Routine name
    ctx.fillStyle = TEXT_COLOR;
    ctx.font = '10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textBaseline = 'middle';
    const name = truncateText(ctx, routine.name, nameColWidth);
    ctx.fillText(name, padding, y + rowHeight / 2);

    // Day cells
    weekDays.forEach((day, di) => {
      const x = gridStartX + di * (cellWidth + cellGap);
      const dateStr = formatDate(day);
      const level = getLevel(routine.id, day);
      const isToday = dateStr === todayStr;

      // Today ring
      if (isToday) {
        ctx.strokeStyle = TODAY_RING;
        ctx.lineWidth = 2;
        ctx.beginPath();
        roundRect(ctx, x - 1, y - 1, cellWidth + 2, rowHeight + 2, 5);
        ctx.stroke();
      }

      // Cell
      ctx.fillStyle = LEVEL_COLORS[level];
      ctx.beginPath();
      roundRect(ctx, x, y, cellWidth, rowHeight, 4);
      ctx.fill();
    });

    // Routine rate (right column)
    const rate = routineRates[routine.id] ?? 0;
    ctx.fillStyle = getRateColor(rate);
    ctx.font = 'bold 9px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${rate}%`, rateColX + rateColWidth / 2, y + rowHeight / 2);
    ctx.textAlign = 'left';
  });

  // Daily rate row (bottom)
  const dailyRateY = rowStartY + routineCount * (rowHeight + cellGap) + 3;

  // Divider above daily rates
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(gridStartX, dailyRateY - 2);
  ctx.lineTo(gridStartX + gridWidth, dailyRateY - 2);
  ctx.stroke();

  // "전체" label
  ctx.fillStyle = TEXT_SECONDARY;
  ctx.font = '9px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.textBaseline = 'middle';
  ctx.fillText('전체', padding, dailyRateY + dailyRateRowHeight / 2);

  // Daily rate values
  weekDays.forEach((_day, i) => {
    const x = gridStartX + i * (cellWidth + cellGap);
    const rate = dailyRates[i];

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (rate !== null) {
      ctx.fillStyle = getRateColor(rate);
      ctx.font = 'bold 9px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(`${rate}%`, x + cellWidth / 2, dailyRateY + dailyRateRowHeight / 2);
    } else {
      ctx.fillStyle = TEXT_SECONDARY;
      ctx.font = '9px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText('-', x + cellWidth / 2, dailyRateY + dailyRateRowHeight / 2);
    }
  });
  ctx.textAlign = 'left';

  // Legend
  const legendY = dailyRateY + dailyRateRowHeight + 8;
  const legendItems: { label: string; color: string }[] = [
    { label: '미완료', color: LEVEL_COLORS.none },
    { label: 'Done', color: LEVEL_COLORS.done },
    { label: 'More', color: LEVEL_COLORS.more },
    { label: 'Max', color: LEVEL_COLORS.max },
  ];

  // Divider above legend
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padding, legendY - 4);
  ctx.lineTo(canvasWidth - padding, legendY - 4);
  ctx.stroke();

  const totalLegendWidth = legendItems.reduce((acc, item) => {
    ctx.font = '9px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    return acc + 10 + 4 + ctx.measureText(item.label).width + 14;
  }, -14);
  let legendX = (canvasWidth - totalLegendWidth) / 2;

  legendItems.forEach((item) => {
    ctx.fillStyle = item.color;
    ctx.beginPath();
    roundRect(ctx, legendX, legendY + 4, 10, 10, 2);
    ctx.fill();

    ctx.fillStyle = TEXT_SECONDARY;
    ctx.font = '9px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textBaseline = 'middle';
    ctx.fillText(item.label, legendX + 14, legendY + 9);
    legendX += 14 + ctx.measureText(item.label).width + 14;
  });

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('Canvas toBlob returned null'));
      }
    }, 'image/png');
  });
}

function truncateText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let truncated = text;
  while (ctx.measureText(truncated + '…').width > maxWidth && truncated.length > 0) {
    truncated = truncated.slice(0, -1);
  }
  return truncated + '…';
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}
