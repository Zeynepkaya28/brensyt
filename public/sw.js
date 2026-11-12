// Servis çalışanı: uygulama dosyalarını saklar, böylece internet yokken de kartlar, tekrar ve sınav açılır.
// Önce ağdan dener (güncel sürüm), ağ yoksa saklanan kopyayı verir. /api istekleri hiç saklanmaz.
const CACHE = "brensyt-v1";

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== location.origin || url.pathname.startsWith("/api/")) return;
  event.respondWith(
    fetch(event.request).then((res) => {
      if (res.ok) {
        const copy = res.clone();
        caches.open(CACHE).then((cache) => cache.put(event.request, copy));
      }
      return res;
    }).catch(() => caches.match(event.request, { ignoreSearch: true }).then((hit) => hit || caches.match("/")))
  );
});
