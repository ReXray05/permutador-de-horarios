const CACHE_NAME = 'planificador-semanal-v19';
const APP_SHELL = [
  './',
  './index.html',
  './styles.css?v=13',
  './app.js?v=13',
  './month.js?v=13',
  './mobile.js?v=13',
  './game.js?v=19',
  './game-fixes.js?v=19',
  './game-extra2.js?v=19',
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

self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

async function injectGameScripts(response) {
  if (!response) return response;
  const type = response.headers.get('content-type') || '';
  if (!type.includes('text/html')) return response;

  let html = await response.text();
  const marker = 'planner-game-direct-v19';
  if (!html.includes(marker)) {
    const scripts = `\n  <!-- ${marker} -->\n  <script defer src="./game.js?v=19"></script>\n  <script defer src="./game-fixes.js?v=19"></script>\n  <script defer src="./game-extra2.js?v=19"></script>\n`;
    html = html.includes('</head>') ? html.replace('</head>', scripts + '</head>') : html + scripts;
  }

  const headers = new Headers(response.headers);
  headers.set('content-type','text/html; charset=utf-8');
  headers.delete('content-length');
  return new Response(html, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  const isNavigation = event.request.mode === 'navigate';

  event.respondWith((async () => {
    try {
      let response = await fetch(event.request, {cache:'no-store'});
      if (isNavigation && response.ok) response = await injectGameScripts(response);

      if (response && response.status === 200) {
        caches.open(CACHE_NAME).then(cache => cache.put(event.request,response.clone()));
      }
      return response;
    } catch {
      let cached = await caches.match(event.request);
      if (!cached && isNavigation) cached = await caches.match('./index.html');
      if (cached && isNavigation) cached = await injectGameScripts(cached);
      if (cached) return cached;
      throw new Error('offline');
    }
  })());
});
