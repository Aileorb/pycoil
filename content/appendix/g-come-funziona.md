---
letter: G
title: Come funziona PyCoil
sources:
  - Pyodide | https://pyodide.org/
  - Codice sorgente di PyCoil | https://github.com/Aileorb/pycoil
---
## Ogni giorno

La giornata si apre con l'**introduzione**: la scheda della sezione nuova, da leggere prima di cominciare. Poi tre micro-task da circa dieci minuti in tutto, pensate per il telefono: **Prevedi** (indovina l'output di un frammento di codice) e **Scrivi** (completa un esercizio verificato da test). Ogni sezione ha tre esercizi: di solito due sono sul concetto del giorno e il terzo è un **ripasso** di qualcosa che hai visto qualche giorno prima. Gli esercizi non anticipano mai argomenti che non hai ancora introdotto. Completarle tutte e tre mantiene viva la **streak**.

Le due task **avanzate** sono facoltative e da fare al computer: prima esercizi più lunghi (*kata*), poi, quando hai padronanza di una Parte, le tappe di uno dei nove **progetti**. Arrivano solo quando hai visto gli argomenti che servono: il primo kata compare dopo `if`. Si verificano nell'app incollando il file; dalla fine della Parte II li lancerai anche al computer con pytest.

## Tre tentativi

Negli esercizi *Prevedi* e *Scrivi*, e nelle verifiche delle task avanzate, una risposta sbagliata **non** mostra la soluzione: hai **tre tentativi**. Dopo il terzo errore la soluzione compare da sola, con la spiegazione. I tentativi restano contati fino a fine giornata, anche se chiudi e riapri la task. Puoi chiedere i suggerimenti quando vuoi, ma la task non conterà più come "giusta al primo colpo".

## Ripasso

Le sezioni imparate tornano come esercizi dopo 1, 3, 7, 14 e 30 giorni (ripetizione dilazionata).

## Punti e livelli

| Azione | Punti |
|---|---|
| Task completata | 10 |
| Giusta al primo colpo | +5 |
| Sezione letta fino in fondo | 2 |
| Parte letta tutta | +10 |
| Task avanzata | 40 |
| Giornata completa | +10 |

Ogni giorno di streak aggiunge l'1% ai punti, fino al +50%. Un progetto si sblocca con la Parte prerequisito letta all'80% e il 70% degli esercizi *Scrivi* giusti al primo colpo.

## Leggerezza e privacy

- I testi del libro e degli esercizi **non** sono salvati sul telefono: si scaricano da GitHub quando li apri.
- Sul dispositivo restano solo i testi e le soluzioni delle task **di oggi**, cancellati il giorno dopo, e i tuoi contatori (task fatte, punti, streak, preferiti).
- Non ci sono account né server: niente lascia il tuo dispositivo. Puoi esportare e importare i progressi dalle Impostazioni.
- Python gira nel browser con **Pyodide**, scaricato la prima volta che esegui del codice (circa 13 MB, più le librerie che gli esercizi usano). In **Impostazioni › Spazio usato** vedi quanto occupa ogni parte e puoi liberare le librerie che non servono più per la Parte in cui sei arrivato.
