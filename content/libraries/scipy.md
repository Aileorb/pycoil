---
title: SciPy
---
**Cos'è.** Algoritmi numerici pronti e affidabili costruiti su NumPy: radici di equazioni, integrali, equazioni differenziali, ottimizzazione, interpolazione, autovalori, statistica, segnali.

**Perché ti serve.** È la cassetta degli attrezzi dei metodi numerici: invece di riscrivere Newton o Runge-Kutta usi versioni testate da decenni.

```python
import numpy as np
from scipy.optimize import brentq
from scipy.integrate import quad
# frequenza a cui l'amplificazione di un oscillatore smorzato vale 2
H = lambda r, z=0.1: 1 / np.sqrt((1 - r**2) ** 2 + (2 * z * r) ** 2)
print(round(brentq(lambda r: H(r) - 2, 0, 1), 4))
print(quad(lambda x: x**2, 0, 3))
```

**Da sapere per primo:** `optimize.brentq`, `optimize.minimize`, `integrate.quad`, `integrate.solve_ivp`, `interpolate`, `linalg.eigh`.

**Nel percorso:** Parte IV (radici, integrali, fit, ODE, problemi ai limiti, ottimizzazione, FFT) e Parte V (`scipy.stats`); già usata nella Parte III per gli autovalori.

```bash
pip install scipy
```
