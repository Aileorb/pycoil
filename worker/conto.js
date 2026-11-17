// Account facoltativo con passkey e sincronizzazione dei progressi tra dispositivi.
//  - Nessuna password: si accede con una passkey (Face ID, Touch ID, Windows Hello, PIN del telefono).
//  - Ogni account è un Durable Object «Conto» con: le chiavi pubbliche delle passkey, le sessioni
//    (solo l'impronta SHA-256 del gettone) e lo stato dei progressi (gli stessi ID e contatori del telefono).
//  - Le sfide delle passkey (valide 5 minuti, usabili una volta) stanno nel Durable Object «Sfide».
// Nessun segreto da configurare: le passkey si verificano con le chiavi pubbliche salvate alla registrazione.
import { DurableObject } from 'cloudflare:workers';
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse
} from '@simplewebauthn/server';
import { mergeStates, stripLocal } from '../src/engine/merge';
import { addDays } from '../src/engine/dates';

const SFIDA_MS = 5 * 60_000;
const SESSIONE_MS = 365 * 86_400_000;
const MAX_STATO = 600_000; // byte: lo stato vero è di pochi KB
const UID = /^[A-Za-z0-9_-]{22}$/;

const enc = new TextEncoder();
const b64u = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const fromB64u = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (s.length % 4)) % 4)), (c) => c.charCodeAt(0));
const casuale = (n) => b64u(crypto.getRandomValues(new Uint8Array(n)));
const impronta = async (s) => b64u(await crypto.subtle.digest('SHA-256', enc.encode(s)));
const oggiUtc = () => new Date().toISOString().slice(0, 10);

/** Le sfide in attesa: una per richiesta di accesso o registrazione. */
export class Sfide extends DurableObject {
  async crea(challenge, uid = null) {
    const ora = Date.now();
    const vecchie = await this.ctx.storage.list({ prefix: 's:' });
    const scadute = [...vecchie].filter(([, v]) => v.exp < ora).map(([k]) => k);
    if (scadute.length) await this.ctx.storage.delete(scadute.slice(0, 128));
    await this.ctx.storage.put('s:' + challenge, { exp: ora + SFIDA_MS, uid });
    return true;
  }

  /** Consuma la sfida: vale una volta sola. Restituisce l'uid legato (o null) se era valida, altrimenti false. */
  async consuma(challenge) {
    const k = 's:' + challenge;
    const v = await this.ctx.storage.get(k);
    if (!v) return false;
    await this.ctx.storage.delete(k);
    return v.exp >= Date.now() ? { uid: v.uid } : false;
  }
}

/** Un account: passkey, sessioni e progressi. */
export class Conto extends DurableObject {
  async passkey() {
    return (await this.ctx.storage.get('creds')) || [];
  }

  async nuovaSessione(etichetta) {
    const segreto = casuale(24);
    const sessioni = (await this.ctx.storage.get('sessioni')) || {};
    sessioni[await impronta(segreto)] = { creata: Date.now(), usata: Date.now(), etichetta: String(etichetta || '').slice(0, 60) };
    await this.ctx.storage.put('sessioni', sessioni);
    return segreto;
  }

  async controllaSessione(segreto) {
    const sessioni = (await this.ctx.storage.get('sessioni')) || {};
    const h = await impronta(segreto);
    const s = sessioni[h];
    if (!s || Date.now() - s.usata > SESSIONE_MS) return false;
    if (Date.now() - s.usata > 3_600_000) {
      s.usata = Date.now();
      await this.ctx.storage.put('sessioni', sessioni);
    }
    return true;
  }

  async esci(segreto) {
    const sessioni = (await this.ctx.storage.get('sessioni')) || {};
    delete sessioni[await impronta(segreto)];
    await this.ctx.storage.put('sessioni', sessioni);
    return { ok: true };
  }

  /** Salva una nuova passkey già verificata. `nuovoConto`: rifiuta se l'account ha già delle passkey. */
  async aggiungiPasskey(cred, nuovoConto, etichetta) {
    const creds = await this.passkey();
    if (nuovoConto && creds.length) return { ok: false, err: 'account già esistente' };
    if (creds.some((c) => c.id === cred.id)) return { ok: false, err: 'passkey già registrata' };
    creds.push({ ...cred, creata: Date.now(), etichetta: String(etichetta || '').slice(0, 60) });
    await this.ctx.storage.put('creds', creds);
    if (nuovoConto) await this.ctx.storage.put('creato', Date.now());
    return { ok: true, token: await this.nuovaSessione(etichetta) };
  }

  async aggiornaContatore(id, contatore) {
    const creds = await this.passkey();
    const c = creds.find((x) => x.id === id);
    if (c) {
      c.counter = contatore;
      c.usata = Date.now();
      await this.ctx.storage.put('creds', creds);
    }
  }

  async stato() {
    const [stato, rev, agg] = await Promise.all([this.ctx.storage.get('stato'), this.ctx.storage.get('rev'), this.ctx.storage.get('aggiornato')]);
    return { stato: stato || null, rev: rev || 0, aggiornato: agg || null };
  }

  /** Unisce lo stato inviato con quello salvato e restituisce il risultato (uguale per tutti i dispositivi). */
  async sincronizza(inviato) {
    const { stato, rev } = await this.stato();
    const oggi = oggiUtc();
    const unito = stripLocal(stato ? mergeStates(stato, inviato, addDays(oggi, 1)) : mergeStates(inviato, inviato, addDays(oggi, 1)));
    const nuovo = rev + 1;
    await this.ctx.storage.put({ stato: unito, rev: nuovo, aggiornato: Date.now() });
    return { ok: true, stato: unito, rev: nuovo };
  }

  async info() {
    const [creds, sessioni, creato, { rev, aggiornato }] = await Promise.all([this.passkey(), this.ctx.storage.get('sessioni'), this.ctx.storage.get('creato'), this.stato()]);
    return {
      ok: true,
      creato: creato || null,
      aggiornato,
      rev,
      passkey: creds.map((c) => ({ etichetta: c.etichetta || 'Passkey', creata: c.creata, usata: c.usata || null })),
      sessioni: Object.keys(sessioni || {}).length
    };
  }

  async elimina() {
    await this.ctx.storage.deleteAll();
    return { ok: true };
  }
}

// ------------------------------------------------------------------ richieste

const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });

async function leggi(req) {
  const t = await req.text();
  if (t.length > MAX_STATO) return null;
  try {
    return t ? JSON.parse(t) : {};
  } catch {
    return null;
  }
}

function sessioneDa(req) {
  const m = /^Bearer ([A-Za-z0-9_-]{22})\.([A-Za-z0-9_-]{32})$/.exec(req.headers.get('authorization') || '');
  return m ? { uid: m[1], segreto: m[2] } : null;
}

const sito = (url) => ({ rpID: url.hostname, origin: url.origin });
const sfide = (env) => env.SFIDE.get(env.SFIDE.idFromName('sfide'));
const conto = (env, uid) => env.CONTO.get(env.CONTO.idFromName(uid));

/** Gestisce /api/conto/…; restituisce null se il percorso non è suo. */
export async function gestisciConto(req, env, url) {
  if (!url.pathname.startsWith('/api/conto/')) return null;
  if (!env.CONTO || !env.SFIDE) return json({ ok: false, err: 'account non disponibili' }, 503);
  if (req.method !== 'POST' && req.method !== 'GET') return json({ ok: false, err: 'metodo' }, 405);
  const route = url.pathname.slice('/api/conto/'.length);
  const { rpID, origin } = sito(url);
  const b = req.method === 'POST' ? await leggi(req) : {};
  if (!b) return json({ ok: false, err: 'richiesta non valida' }, 400);

  try {
    // ---- registrazione di un nuovo account
    if (route === 'registra/opzioni') {
      const uid = casuale(16);
      const opzioni = await generateRegistrationOptions({
        rpName: 'PyCoil',
        rpID,
        userName: String(b.nome || 'PyCoil').slice(0, 40),
        userDisplayName: String(b.nome || 'PyCoil').slice(0, 40),
        userID: enc.encode(uid),
        attestationType: 'none',
        authenticatorSelection: { residentKey: 'required', userVerification: 'preferred' }
      });
      await sfide(env).crea(opzioni.challenge, uid);
      return json({ ok: true, uid, opzioni });
    }
    if (route === 'registra/verifica') {
      if (!UID.test(b.uid || '') || !b.risposta) return json({ ok: false, err: 'dati mancanti' }, 400);
      return json(await registraPasskey(env, b.uid, b.risposta, rpID, origin, true, b.dispositivo));
    }

    // ---- accesso con una passkey esistente
    if (route === 'accedi/opzioni') {
      const opzioni = await generateAuthenticationOptions({ rpID, userVerification: 'preferred' });
      await sfide(env).crea(opzioni.challenge);
      return json({ ok: true, opzioni });
    }
    if (route === 'accedi/verifica') {
      const r = b.risposta;
      const handle = r?.response?.userHandle;
      if (!handle) return json({ ok: false, err: 'passkey senza account' }, 400);
      let uid = '';
      try {
        uid = new TextDecoder().decode(fromB64u(handle));
      } catch {
        /* sotto */
      }
      if (!UID.test(uid)) return json({ ok: false, err: 'passkey non riconosciuta' }, 400);
      const c = conto(env, uid);
      const cred = (await c.passkey()).find((x) => x.id === r.id);
      if (!cred) return json({ ok: false, err: 'Questa passkey non corrisponde a nessun account (forse è stato eliminato).' }, 404);
      const v = await verifyAuthenticationResponse({
        response: r,
        expectedChallenge: async (ch) => !!(await sfide(env).consuma(ch)),
        expectedOrigin: origin,
        expectedRPID: rpID,
        credential: { id: cred.id, publicKey: fromB64u(cred.publicKey), counter: cred.counter, transports: cred.transports },
        requireUserVerification: false
      });
      if (!v.verified) return json({ ok: false, err: 'verifica non riuscita' }, 401);
      await c.aggiornaContatore(cred.id, v.authenticationInfo.newCounter);
      const segreto = await c.nuovaSessione(b.dispositivo);
      return json({ ok: true, token: `${uid}.${segreto}` });
    }

    // ---- da qui serve una sessione
    const s = sessioneDa(req);
    if (!s) return json({ ok: false, err: 'accesso richiesto' }, 401);
    const c = conto(env, s.uid);
    if (!(await c.controllaSessione(s.segreto))) return json({ ok: false, err: 'sessione scaduta' }, 401);

    if (route === 'stato' && req.method === 'GET') return json({ ok: true, ...(await c.stato()) });
    if (route === 'sincronizza') {
      if (!b.stato || typeof b.stato !== 'object') return json({ ok: false, err: 'stato mancante' }, 400);
      return json(await c.sincronizza(b.stato));
    }
    if (route === 'info') return json(await c.info());
    if (route === 'esci') return json(await c.esci(s.segreto));
    if (route === 'elimina') return json(await c.elimina());
    if (route === 'passkey/opzioni') {
      const esistenti = await c.passkey();
      const opzioni = await generateRegistrationOptions({
        rpName: 'PyCoil',
        rpID,
        userName: String(b.nome || 'PyCoil').slice(0, 40),
        userID: enc.encode(s.uid),
        attestationType: 'none',
        excludeCredentials: esistenti.map((x) => ({ id: x.id, transports: x.transports })),
        authenticatorSelection: { residentKey: 'required', userVerification: 'preferred' }
      });
      await sfide(env).crea(opzioni.challenge, s.uid);
      return json({ ok: true, opzioni });
    }
    if (route === 'passkey/verifica') {
      if (!b.risposta) return json({ ok: false, err: 'dati mancanti' }, 400);
      const r = await registraPasskey(env, s.uid, b.risposta, rpID, origin, false, b.dispositivo);
      return json(r.ok ? { ok: true } : r);
    }
    return json({ ok: false, err: 'sconosciuto' }, 404);
  } catch (e) {
    return json({ ok: false, err: String(e?.message || e).slice(0, 200) }, 400);
  }
}

async function registraPasskey(env, uid, risposta, rpID, origin, nuovoConto, etichetta) {
  let legato;
  const v = await verifyRegistrationResponse({
    response: risposta,
    expectedChallenge: async (ch) => {
      legato = await sfide(env).consuma(ch);
      return !!legato && legato.uid === uid;
    },
    expectedOrigin: origin,
    expectedRPID: rpID,
    requireUserVerification: false
  });
  if (!v.verified || !legato) return { ok: false, err: 'verifica non riuscita' };
  const { credential } = v.registrationInfo;
  const r = await conto(env, uid).aggiungiPasskey(
    { id: credential.id, publicKey: b64u(credential.publicKey), counter: credential.counter, transports: credential.transports || [] },
    nuovoConto,
    etichetta
  );
  return r.ok && r.token ? { ok: true, token: `${uid}.${r.token}` } : r;
}
