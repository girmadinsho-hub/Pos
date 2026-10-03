const CACHE_NAME = 'smartshoppro-v414';
const urlsToCache = [
  './',
  './index.html',
  './admin.html',
  './pos.html',
  './kitchen.html',
  './menu.html',
  './hotel.html',
  './master.html',
  './config.js',
  './shared.js',
  './sheet.js',
  './advanced.js',
  './smartcom.js',
  './ssauth.js',
  './ssfeatures.js',
  './ssfiscal.js',
  './ssperf.js',
  './ssprint.js',
  './ssupload.js',
  './hotel.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/js-sha256/0.9.0/sha256.min.js',
  'https://cdn.sheetjs.com/xlsx-0.20.0/package/dist/xlsx.full.min.js',
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      let ok = 0, fail = [];
      for (const url of urlsToCache) {
        try { await cache.add(url); ok++; }
        catch (e) { fail.push(url); console.warn('Cache missed:', url); }
      }
      console.log('SW install: ' + ok + ' cached, ' + fail.length + ' failed', fail);
    })
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then(response => {
      if (response) return response;
      return fetch(event.request).catch(() => {
        if (event.request.mode === 'navigate') return caches.match('./pos.html');
        return new Response('', { status: 504, statusText: 'Offline' });
      });
    })
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
