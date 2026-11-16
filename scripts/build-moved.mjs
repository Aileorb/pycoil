// Pagina di trasloco per il vecchio indirizzo GitHub Pages (https://aileorb.github.io/pycoil/).
// Legge i progressi salvati lì (stessa origine, IndexedDB di idb-keyval), li trasforma in un link/codice
// per il nuovo indirizzo su Cloudflare e sostituisce il vecchio service worker con uno che si autodistrugge.
//
// Uso:  PYCOIL_URL=https://pycoil.<account>.workers.dev/ node scripts/build-moved.mjs <cartella>
import { mkdirSync, writeFileSync, copyFileSync } from 'node:fs';
import { join } from 'node:path';

const out = process.argv[2] ?? 'moved';
const target = process.env.PYCOIL_URL;
if (!target || !/^https:\/\/[^/]+\/$/.test(target)) {
  console.error('Serve PYCOIL_URL, per esempio https://pycoil.nome.workers.dev/ (con la barra finale)');
  process.exit(1);
}
mkdirSync(join(out, 'icons'), { recursive: true });
for (const f of ['pycoil-v2-180.png', 'pycoil-v2-192.png']) copyFileSync(join('public/icons', f), join(out, 'icons', f));

const html = `<!doctype html>
<html lang="it">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>PyCoil si è spostata</title>
<link rel="apple-touch-icon" href="icons/pycoil-v2-180.png">
<link rel="icon" href="icons/pycoil-v2-192.png">
<style>
  :root { --bg: #F2F2F7; --card: #fff; --text: #000; --text2: rgba(60,60,67,.6); --blue: #007AFF; color-scheme: light; }
  @media (prefers-color-scheme: dark) { :root { --bg: #000; --card: #1c1c1e; --text: #fff; --text2: rgba(235,235,245,.6); --blue: #0A84FF; color-scheme: dark; } }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--bg); color: var(--text); font: 17px/1.45 -apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif; }
  main { max-width: 560px; margin: 0 auto; padding: max(40px, env(safe-area-inset-top)) max(16px, env(safe-area-inset-right)) 40px max(16px, env(safe-area-inset-left)); display: flex; flex-direction: column; gap: 16px; }
  h1 { font-size: 30px; line-height: 1.15; margin: 0; }
  p { margin: 0; color: var(--text2); }
  .card { background: var(--card); border-radius: 14px; padding: 14px 16px; }
  .btn { display: flex; align-items: center; justify-content: center; height: 50px; border-radius: 14px; background: var(--blue); color: #fff; font-weight: 600; text-decoration: none; border: 0; font-size: 17px; width: 100%; }
  .ghost { background: none; color: var(--blue); height: 44px; }
  ol { margin: 0; padding-left: 20px; } li { margin: 4px 0; }
  img { width: 64px; height: 64px; border-radius: 14px; }
</style>
</head>
<body>
<main>
  <img src="icons/pycoil-v2-192.png" alt="">
  <h1>PyCoil si è spostata</h1>
  <p>Il nuovo indirizzo è <b id="addr"></b>. Lì ci sono anche i promemoria giornalieri.</p>
  <div class="card" id="stato">Cerco i tuoi progressi…</div>
  <a class="btn" id="go" href="#">Apri la nuova PyCoil con i tuoi progressi</a>
  <button class="btn ghost" id="copy" hidden>Copia il codice dei progressi</button>
  <div class="card">
    <b>Su iPhone</b>
    <ol>
      <li>Tocca «Copia il codice dei progressi».</li>
      <li>Apri il nuovo indirizzo in Safari e aggiungilo alla schermata Home (Condividi → Aggiungi alla schermata Home).</li>
      <li>Apri la nuova icona, scegli «Hai già usato PyCoil? Importa i progressi» e incolla il codice.</li>
      <li>Poi puoi eliminare la vecchia icona.</li>
    </ol>
  </div>
</main>
<script>
const TARGET = ${JSON.stringify(target)};
document.getElementById('addr').textContent = TARGET.replace(/^https:\\/\\//, '').replace(/\\/$/, '');
const go = document.getElementById('go'), copy = document.getElementById('copy'), stato = document.getElementById('stato');
go.href = TARGET;
const b64u = (bytes) => { let s = ''; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000)); return btoa(s).replace(/\\+/g, '-').replace(/\\//g, '_').replace(/=+$/, ''); };
async function encode(obj) {
  const raw = new TextEncoder().encode(JSON.stringify(obj));
  if (typeof CompressionStream === 'undefined') return 'j' + b64u(raw);
  const out = new Response(new Blob([raw]).stream().pipeThrough(new CompressionStream('deflate-raw')));
  return 'z' + b64u(new Uint8Array(await out.arrayBuffer()));
}
function readState() {
  return new Promise((resolve) => {
    let req;
    try { req = indexedDB.open('keyval-store'); } catch (e) { return resolve(null); }
    req.onerror = () => resolve(null);
    req.onupgradeneeded = () => { req.transaction.abort(); resolve(null); };
    req.onsuccess = () => {
      try {
        const g = req.result.transaction('keyval').objectStore('keyval').get('pycoil:state');
        g.onsuccess = () => resolve(g.result || null);
        g.onerror = () => resolve(null);
      } catch (e) { resolve(null); }
    };
  });
}
(async () => {
  const s = await readState();
  if (!s || !s.level) { stato.textContent = 'Su questo dispositivo non ci sono progressi da portare: apri direttamente il nuovo indirizzo.'; go.textContent = 'Apri la nuova PyCoil'; return; }
  const code = await encode(s);
  const link = TARGET + '#importa=' + code;
  go.href = link;
  stato.innerHTML = 'Trovati: <b>' + (s.xp || 0) + ' XP</b>, streak di <b>' + ((s.streak && s.streak.current) || 0) + '</b> giorni, <b>' + ((s.sections || []).length) + '</b> sezioni lette.';
  copy.hidden = false;
  copy.onclick = async () => {
    try { await navigator.clipboard.writeText(link); copy.textContent = 'Codice copiato'; }
    catch (e) { window.prompt('Copia questo codice', link); }
  };
})();
</script>
</body>
</html>
`;
writeFileSync(join(out, 'index.html'), html);

// Il vecchio service worker di Workbox controlla /pycoil/: questo lo sostituisce, svuota le cache e si toglie di mezzo.
writeFileSync(join(out, 'sw.js'), `self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) await caches.delete(k);
    await self.registration.unregister();
    for (const c of await self.clients.matchAll({ type: 'window' })) c.navigate(c.url);
  })());
});
`);
writeFileSync(join(out, '.nojekyll'), '');
console.log(`Pagina di trasloco verso ${target} in ${out}/`);
