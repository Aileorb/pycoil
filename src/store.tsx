import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { AppState, ContentIndex, Favorite } from './engine/types';
import { dayKey, weekStart } from './engine/dates';
import { compactHistory, completeAdvanced, completeTask, markSectionRead, refreshStreak, emptyState } from './engine/state';
import { ensureToday, loadState, saveState, saveToday, clearToday, type TodayRecord } from './engine/storage';
import { loadIndex } from './engine/content';

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
  finishTask: (id: string, opts?: { firstTry?: boolean; sectionLearned?: string }) => void;
  finishAdvanced: (id: string, project?: string, stepId?: string) => void;
  readSection: (id: string) => void;
  addFavorite: (f: Omit<Favorite, 'id' | 'ts'>) => void;
  removeFavorite: (id: string) => void;
  showToast: (t: string) => void;
  reloadToday: () => void;
  /** Registra un tentativo sbagliato di oggi (resta salvato fino a domani). */
  recordAttempt: (id: string, pick?: number) => void;
  getIndex: () => Promise<ContentIndex>;
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
  const stateRef = useRef(state);
  stateRef.current = state;

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
      if (next !== prev) void saveState(next);
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

  const finishTask = useCallback(
    (id: string, opts?: { firstTry?: boolean; sectionLearned?: string }) => {
      const r = completeTask(stateRef.current, today, id, opts);
      if (r.gained) {
        update(() => r.state);
        if ('vibrate' in navigator) navigator.vibrate?.(r.dayCompleted ? [10, 40, 10] : 10);
        showToast(r.dayCompleted ? `Giornata completa! +${r.gained} XP` : `+${r.gained} XP`);
      }
    },
    [today, update, showToast]
  );

  const finishAdvanced = useCallback(
    (id: string, project?: string, stepId?: string) => {
      const r = completeAdvanced(stateRef.current, today, id, project, stepId);
      if (r.gained) {
        update(() => r.state);
        showToast(`Avanzata fatta! +${r.gained} XP`);
      }
    },
    [today, update, showToast]
  );

  const readSection = useCallback(
    (id: string) => {
      const r = markSectionRead(stateRef.current, id);
      if (r.gained) {
        update(() => r.state);
        showToast(`Sezione completata · +${r.gained} XP`);
      }
    },
    [update, showToast]
  );

  const addFavorite = useCallback(
    (f: Omit<Favorite, 'id' | 'ts'>) => {
      update((s) => ({ ...s, favorites: [{ ...f, id: `f${Date.now()}`, ts: Date.now() }, ...s.favorites] }));
      if ('vibrate' in navigator) navigator.vibrate?.(10);
      showToast('Salvato nei preferiti');
    },
    [update, showToast]
  );

  const removeFavorite = useCallback((id: string) => update((s) => ({ ...s, favorites: s.favorites.filter((f) => f.id !== id) })), [update]);

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

  const value = useMemo<Store>(
    () => ({ ready, state, today, todayRec, todayError, index, indexError, toast, update, finishTask, finishAdvanced, readSection, addFavorite, removeFavorite, showToast, reloadToday, recordAttempt, getIndex }),
    [ready, state, today, todayRec, todayError, index, indexError, toast, update, finishTask, finishAdvanced, readSection, addFavorite, removeFavorite, showToast, reloadToday, recordAttempt, getIndex]
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error('StoreProvider mancante');
  return s;
}
