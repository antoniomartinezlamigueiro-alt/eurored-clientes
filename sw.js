// App de Chesky: funciona sin conexión con los últimos datos descargados.
const CACHE = "eurored-v3";
const SHELL = ["./", "index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png", "icon-180.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return;
  // datos y página: primero la red (para tener lo último); si no hay conexión, lo guardado
  const clave = url.pathname.endsWith("data.enc") ? "data.enc" : null;
  if (clave || e.request.mode === "navigate" || url.pathname.endsWith("index.html")) {
    e.respondWith(fetch(e.request).then(r => {
      if (r.ok) { const cp = r.clone(); caches.open(CACHE).then(c => c.put(clave || e.request, cp)); }
      return r;
    }).catch(() => caches.match(clave || e.request).then(r => r || caches.match("index.html"))));
    return;
  }
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
