import { describe, expect, it } from 'vitest';
import { applyRemote, foldLocalXp, mergeStates, stripLocal, xpTotal } from '../src/engine/merge';
import { completeTask, emptyState, resetDay } from '../src/engine/state';
import type { AppState } from '../src/engine/types';

const T = '2026-11-17';
const st = (p: Partial<AppState>): AppState => ({ ...emptyState(), level: 'base', ...p });

describe('unione dei progressi', () => {
  it('unisce task, sezioni, progetti e tiene i campi locali di casa', () => {
    const a = st({ days: { [T]: { done: ['t1'], adv: [] } }, sections: ['s1'], projects: { p1: ['a'] }, reminder: { time: '18:00', enabled: true, asked: true } });
    const b = st({ days: { [T]: { done: ['t2', 't1'], adv: ['k1'] } }, sections: ['s2', 's1'], projects: { p1: ['b'], p2: ['x'] } });
    const m = mergeStates(a, b, T);
    expect(m.days[T]).toEqual({ done: ['t1', 't2'], adv: ['k1'] });
    expect(m.sections).toEqual(['s1', 's2']);
    expect(m.projects).toEqual({ p1: ['a', 'b'], p2: ['x'] });
    expect(m.reminder?.time).toBe('18:00');
    expect(mergeStates(b, a, T).reminder).toBeUndefined();
  });

  it('è ripetibile: unire di nuovo non cambia niente', () => {
    const a = st({ days: { [T]: { done: ['t1'], adv: [] } }, xpDev: { A: { p: 50, n: 0 } }, xp: 50 });
    const b = st({ days: { [T]: { done: ['t2'], adv: [] } }, xpDev: { B: { p: 30, n: 5 } }, xp: 25 });
    const m = mergeStates(a, b, T);
    expect(mergeStates(m, b, T)).toEqual(m);
    expect(mergeStates(m, a, T)).toEqual(m);
    const inverso = stripLocal(mergeStates(b, a, T));
    expect(new Set(inverso.days[T].done)).toEqual(new Set(m.days[T].done));
    expect(inverso.xp).toBe(m.xp);
  });

  it('i punti sono la somma dei contatori dei dispositivi', () => {
    const a = st({ xpDev: { A: { p: 120, n: 10 } } });
    const b = st({ xpDev: { A: { p: 100, n: 10 }, B: { p: 40, n: 0 } } });
    const m = mergeStates(a, b, T);
    expect(m.xpDev).toEqual({ A: { p: 120, n: 10 }, B: { p: 40, n: 0 } });
    expect(m.xp).toBe(150);
    expect(xpTotal({ A: { p: 1, n: 5 } })).toBe(0);
  });

  it('una giornata azzerata non torna da un altro dispositivo', () => {
    let a = st({});
    for (const id of ['t1', 't2', 't3']) a = completeTask(a, T, id).state;
    const server = mergeStates(st({}), a, T);
    const reset = resetDay(a, T);
    const m = mergeStates(reset, server, T);
    expect(m.days[T]).toEqual({ done: [], adv: [], r: 1 });
    expect(m.streak.lastFullDay).not.toBe(T);
  });

  it('i preferiti tolti non ricompaiono', () => {
    const f = { id: 'f1', text: 'x', kind: 'text' as const, anchor: '#', label: 'l', ts: 1 };
    const a = st({ favorites: [], favGone: { f1: 5 } });
    const b = st({ favorites: [f, { ...f, id: 'f2', ts: 2 }] });
    expect(mergeStates(a, b, T).favorites.map((x) => x.id)).toEqual(['f2']);
  });

  it('livello: vince la modifica più recente; «Azzera tutto» vince per intero', () => {
    const a = st({ level: 'avanzato', settingsAt: 10 });
    const b = st({ level: 'base', settingsAt: 20 });
    expect(mergeStates(a, b, T).level).toBe('base');
    const azzerato = { ...emptyState(), resetAt: 99 };
    const vecchio = st({ sections: ['s1'], xp: 40 });
    const m = mergeStates(vecchio, azzerato, T);
    expect(m.sections).toEqual([]);
    expect(m.level).toBeNull();
  });

  it('piano del giorno: vince il primo creato, poi il giorno più recente', () => {
    const p1 = { date: T, at: 100, plan: { intro: 'x', required: ['a'], advanced: [], project: null } };
    const p2 = { date: T, at: 200, plan: { intro: 'y', required: ['b'], advanced: [], project: null } };
    expect(mergeStates(st({ plan: p2 }), st({ plan: p1 }), T).plan).toEqual(p1);
    const ieri = { ...p1, date: '2026-11-16', at: 1 };
    expect(mergeStates(st({ plan: ieri }), st({ plan: p2 }), T).plan).toEqual(p2);
  });

  it('i giorni già compattati nello storico non si contano due volte', () => {
    const vecchio = '2026-08-03';
    const a = st({ weeks: { '2026-08-03': { done: 3, adv: 0 } } });
    const b = st({ days: { [vecchio]: { done: ['a', 'b', 'c'], adv: [] } } });
    const m = mergeStates(a, b, T);
    expect(m.days[vecchio]).toBeUndefined();
    expect(m.weeks['2026-08-03'].done).toBe(3);
  });
});

describe('punti durante la sincronizzazione', () => {
  it('due dispositivi guadagnano in parallelo e nessuno perde punti', () => {
    // telefono e computer partono entrambi dal server a 100 punti
    const server0 = st({ xpDev: { P: { p: 100, n: 0 } }, xp: 100 });
    let tel: AppState = { ...server0, xpSynced: 100 };
    let pc: AppState = { ...server0, xpSynced: 100 };
    tel = { ...tel, xp: tel.xp + 30 };
    pc = { ...pc, xp: pc.xp + 12 };

    const telSent = foldLocalXp(tel, 'P');
    const server1 = stripLocal(mergeStates(server0, stripLocal(telSent), T));
    tel = applyRemote(telSent, server1, T);
    expect(tel.xp).toBe(130);

    const pcSent = foldLocalXp(pc, 'C');
    const server2 = stripLocal(mergeStates(server1, stripLocal(pcSent), T));
    // durante la richiesta il computer guadagna altri 5 punti
    pc = applyRemote({ ...pcSent, xp: pcSent.xp + 5 }, server2, T);
    expect(server2.xp).toBe(142);
    expect(pc.xp).toBe(147);
    expect(pc.xpSynced).toBe(142);

    const telAgain = applyRemote(foldLocalXp(tel, 'P'), server2, T);
    expect(telAgain.xp).toBe(142);
  });

  it('un azzeramento della giornata toglie i punti anche dal server', () => {
    const base = st({ xpDev: { P: { p: 60, n: 0 } }, xp: 60, xpSynced: 60 });
    const tolto = { ...base, xp: 25 };
    const sent = foldLocalXp(tolto, 'P');
    expect(sent.xpDev?.P).toEqual({ p: 60, n: 35 });
    expect(mergeStates(base, stripLocal(sent), T).xp).toBe(25);
  });
});
