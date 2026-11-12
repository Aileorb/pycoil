import { useEffect, useRef, type CSSProperties } from 'react';
import { GOLD, GREEN, type Palette } from './Snake';

/** Percorso della spunta: curva ampia in basso e collo che si raccorda alla testa (viewBox 0 0 200 200). */
const PATH = 'M24 84 C44 98 56 114 66 127 C80 146 102 156 118 136 C130 121 140 102 151 88 C158 79 165 75 175 75';
const W = 24; // spessore del corpo
const LT = 46; // lunghezza della coda affusolata
const DRAW_MS = 850;
const NS = 'http://www.w3.org/2000/svg';

const SPARKS = [
  { dx: -34, dy: -30, d: 0, c: '#FFCC00', big: true },
  { dx: 26, dy: -38, d: 0.05, c: '#34C759', big: false },
  { dx: 38, dy: 6, d: 0.1, c: '#FFCC00', big: true },
  { dx: -6, dy: -48, d: 0.12, c: '#FF9500', big: false },
  { dx: 30, dy: 30, d: 0.08, c: '#34C759', big: false },
  { dx: -40, dy: 0, d: 0.15, c: '#FF9500', big: true }
];

/**
 * Il pitone dell'uroboro traccia una spunta, poi alza la testa contento.
 * `play` = false mostra subito lo stato finale (task già completata o «Riduci movimento»).
 */
export function SuccessSnake({ gold = false, play = true, onHappy }: { gold?: boolean; play?: boolean; onHappy?: () => void }) {
  const p: Palette = gold ? GOLD : GREEN;
  const root = useRef<SVGSVGElement>(null);
  const body = useRef<SVGPathElement>(null);
  const shade = useRef<SVGPathElement>(null);
  const tail = useRef<SVGPathElement>(null);
  const tailShade = useRef<SVGPathElement>(null);
  const head = useRef<SVGGElement>(null);
  const spots = useRef<SVGGElement>(null);
  const happyCb = useRef(onHappy);
  happyCb.current = onHappy;

  useEffect(() => {
    const b = body.current!;
    const L = b.getTotalLength();
    const at = (d: number) => b.getPointAtLength(Math.max(0, Math.min(L, d)));
    const dir = (d: number) => {
      const a = at(d - 0.6), c = at(d + 0.6);
      return Math.atan2(c.y - a.y, c.x - a.x);
    };
    // macchie come nell'uroboro: centrate sul corpo, più piccole verso la coda
    const g = spots.current!;
    g.replaceChildren();
    const dots: [number, SVGCircleElement][] = [];
    for (let d = LT - 10, i = 0; d < L - 16; d += 23, i++) {
      const pt = at(d);
      const c = document.createElementNS(NS, 'circle');
      c.setAttribute('cx', pt.x.toFixed(1));
      c.setAttribute('cy', pt.y.toFixed(1));
      c.setAttribute('r', Math.min(5.2, 2.6 + i * 0.9).toFixed(1));
      c.setAttribute('class', 'sx-dot');
      g.appendChild(c);
      dots.push([d, c]);
    }
    // coda che si affusola gradualmente fino a una punta arrotondata
    const tailPath = (upto: number) => {
      const end = Math.min(upto, LT);
      if (end <= 0.5) return '';
      const left: string[] = [], right: string[] = [];
      for (let d = 0; d <= end; d += 2) {
        const w = 2.2 + (W / 2 - 2.2) * Math.sin(((d / LT) * Math.PI) / 2);
        const a = dir(d), pt = at(d), nx = -Math.sin(a), ny = Math.cos(a);
        left.push(`${(pt.x + nx * w).toFixed(2)} ${(pt.y + ny * w).toFixed(2)}`);
        right.push(`${(pt.x - nx * w).toFixed(2)} ${(pt.y - ny * w).toFixed(2)}`);
      }
      const t0 = at(0), a0 = dir(0);
      const tip = `${(t0.x - Math.cos(a0) * 2.2).toFixed(2)} ${(t0.y - Math.sin(a0) * 2.2).toFixed(2)}`;
      return `M${right[0]} Q${tip} ${left[0]} L${left.join(' L')} L${right.reverse().join(' L')} Z`;
    };
    const draw = (d: number) => {
      const tp = tailPath(d);
      tail.current!.setAttribute('d', tp);
      tailShade.current!.setAttribute('d', tp);
      const visible = Math.max(0, d - LT + 1);
      for (const el of [b, shade.current!]) {
        el.style.strokeDasharray = `${visible} ${L + 100}`;
        el.style.strokeDashoffset = String(-(LT - 1));
        el.style.visibility = visible < 0.5 ? 'hidden' : 'visible';
      }
      for (const [pos, c] of dots) c.classList.toggle('on', pos < d - 10);
      const pt = at(d);
      head.current!.setAttribute('transform', `translate(${pt.x.toFixed(2)} ${pt.y.toFixed(2)}) rotate(${((dir(d) * 180) / Math.PI).toFixed(2)})`);
    };

    const svg = root.current!;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (!play || reduce) {
      draw(L);
      svg.classList.add('sx-play', 'sx-happy');
      return;
    }
    let raf = 0;
    const timers: number[] = [];
    draw(0);
    svg.classList.add('sx-play');
    const t0 = performance.now();
    const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
    const step = (now: number) => {
      const k = Math.min(1, (now - t0) / DRAW_MS);
      draw(ease(k) * L);
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    timers.push(window.setTimeout(() => {
      svg.classList.add('sx-happy');
      if ('vibrate' in navigator) navigator.vibrate?.(12);
      happyCb.current?.();
    }, 900));
    return () => {
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
    };
  }, [play]);

  return (
    <svg ref={root} className="sx" viewBox="0 0 200 200" role="img" aria-label="Il pitone disegna una spunta">
      <circle className="sx-halo" cx="100" cy="104" r="78" />
      <circle className="sx-ring" cx="100" cy="104" r="82" />
      <g transform="translate(0 3.2)">
        <path ref={tailShade} fill={p.shade} />
        <path ref={shade} d={PATH} stroke={p.shade} strokeWidth={W} strokeLinecap="round" fill="none" />
      </g>
      <path ref={tail} fill={p.body} />
      <path ref={body} d={PATH} stroke={p.body} strokeWidth={W} strokeLinecap="round" fill="none" />
      <g ref={spots} fill={p.spot} />
      {/* testa dell'uroboro, specchiata per guardare a destra; l'origine è la punta del corpo */}
      <g ref={head} transform="translate(24 84)">
        <g className="sx-pop">
          <g className="sx-nod">
            <g transform="translate(6 0)">
              <ellipse cx="0" cy="3.1" rx="20" ry="14.5" fill={p.shade} />
              <ellipse cx="16.6" cy="5.2" rx="6.9" ry="5.9" fill={p.shade} />
              <ellipse cx="0" cy="0" rx="20" ry="14.5" fill={p.body} />
              <ellipse cx="16.6" cy="2.1" rx="6.9" ry="5.9" fill={p.body} />
              <circle cx="-11.7" cy="-8.3" r="2.4" fill={p.spot} />
              <circle cx="19.3" cy="-0.7" r="1.4" fill="#111" />
              <path className="sx-tongue" d="M23 5 Q28 6 32 9 M32 9 L36 6 M32 9 L35 14" stroke="#F4A3B8" strokeWidth="2.4" strokeLinecap="round" fill="none" />
              <g className="sx-eye-open">
                <circle cx="-2.1" cy="-5.5" r="7.2" fill="#fff" />
                <ellipse cx="1" cy="-4.8" rx="3.8" ry="5.2" fill="#111" />
                <circle cx="-0.3" cy="-7.2" r="1.4" fill="#fff" />
              </g>
              <path className="sx-eye-happy" d="M-8.6 -4 Q-2.1 -12.5 4.4 -4" stroke="#111" strokeWidth="2.6" strokeLinecap="round" fill="none" />
              <path d="M20 5.9 Q13.1 9 6.2 6.6" stroke="#1A1A1A" strokeWidth="1.6" strokeLinecap="round" fill="none" />
              <circle cx="-6.2" cy="4.8" r="2.6" fill="#FF8FA3" opacity=".55" />
            </g>
          </g>
        </g>
      </g>
      <g>
        {SPARKS.map((s, i) => (
          <path
            key={i}
            className="sx-spark"
            style={{ '--dx': `${s.dx}px`, '--dy': `${s.dy}px`, animationDelay: `${s.d}s` } as CSSProperties}
            fill={s.c}
            d={s.big ? 'M181 68 l3 -8 3 8 8 3 -8 3 -3 8 -3 -8 -8 -3 Z' : 'M181 68 l2.4 -6 2.4 6 6 2.4 -6 2.4 -2.4 6 -2.4 -6 -6 -2.4 Z'}
          />
        ))}
      </g>
    </svg>
  );
}
