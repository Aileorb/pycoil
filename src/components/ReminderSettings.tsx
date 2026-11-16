import { useEffect, useState } from 'react';
import { useStore } from '../store';
import { DEFAULT_TIME, disablePush, enablePush, isSubscribed, pushSupport, setPushTime, testPush, type PushSupport } from '../push';

const NOTE: Record<PushSupport, string> = {
  ok: '',
  'ios-browser': 'Su iPhone le notifiche arrivano solo con PyCoil aperta dall’icona sulla schermata Home (Condividi → Aggiungi alla schermata Home).',
  unsupported: 'Questo browser non supporta le notifiche push.',
  'no-server': 'Le notifiche funzionano solo sull’indirizzo ufficiale dell’app.',
  denied: 'Le notifiche di PyCoil sono bloccate nelle impostazioni del sistema: sbloccale lì.'
};

/** Impostazioni › Promemoria: attivo o no, orario, notifica di prova. */
export function ReminderSettings() {
  const { state, update, showToast } = useStore();
  const r = state.reminder ?? { time: DEFAULT_TIME, enabled: false, asked: true };
  const [support, setSupport] = useState<PushSupport | null>(null);
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    pushSupport().then(setSupport);
    isSubscribed().then(setSubscribed);
  }, []);

  const save = (patch: Partial<typeof r>) => update((s) => ({ ...s, reminder: { ...r, asked: true, ...patch } }));
  const on = r.enabled && (subscribed || support !== 'ok');

  const toggle = async () => {
    setErr(null);
    if (on) {
      setBusy(true);
      await disablePush();
      setBusy(false);
      setSubscribed(false);
      save({ enabled: false });
      showToast('Promemoria disattivato');
      return;
    }
    if (support !== 'ok') {
      save({ enabled: true }); // lo attivi poi dove le notifiche funzionano
      return;
    }
    setBusy(true);
    const res = await enablePush(r.time);
    setBusy(false);
    if (res.ok) {
      setSubscribed(true);
      save({ enabled: true });
      showToast(`Promemoria ogni giorno alle ${r.time}`);
    } else setErr(res.err);
  };

  const changeTime = async (time: string) => {
    if (!time) return;
    save({ time });
    if (r.enabled && subscribed) {
      const ok = await setPushTime(time);
      showToast(ok ? `Promemoria spostato alle ${time}` : 'Orario salvato: lo invio al server appena c’è connessione');
    }
  };

  const test = async () => {
    setBusy(true);
    const ok = await testPush();
    setBusy(false);
    showToast(ok ? 'Notifica di prova inviata' : 'Invio non riuscito: riprova tra poco');
  };

  return (
    <>
      <div className="section-label" style={{ justifyContent: 'flex-start' }}><span>Promemoria</span></div>
      <div className="group">
        <button className="row" role="switch" aria-checked={on} onClick={toggle} disabled={busy || support === null}>
          <span className="grow">
            <span className="t">Promemoria giornaliero</span>
            <span className="st">{on ? (subscribed ? `Ogni giorno alle ${r.time}, se le 3 task non sono fatte` : `Alle ${r.time}: da attivare dove le notifiche funzionano`) : 'Spento'}</span>
          </span>
          <span className="switch" aria-checked={on} aria-hidden="true" />
        </button>
        <label className="row">
          <span className="grow"><span className="t">Orario</span></span>
          <input className="time-input" type="time" value={r.time} onChange={(e) => changeTime(e.target.value)} aria-label="Orario del promemoria" />
        </label>
        {on && subscribed && (
          <button className="row" onClick={test} disabled={busy}>
            <span className="grow"><span className="t" style={{ color: 'var(--blue)' }}>Invia una notifica di prova</span></span>
          </button>
        )}
      </div>
      {(err || (support && support !== 'ok' && r.enabled)) && <p className="space-note">{err ?? NOTE[support!]}</p>}
    </>
  );
}
