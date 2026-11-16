// Caricato dal service worker di Workbox (importScripts): mostra il promemoria mandato dal Worker Cloudflare
// e, quando lo tocchi, apre PyCoil su Oggi.
self.addEventListener('push', (e) => {
  let d = {};
  try {
    d = e.data ? e.data.json() : {};
  } catch {
    d = { body: e.data ? e.data.text() : '' };
  }
  e.waitUntil(
    self.registration.showNotification(d.title || 'PyCoil', {
      body: d.body || '',
      tag: d.tag || 'pycoil-promemoria',
      renotify: true,
      icon: 'icons/pycoil-v2-192.png',
      badge: 'icons/pycoil-v2-192.png',
      data: { url: d.url || './' }
    })
  );
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const target = new URL((e.notification.data && e.notification.data.url) || './', self.registration.scope).href;
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      const c = list.find((x) => 'focus' in x);
      if (c) {
        if ('navigate' in c) c.navigate(target + '#/oggi').catch(() => undefined);
        return c.focus();
      }
      return self.clients.openWindow(target + '#/oggi');
    })
  );
});
