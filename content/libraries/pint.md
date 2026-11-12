---
title: Pint
---
**Cos'è.** Numeri con unità di misura: conversioni automatiche e errore immediato se sommi grandezze incompatibili.

**Perché ti serve.** Gli errori di unità sono tra i più costosi in ingegneria. Con Pint `5 * ureg.kN / (200 * ureg.mm**2)` diventa direttamente una tensione convertibile in MPa.

```python norun
import pint
ureg = pint.UnitRegistry()
sigma = (12 * ureg.kN / (80 * ureg.mm**2)).to("MPa")
print(sigma)                # 150.0 megapascal
print((1 * ureg.bar).to("kPa"))
```

> [!nota] Pint non è ancora disponibile in Pyodide: provalo sul computer.

**Nel percorso:** Parte VI (in arrivo).

```bash
pip install pint
```
