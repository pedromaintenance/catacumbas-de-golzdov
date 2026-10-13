/* Catacumbas de Golzdov — PWA 1.0.0 */
const CACHE = 'golzdov-offline-v2';
const PRECACHE = [
  './', './index.html', './manifest.webmanifest',
  './icons/icon-192.png', './icons/icon-512.png'
];

// A instalação só termina depois que TODOS os arquivos necessários estão guardados.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names
      .filter(name => name.startsWith('golzdov-offline-') && name !== CACHE)
      .map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  const root = new URL(self.registration.scope);
  if (!url.pathname.startsWith(root.pathname)) return;

  if (event.request.mode === 'navigate') {
    // O HTML completo do jogo é servido diretamente do cache, mesmo sem rede.
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      const saved = await cache.match(new URL('./index.html', root));
      if (saved) return saved;
      try { return await fetch(event.request); }
      catch (error) { return new Response('O jogo ainda precisa ser instalado online.', {status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}}); }
    })());
    return;
  }
  // Ícones e manifesto também ficam offline.
  event.respondWith((async () => {
    const saved = await caches.match(event.request);
    if (saved) return saved;
    return fetch(event.request);
  })());
});
