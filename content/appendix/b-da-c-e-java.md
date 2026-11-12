---
letter: B
title: Python per chi viene da C e Java
sources:
  - Tutorial ufficiale di Python | https://docs.python.org/3/tutorial/
  - PEP 8, stile del codice | https://peps.python.org/pep-0008/
---
Se conosci già C o Java, quasi tutto ti suonerà familiare. Le differenze che contano davvero:

| Tema | C / Java | Python |
|---|---|---|
| Blocchi | `{ }` | indentazione (4 spazi) |
| Tipi | dichiarati e statici | dinamici; i *type hint* sono facoltativi |
| Variabili | contenitori di valori | **nomi** che puntano a oggetti |
| Interi | 32 o 64 bit, overflow | precisione arbitraria |
| Divisione | `7 / 2 == 3` tra interi | `7 / 2 == 3.5`, `7 // 2 == 3` |
| Cicli | `for (i = 0; i < n; i++)` | `for x in sequenza:` |
| Array | `double v[10]`, `ArrayList` | `list` per tutto, NumPy per i numeri |
| Mappe | `HashMap` | `dict` letterale `{"k": v}` |
| Stringhe | `char*`, `String` | `str` immutabile, f-string |
| Errori | codici di ritorno, eccezioni controllate | eccezioni, `try/except` |
| Memoria | `malloc/free`, GC | garbage collector, niente puntatori |
| Main | `int main()`, `public static void main` | `if __name__ == "__main__":` |
| Costanti | `const`, `final` | convenzione `MAIUSCOLO` |

## Le tre trappole classiche

1. **Aliasing**: `b = a` non copia una lista (sezione 1.1.1).
2. **Argomenti di default mutabili**: `def f(x, acc=[])` condivide la stessa lista tra le chiamate (sezione 1.2.2).
3. **Cicli dove servirebbe NumPy**: un `for` su un milione di punti è lento; vettorizza (Parte III).

## Lo stile

Nomi `snake_case` per variabili e funzioni, `CamelCase` per le classi, righe non troppo lunghe. Un formattatore come **ruff** o **black** sistema tutto da solo.
