import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { AppState, ContentIndex, Favorite } from './engine/types';
import { dayKey, weekStart } from './engine/dates';
import { compactHistory, completeAdvanced, completeTask, isDayComplete, learnIntroToday, markSectionRead, resetDay, refreshStreak, emptyState, normalize } from './engine/state';
import { buildToday, ensureToday, loadState, saveState, saveToday, clearToday, type TaskDraft, type TodayRecord } from './engine/storage';
import { loadIndex } from './engine/content';
import { syncDay, syncPush } from './push';
import { applyRemote, foldLocalXp, stripLocal, xpTotal } from './engine/merge';
import { dispositivo, dimenticaSessione, ErroreConto, inviaStato, sessione, type Sessione } from './conto';

export interface SyncInfo {
  busy: boolean;
  at: number | null;
  err: string | null;
}

export interface Completion {
  id: string;
  gained: number;
  firstTry: boolean;
  dayCompleted: boolean;
}

interface Store {
  ready: boolean;
  state: AppState;
  today: string;
  todayRec: TodayRecord | null;
  todayError: boolean;
  index: ContentIndex | null;
  indexError: boolean;
  toast: string | null;
  update: (fn: (s: AppState) => AppState) => void;
  finishTask: (id: string, opts?: { firstTry?: boolean; sectionLearned?: string; quiet?: boolean }) => void;
  finishAdvanced: (id: string, project?: string, stepId?: string, quiet?: boolean) => void;
  /** L'ultimo completamento (per l'animazione di successo nella task a schermo intero). */
  lastCompletion: Completion | null;
  readSection: (id: string) => void;
  /** Introduzione del giorno letta: il concetto diventa «imparato» (non è una task). */
  learnIntro: (sectionId: string) => void;
  addFavorite: (f: Omit<Favorite, 'id' | 'ts'>) => void;
  removeFavorite: (id: string) => void;
  showToast: (t: string) => void;
  reloadToday: () => void;
  resetToday: () => Promise<boolean>;
  /** Registra un tentativo sbagliato di oggi (resta salvato fino a domani). */
  recordAttempt: (id: string, pick?: number) => void;
  /** Salva (o con null cancella) la bozza di una task messa in pausa. */
  saveDraft: (id: string, draft: TaskDraft | null) => void;
  getIndex: () => Promise<ContentIndex>;
  /** Account con passkey (null se non sei entrato) e stato della sincronizzazione. */
  conto: Sessione | null;
  syncInfo: SyncInfo;
  syncNow: () => Promise<boolean>;
  /** Dopo l'accesso: `sostituisci` usa i progressi dell'account, altrimenti li unisce a quelli di qui. */
  entraNelConto: (remoto: AppState | null, sostituisci: boolean) => Promise<boolean>;
  esciDalConto: () => void;
}

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [state, setState] = useState<AppState>(emptyState());
  const [today, setToday] = useState(dayKey());
  const [todayRec, setTodayRec] = useState<TodayRecord | null>(null);
  const [todayError, setTodayError] = useState(false);
  const [index, setIndex] = useState<ContentIndex | null>(null);
  const [indexError, setIndexError] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number>(0);
  const showToastRef = useRef<(t: string) => void>(() => undefined);
  const stateRef = useRef(state);
  stateRef.current = state;
  const [conto, setConto] = useState<Sessione | null>(() => sessione());
  const [syncInfo, setSyncInfo] = useState<SyncInfo>({ busy: false, at: null, err: null });

  const getIndex = useCallback(async () => {
    try {
      const idx = await loadIndex();
      setIndex(idx);
      setIndexError(false);
      return idx;
    } catch (e) {
      setIndexError(true);
      throw e;
    }
  }, []);

  const update = useCallback((fn: (s: AppState) => AppState) => {
    setState((prev) => {
      const next = fn(prev);
      if (next !== prev) {
        void saveState(next);
        stateRef.current = next;
      }
      return next;
    });
  }, []);

  // avvio: stato, streak, task del giorno
  useEffect(() => {
    (async () => {
      const day = dayKey();
      let s = await loadState();
      s = compactHistory(refreshStreak(s, day), day, weekStart);
      await saveState(s);
      setState(s);
      setToday(day);
      setReady(true);
      getIndex().catch(() => undefined);
    })();
  }, [getIndex]);

  // task del giorno (si ricreano al cambio di data)
  useEffect(() => {
    if (!ready || !state.level) return;
    let alive = true;
    ensureToday(today, stateRef.current, getIndex).then((rec) => {
      if (!alive) return;
      setTodayRec(rec);
      setTodayError(!rec);
    });
    return () => {
      alive = false;
    };
  }, [ready, today, state.level, getIndex]);

  // il piano di oggi entra nei progressi (così è lo stesso su tutti i dispositivi dell'account);
  // se dalla sincronizzazione ne arriva uno diverso, creato prima altrove, le task di oggi si allineano
  const plan = state.plan;
  useEffect(() => {
    if (!todayRec || todayRec.date !== today) return;
    if (!plan || plan.date !== today) {
      update((s) => (s.plan?.date === today ? s : { ...s, plan: { date: today, at: Date.now(), plan: todayRec.plan } }));
      return;
    }
    if (JSON.stringify(plan.plan) === JSON.stringify(todayRec.plan)) return;
    let alive = true;
    const keep = { attempts: todayRec.attempts, drafts: todayRec.drafts };
    getIndex()
      .then((idx) => buildToday(idx, stateRef.current, today, plan.plan))
      .then((rec) => {
        if (!alive) return;
        const merged = { ...rec, ...keep };
        void saveToday(merged);
        setTodayRec(merged);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [todayRec, plan, today, update, getIndex]);

  // ---------------------------------------------------------------- sincronizzazione con l'account
  const syncing = useRef(false);
  const again = useRef(false);
  const lastSent = useRef('');
  const syncNow = useCallback(async (): Promise<boolean> => {
    if (!sessione()) return false;
    if (syncing.current) {
      again.current = true;
      return true;
    }
    syncing.current = true;
    setSyncInfo((i) => ({ ...i, busy: true }));
    let ok = true;
    try {
      do {
        again.current = false;
        const dev = dispositivo();
        const sent = foldLocalXp(stateRef.current, dev);
        update((s) => foldLocalXp(s, dev));
        const r = await inviaStato(stripLocal(sent));
        update((s) => {
          const n = applyRemote(s, r.stato, dayKey());
          lastSent.current = JSON.stringify(stripLocal(n));
          return n;
        });
      } while (again.current);
      setSyncInfo({ busy: false, at: Date.now(), err: null });
    } catch (e) {
      ok = false;
      if (e instanceof ErroreConto && e.status === 401) {
        dimenticaSessione();
        setConto(null);
        showToastRef.current('Sessione scaduta: accedi di nuovo nelle Impostazioni');
      }
      setSyncInfo((i) => ({ ...i, busy: false, err: (e as Error).message }));
    } finally {
      syncing.current = false;
    }
    return ok;
  }, [update]);

  // all'apertura, quando l'app torna in primo piano, quando torna la rete
  useEffect(() => {
    if (!ready || !conto) return;
    void syncNow();
    const onVisible = () => document.visibilityState === 'visible' && void syncNow();
    const onOnline = () => void syncNow();
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('online', onOnline);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('online', onOnline);
    };
  }, [ready, conto, syncNow]);

  // dopo ogni modifica (una task, una sezione letta…), con qualche secondo di calma
  useEffect(() => {
    if (!ready || !conto) return;
    const now = JSON.stringify(stripLocal(state));
    if (now === lastSent.current) return;
    const t = window.setTimeout(() => void syncNow(), 3000);
    return () => window.clearTimeout(t);
  }, [ready, conto, state, syncNow]);

  const entraNelConto = useCallback(
    async (remoto: AppState | null, sostituisci: boolean) => {
      setConto(sessione());
      if (remoto && sostituisci) {
        const r = normalize(remoto);
        update((s) => ({ ...r, reminder: s.reminder, xpSynced: xpTotal(r.xpDev), daySnap: undefined }));
        await clearToday();
        setTodayRec(null);
      } else if (remoto) {
        // unione: si adotta l'eventuale «Azzera tutto» dell'account, così i progressi di qui non vengono scartati
        update((s) => ({ ...s, resetAt: remoto.resetAt }));
      }
      return syncNow();
    },
    [update, syncNow]
  );

  const esciDalConto = useCallback(() => {
    dimenticaSessione();
    setConto(null);
    setSyncInfo({ busy: false, at: null, err: null });
  }, []);

  // promemoria: all'apertura rinnova abbonamento e orario sul server; poi comunica quando la giornata è completa
  const pushSynced = useRef(false);
  const dayDone = ready && state.level ? isDayComplete(state, today) : false;
  useEffect(() => {
    const r = state.reminder;
    if (!ready || !r?.enabled) return;
    const day = { today, done: dayDone, streak: state.streak.current, lastFullDay: state.streak.lastFullDay };
    if (!pushSynced.current) {
      pushSynced.current = true;
      void syncPush(r.time, day);
    } else void syncDay(day);
  }, [ready, today, dayDone, state.reminder, state.streak.current, state.streak.lastFullDay]);

  // controllo del cambio di giorno quando l'app torna in primo piano
  useEffect(() => {
    const check = () => {
      const d = dayKey();
      if (d !== today) {
        update((s) => refreshStreak(s, d));
        setToday(d);
      }
    };
    document.addEventListener('visibilitychange', check);
    const t = window.setInterval(check, 60_000);
    return () => {
      document.removeEventListener('visibilitychange', check);
      window.clearInterval(t);
    };
  }, [today, update]);

  const showToast = useCallback((t: string) => {
    setToast(t);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2200);
  }, []);
  showToastRef.current = showToast;

  const [lastCompletion, setLastCompletion] = useState<Completion | null>(null);

  const finishTask = useCallback(
    (id: string, opts?: { firstTry?: boolean; sectionLearned?: string; quiet?: boolean }) => {
      const r = completeTask(stateRef.current, today, id, opts);
      if (r.gained) {
        update(() => r.state);
        setLastCompletion({ id, gained: r.gained, firstTry: !!opts?.firstTry, dayCompleted: r.dayCompleted });
        if (opts?.quiet) return; // l'animazione di successo mostra già i punti
        if ('vibrate' in navigator) navigator.vibrate?.(r.dayCompleted ? [10, 40, 10] : 10);
        showToast(r.dayCompleted ? `Giornata completa! +${r.gained} XP` : `+${r.gained} XP`);
      }
    },
    [today, update, showToast]
  );

  const finishAdvanced = useCallback(
    (id: string, project?: string, stepId?: string, quiet = false) => {
      const r = completeAdvanced(stateRef.current, today, id, project, stepId);
      if (r.gained) {
        update(() => r.state);
        setLastCompletion({ id, gained: r.gained, firstTry: false, dayCompleted: false });
        if (!quiet) showToast(`Avanzata fatta! +${r.gained} XP`);
      }
    },
    [today, update, showToast]
  );

  const learnIntro = useCallback((sectionId: string) => update((s) => learnIntroToday(s, today, sectionId)), [update, today]);

  const readSection = useCallback(
    (id: string) => {
      const part = index?.parts.find((p) => p.chapters.some((c) => c.sections.some((x) => x.id === id)));
      const partSections = part ? part.chapters.flatMap((c) => c.sections.filter((x) => !x.stub).map((x) => x.id)) : [];
      const r = markSectionRead(stateRef.current, id, partSections);
      if (r.gained) {
        update(() => r.state);
        showToast(r.partCompleted ? `Parte ${part!.roman} completata · +${r.gained} XP` : `Sezione completata · +${r.gained} XP`);
      }
    },
    [update, showToast, index]
  );

  const addFavorite = useCallback(
    (f: Omit<Favorite, 'id' | 'ts'>) => {
      update((s) => ({ ...s, favorites: [{ ...f, id: `f${Date.now()}`, ts: Date.now() }, ...s.favorites] }));
      if ('vibrate' in navigator) navigator.vibrate?.(10);
      showToast('Salvato nei preferiti');
    },
    [update, showToast]
  );

  const removeFavorite = useCallback(
    (id: string) => update((s) => ({ ...s, favorites: s.favorites.filter((f) => f.id !== id), favGone: { ...(s.favGone ?? {}), [id]: Date.now() } })),
    [update]
  );

  const todayRef = useRef(todayRec);
  todayRef.current = todayRec;

  const recordAttempt = useCallback((id: string, pick = -1) => {
    const rec = todayRef.current;
    if (!rec) return;
    const next: TodayRecord = { ...rec, attempts: { ...rec.attempts, [id]: [...(rec.attempts?.[id] ?? []), pick] } };
    todayRef.current = next;
    setTodayRec(next);
    void saveToday(next);
  }, []);

  const saveDraft = useCallback((id: string, draft: TaskDraft | null) => {
    const rec = todayRef.current;
    if (!rec) return;
    const drafts = { ...rec.drafts };
    if (draft) drafts[id] = draft;
    else if (id in drafts) delete drafts[id];
    else return;
    const next: TodayRecord = { ...rec, drafts };
    todayRef.current = next;
    setTodayRec(next);
    void saveToday(next);
  }, []);

  const reloadToday = useCallback(() => {
    const kept = todayRef.current?.date === today ? todayRef.current.attempts : undefined;
    void clearToday().then(() => {
      setTodayRec(null);
      ensureToday(today, stateRef.current, getIndex).then((rec) => {
        // i tentativi già fatti oggi restano: ricaricare non regala nuove prove
        const merged = rec && kept ? { ...rec, attempts: kept } : rec;
        if (merged && kept) void saveToday(merged);
        setTodayRec(merged);
        setTodayError(!merged);
      });
    });
  }, [today, getIndex]);

  /** Riscarica le task di oggi e azzera la giornata: completamenti, punti, streak, tentativi e bozze. */
  const resetToday = useCallback(async () => {
    const prev = todayRef.current?.date === today ? todayRef.current : null;
    const s = resetDay(stateRef.current, today);
    stateRef.current = s;
    setState(s);
    void saveState(s);
    setLastCompletion(null);
    await clearToday();
    todayRef.current = null;
    setTodayRec(null);
    let rec: TodayRecord | null = null;
    try {
      // stesso piano di prima (se c'era): si rifanno le stesse task, non quelle dopo
      rec = await buildToday(await getIndex(), s, today, prev?.plan);
    } catch {
      rec = null;
    }
    todayRef.current = rec;
    setTodayRec(rec);
    setTodayError(!rec);
    return !!rec;
  }, [today, getIndex]);

  const value = useMemo<Store>(
    () => ({ ready, state, today, todayRec, todayError, index, indexError, toast, update, finishTask, finishAdvanced, readSection, addFavorite, removeFavorite, showToast, reloadToday, resetToday, recordAttempt, saveDraft, getIndex, lastCompletion, learnIntro, conto, syncInfo, syncNow, entraNelConto, esciDalConto }),
    [ready, state, today, todayRec, todayError, index, indexError, toast, update, finishTask, finishAdvanced, readSection, addFavorite, removeFavorite, showToast, reloadToday, resetToday, recordAttempt, saveDraft, getIndex, lastCompletion, learnIntro, conto, syncInfo, syncNow, entraNelConto, esciDalConto]
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error('StoreProvider mancante');
  return s;
}
