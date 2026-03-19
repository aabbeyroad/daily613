const SW_PATH = '/sw.js';

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null;
  try {
    const registration = await navigator.serviceWorker.register(SW_PATH);
    return registration;
  } catch (error) {
    console.error('Service Worker 등록 실패:', error);
    return null;
  }
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) return 'denied';
  if (Notification.permission !== 'default') return Notification.permission;
  return await Notification.requestPermission();
}

export function getNotificationPermission(): NotificationPermission {
  if (!('Notification' in window)) return 'denied';
  return Notification.permission;
}

export function canUseNotifications(): boolean {
  return 'Notification' in window && 'serviceWorker' in navigator;
}

export async function showNotification(
  title: string,
  body: string,
  tag = 'retrospective'
): Promise<void> {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, {
        body,
        icon: '/icon-192.svg',
        badge: '/icon-192.svg',
        tag,
        requireInteraction: false,
        data: { url: '/' },
      });
      return;
    } catch {
      // fall through to direct Notification API
    }
  }

  new Notification(title, { body, icon: '/icon-192.svg', tag });
}
