// ---------- Contenuti (letti a runtime da GitHub Pages, mai salvati in locale) ----------

export type LevelId = 'principiante' | 'base' | 'intermedio' | 'avanzato';

export interface SectionMeta {
  id: string; // es. "03-02-01"
  title: string;
  minutes: number;
  desktop?: boolean;
  stub?: boolean;
}

export interface ChapterMeta {
  id: string;
  title: string;
  sections: SectionMeta[];
}

export interface PartMeta {
  id: string; // "p0" … "p8"
  roman: string; // "0", "I", …
  title: string;
  short: string; // nome breve per le capacità
  chapters: ChapterMeta[];
}

export interface LibraryMeta {
  id: string;
  name: string;
  abbr: string;
  part: string;
  priority: 'Essenziale' | 'Molto utile' | 'Specialistica';
  color: string;
  desc: string;
  url: string;
}

export interface AppendixMeta {
  id: string;
  letter: string;
  title: string;
}

export interface TaskMeta {
  id: string;
  type: TaskType;
  section: string;
  title: string;
  minutes: number;
}

export interface ProjectMeta {
  id: string;
  title: string;
  stars: number;
  unlockAfter: string; // id della Parte prerequisito
  summary: string;
  steps: { id: string; title: string; minutes: number }[];
}

export interface ContentIndex {
  version: string;
  python: string;
  parts: PartMeta[];
  libraries: LibraryMeta[];
  appendix: AppendixMeta[];
  tasks: TaskMeta[];
  katas: TaskMeta[];
  projects: ProjectMeta[];
  quiz: QuizQuestion[];
}

export interface QuizQuestion {
  level: 'base' | 'intermedio' | 'avanzato';
  code: string;
  options: string[];
  answer: number;
}

export type TaskType = 'impara' | 'prevedi' | 'scrivi' | 'kata' | 'step';

export interface TaskBase {
  id: string;
  type: TaskType;
  section: string;
  title: string;
  minutes: number;
}

export interface ImparaTask extends TaskBase {
  type: 'impara';
  html: string; // scheda breve già renderizzata
}

export interface PrevediTask extends TaskBase {
  type: 'prevedi';
  code: string;
  codeHtml: string;
  options: string[];
  answer: number;
  explain: string;
}

export interface ScriviTask extends TaskBase {
  type: 'scrivi';
  promptHtml: string;
  starter: string;
  tests: string; // codice Python con assert
  solution: string;
  hints: string[];
}

export interface AdvancedTask extends TaskBase {
  type: 'kata' | 'step';
  project?: string;
  step?: number;
  promptHtml: string;
  hints: string[];
  solution: string;
  testFile?: { name: string; code: string };
  /** Nome del file .py che lo studente scrive (per verificare i test anche nell'app). */
  module?: string;
}

export type Task = ImparaTask | PrevediTask | ScriviTask | AdvancedTask;

export interface SectionDoc {
  id: string;
  title: string;
  part: string;
  chapter: string;
  minutes: number;
  html: string;
  sources: { label: string; url: string }[];
  desktop?: boolean;
  stub?: boolean;
}

// ---------- Stato locale (solo ID e contatori) ----------

export interface DayLog {
  done: string[]; // task obbligatorie completate
  adv: string[]; // avanzate completate
}

export interface Favorite {
  id: string;
  text: string;
  kind: 'code' | 'text';
  anchor: string; // es. "#/percorso/02-03-02"
  label: string; // provenienza leggibile
  ts: number;
}

export interface AppState {
  version: 1;
  level: LevelId | null;
  year: string | null;
  createdOn: string | null;
  xp: number;
  streak: { current: number; best: number; lastFullDay: string | null; lost: boolean };
  days: Record<string, DayLog>;
  weeks: Record<string, { done: number; adv: number }>; // storico compattato
  learned: string[]; // sezioni introdotte con la task "Impara"
  sections: string[]; // sezioni lette fino in fondo
  firstTry: Record<string, boolean>; // esito al primo tentativo per prevedi/scrivi
  review: Record<string, { due: string; step: number }>;
  projects: Record<string, string[]>; // id progetto -> passi fatti
  favorites: Favorite[];
  scroll: Record<string, number>;
}
