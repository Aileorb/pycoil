// PyCoil – Worker Cloudflare: serve l'app (cartella dist) e manda il promemoria giornaliero (Web Push).
// Ogni dispositivo ha un id casuale (u) e un proprio Durable Object «Promemoria», che:
//  - genera e conserva la sua coppia di chiavi VAPID (nessun segreto nel repository pubblico);
//  - salva l'abbonamento push, l'orario scelto e il fuso orario;
//  - tiene un allarme al prossimo orario e, se quel giorno le 3 task non sono ancora fatte, manda la notifica
//    cifrata (RFC 8291, aes128gcm); poi riprogramma l'allarme al giorno dopo.
// Stessa impostazione del Worker di Di&T.
import { DurableObject } from 'cloudflare:workers';
import { dayIn, nextFire, reminderText, validTime, validTz } from './schedule';

const PUSH_HOSTS = /(^|\.)(push\.apple\.com|fcm\.googleapis\.com|push\.services\.mozilla\.com|notify\.windows\.com|push\.api\.chromium\.org)$/;
const enc = new TextEncoder();
const json = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });

const b64u = (buf) => { let s = ''; new Uint8Array(buf).forEach((b) => { s += String.fromCharCode(b); }); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
const unb64u = (str) => { const s = atob(str.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((str.length + 3) % 4)); return Uint8Array.from(s, (c) => c.charCodeAt(0)); };
const cat = (...a) => { const out = new Uint8Array(a.reduce((n, x) => n + x.length, 0)); let o = 0; a.forEach((x) => { out.set(x, o); o += x.length; }); return out; };

async function hkdf(salt, ikm, info, len) {
  const k = await crypto.subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits']);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt, info }, k, len * 8));
}

// Cifra il contenuto per un abbonamento (p256dh + auth): Web Push Message Encryption, un solo record.
export async function encryptPayload(sub, payload) {
  const uaPub = unb64u(sub.keys.p256dh), auth = unb64u(sub.keys.auth);
  const eph = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
  const asPub = new Uint8Array(await crypto.subtle.exportKey('raw', eph.publicKey));
  const uaKey = await crypto.subtle.importKey('raw', uaPub, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
  const ecdh = new Uint8Array(await crypto.subtle.deriveBits({ name: 'ECDH', public: uaKey }, eph.privateKey, 256));
  const ikm = await hkdf(auth, ecdh, cat(enc.encode('WebPush: info\0'), uaPub, asPub), 32);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const cek = await hkdf(salt, ikm, enc.encode('Content-Encoding: aes128gcm\0'), 16);
  const nonce = await hkdf(salt, ikm, enc.encode('Content-Encoding: nonce\0'), 12);
  const key = await crypto.subtle.importKey('raw', cek, 'AES-GCM', false, ['encrypt']);
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, key, cat(enc.encode(payload), new Uint8Array([2]))));
  const head = new Uint8Array(21); head.set(salt); new DataView(head.buffer).setUint32(16, 4096); head[20] = 65;
  return cat(head, asPub, ct);
}

async function vapidAuth(endpoint, keys, sub) {
  const aud = new URL(endpoint).origin;
  const h = b64u(enc.encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })));
  const c = b64u(enc.encode(JSON.stringify({ aud, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub })));
  const priv = await crypto.subtle.importKey('jwk', keys.priv, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, priv, enc.encode(h + '.' + c));
  return `vapid t=${h}.${c}.${b64u(sig)}, k=${keys.pub}`;
}

export class Promemoria extends DurableObject {
  async keys() {
    let k = await this.ctx.storage.get('vapid');
    if (!k) {
      const p = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
      k = { pub: b64u(await crypto.subtle.exportKey('raw', p.publicKey)), priv: await crypto.subtle.exportKey('jwk', p.privateKey) };
      await this.ctx.storage.put('vapid', k);
    }
    return k;
  }

  async vapid() { return (await this.keys()).pub; }

  async subscribe(sub, site) {
    if (!sub || typeof sub.endpoint !== 'string' || !sub.keys || !sub.keys.p256dh || !sub.keys.auth) return { ok: false, err: 'abbonamento non valido' };
    const u = new URL(sub.endpoint);
    if (u.protocol !== 'https:' || !PUSH_HOSTS.test(u.hostname)) return { ok: false, err: 'servizio push sconosciuto' };
    await this.ctx.storage.put('sub', { endpoint: sub.endpoint, keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth } });
    await this.ctx.storage.put('site', site);
    await this.reschedule();
    return { ok: true };
  }

  /** Orario ("HH:MM"), fuso IANA e attivazione del promemoria. */
  async configure(b) {
    const time = validTime(b.time);
    if (!time) return { ok: false, err: 'orario non valido' };
    const settings = { time, tz: validTz(b.tz), enabled: b.enabled !== false };
    await this.ctx.storage.put('settings', settings);
    const at = await this.reschedule();
    return { ok: true, next: at };
  }

  /** L'app comunica la giornata: oggi fatte o no, streak e ultimo giorno completo. */
  async sync(b) {
    const p = (await this.ctx.storage.get('progress')) || {};
    const day = /^\d{4}-\d{2}-\d{2}$/.test(b.today || '') ? b.today : null;
    if (day && b.done) p.doneDate = day;
    if (Number.isFinite(b.streak)) p.streak = Math.max(0, Math.min(100000, Math.floor(b.streak)));
    if (/^\d{4}-\d{2}-\d{2}$/.test(b.lastFullDay || '')) p.lastFullDay = b.lastFullDay;
    await this.ctx.storage.put('progress', p);
    return { ok: true };
  }

  async reschedule() {
    const [s, sub] = await Promise.all([this.ctx.storage.get('settings'), this.ctx.storage.get('sub')]);
    if (!s || !s.enabled || !sub) { await this.ctx.storage.deleteAlarm(); return null; }
    const at = nextFire(s.tz, s.time, Date.now());
    await this.ctx.storage.setAlarm(at);
    return at;
  }

  async status() {
    const [sub, settings, alarm, last] = await Promise.all([this.ctx.storage.get('sub'), this.ctx.storage.get('settings'), this.ctx.storage.getAlarm(), this.ctx.storage.get('last')]);
    return { sub: !!sub, settings: settings || null, next: alarm || null, last: last || null };
  }

  async unsubscribe() {
    await this.ctx.storage.delete('sub');
    await this.ctx.storage.deleteAlarm();
    return { ok: true };
  }

  async test() {
    return this.send({ title: 'Promemoria attivo', body: 'Ti scrivo così ogni giorno, all\'orario che hai scelto, se le 3 task non sono ancora fatte.', tag: 'pycoil-test' });
  }

  async alarm() {
    const s = await this.ctx.storage.get('settings');
    if (!s || !s.enabled) return;
    const progress = (await this.ctx.storage.get('progress')) || {};
    const msg = reminderText(dayIn(s.tz, Date.now()), progress);
    if (msg) await this.send({ ...msg, tag: 'pycoil-promemoria' });
    // il prossimo, domani alla stessa ora (anche se l'allarme è arrivato con qualche secondo di ritardo)
    const sub = await this.ctx.storage.get('sub');
    if (sub) await this.ctx.storage.setAlarm(nextFire(s.tz, s.time, Date.now() + 60_000));
  }

  async send(m) {
    const sub = await this.ctx.storage.get('sub');
    if (!sub) return { ok: false, err: 'nessun abbonamento' };
    const keys = await this.keys();
    const site = (await this.ctx.storage.get('site')) || 'https://github.com/Aileorb/pycoil';
    const body = await encryptPayload(sub, JSON.stringify({ title: m.title, body: m.body, tag: m.tag, url: './' }));
    let r;
    try {
      r = await fetch(sub.endpoint, {
        method: 'POST',
        body,
        headers: {
          'content-encoding': 'aes128gcm', 'content-type': 'application/octet-stream', ttl: String(6 * 3600), urgency: 'normal', topic: 'promemoria',
          authorization: await vapidAuth(sub.endpoint, keys, site)
        }
      });
    } catch (e) {
      await this.ctx.storage.put('last', { at: Date.now(), err: String(e).slice(0, 200) });
      return { ok: false, err: String(e) };
    }
    const err = r.ok ? undefined : (await r.text()).slice(0, 200);
    await this.ctx.storage.put('last', { at: Date.now(), status: r.status, err });
    if (r.status === 404 || r.status === 410) { // abbonamento scaduto: l'app lo rinnova alla prossima apertura
      await this.ctx.storage.delete('sub');
      await this.ctx.storage.deleteAlarm();
    }
    return { ok: r.ok, status: r.status, err };
  }
}

async function readBody(req) {
  try { const t = await req.text(); return t ? JSON.parse(t) : {}; } catch { return null; }
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (!url.pathname.startsWith('/api/')) return env.ASSETS.fetch(req);
    if (url.pathname === '/api/ping') return json({ ok: true, push: true });
    const u = url.searchParams.get('u') || '';
    if (!/^[A-Za-z0-9_-]{16,64}$/.test(u)) return json({ ok: false, err: 'id non valido' }, 400);
    const p = env.PROMEMORIA.get(env.PROMEMORIA.idFromName(u));
    const route = url.pathname.slice(5);
    if (req.method === 'GET' && route === 'vapid') return json({ ok: true, key: await p.vapid() });
    if (req.method === 'GET' && route === 'status') return json({ ok: true, ...(await p.status()) });
    if (req.method !== 'POST') return json({ ok: false, err: 'metodo' }, 405);
    const b = await readBody(req);
    if (!b) return json({ ok: false, err: 'json' }, 400);
    if (route === 'subscribe') return json(await p.subscribe(b.sub, url.origin + '/'));
    if (route === 'settings') return json(await p.configure(b));
    if (route === 'sync') return json(await p.sync(b));
    if (route === 'unsubscribe') return json(await p.unsubscribe());
    if (route === 'test') return json(await p.test());
    return json({ ok: false, err: 'sconosciuto' }, 404);
  }
};
