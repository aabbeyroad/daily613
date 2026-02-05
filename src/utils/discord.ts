import type { Routine, CheckLevel, Reflection } from '../types';

interface ReportData {
  date: string;
  routines: Routine[];
  checks: Record<string, CheckLevel>;
  reflection?: Reflection;
  username?: string;
}

export const sendDiscordReport = async (
  webhookUrl: string,
  data: ReportData
): Promise<boolean> => {
  const { date, routines, checks, reflection, username } = data;
  const activeRoutines = routines.filter((r) => !r.archived);
  const total = activeRoutines.length;
  const doneCount = activeRoutines.filter((r) => checks[r.id] && checks[r.id] !== 'none').length;
  const moreCount = activeRoutines.filter((r) => checks[r.id] === 'more' || checks[r.id] === 'max').length;
  const maxCount = activeRoutines.filter((r) => checks[r.id] === 'max').length;
  const rate = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  const levelEmoji = (level: CheckLevel): string => {
    switch (level) {
      case 'max': return '🟣';
      case 'more': return '🔵';
      case 'done': return '🟢';
      default: return '⚪';
    }
  };

  const routineLines = activeRoutines
    .map((r) => `${levelEmoji(checks[r.id] || 'none')} ${r.name}: **${checks[r.id] === 'none' || !checks[r.id] ? '-' : checks[r.id].toUpperCase()}**`)
    .join('\n');

  const fields = [
    { name: '📊 달성 현황', value: `Done: ${doneCount}/${total} | More: ${moreCount}/${total} | Max: ${maxCount}/${total}`, inline: false },
    { name: '📋 루틴 상세', value: routineLines || '등록된 루틴이 없습니다.', inline: false },
  ];

  if (reflection) {
    const kptLines = [];
    if (reflection.keep) kptLines.push(`**Keep:** ${reflection.keep}`);
    if (reflection.problem) kptLines.push(`**Problem:** ${reflection.problem}`);
    if (reflection.try) kptLines.push(`**Try:** ${reflection.try}`);
    if (kptLines.length > 0) {
      fields.push({ name: '📝 오늘의 회고', value: kptLines.join('\n'), inline: false });
    }
  }

  const embed = {
    title: `📅 일일 리포트 — ${date}`,
    color: rate >= 80 ? 0x22c55e : rate >= 50 ? 0x3b82f6 : 0xef4444,
    fields,
    footer: { text: `달성률: ${rate}%` },
    timestamp: new Date().toISOString(),
    ...(username && { author: { name: username } }),
  };

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: username || '루틴 트래커',
        embeds: [embed],
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
};
