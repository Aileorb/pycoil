import type { AppState, DayLog } from './types';
import { addDays, daysBetween } from './dates';
import { XP, streakMultiplier } from './levels';

export const REVIEW_STEPS = [1, 3, 7, 14, 30];
export const DAY_TASKS = 3;
/** Tentativi sbagliati prima che la soluzione venga mostrata. */
export const MAX_ATTEMPTS = 3;

export function emptyState(): AppState {
  return {
    version: 1,
    level: null,
    year: null,
    createdOn: null,
    xp: 0,
    streak: { current: 0, best: 0, lastFullDay: null, lost: false },
    days: {},
    weeks: {},
    learned: [],
    sections: [],
    firstTry: {},
    review: {},
    projects: {},
    favorites: [],
    scroll: {}
  };
}

/** Rende valido qualsiasi oggetto importato (export JSON, versioni vecchie). */
export function normalize(raw: unknown): AppState {
  const base = emptyState();
  if (!raw || typeof raw !== 'object') return base;
  const r = raw as Partial<AppState>;
  return {
    ...base,
    ...r,
    version: 1,
    streak: { ...base.streak, ...(r.streak ?? {}) },
    days: r.days ?? {},
    weeks: r.weeks ?? {},
    learned: r.learned ?? [],
    sections: r.sections ?? [],
    firstTry: r.firstTry ?? {},
    review: r.review ?? {},
    projects: r.projects ?? {},
    favorites: r.favorites ?? [],
    scroll: r.scroll ?? {}
  };
}

/**
 * Da chiamare all'apertura e al cambio di data: se è passato un giorno intero
 * senza le 3 task, la streak si azzera e compare lo scheletro.
 */
export function refreshStreak(s: AppState, today: string): AppState {
  const last = s.streak.lastFullDay;
  if (!last || s.streak.current === 0) return s;
  if (daysBetween(last, today) > 1) {
    return { ...s, streak: { ...s.streak, current: 0, lost: true } };
  }
  return s;
}

function dayLog(s: AppState, day: string): DayLog {
  return s.days[day] ?? { done: [], adv: [] };
}

export function isDayComplete(s: AppState, day: string): boolean {
  return dayLog(s, day).done.length >= DAY_TASKS;
}

export interface CompletionResult {
  state: AppState;
  gained: number;
  dayCompleted: boolean;
}

/** Registra una task obbligatoria completata. */
export function completeTask(
  s: AppState,
  day: string,
  taskId: string,
  opts: { firstTry?: boolean; sectionLearned?: string } = {}
): CompletionResult {
  const log = dayLog(s, day);
  if (log.done.includes(taskId)) return { state: s, gained: 0, dayCompleted: false };

  const mult = streakMultiplier(s.streak.current);
  let gained = XP.task + (opts.firstTry ? XP.firstTry : 0);
  const done = [...log.done, taskId];
  const next: AppState = {
    ...s,
    days: { ...s.days, [day]: { ...log, done } },
    learned:
      opts.sectionLearned && !s.learned.includes(opts.sectionLearned)
        ? [...s.learned, opts.sectionLearned]
        : s.learned,
    firstTry:
      opts.firstTry === undefined || taskId in s.firstTry ? s.firstTry : { ...s.firstTry, [taskId]: opts.firstTry },
    review: scheduleReview(s.review, taskId, day)
  };

  let dayCompleted = false;
  if (done.length === DAY_TASKS) {
    dayCompleted = true;
    gained += XP.fullDay;
    const last = s.streak.lastFullDay;
    let current = 1;
    if (last === day) current = s.streak.current;
    else if (last && daysBetween(last, day) === 1 && !s.streak.lost) current = s.streak.current + 1;
    next.streak = { current, best: Math.max(s.streak.best, current), lastFullDay: day, lost: false };
  }
  next.xp = s.xp + Math.round(gained * mult);
  return { state: next, gained: Math.round(gained * mult), dayCompleted };
}

/** Le avanzate non toccano la streak: danno solo XP e fanno volare il pulcino. */
export function completeAdvanced(s: AppState, day: string, taskId: string, project?: string, stepId?: string): CompletionResult {
  const log = dayLog(s, day);
  if (log.adv.includes(taskId)) return { state: s, gained: 0, dayCompleted: false };
  const gained = Math.round(XP.advanced * streakMultiplier(s.streak.current));
  const projects = { ...s.projects };
  if (project && stepId) {
    const steps = projects[project] ?? [];
    if (!steps.includes(stepId)) projects[project] = [...steps, stepId];
  }
  return {
    state: { ...s, xp: s.xp + gained, days: { ...s.days, [day]: { ...log, adv: [...log.adv, taskId] } }, projects },
    gained,
    dayCompleted: false
  };
}

export function markSectionRead(s: AppState, sectionId: string): CompletionResult {
  if (s.sections.includes(sectionId)) return { state: s, gained: 0, dayCompleted: false };
  return { state: { ...s, sections: [...s.sections, sectionId], xp: s.xp + XP.section }, gained: XP.section, dayCompleted: false };
}

/** Ripetizione dilazionata: 1, 3, 7, 14, 30 giorni. */
export function scheduleReview(review: AppState['review'], taskId: string, day: string): AppState['review'] {
  if (taskId.startsWith('impara-')) return review;
  const cur = review[taskId];
  const step = cur ? Math.min(cur.step + 1, REVIEW_STEPS.length - 1) : 0;
  return { ...review, [taskId]: { due: addDays(day, REVIEW_STEPS[step]), step } };
}

/** Dopo 8 settimane lo storico giornaliero si compatta in totali settimanali. */
export function compactHistory(s: AppState, today: string, weekStartOf: (d: string) => string): AppState {
  const cutoff = addDays(today, -56);
  const days = { ...s.days };
  const weeks = { ...s.weeks };
  let changed = false;
  for (const [day, log] of Object.entries(s.days)) {
    if (day < cutoff) {
      const w = weekStartOf(day);
      const prev = weeks[w] ?? { done: 0, adv: 0 };
      weeks[w] = { done: prev.done + log.done.length, adv: prev.adv + log.adv.length };
      delete days[day];
      changed = true;
    }
  }
  return changed ? { ...s, days, weeks } : s;
}
