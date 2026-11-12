import { useEffect, useRef, useState } from 'react';
import { useStore } from '../store';
import { RichHtml } from '../components/RichHtml';
import { FavoritesButton, SelectionSaver } from '../components/Favorites';
import { Back, Check } from '../components/icons';
import { loadAppendix, loadLibrary, loadProjectPage, loadSection } from '../engine/content';
import { queryParam } from '../router';
import type { SectionDoc } from '../engine/types';

type Kind = 'percorso' | 'libreria' | 'doc' | 'progetto';

const loaders: Record<Kind, (id: string) => Promise<SectionDoc>> = {
  percorso: loadSection,
  libreria: loadLibrary,
  doc: loadAppendix,
  progetto: loadProjectPage
};

/** Pagina di lettura: sezione del libro, libreria, voce di appendice o progetto. */
export function DocPage({ kind, id }: { kind: Kind; id: string }) {
  const { index, readSection, state, addFavorite } = useStore();
  const [doc, setDoc] = useState<SectionDoc | null>(null);
  const [error, setError] = useState(false);
  const [progress, setProgress] = useState(0);
  const sentinel = useRef<HTMLDivElement>(null);
  const body = useRef<HTMLElement>(null);
  const opened = useRef(Date.now());
  const isRead = kind === 'percorso' && state.sections.includes(id);

  useEffect(() => {
    setDoc(null);
    setError(false);
    opened.current = Date.now();
    loaders[kind](id).then(setDoc, () => setError(true));
    window.scrollTo(0, 0);
  }, [kind, id]);

  // barra di lettura
  useEffect(() => {
    const on = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(h > 0 ? Math.min(1, window.scrollY / h) : 1);
    };
    window.addEventListener('scroll', on, { passive: true });
    on();
    return () => window.removeEventListener('scroll', on);
  }, [doc]);

  // spunta verde: fine pagina visibile per 1 s e almeno 20 s di permanenza
  useEffect(() => {
    if (kind !== 'percorso' || !doc || doc.stub || isRead || !sentinel.current) return;
    let timer = 0;
    let finish = 0;
    const io = new IntersectionObserver(([e]) => {
      window.clearTimeout(timer);
      if (e.isIntersecting) {
        timer = window.setTimeout(() => {
          const wait = Math.max(0, 20_000 - (Date.now() - opened.current));
          finish = window.setTimeout(() => readSection(id), wait);
        }, 1000);
      }
    }, { threshold: 1 });
    io.observe(sentinel.current);
    return () => {
      io.disconnect();
      window.clearTimeout(timer);
      window.clearTimeout(finish);
    };
  }, [kind, doc, id, isRead, readSection]);

  // evidenzia il testo di un preferito
  useEffect(() => {
    const hl = queryParam('hl');
    if (!doc || !hl || !body.current) return;
    const t = window.setTimeout(() => {
      const walker = document.createTreeWalker(body.current!, NodeFilter.SHOW_TEXT);
      const needle = hl.split('\n')[0].trim().slice(0, 40);
      let n: Node | null;
      while ((n = walker.nextNode())) {
        const i = n.textContent?.indexOf(needle) ?? -1;
        if (i >= 0) {
          const range = document.createRange();
          range.setStart(n, i);
          range.setEnd(n, Math.min((n.textContent ?? '').length, i + needle.length));
          const mark = document.createElement('mark');
          mark.className = 'flash';
          mark.style.background = 'transparent';
          mark.style.color = 'inherit';
          range.surroundContents(mark);
          mark.scrollIntoView({ behavior: 'smooth', block: 'center' });
          break;
        }
      }
    }, 300);
    return () => window.clearTimeout(t);
  }, [doc]);

  // sezioni precedente e successiva (in tutto il libro)
  const all = index?.parts.flatMap((p) => p.chapters.flatMap((c) => c.sections)) ?? [];
  const pos = all.findIndex((s) => s.id === id);
  const prev = kind === 'percorso' && pos > 0 ? all[pos - 1] : null;
  const next = kind === 'percorso' && pos >= 0 && pos < all.length - 1 ? all[pos + 1] : null;
  const part = index?.parts.find((p) => p.id === doc?.part);
  const chapter = part?.chapters.find((c) => c.id === doc?.chapter);
  const label = kind === 'percorso' ? `${id.replace(/^0/, '').replace(/-0?/g, '.')} ${doc?.title ?? ''}` : doc?.title ?? '';
  const fav = {
    label,
    anchor: `#/${kind}/${id}`,
    onSave: (text: string, k: 'code' | 'text') => addFavorite({ text, kind: k, anchor: `#/${kind}/${id}`, label })
  };

  return (
    <div>
      <header className="nav-bar">
        <a className="back" href="#/percorso"><Back />Percorso</a>
        <span className="ttl">{kind === 'percorso' ? chapter?.title ?? '' : kind === 'libreria' ? 'Libreria' : kind === 'progetto' ? 'Il tuo progetto' : 'Appendice'}</span>
        <FavoritesButton />
      </header>
      <div className="readbar" aria-hidden="true"><span style={{ width: `${progress * 100}%` }} /></div>
      <article className="doc" ref={body}>
        {error && <div className="empty">Questa pagina sta su GitHub: serve la connessione per aprirla.</div>}
        {!doc && !error && <div className="empty">Carico…</div>}
        {doc && (
          <>
            {part && kind === 'percorso' && <div className="meta">Parte {part.roman} · {part.title}</div>}
            <h1>{doc.title}</h1>
            <div className="meta">
              {doc.minutes} min di lettura{doc.desktop ? ' · alcuni esempi richiedono il computer' : ''}
              {isRead && ' · letta'}
            </div>
            <RichHtml html={doc.html} fav={fav} />
            {doc.sources.length > 0 && (
              <div className="sources">
                <strong>Approfondisci</strong>
                {doc.sources.map((s) => <a key={s.url} href={s.url} target="_blank" rel="noopener">{s.label} ↗</a>)}
              </div>
            )}
            <div ref={sentinel} style={{ height: 1 }} />
            {kind === 'percorso' && !doc.stub && (isRead ? <div style={{ textAlign: 'center' }}><span className="done-pill"><Check size={18} />Sezione completata</span></div> : <p style={{ textAlign: 'center', color: 'var(--text2)', fontSize: 13 }}>La spunta verde arriva quando hai letto fino in fondo.</p>)}
            {(prev || next) && (
              <nav className="prevnext" aria-label="Sezioni vicine">
                {prev ? <a href={`#/percorso/${prev.id}`}><small>‹ Precedente</small><b>{prev.title}</b></a> : <span />}
                {next ? <a className="next" href={`#/percorso/${next.id}`}><small>Successiva ›</small><b>{next.title}</b></a> : <span />}
              </nav>
            )}
          </>
        )}
      </article>
      <SelectionSaver scope={body} onSave={(text) => fav.onSave(text, 'text')} />
    </div>
  );
}
