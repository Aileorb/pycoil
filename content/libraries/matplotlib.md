---
title: Matplotlib
---
**Cos'è.** La libreria standard per i grafici in Python: linee, dispersione, istogrammi, contorni, mappe di colore, grafici 3D. Esporta in PNG, PDF e SVG.

**Perché ti serve.** Relazioni di laboratorio, diagrammi delle sollecitazioni, curve caratteristiche, figure della tesi.

```python
import numpy as np
import matplotlib.pyplot as plt
x = np.linspace(0, 10, 200)
fig, ax = plt.subplots(figsize=(5, 2.6))
ax.plot(x, np.exp(-0.3 * x) * np.sin(3 * x))
ax.set(xlabel="t [s]", ylabel="x [mm]")
ax.grid(alpha=0.3)
```

**Da sapere per primo:** `fig, ax = plt.subplots()`, `ax.plot`, `ax.set(...)`, `legend`, `subplots(r, c)`, `fig.savefig("figura.pdf")`.

**Nel percorso:** Parte III, capitolo Grafici.

```bash
pip install matplotlib
```
