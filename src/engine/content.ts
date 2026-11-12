import type { ContentIndex, SectionDoc, Task } from './types';

// I contenuti stanno su GitHub: prima GitHub Pages (stessa origine), poi jsDelivr come riserva.
const BASE = `${import.meta.env.BASE_URL}content/`;
const FALLBACK = 'https://cdn.jsdelivr.net/gh/Aileorb/pycoil@content/';

async function getJson<T>(path: string): Promise<T> {
  // L'app non salva i contenuti: al massimo li tiene la normale cache HTTP del browser.
  try {
    const r = await fetch(BASE + path, { cache: 'no-cache' });
    if (r.ok) return (await r.json()) as T;
    throw new Error(String(r.status));
  } catch {
    const r = await fetch(FALLBACK + path, { cache: 'no-cache' });
    if (!r.ok) throw new Error(`Contenuto non raggiungibile: ${path}`);
    return (await r.json()) as T;
  }
}

let indexPromise: Promise<ContentIndex> | null = null;

export function loadIndex(): Promise<ContentIndex> {
  if (!indexPromise) {
    indexPromise = getJson<ContentIndex>('index.json').catch((e) => {
      indexPromise = null;
      throw e;
    });
  }
  return indexPromise;
}

export const loadSection = (id: string) => getJson<SectionDoc>(`sections/${id}.json`);
export const loadTask = (id: string) => getJson<Task>(`tasks/${id}.json`);
export const loadLibrary = (id: string) => getJson<SectionDoc>(`libraries/${id}.json`);
export const loadAppendix = (id: string) => getJson<SectionDoc>(`appendix/${id}.json`);
export const loadProjectPage = (id: string) => getJson<SectionDoc>(`projects/${id}.json`);
