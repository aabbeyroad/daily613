import type { Routine, DailyRecord, Reflection } from '../types';

interface ExportData {
  routines: Routine[];
  records: DailyRecord[];
  reflections: Reflection[];
}

// JSON 내보내기 - 날짜별 정리
export const exportJSON = (data: ExportData & { settings?: unknown; exportedAt?: string }): void => {
  const { routines, records, reflections } = data;
  
  // 모든 날짜 수집 및 정렬
  const allDates = new Set<string>();
  records.forEach((r) => allDates.add(r.date));
  reflections.forEach((r) => allDates.add(r.date));
  const sortedDates = Array.from(allDates).sort((a, b) => b.localeCompare(a));

  // 루틴 맵 생성
  const routineMap = new Map(routines.map((r) => [r.id, r]));

  // 날짜별 데이터 정리
  const dailyData = sortedDates.map((date) => {
    const record = records.find((r) => r.date === date);
    const dailyReflection = reflections.find((r) => r.date === date && r.type === 'daily');
    const weeklyReflection = reflections.find((r) => r.date === date && r.type === 'weekly');

    // 루틴 달성 현황
    const routineResults: Record<string, { name: string; level: string; keywords: string[] }> = {};
    if (record) {
      Object.entries(record.checks).forEach(([routineId, level]) => {
        const routine = routineMap.get(routineId);
        if (routine) {
          routineResults[routine.name] = {
            name: routine.name,
            level: level || 'none',
            keywords: routine.keywords,
          };
        }
      });
    }

    return {
      date,
      routines: routineResults,
      dailyReflection: dailyReflection
        ? { keep: dailyReflection.keep, problem: dailyReflection.problem, try: dailyReflection.try }
        : null,
      weeklyReflection: weeklyReflection
        ? { keep: weeklyReflection.keep, problem: weeklyReflection.problem, try: weeklyReflection.try }
        : null,
    };
  });

  // 루틴 목록 (메타데이터)
  const routineList = routines.map((r) => ({
    name: r.name,
    keywords: r.keywords,
    goals: { done: r.doneGoal, more: r.moreGoal, max: r.maxGoal },
  }));

  const exportData = {
    exportedAt: new Date().toISOString(),
    summary: {
      totalDays: sortedDates.length,
      totalRoutines: routines.filter((r) => !r.archived).length,
      totalReflections: reflections.length,
    },
    routines: routineList,
    dailyRecords: dailyData,
  };

  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `routine-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

// CSV 내보내기 - 상세 기록
export const exportCSV = (routines: Routine[], records: DailyRecord[], reflections?: Reflection[]): void => {
  const activeRoutines = routines.filter((r) => !r.archived);
  
  // 모든 날짜 수집
  const allDates = new Set<string>();
  records.forEach((r) => allDates.add(r.date));
  if (reflections) {
    reflections.forEach((r) => allDates.add(r.date));
  }
  const sortedDates = Array.from(allDates).sort((a, b) => b.localeCompare(a));

  // CSV 헤더
  const headers = [
    '날짜',
    ...activeRoutines.map((r) => r.name),
    '달성률(%)',
    '일간회고-Keep',
    '일간회고-Problem',
    '일간회고-Try',
    '주간회고-Keep',
    '주간회고-Problem',
    '주간회고-Try',
  ];

  // CSV 행 데이터
  const rows = sortedDates.map((date) => {
    const record = records.find((r) => r.date === date);
    const dailyRef = reflections?.find((r) => r.date === date && r.type === 'daily');
    const weeklyRef = reflections?.find((r) => r.date === date && r.type === 'weekly');

    // 루틴 달성 현황
    const routineValues = activeRoutines.map((r) => {
      const level = record?.checks[r.id] || 'none';
      return level === 'none' ? '-' : level.toUpperCase();
    });

    // 달성률 계산
    const completed = activeRoutines.filter(
      (r) => record?.checks[r.id] && record.checks[r.id] !== 'none'
    ).length;
    const rate = activeRoutines.length > 0 ? Math.round((completed / activeRoutines.length) * 100) : 0;

    return [
      date,
      ...routineValues,
      rate.toString(),
      escapeCsvField(dailyRef?.keep || ''),
      escapeCsvField(dailyRef?.problem || ''),
      escapeCsvField(dailyRef?.try || ''),
      escapeCsvField(weeklyRef?.keep || ''),
      escapeCsvField(weeklyRef?.problem || ''),
      escapeCsvField(weeklyRef?.try || ''),
    ];
  });

  const csv = [headers.map(escapeCsvField), ...rows].map((row) => row.join(',')).join('\n');
  
  // BOM 추가 (한글 엑셀 호환)
  const bom = '\uFEFF';
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `routine-records-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

// CSV 필드 이스케이프 (쉼표, 줄바꿈, 따옴표 처리)
function escapeCsvField(field: string): string {
  if (!field) return '';
  const needsQuotes = field.includes(',') || field.includes('\n') || field.includes('"');
  if (needsQuotes) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

// 마크다운 내보내기
export const exportMarkdown = (data: ExportData): void => {
  const { routines, records, reflections } = data;
  
  // 모든 날짜 수집 및 정렬
  const allDates = new Set<string>();
  records.forEach((r) => allDates.add(r.date));
  reflections.forEach((r) => allDates.add(r.date));
  const sortedDates = Array.from(allDates).sort((a, b) => b.localeCompare(a));

  let md = `# 루틴 트래커 기록\n\n`;
  md += `> 내보내기 날짜: ${new Date().toLocaleDateString('ko-KR')}\n\n`;
  md += `---\n\n`;

  sortedDates.forEach((date) => {
    const record = records.find((r) => r.date === date);
    const dailyRef = reflections.find((r) => r.date === date && r.type === 'daily');
    const weeklyRef = reflections.find((r) => r.date === date && r.type === 'weekly');

    md += `## 📅 ${date}\n\n`;

    // 루틴 달성 현황
    if (record) {
      md += `### ✅ 루틴 달성\n\n`;
      const activeRoutines = routines.filter((r) => !r.archived);
      activeRoutines.forEach((routine) => {
        const level = record.checks[routine.id] || 'none';
        const emoji = level === 'max' ? '🟣' : level === 'more' ? '🔵' : level === 'done' ? '🟢' : '⚪';
        md += `- ${emoji} **${routine.name}**: ${level === 'none' ? '-' : level.toUpperCase()}\n`;
      });
      md += '\n';
    }

    // 일간 회고
    if (dailyRef) {
      md += `### 📝 일간 회고\n\n`;
      if (dailyRef.keep) md += `**Keep**: ${dailyRef.keep}\n\n`;
      if (dailyRef.problem) md += `**Problem**: ${dailyRef.problem}\n\n`;
      if (dailyRef.try) md += `**Try**: ${dailyRef.try}\n\n`;
    }

    // 주간 회고
    if (weeklyRef) {
      md += `### 📋 주간 회고\n\n`;
      if (weeklyRef.keep) md += `**Keep**: ${weeklyRef.keep}\n\n`;
      if (weeklyRef.problem) md += `**Problem**: ${weeklyRef.problem}\n\n`;
      if (weeklyRef.try) md += `**Try**: ${weeklyRef.try}\n\n`;
    }

    md += `---\n\n`;
  });

  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `routine-records-${new Date().toISOString().slice(0, 10)}.md`;
  a.click();
  URL.revokeObjectURL(url);
};
