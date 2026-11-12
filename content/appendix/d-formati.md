---
letter: D
title: Formattare i numeri
sources:
  - Format Specification Mini-Language | https://docs.python.org/3/library/string.html#formatspec
---
Le f-string con le specifiche di formato coprono tutto quello che serve nelle relazioni tecniche.

| Scrittura | Risultato | Uso |
|---|---|---|
| `f"{x:.2f}"` | `3.14` | decimali fissi |
| `f"{x:.3e}"` | `3.142e+00` | notazione scientifica |
| `f"{x:.3g}"` | `3.14` | cifre significative |
| `f"{x:,.0f}"` | `12,345` | separatore delle migliaia |
| `f"{x:8.1f}"` | `     3.1` | larghezza fissa (tabelle) |
| `f"{s:<10}"` | `S355      ` | testo allineato a sinistra |
| `f"{x:>10.2f}"` | `      3.14` | allineato a destra |
| `f"{u:.0%}"` | `87%` | percentuali |
| `f"{x=}"` | `x=3.14159` | debug rapido |

```python
sigma, fyd, nome = 187.349, 338.1, "S355"
print(f"{nome:<6}σ = {sigma:7.1f} MPa   utilizzo {sigma / fyd:.0%}")
print(f"E = {210e3:.2e} MPa, {sigma=:.1f}")
```

> [!nota] Per la virgola decimale all'italiana: `f"{x:.2f}".replace(".", ",")`.
