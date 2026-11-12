export interface Stage {
  level: number;
  name: string;
  minXp: number;
  /** gradiente del cielo: [basso, alto] */
  sky: [string, string];
  hill: string;
  touch: string;
}

// Il serpente cresce solo quando si supera la soglia di XP.
export const STAGES: Stage[] = [
  { level: 1, name: 'Uovo', minXp: 0, sky: ['#0B1026', '#1B2550'], hill: '#070B1C', touch: 'dondola' },
  { level: 2, name: 'Uovo crepato', minXp: 150, sky: ['#121A3A', '#3A3266'], hill: '#0C1230', touch: 'la crepa cresce e poi torna' },
  { level: 3, name: 'Occhio nel buio', minXp: 400, sky: ['#1E1E48', '#6B3F6E'], hill: '#15153A', touch: "l'occhio sparisce nel buio" },
  { level: 4, name: 'Piccolo', minXp: 900, sky: ['#2E2A5C', '#C0607A'], hill: '#221E47', touch: 'si nasconde e fa capolino' },
  { level: 5, name: 'Pitone', minXp: 1800, sky: ['#4A3F7A', '#F29E6B'], hill: '#3A3066', touch: 'ondeggia e fa la linguaccia' },
  { level: 6, name: 'Beato', minXp: 3500, sky: ['#6E5A9E', '#FFD86B'], hill: '#5A4A86', touch: 'bolla gigante' }
];

export function stageFor(xp: number): Stage {
  let s = STAGES[0];
  for (const st of STAGES) if (xp >= st.minXp) s = st;
  return s;
}

export function levelProgress(xp: number): { stage: Stage; next: Stage | null; pct: number } {
  const stage = stageFor(xp);
  const next = STAGES.find((s) => s.level === stage.level + 1) ?? null;
  if (!next) return { stage, next: null, pct: 100 };
  const pct = Math.max(0, Math.min(100, Math.floor(((xp - stage.minXp) / (next.minXp - stage.minXp)) * 100)));
  return { stage, next, pct };
}

export const XP = {
  task: 10,
  firstTry: 5,
  section: 2,
  part: 10,
  advanced: 40,
  fullDay: 10
};

/** Moltiplicatore streak: +1% per giorno, massimo +50%. */
export function streakMultiplier(streak: number): number {
  return 1 + Math.min(streak, 50) / 100;
}

export type MascotMood = 'lost' | 'sleepy' | 'smile' | 'wave' | 'jump' | 'party' | 'gold';

export function moodFor(streak: number, lost: boolean): MascotMood {
  if (lost) return 'lost';
  if (streak <= 0) return 'sleepy';
  if (streak <= 2) return 'smile';
  if (streak <= 6) return 'wave';
  if (streak <= 13) return 'jump';
  if (streak <= 29) return 'party';
  return 'gold';
}
