// Spazio occupato sul dispositivo e pulizia delle librerie Python non più necessarie.
// La parte pura (quali librerie servono, quali pacchetti tenere) è testata in tests/space.test.ts;
// la parte che tocca il browser usa la Cache Storage dove il service worker salva Pyodide.
import type { AppState, ContentIndex } from './types';
import { activeProject, pathSections, partOrder } from './scheduler';

export const PY_CACHE = 'pycoil-python';

/** Nome mostrato all'utente per ogni libreria (chiave = nome di import). */
export const LIB_LABEL: Record<string, string> = {
  numpy: 'NumPy',
  matplotlib: 'Matplotlib',
  scipy: 'SciPy',
  pandas: 'pandas',
  sympy: 'SymPy',
  uncertainties: 'uncertainties',
  CoolProp: 'CoolProp',
  sklearn: 'scikit-learn',
  pint: 'pint',
  openpyxl: 'openpyxl',
  skfem: 'scikit-fem',
  pytest: 'pytest'
};

/** Librerie che non sono in Pyodide e arrivano da PyPI: pacchetti PyPI e dipendenze già in Pyodide. */
export const FROM_PYPI: Record<string, { pypi: string[]; pyodide: string[] }> = {
  pint: { pypi: ['pint', 'flexcache', 'flexparser'], pyodide: ['platformdirs', 'typing-extensions'] },
  openpyxl: { pypi: ['openpyxl', 'et-xmlfile'], pyodide: [] },
  skfem: { pypi: ['scikit-fem'], pyodide: ['numpy', 'scipy'] }
};

export interface LockPackage {
  name: string;
  file_name: string;
  depends: string[];
  imports: string[];
}
export interface Lock {
  packages: Record<string, LockPackage>;
}

/** La Parte in cui lo studente è arrivato: quella della prima sezione non letta del suo percorso. */
export function currentPart(index: ContentIndex, state: AppState): string | null {
  const path = pathSections(index, state.level);
  const next = path.find((s) => !state.sections.includes(s)) ?? path[path.length - 1];
  return index.parts.find((p) => p.chapters.some((c) => c.sections.some((s) => s.id === next)))?.id ?? null;
}

/**
 * Librerie che servono ancora: quelle della Parte attuale e delle successive, dei ripassi in calendario,
 * delle task di oggi e del progetto in corso. pytest resta sempre (serve a verificare le avanzate).
 */
export function neededLibs(index: ContentIndex, state: AppState, todayIds: string[] = []): Set<string> {
  const need = new Set<string>(['pytest']);
  const add = (libs?: string[]) => libs?.forEach((l) => need.add(l));
  const order = partOrder(index);
  const from = currentPart(index, state);
  const start = from ? order.indexOf(from) : 0;
  for (const p of index.parts) {
    if (order.indexOf(p.id) < start) continue;
    for (const c of p.chapters) for (const s of c.sections) add(s.libs);
  }
  const all = [...index.tasks, ...index.katas];
  const byId = new Map(all.map((t) => [t.id, t]));
  for (const id of [...Object.keys(state.review), ...todayIds]) add(byId.get(id)?.libs);
  const proj = activeProject(index, state);
  if (proj) {
    const done = new Set(state.projects[proj.id] ?? []);
    for (const s of proj.steps) if (!done.has(s.id)) add(s.libs);
  }
  for (const id of todayIds) {
    const p = index.projects.find((x) => id.startsWith(`${x.id}-`));
    add(p?.steps.find((s) => `${p.id}-${s.id}` === id)?.libs);
  }
  return need;
}

/** Pacchetti Pyodide (nomi del lock) necessari per un insieme di nomi di import, dipendenze comprese. */
export function packagesFor(lock: Lock, imports: Iterable<string>): Set<string> {
  const byImport = new Map<string, string>();
  for (const p of Object.values(lock.packages)) for (const i of p.imports ?? []) byImport.set(i, p.name);
  const out = new Set<string>();
  const visit = (name: string) => {
    const key = Object.keys(lock.packages).find((k) => k === name || lock.packages[k].name === name);
    if (!key || out.has(key)) return;
    out.add(key);
    lock.packages[key].depends.forEach(visit);
  };
  for (const imp of imports) {
    const pypi = FROM_PYPI[imp];
    if (pypi) pypi.pyodide.forEach(visit);
    const pkg = byImport.get(imp);
    if (pkg) visit(pkg);
  }
  return out;
}

const normalize = (n: string) => n.toLowerCase().replace(/[-_.]+/g, '-');

/** A quale pacchetto appartiene un file in cache: 'core' per il motore, nome del lock, oppure 'pypi:<nome>'. */
export function packageOfUrl(url: string, lock: Lock | null): string {
  const u = new URL(url);
  const file = decodeURIComponent(u.pathname.split('/').pop() ?? '');
  if (u.hostname === 'files.pythonhosted.org') return `pypi:${normalize(file.split('-')[0])}`;
  if (u.hostname === 'pypi.org') return `pypi:${normalize(u.pathname.split('/').filter(Boolean)[1] ?? '')}`;
  if (lock) for (const [key, p] of Object.entries(lock.packages)) if (p.file_name === file) return key;
  return 'core';
}

export interface CachedFile {
  url: string;
  size: number;
}

export interface LibRow {
  lib: string; // nome di import, oppure 'shared' per le librerie di supporto
  label: string;
  size: number;
  needed: boolean;
}

/**
 * Raggruppa i file in cache per libreria (con le dipendenze usate solo da lei) e decide cosa si può togliere.
 * `removable` sono gli URL dei pacchetti che non servono a nessuna libreria ancora necessaria.
 */
export function planCleanup(files: CachedFile[], lock: Lock | null, needed: Set<string>) {
  const pkgOf = new Map(files.map((f) => [f.url, packageOfUrl(f.url, lock)]));
  const sizeOf = (pkgs: Set<string>) => files.filter((f) => pkgs.has(pkgOf.get(f.url)!)).reduce((a, f) => a + f.size, 0);
  const closure = (lib: string) => {
    const s = lock ? packagesFor(lock, [lib]) : new Set<string>();
    FROM_PYPI[lib]?.pypi.forEach((p) => s.add(`pypi:${normalize(p)}`));
    return s;
  };
  const present = new Set(pkgOf.values());
  // una libreria è "presente" se il suo pacchetto principale è in cache
  const mainPkg = (l: string) =>
    FROM_PYPI[l] ? `pypi:${normalize(FROM_PYPI[l].pypi[0])}` : lock ? Object.keys(lock.packages).find((k) => lock.packages[k].imports?.includes(l)) : undefined;
  const libs = Object.keys(LIB_LABEL).filter((l) => {
    const m = mainPkg(l);
    return !!m && present.has(m);
  });
  const keep = new Set<string>(['core']);
  for (const l of needed) closure(l).forEach((p) => keep.add(p));
  const rows: LibRow[] = [];
  const owned = new Set<string>();
  for (const l of libs) {
    const others = new Set<string>();
    for (const o of libs) if (o !== l) closure(o).forEach((p) => others.add(p));
    const mine = new Set([...closure(l)].filter((p) => !others.has(p) && present.has(p)));
    mine.forEach((p) => owned.add(p));
    rows.push({ lib: l, label: LIB_LABEL[l], size: sizeOf(mine), needed: needed.has(l) });
  }
  const shared = new Set([...present].filter((p) => p !== 'core' && !owned.has(p)));
  if (shared.size) rows.push({ lib: 'shared', label: 'Librerie di supporto condivise', size: sizeOf(shared), needed: [...shared].some((p) => keep.has(p)) });
  const removable = files.filter((f) => !keep.has(pkgOf.get(f.url)!)).map((f) => f.url);
  return {
    rows: rows.sort((a, b) => b.size - a.size),
    core: sizeOf(new Set(['core'])),
    removable,
    removableSize: files.filter((f) => removable.includes(f.url)).reduce((a, f) => a + f.size, 0)
  };
}

// ---------------------------------------------------------------- browser

export const hasCacheApi = () => typeof caches !== 'undefined';

/** I file del motore Python salvati dall'app, con la dimensione reale di ognuno. */
export async function pythonFiles(): Promise<{ files: CachedFile[]; lock: Lock | null }> {
  if (!hasCacheApi()) return { files: [], lock: null };
  const cache = await caches.open(PY_CACHE);
  const files: CachedFile[] = [];
  let lock: Lock | null = null;
  for (const req of await cache.keys()) {
    const res = await cache.match(req);
    if (!res) continue;
    if (req.url.endsWith('pyodide-lock.json')) lock = (await res.clone().json().catch(() => null)) as Lock | null;
    files.push({ url: req.url, size: (await res.blob()).size });
  }
  return { files, lock };
}

/** Dimensione della shell dell'app nella cache offline (precache di Workbox). */
export async function appShellSize(): Promise<number> {
  if (!hasCacheApi()) return 0;
  let total = 0;
  for (const name of await caches.keys()) {
    if (!name.startsWith('workbox-precache')) continue;
    const cache = await caches.open(name);
    for (const req of await cache.keys()) total += (await (await cache.match(req))?.blob())?.size ?? 0;
  }
  return total;
}

export async function removeFromPythonCache(urls: string[]): Promise<void> {
  if (!hasCacheApi()) return;
  const cache = await caches.open(PY_CACHE);
  await Promise.all(urls.map((u) => cache.delete(u)));
}

export async function clearPythonCache(): Promise<void> {
  if (hasCacheApi()) await caches.delete(PY_CACHE);
}

/** Byte occupati da un oggetto salvato in IndexedDB, stimati dalla sua forma JSON. */
export const jsonSize = (v: unknown) => (v == null ? 0 : new Blob([JSON.stringify(v)]).size);

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  if (n < 1024 ** 3) return `${(n / 1024 / 1024).toFixed(n < 10 * 1024 * 1024 ? 1 : 0).replace('.', ',')} MB`;
  return `${(n / 1024 ** 3).toFixed(1).replace('.', ',')} GB`;
}
