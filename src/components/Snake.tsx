import type { ReactNode } from 'react';
import type { MascotMood } from '../engine/levels';

export interface Palette { body: string; shade: string; tail: string; spot: string }
export const GREEN: Palette = { body: '#7BA23A', shade: '#5E8A2A', tail: '#4E7A22', spot: '#D4CB2C' };
export const GOLD: Palette = { body: '#EDC23A', shade: '#C9971C', tail: '#A8790E', spot: '#FFE88A' };

const NECK_SHADE = 'M122 102 C100 94 62 100 58 74 C55 50 76 38 100 42 C120 45 132 50 150 44';
const NECK = 'M122 98 C100 90 62 96 58 70 C55 46 76 34 100 38 C120 41 132 46 150 40';

/** Pitone arrotolato nello stile piatto della mascotte (viewBox 0 0 210 190). */
export function CoiledSnake({
  p = GREEN,
  tailClass,
  tailUp = false,
  neckClass,
  head
}: {
  p?: Palette;
  tailClass?: string;
  tailUp?: boolean;
  neckClass?: string;
  head?: ReactNode;
}) {
  return (
    <>
      <path className={tailClass} d={tailUp ? 'M156 150 Q182 140 196 124 Q190 150 152 162 Z' : 'M156 150 Q180 146 192 160 Q174 168 152 162 Z'} fill={p.tail} />
      <ellipse cx="100" cy="146" rx="74" ry="29" fill={p.shade} />
      <ellipse cx="100" cy="140" rx="71" ry="26" fill={p.body} />
      <g className="spot" fill={p.spot}>
        <circle cx="50" cy="144" r="8" /><circle cx="94" cy="153" r="9" /><circle cx="142" cy="148" r="8.5" />
      </g>
      <ellipse cx="98" cy="114" rx="62" ry="25" fill={p.shade} />
      <ellipse cx="98" cy="108" rx="59" ry="22" fill={p.body} />
      <g className="spot" fill={p.spot}>
        <circle cx="62" cy="110" r="8" /><circle cx="110" cy="117" r="9" /><circle cx="144" cy="104" r="7" />
      </g>
      <g className={neckClass}>
        <path d={NECK_SHADE} stroke={p.shade} strokeWidth="26" strokeLinecap="round" fill="none" />
        <path d={NECK} stroke={p.body} strokeWidth="24" strokeLinecap="round" fill="none" />
        <g className="spot" fill={p.spot}>
          <circle cx="60" cy="70" r="7" /><circle cx="96" cy="37" r="7" /><circle cx="96" cy="88" r="6" />
        </g>
        <ellipse cx="160" cy="43" rx="26" ry="16" fill={p.shade} />
        <ellipse cx="160" cy="38" rx="26" ry="16" fill={p.body} />
        <ellipse cx="181" cy="41" rx="9" ry="8" fill={p.body} />
        <circle cx="183" cy="36" r="2.2" fill="#111" />
        {head}
      </g>
    </>
  );
}

const Eye = ({ y = 31 }: { y?: number }) => (
  <>
    <circle cx="154" cy={y} r="10" fill="#fff" />
    <ellipse cx="158.5" cy={y + 0.5} rx="5.8" ry="8" fill="#111" />
    <circle cx="160.5" cy={y - 3} r="2" fill="#fff" />
  </>
);
const Smile = () => <path d="M171 46 Q178 52 186 45" stroke="#1A1A1A" strokeWidth="2.4" strokeLinecap="round" fill="none" />;
const OpenSmile = () => <path d="M170 45 Q178 55 187 44 Z" fill="#7A1F2B" stroke="#1A1A1A" strokeWidth="1.8" strokeLinejoin="round" />;
const Blush = ({ y = 46 }: { y?: number }) => <circle cx="166" cy={y} r="4" fill="#FF8FA3" opacity=".55" />;
const Tongue = () => <path className="m-tongue" d="M186 48 Q192 50 196 54 M196 54 L201 51 M196 54 L199 60" stroke="#F4A3B8" strokeWidth="3" strokeLinecap="round" fill="none" />;

const Confetti = ({ dense = false }: { dense?: boolean }) => {
  const items = dense
    ? [[0, -30, '#FF9500', 0], [40, -36, '#FF2D55', 0.3], [80, -26, '#34C759', 0.9], [120, -36, '#007AFF', 1.5], [160, -30, '#AF52DE', 0.6], [200, -24, '#FFCC00', 1.2], [24, -12, '#5AC8FA', 1.8], [184, -8, '#FF9500', 2.1]]
    : [[10, -30, '#FF9500', 0], [200, -20, '#34C759', 0.8], [120, -36, '#007AFF', 1.6], [60, -26, '#AF52DE', 1.2]];
  return (
    <g className="confetti">
      {items.map(([x, y, c, d], i) => (
        <rect key={i} x={x as number} y={y as number} width="7" height="13" rx="2" fill={c as string} style={{ animationDelay: `${d}s` }} />
      ))}
    </g>
  );
};

function Firework({ cx, cy, color, delay }: { cx: number; cy: number; color: string; delay: number }) {
  const pts = Array.from({ length: 8 }, (_, i) => [cx + 14 * Math.cos((i * Math.PI) / 4), cy + 14 * Math.sin((i * Math.PI) / 4)]);
  return (
    <g className="fw" style={{ animationDelay: `${delay}s` }}>
      {pts.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="3" fill={color} />)}
    </g>
  );
}

/** Uroboro (stessa geometria dell'icona, viewBox 0 0 512 512). */
export function OuroborosShapes({ p = GREEN, spot = p.spot, crown = false, shade = true }: { p?: Palette; spot?: string; crown?: boolean; shade?: boolean }) {
  return (
    <>
      {shade && (
        <>
          <path d="M317.8 122 A165 165 0 0 1 313.8 429.6" stroke={p.shade} strokeWidth="70" fill="none" />
          <path d="M327.7 461.7 A196.0 196.0 0 0 1 137.6 426.6 A188.4 188.4 0 0 1 72.7 252.5 A180.7 180.7 0 0 1 184.0 113.3 A12.0 12.0 0 0 1 193.8 135.2 A149.0 149.0 0 0 0 111.7 257.3 A141.3 141.3 0 0 0 171.2 383.5 A133.6 133.6 0 0 0 302.6 396.4 Z" fill={p.shade} />
          <ellipse cx="284" cy="109" rx="58" ry="42" fill={p.shade} />
          <ellipse cx="236" cy="115" rx="20" ry="17" fill={p.shade} />
        </>
      )}
      <path d="M317.8 113 A165 165 0 0 1 313.8 420.6" stroke={p.body} strokeWidth="70" fill="none" />
      <path d="M327.7 452.7 A196.0 196.0 0 0 1 137.6 417.6 A188.4 188.4 0 0 1 72.7 243.5 A180.7 180.7 0 0 1 184.0 104.3 A12.0 12.0 0 0 1 193.8 126.2 A149.0 149.0 0 0 0 111.7 248.3 A141.3 141.3 0 0 0 171.2 374.5 A133.6 133.6 0 0 0 302.6 387.4 Z" fill={p.body} />
      <g fill={spot}>
        <circle cx="398.9" cy="183.5" r="15" /><circle cx="418.5" cy="294.7" r="15" /><circle cx="362.1" cy="392.4" r="15" /><circle cx="256" cy="431" r="14" /><circle cx="149.9" cy="392.4" r="12" /><circle cx="93.5" cy="294.7" r="11" /><circle cx="113.1" cy="183.5" r="8.5" />
      </g>
      <ellipse cx="284" cy="100" rx="58" ry="42" fill={p.body} />
      <ellipse cx="236" cy="106" rx="20" ry="17" fill={p.body} />
      <circle cx="318" cy="76" r="7" fill={spot} />
      {crown && (
        <>
          <path d="M248 70 L252 30 L270 50 L286 18 L302 50 L320 30 L324 70 Z" fill="#FFE14D" stroke="#A87400" strokeWidth="5" strokeLinejoin="round" />
          <circle cx="286" cy="56" r="7" fill="#FF2D55" /><circle cx="264" cy="60" r="5" fill="#5AC8FA" /><circle cx="308" cy="60" r="5" fill="#5AC8FA" />
        </>
      )}
      <circle cx="290" cy="84" r="21" fill="#fff" />
      <ellipse cx="281" cy="86" rx="11" ry="15" fill="#111" />
      <circle cx="285" cy="79" r="4" fill="#fff" />
      <circle cx="228" cy="98" r="4" fill="#111" />
      <path d="M226 117 Q246 126 266 119" stroke="#1A1A1A" strokeWidth="4.5" strokeLinecap="round" fill="none" />
    </>
  );
}

/** Icona dell'app. Ogni volta che `spin` cambia (e non è 0) il serpente fa un giro in senso antiorario. */
export function Logo({ size = 30, spin = 0 }: { size?: number; spin?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" role="img" aria-label="Logo PyCoil">
      <rect width="512" height="512" rx="114" fill="#FCF0CF" />
      <g key={spin} className={spin ? 'logo-spin' : undefined}>
        <OuroborosShapes />
      </g>
    </svg>
  );
}

export function Flame({ size = 44, color = '#FF9500', inner = '#FFCC00', cracked = false }: { size?: number; color?: string; inner?: string | null; cracked?: boolean }) {
  return (
    <svg width={size} height={size * 1.09} viewBox="0 0 24 26" aria-hidden="true" style={{ flexShrink: 0 }}>
      <path d="M12 1.5c.8 3.6 5.6 6 5.6 11.4a5.6 5.6 0 01-11.2 0c0-2.3 1-3.8 2.3-5.1.3 1.6 1 2.8 2.2 3.3-.5-3.7.5-7 1.1-9.6z" fill={color} />
      {inner && <path d="M12 14c.5 1.6 2.3 2.4 2.3 4.4a2.3 2.3 0 01-4.6 0c0-1.5 1-2.6 2.3-4.4z" fill={inner} />}
      {cracked && <path d="M9 10 L12 14 L10.5 18" stroke="#EFEDE8" strokeWidth="1.4" fill="none" strokeLinecap="round" />}
    </svg>
  );
}

function Bones() {
  const bones: [number, number, number, number][] = [
    [60, 166, -8, 1.1], [146, 165, -4, 1], [104, 168, 6, 1.2], [90, 157, -30, 0.9], [118, 158, 30, 0.9], [76, 151, 18, 1], [126, 150, -16, 1.05], [100, 140, -4, 0.95]
  ];
  const Bone = ({ fill, x, y, a, s }: { fill: string; x: number; y: number; a: number; s: number }) => (
    <g transform={`translate(${x} ${y}) rotate(${a}) scale(${s})`} fill={fill}>
      <rect x="-20" y="-4.5" width="40" height="9" rx="4.5" />
      <circle cx="-20" cy="-5" r="6.5" /><circle cx="-20" cy="5" r="6.5" /><circle cx="20" cy="-5" r="6.5" /><circle cx="20" cy="5" r="6.5" />
    </g>
  );
  return (
    <>
      <ellipse cx="100" cy="177" rx="86" ry="7" fill="#000" opacity=".12" />
      <g className="rattle">
        {bones.map(([x, y, a, s], i) => (
          <g key={i}>
            <Bone fill="#B9B19E" x={x + 1.5} y={y + 2.5} a={a} s={s} />
            <Bone fill="#F7F3E8" x={x} y={y} a={a} s={s} />
          </g>
        ))}
      </g>
      <g className="skullhop">
        <g transform="translate(100 110) scale(1.3) translate(-162 -38)">
          <ellipse cx="160" cy="42" rx="26" ry="16" fill="#B9B19E" /><ellipse cx="181" cy="45" rx="9" ry="8" fill="#B9B19E" />
          <ellipse cx="160" cy="38" rx="26" ry="16" fill="#F7F3E8" /><ellipse cx="181" cy="41" rx="9" ry="8" fill="#F7F3E8" />
          <circle cx="144" cy="40" r="3" fill="#E9E1CC" /><circle cx="170" cy="28" r="3.2" fill="#E9E1CC" /><circle cx="138" cy="32" r="2.2" fill="#E9E1CC" />
          <ellipse cx="154" cy="31" rx="9.5" ry="9" fill="#4A4A4F" />
          <circle cx="183" cy="36" r="2.2" fill="#4A4A4F" />
          <path d="M148 47 Q166 52 187 46" stroke="#8E8676" strokeWidth="1.8" strokeLinecap="round" fill="none" />
          <path d="M166 49.6 l2 2.6 l2 -2.6 l2 2.6 l2 -2.6 l2 2.4" stroke="#8E8676" strokeWidth="1.2" strokeLinejoin="round" fill="none" />
          <path d="M162 23 l3 5 l-3 4" stroke="#C9C1AE" strokeWidth="1.4" strokeLinecap="round" fill="none" />
        </g>
      </g>
      <g>
        {[[30, 168, 12, 0], [70, 178, 14, 0.08], [120, 180, 14, 0.12], [168, 170, 12, 0.05], [200, 156, 9, 0.15], [146, 92, 9, 0.22], [60, 120, 8, 0.3]].map(([x, y, r, d], i) => (
          <circle key={i} className="dust" cx={x} cy={y} r={r} fill={i % 2 ? '#D9D1C1' : '#CFC6B4'} style={{ animationDelay: `${d}s` }} />
        ))}
      </g>
    </>
  );
}

/**
 * Mascotte del widget streak. `play` = animazione al tocco in corso.
 * Le fasce seguono il prompt: persa, 0, 1–2, 3–6, 7–13, 14–29, 30+.
 */
export function Mascot({ mood, play }: { mood: MascotMood; play: boolean }) {
  let body: ReactNode;
  let wrapperClass = '';
  switch (mood) {
    case 'lost':
      body = <Bones />;
      wrapperClass = play ? 'dustgo' : '';
      break;
    case 'sleepy':
      wrapperClass = play ? 't-wake' : '';
      body = (
        <g className="m-slow">
          <CoiledSnake
            neckClass="m-droop"
            head={
              <>
                <Eye />
                {!play && (
                  <g>
                    <path d="M143.5 31.5 A10.5 10.5 0 0 1 164.5 31.5 L164.5 33 L143.5 33 Z" fill={GREEN.body} />
                    <path d="M144 33 L164 33" stroke="#1A1A1A" strokeWidth="2" strokeLinecap="round" />
                  </g>
                )}
                {play ? <Smile /> : <path d="M172 47.5 Q178 46.5 184 47.5" stroke="#1A1A1A" strokeWidth="2.2" strokeLinecap="round" fill="none" />}
                {!play && (
                  <>
                    <circle className="m-sigh" cx="196" cy="40" r="4" fill="#fff" opacity=".9" />
                    <circle className="m-sigh" cx="200" cy="36" r="3" fill="#fff" opacity=".9" style={{ animationDelay: '.25s' }} />
                  </>
                )}
              </>
            }
          />
        </g>
      );
      break;
    case 'smile':
      wrapperClass = play ? 't-cheer' : '';
      body = <CoiledSnake neckClass="m-bob" head={<><Eye /><Smile /></>} />;
      break;
    case 'wave':
      wrapperClass = play ? 't-cheer' : '';
      body = <CoiledSnake neckClass="m-bob" tailUp tailClass="m-wag" head={<><Eye /><Smile /><Blush /></>} />;
      break;
    case 'jump':
      wrapperClass = play ? 't-cheer' : '';
      body = (
        <>
          <Confetti />
          <g className="m-jump"><CoiledSnake tailUp tailClass="m-wag" head={<><Eye /><OpenSmile /><Blush /></>} /></g>
        </>
      );
      break;
    case 'party':
      wrapperClass = play ? 't-cheer' : '';
      body = (
        <>
          <Confetti dense />
          <g className="m-jump">
            <CoiledSnake
              tailUp
              tailClass="m-wag"
              head={
                <>
                  <path d="M147 26 L160 -10 L174 24 Z" fill="#FF2D55" />
                  <path d="M151 16 L169 16 M155 5 L165 5" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
                  <circle cx="160" cy="-11" r="6" fill="#FFCC00" />
                  <path d="M154 19 L157.3 26.5 L165.4 27.3 L159.3 32.7 L161 40.7 L154 36.6 L147 40.7 L148.7 32.7 L142.6 27.3 L150.7 26.5 Z" fill="#FFCC00" stroke="#B88600" strokeWidth="1.5" strokeLinejoin="round" />
                  <OpenSmile /><Tongue /><Blush />
                </>
              }
            />
          </g>
        </>
      );
      break;
    case 'gold':
      body = (
        <>
          <Firework cx={20} cy={-10} color="#FF2D55" delay={0} />
          <Firework cx={190} cy={-20} color="#FF9500" delay={0.6} />
          <Firework cx={100} cy={-26} color="#5AC8FA" delay={1.2} />
          <Confetti />
          <g className={play ? 'morph-out' : ''}>
            <g className="m-jump">
              <CoiledSnake
                p={GOLD}
                tailUp
                tailClass="m-wag"
                head={
                  <>
                    <path d="M144 26 L146 8 L154 16 L160 2 L166 16 L174 8 L176 26 Z" fill="#FFE14D" stroke="#A87400" strokeWidth="2" strokeLinejoin="round" />
                    <circle cx="160" cy="20" r="2.8" fill="#FF2D55" /><circle cx="150" cy="21" r="2" fill="#5AC8FA" /><circle cx="170" cy="21" r="2" fill="#5AC8FA" />
                    <Eye y={33} /><OpenSmile /><Blush y={47} />
                  </>
                }
              />
              <path className="sparkle" d="M30 96 l3 -8 l3 8 l8 3 l-8 3 l-3 8 l-3 -8 l-8 -3 Z" fill="#fff" />
              <path className="sparkle" d="M168 118 l2 -6 l2 6 l6 2 l-6 2 l-2 6 l-2 -6 l-6 -2 Z" fill="#fff" style={{ animationDelay: '.5s' }} />
              <path className="sparkle" d="M120 64 l2 -6 l2 6 l6 2 l-6 2 l-2 6 l-2 -6 l-6 -2 Z" fill="#fff" style={{ animationDelay: '1s' }} />
            </g>
          </g>
          <g className={`ouro ${play ? 'morph-in' : ''}`}>
            <g transform="translate(100 66) scale(0.42) translate(-256 -266)">
              <OuroborosShapes p={GOLD} spot="#FFF8DC" crown />
            </g>
          </g>
        </>
      );
      break;
  }
  return (
    <div className={wrapperClass} style={{ width: '100%', height: '100%' }}>
      <svg viewBox="-20 -40 250 250" width="100%" height="100%" aria-hidden="true" style={{ overflow: 'visible' }}>
        {mood !== 'lost' && <ellipse cx="100" cy="177" rx="76" ry="7" fill="#000" opacity=".1" />}
        {body}
      </svg>
    </div>
  );
}
