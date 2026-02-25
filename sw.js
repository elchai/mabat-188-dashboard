// ═══════════════════════════════════════
// MABAT 188 - Service Worker
// PWA Caching + Push Notifications
// ═══════════════════════════════════════

const CACHE_NAME = 'mabat188-v3';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './logo-188.jpg',
    './manifest.json',
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css',
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js',
    'https://cdn.jsdelivr.net/npm/vis-network@9.1.6/standalone/umd/vis-network.min.js',
    'https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;700;900&family=Orbitron:wght@400;500;700;900&family=Rajdhani:wght@300;400;500;600;700&family=Share+Tech+Mono&display=swap'
];

// ═══════ INSTALL ═══════
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(ASSETS_TO_CACHE))
            .then(() => self.skipWaiting())
    );
});

// ═══════ ACTIVATE ═══════
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        ).then(() => self.clients.claim())
    );
});

// ═══════ FETCH — Network first, fallback to cache ═══════
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    // Skip non-GET and Firebase API calls (always fresh)
    if (event.request.method !== 'GET' || url.hostname.includes('firebasedatabase.app')) {
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then(response => {
                // Cache successful responses
                if (response.ok) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                }
                return response;
            })
            .catch(() => caches.match(event.request))
    );
});

// ═══════ PUSH NOTIFICATIONS ═══════
self.addEventListener('push', event => {
    let data = { title: 'מבט 188', body: 'ידיעה חדשה התקבלה', icon: './logo-188.jpg' };

    if (event.data) {
        try {
            data = { ...data, ...event.data.json() };
        } catch (e) {
            data.body = event.data.text();
        }
    }

    const options = {
        body: data.body,
        icon: data.icon || './logo-188.jpg',
        badge: './logo-188.jpg',
        dir: 'rtl',
        lang: 'he',
        vibrate: [200, 100, 200],
        tag: data.tag || 'mabat188-alert',
        renotify: true,
        data: { url: data.url || './' }
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// ═══════ NOTIFICATION CLICK ═══════
self.addEventListener('notificationclick', event => {
    event.notification.close();

    const targetUrl = event.notification.data?.url || './';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then(clientList => {
                // Focus existing window if open
                for (const client of clientList) {
                    if (client.url.includes('mabat-188') && 'focus' in client) {
                        return client.focus();
                    }
                }
                // Otherwise open new window
                return clients.openWindow(targetUrl);
            })
    );
});
