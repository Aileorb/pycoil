import { useEffect, useRef, useState } from 'react';
import { useStore } from '../store';
import { Sheet } from './Sheet';
import { Chevron, Star } from './icons';
import { go } from '../router';

/** Pulsante tondo con stella e badge: esiste solo nella tab Percorso. */
export function FavoritesButton() {
  const { state } = useStore();
  const [open, setOpen] = useState(false);
  const n = state.favorites.length;
  const [bump, setBump] = useState(false);
  const prev = useRef(n);
  useEffect(() => {
    if (n > prev.current) {
      setBump(true);
      window.setTimeout(() => setBump(false), 500);
    }
    prev.current = n;
  }, [n]);
  return (
    <>
      <button className="icon-circle" aria-label={`Preferiti, ${n} salvati`} onClick={() => setOpen(true)}>
        <Star size={18} />
        {n > 0 && <span className={`badge ${bump ? 'pop' : ''}`}>{n}</span>}
      </button>
      {open && <FavoritesSheet onClose={() => setOpen(false)} />}
    </>
  );
}

function FavoritesSheet({ onClose }: { onClose: () => void }) {
  const { state, removeFavorite } = useStore();
  const [swiped, setSwiped] = useState<string | null>(null);
  const startX = useRef(0);
  return (
    <Sheet title="Preferiti" onClose={onClose}>
      {state.favorites.length === 0 ? (
        <div className="empty">
          Seleziona un pezzo di testo in una sezione e tocca <b>☆ Salva</b>, oppure tocca la stella su un blocco di codice.
        </div>
      ) : (
        <div className="group">
          {state.favorites.map((f) => (
            <div key={f.id} className="swipe-row" style={{ borderTop: '0.5px solid var(--sep)' }}>
              <button className="del" onClick={() => removeFavorite(f.id)}>Elimina</button>
              <div
                className="front"
                style={{ transform: swiped === f.id ? 'translateX(-88px)' : 'none' }}
                onTouchStart={(e) => (startX.current = e.touches[0].clientX)}
                onTouchEnd={(e) => {
                  const dx = e.changedTouches[0].clientX - startX.current;
                  if (dx < -40) setSwiped(f.id);
                  else if (dx > 30) setSwiped(null);
                }}
              >
                <button
                  className="row"
                  onClick={() => {
                    if (swiped === f.id) return setSwiped(null);
                    onClose();
                    go(`${f.anchor.replace(/^#\//, '')}?hl=${encodeURIComponent(f.text.slice(0, 60))}`);
                  }}
                >
                  <Star size={20} />
                  <span className="grow">
                    {f.kind === 'code' ? <span className="fav-code">{f.text.split('\n')[0]}</span> : <span style={{ fontSize: 15, lineHeight: 1.4 }}>“{f.text.length > 160 ? f.text.slice(0, 160) + '…' : f.text}”</span>}
                    <span className="st">{f.kind === 'code' ? 'Codice' : 'Testo'} · {f.label}</span>
                  </span>
                  <Chevron />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {state.favorites.length > 0 && <p style={{ fontSize: 13, color: 'var(--text2)', margin: '0 16px' }}>Tocca un preferito per aprire la sezione da cui viene. Scorri a sinistra per eliminarlo.</p>}
    </Sheet>
  );
}

/** Menu "☆ Salva" sopra il testo selezionato, dentro l'area indicata. */
export function SelectionSaver({ scope, onSave }: { scope: React.RefObject<HTMLElement | null>; onSave: (text: string) => void }) {
  const [pos, setPos] = useState<{ x: number; y: number; text: string } | null>(null);
  useEffect(() => {
    const onSel = () => {
      const sel = window.getSelection();
      const text = sel?.toString().trim() ?? '';
      if (!sel || text.length < 3 || !scope.current || !sel.rangeCount) return setPos(null);
      const range = sel.getRangeAt(0);
      if (!scope.current.contains(range.commonAncestorContainer)) return setPos(null);
      const r = range.getBoundingClientRect();
      setPos({ x: r.left + r.width / 2 + window.scrollX, y: r.top + window.scrollY - 46, text });
    };
    document.addEventListener('selectionchange', onSel);
    return () => document.removeEventListener('selectionchange', onSel);
  }, [scope]);
  if (!pos) return null;
  return (
    <div className="sel-menu" style={{ left: Math.max(70, Math.min(window.innerWidth - 70, pos.x)), top: Math.max(8, pos.y) }} role="toolbar" aria-label="Menu selezione">
      <button
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => {
          onSave(pos.text);
          window.getSelection()?.removeAllRanges();
          setPos(null);
        }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.2l2.6 5.5 6 .8-4.4 4.1 1.1 6-5.3-2.9-5.3 2.9 1.1-6L3.4 9.5l6-.8z" fill="#FFD60A" /></svg>
        Salva
      </button>
    </div>
  );
}
