---
title: NumPy
---
**Cos'è.** La libreria degli array numerici: vettori e matrici con operazioni elemento per elemento, algebra lineare, numeri casuali. Quasi tutte le altre librerie scientifiche si appoggiano a NumPy.

**Perché ti serve.** Discretizzare una trave, risolvere `K u = F`, elaborare migliaia di letture di un estensimetro: tutto senza cicli e a velocità di codice compilato.

```python
import numpy as np
x = np.linspace(0, 1, 5)
K = np.array([[2.0, -1.0], [-1.0, 2.0]])
print(x, np.linalg.solve(K, [1.0, 0.0]))
```

**Da sapere per primo:** `array`, `linspace`, `shape`, slicing e maschere, `@`, `np.linalg.solve`, `axis=` nelle riduzioni.

**Nel percorso:** Parte III, capitoli Array e Algebra lineare.

```bash
pip install numpy
```
