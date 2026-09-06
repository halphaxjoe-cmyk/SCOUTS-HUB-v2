const CACHE = 'scout-hub-v15-14-launch-v2';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './responsive.css',
  './animations.css',
  './lesson-pagination.css',
  './supabase-config.js',
  './supabase.js',
  './utils.js',
  './sound.js',
  './session.js',
  './notifications.js',
  './realtime.js',
  './music.js',
  './storage.js',
  './navigation.js',
  './auth.js',
  './members.js',
  './activities.js',
  './games.js',
  './chat.js',
  './media.js',
  './voice.js',
  './features.js',
  './settings.js',
  './translations.js',
  './app.js',
  './calendar-real.js',
  './learning.js',
  './lessons-ui.js',
  './lesson-pagination.js',
  './manifest.json'
];

self.addEventListener('install', e => {
  e.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      // Try to fetch and add each asset individually so a missing file won't fail the whole install
      await Promise.all(ASSETS.map(async (asset) => {
        try {
          const resp = await fetch(asset, {cache: 'no-store'});
          if (resp && resp.ok) {
            await cache.put(asset, resp.clone());
          } else {
            // skip assets that aren't available
            console.warn('[SW] Asset not cached (not ok):', asset);
          }
        } catch (err) {
          // network error or 404, skip this asset
          console.warn('[SW] Asset fetch failed, skipping:', asset, err && err.message);
        }
      }));
      await self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({type:'window', includeUncontrolled:true}).then(cs => {
      for (const c of cs) {
        if ('focus' in c) return c.focus();
      }
      return clients.openWindow('./');
    })
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  const requestUrl = new URL(e.request.url);
  const sameOrigin = requestUrl.origin === self.location.origin;

  // Network-first for navigations, with an offline app-shell fallback.
  if (e.request.mode === 'navigate') {
    e.respondWith(
      (async () => {
        try {
          const response = await fetch(e.request);
          try {
            const copy = response.clone();
            const c = await caches.open(CACHE);
            await c.put('./index.html', copy);
          } catch (err) { /* ignore cache put errors */ }
          return response;
        } catch (err) {
          const cached = await caches.match('./index.html');
          return cached || new Response('Offline', {status:503, statusText:'Offline'});
        }
      })()
    );
    return;
  }

  // Cache-first for local static assets only.
  if (sameOrigin) {
    e.respondWith(
      (async () => {
        const cached = await caches.match(e.request);
        if (cached) return cached;
        try {
          const response = await fetch(e.request);
          if (response && response.ok) {
            try { const c = await caches.open(CACHE); await c.put(e.request, response.clone()); } catch (err) { /* ignore */ }
          }
          return response;
        } catch (err) {
          // fallback to cache match for the request
          return await caches.match(e.request) || new Response('Offline', {status:503, statusText:'Offline'});
        }
      })()
    );
  }
});
