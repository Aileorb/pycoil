import { useMemo, useState } from 'react';
import { useStore } from '../store';
import { FavoritesButton } from '../components/Favorites';
import { Check, Chevron, ChevronDown, Doc, Laptop, Reading, Search, Skipped, Toolbox, Todo } from '../components/icons';
import { isProjectUnlocked, skippedParts, pathSections, sectionNumber } from '../engine/scheduler';
import type { ContentIndex } from '../engine/types';

export function PathIndex() {
  const { index, indexError, state, getIndex } = useStore();
  if (!index) {
    return (
      <main className="screen">
        <div className="title-row"><h1 className="large-title">Percorso</h1><FavoritesButton /></div>
        <div className="group">
          <div className="empty">{indexError ? 'Il libro sta su GitHub: serve la connessione per aprirlo.' : 'Carico il libro…'}</div>
          {indexError && <button className="ghost-btn" onClick={() => getIndex().catch(() => undefined)}>Riprova</button>}
        </div>
      </main>
    );
  }
  return <PathBody index={index} read={new Set(state.sections)} />;
}

function PathBody({ index, read }: { index: ContentIndex; read: Set<string> }) {
  const { state } = useStore();
  const [q, setQ] = useState('');
  const skipped = skippedParts(index, state.level);
  const path = pathSections(index, state.level);
  const resume = path.find((s) => !read.has(s)) ?? null;
  const currentPart = index.parts.find((p) => p.chapters.some((c) => c.sections.some((s) => s.id === resume)))?.id;
  const [openParts, setOpenParts] = useState<Set<string>>(() => new Set(currentPart ? [currentPart] : []));
  const currentChapter = index.parts.flatMap((p) => p.chapters).find((c) => c.sections.some((s) => s.id === resume))?.id;
  const [openChapters, setOpenChapters] = useState<Set<string>>(() => new Set(currentChapter ? [currentChapter] : []));
  const total = path.length;
  const readCount = path.filter((s) => read.has(s)).length;
  const resumeTitle = index.parts.flatMap((p) => p.chapters.flatMap((c) => c.sections)).find((s) => s.id === resume)?.title;

  const toggle = (set: Set<string>, id: string, fn: (s: Set<string>) => void) => {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    fn(next);
  };

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (term.length < 2) return null;
    const out: { href: string; title: string; kind: string }[] = [];
    for (const p of index.parts) for (const c of p.chapters) for (const s of c.sections) if (s.title.toLowerCase().includes(term)) out.push({ href: `#/percorso/${s.id}`, title: s.title, kind: `Parte ${p.roman}` });
    for (const l of index.libraries) if (`${l.name} ${l.desc}`.toLowerCase().includes(term)) out.push({ href: `#/libreria/${l.id}`, title: l.name, kind: 'Libreria' });
    for (const a of index.appendix) if (a.title.toLowerCase().includes(term)) out.push({ href: `#/doc/${a.id}`, title: a.title, kind: 'Appendice' });
    return out;
  }, [q, index]);

  return (
    <main className="screen">
      <div className="title-row"><h1 className="large-title">Percorso</h1><FavoritesButton /></div>
      <label className="search">
        <Search />
        <input type="search" placeholder="Cerca sezioni, librerie o documentazione" aria-label="Cerca" value={q} onChange={(e) => setQ(e.target.value)} />
      </label>

      {results ? (
        <div className="group">
          {results.length === 0 && <div className="empty">Nessun risultato.</div>}
          {results.map((r) => (
            <a key={r.href} className="row" href={r.href}><span className="grow"><span className="t">{r.title}</span><span className="st">{r.kind}</span></span><Chevron /></a>
          ))}
        </div>
      ) : (
        <>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontSize: 17, fontWeight: 600 }}>{readCount} di {total} sezioni lette</span>
              <span style={{ fontSize: 15, color: 'var(--text2)' }}>{total ? Math.round((readCount / total) * 100) : 0}% · livello {state.level}</span>
            </div>
            <div className="bar"><span style={{ width: `${total ? (readCount / total) * 100 : 0}%` }} /></div>
            {resume && resumeTitle && <a href={`#/percorso/${resume}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', textDecoration: 'none', fontSize: 15 }}><span>Riprendi · {sectionNumber(index, resume)} {resumeTitle}</span><Chevron color="var(--blue)" /></a>}
          </div>

          {index.parts.map((p) => {
            const secs = p.chapters.flatMap((c) => c.sections.filter((s) => !s.stub));
            const done = secs.filter((s) => read.has(s.id)).length;
            const isSkipped = skipped.has(p.id);
            const complete = secs.length > 0 && done === secs.length;
            const isOpen = openParts.has(p.id);
            return (
              <div key={p.id} className="group">
                <button className={`part-row ${p.id === currentPart ? 'current' : ''}`} onClick={() => toggle(openParts, p.id, setOpenParts)} aria-expanded={isOpen}>
                  <span className="roman">{p.roman}</span>
                  <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span className="ttl" style={isSkipped ? { color: 'var(--text2)' } : undefined}>{p.title}</span>
                    {isSkipped ? (
                      <span style={{ fontSize: 13, color: 'var(--text2)' }}>Saltata col test · ripassa quando vuoi</span>
                    ) : (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="bar" style={{ flex: 1, height: 4 }}><span style={{ width: `${secs.length ? (done / secs.length) * 100 : 0}%`, background: complete ? 'var(--green)' : 'var(--blue)' }} /></span>
                        <span style={{ fontSize: 12, color: 'var(--text2)' }}>{done}/{secs.length || '—'}</span>
                      </span>
                    )}
                  </span>
                  {isSkipped ? <Skipped /> : complete ? <Check size={24} /> : null}
                  {isOpen ? <ChevronDown color="var(--blue)" /> : <Chevron />}
                </button>
                {isOpen &&
                  p.chapters.map((c) => {
                    const cOpen = openChapters.has(c.id);
                    const cDone = c.sections.filter((s) => read.has(s.id)).length;
                    const cTotal = c.sections.filter((s) => !s.stub).length;
                    return (
                      <div key={c.id}>
                        <button className="sec-row" onClick={() => toggle(openChapters, c.id, setOpenChapters)} aria-expanded={cOpen}>
                          <span className="grow" style={{ fontWeight: 600 }}>{c.title}</span>
                          <span style={{ fontSize: 13, color: 'var(--text2)' }}>{cTotal ? `${cDone}/${cTotal}` : 'in arrivo'}</span>
                          {cTotal > 0 && cDone === cTotal ? <Check size={22} /> : cOpen ? <ChevronDown /> : <Chevron />}
                        </button>
                        {cOpen &&
                          c.sections.map((s) => (
                            <a key={s.id} href={`#/percorso/${s.id}`} className={`sec-row sub ${s.id === resume ? 'reading' : ''}`}>
                              <span className="grow">{s.title}</span>
                              {s.desktop && <span className="chip desk">Desktop</span>}
                              {s.stub ? <span style={{ fontSize: 12, color: 'var(--text2)' }}>in arrivo</span> : read.has(s.id) ? <Check size={20} /> : s.id === resume ? <Reading /> : <Todo size={20} />}
                            </a>
                          ))}
                      </div>
                    );
                  })}
              </div>
            );
          })}

          <div className="section-label" style={{ justifyContent: 'flex-start', marginTop: 8 }}><Laptop /> <span>Progetti al computer</span></div>
          <div className="group">
            {index.projects.map((p, i) => {
              const done = (state.projects[p.id] ?? []).length;
              const ready = p.steps.length > 0;
              const open = ready && isProjectUnlocked(index, state, p);
              const finished = ready && done >= p.steps.length;
              const ps = index.parts.find((x) => x.id === p.unlockAfter);
              const status = !ready ? 'in arrivo' : finished ? 'completato' : open ? `${done}/${p.steps.length} tappe` : `si sblocca con la Parte ${ps?.roman}`;
              return (
                <a key={p.id} href={`#/progetto/${p.id}`} className="row">
                  <span className="lib-tile" style={{ background: open || finished ? 'var(--indigo)' : 'var(--text3)' }}>{i + 1}</span>
                  <span className="grow">
                    <span style={{ fontSize: 16, fontWeight: 600 }}>{p.title} <span style={{ fontSize: 12, color: 'var(--orange-text)' }} aria-label={`difficoltà ${p.stars} su 5`}>{'★'.repeat(p.stars)}</span></span>
                    <span className="st">{status}</span>
                  </span>
                  {finished ? <Check size={22} /> : <Chevron />}
                </a>
              );
            })}
          </div>

          <div className="section-label" style={{ justifyContent: 'flex-start', marginTop: 8 }}><Toolbox /> <span>Librerie da sapere assolutamente</span></div>
          <div className="group">
            {index.libraries.map((l) => {
              const ps = index.parts.find((p) => p.id === l.part);
              const learned = ps && ps.chapters.flatMap((c) => c.sections.filter((s) => !s.stub)).every((s) => read.has(s.id)) && ps.chapters.some((c) => c.sections.some((s) => !s.stub));
              return (
                <a key={l.id} href={`#/libreria/${l.id}`} className="row">
                  <span className="lib-tile" style={{ background: l.color }}>{l.abbr}</span>
                  <span className="grow">
                    <span style={{ fontSize: 16, fontWeight: 600 }}>{l.name} <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text2)' }}>· Parte {ps?.roman}</span></span>
                    <span className="st">{l.desc}</span>
                  </span>
                  {learned ? <span className="chip ess">Imparata</span> : <span className={`chip ${l.priority === 'Essenziale' ? 'ess' : l.priority === 'Molto utile' ? 'mu' : 'spec'}`}>{l.priority}</span>}
                </a>
              );
            })}
          </div>

          <div className="section-label" style={{ justifyContent: 'flex-start', marginTop: 8 }}><Doc /> <span>Appendice · Documentazione</span></div>
          <div className="group">
            {index.appendix.map((a) => (
              <a key={a.id} href={`#/doc/${a.id}`} className="row">
                <span style={{ width: 22, fontSize: 15, fontWeight: 700, color: 'var(--indigo)' }}>{a.letter}</span>
                <span className="grow"><span style={{ fontSize: 16 }}>{a.title}</span></span>
                <Chevron />
              </a>
            ))}
          </div>
        </>
      )}
    </main>
  );
}
