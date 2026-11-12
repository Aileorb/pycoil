export interface RunResult {
  ok: boolean;
  out: string;
  error?: string;
  images: string[];
  testsOk: boolean | null;
  testError?: string;
}

let worker: Worker | null = null;
let booted = false;
let seq = 0;
const pending = new Map<number, (r: RunResult) => void>();

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL('../workers/pyodide.worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (e: MessageEvent<RunResult & { id: number }>) => {
      booted = true;
      const done = pending.get(e.data.id);
      pending.delete(e.data.id);
      done?.(e.data);
    };
  }
  return worker;
}

function reset(reason: string) {
  worker?.terminate();
  worker = null;
  booted = false;
  for (const [, done] of pending) done({ ok: false, out: '', error: reason, images: [], testsOk: null });
  pending.clear();
}

/** Esegue codice Python. Il primo avvio scarica Pyodide (qualche MB), poi è immediato. */
export function runPython(code: string, tests?: string): Promise<RunResult> {
  const id = ++seq;
  const w = getWorker();
  const limit = booted ? 20_000 : 150_000;
  return new Promise((resolve) => {
    pending.set(id, resolve);
    window.setTimeout(() => {
      if (pending.has(id)) reset(booted ? 'Tempo scaduto (20 s): c’è forse un ciclo infinito?' : 'Python non si è caricato in tempo. Controlla la connessione e riprova.');
    }, limit);
    w.postMessage({ id, code, tests });
  });
}

export const isPythonBooted = () => booted;
