---
letter: C
title: Leggere gli errori
sources:
  - Errori ed eccezioni, tutorial | https://docs.python.org/3/tutorial/errors.html
  - Eccezioni predefinite | https://docs.python.org/3/library/exceptions.html
---
Un errore non è un fallimento: è Python che ti dice **esattamente** cosa non va e dove. Imparare a leggerlo è la competenza che fa risparmiare più tempo.

## Come è fatto un traceback

Quando il programma si ferma per un errore, Python stampa il *traceback*. Si legge **dal basso**: l'ultima riga dice **cosa** è successo, quelle sopra **dove**.

```text
Traceback (most recent call last):
  File "trave.py", line 12, in <module>
    sigma = N / A
ZeroDivisionError: division by zero
```

- `ZeroDivisionError` è il **tipo** di errore, `division by zero` la spiegazione.
- `line 12` e la riga `sigma = N / A` dicono dove: `A` valeva zero.

Quando l'errore nasce dentro una funzione, il traceback mostra la **catena delle chiamate**, dalla più esterna (in alto) a quella in cui è scoppiato (in basso):

```text
Traceback (most recent call last):
  File "verifica.py", line 9, in <module>
    print(utilizzo(250.0, sezioni["IPE 200"]))
  File "verifica.py", line 4, in utilizzo
    return M / W
TypeError: unsupported operand type(s) for /: 'float' and 'str'
```

Leggendo dal basso: la divisione `M / W` ha ricevuto un testo (`str`) invece di un numero; quella riga è nella funzione `utilizzo`, chiamata alla riga 9. Quasi sempre il colpevole è **chi ha passato il valore** (qui il dizionario `sezioni`, che conteneva `"194"` tra virgolette), non la riga in cui l'errore appare.

## Gli errori più frequenti, con un esempio ciascuno

Ogni esempio cattura l'errore con `try`/`except` per mostrarti il messaggio senza fermare tutto.

```python
def prova(codice):
    try:
        codice()
    except Exception as e:
        print(type(e).__name__, "→", e)

prova(lambda: "3" + 2)              # TypeError: testo + numero
prova(lambda: float("12,5"))        # ValueError: la virgola non è un punto decimale
prova(lambda: [10, 20, 30][3])      # IndexError: gli indici vanno da 0 a 2
prova(lambda: {"S235": 235}["S355"])   # KeyError: chiave assente
prova(lambda: (5).append(1))        # AttributeError: un int non ha append
prova(lambda: 1 / 0)                # ZeroDivisionError
```

Uscita:

```text
TypeError → can only concatenate str (not "int") to str
ValueError → could not convert string to float: '12,5'
IndexError → list index out of range
KeyError → 'S355'
AttributeError → 'int' object has no attribute 'append'
ZeroDivisionError → division by zero
```

`SyntaxError` e `IndentationError` sono diversi: Python li trova **prima** di eseguire, leggendo il file, quindi non parte nemmeno la prima riga. Spesso l'errore vero è sulla riga **precedente** a quella indicata (una parentesi non chiusa, un `:` dimenticato).

```text
  File "carico.py", line 3
    print(F
         ^
SyntaxError: '(' was never closed
```

## Tabella di riferimento

| Errore | Causa tipica | Rimedio |
|---|---|---|
| `SyntaxError` | parentesi o `:` mancanti | guarda la riga indicata e quella **prima** |
| `IndentationError` | spazi e tab mescolati, rientro sbagliato | usa sempre 4 spazi |
| `NameError` | nome scritto male o non ancora definito | controlla maiuscole e ordine delle righe |
| `TypeError` | operazione tra tipi incompatibili (`"3" + 2`), argomenti sbagliati | converti con `int()`, `float()`, `str()`; controlla la firma della funzione |
| `ValueError` | valore del tipo giusto ma non valido (`float("abc")`) | valida l'input |
| `IndexError` | indice oltre la fine della lista | si parte da 0 e `len - 1` è l'ultimo |
| `KeyError` | chiave assente in un dizionario | usa `d.get(k, default)` o controlla con `k in d` |
| `AttributeError` | metodo o attributo inesistente | `dir(oggetto)` mostra cosa c'è |
| `ZeroDivisionError` | divisione per zero | controlla il dato prima di dividere |
| `FileNotFoundError` | file assente o cartella sbagliata | controlla il percorso e la cartella corrente |
| `ModuleNotFoundError` | libreria non installata | `python -m pip install nome` nell'ambiente giusto (appendice A) |
| `ValueError: operands could not be broadcast` | forme NumPy incompatibili | stampa `.shape` degli array |
| `LinAlgError: Singular matrix` | sistema senza soluzione unica | struttura labile o vincoli mancanti |

## Quando non c'è errore ma il risultato è sbagliato

Il caso più insidioso: il programma gira e stampa un numero, ma il numero è sbagliato. Le cause più comuni nel calcolo tecnico:

- **unità miste** (mm e m, kN e N): scrivi l'unità in un commento accanto a ogni dato, o usa Pint;
- **gradi e radianti**: `math.sin(30)` usa radianti, serve `math.sin(math.radians(30))`;
- **divisione intera** `//` al posto di `/`;
- **una variabile riusata** che ha ancora il valore di un calcolo precedente.

```python
import math
print(round(math.sin(30), 3))                  # → -0.988   (30 radianti!)
print(round(math.sin(math.radians(30)), 3))    # → 0.5
```

## Il metodo, in quattro passi

1. **Leggi l'ultima riga**: tipo di errore e spiegazione.
2. **Vai alla riga indicata** e a quella prima; risali la catena delle chiamate se serve.
3. **Stampa i valori in gioco** con `print(repr(x), type(x))`: `repr` mostra le virgolette dei testi e gli spazi nascosti.
4. **Riduci il problema** a poche righe che riproducono l'errore: spesso, mentre lo fai, la causa diventa evidente.

```python
x = "235 "                           # letto da un file, con uno spazio in fondo
print(x, type(x))                    # → 235  <class 'str'>
print(repr(x))                       # → '235 '
print(float(x.strip()) * 1.1)        # → 258.5
```

## Riepilogo

- Il traceback si legge dal basso: l'ultima riga dice cosa, quelle sopra dove e chi ha chiamato.
- Il colpevole spesso è chi ha passato il valore sbagliato, non la riga dell'errore.
- `SyntaxError` blocca tutto prima dell'esecuzione; guarda anche la riga precedente.
- Senza errori ma risultato strano: unità, gradi/radianti, `//`, variabili riusate.
- `print(repr(x), type(x))` e un esempio minimo risolvono quasi tutto.
