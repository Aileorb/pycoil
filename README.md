<p align="center"><img src="assets/icon-1024.png" width="120" alt="Icona di PyCoil: un uroboro verde"></p>

# PyCoil

**Python per ingegneri, una spira al giorno.**

PyCoil è una web app installabile (PWA) che insegna Python a chi studia ingegneria meccanica: tre micro-task al giorno da circa dieci minuti dal telefono, più due task avanzate facoltative da fare al computer.

**App:** https://aileorb.github.io/pycoil/ · su iPhone: Condividi → *Aggiungi alla schermata Home*.

## Cosa fa

| Tab | Contenuto |
|---|---|
| **Oggi** | Streak con il pitone che festeggia sempre di più (dorato dai 30 giorni, scheletro se la perdi), frase di sfida, l'introduzione al concetto del giorno, le 3 task (*Prevedi* e *Scrivi*, sul concetto nuovo o di ripasso) e le 2 avanzate (kata o tappe di progetto), che arrivano solo sugli argomenti già visti. Tre tentativi per esercizio prima che compaia la soluzione. |
| **Percorso** | Il libro: Parti → capitoli → sezioni, spunta verde quando arrivi in fondo, precedente/successiva, ricerca, preferiti con la stella, progetti, librerie da sapere, appendice. |
| **Statistiche** | Lo stadio di crescita (uovo → uovo crepato → occhio nel buio → piccolo → pitone → pitone beato sul ramo) con un cielo che schiarisce verso l'alba, livello e XP, capacità raggiunte, grafico settimanale. |

Alla prima apertura un test di livello sceglie il punto di partenza: Principiante → Parte 0, Base → Parte I, Intermedio → Parte II, Avanzato → Parte III.

Il codice Python gira **nel browser** con [Pyodide](https://pyodide.org/) (Python 3.14, con NumPy, SciPy, Matplotlib, pandas, SymPy, CoolProp…), dentro un Web Worker caricato solo al primo «Esegui».

## Leggerezza e dati

- Il bundle dell'app pesa circa **100 KB gzip** (limite verificato in build: 150 KB).
- Libro, esercizi e documentazione **non** stanno nell'app né nella cache offline: sono JSON pubblicati su GitHub Pages (con riserva su jsDelivr dal branch `content`) e scaricati quando servono.
- Sul dispositivo (IndexedDB) restano solo:
  - `pycoil:state`: ID e contatori (task fatte, XP, streak, sezioni lette, progetti, preferiti);
  - `pycoil:today`: testi e soluzioni delle task **di oggi**, cancellati al cambio di giorno.
- Il motore Python (Pyodide, ~13 MB) e le librerie si salvano nella cache `pycoil-python` solo quando servono. **Impostazioni › Spazio usato** mostra i valori reali del dispositivo e libera le librerie che non servono più dalla Parte attuale in poi (né ai ripassi o al progetto in corso); se servono di nuovo si riscaricano da sole.
- Nessun account, nessun server, nessun tracciamento. Esporta e importa i progressi dalle Impostazioni.

## Struttura

```
content/            sorgenti didattici (Markdown + JSON) → public/content/*.json
  book.json         Parti, capitoli, sezioni (una sezione senza .md compare come "in arrivo")
  sections/*.md     testo delle sezioni; il pezzo prima di <!-- /card --> è la scheda "Impara"
  tasks/<sez>.json  esercizi Prevedi e Scrivi della sezione
  katas.json        task avanzate brevi (al computer, con file pytest)
  projects/<id>/    i 9 progetti a tappe, a difficoltà crescente
  libraries*        le librerie da sapere assolutamente
  appendix/*.md     appendice A–G
  quiz.json         test di livello iniziale
scripts/
  build-content.mjs converte e valida i contenuti (Markdown → HTML evidenziato)
  verify_content.py ESEGUE con CPython tutti gli esempi, le soluzioni e i test
  check_order.py    controlla che nulla usi costrutti spiegati più avanti
  check-budget.mjs  controlla il peso del bundle e che i contenuti non finiscano in cache
  build-icons.mjs   genera le icone dall'SVG dell'uroboro
src/
  engine/           logica pura e testata: date, streak, XP, livelli, pianificazione, ripasso
  py/, workers/     esecuzione Python con Pyodide
  components/       mascotte e scene animate (SVG), sheet delle task, editor, preferiti
  screens/          Oggi, Percorso, pagina di lettura, Statistiche, Benvenuto, Impostazioni
tests/              Vitest: motore + simulazione di 60 giorni sui contenuti veri
```

## Sviluppo

Serve Node 22. Per verificare i contenuti serve anche Python 3.12+.

```bash
npm install
npm run dev               # genera i contenuti e avvia Vite
npm test                  # test del motore
npm run build             # contenuti + tipi + bundle + budget
pip install -r requirements-content.txt
npm run verify:content    # esegue davvero tutto il codice dei contenuti
```

Ogni push su `main` esegue la stessa pipeline in GitHub Actions e, se tutto è verde, pubblica la build sul branch `gh-pages` e i soli contenuti sul branch `content`.

**Attivazione di GitHub Pages (una volta sola):** *Settings → Pages → Build and deployment → Source: Deploy from a branch → `gh-pages` / `(root)` → Save*. Dopo un minuto l'app è su https://aileorb.github.io/pycoil/.

## Scrivere contenuti

**Sezione** (`content/sections/03-01-01.md`):

```markdown
---
card: Titolo della scheda Impara
sources:
  - Etichetta | https://url
---
Testo della scheda (circa 3 minuti di lettura)…

<!-- /card -->

## Approfondimento
```

- ` ```python ` crea un blocco eseguibile con il pulsante *Esegui* (i grafici Matplotlib compaiono sotto); ` ```python norun ` solo evidenziato; altri linguaggi diventano blocchi di output.
- Riquadri: `> [!trappola]`, `> [!c]`, `> [!java]`, `> [!nota]`, `> [!ing]`, `> [!desktop]`.

**Esercizi** (`content/tasks/03-01-01.json`): un array di

```json
{ "kind": "prevedi", "title": "…", "code": "print(1 + 1)", "options": ["2", "11"], "answer": 0, "explain": "…" }
{ "kind": "scrivi", "title": "…", "prompt": "…", "starter": "…", "tests": "assert …, \"messaggio\"", "solution": "…", "hints": ["…"] }
```

Gli ID si generano da soli (`prevedi-03-01-01-a`, …). `verify_content.py` controlla che l'output di ogni *Prevedi* coincida con l'opzione giusta, che ogni soluzione passi i test e che lo starter no.

**Progetti** (`content/projects/pN/project.json`): `steps` con `prompt`, `solution`, `test` (file pytest) e `hints`. Le soluzioni delle tappe si sommano nel modulo indicato da `module`. Un progetto con `steps: []` compare come «in arrivo».

## Contenuti

| Parte | Argomento | Sezioni |
|---|---|---|
| 0 | Primi passi: variabili, funzioni, liste, if, cicli, leggere gli errori | 10 |
| I | Python solido: collezioni, comprehension, ambito delle variabili, file, eccezioni, moduli | 10 |
| II | Python idiomatico: classi, dunder, ereditarietà, dataclass, `match`, generatori, decoratori, type hint, strumenti | 12 |
| III | NumPy e Matplotlib | 8 |
| IV | Metodi numerici con SciPy: radici, integrali, fit, ODE, problemi ai limiti, ottimizzazione, FFT | 7 |
| V | Dati sperimentali: pandas, statistica delle prove, unità con pint, incertezza | 8 |
| VI | Calcolo simbolico con SymPy e Lagrange | 3 |
| VII | CoolProp, meccanismi, fatica, FEM 1D/2D, CadQuery | 7 |
| VIII | Script, Excel, Arduino, prestazioni, modelli predittivi | 5 |

Più 210 esercizi *Prevedi*/*Scrivi* (tre per sezione), 22 kata e 9 progetti (formulario delle sezioni, catalogo materiali, trave appoggiata, vibrazioni di un albero, prova di trazione, collegamento bullonato, ciclo Rankine, FEM 2D con elementi CST, collaudo automatico), tutti verificati eseguendo il codice. Un'analisi automatica controlla anche che nessun esempio o esercizio usi costrutti spiegati più avanti.

Nell'app, `pint`, `openpyxl` e `scikit-fem` (non inclusi in Pyodide) si installano da PyPI con micropip al primo uso.

## Fonti del percorso

Tutorial ufficiale di Python, *Think Python* (Downey), *Python Programming and Numerical Methods* (Kong, Siauw, Bayen, UC Berkeley), *Scientific Python Lectures*, *Fluent Python* (Ramalho), *Effective Python* (Slatkin). Il dettaglio è nell'appendice F e in fondo a ogni sezione.
