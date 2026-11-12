import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

export function Sheet({ title, onClose, children, full = false, action }: { title: string; onClose: () => void; children: ReactNode; full?: boolean; action?: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);
  return createPortal(
    <>
      <div className="sheet-backdrop" onClick={onClose} aria-hidden="true" />
      <section className={`sheet ${full ? 'full' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="sheet-grab"><span /></div>
        <div className="sheet-head">
          <h2>{title}</h2>
          {action ?? <button onClick={onClose}>Fine</button>}
        </div>
        <div className="sheet-body">{children}</div>
      </section>
    </>,
    document.body
  );
}

export function Toast({ text }: { text: string | null }) {
  if (!text) return null;
  return createPortal(<div className="toast" role="status">{text}</div>, document.body);
}
