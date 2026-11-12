// Genera le icone dell'app (uroboro PyCoil) partendo da un unico disegno SVG.
// Richiede `rsvg-convert` (librsvg). Le PNG generate sono versionate nel repository,
// quindi la CI non ha bisogno di questo script.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const body = readFileSync('assets/icon-body.svg.part', 'utf8');
const out = 'public/icons';
mkdirSync(out, { recursive: true });

const svg = (inner, { rounded = true, scale = 1 } = {}) => {
  const bg = rounded
    ? '<rect width="512" height="512" rx="114" fill="#FCF0CF"/>'
    : '<rect width="512" height="512" fill="#FCF0CF"/>';
  const t = scale === 1 ? '' : ` transform="translate(${256 * (1 - scale)} ${256 * (1 - scale)}) scale(${scale})"`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">${bg}<g${t}>${inner}</g></svg>`;
};

writeFileSync(`${out}/icon.svg`, svg(body));
writeFileSync('assets/icon-full.svg', svg(body, { rounded: false }));
writeFileSync('assets/icon-maskable.svg', svg(body, { rounded: false, scale: 0.78 }));

const png = (src, size, dest) =>
  execFileSync('rsvg-convert', ['-w', String(size), '-h', String(size), '-o', dest, src]);

// Icone per la schermata Home: quadrate e piene (niente trasparenza), perché iOS e Android
// applicano da soli la loro maschera e riempiono di nero gli angoli trasparenti.
// I nomi includono la versione: cambiandoli, i telefoni non riusano icone vecchie in cache.
png('assets/icon-full.svg', 180, `${out}/pycoil-v2-180.png`);
png('assets/icon-full.svg', 192, `${out}/pycoil-v2-192.png`);
png('assets/icon-full.svg', 512, `${out}/pycoil-v2-512.png`);
png('assets/icon-full.svg', 1024, `${out}/pycoil-v2-1024.png`);
png('assets/icon-maskable.svg', 512, `${out}/pycoil-v2-maskable-512.png`);
png('assets/icon-full.svg', 1024, 'assets/icon-1024.png');
console.log('Icone generate in', out);
