// Icone in stile SF Symbols, disegnate a mano in SVG (niente librerie esterne).
type P = { size?: number; color?: string };

export const Chevron = ({ size = 13, color = 'currentColor' }: P) => (
  <svg className="chev" width={size} height={size} viewBox="0 0 24 24" aria-hidden="true"><path d="M8 4l8 8-8 8" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
);
export const ChevronDown = ({ size = 13, color = 'currentColor' }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8l8 8 8-8" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
);
export const Back = () => (
  <svg width="12" height="20" viewBox="0 0 12 20" aria-hidden="true"><path d="M10 2L2 10l8 8" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
);
export const Check = ({ size = 26 }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" role="img" aria-label="Completata"><circle cx="12" cy="12" r="11" fill="var(--green)" /><path d="M7 12.5l3.2 3.2L17 9" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
);
export const Todo = ({ size = 26 }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" role="img" aria-label="Da fare"><circle cx="12" cy="12" r="10.5" fill="none" stroke="var(--text3)" strokeWidth="2" /></svg>
);
export const Reading = ({ size = 20 }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" role="img" aria-label="In lettura"><circle cx="12" cy="12" r="10" fill="none" stroke="var(--blue)" strokeWidth="2" /><path d="M12 2a10 10 0 010 20z" fill="var(--blue)" opacity=".35" /></svg>
);
export const Skipped = ({ size = 24 }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" role="img" aria-label="Saltata"><circle cx="12" cy="12" r="10.5" fill="none" stroke="#AEAEB2" strokeWidth="2" strokeDasharray="3 3" /><path d="M7.5 12.5l3 3L16.5 9" fill="none" stroke="#AEAEB2" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
);
export const Star = ({ size = 18, filled = true }: P & { filled?: boolean }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 3.2l2.6 5.5 6 .8-4.4 4.1 1.1 6-5.3-2.9-5.3 2.9 1.1-6L3.4 9.5l6-.8z" fill={filled ? '#FFCC00' : 'none'} stroke={filled ? '#E0A800' : '#8E8E93'} strokeWidth="1.5" strokeLinejoin="round" />
  </svg>
);
export const Play = () => (
  <svg width="11" height="12" viewBox="0 0 11 12" aria-hidden="true"><path d="M1 1l9 5-9 5z" fill="currentColor" /></svg>
);
export const Search = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8E8E93" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" /><path d="M15.5 15.5L21 21" /></svg>
);
export const Gear = ({ size = 20 }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="12" cy="12" r="3.2" /><path d="M12 2.5v2.6M12 18.9v2.6M4.4 4.4l1.9 1.9M17.7 17.7l1.9 1.9M2.5 12h2.6M18.9 12h2.6M4.4 19.6l1.9-1.9M17.7 6.3l1.9-1.9" strokeLinecap="round" /></svg>
);
export const Laptop = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="4" y="5" width="16" height="11" rx="1.5" /><path d="M2 19h20" /></svg>
);
export const Doc = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 3h11l3 3v15H5z" /><path d="M9 9h6M9 13h6M9 17h4" /></svg>
);
export const Toolbox = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 8h18v11H3zM8 8V5h8v3M3 13h18" /></svg>
);

const W = { fill: 'none', stroke: '#fff', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
export const TaskGlyph = ({ type }: { type: string }) => {
  if (type === 'impara')
    return <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" {...W}><path d="M9 18h6M10 21h4M12 3a6 6 0 00-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0012 3z" /></svg>;
  if (type === 'prevedi')
    return <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" {...W}><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></svg>;
  if (type === 'scrivi')
    return <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" {...W} strokeWidth={2.2}><path d="M8 7l-5 5 5 5M16 7l5 5-5 5M13.5 4l-3 16" /></svg>;
  return <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" {...W}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.2" fill="#fff" /></svg>;
};
export const TASK_COLORS: Record<string, string> = { impara: '#007AFF', prevedi: '#AF52DE', scrivi: '#FF9500', kata: '#30B0C7', step: '#5856D6' };
export const TASK_LABEL: Record<string, string> = { impara: 'Impara', prevedi: 'Prevedi', scrivi: 'Scrivi', kata: 'Kata', step: 'Passo' };

export const TabIcons = {
  oggi: (on: boolean) => on
    ? <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5c.6 3.2 4.8 5.3 4.8 10a4.8 4.8 0 01-9.6 0c0-2 .9-3.3 2-4.4.2 1.4.9 2.4 1.9 2.8-.4-3.2.4-6.1.9-8.4z" fill="currentColor" /></svg>
    : <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"><path d="M12 2.5c.6 3.2 4.8 5.3 4.8 10a4.8 4.8 0 01-9.6 0c0-2 .9-3.3 2-4.4.2 1.4.9 2.4 1.9 2.8-.4-3.2.4-6.1.9-8.4z" /></svg>,
  percorso: (on: boolean) => on
    ? <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 5.5C5.5 4 9 4 11.3 5.6V20c-2.4-1.5-5.8-1.4-8.3 0z" fill="currentColor" /><path d="M21 5.5C18.5 4 15 4 12.7 5.6V20c2.4-1.5 5.8-1.4 8.3 0z" fill="currentColor" /></svg>
    : <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 5.5C5.5 4 9 4 12 6c3-2 6.5-2 9-.5V19c-2.5-1.5-6-1.5-9 .5-3-2-6.5-2-9-.5z" /><path d="M12 6v13.5" /></svg>,
  statistiche: (on: boolean) => (
    <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth={on ? 2.6 : 1.8} strokeLinecap="round"><path d="M5 20V12M10 20V6M15 20v-9M20 20V9" /></svg>
  )
};
