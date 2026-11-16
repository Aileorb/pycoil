// Calcoli di calendario per i promemoria, nel fuso orario dell'utente (puri, testati in tests/reminder.test.ts).

const FALLBACK_TZ = 'Europe/Rome';

/** Un fuso IANA valido (es. "Europe/Rome"); altrimenti quello italiano. */
export function validTz(tz: unknown): string {
  if (typeof tz !== 'string' || !tz || tz.length > 64) return FALLBACK_TZ;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return tz;
  } catch {
    return FALLBACK_TZ;
  }
}

/** Un orario "HH:MM" valido, oppure null. */
export function validTime(t: unknown): string | null {
  if (typeof t !== 'string') return null;
  const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(t);
  return m ? t : null;
}

interface Parts { y: number; m: number; d: number; h: number; mi: number; s: number }

function partsIn(tz: string, ms: number): Parts {
  const f = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23'
  });
  const p: Record<string, number> = {};
  for (const x of f.formatToParts(new Date(ms))) if (x.type !== 'literal') p[x.type] = Number(x.value);
  return { y: p.year, m: p.month, d: p.day, h: p.hour % 24, mi: p.minute, s: p.second };
}

/** La data locale "YYYY-MM-DD" di un istante nel fuso dato. */
export function dayIn(tz: string, ms: number): string {
  const p = partsIn(tz, ms);
  return `${p.y}-${String(p.m).padStart(2, '0')}-${String(p.d).padStart(2, '0')}`;
}

/** Il giorno prima di una data "YYYY-MM-DD". */
export function dayBefore(day: string): string {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d - 1)).toISOString().slice(0, 10);
}

function offsetMs(tz: string, ms: number): number {
  const p = partsIn(tz, ms);
  return Date.UTC(p.y, p.m - 1, p.d, p.h, p.mi, p.s) - Math.floor(ms / 1000) * 1000;
}

/** L'istante UTC in cui nel fuso `tz` è il giorno y-m-d alle h:mi (gestisce l'ora legale). */
export function zonedToUtc(tz: string, y: number, m: number, d: number, h: number, mi: number): number {
  const guess = Date.UTC(y, m - 1, d, h, mi);
  const off = offsetMs(tz, guess);
  let t = guess - off;
  const off2 = offsetMs(tz, t);
  if (off2 !== off) t = guess - off2;
  return t;
}

/** Il prossimo istante, dopo `now`, in cui nel fuso `tz` sono le `time` ("HH:MM"). */
export function nextFire(tz: string, time: string, now: number): number {
  const [h, mi] = time.split(':').map(Number);
  const p = partsIn(tz, now);
  let t = zonedToUtc(tz, p.y, p.m, p.d, h, mi);
  if (t <= now + 1000) {
    const dt = new Date(Date.UTC(p.y, p.m - 1, p.d + 1));
    t = zonedToUtc(tz, dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate(), h, mi);
  }
  return t;
}

export interface Progress {
  /** Ultimo giorno (nel fuso dell'utente) in cui le 3 task erano fatte. */
  doneDate?: string;
  streak?: number;
  lastFullDay?: string;
}

/** Il testo del promemoria, oppure null se oggi le task sono già fatte (niente notifica). */
export function reminderText(today: string, p: Progress): { title: string; body: string } | null {
  if (p.doneDate === today) return null;
  const streak = p.streak ?? 0;
  if (streak > 0 && p.lastFullDay === dayBefore(today)) {
    return {
      title: `Streak di ${streak} ${streak === 1 ? 'giorno' : 'giorni'}`,
      body: 'Non spezzarla: le 3 task di oggi ti aspettano, dieci minuti e hai finito.'
    };
  }
  return { title: 'Le tue 3 task di oggi', body: 'Dieci minuti di Python ti aspettano. Una spira al giorno.' };
}
