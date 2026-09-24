const CACHE = 'planificador-v27';
const INDEX = new URL('./index.html', self.registration.scope).href;
self.addEventListener('install', event => event.waitUntil(
  caches.open(CACHE).then(cache => cache.add(new Request(INDEX, {cache:'reload'}))).then(() => self.skipWaiting())
));
self.addEventListener('activate', event => event.waitUntil(
  caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('planificador-') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim())
));
self.addEventListener('fetch', event => {
  if(event.request.method !== 'GET' || event.request.mode !== 'navigate') return;
  const url = new URL(event.request.url);
  if(url.origin !== self.location.origin || !url.href.startsWith(self.registration.scope)) return;
  event.respondWith(fetch(event.request, {cache:'no-store'}).then(response => {
    if(response.ok){const copy=response.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put(INDEX,copy)))}
    return response;
  }).catch(async()=> (await caches.match(INDEX)) || Response.error()));
});
