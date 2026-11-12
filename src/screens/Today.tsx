import { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '../store';
import { Mascot, Flame, Logo } from '../components/Snake';
import { TaskSheet } from '../components/TaskSheet';
import { Check, Chevron, Laptop, TaskGlyph, Todo, TASK_COLORS, TASK_LABEL } from '../components/icons';
import { longItalianDate, seedOf, weekDays } from '../engine/dates';
import { moodFor } from '../engine/levels';
import { AT_RISK, DONE, FIRST, LOST, PENDING, pickPhrase } from '../data/phrases';
import type { Task } from '../engine/types';

const TOUCH_MS: Record<string, number> = { lost: 1500, sleepy: 1800, gold: 2650 };

export function Today() {
  const { state, today, todayRec, todayError, reloadToday, index } = useStore();
  const [open, setOpen] = useState<Task | null>(null);
  const [play, setPlay] = useState(false);
  const log = state.days[today] ?? { done: [], adv: [] };
  const plan = todayRec?.plan;
  const doneCount = plan ? plan.required.filter((id) => log.done.includes(id)).length : 0;
  const allDone = !!plan && doneCount >= plan.required.length;
  const mood = moodFor(state.streak.current, state.streak.lost);

  const cheer = () => {
    setPlay(false);
    requestAnimationFrame(() => setPlay(true));
    window.setTimeout(() => setPlay(false), TOUCH_MS[mood] ?? 950);
  };

  // esultanza speciale una sola volta quando la giornata si completa
  const prevDone = useRef(doneCount);
  useEffect(() => {
    if (prevDone.current < 3 && doneCount >= 3 && plan) cheer();
    prevDone.current = doneCount;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doneCount]);

  const phrase = useMemo(() => {
    const seed = seedOf(today);
    const hour = new Date().getHours();
    const vars = { n: Math.max(0, 3 - doneCount), s: state.streak.current, h: 24 - hour };
    if (allDone) return pickPhrase(DONE, seed, vars);
    if (state.streak.lost) return pickPhrase(LOST, seed, vars);
    if (!state.streak.lastFullDay) return pickPhrase(FIRST, seed, vars);
    if (hour >= 20 && state.streak.current > 0) return pickPhrase(AT_RISK, seed, vars);
    return pickPhrase(PENDING, seed, vars);
  }, [today, doneCount, allDone, state.streak]);

  const week = weekDays(today);
  const partOf = (section: string) => todayRec?.parts.find((p) => p.sections.includes(section))?.roman;
  const project = plan?.project ? index?.projects.find((p) => p.id === plan.project) : null;
  const projDone = project ? state.projects[project.id] ?? [] : [];

  const isAdv = (t: Task) => t.type === 'kata' || t.type === 'step';
  const isDone = (t: Task) => (isAdv(t) ? log.adv.includes(t.id) : log.done.includes(t.id));
  const paused = (id: string) => !!todayRec?.drafts?.[id];
  /** Prossima task: prima le obbligatorie non fatte (in ordine, dopo quella aperta), poi le avanzate. */
  const nextAfter = (cur: Task): Task | null => {
    if (!plan || !todayRec) return null;
    const req = plan.required.map((id) => todayRec.tasks[id]).filter(Boolean);
    const adv = plan.advanced.map((id) => todayRec.tasks[id]).filter(Boolean);
    const i = req.findIndex((t) => t.id === cur.id);
    const rotated = i >= 0 ? [...req.slice(i + 1), ...req.slice(0, i)] : req;
    const ordine = [...rotated.filter((t) => t.id !== cur.id), ...adv.filter((t) => t.id !== cur.id)];
    return ordine.find((t) => !isDone(t)) ?? null;
  };
  const navFor = (t: Task) => {
    const pos = plan?.required.indexOf(t.id) ?? -1;
    return {
      position: pos >= 0 ? `Task ${pos + 1} di ${plan!.required.length} · ${t.minutes} min` : `Al computer · ${t.minutes} min · +40 XP`,
      progress: plan ? plan.required.map((id) => log.done.includes(id)) : [],
      next: nextAfter(t),
      onNext: () => setOpen(nextAfter(t))
    };
  };

  return (
    <main className="screen">
      <div className="date-row">
        <span className="date">{longItalianDate(today)}</span>
        <span className="brand">PyCoil <Logo size={30} /></span>
      </div>

      <div className="home-top">
        <div className={`streak-card ${mood === 'lost' ? 'lost' : ''}`}>
          <button onClick={cheer} aria-label="Tocca la mascotte" style={{ width: 150, height: 140, flexShrink: 0 }}>
            <Mascot mood={mood} play={play} />
          </button>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
            <div className="streak-num">
              {mood === 'lost' ? <Flame size={44} color="#AEAEB2" inner={null} cracked /> : state.streak.current === 0 ? <Flame size={44} color="#C7C7CC" inner={null} /> : <Flame size={44} />}
              <b className={play ? 'pop' : ''}>{state.streak.current}</b>
            </div>
            <span className="streak-sub">{mood === 'lost' ? 'streak persa' : state.streak.current === 1 ? 'giorno di fila' : 'giorni di fila'}</span>
            <div className="dots" aria-label="Giorni completati questa settimana">
              {week.map((d, i) => {
                const full = (state.days[d]?.done.length ?? 0) >= 3;
                return (
                  <div key={d} style={d === today ? { color: 'var(--orange-text)', fontWeight: 700 } : undefined}>
                    {'LMMGVSD'[i]}
                    <i className={full ? 'on' : d === today ? 'today' : ''} aria-label={full ? 'completo' : 'non completo'} />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <p className="challenge">{phrase}</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div className="section-label">
          <span>Le tue 3 task</span>
          {plan && (allDone ? <span style={{ color: 'var(--green-text)', fontWeight: 600, textTransform: 'none' }}>3 di 3 · fatto</span> : <span style={{ textTransform: 'none' }}>{doneCount} di 3 · ~10 min</span>)}
        </div>
        {!todayRec && !todayError && <div className="group"><div className="empty">Preparo le task di oggi…</div></div>}
        {todayError && (
          <div className="group">
            <div className="empty">Serve la connessione per scaricare le task di oggi da GitHub.</div>
            <button className="ghost-btn" onClick={reloadToday}>Riprova</button>
          </div>
        )}
        {plan && (
          <div className="group">
            {plan.required.map((id) => {
              const t = todayRec!.tasks[id];
              if (!t) return null;
              const isDone = log.done.includes(id);
              const review = !!state.review[id] && t.type !== 'impara';
              return (
                <button key={id} className="row" onClick={() => setOpen(t)}>
                  <span className="tile" style={{ background: TASK_COLORS[t.type] }}><TaskGlyph type={t.type} /></span>
                  <span className="grow">
                    <span className="t">{t.title}</span>
                    <span className="st">{!isDone && paused(id) && <span className="paused-chip">In pausa</span>}{TASK_LABEL[t.type]} · {t.minutes} min{review ? ' · ripasso' : partOf(t.section) ? ` · Parte ${partOf(t.section)}` : ''}</span>
                  </span>
                  {isDone ? <span className="pop" style={{ display: 'flex' }}><Check /></span> : <Todo />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {plan && plan.advanced.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 6 }}>
          <div className="section-label" style={{ justifyContent: 'flex-start' }}><Laptop /> <span>Avanzate di oggi · al computer</span></div>
          <div className="group">
            {project && (
              <div className="project-head">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <span style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <span className="k">PROGETTO {project.id.replace('p', '')} · {'★'.repeat(project.stars)}{'☆'.repeat(5 - project.stars)}</span>
                    <span style={{ fontSize: 17, fontWeight: 600 }}>{project.title}</span>
                  </span>
                  <span style={{ fontSize: 13, color: 'var(--text2)' }}>{projDone.length} di {project.steps.length} passi</span>
                </div>
                <div className="steps-bar" style={{ gridTemplateColumns: `repeat(${project.steps.length}, 1fr)` }}>
                  {project.steps.map((s) => (
                    <span key={s.id} className={projDone.includes(s.id) ? 'on' : plan.advanced.includes(`${project.id}-${s.id}`) ? 'today' : ''} />
                  ))}
                </div>
                {projDone.length > 0 && <a href={`#/progetto/${project.id}`} style={{ fontSize: 15, textDecoration: 'none' }}>Il tuo progetto finora ›</a>}
              </div>
            )}
            {plan.advanced.map((id) => {
              const t = todayRec!.tasks[id];
              if (!t) return null;
              const isDone = log.adv.includes(id);
              const step = t.type === 'step' ? (t as { step?: number }).step : null;
              return (
                <button key={id} className="row sep-top" onClick={() => setOpen(t)}>
                  <span className="tile" style={{ background: TASK_COLORS[t.type], fontWeight: 700 }}>{step ?? <TaskGlyph type="kata" />}</span>
                  <span className="grow">
                    <span className="t">{t.title}</span>
                    <span className="st">{!isDone && paused(id) && <span className="paused-chip">In pausa</span>}{step ? `Passo ${step}` : 'Kata'} · {t.minutes} min · +40 XP</span>
                  </span>
                  {isDone ? <Check /> : <Chevron />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {open && <TaskSheet key={open.id} task={open} done={isDone(open)} onClose={() => setOpen(null)} nav={navFor(open)} />}
    </main>
  );
}
