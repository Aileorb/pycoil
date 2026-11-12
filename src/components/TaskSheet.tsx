import { useEffect, useRef, useState } from 'react';
import type { AdvancedTask, ImparaTask, PrevediTask, ScriviTask, Task } from '../engine/types';
import { Sheet } from './Sheet';
import { RichHtml } from './RichHtml';
import { CodeEditor } from './CodeEditor';
import { runPython, isPythonBooted, type RunResult } from '../py/runner';
import { useStore } from '../store';
import { Check } from './icons';

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

function Prevedi({ task, done }: { task: PrevediTask; done: boolean }) {
  const { finishTask } = useStore();
  const [picked, setPicked] = useState<number | null>(done ? task.answer : null);
  const answered = picked !== null;
  const ok = picked === task.answer;
  const choose = (i: number) => {
    if (answered) return;
    setPicked(i);
    finishTask(task.id, { firstTry: i === task.answer });
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
            aria-checked={picked === i}
            className={`option ${answered && i === task.answer ? 'ok' : ''} ${answered && picked === i && !ok ? 'no' : ''}`}
            onClick={() => choose(i)}
          >
            {o}
          </button>
        ))}
      </div>
      {answered && (
        <div className={`feedback ${ok ? 'ok' : 'no'}`}>
          <strong>{ok ? 'Esatto! ' : 'Non proprio. '}</strong>
          <span dangerouslySetInnerHTML={{ __html: task.explain }} />
        </div>
      )}
    </>
  );
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
  const { finishTask } = useStore();
  const [code, setCode] = useState(task.starter);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<RunResult | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [hints, setHints] = useState(0);
  const [solved, setSolved] = useState(done);
  const [showSolution, setShowSolution] = useState(false);

  const check = async () => {
    setBusy(true);
    const r = await runPython(code, task.tests);
    setBusy(false);
    setResult(r);
    const n = attempts + 1;
    setAttempts(n);
    if (r.ok && r.testsOk) {
      setSolved(true);
      finishTask(task.id, { firstTry: n === 1 && hints === 0 });
    }
  };

  return (
    <>
      <RichHtml html={task.promptHtml} />
      <CodeEditor value={code} onChange={setCode} label="Il tuo codice" />
      <button className="pill-btn" onClick={check} disabled={busy}>
        {busy ? (isPythonBooted() ? 'Verifica…' : 'Avvio Python, qualche secondo…') : 'Esegui e verifica'}
      </button>
      <ResultBox r={result} />
      {result && result.ok && result.testsOk === false && <div className="feedback no"><strong>Quasi. </strong>{result.testError}</div>}
      {solved && <DoneBanner text={attempts <= 1 && hints === 0 ? 'Giusto al primo colpo!' : 'Completata'} />}
      {task.hints.slice(0, hints).map((h, i) => <div key={i} className="hint"><strong>Suggerimento {i + 1}. </strong><span dangerouslySetInnerHTML={{ __html: h }} /></div>)}
      {!solved && hints < task.hints.length && <button className="ghost-btn" onClick={() => setHints(hints + 1)}>Mostra un suggerimento</button>}
      {(attempts >= 2 || solved) && !showSolution && <button className="ghost-btn" onClick={() => setShowSolution(true)}>Mostra la soluzione</button>}
      {showSolution && (
        <>
          <pre className="code">{task.solution}</pre>
          {!solved && (
            <button className="ghost-btn" onClick={() => { setSolved(true); finishTask(task.id, { firstTry: false }); }}>
              Ho capito, segna come fatta
            </button>
          )}
        </>
      )}
    </>
  );
}

function Advanced({ task, done }: { task: AdvancedTask; done: boolean }) {
  const { finishAdvanced } = useStore();
  const [hints, setHints] = useState(0);
  const [tried, setTried] = useState(done);
  const [code, setCode] = useState('');
  const [result, setResult] = useState<RunResult | null>(null);
  const [busy, setBusy] = useState(false);

  const download = () => {
    if (!task.testFile) return;
    const url = URL.createObjectURL(new Blob([task.testFile.code], { type: 'text/x-python' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = task.testFile.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="chip desk" style={{ alignSelf: 'flex-start' }}>Da fare al computer · {task.minutes} min</div>
      <RichHtml html={task.promptHtml} />
      {task.testFile && (
        <button className="ghost-btn" onClick={download}>Scarica il test {task.testFile.name}</button>
      )}
      {task.hints.slice(0, hints).map((h, i) => <div key={i} className="hint"><strong>Suggerimento {i + 1}. </strong><span dangerouslySetInnerHTML={{ __html: h }} /></div>)}
      {hints < task.hints.length && <button className="ghost-btn" onClick={() => setHints(hints + 1)}>Mostra un suggerimento</button>}
      <details>
        <summary style={{ color: 'var(--blue)', fontSize: 17, padding: '8px 0', cursor: 'pointer' }}>Incolla il tuo codice e provalo qui (facoltativo)</summary>
        <CodeEditor value={code} onChange={setCode} label="Il tuo codice" />
        <button className="pill-btn" style={{ marginTop: 8 }} disabled={busy || !code.trim()} onClick={async () => { setBusy(true); setResult(await runPython(code)); setBusy(false); }}>
          {busy ? 'Esecuzione…' : 'Esegui'}
        </button>
        <ResultBox r={result} />
      </details>
      {!tried ? (
        <button className="ghost-btn" onClick={() => setTried(true)}>Ho provato: mostra la soluzione</button>
      ) : (
        <>
          <p style={{ margin: 0, fontWeight: 600 }}>Soluzione</p>
          <pre className="code">{task.solution}</pre>
        </>
      )}
      {done ? (
        <DoneBanner />
      ) : (
        <button className="pill-btn" onClick={() => finishAdvanced(task.id, task.project, task.project ? task.id.slice(task.project.length + 1) : undefined)}>
          Segna come fatta
        </button>
      )}
    </>
  );
}
