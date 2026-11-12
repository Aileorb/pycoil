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

png(`${out}/icon.svg`, 192, `${out}/icon-192.png`);
png(`${out}/icon.svg`, 512, `${out}/icon-512.png`);
png('assets/icon-full.svg', 180, `${out}/apple-touch-icon.png`);
png('assets/icon-maskable.svg', 512, `${out}/icon-maskable-512.png`);
png('assets/icon-full.svg', 1024, 'assets/icon-1024.png');
console.log('Icone generate in', out);
