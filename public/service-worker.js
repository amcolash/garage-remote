// From https://serviceworke.rs/strategy-cache-and-update_service-worker_doc.html

var CACHE = 'garage-remote-1';

self.addEventListener('install', function (evt) {
  console.log('The service worker is being installed.');

  // Precache and clean up old caches
  evt.waitUntil(precache());
  evt.waitUntil(cleanup());
});

// Cache most parts, but fetch from network if not availible locally
self.addEventListener('fetch', (evt) => {
  let request = evt.request;

  evt.respondWith(
    caches.match(request).then((matching) => {
      // Always try to grab newer versions of cached files, but do not block
      if (matching) {
        fetch(request).then(function (response) {
          if (isCacheable(request)) {
            caches.open(CACHE).then((cache) => {
              cache.put(request, response);
            });
          }
        });
      }

      // Serve the cached match immediately or grab from network
      return matching || fetch(request);
    })
  );
});

// Only cache GET + http/https requests, from: https://github.com/DockYard/ember-service-worker-cache-first/pull/7/files
function isCacheable(request) {
  let httpRegex = /https?/;
  return request.method === 'GET' && httpRegex.test(request.url);
}

function precache() {
  return caches.open(CACHE).then(function (cache) {
    return cache.addAll(['./index.html']);
  });
}

// Wipe no longer useful caches
function cleanup() {
  return caches.keys().then((cacheNames) => {
    return Promise.all(
      cacheNames
        .filter((cacheName) => {
          return cacheName !== CACHE;
        })
        .map((cacheName) => {
          console.log('Deleting old service worker cache', cacheName);
          return caches.delete(cacheName);
        })
    );
  });
}
