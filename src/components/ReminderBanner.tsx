import { useEffect, useState } from 'react';
import { useStore } from '../store';
import { enablePush, isSubscribed, preparePush, pushSupport } from '../push';

/**
 * In Oggi: hai scelto un orario ma su questo dispositivo le notifiche non sono ancora attive
 * (per esempio l'orario è stato salvato in Safari e ora l'app è aperta dalla schermata Home).
 * Il permesso va chiesto con un tocco, quindi serve un pulsante.
 */
export function ReminderBanner() {
  const { state, showToast } = useStore();
  const r = state.reminder;
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!r?.enabled) return;
    let alive = true;
    preparePush();
    Promise.all([pushSupport(), isSubscribed()]).then(([support, sub]) => alive && setShow(support === 'ok' && !sub));
    return () => {
      alive = false;
    };
  }, [r?.enabled]);

  if (!r?.enabled || !show) return null;
  const activate = async () => {
    setBusy(true);
    const res = await enablePush(r.time);
    setBusy(false);
    if (res.ok) {
      setShow(false);
      showToast(`Promemoria ogni giorno alle ${r.time}`);
    } else showToast(res.err);
  };
  return (
    <div className="card reminder-banner">
      <span className="grow" style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
        <span style={{ fontSize: 16, fontWeight: 600 }}>Promemoria delle {r.time}</span>
        <span style={{ fontSize: 13, color: 'var(--text2)' }}>Attiva le notifiche su questo dispositivo</span>
      </span>
      <button className="pill-btn" style={{ width: 'auto', height: 36, padding: '0 16px', fontSize: 15 }} disabled={busy} onClick={activate}>{busy ? '…' : 'Attiva'}</button>
    </div>
  );
}
