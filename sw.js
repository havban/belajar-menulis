// Offline support. Network first so a deployed update is always picked up,
// falling back to the cache when the tablet has no connection - which is the
// normal state of a kid's tablet in the back of a car.
const BUILD = '__BUILD__';
const CACHE = `belajar-menulis-${BUILD}`;
const ASSETS = [
  './', './index.html', './manifest.webmanifest', './icon.svg',
  `./css/style.css?v=${BUILD}`,
  ...['main', 'glyphs', 'lines', 'trace', 'dino', 'mascot', 'audio', 'fx', 'progress', 'analytics', 'awards', 'update', 'words', 'kata', 'tutor', 'game']
    .map((m) => `./js/${m}.js?v=${BUILD}`),
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  // The update check polls version.json with a fresh ?t= every few minutes.
  // Caching those would pile up an entry per poll and serve a stale build
  // number offline, so it is left to the browser entirely.
  if (url.pathname.endsWith('/version.json')) return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request).then((hit) => hit || caches.match('./index.html'))),
  );
});
