---
letter: A
title: Installare Python sul computer
sources:
  - Python: download ufficiale | https://www.python.org/downloads/
  - uv, gestore di progetti Python | https://docs.astral.sh/uv/
  - VS Code e Python | https://code.visualstudio.com/docs/python/python-tutorial
---
Nell'app Python gira nel browser. Per le task avanzate e i progetti serve invece Python **sul computer**, con un editor e un terminale.

## 1. Python

Scarica l'ultima versione stabile da python.org. Su Windows spunta **"Add python.exe to PATH"** durante l'installazione. Controlla dal terminale:

```bash
python --version
```

Su macOS e Linux il comando può chiamarsi `python3`.

## 2. Un ambiente virtuale per ogni progetto

Un ambiente virtuale tiene le librerie di un progetto separate da quelle degli altri.

```bash
mkdir formulario && cd formulario
python -m venv .venv
# Windows:      .venv\Scripts\activate
# macOS/Linux:  source .venv/bin/activate
pip install numpy matplotlib scipy pytest
```

In alternativa **uv** fa tutto più in fretta: `uv init`, `uv add numpy pytest`, `uv run pytest`.

## 3. L'editor

**VS Code** con l'estensione Python è la scelta più diffusa: evidenziazione, completamento, debugger, terminale integrato, notebook Jupyter. PyCharm Community è un'ottima alternativa.

## 4. Lanciare i test di un progetto

Metti nella stessa cartella il tuo file (per esempio `formulario.py`) e il test scaricato dall'app, poi:

```bash
pytest -q
```

Un punto verde per ogni test superato; in caso di errore pytest ti mostra la riga e i valori confrontati.
