import { describe, expect, it, vi, beforeEach } from 'vitest';
import { addDays, dayKey, daysBetween, weekStart } from '../src/engine/dates';
import { completeAdvanced, completeTask, compactHistory, emptyState, markSectionRead, normalize, refreshStreak } from '../src/engine/state';
import { levelProgress, moodFor, stageFor } from '../src/engine/levels';
import { planDay, pathSections, isProjectUnlocked } from '../src/engine/scheduler';
import type { AppState, ContentIndex } from '../src/engine/types';

const mem = new Map<string, unknown>();
vi.mock('idb-keyval', () => ({
  get: async (k: string) => mem.get(k),
  set: async (k: string, v: unknown) => void mem.set(k, structuredClone(v)),
  del: async (k: string) => void mem.delete(k)
}));
vi.mock('../src/engine/content', () => ({
  loadTask: async (id: string) => ({ id, type: 'prevedi', section: 's', title: id, minutes: 2, code: '', codeHtml: '', options: [], answer: 0, explain: '' })
}));

function finishDay(s: AppState, day: string): AppState {
  let st = s;
  for (const id of ['a', 'b', 'c']) st = completeTask(st, day, `${id}-${day}`).state;
  return st;
}

describe('date', () => {
  it('calcola giorni di calendario anche a cavallo del cambio ora', () => {
    expect(daysBetween('2026-03-28', '2026-03-30')).toBe(2);
    expect(daysBetween('2026-10-24', '2026-10-26')).toBe(2);
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(weekStart('2026-11-12')).toBe('2026-11-09');
  });
  it('usa il giorno locale, non UTC', () => {
    const late = new Date(2026, 10, 12, 23, 59, 0);
    expect(dayKey(late)).toBe('2026-11-12');
    const midnight = new Date(2026, 10, 13, 0, 0, 1);
    expect(dayKey(midnight)).toBe('2026-11-13');
  });
});

describe('streak', () => {
  it('cresce con giorni consecutivi completi', () => {
    let s = emptyState();
    s = finishDay(s, '2026-11-10');
    s = finishDay(s, '2026-11-11');
    s = finishDay(s, '2026-11-12');
    expect(s.streak.current).toBe(3);
    expect(s.streak.best).toBe(3);
  });

  it('non si azzera a mezzanotte se ieri era completo', () => {
    let s = finishDay(emptyState(), '2026-11-11');
    s = refreshStreak(s, '2026-11-12');
    expect(s.streak.current).toBe(1);
    expect(s.streak.lost).toBe(false);
  });

  it('si azzera e mostra lo scheletro se si salta un giorno intero', () => {
    let s = finishDay(emptyState(), '2026-11-10');
    s = refreshStreak(s, '2026-11-12');
    expect(s.streak.current).toBe(0);
    expect(s.streak.lost).toBe(true);
    expect(moodFor(s.streak.current, s.streak.lost)).toBe('lost');
    s = finishDay(s, '2026-11-12');
    expect(s.streak.current).toBe(1);
    expect(s.streak.lost).toBe(false);
  });

  it('servono 3 task obbligatorie: due non bastano', () => {
    let s = emptyState();
    s = completeTask(s, '2026-11-12', 'x').state;
    s = completeTask(s, '2026-11-12', 'y').state;
    expect(s.streak.current).toBe(0);
    const r = completeTask(s, '2026-11-12', 'z');
    expect(r.dayCompleted).toBe(true);
    expect(r.state.streak.current).toBe(1);
  });

  it('le avanzate non toccano la streak ma danno XP', () => {
    const s = completeAdvanced(emptyState(), '2026-11-12', 'k1', 'p1', 's1');
    expect(s.state.streak.current).toBe(0);
    expect(s.state.xp).toBe(40);
    expect(s.state.projects.p1).toEqual(['s1']);
  });

  it('non conta due volte la stessa task', () => {
    let s = completeTask(emptyState(), '2026-11-12', 'x').state;
    const again = completeTask(s, '2026-11-12', 'x');
    expect(again.gained).toBe(0);
    s = markSectionRead(s, '00-01-01').state;
    expect(markSectionRead(s, '00-01-01').gained).toBe(0);
  });
});

describe('livelli', () => {
  it('il serpente cresce solo alle soglie', () => {
    expect(stageFor(0).name).toBe('Uovo');
    expect(stageFor(149).level).toBe(1);
    expect(stageFor(150).level).toBe(2);
    expect(stageFor(3500).name).toBe('Beato');
    expect(levelProgress(1458).pct).toBe(62);
  });
  it('mascotte per fascia di streak', () => {
    expect(moodFor(0, false)).toBe('sleepy');
    expect(moodFor(2, false)).toBe('smile');
    expect(moodFor(5, false)).toBe('wave');
    expect(moodFor(12, false)).toBe('jump');
    expect(moodFor(21, false)).toBe('party');
    expect(moodFor(45, false)).toBe('gold');
  });
});

describe('storico', () => {
  it('compatta i giorni più vecchi di 8 settimane in totali settimanali', () => {
    let s = finishDay(emptyState(), '2026-08-03');
    s = finishDay(s, '2026-11-11');
    const c = compactHistory(s, '2026-11-12', weekStart);
    expect(Object.keys(c.days)).toEqual(['2026-11-11']);
    expect(c.weeks['2026-08-03']).toEqual({ done: 3, adv: 0 });
  });
  it('importa export vecchi o parziali senza rompersi', () => {
    const s = normalize({ xp: 99, streak: { current: 4 } });
    expect(s.xp).toBe(99);
    expect(s.streak.current).toBe(4);
    expect(s.days).toEqual({});
  });
});

const index: ContentIndex = {
  version: 't',
  python: '3.14',
  parts: [
    { id: 'p0', roman: '0', title: 'Zero', short: 'Basi', chapters: [{ id: 'c0', title: 'c', sections: [{ id: '00-01', title: 'a', minutes: 3 }, { id: '00-02', title: 'b', minutes: 3 }] }] },
    { id: 'p1', roman: 'I', title: 'Uno', short: 'Solido', chapters: [{ id: 'c1', title: 'c', sections: [{ id: '01-01', title: 'c', minutes: 3 }, { id: '01-99', title: 'stub', minutes: 3, stub: true }] }] }
  ],
  libraries: [],
  appendix: [],
  tasks: [
    { id: 'impara-00-01', type: 'impara', section: '00-01', title: 'i1', minutes: 3 },
    { id: 'prevedi-00-01-a', type: 'prevedi', section: '00-01', title: 'p1', minutes: 2 },
    { id: 'scrivi-00-01-a', type: 'scrivi', section: '00-01', title: 's1', minutes: 4 },
    { id: 'impara-00-02', type: 'impara', section: '00-02', title: 'i2', minutes: 3 },
    { id: 'prevedi-00-02-a', type: 'prevedi', section: '00-02', title: 'p2', minutes: 2 },
    { id: 'impara-01-01', type: 'impara', section: '01-01', title: 'i3', minutes: 3 },
    { id: 'scrivi-01-01-a', type: 'scrivi', section: '01-01', title: 's3', minutes: 4 }
  ],
  katas: [{ id: 'kata-1', type: 'kata', section: '00-01', title: 'k', minutes: 20 }],
  projects: [{ id: 'p1', title: 'Progetto', stars: 1, unlockAfter: 'p0', summary: '', steps: [{ id: 's1', title: 'a', minutes: 20 }, { id: 's2', title: 'b', minutes: 20 }] }],
  quiz: []
};

describe('scheduler', () => {
  it('il livello sceglie da dove partire e salta gli stub', () => {
    expect(pathSections(index, 'principiante')).toEqual(['00-01', '00-02', '01-01']);
    expect(pathSections(index, 'base')).toEqual(['01-01']);
  });

  it("l'introduzione è separata e le 3 task sono esercizi sul concetto di oggi", () => {
    const s = { ...emptyState(), level: 'principiante' as const };
    const plan = planDay(index, s, '2026-11-12');
    expect(plan.intro).toBe('impara-00-01');
    expect(plan.required).toHaveLength(3);
    expect(plan.required.slice(0, 2)).toEqual(['prevedi-00-01-a', 'scrivi-00-01-a']);
    expect(plan.required.some((id) => id.startsWith('impara-'))).toBe(false);
    expect(new Set(plan.required).size).toBe(3);
  });

  it('è deterministico nella stessa giornata', () => {
    const s = { ...emptyState(), level: 'principiante' as const };
    expect(planDay(index, s, '2026-11-12')).toEqual(planDay(index, s, '2026-11-12'));
  });

  it('i ripassi scaduti entrano nelle task del giorno', () => {
    const s: AppState = { ...emptyState(), level: 'principiante', learned: ['00-01'], review: { 'prevedi-00-01-a': { due: '2026-11-12', step: 0 } } };
    expect(planDay(index, s, '2026-11-12').required).toContain('prevedi-00-01-a');
  });

  it('il progetto si sblocca saltando la Parte col test di livello', () => {
    const s = { ...emptyState(), level: 'base' as const };
    expect(isProjectUnlocked(index, s, index.projects[0])).toBe(true);
    const plan = planDay(index, s, '2026-11-12');
    expect(plan.advanced).toEqual(['p1-s1', 'p1-s2']);
  });

  it('il progetto resta bloccato finché la Parte non è letta all’80%', () => {
    const s = { ...emptyState(), level: 'principiante' as const };
    expect(isProjectUnlocked(index, s, index.projects[0])).toBe(false);
    expect(planDay(index, s, '2026-11-12').advanced).toEqual(['kata-1']);
  });
});

describe('task del giorno usa-e-getta', () => {
  beforeEach(() => mem.clear());

  it('al cambio di giorno cancella testo e soluzioni di ieri', async () => {
    const { ensureToday, readToday } = await import('../src/engine/storage');
    const s = { ...emptyState(), level: 'principiante' as const };
    const t1 = await ensureToday('2026-11-11', s, async () => index);
    expect(t1?.date).toBe('2026-11-11');
    const t2 = await ensureToday('2026-11-12', s, async () => index);
    expect(t2?.date).toBe('2026-11-12');
    const stored = await readToday();
    expect(stored?.date).toBe('2026-11-12');
    expect(JSON.stringify([...mem.values()])).not.toContain('2026-11-11');
  });

  it('nello stato persistente restano solo ID e contatori', async () => {
    const s = finishDay(emptyState(), '2026-11-12');
    const json = JSON.stringify(s);
    expect(json).not.toMatch(/solution|promptHtml|codeHtml|tests/);
  });
});
