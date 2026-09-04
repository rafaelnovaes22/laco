const CACHE_NAME = 'laco-v1';
const FILES = ['/', '/index.html', '/styles.css', '/app.js', '/manifest.webmanifest'];
self.addEventListener('install', (event) => { event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(FILES))); self.skipWaiting(); });
self.addEventListener('activate', (event) => { event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (event) => { if (event.request.method !== 'GET' || event.request.url.includes('/api/')) return; if (event.request.mode === 'navigate') { event.respondWith(fetch(event.request).catch(() => caches.match('/index.html'))); return; } event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request))); });
