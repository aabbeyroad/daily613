// Service Worker for Push Notifications - Daily613

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// Handle Web Push API push events
self.addEventListener('push', (event) => {
  if (!event.data) return;
  let data;
  try {
    data = event.data.json();
  } catch {
    data = { title: '데일리613', body: event.data.text() };
  }
  event.waitUntil(
    self.registration.showNotification(data.title || '데일리613', {
      body: data.body || '',
      icon: '/icon-192.svg',
      badge: '/icon-192.svg',
      tag: data.tag || 'retrospective',
      requireInteraction: false,
      data: { url: data.url || '/' },
    })
  );
});

// Open the app when notification is clicked
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ('focus' in client) return client.focus();
        }
        if (clients.openWindow) return clients.openWindow('/');
      })
  );
});

// Handle locally-triggered scheduled notifications from the app
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SHOW_SCHEDULED_NOTIFICATION') {
    const { title, body, tag } = event.data;
    self.registration.showNotification(title, {
      body,
      icon: '/icon-192.svg',
      badge: '/icon-192.svg',
      tag: tag || 'retrospective',
      requireInteraction: false,
      data: { url: '/' },
    });
  }
});
