import { useState } from 'react';
import { useStore } from '../store';
import { CoiledSnake } from '../components/Snake';
import { Check, Todo } from '../components/icons';
import type { LevelId, QuizQuestion } from '../engine/types';
import { highlightLite } from '../components/highlight';

const LEVELS: { id: LevelId; name: string; desc: string; start: string }[] = [
  { id: 'principiante', name: 'Principiante', desc: 'Non ho mai programmato: spiegami tutto da zero.', start: 'Si parte dalla Parte 0 · Primi passi' },
  { id: 'base', name: 'Base', desc: 'So cosa sono variabili, cicli e condizioni (anche da C).', start: 'Si parte dalla Parte I · Python solido' },
  { id: 'intermedio', name: 'Intermedio', desc: 'Programmo già bene, voglio scrivere Python come si deve.', start: 'Si parte dalla Parte II · Python idiomatico' },
  { id: 'avanzato', name: 'Avanzato', desc: 'Python lo so: portami alle librerie per l’ingegneria.', start: 'Si parte dalla Parte III · NumPy e Matplotlib' }
];
const ORDER: LevelId[] = ['principiante', 'base', 'intermedio', 'avanzato'];

export function Welcome() {
  const { index, update, today } = useStore();
  const [level, setLevel] = useState<LevelId>('base');
  const [quiz, setQuiz] = useState<{ i: number; score: Record<string, number>; picked: number | null } | null>(null);
  const [suggested, setSuggested] = useState<LevelId | null>(null);

  const start = (lv: LevelId) => update((s) => ({ ...s, level: lv, createdOn: s.createdOn ?? today }));

  if (quiz && index) {
    const qs = index.quiz;
    const q: QuizQuestion | undefined = qs[quiz.i];
    if (!q) {
      // livello suggerito: il più alto con entrambe le risposte giuste
      let sug: LevelId = 'principiante';
      if ((quiz.score.base ?? 0) >= 2) sug = 'base';
      if (sug === 'base' && (quiz.score.intermedio ?? 0) >= 2) sug = 'intermedio';
      if (sug === 'intermedio' && (quiz.score.avanzato ?? 0) >= 2) sug = 'avanzato';
      if (!suggested) setSuggested(sug);
      const agree = sug === level;
      return (
        <main className="screen" style={{ paddingTop: 40 }}>
          <h1 className="large-title" style={{ fontSize: 30 }}>{agree ? 'Confermato!' : 'Proposta'}</h1>
          <p style={{ fontSize: 17, lineHeight: 1.45, margin: 0 }}>
            {agree
              ? `Le risposte confermano il livello ${LEVELS.find((l) => l.id === level)!.name}.`
              : `Dalle risposte ti consiglio il livello ${LEVELS.find((l) => l.id === sug)!.name}. Puoi comunque tenere ${LEVELS.find((l) => l.id === level)!.name}.`}
          </p>
          <button className="pill-btn" onClick={() => start(sug)}>Inizia con {LEVELS.find((l) => l.id === sug)!.name}</button>
          {!agree && <button className="ghost-btn" onClick={() => start(level)}>Tengo {LEVELS.find((l) => l.id === level)!.name}</button>}
        </main>
      );
    }
    const answered = quiz.picked !== null;
    return (
      <main className="screen" style={{ paddingTop: 40 }}>
        <span style={{ fontSize: 13, color: 'var(--text2)', fontWeight: 600 }}>DOMANDA {quiz.i + 1} DI {qs.length}</span>
        <h1 style={{ margin: 0, fontSize: 22 }}>Cosa stampa questo codice?</h1>
        <pre className="code" dangerouslySetInnerHTML={{ __html: highlightLite(q.code) }} />
        <div className="options">
          {q.options.map((o, i) => (
            <button
              key={i}
              className={`option ${answered && i === q.answer ? 'ok' : ''} ${answered && quiz.picked === i && i !== q.answer ? 'no' : ''}`}
              onClick={() => !answered && setQuiz({ ...quiz, picked: i, score: { ...quiz.score, [q.level]: (quiz.score[q.level] ?? 0) + (i === q.answer ? 1 : 0) } })}
            >
              {o}
            </button>
          ))}
          <button className="option" style={{ fontFamily: 'var(--font)', color: 'var(--text2)' }} onClick={() => !answered && setQuiz({ ...quiz, picked: -1 })}>Non lo so</button>
        </div>
        {answered && <button className="pill-btn" onClick={() => setQuiz({ ...quiz, i: quiz.i + 1, picked: null })}>Avanti</button>}
      </main>
    );
  }

  return (
    <main className="screen" style={{ paddingTop: 28, gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <svg viewBox="0 0 210 190" width="96" height="87" aria-hidden="true" style={{ overflow: 'visible', flexShrink: 0 }}>
          <CoiledSnake neckClass="neck" head={<><circle cx="154" cy="31" r="10" fill="#fff" /><ellipse cx="158.5" cy="31.5" rx="5.8" ry="8" fill="#111" /><path d="M172 47 Q178 49.5 184 46.5" stroke="#1A1A1A" strokeWidth="2.2" strokeLinecap="round" fill="none" /><path className="m-tongue" d="M186 47 Q192 49 196 53 M196 53 L201 50 M196 53 L199 59" stroke="#F4A3B8" strokeWidth="3" strokeLinecap="round" fill="none" /></>} />
        </svg>
        <div>
          <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: -0.5, lineHeight: 1 }}>PyCoil</div>
          <div style={{ fontSize: 15, color: 'var(--text2)', lineHeight: 1.3, marginTop: 4 }}>Python per ingegneri,<br />una spira al giorno</div>
        </div>
      </div>
      <div>
        <h1 style={{ margin: 0, fontSize: 22 }}>Da dove partiamo?</h1>
        <p style={{ margin: '4px 0 0', fontSize: 15, color: 'var(--text2)', lineHeight: 1.35 }}>Scegli il tuo livello. Poi {index?.quiz.length ?? 6} domande rapide lo confermano o ti suggeriscono di cambiarlo.</p>
      </div>
      <div role="radiogroup" aria-label="Livello" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {LEVELS.map((l) => (
          <button key={l.id} role="radio" aria-checked={level === l.id} className="level-card" onClick={() => setLevel(l.id)}>
            <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 17, fontWeight: 600 }}>{l.name}</span>
              <span style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.3 }}>{l.desc}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#5E8A2A', marginTop: 2 }}>{l.start}</span>
            </span>
            {level === l.id ? <Check size={24} /> : <Todo size={24} />}
          </button>
        ))}
      </div>
      {index && index.quiz.length > 0 ? (
        <button className="pill-btn" onClick={() => setQuiz({ i: 0, score: {}, picked: null })}>Verifica con {index.quiz.length} domande · 2 min</button>
      ) : (
        <button className="pill-btn" onClick={() => start(level)}>Inizia</button>
      )}
      <button className="ghost-btn" onClick={() => start(level)}>Salta il test e inizia dalla Parte {['0', 'I', 'II', 'III'][ORDER.indexOf(level)]}</button>
    </main>
  );
}
