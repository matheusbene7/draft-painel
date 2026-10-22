// Guarda o painel no aparelho para abrir sem internet.
// Ao publicar uma versão nova, troque o número abaixo (draft-v2, draft-v3...).
const CACHE = 'draft-v1';
const BASE = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];
const HOSTS = ['www.gstatic.com', 'fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(BASE)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const u = new URL(e.request.url);
  if (u.origin !== location.origin && !HOSTS.includes(u.hostname)) return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: u.origin === location.origin }).then(hit => {
      const net = fetch(e.request).then(res => {
        if (res.ok || res.type === 'opaque') {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
        }
        return res;
      }).catch(() => hit || (e.request.mode === 'navigate' ? caches.match('./index.html') : undefined));
      return hit || net;
    })
  );
});
