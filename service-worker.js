const CACHE_PREFIX = 'planificador-';

self.addEventListener('install', event => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter(key => key.startsWith(CACHE_PREFIX))
        .map(key => caches.delete(key))
    );

    await self.registration.unregister();

    const windows = await self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    });

    await Promise.all(
      windows.map(client => client.navigate(client.url).catch(() => undefined))
    );
  })());
});
