// Trasferire i progressi con un link o un codice da incollare (per esempio dal vecchio indirizzo GitHub Pages).
// Formato: "z" + base64url(deflate-raw(JSON)) se il browser comprime, altrimenti "j" + base64url(JSON).
import type { AppState } from './types';
import { normalize } from './state';

const b64u = (bytes: Uint8Array) => {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};
const unb64u = (str: string) => Uint8Array.from(atob(str.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((str.length + 3) % 4)), (c) => c.charCodeAt(0));

async function pipe(data: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const out = new Response(new Blob([data as BlobPart]).stream().pipeThrough(stream));
  return new Uint8Array(await out.arrayBuffer());
}

export async function encodeState(s: AppState): Promise<string> {
  const raw = new TextEncoder().encode(JSON.stringify(s));
  if (typeof CompressionStream !== 'undefined') return 'z' + b64u(await pipe(raw, new CompressionStream('deflate-raw')));
  return 'j' + b64u(raw);
}

/** Accetta il codice, oppure un link intero che contiene "#importa=…". Restituisce null se non è valido. */
export async function decodeState(input: string): Promise<AppState | null> {
  const m = /importa=([A-Za-z0-9_-]+)/.exec(input) ?? /^\s*([zj][A-Za-z0-9_-]{8,})\s*$/.exec(input);
  if (!m) return null;
  const code = m[1];
  try {
    let bytes: Uint8Array = unb64u(code.slice(1));
    if (code[0] === 'z') bytes = await pipe(bytes, new DecompressionStream('deflate-raw'));
    else if (code[0] !== 'j') return null;
    const obj = JSON.parse(new TextDecoder().decode(bytes));
    if (!obj || typeof obj !== 'object' || !('xp' in obj)) return null;
    return normalize(obj);
  } catch {
    return null;
  }
}
