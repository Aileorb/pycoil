// Mette il gestore delle notifiche (public/push-sw.js) in CIMA al service worker generato da Workbox.
// Workbox caricherebbe i suoi importScripts dentro define(), cioè dopo la prima valutazione dello script:
// Safari su iPhone ignora i listener «push» aggiunti così, e le notifiche arrivano ma non si vedono.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const dir = process.argv[2] ?? 'dist';
const file = join(dir, 'sw.js');
const LINE = "importScripts('push-sw.js');\n";
const src = readFileSync(file, 'utf8');
if (src.includes('importScripts("push-sw.js")')) {
  console.error('sw.js carica già push-sw.js dentro define(): togli importScripts dalla configurazione di Workbox');
  process.exit(1);
}
if (!src.startsWith(LINE)) writeFileSync(file, LINE + src);
console.log(`Gestore delle notifiche in cima a ${file}`);
