import { useEffect, useRef } from 'react';
import { runPython, isPythonBooted } from '../py/runner';

export interface FavContext {
  label: string;
  anchor: string;
  onSave: (text: string, kind: 'code' | 'text') => void;
}

const STAR = '<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.2l2.6 5.5 6 .8-4.4 4.1 1.1 6-5.3-2.9-5.3 2.9 1.1-6L3.4 9.5l6-.8z" fill="none" stroke="#8E8E93" stroke-width="1.5" stroke-linejoin="round"/></svg>';
const STAR_ON = STAR.replace('fill="none" stroke="#8E8E93"', 'fill="#FFCC00" stroke="#E0A800"');

/**
 * HTML dei contenuti (generato a build-time) con blocchi di codice eseguibili.
 * I preferiti sui blocchi di codice sono attivi solo nella tab Percorso (`fav`).
 */
export function RichHtml({ html, fav, className = 'prose' }: { html: string; fav?: FavContext; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const favRef = useRef(fav);
  favRef.current = fav;

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    root.querySelectorAll<HTMLPreElement>('pre.code[data-lang="python"]').forEach((pre) => {
      if (pre.parentElement?.classList.contains('runbox')) return;
      const box = document.createElement('div');
      box.className = 'runbox';
      pre.replaceWith(box);
      const head = document.createElement('div');
      head.className = 'runbox-head';
      head.innerHTML = `<span>PYTHON${pre.dataset.plot ? ' · GRAFICO' : ''}</span>`;
      if (favRef.current) {
        const star = document.createElement('button');
        star.className = 'star-btn';
        star.setAttribute('aria-label', 'Salva il codice nei preferiti');
        star.innerHTML = STAR;
        star.onclick = () => {
          favRef.current?.onSave(pre.textContent ?? '', 'code');
          star.innerHTML = STAR_ON;
        };
        head.appendChild(star);
      }
      box.append(head, pre);
      if (pre.dataset.run) {
        const foot = document.createElement('div');
        foot.className = 'runbox-foot';
        const btn = document.createElement('button');
        btn.className = 'run-btn';
        btn.innerHTML = '<svg width="11" height="12" viewBox="0 0 11 12" aria-hidden="true"><path d="M1 1l9 5-9 5z" fill="currentColor"/></svg>Esegui';
        const out = document.createElement('div');
        out.className = 'output';
        out.setAttribute('aria-live', 'polite');
        btn.onclick = async () => {
          btn.disabled = true;
          out.className = 'output';
          out.textContent = isPythonBooted() ? 'Esecuzione…' : 'Avvio Python (solo la prima volta, qualche secondo)…';
          const r = await runPython(pre.textContent ?? '');
          btn.disabled = false;
          out.className = r.ok ? 'output' : 'output err';
          out.textContent = r.ok ? r.out || (r.images.length ? '' : '(nessun output)') : `${r.out ? r.out + '\n' : ''}${r.error}`;
          for (const img of r.images) {
            const el = document.createElement('img');
            el.src = `data:image/png;base64,${img}`;
            el.alt = 'Grafico generato dal codice';
            out.appendChild(el);
          }
        };
        foot.append(btn, out);
        box.appendChild(foot);
      }
    });
  }, [html]);

  return <div ref={ref} className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}
