import { useEffect, useState } from 'react';

/** Router a hash: funziona su GitHub Pages senza riscritture lato server. */
export function useRoute(): string[] {
  const read = () => (window.location.hash.replace(/^#\/?/, '') || 'oggi').split('?')[0].split('/').filter(Boolean);
  const [route, setRoute] = useState(read);
  useEffect(() => {
    const on = () => setRoute(read());
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}

export function queryParam(name: string): string | null {
  const q = window.location.hash.split('?')[1];
  return q ? new URLSearchParams(q).get(name) : null;
}

export const go = (path: string) => {
  window.location.hash = path.startsWith('#') ? path : `#/${path}`;
};
