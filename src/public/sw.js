const CACHE_NAME = 'storyapp-v5';

// Tambahkan file sesuai hasil build Webpack di folder dist
const STATIC_ASSETS = [
  '/StoryApp/', // penting untuk navigasi
  '/StoryApp/index.html',
  '/StoryApp/manifest.json',
  '/StoryApp/app.bundle.js',     // ganti sesuai nama file hasil Webpack jika berbeda
  '/StoryApp/app.css',           // ganti juga jika menggunakan nama lain
  '/StoryApp/icons/icon-192.png',
  '/StoryApp/icons/icon-512.png',
  '/StoryApp/images/logo.png',
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

  const isApiRequest = request.url.includes('dicoding.dev/v1');
  const isExternalRequest = new URL(request.url).origin !== self.location.origin;

  // Biarkan API dan eksternal (misal: Leaflet CDN) tidak di-cache
  if (isApiRequest || isExternalRequest) return;

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(request)
        .then((response) => {
          if (!response || response.status !== 200 || response.type === 'opaque') {
            return response;
          }

          const cloned = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            if (new URL(request.url).origin === self.location.origin) {
              cache.put(request, cloned);
            }
          });

          return response;
        })
        .catch(() => {
          // Fallback jika gagal fetch
          if (request.mode === 'navigate') {
            return caches.match('/index.html');
          }
          if (request.destination === 'image') {
            return caches.match('/images/favicon.png');
          }
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
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});
