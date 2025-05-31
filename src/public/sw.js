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

self.addEventListener('fetch', (event) => {
  const request = event.request;

  if (request.method !== 'GET') return;

  const isApiRequest = request.url.includes('dicoding.dev/v1');
  const isExternalRequest = new URL(request.url).origin !== self.location.origin;

  // Caching untuk tile OpenStreetMap
  const isOSMTile = /^https:\/\/[abc]\.tile\.openstreetmap\.org\/.*/.test(request.url);
  if (isOSMTile) {
    event.respondWith(
      caches.open('osm-tile-cache').then((cache) => {
        return cache.match(request).then((cached) => {
          if (cached) return cached;

          return fetch(request).then((response) => {
            if (response && response.status === 200) {
              cache.put(request, response.clone());
            }
            return response;
          }).catch(() => {
            return new Response('', { status: 503, statusText: 'Tile not available offline' });
          });
        });
      })
    );
    return;
  }

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
