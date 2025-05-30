const CACHE_NAME = 'storyapp-v5';

const STATIC_ASSETS = [
  '/StoryApps/', 
  '/StoryApps/index.html',
  '/StoryApps/manifest.json',
  '/StoryApps/app.bundle.js', 
  '/StoryApps/app.css',           
  '/StoryApps/icons/icon-192.png',
  '/StoryApps/icons/icon-512.png',
  '/StoryApps/images/logo.png',
];

// Install: cache semua asset statis
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(STATIC_ASSETS);
      })
      .catch((err) => {
        console.error('[SW] Failed caching:', err);
      })
  );
});

// Activate: hapus cache lama
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

// Fetch: gunakan cache, fallback ke network
self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Lewati non-GET request (misal: POST, PUT)
  if (request.method !== 'GET') return;

  const requestUrl = new URL(request.url);
  const isApiRequest = requestUrl.href.includes('dicoding.dev/v1');
  const isExternalRequest = requestUrl.origin !== self.location.origin;

  // Biarkan API tidak di-cache
  if (isApiRequest) return;

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(request)
        .then((response) => {
          if (!response || response.status !== 200 || response.type === 'opaque') {
            return response;
          }

          // Clone response untuk disimpan ke cache
          const cloned = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            if (!isApiRequest && (request.destination === 'image' || requestUrl.origin === self.location.origin)) {
              cache.put(request, cloned);
            }
          });

          return response;
        })
        .catch(() => {
          // Fallback jika gagal fetch
          if (request.mode === 'navigate') {
            return caches.match('/StoryApps/index.html');
          }

          if (request.destination === 'image') {
            return caches.match(request).then((response) => {
              if (response) return response;
              return caches.match('/StoryApps/images/logo.png')
                .then((fallback) => fallback || caches.match('/StoryApps/icons/icon-192.png'))
                .then((fallback) => fallback || new Response('', { status: 404, statusText: 'Not Found' }));
            });
          }

          return new Response('', { status: 404, statusText: 'Not Found' });
        });
    })
  );
});

// Push Notification
self.addEventListener('push', (event) => {
  console.log('[SW] Push received');
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Notifikasi Baru';
  const options = {
    body: data.body || 'Ada update dari Story App!',
    icon: '/StoryApps/icons/icon-192.png',
    badge: '/StoryApps/icons/icon-192.png',
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});
