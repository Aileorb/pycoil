import { useState } from 'react';
import { useStore } from '../store';
import { StageScene, Chick, Ring } from '../components/StageScene';
import { Gear } from '../components/icons';
import { levelProgress } from '../engine/levels';
import { weekDays } from '../engine/dates';
import { skippedParts } from '../engine/scheduler';
import { Settings } from './Settings';

export function Stats() {
  const { state, today, todayRec, index } = useStore();
  const [settings, setSettings] = useState(false);
  const [tip, setTip] = useState<string | null>(null);
  const { stage, next, pct } = levelProgress(state.xp);
  const parts = todayRec?.parts ?? index?.parts.map((p) => ({ id: p.id, roman: p.roman, short: p.short, sections: p.chapters.flatMap((c) => c.sections.filter((s) => !s.stub).map((s) => s.id)) })) ?? [];
  const skipped = index ? skippedParts(index, state.level) : new Set<string>();
  const week = weekDays(today);
  const unit = 24; // px per task
  const totals = week.map((d) => ({ d, done: state.days[d]?.done.length ?? 0, adv: state.days[d]?.adv.length ?? 0 }));
  const sumDone = totals.reduce((a, t) => a + t.done + t.adv, 0);
  const sumAdv = totals.reduce((a, t) => a + t.adv, 0);

  // capacità: la prima Parte non completa è "in corso", le successive bloccate
  let foundCurrent = false;
  const skills = parts.slice(0, 9).map((p) => {
    const read = p.sections.filter((s) => state.sections.includes(s)).length;
    const total = p.sections.length;
    const pctP = total ? Math.round((read / total) * 100) : 0;
    let st: 'done' | 'progress' | 'locked' | 'skipped';
    if (skipped.has(p.id)) st = 'skipped';
    else if (total && read === total) st = 'done';
    else if (!foundCurrent) {
      st = 'progress';
      foundCurrent = true;
    } else st = 'locked';
    return { id: p.id, label: p.short, pct: pctP, st };
  });

  return (
    <main className="screen">
      <div className="title-row">
        <h1 className="large-title">Statistiche</h1>
        <button className="icon-circle" aria-label="Impostazioni" onClick={() => setSettings(true)}><Gear /></button>
      </div>

      <StageScene stage={stage} />

      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{ fontSize: 22, fontWeight: 700 }}>Livello {stage.level} · {stage.name}</span>
          {next && <span style={{ fontSize: 15, color: 'var(--text2)' }}>→ {next.name}</span>}
        </div>
        <div className="bar" style={{ height: 10 }}><span style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #FF9500, #FFCC00)' }} /></div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 15, color: 'var(--text2)' }}>{state.xp.toLocaleString('it-IT')}{next ? ` / ${next.minXp.toLocaleString('it-IT')}` : ''} XP</span>
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--orange-text)' }}>{next ? `${pct}%` : 'Massimo!'}</span>
        </div>
      </div>

      <div className="stat3">
        <div><b style={{ color: 'var(--orange-text)' }}>{state.streak.current}</b><span>streak attuale</span></div>
        <div><b>{state.streak.best}</b><span>record</span></div>
        <div><b>{state.sections.length}</b><span>sezioni lette</span></div>
      </div>

      {skills.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span className="section-label">Capacità raggiunte</span>
          <div className="group skills">
            {skills.map((s) => <Ring key={s.id} pct={s.pct} label={s.label} state={s.st} />)}
          </div>
        </div>
      )}

      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{ fontSize: 20, fontWeight: 700 }}>Questa settimana</span>
          <span style={{ fontSize: 13, color: 'var(--text2)' }}>{sumDone} task · {sumAdv} avanzate</span>
        </div>
        <div className="week" role="img" aria-label={`Task svolte per giorno: ${totals.map((t) => `${t.done + t.adv}`).join(', ')}`}>
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: unit * 5, borderTop: '0.5px dashed var(--sep)' }} />
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: unit * 3, borderTop: '0.5px dashed var(--sep)' }} />
          {totals.map((t, i) => {
            const isToday = t.d === today;
            const empty = t.done + t.adv === 0;
            return (
              <button key={t.d} className="col" onClick={() => setTip(tip === t.d ? null : t.d)} aria-label={`${t.done} obbligatorie, ${t.adv} avanzate`}>
                {tip === t.d && <span className="tip">{t.done} obbligatorie · {t.adv} avanzate</span>}
                {t.adv > 0 && <Chick delay={i * 0.07} />}
                {t.adv > 0 && <div style={{ width: 26, height: Math.min(t.adv, 2) * unit, background: 'var(--purple)', borderRadius: '7px 7px 0 0' }} />}
                {t.done > 0 && <div style={{ width: 26, height: Math.min(t.done, 3) * unit, background: 'var(--blue)', borderRadius: t.adv ? 0 : '7px 7px 0 0', boxShadow: isToday ? '0 0 0 3px rgba(0,122,255,0.2)' : undefined }} />}
                {empty && <div style={{ width: 26, height: 4, background: 'var(--fill)', borderRadius: 2 }} />}
              </button>
            );
          })}
        </div>
        <div className="week-labels">
          {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map((l, i) => <span key={l} style={week[i] === today ? { color: 'var(--blue)', fontWeight: 700 } : undefined}>{l}</span>)}
        </div>
        <div className="legend">
          <span><i style={{ background: 'var(--blue)' }} />Obbligatorie</span>
          <span><i style={{ background: 'var(--purple)' }} />Avanzate</span>
          <span>Il pulcino vola nei giorni con avanzate</span>
        </div>
      </div>

      {settings && <Settings onClose={() => setSettings(false)} />}
    </main>
  );
}
