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

// Deteksi tile OpenStreetMap
function isOSMTile(url) {
  return /^https:\/\/[abc]\.tile\.openstreetmap\.org/.test(url);
}

// Install: cache asset statis (toleran error)
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.all(
        STATIC_ASSETS.map((url) =>
          fetch(url)
            .then((response) => {
              if (!response.ok) throw new Error(`${url} not found`);
              return cache.put(url, response);
            })
            .catch((err) => {
              console.warn(`[SW] Failed to cache ${url}:`, err.message);
            })
        )
      );
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

// Fetch: strategi caching
self.addEventListener('fetch', (event) => {
  const request = event.request;

  if (request.method !== 'GET') return;

  const requestUrl = request.url;
  const isApiRequest = requestUrl.includes('dicoding.dev/v1');
  const isExternalRequest = new URL(requestUrl).origin !== self.location.origin;

  // Caching untuk tile OpenStreetMap
  if (isOSMTile(requestUrl)) {
    event.respondWith(
      caches.open('osm-tile-cache').then((cache) => {
        return cache.match(request).then((cached) => {
          const fetchPromise = fetch(request)
            .then((networkResponse) => {
              if (networkResponse.status === 200) {
                cache.put(request, networkResponse.clone());
              }
              return networkResponse;
            })
            .catch(() => {
              return cached || new Response('', { status: 503 });
            });

          return cached || fetchPromise;
        });
      })
    );
    return;
  }

  // Cache gambar cerita dari API agar bisa tampil offline
  if (request.destination === 'image' && isApiRequest) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;

        return fetch(request)
          .then((response) => {
            if (response.status === 200) {
              return caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, response.clone());
                return response;
              });
            }
            return response;
          })
          .catch(() => {
            return caches.match('/StoryApps/images/logo.png')
              .then((fallback) => fallback || new Response('', { status: 503 }));
          });
      })
    );
    return;
  }

  // Abaikan request API & eksternal lainnya
  if (isApiRequest || isExternalRequest) return;

  // Caching untuk request lokal
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
          if (request.mode === 'navigate') {
            return caches.match('/StoryApps/index.html');
          }
          if (request.destination === 'image') {
            return caches.match('/StoryApps/images/logo.png')
              .then((response) => {
                if (response) return response;
                return caches.match('/StoryApps/icons/icon-192.png');
              })
              .then((response) => {
                if (response) return response;
                return new Response('', { status: 404, statusText: 'Not Found' });
              });
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
    icon: '/StoryApps/icons/icon-192.png',
    badge: '/StoryApps/icons/icon-192.png',
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});
