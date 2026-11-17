import { useEffect, useState } from 'react';
import { useStore } from '../store';
import type { AppState } from '../engine/types';
import {
  accedi,
  aggiungiPasskey,
  contoDisponibile,
  creaConto,
  eliminaConto,
  esci,
  haProgressi,
  infoConto,
  passkeySupportate,
  preparaAggiunta,
  preparaPasskey,
  scaricaStato,
  type InfoConto
} from '../conto';

const ora = (t: number) => new Date(t).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
const data = (t: number) => new Date(t).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });

/** Impostazioni › Account: facoltativo, con passkey; sincronizza i progressi tra i dispositivi. */
export function AccountSettings() {
  const { state, conto, syncInfo, syncNow, entraNelConto, esciDalConto, showToast } = useStore();
  const [disponibile, setDisponibile] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [scelta, setScelta] = useState<AppState | null>(null);
  const [info, setInfo] = useState<InfoConto | null>(null);
  const [confermaElimina, setConfermaElimina] = useState(false);
  const supportate = passkeySupportate();

  useEffect(() => {
    contoDisponibile().then(setDisponibile);
  }, []);

  useEffect(() => {
    if (!disponibile || !supportate) return;
    if (conto) {
      preparaAggiunta();
      infoConto().then(setInfo).catch(() => undefined);
    } else preparaPasskey();
  }, [disponibile, supportate, conto, syncInfo.at]);

  if (disponibile === false) return null; // sviluppo locale o vecchio indirizzo: niente server degli account

  const crea = async () => {
    setErr(null);
    setBusy(true);
    const r = await creaConto();
    if (r.ok) {
      const ok = await entraNelConto(null, false);
      showToast(ok ? 'Account creato: progressi al sicuro' : 'Account creato: sincronizzo appena c’è rete');
    } else if (!r.annullato) setErr(r.err);
    setBusy(false);
  };

  const entra = async () => {
    setErr(null);
    setBusy(true);
    const r = await accedi();
    if (!r.ok) {
      if (!r.annullato) setErr(r.err);
      setBusy(false);
      return;
    }
    try {
      const { stato } = await scaricaStato();
      if (stato && haProgressi(stato) && haProgressi(state)) setScelta(stato);
      else {
        await entraNelConto(stato, !!stato && haProgressi(stato));
        showToast('Accesso fatto: progressi sincronizzati');
      }
    } catch (e) {
      setErr((e as Error).message);
    }
    setBusy(false);
  };

  const scegli = async (sostituisci: boolean) => {
    const remoto = scelta;
    setScelta(null);
    setBusy(true);
    await entraNelConto(remoto, sostituisci);
    setBusy(false);
    showToast(sostituisci ? 'Ora usi i progressi dell’account' : 'Progressi uniti');
  };

  const annullaScelta = async () => {
    setScelta(null);
    await esci();
    esciDalConto();
  };

  const aggiungi = async () => {
    setErr(null);
    setBusy(true);
    const r = await aggiungiPasskey();
    setBusy(false);
    if (r.ok) {
      showToast('Passkey aggiunta');
      infoConto().then(setInfo).catch(() => undefined);
    } else if (!r.annullato) setErr(r.err);
  };

  const fuori = async () => {
    setBusy(true);
    await esci();
    esciDalConto();
    setBusy(false);
    setInfo(null);
    showToast('Sei uscito: i progressi restano su questo dispositivo');
  };

  const elimina = async () => {
    setConfermaElimina(false);
    setBusy(true);
    const r = await eliminaConto();
    setBusy(false);
    if (r.ok) {
      esciDalConto();
      setInfo(null);
      showToast('Account eliminato');
    } else setErr(r.err);
  };

  return (
    <>
      <div className="section-label" style={{ justifyContent: 'flex-start' }}><span>Account e sincronizzazione</span></div>
      {!supportate ? (
        <p className="space-note">Questo browser non supporta le passkey: aggiorna il sistema o usa Safari, Chrome o Edge recenti.</p>
      ) : scelta ? (
        <>
          <p className="space-note" style={{ marginTop: 0 }}>Su questo dispositivo ci sono già dei progressi, e anche nell’account. Cosa vuoi fare?</p>
          <div className="group">
            <button className="row" onClick={() => scegli(false)} disabled={busy}>
              <span className="grow"><span className="t">Unisci i progressi</span><span className="st">Consigliato: tieni task, sezioni e punti di entrambi</span></span>
            </button>
            <button className="row" onClick={() => scegli(true)} disabled={busy}>
              <span className="grow"><span className="t">Usa solo quelli dell’account</span><span className="st">I progressi di questo dispositivo vengono sostituiti</span></span>
            </button>
            <button className="row" onClick={annullaScelta} disabled={busy}>
              <span className="grow"><span className="t" style={{ color: 'var(--text2)' }}>Annulla e non entrare</span></span>
            </button>
          </div>
        </>
      ) : !conto ? (
        <>
          <div className="group">
            <button className="row" onClick={crea} disabled={busy || disponibile === null}>
              <span className="grow">
                <span className="t" style={{ color: 'var(--blue)' }}>Crea un account con passkey</span>
                <span className="st">Ritrovi i progressi su iPhone, iPad e computer, senza password</span>
              </span>
            </button>
            <button className="row" onClick={entra} disabled={busy || disponibile === null}>
              <span className="grow">
                <span className="t">Accedi</span>
                <span className="st">Hai già creato l’account su un altro dispositivo</span>
              </span>
            </button>
          </div>
          <p className="space-note">
            Facoltativo: senza account i progressi restano solo qui. La passkey si apre con Face ID o Touch ID e si salva nel Portachiavi
            di iCloud, quindi c’è già su iPhone, iPad e Mac con lo stesso Apple ID. Su un PC Windows scegli «Accedi» e inquadra con
            l’iPhone il codice QR che compare.
          </p>
        </>
      ) : (
        <>
          <div className="group">
            <button className="row" onClick={() => syncNow().then((ok) => showToast(ok ? 'Progressi sincronizzati' : 'Sincronizzazione non riuscita'))} disabled={busy || syncInfo.busy}>
              <span className="grow">
                <span className="t">{syncInfo.busy ? 'Sincronizzazione…' : syncInfo.err ? 'Non sincronizzato' : 'Sincronizzato'}</span>
                <span className="st">
                  {syncInfo.err
                    ? `${syncInfo.err} Riprovo da solo.`
                    : syncInfo.at
                      ? `Ultimo aggiornamento alle ${ora(syncInfo.at)} · tocca per aggiornare`
                      : 'Tocca per aggiornare'}
                </span>
              </span>
            </button>
            <button className="row" onClick={aggiungi} disabled={busy}>
              <span className="grow">
                <span className="t">Aggiungi una passkey su questo dispositivo</span>
                <span className="st">
                  {info ? `${info.passkey.length === 1 ? '1 passkey' : `${info.passkey.length} passkey`}${info.creato ? ` · account del ${data(info.creato)}` : ''} · ` : ''}
                  utile su Windows o Android
                </span>
              </span>
            </button>
            <button className="row" onClick={fuori} disabled={busy}>
              <span className="grow"><span className="t">Esci</span><span className="st">I progressi restano su questo dispositivo</span></span>
            </button>
            {!confermaElimina ? (
              <button className="row" onClick={() => setConfermaElimina(true)} disabled={busy}>
                <span className="grow"><span className="t" style={{ color: 'var(--red)' }}>Elimina l’account</span></span>
              </button>
            ) : (
              <button className="row" onClick={elimina} disabled={busy}>
                <span className="grow">
                  <span className="t" style={{ color: 'var(--red)' }}>Conferma: elimina l’account</span>
                  <span className="st">Cancello passkey e progressi salvati online; su questo dispositivo restano. Togli poi la passkey dal Portachiavi.</span>
                </span>
              </button>
            )}
          </div>
        </>
      )}
      {err && <p className="space-note" style={{ color: 'var(--red)' }}>{err}</p>}
    </>
  );
}
