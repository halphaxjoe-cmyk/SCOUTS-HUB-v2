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
    caches.open(CACHE)
      .then(c => c.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
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
      fetch(e.request)
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE).then(c => c.put('./index.html', copy));
          return response;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Cache-first for local static assets only.
  if (sameOrigin) {
    e.respondWith(
      caches.match(e.request).then(cached => {
        if (cached) return cached;
        return fetch(e.request).then(response => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then(c => c.put(e.request, copy));
          }
          return response;
        }).catch(() => caches.match(e.request));
      })
    );
  }
});
