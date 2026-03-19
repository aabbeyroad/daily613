import { useEffect, useRef } from 'react';
import { subDays, subWeeks } from 'date-fns';
import { useRoutineStore } from '../stores/routineStore';
import { showNotification, registerServiceWorker, getNotificationPermission } from '../utils/pushNotification';
import { formatDate, getWeekKey } from '../utils/date';
import type { Reflection } from '../types';

const LAST_DAILY_NOTIF_KEY = 'pushNotif_lastDaily';
const LAST_WEEKLY_NOTIF_KEY = 'pushNotif_lastWeekly';

function buildDailyContent(reflections: Reflection[]): { title: string; body: string } {
  const yesterdayStr = formatDate(subDays(new Date(), 1));
  const ref = reflections.find((r) => r.date === yesterdayStr && r.type === 'daily');

  if (!ref || (!ref.keep && !ref.problem && !ref.try)) {
    return { title: '📝 오늘의 회고 작성 시간', body: '어제의 루틴을 돌아보고 회고를 작성해보세요.' };
  }

  const parts: string[] = [];
  if (ref.keep) parts.push(`✅ Keep: ${ref.keep.slice(0, 60)}`);
  if (ref.problem) parts.push(`⚠️ Problem: ${ref.problem.slice(0, 60)}`);
  if (ref.try) parts.push(`💡 Try: ${ref.try.slice(0, 60)}`);

  return { title: '📖 어제의 회고를 확인하세요', body: parts.join('\n') };
}

function buildWeeklyContent(reflections: Reflection[]): { title: string; body: string } {
  const weekKey = getWeekKey(subWeeks(new Date(), 1));
  const ref = reflections.find((r) => r.date === weekKey && r.type === 'weekly');

  if (!ref || (!ref.keep && !ref.problem && !ref.try)) {
    return { title: '📊 주간 회고 작성 시간', body: '지난 주를 돌아보고 주간 회고를 작성해보세요.' };
  }

  const parts: string[] = [];
  if (ref.keep) parts.push(`✅ Keep: ${ref.keep.slice(0, 70)}`);
  if (ref.try) parts.push(`💡 Try: ${ref.try.slice(0, 70)}`);

  return { title: '📊 지난 주 회고를 확인하세요', body: parts.join('\n') };
}

export function useNotificationScheduler() {
  const settings = useRoutineStore((s) => s.settings);
  const reflections = useRoutineStore((s) => s.reflections);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    registerServiceWorker();
  }, []);

  useEffect(() => {
    const pushSettings = settings.pushNotification;

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (!pushSettings?.enabled || getNotificationPermission() !== 'granted') return;

    const checkAndNotify = () => {
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      if (currentTime !== pushSettings.time) return;

      const today = formatDate(now);

      if (pushSettings.frequency === 'daily') {
        const lastSent = localStorage.getItem(LAST_DAILY_NOTIF_KEY);
        if (lastSent === today) return;
        const { title, body } = buildDailyContent(reflections);
        showNotification(title, body, 'daily-retrospective');
        localStorage.setItem(LAST_DAILY_NOTIF_KEY, today);
      } else {
        // weekly: send on Mondays only
        if (now.getDay() !== 1) return;
        const lastSent = localStorage.getItem(LAST_WEEKLY_NOTIF_KEY);
        if (lastSent === today) return;
        const { title, body } = buildWeeklyContent(reflections);
        showNotification(title, body, 'weekly-retrospective');
        localStorage.setItem(LAST_WEEKLY_NOTIF_KEY, today);
      }
    };

    checkAndNotify();
    intervalRef.current = setInterval(checkAndNotify, 60 * 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [settings.pushNotification, reflections]);
}
