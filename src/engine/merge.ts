// Unione dei progressi di due dispositivi (o di un dispositivo e del server).
// Regole pensate perché l'unione sia ripetibile: unire due volte, o in ordine diverso, dà lo stesso risultato.
//  - insiemi (task fatte, sezioni lette, passi dei progetti, preferiti): unione;
//  - punti: un contatore per dispositivo (guadagni e tolti), il totale è la somma;
//  - impostazioni (livello, anno): vince la modifica più recente;
//  - giornata azzerata o «Azzera tutto»: vince l'azzeramento più recente;
//  - piano del giorno: vince quello creato per primo, così tutti i dispositivi fanno le stesse task.
// Restano del dispositivo (mai inviati): promemoria, fotografia di oggi e contatore di sincronizzazione.
import type { AppState, DayLog, Favorite } from './types';
import { normalize, DAY_TASKS } from './state';
import { addDays, weekStart } from './dates';

/** Toglie i campi che appartengono solo a questo dispositivo. */
export function stripLocal(s: AppState): AppState {
  const out = { ...s };
  delete out.daySnap;
  delete out.reminder;
  delete out.xpSynced;
  return out;
}

export function xpTotal(dev: AppState['xpDev']): number {
  return Math.max(0, Object.values(dev ?? {}).reduce((a, c) => a + c.p - c.n, 0));
}

function union(a: string[], b: string[]): string[] {
  const seen = new Set(a);
  return [...a, ...b.filter((x) => !seen.has(x) && (seen.add(x), true))];
}

function mergeDay(a: DayLog | undefined, b: DayLog | undefined): DayLog {
  if (!a) return b!;
  if (!b) return a;
  const ra = a.r ?? 0;
  const rb = b.r ?? 0;
  if (ra !== rb) return ra > rb ? a : b;
  const out: DayLog = { done: union(a.done, b.done), adv: union(a.adv, b.adv) };
  if (ra) out.r = ra;
  return out;
}

function pickStreak(a: AppState['streak'], b: AppState['streak'], days: AppState['days'], cutoff: string): AppState['streak'] {
  // una streak che dice «giornata completa» per un giorno che, unito, non lo è (azzerato altrove) non vale
  const valid = (s: AppState['streak']) => !s.lastFullDay || s.lastFullDay < cutoff || (days[s.lastFullDay]?.done.length ?? 0) >= DAY_TASKS;
  const cands = [a, b].filter(valid);
  const pool = cands.length ? cands : [a, b];
  pool.sort((x, y) => (y.lastFullDay ?? '').localeCompare(x.lastFullDay ?? '') || y.current - x.current);
  const best = pool[0];
  return { ...best, best: Math.max(a.best, b.best, best.current) };
}

/**
 * Unisce due stati. `a` è quello «di casa»: da lui vengono i campi solo locali.
 * `today` serve a riconoscere i giorni già compattati nello storico settimanale.
 */
export function mergeStates(aIn: AppState, bIn: AppState, today: string): AppState {
  const a = normalize(aIn);
  const b = normalize(bIn);

  // «Azzera tutto» più recente: vince per intero
  const ra = a.resetAt ?? 0;
  const rb = b.resetAt ?? 0;
  if (ra !== rb) {
    const win = ra > rb ? a : b;
    return { ...stripLocal(win), daySnap: a.daySnap, reminder: a.reminder, xpSynced: a.xpSynced };
  }

  const cutoff = addDays(today, -56);

  // storico settimanale: il massimo; i giorni vecchi già compattati da una parte non si contano due volte
  const weeks: AppState['weeks'] = { ...a.weeks };
  for (const [w, v] of Object.entries(b.weeks)) {
    const cur = weeks[w];
    weeks[w] = cur ? { done: Math.max(cur.done, v.done), adv: Math.max(cur.adv, v.adv) } : v;
  }
  const days: AppState['days'] = {};
  for (const d of new Set([...Object.keys(a.days), ...Object.keys(b.days)])) {
    if (d < cutoff && weeks[weekStart(d)]) continue;
    days[d] = mergeDay(a.days[d], b.days[d]);
  }

  const firstTry: AppState['firstTry'] = { ...a.firstTry };
  for (const [k, v] of Object.entries(b.firstTry)) firstTry[k] = k in firstTry ? firstTry[k] && v : v;

  const review: AppState['review'] = { ...a.review };
  for (const [k, v] of Object.entries(b.review)) {
    const cur = review[k];
    if (!cur || v.step > cur.step || (v.step === cur.step && v.due > cur.due)) review[k] = v;
  }

  const projects: AppState['projects'] = { ...a.projects };
  for (const [k, v] of Object.entries(b.projects)) projects[k] = union(projects[k] ?? [], v);

  const scroll: AppState['scroll'] = { ...a.scroll };
  for (const [k, v] of Object.entries(b.scroll)) scroll[k] = Math.max(scroll[k] ?? 0, v);

  const favGone: Record<string, number> = { ...(a.favGone ?? {}) };
  for (const [k, v] of Object.entries(b.favGone ?? {})) favGone[k] = Math.max(favGone[k] ?? 0, v);
  const favMap = new Map<string, Favorite>();
  for (const f of [...a.favorites, ...b.favorites]) if (!(f.id in favGone) && !favMap.has(f.id)) favMap.set(f.id, f);
  const favorites = [...favMap.values()].sort((x, y) => y.ts - x.ts);

  const xpDev: NonNullable<AppState['xpDev']> = { ...(a.xpDev ?? {}) };
  for (const [k, v] of Object.entries(b.xpDev ?? {})) {
    const cur = xpDev[k];
    xpDev[k] = cur ? { p: Math.max(cur.p, v.p), n: Math.max(cur.n, v.n) } : v;
  }

  const sa = a.settingsAt ?? 0;
  const sb = b.settingsAt ?? 0;
  const settings = sa >= sb ? a : b;

  let plan = a.plan ?? b.plan;
  if (a.plan && b.plan) {
    if (a.plan.date !== b.plan.date) plan = a.plan.date > b.plan.date ? a.plan : b.plan;
    else plan = a.plan.at < b.plan.at || (a.plan.at === b.plan.at && JSON.stringify(a.plan.plan) <= JSON.stringify(b.plan.plan)) ? a.plan : b.plan;
  }

  const created = [a.createdOn, b.createdOn].filter((x): x is string => !!x).sort()[0] ?? null;

  const out: AppState = {
    version: 1,
    level: settings.level,
    year: settings.year,
    createdOn: created,
    // senza contatori (stati di prima della sincronizzazione) vale il più alto dei due
    xp: Object.keys(xpDev).length ? xpTotal(xpDev) : Math.max(a.xp, b.xp),
    streak: pickStreak(a.streak, b.streak, days, cutoff),
    days,
    weeks,
    learned: union(a.learned, b.learned),
    sections: union(a.sections, b.sections),
    firstTry,
    review,
    projects,
    favorites,
    scroll,
    xpDev,
    favGone
  };
  if (sa || sb) out.settingsAt = Math.max(sa, sb);
  if (plan) out.plan = plan;
  if (ra) out.resetAt = ra;
  if (a.daySnap) out.daySnap = a.daySnap;
  if (a.reminder) out.reminder = a.reminder;
  if (a.xpSynced !== undefined) out.xpSynced = a.xpSynced;
  return out;
}

/**
 * Prepara lo stato locale per l'invio: i punti guadagnati (o tolti) dall'ultima sincronizzazione
 * entrano nel contatore di questo dispositivo.
 */
export function foldLocalXp(s: AppState, device: string): AppState {
  const delta = s.xp - (s.xpSynced ?? 0);
  const cur = s.xpDev?.[device] ?? { p: 0, n: 0 };
  const next = delta >= 0 ? { p: cur.p + delta, n: cur.n } : { p: cur.p, n: cur.n - delta };
  return { ...s, xpDev: { ...(s.xpDev ?? {}), [device]: next }, xpSynced: s.xp };
}

/**
 * Applica la risposta del server allo stato locale attuale (che può essere cambiato durante la richiesta):
 * unione, poi i punti del server più quelli guadagnati nel frattempo.
 */
export function applyRemote(current: AppState, remote: AppState, today: string): AppState {
  // punti guadagnati dopo l'invio (il contatore di questo dispositivo è già nel server o lo sarà al prossimo giro)
  const pending = current.xp - (current.xpSynced ?? 0);
  const m = mergeStates(current, remote, today);
  const synced = xpTotal(m.xpDev);
  return { ...m, xp: Math.max(0, synced + pending), xpSynced: synced };
}
