import { useState } from 'react';
import type { Stage } from '../engine/levels';

const EGG = 'M100 50 C130 50 146 100 146 128 C146 156 126 174 100 174 C74 174 54 156 54 128 C54 100 70 50 100 50 Z';
const EGG_SHADE = 'M56 140 C60 162 78 174 100 174 C122 174 140 162 144 140 C136 158 120 166 100 166 C80 166 64 158 56 140 Z';

const Stars = () => (
  <>
    <circle className="twinkle" cx="30" cy="40" r="1.5" fill="#fff" />
    <circle className="twinkle" cx="180" cy="28" r="1.2" fill="#fff" style={{ animationDelay: '.7s' }} />
    <circle className="twinkle" cx="150" cy="80" r="1" fill="#fff" style={{ animationDelay: '1.4s' }} />
    <circle className="twinkle" cx="60" cy="96" r="1.1" fill="#fff" style={{ animationDelay: '2s' }} />
  </>
);

function Egg({ spots }: { spots: [number, number, number][] }) {
  return (
    <>
      <path d={EGG} fill="#F3EED8" />
      <path d={EGG_SHADE} fill="#E2D9B5" />
      {spots.map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} fill="#B9CF7A" />)}
      <path d="M70 112 Q72 88 84 74" stroke="#fff" strokeWidth="5" strokeLinecap="round" fill="none" opacity=".7" />
    </>
  );
}

function Hatchling({ play }: { play: boolean }) {
  return (
    <>
      <ellipse cx="100" cy="182" rx="58" ry="7" fill="#000" opacity=".25" />
      <clipPath id="clipHatch"><path d="M-20 -60 H220 V118 L150 122 Q148 176 100 176 Q52 176 50 122 L-20 118 Z" /></clipPath>
      <g clipPath="url(#clipHatch)">
        <g className={play ? 'peek' : ''}>
          <g className="bob">
            <path d="M100 168 C100 138 90 122 98 100" stroke="#5E8A2A" strokeWidth="30" strokeLinecap="round" fill="none" />
            <path d="M98 166 C98 136 88 120 96 98" stroke="#7BA23A" strokeWidth="25" strokeLinecap="round" fill="none" />
            <circle cx="95" cy="128" r="6" fill="#D4CB2C" /><circle cx="100" cy="150" r="5" fill="#D4CB2C" />
            <ellipse cx="100" cy="85" rx="29" ry="22" fill="#5E8A2A" />
            <ellipse cx="100" cy="81" rx="29" ry="21" fill="#7BA23A" />
            <circle cx="120" cy="92" r="4.5" fill="#D4CB2C" />
            <g className="eyes">
              <circle cx="89" cy="81" r="9.5" fill="#fff" /><circle cx="111" cy="81" r="9.5" fill="#fff" />
              <ellipse cx="91.5" cy="82" rx="5" ry="7" fill="#111" /><ellipse cx="113.5" cy="82" rx="5" ry="7" fill="#111" />
              <circle cx="93" cy="79" r="1.7" fill="#fff" /><circle cx="115" cy="79" r="1.7" fill="#fff" />
            </g>
            <path d="M94 95 Q100 98.5 106 95" stroke="#1A1A1A" strokeWidth="2.2" strokeLinecap="round" fill="none" />
            <path d="M71 72 Q73 47 100 45 Q127 47 129 70 L121 63 L113 71 L104 62 L96 71 L88 63 L80 71 Z" fill="#F3EED8" />
            <circle cx="110" cy="54" r="3.5" fill="#B9CF7A" /><circle cx="88" cy="58" r="2.5" fill="#B9CF7A" />
          </g>
        </g>
      </g>
      <path d="M50 122 Q48 180 100 180 Q152 180 150 122 L140 114 L129 127 L117 112 L104 126 L92 112 L80 126 L68 112 L58 124 Z" fill="#F3EED8" />
      <path d="M51 140 Q56 176 100 177 Q144 176 149 140 Q146 170 100 172 Q54 170 51 140 Z" fill="#E2D9B5" />
      <circle cx="74" cy="148" r="6" fill="#B9CF7A" /><circle cx="126" cy="140" r="5" fill="#B9CF7A" /><circle cx="106" cy="160" r="4" fill="#B9CF7A" />
    </>
  );
}

function Python({ play }: { play: boolean }) {
  return (
    <g className={play ? 'wave' : ''}>
      <ellipse cx="100" cy="176" rx="80" ry="7" fill="#000" opacity=".22" />
      <g className="coilA">
        <path d="M156 150 Q180 146 192 160 Q174 168 152 162 Z" fill="#4E7A22" />
        <ellipse cx="100" cy="146" rx="74" ry="29" fill="#5E8A2A" />
        <ellipse cx="100" cy="140" rx="71" ry="26" fill="#7BA23A" />
        <circle cx="50" cy="144" r="8" fill="#D4CB2C" /><circle cx="94" cy="153" r="9" fill="#D4CB2C" /><circle cx="142" cy="148" r="8.5" fill="#D4CB2C" />
      </g>
      <g className="coilB">
        <ellipse cx="98" cy="114" rx="62" ry="25" fill="#5E8A2A" />
        <ellipse cx="98" cy="108" rx="59" ry="22" fill="#7BA23A" />
        <circle cx="62" cy="110" r="8" fill="#D4CB2C" /><circle cx="110" cy="117" r="9" fill="#D4CB2C" /><circle cx="144" cy="104" r="7" fill="#D4CB2C" />
      </g>
      <g className="neck">
        <path d="M122 102 C100 94 62 100 58 74 C55 50 76 38 100 42 C120 45 132 50 150 44" stroke="#5E8A2A" strokeWidth="26" strokeLinecap="round" fill="none" />
        <path d="M122 98 C100 90 62 96 58 70 C55 46 76 34 100 38 C120 41 132 46 150 40" stroke="#7BA23A" strokeWidth="24" strokeLinecap="round" fill="none" />
        <circle cx="60" cy="70" r="7" fill="#D4CB2C" /><circle cx="96" cy="37" r="7" fill="#D4CB2C" /><circle cx="96" cy="88" r="6" fill="#D4CB2C" />
        <ellipse cx="160" cy="43" rx="26" ry="16" fill="#5E8A2A" />
        <ellipse cx="160" cy="38" rx="26" ry="16" fill="#7BA23A" />
        <ellipse cx="181" cy="41" rx="9" ry="8" fill="#7BA23A" />
        <circle cx="154" cy="31" r="10" fill="#fff" />
        <ellipse cx="158.5" cy="31.5" rx="5.8" ry="8" fill="#111" />
        <circle cx="183" cy="36" r="2.2" fill="#111" />
        <path d="M172 47 Q178 49.5 184 46.5" stroke="#1A1A1A" strokeWidth="2.2" strokeLinecap="round" fill="none" />
        <path className="flick" d="M186 47 Q192 49 196 53 M196 53 L201 50 M196 53 L199 59" stroke="#F4A3B8" strokeWidth="3" strokeLinecap="round" fill="none" />
      </g>
    </g>
  );
}

function Sleeper({ play }: { play: boolean }) {
  return (
    <>
      <ellipse cx="100" cy="200" rx="70" ry="5" fill="#000" opacity=".15" />
      <path d="M-24 162 Q60 150 120 154 Q180 158 236 146" stroke="#6E4A2F" strokeWidth="18" strokeLinecap="round" fill="none" />
      <path d="M-24 158 Q60 146 120 150 Q180 154 236 142" stroke="#8B5E3C" strokeWidth="14" strokeLinecap="round" fill="none" />
      <path d="M176 152 Q186 136 200 130" stroke="#8B5E3C" strokeWidth="5" strokeLinecap="round" fill="none" />
      <ellipse cx="204" cy="126" rx="11" ry="6" transform="rotate(-30 204 126)" fill="#9CCB5A" />
      <ellipse cx="190" cy="134" rx="9" ry="5" transform="rotate(20 190 134)" fill="#86B84A" />
      <ellipse cx="14" cy="146" rx="10" ry="5.5" transform="rotate(-20 14 146)" fill="#9CCB5A" />
      <g transform="translate(0 -8)">
        <g className="breathe">
          <ellipse cx="100" cy="142" rx="58" ry="20" fill="#5E8A2A" />
          <ellipse cx="100" cy="138" rx="56" ry="18" fill="#7BA23A" />
          <circle cx="66" cy="139" r="6" fill="#D4CB2C" /><circle cx="108" cy="146" r="7" fill="#D4CB2C" /><circle cx="142" cy="137" r="5.5" fill="#D4CB2C" />
          <ellipse cx="100" cy="121" rx="50" ry="19" fill="#5E8A2A" />
          <ellipse cx="100" cy="117" rx="48" ry="17" fill="#7BA23A" />
          <circle cx="78" cy="120" r="6" fill="#D4CB2C" /><circle cx="124" cy="121" r="6" fill="#D4CB2C" />
          <ellipse cx="98" cy="101" rx="40" ry="17" fill="#5E8A2A" />
          <ellipse cx="98" cy="97" rx="38" ry="15" fill="#7BA23A" />
          <circle cx="76" cy="98" r="5" fill="#D4CB2C" />
          <ellipse cx="114" cy="87" rx="27" ry="15" fill="#5E8A2A" />
          <ellipse cx="114" cy="83" rx="27" ry="15" fill="#7BA23A" />
          <ellipse cx="137" cy="85" rx="9" ry="7.5" fill="#7BA23A" />
          <circle cx="104" cy="74" r="3" fill="#D4CB2C" />
          <path d="M105 82 Q111 76 117 82" stroke="#1A1A1A" strokeWidth="2.6" strokeLinecap="round" fill="none" />
          <path d="M124 92 Q132 97 141 90" stroke="#1A1A1A" strokeWidth="2.4" strokeLinecap="round" fill="none" />
          <circle cx="120" cy="90" r="3.6" fill="#FF8FA3" opacity=".55" />
          <circle cx="141" cy="81" r="1.8" fill="#111" />
        </g>
      </g>
      <circle className="bubbleR" cx="150" cy="58" r="10" fill="rgba(255,255,255,0.35)" stroke="#fff" strokeWidth="1.6" />
      <circle className="bubbleR" cx="152" cy="66" r="4" fill="rgba(255,255,255,0.35)" stroke="#fff" strokeWidth="1.2" style={{ animationDelay: '1.4s' }} />
      <g className={`bigbub ${play ? 'go' : ''}`}>
        <circle cx="173" cy="41" r="32" fill="rgba(255,255,255,0.28)" stroke="#fff" strokeWidth="2.4" />
        <path d="M156 30 Q162 20 174 18" stroke="#fff" strokeWidth="3" strokeLinecap="round" fill="none" opacity=".85" />
      </g>
      {[[156, 48, 15, 0], [166, 32, 19, 1], [178, 14, 24, 2]].map(([x, y, s, d], i) => (
        <text key={i} className="zzzR" x={x} y={y} fontSize={s} fontWeight="800" fill="#fff" style={{ animationDelay: `${d}s` }}>{i === 2 ? 'Z' : 'z'}</text>
      ))}
    </>
  );
}

const TOUCH_MS = [850, 1650, 2650, 1150, 2700, 2200];

/** Scena del serpente nella tab Statistiche: la base d'appoggio sta sempre sotto il soggetto. */
export function StageScene({ stage }: { stage: Stage }) {
  const [play, setPlay] = useState(false);
  const tap = () => {
    setPlay(false);
    requestAnimationFrame(() => setPlay(true));
    window.setTimeout(() => setPlay(false), TOUCH_MS[stage.level - 1]);
  };
  const hillCy = [326, 326, 326, 328, 336, 332][stage.level - 1];
  const lvl = stage.level;
  return (
    <button
      className="hero"
      onClick={tap}
      aria-label={`Livello ${lvl}, ${stage.name}: tocca, ${stage.touch}`}
      style={{ background: `linear-gradient(0deg, ${stage.sky[0]} 0%, ${stage.sky[1]} 100%)` }}
    >
      <svg viewBox="0 0 220 300" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" aria-hidden="true" style={{ inset: 0 }}>
        {lvl <= 4 && <Stars />}
        <ellipse cx="110" cy={hillCy} rx="190" ry="90" fill={stage.hill} />
        {lvl === 1 && (
          <g transform="translate(10 60)">
            <ellipse cx="100" cy="176" rx="44" ry="6" fill="#000" opacity=".35" />
            <g className={play ? 'wobble' : ''}><g className="breathe"><Egg spots={[[82, 100, 8], [118, 124, 10], [90, 148, 6], [122, 84, 5]]} /></g></g>
          </g>
        )}
        {lvl === 2 && (
          <g transform="translate(10 60)">
            <ellipse cx="100" cy="176" rx="44" ry="6" fill="#000" opacity=".35" />
            <g className={play ? 'jitter' : ''}>
              <g className="breathe">
                <Egg spots={[[82, 136, 7], [120, 142, 8], [122, 80, 5]]} />
                <path d="M57 112 L72 104 L80 116 L92 102 L102 114 L114 100 L124 112 L136 104 L144 110" stroke="#6B6240" strokeWidth="2.8" strokeLinejoin="round" strokeLinecap="round" fill="none" />
                <g className={`cracks ${play ? 'crackgrow' : ''}`} stroke="#6B6240" strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" fill="none">
                  <path d="M92 102 L88 88 L95 79 L92 70" /><path d="M114 100 L121 90 L117 79" /><path d="M80 116 L75 129 L82 139" /><path d="M124 112 L129 125 L124 133" />
                </g>
              </g>
            </g>
          </g>
        )}
        {lvl === 3 && (
          <g transform="translate(10 60)">
            <ellipse cx="100" cy="176" rx="46" ry="6" fill="#000" opacity=".35" />
            <path d={EGG} fill="#F3EED8" />
            <path d={EGG_SHADE} fill="#E2D9B5" />
            <circle cx="84" cy="152" r="6" fill="#B9CF7A" /><circle cx="122" cy="146" r="5" fill="#B9CF7A" />
            <path d="M70 96 L79 82 L88 93 L97 76 L107 90 L116 77 L125 92 L131 86 L136 106 Q129 134 100 136 Q71 134 64 106 Z" fill="#07070F" />
            <g className={play ? 'eyehide' : ''}>
              <ellipse className="glow" cx="100" cy="110" rx="24" ry="14" fill="#FFD43B" />
              <ellipse cx="100" cy="110" rx="14" ry="8.5" fill="#FFD43B" />
              <ellipse cx="100" cy="110" rx="2.6" ry="7.6" fill="#07070F" />
              <circle cx="105" cy="107" r="1.6" fill="#fff" opacity=".8" />
            </g>
            <path d="M150 172 L160 166 L158 178 Z" fill="#F3EED8" /><path d="M44 174 L52 166 L54 177 Z" fill="#F3EED8" />
          </g>
        )}
        {lvl === 4 && <g transform="translate(10 60)"><Hatchling play={play} /></g>}
        {lvl === 5 && <g transform="translate(6 82)"><Python play={play} /></g>}
        {lvl === 6 && <g transform="translate(14 74)"><Sleeper play={play} /></g>}
      </svg>
      <span className="tap">TOCCAMI</span>
    </button>
  );
}

export function Chick({ delay = 0 }: { delay?: number }) {
  return (
    <svg className="chick" viewBox="0 0 40 38" width="38" height="36" role="img" aria-label="Avanzate svolte" style={{ marginBottom: 4, overflow: 'visible', animationDelay: `${delay}s` }}>
      <path d="M16 31 L15 36 M23 31 L24 36" stroke="#FF9500" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="20" cy="21" r="12" fill="#FFCC00" />
      <circle cx="20" cy="22" r="9" fill="#FFD84D" />
      <path d="M17 9.5 Q18 5 20.5 8 Q22 4.5 24 8.5" stroke="#F2B705" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <circle cx="15.8" cy="17.5" r="1.9" fill="#222" /><circle cx="24.2" cy="17.5" r="1.9" fill="#222" />
      <circle cx="16.4" cy="16.9" r=".6" fill="#fff" /><circle cx="24.8" cy="16.9" r=".6" fill="#fff" />
      <path d="M17.6 21 L22.4 21 L20 24.6 Z" fill="#FF9500" />
      <circle cx="13" cy="22" r="2" fill="#FF8FA3" opacity=".6" /><circle cx="27" cy="22" r="2" fill="#FF8FA3" opacity=".6" />
      <g className="wingL" style={{ animationDelay: `${delay}s` }}><path d="M9 22 Q1 18 2 11 Q8 14 10.5 19 Z" fill="#F5B800" /></g>
      <g className="wingR" style={{ animationDelay: `${delay}s` }}><path d="M31 22 Q39 18 38 11 Q32 14 29.5 19 Z" fill="#F5B800" /></g>
    </svg>
  );
}

export function Ring({ pct, label, state }: { pct: number; label: string; state: 'done' | 'progress' | 'locked' | 'skipped' }) {
  const C = 138.2;
  return (
    <div>
      <svg width="56" height="56" viewBox="0 0 56 56" role="img" aria-label={`${label}: ${state === 'locked' ? 'bloccato' : state === 'skipped' ? 'saltato' : pct + '%'}`}>
        {state === 'skipped' ? (
          <circle cx="28" cy="28" r="22" fill="none" stroke="#AEAEB2" strokeWidth="4" strokeDasharray="5 5" />
        ) : (
          <circle cx="28" cy="28" r="22" fill="none" stroke="var(--fill)" strokeWidth="6" />
        )}
        {(state === 'done' || state === 'progress') && (
          <circle cx="28" cy="28" r="22" fill="none" stroke={state === 'done' ? 'var(--green)' : 'var(--blue)'} strokeWidth="6" strokeLinecap="round" strokeDasharray={`${(C * pct) / 100} ${C}`} transform="rotate(-90 28 28)" />
        )}
        {(state === 'done' || state === 'skipped') && <path d="M20 28.5l5 5 11-11" fill="none" stroke={state === 'done' ? 'var(--green)' : '#AEAEB2'} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}
        {state === 'progress' && <text x="28" y="32.5" textAnchor="middle" fontSize="13" fontWeight="700" fill="var(--blue)" fontFamily="-apple-system, system-ui, sans-serif">{pct}%</text>}
        {state === 'locked' && <path d="M22 27v-3a6 6 0 0112 0v3M20.5 27h15v10h-15z" fill="none" stroke="#AEAEB2" strokeWidth="2.2" strokeLinejoin="round" />}
      </svg>
      <span style={{ color: state === 'locked' || state === 'skipped' ? 'var(--text2)' : undefined, fontWeight: 500 }}>{label}</span>
    </div>
  );
}
