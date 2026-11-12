---
title: CoolProp
---
**Cos'è.** Proprietà termofisiche di oltre cento fluidi (acqua, aria, refrigeranti, CO₂) da equazioni di stato di riferimento.

**Perché ti serve.** Sostituisce le tabelle del vapore e i diagrammi di Mollier negli esercizi di Fisica tecnica e Macchine: entalpia, entropia, titolo in una chiamata.

```python
from CoolProp.CoolProp import PropsSI
T_sat = PropsSI("T", "P", 101325, "Q", 0, "Water") - 273.15
h = PropsSI("H", "P", 10e5, "T", 300 + 273.15, "Water") / 1000
print(f"T_sat a 1 atm = {T_sat:.2f} °C, h(10 bar, 300 °C) = {h:.1f} kJ/kg")
```

**Da sapere per primo:** `PropsSI(uscita, nome1, valore1, nome2, valore2, fluido)` sempre in unità SI (K, Pa, J/kg).

**Nel percorso:** Parte VII (in arrivo).

```bash
pip install CoolProp
```
