import { useCallback, useEffect, useState } from 'react';
import { useStore } from '../store';
import {
  appShellSize, clearPythonCache, formatBytes, hasCacheApi, jsonSize, neededLibs, planCleanup, pythonFiles, removeFromPythonCache, LIB_LABEL
} from '../engine/space';

type Plan = ReturnType<typeof planCleanup>;
interface Misura {
  usage?: number;
  quota?: number;
  shell: number;
  progress: number;
  today: number;
  python: number;
  plan: Plan;
}

/** Impostazioni › Spazio usato: valori reali del dispositivo e pulizia delle librerie Python non più necessarie. */
export function SpaceUsage() {
  const { state, todayRec, index, getIndex, showToast } = useStore();
  const [m, setM] = useState<Misura | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmAll, setConfirmAll] = useState(false);

  const misura = useCallback(async () => {
    const idx = index ?? (await getIndex().catch(() => null));
    const [{ files, lock }, shell, est] = await Promise.all([
      pythonFiles(),
      appShellSize(),
      navigator.storage?.estimate?.().catch(() => undefined) ?? Promise.resolve(undefined)
    ]);
    const need = idx ? neededLibs(idx, state, todayRec ? [...todayRec.plan.required, ...todayRec.plan.advanced] : []) : new Set(Object.keys(LIB_LABEL));
    setM({
      usage: est?.usage,
      quota: est?.quota,
      shell,
      progress: jsonSize(state),
      today: jsonSize(todayRec),
      python: files.reduce((a, f) => a + f.size, 0),
      plan: planCleanup(files, lock, need)
    });
  }, [index, getIndex, state, todayRec]);

  useEffect(() => {
    void misura();
    // misura solo all'apertura: dopo una pulizia si rimisura a mano
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const libera = async () => {
    if (!m) return;
    setBusy(true);
    await removeFromPythonCache(m.plan.removable);
    showToast(`Liberati ${formatBytes(m.plan.removableSize)}`);
    await misura();
    setBusy(false);
  };
  const svuota = async () => {
    setBusy(true);
    await clearPythonCache();
    setConfirmAll(false);
    showToast('Cache di Python svuotata');
    await misura();
    setBusy(false);
  };

  if (!hasCacheApi()) {
    return <div className="group"><div className="empty">Questo browser non permette di misurare lo spazio usato.</div></div>;
  }
  if (!m) return <div className="group"><div className="empty">Misuro lo spazio usato…</div></div>;

  const righe = [
    { t: "L'app", st: 'Codice, grafica e icone per usarla anche offline', v: m.shell },
    { t: 'I tuoi progressi', st: 'Contatori, streak, sezioni lette, preferiti', v: m.progress },
    { t: 'Le task di oggi', st: 'Testi e soluzioni, cancellati domani', v: m.today },
    { t: 'Motore Python', st: m.python ? 'Pyodide e le librerie scaricate finora' : 'Si scarica la prima volta che esegui del codice', v: m.python }
  ];
  const libs = m.plan.rows.filter((r) => r.size > 0);

  return (
    <>
      <div className="section-label" style={{ justifyContent: 'flex-start' }}><span>Spazio usato</span></div>
      <div className="group space">
        {m.usage != null && (
          <div className="space-total">
            <span><b>{formatBytes(m.usage)}</b> usati da PyCoil{m.quota ? ` · ${formatBytes(m.quota)} disponibili` : ''}</span>
            {m.quota ? <div className="bar"><span style={{ width: `${Math.max(1, Math.min(100, (m.usage / m.quota) * 100))}%` }} /></div> : null}
          </div>
        )}
        {righe.map((r) => (
          <div key={r.t} className="row static">
            <span className="grow"><span className="t">{r.t}</span><span className="st">{r.st}</span></span>
            <span className="space-v">{formatBytes(r.v)}</span>
          </div>
        ))}
      </div>

      {m.python > 0 && (
        <>
          <div className="section-label" style={{ justifyContent: 'flex-start' }}><span>Librerie Python sul dispositivo</span></div>
          <div className="group space">
            <div className="row static">
              <span className="grow"><span className="t">Python di base</span><span className="st">Serve sempre</span></span>
              <span className="space-v">{formatBytes(m.plan.core)}</span>
            </div>
            {libs.map((r) => (
              <div key={r.lib} className="row static">
                <span className="grow">
                  <span className="t">{r.label}</span>
                  <span className="st"><span className={`chip ${r.needed ? 'ess' : 'spec'}`}>{r.needed ? 'Serve ancora' : 'Non serve più'}</span></span>
                </span>
                <span className="space-v">{formatBytes(r.size)}</span>
              </div>
            ))}
            <button className="pill-btn" style={{ margin: '10px 16px 4px' }} disabled={busy || m.plan.removableSize === 0} onClick={libera}>
              {busy ? 'Libero spazio…' : m.plan.removableSize ? `Libera ${formatBytes(m.plan.removableSize)}` : 'Niente da liberare'}
            </button>
            <p className="space-note">
              Toglie le librerie che non servono né alla Parte in cui sei arrivato né a quelle dopo, ai ripassi in calendario e al progetto in corso.
              Se più avanti un esercizio le usa di nuovo, si riscaricano da sole (serve la connessione).
            </p>
            {!confirmAll ? (
              <button className="row" onClick={() => setConfirmAll(true)} disabled={busy}>
                <span className="grow"><span className="t" style={{ color: 'var(--red)' }}>Svuota tutta la cache di Python</span></span>
              </button>
            ) : (
              <button className="row" onClick={svuota} disabled={busy}>
                <span className="grow"><span className="t" style={{ color: 'var(--red)' }}>Conferma: svuota {formatBytes(m.python)}</span><span className="st">Al prossimo «Esegui» Python si riscarica</span></span>
              </button>
            )}
          </div>
        </>
      )}
    </>
  );
}
