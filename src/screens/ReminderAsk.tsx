import { useEffect, useState } from 'react';
import { useStore } from '../store';
import { DEFAULT_TIME, enablePush, pushSupport, type PushSupport } from '../push';

/** Alla prima apertura (dopo la scelta del livello): a che ora vuoi il promemoria? */
export function ReminderAsk() {
  const { state, update, showToast } = useStore();
  const [time, setTime] = useState(state.reminder?.time ?? DEFAULT_TIME);
  const [support, setSupport] = useState<PushSupport | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    pushSupport().then(setSupport);
  }, []);

  const save = (enabled: boolean) => update((s) => ({ ...s, reminder: { time, enabled, asked: true } }));

  const activate = async () => {
    setBusy(true);
    setErr(null);
    const r = await enablePush(time);
    setBusy(false);
    if (r.ok) {
      save(true);
      showToast(`Promemoria ogni giorno alle ${time}`);
    } else setErr(r.err);
  };

  const canPush = support === 'ok';
  return (
    <main className="screen" style={{ paddingTop: 40, gap: 18 }}>
      <div className="reminder-bell" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="40" height="40"><path d="M12 3a6 6 0 00-6 6v3.6L4.3 15.4A1 1 0 005.2 17h13.6a1 1 0 00.9-1.6L18 12.6V9a6 6 0 00-6-6zm-2.4 15.5a2.5 2.5 0 004.8 0z" fill="currentColor" /></svg>
      </div>
      <div>
        <h1 style={{ margin: 0, fontSize: 28, lineHeight: 1.15 }}>A che ora vuoi il promemoria?</h1>
        <p style={{ margin: '8px 0 0', fontSize: 16, color: 'var(--text2)', lineHeight: 1.4 }}>
          Ogni giorno a quest’ora ti ricordo le 3 task. Se le hai già fatte, nessuna notifica. Puoi cambiarlo quando vuoi nelle Impostazioni.
        </p>
      </div>
      <label className="time-card">
        <span>Orario</span>
        <input type="time" value={time} onChange={(e) => e.target.value && setTime(e.target.value)} aria-label="Orario del promemoria" />
      </label>

      {support === 'ios-browser' && (
        <div className="note-card">
          Su iPhone le notifiche arrivano solo se apri PyCoil dall’icona sulla schermata Home: <b>Condividi → Aggiungi alla schermata Home</b>. Intanto salvo l’orario e te le faccio attivare da lì.
        </div>
      )}
      {(support === 'unsupported' || support === 'no-server') && (
        <div className="note-card">Qui le notifiche non sono disponibili. Salvo comunque l’orario: si attivano quando apri l’app su un dispositivo che le supporta.</div>
      )}
      {support === 'denied' && (
        <div className="note-card">Le notifiche di PyCoil sono bloccate nelle impostazioni del sistema. Sbloccale lì e poi attivale dalle Impostazioni dell’app.</div>
      )}
      {err && <div className="feedback no">{err}</div>}

      {canPush ? (
        <button className="pill-btn" disabled={busy} onClick={activate}>{busy ? 'Attivo…' : 'Attiva le notifiche'}</button>
      ) : (
        <button className="pill-btn" disabled={support === null} onClick={() => { save(true); showToast(`Orario salvato: ${time}`); }}>Salva l’orario</button>
      )}
      <button className="ghost-btn" onClick={() => save(false)}>Non ora</button>
    </main>
  );
}
