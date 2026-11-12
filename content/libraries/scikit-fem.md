---
title: scikit-fem
---
**Cos'è.** Una libreria di elementi finiti scritta in puro Python su NumPy e SciPy: mesh, elementi, assemblaggio di forme bilineari.

**Perché ti serve.** Dopo aver scritto un piccolo FEM da te (Progetto 7), scikit-fem ti mostra come si struttura un codice FEM vero, restando leggibile.

```python norun
import skfem as fem
from skfem.helpers import dot, grad

m = fem.MeshTri().refined(4)
e = fem.ElementTriP1()
basis = fem.Basis(m, e)

@fem.BilinearForm
def laplace(u, v, _):
    return dot(grad(u), grad(v))

@fem.LinearForm
def carico(v, _):
    return 1.0 * v

K = laplace.assemble(basis)
f = carico.assemble(basis)
u = fem.solve(*fem.condense(K, f, D=m.boundary_nodes()))
print(u.max())
```

**Nel percorso:** Parte VII (in arrivo).

```bash
pip install scikit-fem
```
