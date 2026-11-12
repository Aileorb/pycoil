import { get, set, del } from 'idb-keyval';
import type { AppState, ContentIndex, Task } from './types';
import { emptyState, normalize } from './state';
import { planDay, type DayPlan } from './scheduler';
import { loadTask } from './content';

const STATE_KEY = 'pycoil:state';
const TODAY_KEY = 'pycoil:today';

export async function loadState(): Promise<AppState> {
  try {
    return normalize(await get(STATE_KEY));
  } catch {
    return emptyState();
  }
}

export async function saveState(s: AppState): Promise<void> {
  try {
    await set(STATE_KEY, s);
  } catch {
    /* storage non disponibile: l'app continua in memoria */
  }
}

/** Riassunto minimo del libro per statistiche e capacità senza rete (solo titoli e conteggi). */
export interface PartSummary {
  id: string;
  roman: string;
  short: string;
  sections: string[];
}

/**
 * Le uniche cose didattiche salvate in locale: testo e soluzione delle task di oggi.
 * Al cambio di data vengono cancellate e sostituite.
 */
export interface TodayRecord {
  date: string;
  plan: DayPlan;
  tasks: Record<string, Task>;
  parts: PartSummary[];
  /** Tentativi sbagliati di oggi per task (Prevedi: indici scelti; Scrivi e avanzate: un elemento per prova). */
  attempts?: Record<string, number[]>;
  /** Task messe in pausa: il codice scritto e i suggerimenti aperti, cancellati con il giorno. */
  drafts?: Record<string, TaskDraft>;
}

export interface TaskDraft {
  code?: string;
  hints?: number;
}

export async function saveToday(rec: TodayRecord): Promise<void> {
  try {
    await set(TODAY_KEY, rec);
  } catch {
    /* in memoria */
  }
}

export async function readToday(): Promise<TodayRecord | null> {
  try {
    return ((await get(TODAY_KEY)) as TodayRecord | undefined) ?? null;
  } catch {
    return null;
  }
}

export async function clearToday(): Promise<void> {
  try {
    await del(TODAY_KEY);
  } catch {
    /* niente */
  }
}

export async function buildToday(index: ContentIndex, state: AppState, day: string, keepPlan?: DayPlan): Promise<TodayRecord> {
  const plan = keepPlan ?? planDay(index, state, day);
  const ids = [...(plan.intro ? [plan.intro] : []), ...plan.required, ...plan.advanced];
  const loaded = await Promise.all(ids.map((id) => loadTask(id).catch(() => null)));
  const tasks: Record<string, Task> = {};
  loaded.forEach((t, i) => {
    if (t) tasks[ids[i]] = t;
  });
  const record: TodayRecord = {
    date: day,
    plan,
    tasks,
    parts: index.parts.map((p) => ({
      id: p.id,
      roman: p.roman,
      short: p.short,
      sections: p.chapters.flatMap((c) => c.sections.filter((s) => !s.stub).map((s) => s.id))
    }))
  };
  try {
    await set(TODAY_KEY, record);
  } catch {
    /* in memoria */
  }
  return record;
}

/** Restituisce le task di oggi: se in cache c'è un altro giorno, la cancella e la ricrea. */
export async function ensureToday(
  day: string,
  state: AppState,
  getIndex: () => Promise<ContentIndex>
): Promise<TodayRecord | null> {
  const cached = await readToday();
  // un piano di oggi nel formato precedente (senza introduzione) si ricalcola, tenendo tentativi e bozze
  if (cached && cached.date === day && 'intro' in cached.plan) return cached;
  if (cached && cached.date === day) {
    try {
      const rec = await buildToday(await getIndex(), state, day);
      const merged = { ...rec, attempts: cached.attempts, drafts: cached.drafts };
      await saveToday(merged);
      return merged;
    } catch {
      return cached;
    }
  }
  if (cached) await clearToday();
  try {
    return await buildToday(await getIndex(), state, day);
  } catch {
    return null; // offline e niente task di oggi: la Home lo segnala
  }
}

export function exportState(s: AppState): string {
  return JSON.stringify(s, null, 2);
}
