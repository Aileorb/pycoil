// Controlla il budget di leggerezza: JS+CSS al primo caricamento ≤ 150 KB gzip,
// e che nessun contenuto didattico finisca nel bundle o nella cache del service worker.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join } from 'node:path';

const DIST = 'dist';
const LIMIT = 150 * 1024;
const assets = readdirSync(join(DIST, 'assets'));
let total = 0;
for (const f of assets) {
  if (!/\.(js|css)$/.test(f) || f.includes('worker')) continue;
  total += gzipSync(readFileSync(join(DIST, 'assets', f))).length;
}
const sw = readFileSync(join(DIST, 'sw.js'), 'utf8');
const leaks = [];
if (/content\//.test(sw)) leaks.push('sw.js precarica file di content/');
for (const f of assets) {
  const s = readFileSync(join(DIST, 'assets', f), 'utf8');
  if (s.includes('"promptHtml"') || s.includes('"solution":')) leaks.push(`${f} contiene contenuti didattici`);
}
const kb = (total / 1024).toFixed(1);
console.log(`Bundle iniziale (gzip): ${kb} KB su 150 KB`);
const contentFiles = (function count(dir) {
  return readdirSync(dir).reduce((n, f) => (statSync(join(dir, f)).isDirectory() ? n + count(join(dir, f)) : n + 1), 0);
})(join(DIST, 'content'));
console.log(`Contenuti pubblicati a parte (non nel bundle né in cache): ${contentFiles} file`);
if (total > LIMIT || leaks.length) {
  console.error('Budget non rispettato:', total > LIMIT ? `${kb} KB` : '', leaks.join('; '));
  process.exit(1);
}
