// Frasi di sfida della Home: cambiano ogni giorno e si adattano allo stato.
// {n} = task mancanti, {s} = streak, {h} = ore alla mezzanotte.
export const PENDING = [
  'Tre esercizi. Dieci minuti. Il tuo io di domani ringrazia.',
  'Una spira al giorno e la molla regge qualsiasi carico.',
  'Nessuna trave si progetta da sola: nemmeno il codice.',
  'Ti mancano {n} task. Il pitone ha già il cappellino in mano.',
  'Dieci minuti ora valgono un pomeriggio prima dell’esame.',
  'MATLAB costa una licenza. Python solo dieci minuti al giorno.',
  'Il primo grafico decente vale più di cento slide.',
  'Chi automatizza i calcoli, ha tempo per pensare al progetto.',
  'Oggi un concetto, domani uno strumento.',
  'Ogni ingegnere ha un foglio Excel che vorrebbe buttare. Comincia da qui.',
  'Python non morde. Il pitone forse sì, se salti la giornata.',
  'Leggi, prevedi, scrivi: tre mosse e hai finito.',
  'Il coefficiente di sicurezza della tua carriera? La costanza.',
  'Mancano {n} esercizi: meno del tempo di un caffè al distributore.',
  'Un for ben scritto vale una notte di calcoli a mano.',
  'Le tensioni ammissibili non si calcolano da sole. Ancora per poco.',
  'Ogni bug trovato oggi è un errore in meno nella relazione.',
  'Il tuo futuro relatore ama i grafici fatti bene.',
  'Piccoli carichi, ripetuti ogni giorno: è così che si allena una molla.',
  'Non serve un genio, serve un’abitudine.',
  'Dieci minuti. Niente scuse, nemmeno la sessione.',
  'Il pitone è sveglio e aspetta la tua prima risposta.',
  'Più spire, più elasticità: anche per il cervello.',
  'Oggi impari una cosa che il te di ieri non sapeva.',
  'La differenza tra un file Excel e uno script? Lo riusi domani.',
  'Una funzione oggi, un progetto domani.',
  'Il codice ha una sola tolleranza: zero errori di sintassi.',
  'Prima il concetto, poi la pratica, poi il ripasso. Via.',
  'Sei a {n} task da una giornata completa.',
  'Un esercizio in metro, uno in coda, uno a letto. Fatto.',
  'Il miglior momento per imparare Python era ieri. Il secondo è adesso.',
  'L’ingegnere pigro automatizza. Sii l’ingegnere pigro.',
  'NumPy ti aspetta, ma prima le basi.',
  'Ogni riga che capisci oggi è una riga che non copi domani.',
  'Dieci minuti di Python non hanno mai rovinato una giornata.',
  'Il tuo io del futuro è già fiero. Non deluderlo.'
];

export const AT_RISK = [
  'Mancano {h} ore: la tua streak di {s} giorni ti guarda.',
  'Ancora {h} ore per salvare {s} giorni di fila. Bastano dieci minuti.',
  'Il pitone sta preparando lo zaino. Tienilo qui: {n} task e hai finito.',
  'Sono le ultime ore della giornata: {s} giorni di streak valgono {n} esercizi.',
  'Stanotte il pitone dorme sereno solo se finisci le task.',
  'Tic tac: {h} ore e la streak torna a zero.'
];

export const DONE = [
  'Fatto. Vuoi alzare l’asticella con una task avanzata?',
  'Giornata chiusa. Hai tempo per un passo del progetto?',
  'Tre su tre. Il pitone fa la ola.',
  'Missione compiuta. Domani si riparte da qui.',
  'Spira aggiunta. La molla è più forte di ieri.',
  'Ottimo lavoro: ora un ripasso nel Percorso, se ti va.',
  'Giornata completa. Il resto della serata è tuo.',
  'Hai finito: il pitone può tornare a sonnecchiare tranquillo.'
];

export const LOST = [
  'La streak si è spezzata. Le ossa si rimettono insieme con tre esercizi.',
  'Anche i pitoni cambiano pelle. Ricomincia oggi.',
  'Zero è solo un numero di partenza. Tre task e si riparte.',
  'Una giornata saltata non cancella quello che sai. Riprendi da qui.',
  'Il pitone è diventato un mucchio d’ossa. Riportalo in vita.'
];

export const FIRST = [
  'Primo giorno: tre piccoli esercizi e la tua prima spira.',
  'Si comincia. Dieci minuti e il primo uovo si scalda.'
];

export function pickPhrase(list: string[], seed: number, vars: Record<string, string | number>): string {
  const p = list[seed % list.length];
  return p.replace(/\{(\w)\}/g, (_, k: string) => String(vars[k] ?? ''));
}
