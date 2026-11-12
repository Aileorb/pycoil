---
letter: C
title: Leggere gli errori
sources:
  - Errori ed eccezioni, tutorial | https://docs.python.org/3/tutorial/errors.html
  - Eccezioni predefinite | https://docs.python.org/3/library/exceptions.html
---
Un messaggio d'errore di Python (*traceback*) si legge **dal basso**: l'ultima riga dice cosa è successo, quelle sopra dove.

```text
Traceback (most recent call last):
  File "trave.py", line 12, in <module>
    sigma = N / A
ZeroDivisionError: division by zero
```

## Gli errori più frequenti

| Errore | Causa tipica | Rimedio |
|---|---|---|
| `SyntaxError` | parentesi o `:` mancanti | guarda la riga indicata e quella **prima** |
| `IndentationError` | spazi e tab mescolati | usa sempre 4 spazi |
| `NameError` | nome scritto male o non ancora definito | controlla maiuscole e ordine delle righe |
| `TypeError` | operazione tra tipi incompatibili (`"3" + 2`) | converti con `int()`, `float()`, `str()` |
| `ValueError` | valore del tipo giusto ma non valido (`float("abc")`) | valida l'input |
| `IndexError` | indice oltre la fine della lista | ricorda che si parte da 0 e `len - 1` è l'ultimo |
| `KeyError` | chiave assente in un dizionario | usa `d.get(k, default)` |
| `AttributeError` | metodo o attributo inesistente | `dir(oggetto)` mostra cosa c'è |
| `ModuleNotFoundError` | libreria non installata | `pip install nome` nell'ambiente giusto |
| `ValueError: operands could not be broadcast` | forme NumPy incompatibili | stampa `.shape` degli array |
| `LinAlgError: Singular matrix` | sistema senza soluzione unica | struttura labile o vincoli mancanti |

## Metodo

1. Leggi l'ultima riga.
2. Vai alla riga indicata.
3. Stampa i valori in gioco con `print(repr(x), type(x))`.
4. Riduci il problema a poche righe che riproducono l'errore.
