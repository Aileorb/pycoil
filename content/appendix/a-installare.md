---
letter: A
title: Installare Python sul computer
sources:
  - Python: download ufficiale | https://www.python.org/downloads/
  - Usare Python su Windows | https://docs.python.org/3/using/windows.html
  - Ambienti virtuali e pacchetti, tutorial | https://docs.python.org/3/tutorial/venv.html
  - uv, gestore di progetti Python | https://docs.astral.sh/uv/
  - VS Code e Python | https://code.visualstudio.com/docs/python/python-tutorial
---
Nell'app Python gira nel browser. Per le task avanzate e i progetti serve invece Python **sul computer**, con un editor e un terminale. Questa appendice ti accompagna dall'inizio, anche se non hai mai aperto un terminale.

## 0. Che cos'è il terminale

Il **terminale** (su Windows *PowerShell* o *Terminale*, su macOS *Terminale*) è una finestra in cui scrivi comandi invece di cliccare. Ogni riga che scrivi e confermi con Invio è un comando; il computer risponde sotto. Lavora sempre «dentro» una cartella, la **cartella corrente**, scritta all'inizio della riga.

- **Windows**: tasto Start, scrivi `PowerShell` o `Terminale`, Invio.
- **macOS**: Cmd + Spazio, scrivi `Terminale`, Invio.
- **Linux**: di solito Ctrl + Alt + T.

I quattro comandi che userai di più:

| Comando | Cosa fa |
|---|---|
| `cd nome` | entra nella cartella `nome` (`cd ..` torna su di un livello) |
| `ls` (macOS/Linux) o `dir` (Windows) | elenca i file della cartella corrente |
| `mkdir nome` | crea una cartella |
| freccia su ↑ | richiama il comando precedente |

> [!nota] Negli esempi qui sotto le righe che iniziano con `#` sono commenti: non vanno scritte.

## 1. Installare Python

1. Vai su python.org, sezione *Downloads*, e scarica l'ultima versione stabile (3.12 o successiva).
2. **Windows**: nella prima schermata dell'installazione spunta **"Add python.exe to PATH"**, poi *Install Now*. Senza quella spunta il terminale non trova Python.
3. **macOS**: apri il file `.pkg` e segui i passaggi.
4. Chiudi e riapri il terminale, poi controlla:

```bash
python --version
# risposta attesa: Python 3.12.x (o più recente)
```

Su macOS e Linux il comando può chiamarsi `python3` (e `pip3` invece di `pip`). Su Windows funziona anche `py`.

## 2. Il primo programma

Crea una cartella per i tuoi esercizi, entra e crea un file:

```bash
mkdir pycoil-esercizi
cd pycoil-esercizi
```

Con un qualunque editor (anche il Blocco note, ma meglio VS Code, punto 4) crea nella cartella il file `ciao.py` con questo contenuto:

```python
F = 12_000          # N
A = 80              # mm²
print("σ =", F / A, "MPa")   # → σ = 150.0 MPa
```

Poi dal terminale, nella stessa cartella:

```bash
python ciao.py
# σ = 150.0 MPa
```

Hai appena eseguito uno **script**: un file `.py` che Python legge dall'alto in basso, come nell'app. Se ricevi `No such file or directory`, il terminale non è nella cartella giusta: controlla con `ls` (o `dir`) che `ciao.py` ci sia.

## 3. Un ambiente virtuale per ogni progetto

Le librerie (NumPy, pandas…) si installano con `pip`. Se le installi tutte «nel Python del computer», progetti diversi finiscono per pestarsi i piedi (uno vuole NumPy 1, l'altro NumPy 2). Un **ambiente virtuale** è una cartella `.venv` dentro il progetto con un Python e le sue librerie, separate da tutto il resto.

```bash
mkdir formulario
cd formulario
python -m venv .venv             # crea l'ambiente (una volta sola)
# attivalo, ogni volta che apri un nuovo terminale:
#   Windows:      .venv\Scripts\activate
#   macOS/Linux:  source .venv/bin/activate
pip install numpy matplotlib scipy pytest
```

Quando l'ambiente è attivo, all'inizio della riga del terminale compare `(.venv)`: da quel momento `python` e `pip` sono quelli del progetto. Per uscire: `deactivate`.

> [!trappola] Su Windows PowerShell può rifiutare l'attivazione con un messaggio su *execution policy*. Si risolve una volta per tutte con `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`, poi riprova ad attivare.

In alternativa **uv** fa tutto più in fretta e senza attivazione: `uv init`, `uv add numpy pytest`, `uv run pytest`.

## 4. L'editor

**VS Code** con l'estensione *Python* (di Microsoft) è la scelta più diffusa: evidenziazione, completamento, debugger, terminale integrato, notebook Jupyter. PyCharm Community è un'ottima alternativa.

Come partire con VS Code:

1. *File → Apri cartella* e scegli la cartella del progetto.
2. Installa l'estensione Python (icona dei quadratini a sinistra, cerca «Python»).
3. Ctrl + Shift + P → *Python: Select Interpreter* → scegli quello con `.venv`.
4. *Terminale → Nuovo terminale*: si apre già nella cartella giusta e con l'ambiente attivo.
5. Apri un file `.py` e premi il triangolo ▷ in alto a destra per eseguirlo.

## 5. Lanciare i test di un progetto

Metti nella stessa cartella il tuo file (per esempio `formulario.py`) e il test scaricato dall'app (per esempio `test_formulario.py`), poi, con l'ambiente attivo:

```bash
pytest -q
# ....                [100%]
# 4 passed in 0.03s
```

Un punto per ogni test superato. Se un test fallisce, pytest mostra una `F`, la riga del test e i due valori confrontati: il tuo e quello atteso. Correggi, salva, rilancia `pytest -q`. Quando è tutto verde, nell'app segna la task come **Completata**.

## Se qualcosa non va

| Messaggio | Causa | Rimedio |
|---|---|---|
| `python` non è riconosciuto / `command not found` | Python non è nel PATH | reinstalla spuntando *Add to PATH*, oppure usa `py` (Windows) o `python3` |
| `ModuleNotFoundError: No module named 'numpy'` | libreria non installata **in questo** ambiente | attiva `.venv` e `pip install numpy` |
| `pip` installa ma Python non trova la libreria | `pip` e `python` sono di ambienti diversi | usa `python -m pip install ...`, che installa sempre per il `python` giusto |
| `No such file or directory` | il terminale è in un'altra cartella | `cd` nella cartella del progetto, controlla con `ls`/`dir` |
| `pytest` non trovato | pytest non installato nell'ambiente | `python -m pip install pytest`, oppure `python -m pytest -q` |

## Riepilogo

- Il terminale esegue comandi nella cartella corrente: `cd`, `ls`/`dir`, `mkdir`.
- Installa Python da python.org (su Windows spunta *Add to PATH*) e controlla con `python --version`.
- Uno script si lancia con `python nome.py` dalla sua cartella.
- Un ambiente virtuale per progetto: `python -m venv .venv`, attivalo, poi `pip install ...`.
- VS Code: apri la cartella, scegli l'interprete `.venv`, usa il terminale integrato.
- `pytest -q` lancia i test; quando sono verdi la task è completata.
