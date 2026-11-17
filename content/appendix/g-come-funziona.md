---
letter: G
title: Come funziona PyCoil
sources:
  - Pyodide | https://pyodide.org/
  - Codice sorgente di PyCoil | https://github.com/Aileorb/pycoil
---
## Ogni giorno

La giornata si apre con l'**introduzione**: la scheda della sezione nuova, da leggere prima di cominciare. Poi tre micro-task da circa dieci minuti in tutto, pensate per il telefono: **Prevedi** (indovina l'output di un frammento di codice) e **Scrivi** (completa un esercizio verificato da test). Ogni sezione ha tre esercizi: di solito due sono sul concetto del giorno e il terzo è un **ripasso** di qualcosa che hai visto qualche giorno prima. Gli esercizi non anticipano mai argomenti che non hai ancora introdotto. Completarle tutte e tre mantiene viva la **streak**.

Le due task **avanzate** sono facoltative e da fare al computer: prima esercizi più lunghi (*kata*), poi, quando hai padronanza di una Parte, le tappe di uno dei dieci **progetti**. Arrivano solo quando hai visto gli argomenti che servono: il primo kata compare dopo `if`. Si verificano nell'app incollando il file; dalla fine della Parte II li lancerai anche al computer con pytest. Alcuni kata della Parte IX (per esempio quello che pilota un programma esterno) si possono fare **solo al computer**, perché il browser non può lanciare altri programmi: lo dice il testo della task.

## Tre tentativi

Negli esercizi *Prevedi* e *Scrivi*, e nelle verifiche delle task avanzate, una risposta sbagliata **non** mostra la soluzione: hai **tre tentativi**. Dopo il terzo errore la soluzione compare da sola, con la spiegazione. I tentativi restano contati fino a fine giornata, anche se chiudi e riapri la task. Puoi chiedere i suggerimenti quando vuoi, ma la task non conterà più come "giusta al primo colpo".

## Ripasso

Le sezioni imparate tornano come esercizi dopo 1, 3, 7, 14 e 30 giorni (ripetizione dilazionata).

## Punti e livelli

| Azione | Punti |
|---|---|
| Task completata | +10 |
| Giusta al primo colpo | +5 |
| Sezione letta fino in fondo | +2 |
| Parte letta tutta | +10 |
| Task avanzata | +40 |
| Giornata completa | +10 |

Ogni giorno di streak aggiunge l'1% ai punti, fino al +50%. Un progetto si sblocca con la Parte prerequisito letta all'80% e il 70% degli esercizi *Scrivi* giusti al primo colpo.

## Leggerezza e privacy

- I testi del libro e degli esercizi **non** sono salvati sul telefono: si scaricano da GitHub quando li apri.
- Sul dispositivo restano solo i testi e le soluzioni delle task **di oggi**, cancellati il giorno dopo, e i tuoi contatori (task fatte, punti, streak, preferiti).
- L'**account è facoltativo**. Senza, i progressi restano sul dispositivo (puoi esportarli e importarli dalle Impostazioni).
- Con un account (*Impostazioni › Account e sincronizzazione*) ritrovi gli stessi progressi su iPhone, iPad e computer. Si entra con una **passkey**, senza password: Face ID, Touch ID o il PIN del dispositivo. La passkey resta nel Portachiavi di iCloud (o nel gestore di password del sistema); il server conserva solo la sua chiave pubblica. Sul server finiscono gli stessi contatori che stanno sul telefono (task fatte, sezioni lette, punti, streak, preferiti, il piano del giorno), mai nome, email o codice scritto. Promemoria e orario restano di ogni singolo dispositivo. Su un dispositivo nuovo, alla prima apertura, tocca «Hai già un account? Accedi con la passkey».
- Se due dispositivi lavorano mentre sono offline, alla prima connessione i progressi si **uniscono**: si tengono le task e le sezioni di entrambi e i punti si sommano. Il piano del giorno è lo stesso ovunque. *Elimina l'account* cancella tutto dal server, mentre su ogni dispositivo i progressi restano.
- Il **promemoria giornaliero** è facoltativo e si regola in *Impostazioni › Promemoria*. Se lo attivi, il server dell'app (un Worker Cloudflare) conosce solo un codice casuale del dispositivo, l'indirizzo a cui mandare la notifica, l'orario e il fuso, la streak e l'ultimo giorno in cui hai finito le 3 task: così, se hai già finito, non ti scrive. Su iPhone le notifiche funzionano con PyCoil aperta dall'icona sulla schermata Home.
- Python gira nel browser con **Pyodide**, scaricato la prima volta che esegui del codice (circa 13 MB, più le librerie che gli esercizi usano). In **Impostazioni › Spazio usato** vedi quanto occupa ogni parte e puoi liberare le librerie che non servono più per la Parte in cui sei arrivato.
