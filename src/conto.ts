// Account facoltativo con passkey: crea, accedi, esci, e i due scambi della sincronizzazione.
// Sul dispositivo restano solo il gettone di sessione (localStorage) e un id casuale del dispositivo.
// La libreria delle passkey si carica solo quando serve (non pesa sull'avvio dell'app).
import type { AppState } from './engine/types';
import type { PublicKeyCredentialCreationOptionsJSON, PublicKeyCredentialRequestOptionsJSON } from '@simplewebauthn/browser';

const API = `${import.meta.env.BASE_URL}api/conto/`;
const KEY = 'pycoil:conto';
const DEV_KEY = 'pycoil:dev';
const OPZIONI_MS = 4 * 60_000; // le sfide valgono 5 minuti sul server

export interface Sessione {
  uid: string;
  token: string;
}

function leggiLS(k: string): string | null {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
}
function scriviLS(k: string, v: string | null) {
  try {
    if (v === null) localStorage.removeItem(k);
    else localStorage.setItem(k, v);
  } catch {
    /* in memoria per questa sessione */
  }
}

const casuale = (n: number) => btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(n)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

/** Id casuale di questo dispositivo: separa i suoi punti da quelli degli altri. */
export function dispositivo(): string {
  let d = leggiLS(DEV_KEY) ?? '';
  if (!/^[A-Za-z0-9_-]{8,32}$/.test(d)) {
    d = casuale(9);
    scriviLS(DEV_KEY, d);
  }
  return d;
}

export function sessione(): Sessione | null {
  try {
    const s = JSON.parse(leggiLS(KEY) ?? 'null');
    return s && typeof s.token === 'string' && typeof s.uid === 'string' ? s : null;
  } catch {
    return null;
  }
}

function salvaSessione(token: string) {
  scriviLS(KEY, JSON.stringify({ uid: token.split('.')[0], token }));
}

export function dimenticaSessione() {
  scriviLS(KEY, null);
}

/** Nome leggibile del dispositivo, per riconoscere passkey e sessioni. */
export function nomeDispositivo(): string {
  const ua = navigator.userAgent;
  if (/iPhone/.test(ua)) return 'iPhone';
  if (/iPad/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) return 'iPad';
  if (/Android/.test(ua)) return 'Android';
  if (/Mac OS X/.test(ua)) return 'Mac';
  if (/Windows/.test(ua)) return 'Windows';
  return 'Computer';
}

export class ErroreConto extends Error {
  constructor(
    message: string,
    public status = 0
  ) {
    super(message);
  }
}

async function chiama<T>(route: string, body?: unknown, auth = false): Promise<T> {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers['content-type'] = 'application/json';
  if (auth) {
    const s = sessione();
    if (!s) throw new ErroreConto('accesso richiesto', 401);
    headers.authorization = `Bearer ${s.token}`;
  }
  let r: Response;
  try {
    r = await fetch(API + route, body === undefined ? { headers, cache: 'no-store' } : { method: 'POST', headers, body: JSON.stringify(body) });
  } catch {
    throw new ErroreConto('Sei offline o il server non risponde.');
  }
  let j: { ok?: boolean; err?: string } & T;
  try {
    j = await r.json();
  } catch {
    throw new ErroreConto(`Risposta non valida (HTTP ${r.status})`, r.status);
  }
  if (!r.ok || j.ok === false) throw new ErroreConto(j.err || `HTTP ${r.status}`, r.status);
  return j;
}

// ------------------------------------------------------------------ disponibilità

let server: Promise<boolean> | null = null;
/** L'indirizzo ha il server degli account (non c'è in sviluppo locale né sul vecchio indirizzo). */
export function contoDisponibile(): Promise<boolean> {
  server ??= fetch(`${import.meta.env.BASE_URL}api/ping`, { cache: 'no-store' })
    .then((r) => (r.ok ? r.json() : null))
    .then((j) => !!j?.conto)
    .catch(() => false);
  return server;
}

export const passkeySupportate = () => typeof window !== 'undefined' && 'PublicKeyCredential' in window && !!navigator.credentials;

// ------------------------------------------------------------------ passkey

type Lib = typeof import('@simplewebauthn/browser');
let lib: Promise<Lib> | null = null;
const libreria = () => (lib ??= import('@simplewebauthn/browser'));

interface Pronte<T> {
  at: number;
  p: Promise<T>;
}
let reg: Pronte<{ uid: string; opzioni: PublicKeyCredentialCreationOptionsJSON }> | null = null;
let acc: Pronte<{ opzioni: PublicKeyCredentialRequestOptionsJSON }> | null = null;

const fresca = <T,>(x: Pronte<T> | null) => !!x && Date.now() - x.at < OPZIONI_MS;

/**
 * Precarica libreria e sfide: su iPhone la richiesta della passkey deve partire subito dopo il tocco,
 * senza aspettare la rete. Da chiamare quando compare il pulsante.
 */
export function preparaPasskey(cosa: 'crea' | 'accedi' | 'entrambi' = 'entrambi') {
  if (!passkeySupportate()) return;
  void libreria().catch(() => (lib = null));
  if ((cosa === 'crea' || cosa === 'entrambi') && !fresca(reg)) {
    const p = chiama<{ uid: string; opzioni: PublicKeyCredentialCreationOptionsJSON }>('registra/opzioni', { nome: `PyCoil (${nomeDispositivo()})` });
    reg = { at: Date.now(), p };
    p.catch(() => (reg = null));
  }
  if ((cosa === 'accedi' || cosa === 'entrambi') && !fresca(acc)) {
    const p = chiama<{ opzioni: PublicKeyCredentialRequestOptionsJSON }>('accedi/opzioni', {});
    acc = { at: Date.now(), p };
    p.catch(() => (acc = null));
  }
}

function spiega(e: unknown): string {
  const n = (e as { name?: string })?.name;
  if (n === 'NotAllowedError' || n === 'AbortError') return 'Operazione annullata.';
  if (n === 'InvalidStateError') return 'Su questo dispositivo c’è già una passkey per questo account.';
  if (n === 'SecurityError') return 'Le passkey funzionano solo sull’indirizzo ufficiale dell’app.';
  if (e instanceof ErroreConto) return e.message;
  return (e as Error)?.message || 'Qualcosa è andato storto.';
}

export type Esito = { ok: true } | { ok: false; err: string; annullato?: boolean };

/** Crea un account nuovo con una passkey su questo dispositivo. */
export async function creaConto(): Promise<Esito> {
  try {
    if (!fresca(reg)) preparaPasskey('crea');
    const [{ startRegistration }, { uid, opzioni }] = await Promise.all([libreria(), reg!.p]);
    reg = null;
    const risposta = await startRegistration({ optionsJSON: opzioni });
    const r = await chiama<{ token: string }>('registra/verifica', { uid, risposta, dispositivo: nomeDispositivo() });
    salvaSessione(r.token);
    return { ok: true };
  } catch (e) {
    reg = null;
    return { ok: false, err: spiega(e), annullato: (e as { name?: string })?.name === 'NotAllowedError' };
  }
}

/** Accede con una passkey già creata (anche su un altro dispositivo, se sincronizzata o con il QR). */
export async function accedi(): Promise<Esito> {
  try {
    if (!fresca(acc)) preparaPasskey('accedi');
    const [{ startAuthentication }, { opzioni }] = await Promise.all([libreria(), acc!.p]);
    acc = null;
    const risposta = await startAuthentication({ optionsJSON: opzioni });
    const r = await chiama<{ token: string }>('accedi/verifica', { risposta, dispositivo: nomeDispositivo() });
    salvaSessione(r.token);
    return { ok: true };
  } catch (e) {
    acc = null;
    return { ok: false, err: spiega(e), annullato: (e as { name?: string })?.name === 'NotAllowedError' };
  }
}

let agg: Pronte<{ opzioni: PublicKeyCredentialCreationOptionsJSON }> | null = null;
export function preparaAggiunta() {
  if (!passkeySupportate() || !sessione() || fresca(agg)) return;
  void libreria().catch(() => (lib = null));
  const p = chiama<{ opzioni: PublicKeyCredentialCreationOptionsJSON }>('passkey/opzioni', { nome: `PyCoil (${nomeDispositivo()})` }, true);
  agg = { at: Date.now(), p };
  p.catch(() => (agg = null));
}

/** Aggiunge una passkey su questo dispositivo all'account in cui sei (es. un PC Windows). */
export async function aggiungiPasskey(): Promise<Esito> {
  try {
    if (!fresca(agg)) preparaAggiunta();
    const [{ startRegistration }, { opzioni }] = await Promise.all([libreria(), agg!.p]);
    agg = null;
    const risposta = await startRegistration({ optionsJSON: opzioni });
    await chiama('passkey/verifica', { risposta, dispositivo: nomeDispositivo() }, true);
    return { ok: true };
  } catch (e) {
    agg = null;
    return { ok: false, err: spiega(e), annullato: (e as { name?: string })?.name === 'NotAllowedError' };
  }
}

// ------------------------------------------------------------------ account e progressi

export interface InfoConto {
  creato: number | null;
  aggiornato: number | null;
  passkey: { etichetta: string; creata: number; usata: number | null }[];
  sessioni: number;
}

export const infoConto = () => chiama<InfoConto>('info', {}, true);

export async function esci(): Promise<void> {
  try {
    await chiama('esci', {}, true);
  } catch {
    /* la sessione si dimentica comunque */
  }
  dimenticaSessione();
}

export async function eliminaConto(): Promise<Esito> {
  try {
    await chiama('elimina', {}, true);
    dimenticaSessione();
    return { ok: true };
  } catch (e) {
    return { ok: false, err: spiega(e) };
  }
}

export const scaricaStato = () => chiama<{ stato: AppState | null; rev: number }>('stato', undefined, true);
export const inviaStato = (stato: AppState) => chiama<{ stato: AppState; rev: number }>('sincronizza', { stato }, true);

/** Ci sono progressi veri su questo dispositivo (da non perdere entrando in un account)? */
export function haProgressi(s: AppState): boolean {
  return s.xp > 0 || s.sections.length > 0 || Object.values(s.days).some((d) => d.done.length || d.adv.length);
}
