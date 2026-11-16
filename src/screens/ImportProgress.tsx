import { useEffect, useRef, useState } from 'react';
import { useStore } from '../store';
import { decodeState } from '../engine/transfer';
import { normalize } from '../engine/state';
import type { AppState } from '../engine/types';

/**
 * Importa i progressi da un link («…#importa=…»), da un codice incollato o da un file di export.
 * Serve soprattutto per passare dal vecchio indirizzo GitHub Pages a quello su Cloudflare.
 */
export function ImportProgress({ code, onClose }: { code?: string; onClose: () => void }) {
  const { state, update, reloadToday, showToast } = useStore();
  const [text, setText] = useState('');
  const [found, setFound] = useState<AppState | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const file = useRef<HTMLInputElement>(null);

  const read = async (input: string) => {
    setErr(null);
    const s = await decodeState(input);
    if (s) setFound(s);
    else setErr('Codice non valido: copialo di nuovo per intero.');
  };

  useEffect(() => {
    if (code) void read(code);
  }, [code]);

  const fromFile = async (f: File) => {
    try {
      setFound(normalize(JSON.parse(await f.text())));
      setErr(null);
    } catch {
      setErr('File non valido.');
    }
  };

  const confirm = () => {
    if (!found) return;
    update(() => found);
    reloadToday();
    showToast('Progressi importati');
    onClose();
  };

  const hasLocal = state.xp > 0 || state.sections.length > 0;
  return (
    <main className="screen" style={{ paddingTop: 40, gap: 16 }}>
      <h1 style={{ margin: 0, fontSize: 28 }}>Importa i progressi</h1>
      {found ? (
        <>
          <div className="group">
            <div className="row static"><span className="grow"><span className="t">Livello</span></span><span className="space-v">{found.level ?? '—'}</span></div>
            <div className="row static"><span className="grow"><span className="t">Punti</span></span><span className="space-v">{found.xp.toLocaleString('it-IT')} XP</span></div>
            <div className="row static"><span className="grow"><span className="t">Streak</span></span><span className="space-v">{found.streak.current} giorni (record {found.streak.best})</span></div>
            <div className="row static"><span className="grow"><span className="t">Sezioni lette</span></span><span className="space-v">{found.sections.length}</span></div>
          </div>
          {hasLocal && <p className="space-note">Sostituiscono i progressi che hai già su questo dispositivo.</p>}
          <button className="pill-btn" onClick={confirm}>Importa questi progressi</button>
          <button className="ghost-btn" onClick={onClose}>Annulla</button>
        </>
      ) : (
        <>
          <p style={{ margin: 0, fontSize: 16, color: 'var(--text2)', lineHeight: 1.4 }}>
            Incolla il codice dei progressi (o il link intero) che hai copiato dalla vecchia PyCoil, oppure scegli un file di export.
          </p>
          <textarea className="paste" value={text} onChange={(e) => setText(e.target.value)} placeholder="Incolla qui il codice" rows={4} aria-label="Codice dei progressi" />
          {err && <div className="feedback no">{err}</div>}
          <button className="pill-btn" disabled={!text.trim()} onClick={() => read(text)}>Continua</button>
          <button className="ghost-btn" onClick={() => file.current?.click()}>Scegli un file di export</button>
          <input ref={file} type="file" accept="application/json" hidden onChange={(e) => e.target.files?.[0] && fromFile(e.target.files[0])} />
          <button className="ghost-btn" onClick={onClose}>Annulla</button>
        </>
      )}
    </main>
  );
}
