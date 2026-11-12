import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Back } from './icons';

/** Pagina a schermo intero con il bottone per tornare indietro in alto a sinistra (come le pagine del Percorso). */
export function PageScreen({ title, backLabel, onClose, children }: { title: string; backLabel: string; onClose: () => void; children: ReactNode }) {
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
    <section className="page-screen" role="dialog" aria-modal="true" aria-label={title}>
      <header className="nav-bar">
        <button className="back" onClick={onClose}><Back />{backLabel}</button>
        <span className="ttl">{title}</span>
        <span style={{ width: 70 }} aria-hidden="true" />
      </header>
      <div className="page-body">
        <div className="page-inner">
          <h1 className="large-title">{title}</h1>
          {children}
        </div>
      </div>
    </section>,
    document.body
  );
}
