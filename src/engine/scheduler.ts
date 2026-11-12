import type { AppState, ContentIndex, LevelId, ProjectMeta, TaskMeta } from './types';
import { seedOf } from './dates';

/** Parte da cui inizia il percorso per ciascun livello. */
export const START_PART: Record<LevelId, string> = {
  principiante: 'p0',
  base: 'p1',
  intermedio: 'p2',
  avanzato: 'p3'
};

export function partOrder(index: ContentIndex): string[] {
  return index.parts.map((p) => p.id);
}

export function skippedParts(index: ContentIndex, level: LevelId | null): Set<string> {
  const start = START_PART[level ?? 'principiante'];
  const order = partOrder(index);
  return new Set(order.slice(0, Math.max(0, order.indexOf(start))));
}

/** Sezioni del percorso dell'utente, in ordine di libro, escluse le Parti saltate e gli stub. */
export function pathSections(index: ContentIndex, level: LevelId | null): string[] {
  const skip = skippedParts(index, level);
  const out: string[] = [];
  for (const p of index.parts) {
    if (skip.has(p.id)) continue;
    for (const c of p.chapters) for (const s of c.sections) if (!s.stub) out.push(s.id);
  }
  return out;
}

export function sectionPart(index: ContentIndex, sectionId: string): string | null {
  for (const p of index.parts) for (const c of p.chapters) if (c.sections.some((s) => s.id === sectionId)) return p.id;
  return null;
}

export interface DayPlan {
  required: string[]; // 3 ID di task
  advanced: string[]; // 0–2 ID di task avanzate
  project: string | null;
}

function doneEver(state: AppState): Set<string> {
  const set = new Set<string>();
  for (const log of Object.values(state.days)) log.done.forEach((id) => set.add(id));
  return set;
}

function advDoneEver(state: AppState): Set<string> {
  const set = new Set<string>();
  for (const log of Object.values(state.days)) log.adv.forEach((id) => set.add(id));
  return set;
}

/**
 * Sceglie le task del giorno in modo deterministico (seed = data + livello + progressi):
 * 1 "Impara" sul prossimo concetto, 1 "Prevedi"/"Scrivi" sullo stesso concetto,
 * 1 ripasso dal calendario di ripetizione dilazionata.
 */
export function planDay(index: ContentIndex, state: AppState, day: string): DayPlan {
  const path = pathSections(index, state.level);
  const done = doneEver(state);
  const byId = new Map(index.tasks.map((t) => [t.id, t]));
  const learned = new Set(state.learned);
  const seed = seedOf(`${day}|${state.level}|${state.learned.length}|${state.xp}`);
  const required: string[] = [];

  // 1) Impara: primo concetto non ancora introdotto.
  const current = path.find((s) => !learned.has(s) && byId.has(`impara-${s}`)) ?? null;
  if (current) required.push(`impara-${current}`);

  // 2) Pratica sul concetto di oggi (o sull'ultimo introdotto).
  const practiceOf = (sec: string | null) =>
    index.tasks.filter((t) => t.section === sec && t.type !== 'impara' && !done.has(t.id));
  const lastLearned = [...state.learned].reverse().find((s) => path.includes(s)) ?? null;
  let practice = practiceOf(current);
  if (!practice.length) practice = practiceOf(lastLearned);
  if (!practice.length) {
    practice = index.tasks.filter((t) => t.type !== 'impara' && learned.has(t.section) && !done.has(t.id));
  }
  if (practice.length) required.push(pick(practice, seed).id);

  // 3) Ripasso: la task con scadenza più vecchia, poi altra pratica non fatta, poi qualsiasi.
  const due = Object.entries(state.review)
    .filter(([id, r]) => r.due <= day && byId.has(id) && !required.includes(id))
    .sort((a, b) => a[1].due.localeCompare(b[1].due));
  if (due.length) required.push(due[0][0]);

  const fillers: TaskMeta[][] = [
    index.tasks.filter((t) => t.type !== 'impara' && (learned.has(t.section) || t.section === current) && !done.has(t.id)),
    index.tasks.filter((t) => t.type !== 'impara' && path.includes(t.section) && !done.has(t.id)),
    index.tasks.filter((t) => t.type !== 'impara' && path.includes(t.section)),
    index.tasks.filter((t) => t.type !== 'impara')
  ];
  for (const pool of fillers) {
    while (required.length < 3) {
      const options = pool.filter((t) => !required.includes(t.id));
      if (!options.length) break;
      required.push(pick(options, seed + required.length).id);
    }
  }

  // Avanzate: micro-task di progetto se sbloccato, altrimenti kata.
  const project = activeProject(index, state);
  const advDone = advDoneEver(state);
  let advanced: string[] = [];
  if (project) {
    const doneSteps = new Set(state.projects[project.id] ?? []);
    advanced = project.steps.filter((st) => !doneSteps.has(st.id)).slice(0, 2).map((st) => `${project.id}-${st.id}`);
  }
  if (advanced.length < 2) {
    const katas = index.katas.filter((k) => !advDone.has(k.id) && (learned.has(k.section) || path.indexOf(k.section) <= path.indexOf(lastLearned ?? '')));
    const pool = katas.length ? katas : index.katas.filter((k) => !advDone.has(k.id));
    for (const k of pool) {
      if (advanced.length >= 2) break;
      advanced.push(k.id);
    }
  }
  return { required: required.slice(0, 3), advanced, project: project?.id ?? null };
}

function pick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length];
}

/** Statistiche di una Parte: sezioni lette e precisione al primo colpo. */
export function partStats(index: ContentIndex, state: AppState, partId: string) {
  const part = index.parts.find((p) => p.id === partId);
  if (!part) return { read: 0, total: 0, pct: 0, accuracy: 0, attempts: 0 };
  const ids = part.chapters.flatMap((c) => c.sections.filter((s) => !s.stub).map((s) => s.id));
  const read = ids.filter((id) => state.sections.includes(id)).length;
  const writes = index.tasks.filter((t) => ids.includes(t.section) && t.type === 'scrivi' && t.id in state.firstTry);
  const ok = writes.filter((t) => state.firstTry[t.id]).length;
  return {
    read,
    total: ids.length,
    pct: ids.length ? Math.round((read / ids.length) * 100) : 0,
    accuracy: writes.length ? ok / writes.length : 1,
    attempts: writes.length
  };
}

/**
 * Un progetto si sblocca quando la Parte prerequisito è letta almeno all'80%
 * e le task "Scrivi" di quella Parte sono giuste al primo colpo almeno nel 70% dei casi.
 * Le Parti saltate col test di livello contano come completate.
 */
export function isProjectUnlocked(index: ContentIndex, state: AppState, project: ProjectMeta): boolean {
  if (skippedParts(index, state.level).has(project.unlockAfter)) return true;
  const st = partStats(index, state, project.unlockAfter);
  return st.total > 0 && st.pct >= 80 && st.accuracy >= 0.7;
}

export function activeProject(index: ContentIndex, state: AppState): ProjectMeta | null {
  for (const p of index.projects) {
    const done = new Set(state.projects[p.id] ?? []);
    const finished = p.steps.every((s) => done.has(s.id));
    if (finished) continue;
    return isProjectUnlocked(index, state, p) ? p : null;
  }
  return null;
}
