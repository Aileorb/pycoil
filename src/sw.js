// Service worker di PyCoil, scritto a mano come quello di Di&T (niente Workbox a runtime).
// Le notifiche del promemoria sono gestite qui, nel file stesso: Safari su iPhone accetta i listener
// «push» solo se sono registrati durante la prima esecuzione dello script.

// ------------------------------------------------------------------ notifiche (come Di&T)
self.addEventListener('push', (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (err) { d = { body: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(d.title || 'PyCoil', {
    body: d.body || '', tag: d.tag || 'pycoil-promemoria', renotify: true,
    icon: 'icons/pycoil-v2-192.png', badge: 'icons/pycoil-v2-192.png', data: { url: d.url || './' }
  }));
});
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
    const c = list.find((x) => 'focus' in x);
    if (c) { c.postMessage({ t: 'push-open' }); return c.focus(); }
    return self.clients.openWindow('./#/oggi');
  }));
});

// ------------------------------------------------------------------ cache
// Solo la shell dell'app (elenco iniettato in build); i contenuti didattici si leggono dalla rete.
const MANIFEST = self.__WB_MANIFEST;
const FILES = [...new Set(MANIFEST.map((f) => f.url))]; // cache.addAll rifiuta i doppioni
const VERSION = MANIFEST.map((f) => f.revision || f.url).join('|');
let h = 0;
for (let i = 0; i < VERSION.length; i++) h = (h * 31 + VERSION.charCodeAt(i)) | 0;
const SHELL = `pycoil-shell-${(h >>> 0).toString(36)}`;
const PY = 'pycoil-python'; // motore Python e librerie: misurata e svuotabile da Impostazioni › Spazio usato
const PY_HOSTS = /^https:\/\/(cdn\.jsdelivr\.net\/pyodide\/|files\.pythonhosted\.org\/|pypi\.org\/(simple|pypi)\/)/;

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(SHELL).then((c) => c.addAll(FILES.map((f) => new Request(f, { cache: 'reload' })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((ks) => Promise.all(ks.filter((k) => (k.startsWith('pycoil-shell-') && k !== SHELL) || k.startsWith('workbox-')).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('message', (e) => { if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting(); });

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Python: prima la cache (i file sono immutabili per versione)
  if (PY_HOSTS.test(req.url)) {
    e.respondWith(caches.open(PY).then(async (c) => {
      const hit = await c.match(req);
      if (hit && !url.hostname.startsWith('pypi.org')) return hit;
      try {
        const r = await fetch(req);
        if (r && r.status === 200) c.put(req, r.clone());
        return r;
      } catch (err) {
        return hit || Response.error();
      }
    }));
    return;
  }

  if (url.origin !== location.origin || url.pathname.startsWith('/api/') || url.pathname.includes('/content/')) return;

  // pagina: prima la rete, così gli aggiornamenti arrivano subito; offline la copia in cache
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).catch(async () => (await caches.match('index.html', { ignoreSearch: true, ignoreVary: true })) || Response.error()));
    return;
  }

  // file della shell: dalla cache, altrimenti dalla rete
  e.respondWith(caches.match(req, { ignoreSearch: true, ignoreVary: true }).then((hit) => hit || fetch(req)));
});
