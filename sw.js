const CACHE = 'bear-travel-planner-1-0';
const ASSETS = ['./','./index.html','./style.css?v=1.0','./app.js?v=1.0','./manifest.webmanifest','./icon-192.png','./icon-512.png'];
self.addEventListener('install', event => { event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(()=>self.skipWaiting())); });
self.addEventListener('activate', event => { event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(()=>self.clients.claim())); });
self.addEventListener('fetch', event => { if(event.request.method !== 'GET') return; event.respondWith(caches.match(event.request).then(res => res || fetch(event.request).then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put(event.request, copy)); return r; }).catch(()=>caches.match('./index.html')))); });
