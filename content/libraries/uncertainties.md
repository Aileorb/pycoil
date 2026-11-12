---
title: uncertainties
---
**Cos'è.** Numeri con incertezza (`valore ± sigma`) che si propagano da soli nei calcoli, con le derivate corrette.

**Perché ti serve.** Ogni misura di laboratorio ha un'incertezza: questa libreria ti dice quanto è incerto il risultato finale senza fare le derivate a mano.

```python
from uncertainties import ufloat
F = ufloat(12_000, 150)     # N
d = ufloat(10.00, 0.02)     # mm
import math
sigma = 4 * F / (math.pi * d**2)
print(f"σ = {sigma:.1uS} MPa")
```

**Da sapere per primo:** `ufloat`, `umath` per le funzioni, `.nominal_value`, `.std_dev`.

**Nel percorso:** Parte VI (in arrivo).

```bash
pip install uncertainties
```
