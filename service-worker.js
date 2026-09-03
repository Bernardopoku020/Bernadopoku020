const CACHE_NAME = "mister-gentle-v1";
const APP_SHELL = [
    "/",
    "/menu.html",
    "/cart.html",
    "/checkout.html",
    "/order-status.html",
    "/account.html",
    "/css/style.css",
    "/css/ux.css",
    "/css/cart.css",
    "/css/order-status.css",
    "/js/app.js",
    "/js/menu.js",
    "/js/cart.js",
    "/js/checkout.js",
    "/js/order-status.js",
    "/images/app-icon.svg"
];
self.addEventListener("install", event => {
    event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)));
    self.skipWaiting();
});
self.addEventListener("activate", event => {
    event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))));
    self.clients.claim();
});
self.addEventListener("fetch", event => {
    if (new URL(event.request.url).origin !== self.location.origin) return;
    if (new URL(event.request.url).pathname.startsWith("/api/")) return;
    event.respondWith(fetch(event.request).then(response => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        return response;
    }).catch(() => caches.match(event.request)));
});
