import { useRef, useState } from 'react';
import { PageScreen } from '../components/PageScreen';
import { useStore } from '../store';
import { exportState, clearToday } from '../engine/storage';
import { normalize } from '../engine/state';
import { PYODIDE_VERSION } from '../py/version';
import { SpaceUsage } from '../components/SpaceUsage';

export function Settings({ onClose }: { onClose: () => void }) {
  const { state, update, reloadToday, showToast, index } = useStore();
  const file = useRef<HTMLInputElement>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const doExport = () => {
    const url = URL.createObjectURL(new Blob([exportState(state)], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `pycoil-progressi-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const doImport = async (f: File) => {
    try {
      const s = normalize(JSON.parse(await f.text()));
      update(() => s);
      reloadToday();
      showToast('Progressi importati');
      onClose();
    } catch {
      showToast('File non valido');
    }
  };

  return (
    <PageScreen title="Impostazioni" backLabel="Statistiche" onClose={onClose}>
      <div className="group">
        <button className="row" onClick={() => { update((s) => ({ ...s, level: null })); void clearToday(); onClose(); }}>
          <span className="grow"><span className="t">Rifai il test di livello</span><span className="st">Livello attuale: {state.level}</span></span>
        </button>
        <button className="row" onClick={doExport}>
          <span className="grow"><span className="t">Esporta i progressi</span><span className="st">File JSON con solo ID e contatori</span></span>
        </button>
        <button className="row" onClick={() => file.current?.click()}>
          <span className="grow"><span className="t">Importa i progressi</span><span className="st">Da un export precedente</span></span>
        </button>
        <input ref={file} type="file" accept="application/json" hidden onChange={(e) => e.target.files?.[0] && doImport(e.target.files[0])} />
        <button className="row" onClick={() => { reloadToday(); showToast('Task di oggi riscaricate'); }}>
          <span className="grow"><span className="t">Riscarica le task di oggi</span><span className="st">Se qualcosa non si è caricato</span></span>
        </button>
      </div>
      <SpaceUsage />
      <div className="group">
        {!confirmReset ? (
          <button className="row" onClick={() => setConfirmReset(true)}>
            <span className="grow"><span className="t" style={{ color: 'var(--red)' }}>Azzera tutti i progressi</span></span>
          </button>
        ) : (
          <button className="row" onClick={() => { update(() => normalize({})); void clearToday(); onClose(); }}>
            <span className="grow"><span className="t" style={{ color: 'var(--red)' }}>Conferma: cancella tutto</span><span className="st">Non si può annullare. Esporta prima, se vuoi.</span></span>
          </button>
        )}
      </div>
      <p style={{ fontSize: 13, color: 'var(--text2)', margin: '0 4px', lineHeight: 1.5 }}>
        Sul dispositivo restano solo i contatori, i preferiti e le task di oggi: libro, documentazione e soluzioni stanno su GitHub.
        Python {index?.python ?? '3.14'} nel browser con Pyodide {PYODIDE_VERSION}. Le novità di Python 3.15 sono segnate «Desktop».
      </p>
    </PageScreen>
  );
}
