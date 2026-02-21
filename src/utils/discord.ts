import type { Routine, CheckLevel, Reflection, DailyRecord } from '../types';
import { generateWeeklyGridImage } from './weeklyGridImage';

interface ReportData {
  date: string;
  routines: Routine[];
  checks: Record<string, CheckLevel>;
  reflection?: Reflection;
  username?: string;
  records?: DailyRecord[]; // 월간 통계용
}

export interface DiscordReportResult {
  ok: boolean;
  hasImage: boolean;
  error?: string;
}

export const sendDiscordReport = async (
  webhookUrl: string,
  data: ReportData
): Promise<DiscordReportResult> => {
  const { date, routines, checks, reflection, username, records } = data;
  const activeRoutines = routines.filter((r) => !r.archived);
  const total = activeRoutines.length;
  const doneCount = activeRoutines.filter((r) => checks[r.id] && checks[r.id] !== 'none').length;
  const moreCount = activeRoutines.filter((r) => checks[r.id] === 'more' || checks[r.id] === 'max').length;
  const maxCount = activeRoutines.filter((r) => checks[r.id] === 'max').length;
  const rate = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  // 월간 리포트 횟수 계산
  const currentMonth = date.slice(0, 7); // "2024-01" 형식
  let monthlyReportCount = 1; // 오늘 포함
  if (records) {
    monthlyReportCount = records.filter((r) => {
      if (!r.date.startsWith(currentMonth)) return false;
      // 해당 날짜에 하나라도 체크한 기록이 있으면 카운트
      return Object.values(r.checks).some((v) => v && v !== 'none');
    }).length;
    // 오늘 기록이 아직 records에 없을 수 있으므로 체크
    const todayInRecords = records.some((r) => r.date === date);
    if (!todayInRecords && doneCount > 0) {
      monthlyReportCount += 1;
    }
  }

  const levelEmoji = (level: CheckLevel): string => {
    switch (level) {
      case 'max': return '🟣';
      case 'more': return '🔵';
      case 'done': return '🟢';
      default: return '⚪';
    }
  };

  // 루틴별 상세 (달성 목표 내용 포함)
  const routineLines = activeRoutines
    .map((r) => {
      const level = checks[r.id] || 'none';
      const emoji = levelEmoji(level);
      
      // 달성한 단계의 구체적 목표 표시
      let goalText = '';
      if (level === 'done') {
        goalText = r.doneGoal ? ` (${r.doneGoal})` : '';
      } else if (level === 'more') {
        goalText = r.moreGoal ? ` (${r.moreGoal})` : '';
      } else if (level === 'max') {
        goalText = r.maxGoal ? ` (${r.maxGoal})` : '';
      }
      
      const levelText = level === 'none' ? '-' : `**${level.toUpperCase()}**${goalText}`;
      const iconPrefix = r.icon && !r.icon.startsWith('lucide:') ? `${r.icon} ` : '';
      return `${emoji} ${iconPrefix}${r.name}: ${levelText}`;
    })
    .join('\n');

  const fields = [
    { 
      name: '📊 달성 현황', 
      value: `Done: ${doneCount}/${total} | More: ${moreCount}/${total} | Max: ${maxCount}/${total}\n달성률: **${rate}%**`, 
      inline: false 
    },
    { 
      name: '📋 루틴 상세', 
      value: routineLines || '등록된 루틴이 없습니다.', 
      inline: false 
    },
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

  try {
    // 주간 루틴현황 이미지 생성 시도
    let imageBlob: Blob | null = null;
    try {
      imageBlob = await generateWeeklyGridImage({
        routines,
        records: records || [],
        date: new Date(date),
      });
    } catch (e) {
      console.warn('주간 루틴 이미지 생성 실패:', e instanceof Error ? e.message : e);
    }

    const hasImage = imageBlob && imageBlob.size > 0;

    const embed = {
      title: `📅 일일 리포트 — ${date}`,
      description: `📆 이번 달 **${monthlyReportCount}번째** 리포트`,
      color: rate >= 80 ? 0x22c55e : rate >= 50 ? 0x3b82f6 : 0xef4444,
      fields,
      ...(hasImage && { image: { url: 'attachment://weekly-routine.png' } }),
      footer: { text: `${username || '루틴 트래커'} • ${currentMonth}` },
      timestamp: new Date().toISOString(),
      ...(username && { author: { name: username } }),
    };

    let res: Response;

    if (hasImage) {
      console.log('이미지 생성 성공:', imageBlob!.size, 'bytes');
      const formData = new FormData();
      formData.append(
        'payload_json',
        JSON.stringify({
          username: username || '루틴 트래커',
          embeds: [embed],
          attachments: [{ id: 0, filename: 'weekly-routine.png', description: '이 주의 루틴현황' }],
        })
      );
      formData.append('files[0]', new File([imageBlob!], 'weekly-routine.png', { type: 'image/png' }));

      res = await fetch(webhookUrl, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        console.error('Discord 전송 실패:', res.status, errText);
        return { ok: false, hasImage: true, error: `${res.status}: ${errText}` };
      }
      return { ok: true, hasImage: true };
    } else {
      console.log('이미지 없이 텍스트만 전송');
      res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username || '루틴 트래커',
          embeds: [embed],
        }),
      });
      return { ok: res.ok, hasImage: false };
    }
  } catch (e) {
    console.error('Discord 전송 예외:', e);
    return { ok: false, hasImage: false, error: e instanceof Error ? e.message : String(e) };
  }
};
