const CACHE_NAME = 'planificador-semanal-v15';
const APP_SHELL = [
  './',
  './index.html',
  './styles.css?v=13',
  './app.js?v=13',
  './month.js?v=13',
  './mobile.js?v=13',
  './game.js?v=14',
  './game-fixes.js?v=15',
  './manifest.webmanifest',
  './icons/icon.svg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

async function injectGameLoader(response) {
  if (!response) return response;
  const text = await response.text();
  const marker = 'planner-game-loader-v15';
  if (text.includes(marker)) {
    return new Response(text, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers
    });
  }

  const injected = text + `\n;/* ${marker} */(() => {\n  if (document.getElementById('plannerGameScript')) return;\n  const game = document.createElement('script');\n  game.id = 'plannerGameScript';\n  game.src = './game.js?v=14';\n  game.onload = () => {\n    if (document.getElementById('plannerGameFixes')) return;\n    const fixes = document.createElement('script');\n    fixes.id = 'plannerGameFixes';\n    fixes.src = './game-fixes.js?v=15';\n    document.head.appendChild(fixes);\n  };\n  document.head.appendChild(game);\n})();\n`;

  const headers = new Headers(response.headers);
  headers.set('content-type','application/javascript; charset=utf-8');
  headers.delete('content-length');

  return new Response(injected, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  const isMobileScript = url.pathname.endsWith('/mobile.js');

  event.respondWith((async () => {
    try {
      let response = await fetch(event.request);
      if (isMobileScript && response.ok) response = await injectGameLoader(response);

      if (response && response.status === 200) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
      }
      return response;
    } catch {
      let cached = await caches.match(event.request);
      if (cached && isMobileScript) cached = await injectGameLoader(cached);
      if (cached) return cached;
      if (event.request.mode === 'navigate') return caches.match('./index.html');
      throw new Error('offline');
    }
  })());
});
