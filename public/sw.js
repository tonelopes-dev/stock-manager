// Kipo PWA - Service Worker with Push Notifications
// Habilita prompt de instalação + Web Push API para notificações em background.

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Estratégia network-only: nunca intercepta requests.
self.addEventListener('fetch', () => {});

// ─── Web Push Notification Handler ───
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch {
    data = {
      title: 'Kipo',
      body: event.data.text(),
    };
  }

  const title = data.title || 'Pedido Pronto! 🍽️';
  const options = {
    body: data.body || 'Seu pedido está pronto para ser servido!',
    icon: data.icon || '/logo/logomarca-192.png',
    badge: '/logo/logomarca-192.png',
    vibrate: [200, 100, 200, 100, 300],
    sound: '/sounds/order-ready.mp3',
    tag: data.tag || 'order-ready',
    renotify: true,
    requireInteraction: true,
    data: {
      url: data.url || '/',
      orderId: data.orderId || null,
      orderNumber: data.orderNumber || null,
    },
    actions: [
      {
        action: 'view',
        title: 'Ver Pedido',
      },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// ─── Notification Click Handler ───
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // If there's already a window open, focus it and navigate
      for (const client of clients) {
        if (client.url.includes(url) && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise, open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    })
  );
});
