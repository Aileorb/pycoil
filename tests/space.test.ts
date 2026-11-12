import { describe, expect, it } from 'vitest';
import { currentPart, neededLibs, packageOfUrl, packagesFor, planCleanup, type Lock } from '../src/engine/space';
import { emptyState } from '../src/engine/state';
import type { AppState, ContentIndex } from '../src/engine/types';

const sec = (id: string, libs?: string[]) => ({ id, title: id, minutes: 3, libs });
const index = {
  version: 'x', python: '3.14',
  parts: [
    { id: 'p3', roman: 'III', title: 'NumPy', short: 'NumPy', chapters: [{ id: 'c3', title: 'c', sections: [sec('03-01-01', ['numpy']), sec('03-01-02', ['matplotlib', 'numpy'])] }] },
    { id: 'p6', roman: 'VI', title: 'Simbolico', short: 'Simb', chapters: [{ id: 'c6', title: 'c', sections: [sec('06-01-01', ['sympy']), sec('06-02-01', ['pint'])] }] },
    { id: 'p7', roman: 'VII', title: 'App', short: 'App', chapters: [{ id: 'c7', title: 'c', sections: [sec('07-01-01', ['CoolProp']), sec('07-02-01', ['numpy'])] }] }
  ],
  libraries: [], appendix: [], katas: [], projects: [], quiz: [],
  tasks: [{ id: 'scrivi-06-01-01-a', type: 'scrivi', section: '06-01-01', title: 't', minutes: 4, libs: ['sympy'] }]
} as unknown as ContentIndex;

const lock: Lock = {
  packages: {
    numpy: { name: 'numpy', file_name: 'numpy-2.whl', depends: [], imports: ['numpy'] },
    matplotlib: { name: 'matplotlib', file_name: 'matplotlib-3.whl', depends: ['numpy', 'pillow'], imports: ['matplotlib'] },
    pillow: { name: 'pillow', file_name: 'pillow-11.whl', depends: [], imports: ['PIL'] },
    sympy: { name: 'sympy', file_name: 'sympy-1.whl', depends: ['mpmath'], imports: ['sympy'] },
    mpmath: { name: 'mpmath', file_name: 'mpmath-1.whl', depends: [], imports: ['mpmath'] },
    coolprop: { name: 'coolprop', file_name: 'coolprop-7.whl', depends: [], imports: ['CoolProp'] },
    pytest: { name: 'pytest', file_name: 'pytest-9.whl', depends: [], imports: ['pytest'] },
    'typing-extensions': { name: 'typing-extensions', file_name: 'typing_extensions-4.whl', depends: [], imports: ['typing_extensions'] },
    platformdirs: { name: 'platformdirs', file_name: 'platformdirs-4.whl', depends: [], imports: ['platformdirs'] }
  }
};
const CDN = 'https://cdn.jsdelivr.net/pyodide/v314.0.7/full/';
const files = [
  { url: `${CDN}pyodide.asm.wasm`, size: 9_000_000 },
  { url: `${CDN}pyodide-lock.json`, size: 100_000 },
  ...['numpy-2.whl', 'matplotlib-3.whl', 'pillow-11.whl', 'sympy-1.whl', 'mpmath-1.whl', 'coolprop-7.whl', 'pytest-9.whl', 'typing_extensions-4.whl', 'platformdirs-4.whl'].map((f) => ({ url: CDN + f, size: 1_000_000 })),
  { url: 'https://files.pythonhosted.org/packages/aa/pint-0.25-py3-none-any.whl', size: 300_000 },
  { url: 'https://files.pythonhosted.org/packages/bb/flexcache-0.3-py3-none-any.whl', size: 20_000 },
  { url: 'https://pypi.org/simple/pint/', size: 5_000 }
];

function at(sections: string[]): AppState {
  return { ...emptyState(), level: 'avanzato', sections };
}

describe('spazio e librerie', () => {
  it('trova la parte attuale', () => {
    expect(currentPart(index, at([]))).toBe('p3');
    expect(currentPart(index, at(['03-01-01', '03-01-02', '06-01-01', '06-02-01']))).toBe('p7');
  });

  it('dalla Parte VII non servono più SymPy, pint e Matplotlib', () => {
    const need = neededLibs(index, at(['03-01-01', '03-01-02', '06-01-01', '06-02-01']));
    expect([...need].sort()).toEqual(['CoolProp', 'numpy', 'pytest']);
  });

  it('un ripasso in calendario tiene viva la sua libreria', () => {
    const s = at(['03-01-01', '03-01-02', '06-01-01', '06-02-01']);
    s.review = { 'scrivi-06-01-01-a': { due: '2026-12-01', step: 2 } };
    expect(neededLibs(index, s).has('sympy')).toBe(true);
  });

  it('risolve le dipendenze', () => {
    expect([...packagesFor(lock, ['matplotlib'])].sort()).toEqual(['matplotlib', 'numpy', 'pillow']);
    expect([...packagesFor(lock, ['pint'])].sort()).toEqual(['platformdirs', 'typing-extensions']);
  });

  it('riconosce i file in cache', () => {
    expect(packageOfUrl(`${CDN}pyodide.asm.wasm`, lock)).toBe('core');
    expect(packageOfUrl(`${CDN}mpmath-1.whl`, lock)).toBe('mpmath');
    expect(packageOfUrl('https://files.pythonhosted.org/packages/bb/flexcache-0.3-py3-none-any.whl', lock)).toBe('pypi:flexcache');
    expect(packageOfUrl('https://pypi.org/simple/pint/', lock)).toBe('pypi:pint');
  });

  it('libera solo ciò che non serve, senza toccare il motore né le dipendenze condivise', () => {
    const need = new Set(['numpy', 'CoolProp', 'pytest']);
    const plan = planCleanup(files, lock, need);
    const tolti = plan.removable.map((u) => u.split('/').pop());
    expect(tolti.sort()).toEqual(['', 'flexcache-0.3-py3-none-any.whl', 'matplotlib-3.whl', 'mpmath-1.whl', 'pillow-11.whl', 'pint-0.25-py3-none-any.whl', 'platformdirs-4.whl', 'sympy-1.whl', 'typing_extensions-4.whl'].sort());
    expect(plan.core).toBe(9_100_000);
    const row = (l: string) => plan.rows.find((r) => r.lib === l)!;
    expect(row('sympy')).toMatchObject({ needed: false, size: 2_000_000 });
    expect(row('numpy').needed).toBe(true);
    expect(row('pint').needed).toBe(false);
  });
});
