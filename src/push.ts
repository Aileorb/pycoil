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
let vapidKey: Promise<string | null> | null = null;
/** La chiave pubblica del Durable Object di questo dispositivo (precaricata, così il tocco su «Attiva» non aspetta la rete). */
function serverKey(): Promise<string | null> {
  vapidKey ??= call<{ ok: boolean; key?: string }>('vapid').then((r) => r.key ?? null).catch(() => {
    vapidKey = null;
    return null;
  });
  return vapidKey;
}

const b64uOf = (buf: ArrayBuffer | null | undefined) => {
  if (!buf) return '';
  let t = '';
  new Uint8Array(buf).forEach((b) => (t += String.fromCharCode(b)));
  return btoa(t).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

/**
 * L'abbonamento di questo dispositivo, solo se è legato alla chiave del server: uno fatto con un'altra chiave
 * (per esempio dopo aver cancellato i dati del sito) verrebbe rifiutato dal servizio push, quindi si toglie.
 */
async function currentSubscription(reg: ServiceWorkerRegistration): Promise<PushSubscription | null> {
  const sub = await reg.pushManager.getSubscription();
  if (!sub) return null;
  const key = await serverKey();
  if (key && b64uOf(sub.options?.applicationServerKey) !== key) {
    await sub.unsubscribe().catch(() => undefined);
    return null;
  }
  return sub;
}

// Registrazione e chiave già pronte: così, al tocco su «Attiva», subscribe() parte subito,
// dentro il gesto dell'utente (come in Di&T). Safari altrimenti può rifiutare o non mostrare il permesso.
let readyReg: ServiceWorkerRegistration | null = null;
let readyKey: string | null = null;

/** Da chiamare all'apertura di Impostazioni, della domanda iniziale e del banner: scalda server, chiave e service worker. */
export function preparePush(): void {
  void hasServer().then(async (ok) => {
    if (!ok) return;
    readyKey = await serverKey();
    if ('serviceWorker' in navigator) readyReg = await registration();
  });
}
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
  if (isIOS() && !isStandalone()) return { ok: false, err: 'Su iPhone le notifiche funzionano solo con PyCoil aperta dall’icona sulla schermata Home.' };
  if (!('Notification' in window) || !('PushManager' in window)) return { ok: false, err: 'Questo browser non supporta le notifiche push.' };
  // Come Di&T: se registrazione e chiave sono pronte, subscribe() parte per primo, nel gesto dell'utente,
  // e chiede da sé il permesso. Altrimenti si chiede il permesso subito e si aspetta il resto.
  const early =
    readyReg && readyKey
      ? readyReg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(readyKey) }).catch((e: unknown) => e)
      : null;
  const permission = early || Notification.permission === 'granted' ? null : Notification.requestPermission();
  try {
    if (!(await hasServer())) return { ok: false, err: 'Le notifiche funzionano solo sull’indirizzo ufficiale dell’app.' };
    let sub: PushSubscription | null = null;
    if (early) {
      const r = await early;
      if (r instanceof PushSubscription) sub = r;
    }
    if (permission && (await permission) !== 'granted') return { ok: false, err: 'Permesso negato: puoi riattivarlo dalle impostazioni del sistema, alla voce PyCoil.' };
    if (Notification.permission === 'denied') return { ok: false, err: 'Permesso negato: puoi riattivarlo dalle impostazioni del sistema, alla voce PyCoil.' };
    const reg = await registration();
    if (!sub) sub = await currentSubscription(reg);
    if (!sub) {
      const key = await serverKey();
      if (!key) return { ok: false, err: 'Il server non risponde: riprova tra poco.' };
      sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(key) });
    }
    const s = await call('subscribe', { sub: sub.toJSON() });
    if (!s.ok) return { ok: false, err: s.err ?? 'Abbonamento rifiutato.' };
    const c = await call('settings', { time, tz: timeZone(), enabled: true });
    if (!c.ok) return { ok: false, err: c.err ?? 'Orario non salvato.' };
    void call('test', {}).catch(() => undefined); // come Di&T: subito una notifica di conferma
    return { ok: true };
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

/** Il server manda subito una notifica: restituisce l'esito del servizio push (Apple, Google, Mozilla…). */
export async function testPush(): Promise<{ ok: boolean; status?: number; err?: string }> {
  try {
    return await call<{ ok: boolean; status?: number; err?: string }>('test', {});
  } catch (e) {
    return { ok: false, err: e instanceof Error ? e.message : String(e) };
  }
}

/**
 * All'apertura: rinnova abbonamento e orario sul server (gli abbonamenti push possono scadere)
 * e comunica com'è andata la giornata, così il promemoria non arriva se hai già finito.
 */
export async function syncPush(time: string, day: { today: string; done: boolean; streak: number; lastFullDay: string | null }): Promise<void> {
  try {
    if (!(await hasServer())) return;
    // come pushInit di Di&T: si rinnova sul server solo l'abbonamento legato alla chiave giusta,
    // senza abbonarsi di nascosto (lo fa solo il tocco su «Attiva»)
    if (Notification.permission !== 'granted') return;
    const reg = await registration();
    const sub = await currentSubscription(reg);
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
