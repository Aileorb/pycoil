---
title: Pint
---
**Cos'è.** Numeri con unità di misura: conversioni automatiche e errore immediato se sommi grandezze incompatibili.

**Perché ti serve.** Gli errori di unità sono tra i più costosi in ingegneria. Con Pint `5 * ureg.kN / (200 * ureg.mm**2)` diventa direttamente una tensione convertibile in MPa.

```python
import pint
ureg = pint.UnitRegistry()
sigma = (12 * ureg.kN / (80 * ureg.mm**2)).to("MPa")
print(sigma)                # 150.0 megapascal
print((1 * ureg.bar).to("kPa"))
```

> [!nota] Nell'app pint si scarica da PyPI la prima volta che lo usi: la prima esecuzione richiede qualche secondo in più.

**Nel percorso:** Parte V, «pint: calcoli a prova di unità», e Progetto 6.

```bash
pip install pint
```
