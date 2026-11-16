// Promemoria giornaliero con Web Push: l'app si abbona e il Worker Cloudflare (worker/index.js) manda la notifica.
// Sul server restano solo: un id casuale del dispositivo, l'abbonamento push, orario e fuso,
// l'ultimo giorno con le 3 task fatte e la streak (per non scriverti quando hai già finito).

const API = `${import.meta.env.BASE_URL}api/`;
const UID_KEY = 'pycoil:push-u';

export type PushSupport =
  | 'ok' //            si può attivare qui
  | 'ios-browser' //   iPhone/iPad in Safari: serve l'app aperta dalla schermata Home
  | 'unsupported' //   browser senza Web Push
  | 'no-server' //     nessun /api (sviluppo locale o vecchio indirizzo GitHub Pages)
  | 'denied'; //       permesso negato nelle impostazioni del sistema

export const DEFAULT_TIME = '18:30';

function uid(): string {
  let u = '';
  try {
    u = localStorage.getItem(UID_KEY) ?? '';
  } catch {
    /* niente */
  }
  if (!/^[A-Za-z0-9_-]{16,64}$/.test(u)) {
    const b = crypto.getRandomValues(new Uint8Array(18));
    u = btoa(String.fromCharCode(...b)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    try {
      localStorage.setItem(UID_KEY, u);
    } catch {
      /* resta in memoria per questa sessione */
    }
  }
  return u;
}

const timeZone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Rome';
  } catch {
    return 'Europe/Rome';
  }
};

async function call<T = { ok: boolean; err?: string }>(route: string, body?: unknown): Promise<T> {
  const r = await fetch(`${API}${route}?u=${uid()}`, body === undefined
    ? { cache: 'no-store' }
    : { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  if (!r.ok && r.status !== 400) throw new Error(`HTTP ${r.status}`);
  return r.json() as Promise<T>;
}

const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const isStandalone = () =>
  (navigator as Navigator & { standalone?: boolean }).standalone === true || window.matchMedia('(display-mode: standalone)').matches;

let serverOk: Promise<boolean> | null = null;
function hasServer(): Promise<boolean> {
  serverOk ??= fetch(`${API}ping`, { cache: 'no-store' })
    .then((r) => (r.ok ? r.json() : null))
    .then((j) => !!j?.push)
    .catch(() => false);
  return serverOk;
}

export async function pushSupport(): Promise<PushSupport> {
  const capable = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  if (isIOS() && !isStandalone()) return 'ios-browser';
  if (!capable) return 'unsupported';
  if (!(await hasServer())) return 'no-server';
  if (Notification.permission === 'denied') return 'denied';
  return 'ok';
}

async function registration(): Promise<ServiceWorkerRegistration> {
  return navigator.serviceWorker.ready;
}

/** C'è un abbonamento push attivo su questo dispositivo? */
export async function isSubscribed(): Promise<boolean> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false;
  try {
    const reg = await Promise.race([registration(), new Promise<null>((r) => setTimeout(() => r(null), 3000))]);
    return !!(reg && (await reg.pushManager.getSubscription()));
  } catch {
    return false;
  }
}

function keyBytes(b64u: string): Uint8Array<ArrayBuffer> {
  const s = atob(b64u.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((b64u.length + 3) % 4));
  return Uint8Array.from(s, (c) => c.charCodeAt(0));
}

/**
 * Chiede il permesso (va chiamata da un tocco dell'utente), si abbona e imposta l'orario.
 * Restituisce un messaggio d'errore leggibile se qualcosa non va.
 */
export async function enablePush(time: string): Promise<{ ok: true } | { ok: false; err: string }> {
  const support = await pushSupport();
  if (support === 'ios-browser') return { ok: false, err: 'Su iPhone le notifiche funzionano solo con PyCoil aperta dall’icona sulla schermata Home.' };
  if (support === 'unsupported') return { ok: false, err: 'Questo browser non supporta le notifiche push.' };
  if (support === 'no-server') return { ok: false, err: 'Le notifiche funzionano solo sull’indirizzo ufficiale dell’app.' };
  try {
    const perm = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
    if (perm !== 'granted') return { ok: false, err: 'Permesso negato: puoi riattivarlo dalle impostazioni del sistema, alla voce PyCoil.' };
    const reg = await registration();
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      const { key } = await call<{ ok: boolean; key: string }>('vapid');
      sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(key) });
    }
    const s = await call('subscribe', { sub: sub.toJSON() });
    if (!s.ok) return { ok: false, err: s.err ?? 'Abbonamento rifiutato.' };
    const c = await call('settings', { time, tz: timeZone(), enabled: true });
    return c.ok ? { ok: true } : { ok: false, err: c.err ?? 'Orario non salvato.' };
  } catch (e) {
    return { ok: false, err: `Non riesco ad attivarle: ${e instanceof Error ? e.message : String(e)}` };
  }
}

/** Cambia l'orario (se le notifiche sono attive su questo dispositivo). */
export async function setPushTime(time: string): Promise<boolean> {
  if (!(await isSubscribed())) return false;
  try {
    return (await call('settings', { time, tz: timeZone(), enabled: true })).ok;
  } catch {
    return false;
  }
}

export async function disablePush(): Promise<void> {
  try {
    const reg = await registration();
    const sub = await reg.pushManager.getSubscription();
    await sub?.unsubscribe();
  } catch {
    /* già senza abbonamento */
  }
  try {
    await call('unsubscribe', {});
  } catch {
    /* offline: il server lo scoprirà al primo invio fallito */
  }
}

export async function testPush(): Promise<boolean> {
  try {
    return (await call('test', {})).ok;
  } catch {
    return false;
  }
}

/**
 * All'apertura: rinnova abbonamento e orario sul server (gli abbonamenti push possono scadere)
 * e comunica com'è andata la giornata, così il promemoria non arriva se hai già finito.
 */
export async function syncPush(time: string, day: { today: string; done: boolean; streak: number; lastFullDay: string | null }): Promise<void> {
  try {
    if (!(await hasServer())) return;
    const reg = await registration();
    let sub = await reg.pushManager.getSubscription();
    if (!sub && Notification.permission === 'granted') {
      const { key } = await call<{ ok: boolean; key: string }>('vapid');
      sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(key) }).catch(() => null);
    }
    if (!sub) return;
    await call('subscribe', { sub: sub.toJSON() });
    await call('settings', { time, tz: timeZone(), enabled: true });
    await call('sync', day);
  } catch {
    /* offline: riprova alla prossima apertura */
  }
}

/** Solo lo stato della giornata (quando completi le 3 task). */
export async function syncDay(day: { today: string; done: boolean; streak: number; lastFullDay: string | null }): Promise<void> {
  try {
    if (!(await isSubscribed()) || !(await hasServer())) return;
    await call('sync', day);
  } catch {
    /* niente */
  }
}
