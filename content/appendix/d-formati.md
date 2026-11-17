---
letter: D
title: Formattare i numeri
sources:
  - Format Specification Mini-Language | https://docs.python.org/3/library/string.html#formatspec
---
Le f-string con le specifiche di formato coprono tutto quello che serve nelle relazioni tecniche.

## Come si legge una specifica di formato

Dentro le graffe, dopo il valore, i **due punti** introducono la specifica: `{valore:specifica}`. La specifica si compone di pezzi facoltativi, sempre nello stesso ordine:

```text
{ x : < 10 , .2 f }
      │  │  │  │  └─ tipo: f decimali fissi, e scientifica, g cifre significative, % percentuale
      │  │  │  └──── precisione: quante cifre dopo il punto (o significative con g)
      │  │  └─────── separatore delle migliaia
      │  └────────── larghezza minima totale, in caratteri
      └───────────── allineamento: < sinistra, > destra, ^ centro
```

Si costruisce un pezzo alla volta:

```python
x = 12345.6789
print(f"{x}")          # → 12345.6789
print(f"{x:.2f}")      # → 12345.68     (2 decimali, arrotondato)
print(f"{x:,.2f}")     # → 12,345.68    (più il separatore)
print(f"[{x:>12,.2f}]")   # → [   12,345.68]   (largo 12, a destra)
print(f"{x:.3e}")      # → 1.235e+04    (scientifica)
print(f"{x:.3g}")      # → 1.23e+04     (3 cifre significative)
```

`g` sceglie da solo tra notazione normale e scientifica: con numeri «normali» dà la forma più leggibile, con numeri molto grandi o piccoli passa all'esponente.

## Tabella di riferimento

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

## Una tabella allineata

La larghezza fissa serve a mettere in colonna i risultati di più elementi: stessa specifica su ogni riga, e le colonne si allineano da sole.

```python
righe = [("Trave 1", 187.349, 0.554), ("Pilastro 12", 312.8, 0.925), ("Tirante", 41.2, 0.122)]
print(f"{'Elemento':<12}{'σ [MPa]':>9}{'Util.':>7}")
for nome, s, u in righe:
    print(f"{nome:<12}{s:>9.1f}{u:>7.0%}")
```

Uscita:

```text
Elemento      σ [MPa]  Util.
Trave 1         187.3    55%
Pilastro 12     312.8    92%
Tirante          41.2    12%
```

## Tutto insieme

```python
sigma, fyd, nome = 187.349, 338.1, "S355"
print(f"{nome:<6}σ = {sigma:7.1f} MPa   utilizzo {sigma / fyd:.0%}")
print(f"E = {210e3:.2e} MPa, {sigma=:.1f}")
```

> [!nota] Per la virgola decimale all'italiana: `f"{x:.2f}".replace(".", ",")`.

## Riepilogo

- `{valore:specifica}`: allineamento, larghezza, separatore, precisione, tipo, in quest'ordine.
- `.2f` decimali fissi, `.3e` scientifica, `.3g` cifre significative, `.0%` percentuale.
- Larghezze fisse (`<12`, `>9.1f`) per tabelle in colonna.
- `f"{x=}"` per il debug; la virgola decimale con `.replace(".", ",")`.
