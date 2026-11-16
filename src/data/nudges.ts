// Frasi delle notifiche giornaliere: un po' provocatorie, sempre educate.
// Le usa il Worker (worker/schedule.ts): una diversa ogni giorno.

export const NUDGES: string[] = [
  'Il pitone si è arrotolato vicino al telefono. Aspetta te, non le notifiche degli altri.',
  'Dieci minuti di Python: meno di quanto Excel impiega ad aprire quel file da 40 MB.',
  'Le tue 3 task sono in coda come un job sul cluster. Solo che questo dura dieci minuti.',
  'print("Ciao") era il primo passo. Il secondo è aprire l’app.',
  'Il pitone non giudica. Al massimo ti fissa, senza sbattere le palpebre.',
  'Un ingegnere che rimanda è un ingegnere che poi fa i calcoli a mano. Coraggio.',
  'Oggi niente task? Sarebbe un IndentationError nella tua settimana.',
  'Hai tempo per lo scroll infinito, quindi hai tempo per un ciclo for finito.',
  'Le task di oggi pesano meno di una trave in legno. Molto meno.',
  'while not fatto: apri_pycoil()',
  'Nessuna eccezione oggi: né nel codice, né nelle scuse.',
  'La costanza è come la compilazione: in Python non serve, ma ai risultati sì.',
  'Tre esercizi. Nessun esame, nessun voto, nessun relatore che guarda.',
  'Il tuo codice di domani ringrazia il te di stasera. In anticipo.',
  'Ogni giorno saltato è un commento # TODO che nessuno toglierà mai.',
  'Il pitone ha messo il cappellino. Sarebbe scortese farlo aspettare.',
  'Se stai leggendo questo, il dito è già sul telefono. Manca solo un tocco.',
  'try: dieci_minuti() except Pigrizia: pass. No, non così.',
  'Una spira al giorno, e a fine mese la molla ha un’altra rigidezza.',
  'Le liste in Python partono da zero. La tua streak, se oggi salti, pure.',
  'Dieci minuti adesso o un’ora di Stack Overflow fra un mese. Scegli tu.',
  'I tuoi colleghi usano ancora la calcolatrice. Tu stasera puoi fare di meglio.',
  'Python è interpretato. La tua scusa di oggi, invece, non regge.',
  'Promemoria gentile, con un pizzico di insistenza: le 3 task di oggi.',
  'Il ripasso di oggi è facile. Ma è facile solo oggi.',
  'Un import alla volta, un giorno alla volta.',
  'Anche il più lungo dei pitoni ha cominciato da un uovo. Tu da 3 task.',
  'Il debugger più efficace è la pratica quotidiana. Si apre da qui.',
  'Dieci minuti di Python non hanno mai fatto crollare un ponte. Saltarli, chissà.',
  'Fare le task oggi è O(1). Recuperarle a fine settimana è O(n²).',
  'La giornata non è ancora finita, e nemmeno le tue task.',
  'Nessuno ti obbliga. È proprio per questo che vale.',
  'Il cervello è come un acciaio: incrudisce con i cicli giusti.',
  'Un giorno saltato è un caso. Due sono un pattern. Oggi rompiamo il pattern.',
  'Le scuse non passano i test. Le tue 3 task sì.',
  'Il pitone sta facendo stretching. Tu fai solo dieci minuti di Python.',
  'return alla_streak: le task di oggi aspettano solo te.',
  'C’è chi impara Python e chi dice che lo farà dopo la sessione. Tu da che parte stai?',
  'Tre task: leggere, prevedere, scrivere. Più semplice di una tabella pivot.',
  'Chiudi la giornata in bellezza: 3 task e il pitone si arrotola felice.'
];

/** Quando c'è una streak in gioco. {s} = giorni di fila. */
export const STREAK_NUDGES: string[] = [
  'La tua streak di {s} giorni sta guardando l’orologio. Anche tu?',
  '{s} giorni di fila: sarebbe un peccato fermarsi proprio oggi.',
  'Non spezzarla: dieci minuti e domani i giorni di fila saranno più di {s}.',
  '{s} giorni consecutivi. Il pitone ha già preparato il cappellino per il prossimo.',
  'Una streak di {s} giorni non si costruisce per caso. Nemmeno quella di domani.'
];

export function pickNudge(list: string[], seed: number, streak = 0): string {
  return list[Math.abs(Math.floor(seed)) % list.length].replace(/\{s\}/g, String(streak));
}
