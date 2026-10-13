/* Offline cache for the app shell. Bump CACHE when files change. */
const CACHE = "medassist-v5";
const FILES = ["./", "index.html", "css/styles.css", "js/core.js", "js/parser.js", "js/i18n.js", "js/speech.js", "js/app.js", "manifest.json", "icon-192.png", "icon-512.png"];
self.addEventListener("install", e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES))));
self.addEventListener("activate", e => e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== CACHE).map(x => caches.delete(x))))));
self.addEventListener("fetch", e => { if (e.request.method === "GET") e.respondWith(caches.match(e.request).then(r => r || fetch(e.request))); });
