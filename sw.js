// CBSE 12 Board Prep — Service Worker v2.2
// HTML is NEVER cached — always fetched fresh from network.
// Only fonts and static assets are cached for offline fallback.

const CACHE_NAME = 'cbse12-v2.2';

// ── INSTALL ──────────────────────────────────
self.addEventListener('install', (event) => {
  // Don't pre-cache index.html — always want fresh HTML
  self.skipWaiting();
});

// ── ACTIVATE ─────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(cacheNames.map(name => caches.delete(name)))
    )
  );
  self.clients.claim();
});

// ── FETCH ────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET
  if (request.method !== 'GET') return;

  // Skip Anthropic API — never intercept
  if (url.hostname.includes('anthropic.com') || url.hostname.includes('railway.app')) return;

  // HTML files — ALWAYS network only, no caching
  if (request.headers.get('accept')?.includes('text/html') ||
      url.pathname.endsWith('.html') || url.pathname === '/' ||
      url.pathname.endsWith('/cbse12-prep') || url.pathname.endsWith('/cbse12-prep/')) {
    event.respondWith(fetch(request));
    return;
  }

  // Google Fonts — cache first (they never change)
  if (url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')) {
    event.respondWith(
      caches.open(CACHE_NAME).then(cache =>
        cache.match(request).then(cached => {
          if (cached) return cached;
          return fetch(request).then(response => {
            cache.put(request, response.clone());
            return response;
          });
        })
      )
    );
    return;
  }

  // Everything else — network first, cache as fallback
  event.respondWith(
    fetch(request)
      .then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
