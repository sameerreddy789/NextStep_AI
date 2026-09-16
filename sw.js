const CACHE_NAME = 'nextstep-v1.1.0';

// Core assets to pre-cache
const PRECACHE_ASSETS = [
    '/',
    '/index.html',
    '/favicon.svg',
    '/css/styles.css',
    '/css/clay-morphism.css',
    '/css/glass-fx.css',
    '/js/app-state.js',
    '/js/services/storage.js',
    '/js/services/workflow.js',
    '/js/ui-utils.js'
];

// Install - pre-cache critical assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(PRECACHE_ASSETS);
        })
    );
    self.skipWaiting();
});

// Activate - clean old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
            );
        })
    );
    self.clients.claim();
});

// Fetch Strategy
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Skip non-GET requests
    if (event.request.method !== 'GET') return;

    // External assets (Google Fonts, Firebase SDKs) - Stale-While-Revalidate
    if (url.origin !== location.origin) {
        event.respondWith(staleWhileRevalidate(event.request));
        return;
    }

    // Static Assets (CSS, JS, Images) - Cache First, then Network
    if (url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|webp|woff2)$/)) {
        event.respondWith(cacheFirst(event.request));
        return;
    }

    // HTML & Data - Network First
    event.respondWith(networkFirst(event.request));
});

/**
 * Cache First Strategy
 */
async function cacheFirst(request) {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);
    if (cached) return cached;

    try {
        const response = await fetch(request);
        if (response.ok) cache.put(request, response.clone());
        return response;
    } catch (error) {
        return caches.match(request);
    }
}

/**
 * Stale-While-Revalidate Strategy
 */
async function staleWhileRevalidate(request) {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);
    
    const networkFetch = fetch(request).then((response) => {
        if (response.ok) cache.put(request, response.clone());
        return response;
    });

    return cached || networkFetch;
}

/**
 * Network First Strategy
 */
async function networkFirst(request) {
    const cache = await caches.open(CACHE_NAME);
    try {
        const response = await fetch(request);
        if (response.ok) cache.put(request, response.clone());
        return response;
    } catch (error) {
        return cache.match(request);
    }
}
