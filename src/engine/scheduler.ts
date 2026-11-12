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

/** Numero «Parte.capitolo.sezione» dalla posizione nel libro (non dall'ID, che resta stabile se si riordina). */
export function sectionNumber(index: ContentIndex, sectionId: string): string {
  for (const [pi, p] of index.parts.entries())
    for (const [ci, c] of p.chapters.entries()) {
      const si = c.sections.findIndex((s) => s.id === sectionId);
      if (si >= 0) return `${pi}.${ci + 1}.${si + 1}`;
    }
  return '';
}

export function sectionPart(index: ContentIndex, sectionId: string): string | null {
  for (const p of index.parts) for (const c of p.chapters) if (c.sections.some((s) => s.id === sectionId)) return p.id;
  return null;
}

export interface DayPlan {
  /** Introduzione del giorno (la scheda «Impara» del nuovo concetto): si legge prima, non conta come task. */
  intro: string | null;
  required: string[]; // 3 ID di esercizi (Prevedi / Scrivi)
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
 * Sceglie la giornata in modo deterministico (seed = data + livello + progressi):
 * un'introduzione al prossimo concetto (non conta come task) e 3 esercizi: prima la pratica
 * sul concetto di oggi, poi il ripasso dal calendario di ripetizione dilazionata, poi altri esercizi.
 */
export function planDay(index: ContentIndex, state: AppState, day: string): DayPlan {
  const path = pathSections(index, state.level);
  const done = doneEver(state);
  const byId = new Map(index.tasks.map((t) => [t.id, t]));
  const learned = new Set(state.learned);
  const seed = seedOf(`${day}|${state.level}|${state.learned.length}|${state.xp}`);
  const required: string[] = [];

  // Introduzione: primo concetto non ancora introdotto.
  const current = path.find((s) => !learned.has(s) && byId.has(`impara-${s}`)) ?? null;
  const intro = current ? `impara-${current}` : null;

  // 1) Pratica sul concetto di oggi (o sull'ultimo introdotto): prima Prevedi, poi Scrivi, al massimo 2.
  const practiceOf = (sec: string | null) =>
    index.tasks.filter((t) => t.section === sec && t.type !== 'impara' && !done.has(t.id));
  const lastLearned = [...state.learned].reverse().find((s) => path.includes(s)) ?? null;
  let practice = practiceOf(current);
  if (!practice.length) practice = practiceOf(lastLearned);
  if (!practice.length) {
    practice = index.tasks.filter((t) => t.type !== 'impara' && learned.has(t.section) && !done.has(t.id));
  }
  const order = (t: TaskMeta) => (t.type === 'prevedi' ? 0 : 1);
  const sameSection = practice.filter((t) => t.section === practice[0]?.section).sort((a, b) => order(a) - order(b));
  if (sameSection.length > 1) required.push(...sameSection.slice(0, 2).map((t) => t.id));
  else if (practice.length) required.push(pick(practice, seed).id);

  // 2) Ripasso: l'esercizio con scadenza più vecchia, poi altra pratica non fatta, poi qualsiasi.
  const due = Object.entries(state.review)
    .filter(([id, r]) => r.due <= day && byId.has(id) && byId.get(id)!.type !== 'impara' && !required.includes(id))
    .sort((a, b) => a[1].due.localeCompare(b[1].due));
  if (due.length && required.length < 3) required.push(due[0][0]);

  // 3) Riempitivi, mai esercizi di argomenti lontani: prima quelli dei concetti già visti (a caso),
  //    poi i più vicini lungo il percorso (in ordine), poi ripetizioni di esercizi già fatti.
  const pos = (t: TaskMeta) => path.indexOf(t.section);
  const here = current ? path.indexOf(current) : path.length;
  const practiceTasks = index.tasks.filter((t) => t.type !== 'impara' && pos(t) >= 0);
  const fillers: { pool: TaskMeta[]; random: boolean }[] = [
    { pool: practiceTasks.filter((t) => learned.has(t.section) && !done.has(t.id)), random: true },
    { pool: practiceTasks.filter((t) => !done.has(t.id) && pos(t) >= here).sort((x, y) => pos(x) - pos(y)), random: false },
    { pool: practiceTasks.filter((t) => learned.has(t.section) || pos(t) <= here), random: true },
    { pool: [...practiceTasks].sort((x, y) => pos(x) - pos(y)), random: false }
  ];
  for (const { pool, random } of fillers) {
    while (required.length < 3) {
      const options = pool.filter((t) => !required.includes(t.id));
      if (!options.length) break;
      required.push((random ? pick(options, seed + required.length) : options[0]).id);
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
    // Solo kata su argomenti già visti: sezione introdotta, oppure in una Parte saltata dal test di livello,
    // oppure lungo il percorso non oltre l'ultima sezione introdotta. Se nessuno è adatto, niente avanzate.
    const skipped = skippedParts(index, state.level);
    const reach = lastLearned ? path.indexOf(lastLearned) : -1;
    const known = (sec: string) => {
      if (learned.has(sec)) return true;
      const i = path.indexOf(sec);
      if (i >= 0) return i <= reach;
      const part = sectionPart(index, sec);
      return !!part && skipped.has(part);
    };
    const pool = index.katas
      .filter((k) => !advDone.has(k.id) && known(k.section))
      .sort((a, b) => path.indexOf(a.section) - path.indexOf(b.section));
    for (const k of pool) {
      if (advanced.length >= 2) break;
      advanced.push(k.id);
    }
  }
  return { intro, required: required.slice(0, 3), advanced, project: project?.id ?? null };
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
