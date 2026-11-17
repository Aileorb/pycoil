---
letter: E
title: Glossario
---
I termini del libro in ordine alfabetico, ognuno con un esempio minimo. Tra parentesi la parte in cui il concetto viene spiegato.

**API web** — un servizio che risponde a richieste HTTP con dati (di solito JSON) invece che con pagine da leggere. (Parte IX)

**Argomento** — il valore che passi a una funzione quando la chiami: in `area(20)` l'argomento è `20`. Il nome che lo riceve nella definizione è il **parametro**. (Parte 0)

**Array** — tabella di numeri dello stesso tipo (NumPy), con operazioni elemento per elemento: `np.array([1, 2, 3]) * 2` dà `[2 4 6]`. (Parte III)

**Assegnazione** — dare un nome a un valore con `=`: `F = 1200` vuol dire «da ora `F` indica 1200», non «F è uguale a 1200» in senso matematico. Il confronto si scrive `==`. (Parte 0)

**Attributo** — un dato che appartiene a un oggetto, letto con il punto: `trave.L`, `array.shape`. (Parte II)

**Booleano** (`bool`) — il tipo con due soli valori, `True` e `False`, risultato dei confronti: `350 > 235` vale `True`. (Parte 0)

**Broadcasting** — regola con cui NumPy combina array di forme diverse espandendo le dimensioni di lunghezza 1. (Parte III)

**Ciclo** — ripetere un blocco di codice: `for` scorre gli elementi di una sequenza, `while` ripete finché una condizione è vera. (Parte 0)

**Classe** — lo «stampo» che descrive un tipo di oggetto (dati e metodi); ogni oggetto creato dalla classe è una sua **istanza**: `t = Trave(4.0)`. (Parte II)

**Commento** — testo dopo `#`, ignorato da Python, che spiega il codice a chi lo legge: `L = 4.0  # m`. (Parte 0)

**Commit** — una fotografia del progetto salvata da Git, con un messaggio che descrive cosa è cambiato. (Parte IX)

**Comprehension** — espressione compatta che costruisce una lista, un dizionario o un insieme da un'altra sequenza: `[x**2 for x in range(4)]` dà `[0, 1, 4, 9]`. (Parte I)

**Condizione** — un'espressione vera o falsa che decide quale ramo eseguire in un `if`/`elif`/`else`. (Parte 0)

**Database** — archivio di dati organizzato in tabelle, interrogato con SQL; SQLite lo tiene in un solo file. (Parte IX)

**Dataclass** — classe che contiene soprattutto dati; `@dataclass` ne scrive `__init__`, `__repr__` ed `__eq__`. (Parte II)

**Dizionario** (`dict`) — raccolta di coppie chiave → valore: `fy = {"S235": 235, "S355": 355}`, poi `fy["S355"]` dà `355`. (Parte I)

**Docstring** — la stringa tra tripli apici subito sotto `def`, che descrive cosa fa la funzione; la mostra `help()`. (Parte I)

**Dunder** — metodo speciale con doppio trattino basso (`__len__`, `__add__`), chiamato dagli operatori. (Parte II)

**Eccezione** — oggetto che segnala un errore e interrompe il flusso finché qualcuno non lo gestisce con `except`. (Parti 0 e I, appendice C)

**Espressione** — qualunque pezzo di codice che produce un valore: `F / A`, `len(lista)`, `x > 0`. (Parte 0)

**Espressione regolare** — (*regex*) schema che descrive la forma di un testo, per cercarlo ed estrarlo: `r"\d+\.\d+"` trova i numeri decimali. (Parte IX)

**f-string** — stringa preceduta da `f` in cui si inseriscono espressioni tra graffe: `f"σ = {sigma:.1f} MPa"`. (Parte 0, appendice D)

**float** — numero con la virgola (in Python si scrive col punto): `2.5`, `1e-3`. È un'approssimazione binaria: `0.1 + 0.2` dà `0.30000000000000004`. (Parte 0)

**Funzione** — un blocco di codice con un nome, che riceve argomenti e restituisce un risultato con `return`; si definisce con `def`. (Parte 0)

**Generatore** — funzione con `yield` che produce valori uno alla volta, senza tenerli tutti in memoria. (Parte II)

**Git** — il sistema di controllo di versione: tiene la storia del codice e permette di tornare indietro e lavorare in gruppo. (Parte IX)

**Idempotente** — si dice di uno script che, lanciato due volte, dà lo stesso risultato che lanciato una: requisito degli script pianificati. (Parte IX)

**Immutabile** — oggetto che non può cambiare dopo la creazione (`int`, `float`, `str`, `tuple`). (Parte I)

**Indice** — la posizione di un elemento in una sequenza, **da 0**: in `v = [10, 20, 30]`, `v[0]` è `10` e `v[-1]` è l'ultimo, `30`. (Parte 0)

**int** — numero intero: `3`, `-12`, `12_000` (il trattino basso separa le migliaia ed è ignorato). (Parte 0)

**Interprete** — il programma `python` che legge il tuo codice ed esegue le istruzioni una alla volta. (Appendice A)

**Iterabile** — qualunque oggetto su cui si può fare `for` (liste, stringhe, file, dizionari, `range`). (Parte II)

**JSON** — formato di testo per scambiare dati tra programmi: oggetti `{}` e array `[]`, che in Python diventano dizionari e liste. (Parti VIII e IX)

**Libreria** — codice scritto da altri da importare e usare: NumPy, pandas, SciPy. Si installa con `pip` e si carica con `import`. (Parte I)

**Lista** (`list`) — sequenza ordinata e modificabile di valori: `carichi = [10, 25, 40]`; `carichi.append(55)` aggiunge in fondo. (Parte 0)

**Metodo** — una funzione che appartiene a un oggetto, chiamata con il punto: `testo.upper()`, `lista.append(x)`. (Parte 0)

**Modulo** — file `.py` che si importa; un **pacchetto** è una cartella di moduli. (Parte I)

**Mutabile** — oggetto modificabile sul posto (`list`, `dict`, `set`, array NumPy). (Parte I)

**None** — il valore che significa «niente»; è ciò che restituisce una funzione senza `return`. (Parte 0)

**Notebook** — documento (Jupyter) che alterna celle di codice, risultati e testo: comodo per esplorare dati e scrivere relazioni. (Parte II)

**Oggetto** — qualunque valore in Python (un numero, una lista, una trave): ha un tipo, dei dati e dei metodi. (Parte II)

**Pacchetto** — cartella di moduli con un file `__init__.py`; con un `pyproject.toml` si installa con pip. (Parti I e IX)

**Pattern matching** — l'istruzione `match` che confronta un valore con la sua forma. (Parte II)

**pip** — l'installatore di librerie Python dal Python Package Index (PyPI): `python -m pip install numpy`. (Parte II, appendice A)

**Pyodide** — Python compilato in WebAssembly: è il motore che esegue il codice in questa app. (Appendice G)

**Script** — file `.py` che si esegue dal terminale con `python nome.py`. (Parte 0, appendice A)

**Slicing** — estrazione di una porzione di sequenza con `inizio:fine:passo`: `v[1:3]` prende gli elementi 1 e 2, la fine è esclusa. (Parte 0)

**Sottoprocesso** — un altro programma lanciato da Python con `subprocess.run`, di cui si leggono il codice di uscita e l'output. (Parte IX)

**SQL** — il linguaggio dei database: `SELECT`, `INSERT`, `UPDATE`, `DELETE`, `WHERE`, `GROUP BY`. (Parte IX)

**Stringa** (`str`) — testo tra virgolette: `"S355"`. `"3"` è un testo, non un numero: per calcolarci serve `float("3")`. (Parte 0)

**Terminale** — la finestra in cui si scrivono comandi (PowerShell, Terminale). (Parte 0, appendice A)

**Test** — codice che controlla automaticamente che un'altra funzione dia il risultato atteso; con pytest sono funzioni che iniziano con `test_` e usano `assert`. (Parte II)

**Tipo** — la natura di un valore (`int`, `float`, `str`, `list`…), che decide quali operazioni sono permesse; lo mostra `type(x)`. (Parte 0)

**Traceback** — il resoconto di un errore, da leggere dal basso. (Parte 0, appendice C)

**Tupla** (`tuple`) — sequenza come la lista ma immutabile, scritta con le tonde: `punto = (3.0, 4.5)`. (Parte I)

**Type hint** — annotazione facoltativa del tipo (`def f(x: float) -> float`), controllabile con strumenti come mypy. (Parte II)

**Variabile** — un nome che si riferisce a un valore: dopo `L = 4.0`, scrivere `L` equivale a scrivere `4.0`. (Parte 0)

**Vettorizzazione** — scrivere il calcolo su interi array invece che con cicli elemento per elemento. (Parte III)

**Virtual environment** — cartella con un Python e le librerie di un singolo progetto. (Parte II, appendice A)
