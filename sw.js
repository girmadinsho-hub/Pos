const CACHE_NAME = 'smartshoppro-v587';
const urlsToCache = [
  './',
  './index.html',
  './staff.html',
  './pos.html',
  './kitchen.html',
  './menu.html',
  './hotel.html',
  './master.html',
  './admin-clean.html',
    './v4-dashboard.js',
  './v4-products.js',
  './v4-sales.js',
  './v4-stock.js',
  './v4-credits.js',
  './v4-losses.js',
  './v4-expenses.js',
  './v4-staff.js',
  './v4-suppliers.js',
  './v4-recipes.js',
  './v4-hotel.js',
  './v4-reports.js',
'./v4-money.js',
'./v4-extras.js',
'./config.js',
  './shared.js',
  './sheet.js',
  './advanced.js',
  './smartcom.js',
  './v4-settings.js',
  './v4-license-guard.js',
  './v4-shops.js',
  './ssauth.js',
  './ssfeatures.js',
  './zoom-fix.js',

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
  'https://cdn.sheetjs.com/xlsx-0.20.0/package/dist/xlsx.full.min.js'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      let ok = 0, fail = [];
      for (const url of urlsToCache) {
        // v577 · { cache: 'reload' } — the pre-cache is filled FRESH from
        // the server, never from the browser's HTTP cache.
        try { await cache.add(new Request(url, { cache: 'reload' })); ok++; }
        catch (e) { fail.push(url); console.warn('Cache missed:', url); }
      }
      console.log('SW install: ' + ok + ' cached, ' + fail.length + ' failed', fail);
    })
  );
});

// ══════════════════════════════════════════════════════════════════
// v577 · NETWORK-FIRST — THE CRITICAL FIX.
// The old strategy was CACHE-FIRST: once a page was in the phone's
// cache it was served from there FOREVER. Fixes uploaded to GitHub
// never reached the phones — which is why a 🔒 in Admin → 📱 Devices
// did nothing on a phone running the old cached POS.
// Now: online → every page load comes from the SERVER (fixes and
// locks arrive on the very next reload); offline → cached copy.
// ══════════════════════════════════════════════════════════════════
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  // Never intercept the database/API traffic.
  if (event.request.url.indexOf('supabase.co') !== -1) return;
  if (event.request.url.indexOf('realtime') !== -1) return;
  event.respondWith(
    fetch(event.request).then(function (response) {
      if (response && response.ok) {
        try {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function (cache) {
            try { cache.put(event.request, clone); } catch (e) {}
          });
        } catch (e) {}
      }
      return response;
    }).catch(function () {
      return caches.match(event.request).then(function (cached) {
        if (cached) return cached;
        if (event.request.mode === 'navigate') return caches.match('./pos.html');
        return new Response('', { status: 504, statusText: 'Offline' });
      });
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    (async function () {
      // v577 · clients.claim() — the new service worker takes control of
      // already-open pages immediately; no "close the app twice" needed.
      try { await self.clients.claim(); } catch (e) {}
      const cacheWhitelist = [CACHE_NAME];
      const names = await caches.keys();
      await Promise.all(
        names.map(function (cacheName) {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })()
  );
});

