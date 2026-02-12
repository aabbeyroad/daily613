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

export function generateWeeklyGridImage(data: GridImageData): Promise<Blob> {
  const { routines, records, date } = data;
  const activeRoutines = routines.filter((r) => !r.archived).sort((a, b) => a.order - b.order);
  const weekDays = getWeekDays(date);
  const todayStr = formatDate(date);

  // Layout constants - designed to be wide (landscape)
  const padding = 20;
  const headerHeight = 50;
  const dayHeaderHeight = 40;
  const rowHeight = 32;
  const cellGap = 4;
  const nameColWidth = 120;
  const legendHeight = 36;

  const routineCount = activeRoutines.length;
  const cellWidth = 60;
  const gridWidth = 7 * (cellWidth + cellGap) - cellGap;
  const canvasWidth = padding * 2 + nameColWidth + 12 + gridWidth;
  const canvasHeight = padding + headerHeight + dayHeaderHeight + routineCount * (rowHeight + cellGap) - cellGap + 16 + legendHeight + padding;

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
  ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.textBaseline = 'middle';
  ctx.fillText('이 주의 루틴현황', padding, padding + headerHeight / 2 - 4);

  // Week range text
  const weekStart = format(weekDays[0], 'M/d');
  const weekEnd = format(weekDays[6], 'M/d');
  ctx.fillStyle = TEXT_SECONDARY;
  ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(`${weekStart} - ${weekEnd}`, padding, padding + headerHeight / 2 + 14);

  const gridStartX = padding + nameColWidth + 12;
  const gridStartY = padding + headerHeight;

  // Day headers
  weekDays.forEach((day, i) => {
    const x = gridStartX + i * (cellWidth + cellGap);
    const isToday = formatDate(day) === todayStr;

    if (isToday) {
      ctx.fillStyle = TODAY_RING + '20';
      ctx.beginPath();
      roundRect(ctx, x, gridStartY, cellWidth, dayHeaderHeight - 4, 6);
      ctx.fill();
    }

    ctx.fillStyle = isToday ? TODAY_RING : TEXT_SECONDARY;
    ctx.font = `${isToday ? 'bold ' : ''}12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(format(day, 'EEE', { locale: ko }), x + cellWidth / 2, gridStartY + dayHeaderHeight / 2 - 6);

    ctx.font = `${isToday ? 'bold ' : ''}11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.fillText(format(day, 'd'), x + cellWidth / 2, gridStartY + dayHeaderHeight / 2 + 8);
  });

  ctx.textAlign = 'left';

  // Routine rows
  const rowStartY = gridStartY + dayHeaderHeight;
  activeRoutines.forEach((routine, ri) => {
    const y = rowStartY + ri * (rowHeight + cellGap);

    // Routine name
    ctx.fillStyle = TEXT_COLOR;
    ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textBaseline = 'middle';
    const name = truncateText(ctx, routine.name, nameColWidth);
    ctx.fillText(name, padding, y + rowHeight / 2);

    // Day cells
    weekDays.forEach((day, di) => {
      const x = gridStartX + di * (cellWidth + cellGap);
      const dateStr = formatDate(day);
      const record = records.find((r) => r.date === dateStr);
      const level = (record?.checks[routine.id] || 'none') as CheckLevel;
      const isToday = dateStr === todayStr;

      // Today ring
      if (isToday) {
        ctx.strokeStyle = TODAY_RING;
        ctx.lineWidth = 2;
        ctx.beginPath();
        roundRect(ctx, x - 1, y - 1, cellWidth + 2, rowHeight + 2, 7);
        ctx.stroke();
      }

      // Cell
      ctx.fillStyle = LEVEL_COLORS[level];
      ctx.beginPath();
      roundRect(ctx, x, y, cellWidth, rowHeight, 6);
      ctx.fill();
    });
  });

  // Legend
  const legendY = rowStartY + routineCount * (rowHeight + cellGap) + 12;
  const legendItems: { label: string; color: string }[] = [
    { label: '미완료', color: LEVEL_COLORS.none },
    { label: 'Done', color: LEVEL_COLORS.done },
    { label: 'More', color: LEVEL_COLORS.more },
    { label: 'Max', color: LEVEL_COLORS.max },
  ];

  // Divider
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padding, legendY - 4);
  ctx.lineTo(canvasWidth - padding, legendY - 4);
  ctx.stroke();

  const totalLegendWidth = legendItems.reduce((acc, item) => {
    ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    return acc + 14 + 6 + ctx.measureText(item.label).width + 20;
  }, -20);
  let legendX = (canvasWidth - totalLegendWidth) / 2;

  legendItems.forEach((item) => {
    ctx.fillStyle = item.color;
    ctx.beginPath();
    roundRect(ctx, legendX, legendY + 6, 12, 12, 3);
    ctx.fill();

    ctx.fillStyle = TEXT_SECONDARY;
    ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textBaseline = 'middle';
    ctx.fillText(item.label, legendX + 18, legendY + 12);
    legendX += 18 + ctx.measureText(item.label).width + 20;
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
