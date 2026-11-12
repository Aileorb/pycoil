"""Controlla la gradualità del percorso: nessun esempio, esercizio o kata usa un costrutto Python
o una libreria prima della sezione che li spiega (in ordine di libro).

Uso:  python scripts/check_order.py      (esce con codice 1 se trova anticipazioni)
"""
from __future__ import annotations

import ast
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CONTENT = ROOT / "content"

# Costrutto → sezione che lo spiega.
TEACH = {
    "def": "00-04-01", "return": "00-04-01", "unpacking": "00-04-01", "list": "00-04-02", "slice": "00-04-02",
    "if": "00-03-01", "for": "00-03-02", "enumerate": "00-03-02", "zip": "00-03-02", "while": "00-03-03", "break": "00-03-03",
    "f-string": "00-02-02", "dict": "01-01-03", "set": "01-01-03", "starred": "01-01-02",
    "comprehension": "01-02-01", "default-arg": "01-02-02", "kw-only": "01-02-02", "*args": "01-02-02", "**kwargs": "01-02-02",
    "global": "01-02-04", "lambda": "01-02-03", "with": "01-03-01", "open": "01-03-01", "try": "01-03-02", "raise": "01-03-02",
    "class": "02-02-01", "dunder": "02-01-01", "super": "02-02-04", "match": "02-03-01", "match-guard": "02-03-02",
    "match-class": "02-03-02", "yield": "02-04-01", "decorator": "02-05-01", "assert": "02-07-01",
    "import:pathlib": "01-03-01", "import:csv": "01-03-01", "import:dataclasses": "02-02-02", "import:itertools": "02-04-01",
    "import:functools": "02-05-01", "import:pytest": "02-07-01", "import:numpy": "03-01-01", "import:matplotlib": "03-03-01",
    "import:scipy": "04-01-01", "import:pandas": "05-01-01", "import:pint": "06-02-01", "import:uncertainties": "06-02-02",
    "import:sympy": "06-01-01", "import:CoolProp": "07-01-01", "import:skfem": "07-02-03", "import:argparse": "08-01-01",
    "import:openpyxl": "08-01-02", "import:sklearn": "08-02-03",
}
# Anticipazioni volute e spiegate nel testo: (sezione, costrutto).
ALLOWED = {
    ("02-02-01", "dunder"),            # __repr__ si presenta insieme a __init__
    ("05-01-01", "import:openpyxl"),   # motore di pd.read_excel, spiegato lì
    ("03-02-02", "import:scipy"),      # scipy.linalg.eigh, spiegato lì
}
DECO_OK = re.compile(r"@(property|dataclass|staticmethod|classmethod)\b")


def features(code: str) -> set[str]:
    try:
        tree = ast.parse(code)
    except SyntaxError:
        return set()
    f: set[str] = set()
    simple = {ast.For: "for", ast.While: "while", ast.If: "if", ast.FunctionDef: "def", ast.Return: "return", ast.Lambda: "lambda",
              ast.ClassDef: "class", ast.Try: "try", ast.Raise: "raise", ast.With: "with", ast.Yield: "yield", ast.Match: "match",
              ast.JoinedStr: "f-string", ast.Dict: "dict", ast.Set: "set", ast.Assert: "assert", ast.Starred: "starred",
              ast.Global: "global", ast.Break: "break", ast.Slice: "slice", ast.List: "list"}
    for n in ast.walk(tree):
        for typ, name in simple.items():
            if isinstance(n, typ):
                f.add(name)
        if isinstance(n, (ast.ListComp, ast.DictComp, ast.SetComp, ast.GeneratorExp)):
            f.add("comprehension")
        if isinstance(n, ast.FunctionDef):
            a = n.args
            if a.defaults or any(d is not None for d in a.kw_defaults):
                f.add("default-arg")
            if a.kwonlyargs:
                f.add("kw-only")
            if a.vararg:
                f.add("*args")
            if a.kwarg:
                f.add("**kwargs")
            if n.name.startswith("__") and n.name.endswith("__") and n.name != "__init__":
                f.add("dunder")
        if isinstance(n, (ast.FunctionDef, ast.ClassDef)) and n.decorator_list:
            f.add("decorator")
        if isinstance(n, ast.Assign) and isinstance(n.targets[0], (ast.Tuple, ast.List)):
            f.add("unpacking")
        if isinstance(n, ast.For) and isinstance(n.target, ast.Tuple):
            f.add("unpacking")
        if isinstance(n, ast.Call) and isinstance(n.func, ast.Name) and n.func.id in ("enumerate", "zip", "open", "super"):
            f.add(n.func.id)
        if isinstance(n, ast.match_case) and n.guard is not None:
            f.add("match-guard")
        if isinstance(n, ast.MatchClass):
            f.add("match-class")
        if isinstance(n, ast.Import):
            f.update("import:" + a.name.split(".")[0] for a in n.names)
        if isinstance(n, ast.ImportFrom) and n.module:
            f.add("import:" + n.module.split(".")[0])
    # @property, @dataclass & co. si spiegano con classi e dataclass, non con i decoratori
    if "decorator" in f and not re.search(r"@(?!property|dataclass|staticmethod|classmethod)\w", code) and DECO_OK.search(code):
        f.discard("decorator")
    return f


def main() -> int:
    book = json.loads((CONTENT / "book.json").read_text())
    order = [s["id"] for p in book["parts"] for c in p["chapters"] for s in c["sections"]]
    pos = {s: i for i, s in enumerate(order)}
    problems: list[str] = []

    def check(label: str, at: str, code: str) -> None:
        for feat in sorted(features(code)):
            t = TEACH.get(feat)
            if t and pos[t] > pos[at] and (at, feat) not in ALLOWED:
                problems.append(f"{label} (sezione {at}): usa «{feat}», spiegato in {t}")

    for sid in order:
        md = CONTENT / "sections" / f"{sid}.md"
        if md.exists():
            for i, m in enumerate(re.finditer(r"```python([^\n]*)\n(.*?)```", md.read_text(), re.S)):
                if "norun" not in m.group(1):
                    check(f"blocco {i + 1}", sid, m.group(2))
        tf = CONTENT / "tasks" / f"{sid}.json"
        if tf.exists():
            for t in json.loads(tf.read_text()):
                for key in ("code", "solution"):
                    if t.get(key):
                        check(f"{t['kind']} «{t['title']}»", sid, t[key])
    for k in json.loads((CONTENT / "katas.json").read_text()):
        check(k["id"], k["section"], k["solution"])

    for p in problems:
        print("ANTICIPA", p)
    print(f"Ordine controllato su {len(order)} sezioni: {len(problems)} anticipazioni.")
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main())
