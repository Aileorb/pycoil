import { useEffect, useRef, useState } from 'react';
import type { AdvancedTask, ImparaTask, PrevediTask, ScriviTask, Task } from '../engine/types';
import { Sheet } from './Sheet';
import { RichHtml } from './RichHtml';
import { CodeEditor } from './CodeEditor';
import { runPython, isPythonBooted, type RunResult } from '../py/runner';
import { useStore } from '../store';
import { Check } from './icons';
import { MAX_ATTEMPTS } from '../engine/state';

export function TaskSheet({ task, done, onClose }: { task: Task; done: boolean; onClose: () => void }) {
  const title = { impara: 'Impara', prevedi: 'Prevedi', scrivi: 'Scrivi', kata: 'Avanzata · kata', step: `Passo ${(task as AdvancedTask).step ?? ''}` }[task.type];
  return (
    <Sheet title={title} onClose={onClose} full>
      <h3 style={{ margin: '4px 0 0', fontSize: 22 }}>{task.title}</h3>
      {task.type === 'impara' && <Impara task={task} done={done} onClose={onClose} />}
      {task.type === 'prevedi' && <Prevedi task={task} done={done} />}
      {task.type === 'scrivi' && <Scrivi task={task} done={done} />}
      {(task.type === 'kata' || task.type === 'step') && <Advanced task={task as AdvancedTask} done={done} />}
    </Sheet>
  );
}

function DoneBanner({ text = 'Completata' }: { text?: string }) {
  return (
    <div className="done-pill"><Check size={18} />{text}</div>
  );
}

function Impara({ task, done, onClose }: { task: ImparaTask; done: boolean; onClose: () => void }) {
  const { finishTask } = useStore();
  const end = useRef<HTMLDivElement>(null);
  const [reachedEnd, setReachedEnd] = useState(done);
  useEffect(() => {
    if (!end.current || done) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setReachedEnd(true), { threshold: 1 });
    io.observe(end.current);
    return () => io.disconnect();
  }, [done]);
  return (
    <>
      <RichHtml html={task.html} />
      <div ref={end} />
      {done ? (
        <DoneBanner />
      ) : (
        <button className="pill-btn" disabled={!reachedEnd} onClick={() => finishTask(task.id, { sectionLearned: task.section })}>
          {reachedEnd ? 'Ho capito, segna come fatta' : 'Leggi fino in fondo'}
        </button>
      )}
      <a className="ghost-btn" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }} href={`#/percorso/${task.section}`} onClick={onClose}>
        Apri la sezione completa nel Percorso
      </a>
    </>
  );
}

/** Pallini dei tentativi: pieni quelli già usati. */
function Attempts({ used, max }: { used: number; max: number }) {
  if (used === 0) return null;
  const left = max - used;
  return (
    <p className="attempts" aria-live="polite">
      <span aria-hidden="true">{Array.from({ length: max }, (_, i) => (i < used ? '●' : '○')).join(' ')}</span>
      {left > 0 ? ` Ti ${left === 1 ? 'resta 1 tentativo' : `restano ${left} tentativi`} prima della soluzione.` : ' Tentativi esauriti: ecco la soluzione.'}
    </p>
  );
}

function Prevedi({ task, done }: { task: PrevediTask; done: boolean }) {
  const { finishTask, recordAttempt, todayRec } = useStore();
  const wrong = (todayRec?.attempts?.[task.id] ?? []).filter((i) => i >= 0);
  // con meno di 4 opzioni la soluzione arriva quando ne resta una sola
  const max = Math.min(MAX_ATTEMPTS, task.options.length - 1);
  const [right, setRight] = useState(done && wrong.length < max);
  const failed = wrong.length >= max;
  const revealed = right || failed || done;
  const choose = (i: number) => {
    if (revealed || wrong.includes(i)) return;
    if (i === task.answer) {
      setRight(true);
      finishTask(task.id, { firstTry: wrong.length === 0 });
    } else {
      recordAttempt(task.id, i);
      if ('vibrate' in navigator) navigator.vibrate?.([20, 40, 20]);
      if (wrong.length + 1 >= max) finishTask(task.id, { firstTry: false });
    }
  };
  return (
    <>
      <p style={{ margin: 0, color: 'var(--text2)' }}>Cosa stampa questo codice?</p>
      <pre className="code" dangerouslySetInnerHTML={{ __html: task.codeHtml }} />
      <div className="options" role="radiogroup" aria-label="Risposte">
        {task.options.map((o, i) => (
          <button
            key={i}
            role="radio"
            aria-checked={wrong.includes(i) || (revealed && i === task.answer)}
            aria-disabled={revealed || wrong.includes(i)}
            className={`option ${revealed && i === task.answer ? 'ok' : ''} ${wrong.includes(i) ? 'no' : ''}`}
            onClick={() => choose(i)}
          >
            {o}
          </button>
        ))}
      </div>
      {!revealed && wrong.length > 0 && (
        <div className="feedback no"><strong>Non è questa. </strong>Rileggi il codice riga per riga e riprova.</div>
      )}
      <Attempts used={wrong.length} max={max} />
      {revealed && (
        <div className={`feedback ${right || (done && !failed) ? 'ok' : 'no'}`}>
          <strong>{right || (done && !failed) ? (wrong.length === 0 ? 'Esatto! ' : 'Giusto! ') : 'La risposta giusta è quella in verde. '}</strong>
          <span dangerouslySetInnerHTML={{ __html: task.explain }} />
        </div>
      )}
    </>
  );
}

/** Errori dell'ambiente (rete, Python non scaricato): non contano come tentativi sbagliati. */
function envError(r: RunResult): boolean {
  return !!r.error && /^(Python|Libreria) non disponibile/.test(r.error);
}

function ResultBox({ r }: { r: RunResult | null }) {
  if (!r) return null;
  return (
    <div className={`output ${r.ok ? '' : 'err'}`} style={{ background: 'var(--card)', borderRadius: 12, padding: 10, flex: 'none', maxHeight: 360, overflowY: 'auto' }} aria-live="polite">
      {r.out}
      {r.error && `${r.out ? '\n' : ''}${r.error}`}
      {r.images.map((src, i) => <img key={i} src={`data:image/png;base64,${src}`} alt="Grafico generato" />)}
    </div>
  );
}

function Scrivi({ task, done }: { task: ScriviTask; done: boolean }) {
  const { finishTask, recordAttempt, todayRec } = useStore();
  const failedRuns = (todayRec?.attempts?.[task.id] ?? []).length;
  const [code, setCode] = useState(task.starter);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<RunResult | null>(null);
  const [hints, setHints] = useState(0);
  const [solved, setSolved] = useState(done);
  const [firstTry, setFirstTry] = useState(false);
  const exhausted = failedRuns >= MAX_ATTEMPTS;

  const check = async () => {
    setBusy(true);
    const r = await runPython(code, task.tests);
    setBusy(false);
    setResult(r);
    if (r.ok && r.testsOk) {
      const ft = failedRuns === 0 && hints === 0;
      setSolved(true);
      setFirstTry(ft);
      finishTask(task.id, { firstTry: ft });
    } else if (!envError(r)) {
      recordAttempt(task.id);
    }
  };

  return (
    <>
      <RichHtml html={task.promptHtml} />
      <CodeEditor value={code} onChange={setCode} label="Il tuo codice" />
      {!solved && (
        <button className="pill-btn" onClick={check} disabled={busy}>
          {busy ? (isPythonBooted() ? 'Verifica…' : 'Avvio Python, qualche secondo…') : exhausted ? 'Riprova comunque' : 'Esegui e verifica'}
        </button>
      )}
      <ResultBox r={result} />
      {result && result.ok && result.testsOk === false && <div className="feedback no"><strong>Quasi. </strong>{result.testError}</div>}
      {solved && <DoneBanner text={firstTry ? 'Giusto al primo colpo!' : 'Completata'} />}
      {!solved && <Attempts used={Math.min(failedRuns, MAX_ATTEMPTS)} max={MAX_ATTEMPTS} />}
      {task.hints.slice(0, hints).map((h, i) => <div key={i} className="hint"><strong>Suggerimento {i + 1}. </strong><span dangerouslySetInnerHTML={{ __html: h }} /></div>)}
      {!solved && !exhausted && hints < task.hints.length && <button className="ghost-btn" onClick={() => setHints(hints + 1)}>Mostra un suggerimento</button>}
      {(solved || exhausted) && <Solution code={task.solution} open={exhausted && !solved} />}
      {exhausted && !solved && (
        <button className="ghost-btn" onClick={() => { setSolved(true); finishTask(task.id, { firstTry: false }); }}>
          Ho capito, segna come fatta
        </button>
      )}
    </>
  );
}

/** La soluzione: aperta di default dopo i tentativi esauriti, a richiesta dopo averla risolta. */
function Solution({ code, open }: { code: string; open: boolean }) {
  const [show, setShow] = useState(open);
  if (!show) return <button className="ghost-btn" onClick={() => setShow(true)}>Confronta con la soluzione</button>;
  return (
    <>
      <p style={{ margin: 0, fontWeight: 600 }}>Soluzione</p>
      <pre className="code">{code}</pre>
    </>
  );
}

/** Codice che verifica nell'app i test pytest di una task avanzata: scrive il modulo, esegue le funzioni test_*. */
function pytestHarness(task: AdvancedTask, code: string): { setup: string; tests: string } {
  const mod = task.module ?? 'soluzione.py';
  const name = mod.replace(/\.py$/, '');
  const setup = [
    'import sys as _s, os as _o, importlib as _il, pathlib as _pl',
    `_pl.Path(${JSON.stringify(mod)}).write_text(${JSON.stringify(code)})`,
    '_s.path.insert(0, _o.getcwd()) if _o.getcwd() not in _s.path else None',
    '_il.invalidate_caches()',
    `_s.modules.pop(${JSON.stringify(name)}, None)`,
    // ramo mai eseguito: serve solo a far caricare a Pyodide le librerie importate dal file
    'if False:',
    ...code.split('\n').map((l) => `    ${l}`),
    '    pass'
  ].join('\n');
  const runner = `
_falliti = []
for _n, _f in list(globals().items()):
    if _n.startswith("test_") and callable(_f):
        try:
            _f()
            print("✓", _n)
        except Exception as _e:
            _falliti.append(_n)
            print("✗", _n, "→", type(_e).__name__, _e)
assert not _falliti, f"Test non superati: {', '.join(_falliti)}"
`;
  return { setup, tests: `${task.testFile?.code ?? ''}\n${runner}` };
}

function Advanced({ task, done }: { task: AdvancedTask; done: boolean }) {
  const { finishAdvanced, recordAttempt, todayRec } = useStore();
  const failedRuns = (todayRec?.attempts?.[task.id] ?? []).length;
  const exhausted = failedRuns >= MAX_ATTEMPTS;
  const [hints, setHints] = useState(0);
  const [code, setCode] = useState('');
  const [result, setResult] = useState<RunResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [passed, setPassed] = useState(false);
  const canVerify = !!task.testFile && !!task.module;
  const markDone = () => finishAdvanced(task.id, task.project, task.project ? task.id.slice(task.project.length + 1) : undefined);

  const download = () => {
    if (!task.testFile) return;
    const url = URL.createObjectURL(new Blob([task.testFile.code], { type: 'text/x-python' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = task.testFile.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const verify = async () => {
    setBusy(true);
    const h = pytestHarness(task, code);
    const r = await runPython(canVerify ? h.setup : code, canVerify ? h.tests : undefined);
    setBusy(false);
    setResult(r);
    if (!canVerify) return;
    if (r.ok && r.testsOk) {
      setPassed(true);
      if (!done) markDone();
    } else if (!envError(r)) {
      recordAttempt(task.id);
    }
  };

  return (
    <>
      <div className="chip desk" style={{ alignSelf: 'flex-start' }}>Da fare al computer · {task.minutes} min</div>
      <RichHtml html={task.promptHtml} />
      {task.testFile && (
        <button className="ghost-btn" onClick={download}>Scarica il test {task.testFile.name}</button>
      )}
      {task.hints.slice(0, hints).map((h, i) => <div key={i} className="hint"><strong>Suggerimento {i + 1}. </strong><span dangerouslySetInnerHTML={{ __html: h }} /></div>)}
      {!done && !exhausted && hints < task.hints.length && <button className="ghost-btn" onClick={() => setHints(hints + 1)}>Mostra un suggerimento</button>}
      <details open={failedRuns > 0 || undefined}>
        <summary style={{ color: 'var(--blue)', fontSize: 17, padding: '8px 0', cursor: 'pointer' }}>
          {canVerify ? `Incolla tutto il file ${task.module} e verificalo qui` : 'Incolla il tuo codice e provalo qui'}
        </summary>
        <CodeEditor value={code} onChange={setCode} label="Il tuo codice" />
        <button className="pill-btn" style={{ marginTop: 8 }} disabled={busy || !code.trim()} onClick={verify}>
          {busy ? (isPythonBooted() ? 'Esecuzione dei test…' : 'Avvio Python, qualche secondo…') : canVerify ? 'Esegui i test' : 'Esegui'}
        </button>
        <ResultBox r={result} />
        {result && result.ok && result.testsOk === false && <div className="feedback no"><strong>Quasi. </strong>{result.testError}</div>}
      </details>
      {canVerify && !done && !passed && <Attempts used={Math.min(failedRuns, MAX_ATTEMPTS)} max={MAX_ATTEMPTS} />}
      {(done || passed || exhausted) && <Solution code={task.solution} open={exhausted && !done && !passed} />}
      {done || passed ? (
        <DoneBanner text={passed ? 'Test superati' : 'Completata'} />
      ) : (
        <button className="pill-btn" onClick={markDone}>
          {exhausted ? 'Ho capito, segna come fatta' : 'Test verdi al computer: segna come fatta'}
        </button>
      )}
    </>
  );
}
