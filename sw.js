const CACHE_NAME = 'smartshop-v151';
const CDN_CACHE = 'smartshop-cdn-v1';

// ALL app files — nothing missing
const APP_FILES = [
  './', './index.html', './pos.html', './admin.html', './kitchen.html', './master.html', './menu.html',
  './manifest.json', './icon-192.png', './icon-512.png',
  './shared.js', './sheet.js', './advanced.js', './smartcom.js', './rescue.js'
];

// CDN libraries — cached separately (rarely change)
const CDN_URLS = [
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/js-sha256/0.9.0/sha256.min.js',
  'https://cdn.jsdelivr.net/npm/@ericblade/quagga2@1.8.3/dist/quagga.min.js',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js',
  'https://cdn.sheetjs.com/xlsx-020.0.0/dist/xlsx.full.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdn.jsdelivr.net/npm/emailjs-com@3/dist/email.min.js'
];

// INSTALL — cache everything
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME).then(cache => cache.addAll(APP_FILES)),
      caches.open(CDN_CACHE).then(cache => Promise.allSettled(CDN_URLS.map(u => cache.add(u)))
    ])
  );
});

// FETCH — smart dual strategy
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = event.request.url;

  // CDN: cache-first (fast, rarely change)
  if (url.includes('cdn.jsdelivr.net') || url.includes('cdnjs.cloudflare.com') || 
      url.includes('cdn.sheetjs.com') || url.includes('onesignal') ||
      url.includes('fonts.googleapis.com') || url.includes('fonts.gstatic.com')) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CDN_CACHE).then(cache => cache.put(event.request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // App files: serve from cache instantly + update in background
  // = NO MORE VERSION BUMPING! Changes appear on next visit.
  event.respondWith(
    caches.match(event.request).then(cached => {
      fetch(event.request).then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
      }).catch(() => {});
      return cached || fetch(event.request);
    })
  );
});

// ACTIVATE — clean old caches, take control immediately
self.addEventListener('activate', event => {
  const keep = [CACHE_NAME, CDN_CACHE];
  event.waitUntil(
    caches.keys().then(names => {
      return Promise.all(names.filter(n => !keep.includes(n)).map(n => caches.delete(n));
    }).then(() => self.clients.claim())
  );
});
