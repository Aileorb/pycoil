// Simula settimane d'uso sui contenuti veri generati da `npm run content`.
import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { addDays } from '../src/engine/dates';
import { activeProject, pathSections, planDay } from '../src/engine/scheduler';
import { completeAdvanced, completeTask, emptyState, isDayComplete, learnSection } from '../src/engine/state';
import type { AppState, ContentIndex, LevelId } from '../src/engine/types';

const FILE = 'public/content/index.json';
const index: ContentIndex | null = existsSync(FILE) ? JSON.parse(readFileSync(FILE, 'utf8')) : null;
const allTasks = index ? new Set([...index.tasks, ...index.katas].map((t) => t.id)) : new Set<string>();

describe.skipIf(!index)('contenuti reali', () => {
  const levels: LevelId[] = ['principiante', 'base', 'intermedio', 'avanzato'];

  it.each(levels)('pianifica 60 giorni validi per il livello %s', (level) => {
    const idx = index!;
    let s: AppState = { ...emptyState(), level, createdOn: '2026-01-05' };
    let day = '2026-01-05';
    const path = pathSections(idx, level);
    expect(path.length).toBeGreaterThan(0);
    for (let i = 0; i < 60; i++) {
      const plan = planDay(idx, s, day);
      expect(plan.required).toHaveLength(3);
      expect(new Set(plan.required).size).toBe(3);
      for (const id of [...(plan.intro ? [plan.intro] : []), ...plan.required, ...plan.advanced]) {
        const isStep = idx.projects.some((p) => p.steps.some((st) => `${p.id}-${st.id}` === id));
        expect(allTasks.has(id) || isStep, `task inesistente ${id}`).toBe(true);
      }
      expect(plan.required.some((id) => id.startsWith('impara-'))).toBe(false);
      // niente esercizi di argomenti lontani: al massimo due sezioni oltre il concetto di oggi
      const here = plan.intro ? path.indexOf(plan.intro.replace('impara-', '')) : path.length;
      for (const id of plan.required) {
        const sec = idx.tasks.find((t) => t.id === id)!.section;
        expect(path.indexOf(sec), `${id} troppo avanti (giorno ${i})`).toBeLessThanOrEqual(here + 2);
      }
      if (plan.intro) s = learnSection(s, plan.intro.replace('impara-', ''));
      for (const id of plan.required) s = completeTask(s, day, id, { firstTry: true }).state;
      expect(isDayComplete(s, day)).toBe(true);
      for (const id of plan.advanced) {
        const proj = idx.projects.find((p) => id.startsWith(`${p.id}-`));
        s = completeAdvanced(s, day, id, proj?.id, proj ? id.slice(proj.id.length + 1) : undefined).state;
      }
      day = addDays(day, 1);
    }
    expect(s.streak.current).toBe(60);
    expect(s.learned.length).toBeGreaterThan(5);
  });

  it('l\'avanzato trova subito un progetto', () => {
    const s: AppState = { ...emptyState(), level: 'avanzato' };
    expect(activeProject(index!, s)?.id).toBe('p1');
  });

  it('il principiante non ha progetti finché non studia', () => {
    const s: AppState = { ...emptyState(), level: 'principiante' };
    expect(activeProject(index!, s)).toBeNull();
  });
});
