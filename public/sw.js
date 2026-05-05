// Kipo PWA - Minimal Service Worker
// Apenas para habilitar o prompt de instalação no Chrome/Android.
// Não faz cache offline por design.

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Estratégia network-only: nunca intercepta requests.
self.addEventListener('fetch', () => {});
