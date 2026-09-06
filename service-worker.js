const CACHE='scout-hub-v15-14-launch';
const ASSETS=[
  './','./index.html',
  './css/style.css','./css/responsive.css','./css/animations.css',
  './js/supabase-config.js','./js/supabase.js','./js/utils.js','./js/sound.js',
  './js/session.js','./js/notifications.js','./js/realtime.js','./js/music.js',
  './js/storage.js','./js/navigation.js','./js/auth.js','./js/members.js',
  './js/activities.js','./js/games.js','./js/chat.js','./js/media.js',
  './js/voice.js','./js/features.js','./js/settings.js','./js/translations.js',
  './js/app.js','./js/calendar-real.js','./js/learning.js','./js/lessons-ui.js',
  './manifest.json','./icons/icon-192.svg','./icons/icon-512.svg'
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
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then(c => c.put(e.request, copy));
          }
          return response;
        });
      })
    );
  }
});
