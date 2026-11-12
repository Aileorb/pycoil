"""Esegue davvero i contenuti di PyCoil con CPython, come farebbe Pyodide nell'app.

Controlla che:
  - ogni blocco ```python delle sezioni (non "norun") giri senza errori;
  - ogni esercizio "prevedi" stampi esattamente l'opzione corretta;
  - ogni "scrivi" passi i test con la soluzione e NON li passi con lo starter;
  - kata e tappe dei progetti passino i loro test con la soluzione.

Uso:  python scripts/verify_content.py   (servono numpy, scipy, matplotlib)
"""
from __future__ import annotations

import contextlib
import importlib
import io
import json
import os
import re
import sys
import tempfile
import traceback
from pathlib import Path

os.environ.setdefault("MPLBACKEND", "agg")
ROOT = Path(__file__).resolve().parent.parent
CONTENT = ROOT / "content"
errors: list[str] = []
checked = 0


def run(code: str, ns: dict | None = None) -> tuple[dict, str]:
    """Esegue il codice in una cartella temporanea pulita; restituisce namespace e stdout."""
    ns = {} if ns is None else ns
    out = io.StringIO()
    with contextlib.redirect_stdout(out):
        exec(compile(code, "<exec>", "exec"), ns)
    return ns, out.getvalue()


def close_figs() -> None:
    if "matplotlib.pyplot" in sys.modules:
        sys.modules["matplotlib.pyplot"].close("all")


def fresh_dir():
    d = tempfile.TemporaryDirectory()
    os.chdir(d.name)
    importlib.invalidate_caches()
    tmp = tempfile.gettempdir()
    for name, mod in list(sys.modules.items()):  # i moduli scritti dagli esercizi
        if (getattr(mod, "__file__", None) or "").startswith(tmp):
            del sys.modules[name]
    return d


def check(label: str, fn) -> None:
    global checked
    checked += 1
    d = fresh_dir()
    try:
        fn()
    except AssertionError as e:
        errors.append(f"{label}: {e}")
    except Exception:
        errors.append(f"{label}: {traceback.format_exc(limit=2).strip().splitlines()[-1]}")
    finally:
        close_figs()
        os.chdir(ROOT)
        d.cleanup()


def with_tests(code: str, tests: str) -> bool:
    try:
        ns, _ = run(code)
        run(tests, ns)
        return True
    except Exception:
        return False


def _why(code: str, tests: str) -> str:
    try:
        ns, _ = run(code)
        run(tests, ns)
        return ""
    except Exception:
        return traceback.format_exc(limit=1).strip().splitlines()[-1]


# ------------------------------------------------------------------ sezioni
FENCE = re.compile(r"```(\w+)([^\n]*)\n(.*?)```", re.S)
for md in sorted([*(CONTENT / "sections").glob("*.md"), *(CONTENT / "libraries").glob("*.md"), *(CONTENT / "appendix").glob("*.md")]):
    for i, m in enumerate(FENCE.finditer(md.read_text())):
        lang, flag, code = m.group(1), m.group(2).strip(), m.group(3)
        if lang in ("python", "py") and flag != "norun":
            def f(code=code):
                run(code)
            check(f"{md.stem} blocco {i + 1}", f)

# ------------------------------------------------------------------ esercizi
for tf in sorted((CONTENT / "tasks").glob("*.json")):
    for j, t in enumerate(json.loads(tf.read_text())):
        label = f"{tf.stem} #{j + 1} {t['kind']} «{t['title']}»"
        if t["kind"] == "prevedi":
            def f(t=t):
                expected = t["options"][t["answer"]]
                assert len(set(t["options"])) == len(t["options"]), "opzioni duplicate"
                try:
                    _, out = run(t["code"])
                    got = out.strip()
                except Exception as e:  # opzione del tipo "TypeError"
                    got = type(e).__name__
                assert got == expected, f"stampa {got!r}, opzione corretta {expected!r}"
            check(label, f)
        else:
            def f(t=t):
                assert with_tests(t["solution"], t["tests"]), "la soluzione non passa i test:\n" + _why(t["solution"], t["tests"])
                if t.get("starter"):
                    assert not with_tests(t["starter"], t["tests"]), "lo starter passa già i test"
            check(label, f)


def run_pytest_file(solution_code: str, test_name: str, test_code: str, files: dict[str, str]) -> None:
    """Simula il lavoro sul computer: i file del progetto + il file di test, chiamando le funzioni test_*."""
    for name, code in files.items():
        Path(name).write_text(code)
    sys.path.insert(0, os.getcwd())
    try:
        ns, _ = run(solution_code) if solution_code.strip() else ({}, "")
        tns: dict = {"__name__": "test"}
        exec(compile(test_code, test_name, "exec"), tns)
        tests = [v for k, v in tns.items() if k.startswith("test_") and callable(v)]
        assert tests, f"{test_name} non contiene funzioni test_*"
        for tfun in tests:
            tfun()
    finally:
        sys.path.remove(os.getcwd())


# ------------------------------------------------------------------ test di livello
for j, q in enumerate(json.loads((CONTENT / "quiz.json").read_text())):
    def f(q=q):
        _, out = run(q["code"])
        assert out.strip() == q["options"][q["answer"]], f"stampa {out.strip()!r}"
    check(f"quiz #{j + 1}", f)

# ------------------------------------------------------------------ kata
katas_file = CONTENT / "katas.json"
if katas_file.exists():
    for k in json.loads(katas_file.read_text()):
        def f(k=k):
            tf = k.get("testFile")
            if tf:
                mod = k.get("module", "soluzione.py")
                run_pytest_file("", tf["name"], tf["code"], {mod: k["solution"]})
            else:
                run(k["solution"])
        check(f"kata {k['id']}", f)

# ------------------------------------------------------------------ progetti
for pj in sorted((CONTENT / "projects").glob("*/project.json")):
    p = json.loads(pj.read_text())
    module = p.get("module", "progetto.py")
    acc = ""  # il modulo cresce tappa dopo tappa
    for s in p["steps"]:
        acc = s.get("module_code", acc + "\n\n" + s["solution"]) if s.get("replace") else acc + "\n\n" + s["solution"]
        acc_now = acc

        def f(s=s, acc_now=acc_now):
            if s.get("test"):
                run_pytest_file("", s["testName"], s["test"], {module: acc_now})
            else:
                run(acc_now)
        check(f"progetto {p['id']} tappa {s['id']}", f)

print(f"Verificati {checked} elementi.")
if errors:
    print(f"\n{len(errors)} problemi:")
    for e in errors:
        print(" -", e)
    sys.exit(1)
print("Tutto ok.")
