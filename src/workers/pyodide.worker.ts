// Esegue Python nel browser con Pyodide, in un worker per non bloccare l'interfaccia.
// Pyodide arriva da CDN al primo esercizio: non fa parte del bundle dell'app.
import { PYODIDE_INDEX as INDEX_URL } from '../py/version';

interface RunRequest { id: number; code: string; tests?: string }
interface RunResponse {
  id: number;
  ok: boolean;
  out: string;
  error?: string;
  images: string[];
  testsOk: boolean | null;
  testError?: string;
  python?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Py = any;
declare const self: { onmessage: ((e: MessageEvent<RunRequest>) => void) | null; postMessage: (m: RunResponse) => void };
let ready: Promise<Py> | null = null;

async function boot(): Promise<Py> {
  const mod = await import(/* @vite-ignore */ `${INDEX_URL}pyodide.mjs`);
  const py = await mod.loadPyodide({ indexURL: INDEX_URL });
  await py.runPythonAsync('import os\nos.environ["MPLBACKEND"] = "agg"');
  return py;
}

// Librerie in puro Python non incluse in Pyodide: si installano da PyPI con micropip al primo uso.
const FROM_PYPI: Record<string, string> = { pint: 'pint', openpyxl: 'openpyxl', skfem: 'scikit-fem' };

async function installFromPypi(py: Py, src: string): Promise<void> {
  const wanted = Object.keys(FROM_PYPI).filter((m) => new RegExp(`^\\s*(from|import)\\s+${m}\\b`, 'm').test(src));
  if (!wanted.length) return;
  py.globals.set('_pycoil_wanted', py.toPy(wanted));
  const missing: string[] = py.runPython('import importlib.util as _u\n[m for m in _pycoil_wanted if _u.find_spec(m) is None]').toJs();
  if (!missing.length) return;
  await py.loadPackage('micropip', { messageCallback: () => undefined });
  py.globals.set('_pycoil_missing', py.toPy(missing.map((m) => FROM_PYPI[m])));
  await py.runPythonAsync('import micropip\nawait micropip.install(_pycoil_missing)');
}

const COLLECT_FIGS = `
import sys as _sys
_imgs = []
if "matplotlib.pyplot" in _sys.modules:
    import io as _io, base64 as _b64
    import matplotlib.pyplot as _plt
    for _n in _plt.get_fignums():
        _buf = _io.BytesIO()
        _plt.figure(_n).savefig(_buf, format="png", dpi=110, bbox_inches="tight")
        _imgs.append(_b64.b64encode(_buf.getvalue()).decode())
    _plt.close("all")
_imgs
`;

/** Mostra solo la parte utile del traceback (senza i frame interni di Pyodide). */
function cleanError(raw: string): string {
  const lines = raw.split('\n').filter((l) => l.trim());
  const start = lines.findIndex((l) => l.includes('File "<exec>"'));
  const useful = start >= 0 ? lines.slice(start) : lines.slice(-3);
  return useful
    .filter((l) => !l.includes('/lib/python') && !l.includes('_pyodide'))
    .map((l) => l.replace('File "<exec>", ', 'Riga: '))
    .join('\n');
}

self.onmessage = async (e: MessageEvent<RunRequest>) => {
  const { id, code, tests } = e.data;
  let out = '';
  const res: RunResponse = { id, ok: true, out: '', images: [], testsOk: null };
  try {
    if (!ready) ready = boot();
    const py = await ready;
    res.python = py.version;
    // durante il caricamento delle librerie i messaggi di servizio non finiscono nell'output
    py.setStdout({ batched: () => undefined });
    py.setStderr({ batched: () => undefined });
    await py.loadPackagesFromImports(`${code}\n${tests ?? ''}`, { messageCallback: () => undefined });
    try {
      await installFromPypi(py, `${code}\n${tests ?? ''}`);
    } catch {
      res.ok = false;
      res.error = 'Libreria non disponibile: non riesco a scaricarla da PyPI. Serve la connessione la prima volta.';
      res.out = out;
      self.postMessage(res);
      return;
    }
    py.setStdout({ batched: (s: string) => (out += s + '\n') });
    py.setStderr({ batched: (s: string) => (out += s + '\n') });
    const ns = py.globals.get('dict')();
    try {
      await py.runPythonAsync(code, { globals: ns });
    } catch (err) {
      res.ok = false;
      res.error = cleanError(String(err));
    }
    if (res.ok && tests) {
      try {
        await py.runPythonAsync(tests, { globals: ns });
        res.testsOk = true;
      } catch (err) {
        res.testsOk = false;
        const msg = String(err);
        const last = msg.trim().split('\n').pop() ?? msg;
        res.testError = last.replace(/^AssertionError:?\s*/, '') || 'Un controllo non è passato.';
      }
    }
    const imgs = await py.runPythonAsync(COLLECT_FIGS, { globals: ns });
    res.images = imgs.toJs ? imgs.toJs() : [];
    ns.destroy?.();
  } catch (err) {
    res.ok = false;
    res.error = `Python non disponibile: ${String(err).slice(0, 200)}. Serve la connessione la prima volta.`;
  }
  res.out = out.replace(/\n$/, '');
  self.postMessage(res);
};
