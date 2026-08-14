const CACHE_NAME = 'admin-sh-cache-v9';

self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  // Solo interceptar peticiones GET
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // EXTREMADAMENTE IMPORTANTE: Solo interceptar y cachear peticiones de nuestro propio origen.
  // Esto evita interferir con llamadas a la API de Supabase, geolocalización o EmailJS,
  // previniendo errores de red, expiraciones de sesión y caché de datos dinámicos.
  if (url.origin !== self.location.origin) return;

  // No interceptar llamadas locales que no sean de HTTP/HTTPS (por ejemplo, extensiones)
  if (!url.protocol.startsWith('http')) return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Solo guardar en caché respuestas exitosas de nuestro propio origen (evitando opacas/CORS)
        if (response && response.status === 200 && response.type === 'basic') {
          const resClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, resClone).catch(err => {
              console.warn('SW: Error al guardar en caché:', err);
            });
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});
