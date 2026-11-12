---
title: SymPy
---
**Cos'è.** Calcolo simbolico: manipola formule, deriva, integra, risolve equazioni in forma esatta, semplifica, genera codice.

**Perché ti serve.** Ricavare una formula chiusa (la freccia di una trave, la linea elastica) e poi trasformarla in una funzione numerica con `lambdify`.

```python
import sympy as sp
x, L, q, EI = sp.symbols("x L q EI", positive=True)
M = q * x * (L - x) / 2
w = sp.integrate(sp.integrate(-M / EI, x), x)
C1, C2 = sp.symbols("C1 C2")
w = w + C1 * x + C2
sol = sp.solve([w.subs(x, 0), w.subs(x, L)], [C1, C2])
print(sp.factor(-w.subs(sol).subs(x, L / 2)))
```

**Da sapere per primo:** `symbols`, `diff`, `integrate`, `solve`, `subs`, `simplify`, `lambdify`.

**Nel percorso:** Parte VI, «Calcolo simbolico con SymPy».

```bash
pip install sympy
```
