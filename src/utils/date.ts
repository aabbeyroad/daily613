import { format, startOfWeek, endOfWeek, eachDayOfInterval, startOfMonth as dateFnsStartOfMonth, endOfMonth as dateFnsEndOfMonth, subDays } from 'date-fns';
import { ko } from 'date-fns/locale';

export const formatDate = (date: Date): string => format(date, 'yyyy-MM-dd');

export const formatDisplayDate = (date: Date): string =>
  format(date, 'M월 d일 (EEE)', { locale: ko });

export const getWeekDays = (date: Date): Date[] => {
  const start = startOfWeek(date, { weekStartsOn: 1 });
  const end = endOfWeek(date, { weekStartsOn: 1 });
  return eachDayOfInterval({ start, end });
};

export const getWeekKey = (date: Date): string => {
  const start = startOfWeek(date, { weekStartsOn: 1 });
  return formatDate(start);
};

export const startOfMonth = (date: Date): Date => dateFnsStartOfMonth(date);
export const endOfMonth = (date: Date): Date => dateFnsEndOfMonth(date);

export const getStreak = (
  records: Record<string, Record<string, string>>,
  today: Date
): number => {
  let streak = 0;
  let currentDate = subDays(today, 1);

  while (true) {
    const dateStr = formatDate(currentDate);
    const record = records[dateStr];
    if (!record || Object.keys(record).length === 0) break;
    const hasAnyCheck = Object.values(record).some((v) => v && v !== 'none');
    if (!hasAnyCheck) break;
    streak++;
    currentDate = subDays(currentDate, 1);
  }

  const todayStr = formatDate(today);
  const todayRecord = records[todayStr];
  if (todayRecord && Object.values(todayRecord).some((v) => v && v !== 'none')) {
    streak++;
  }

  return streak;
};
