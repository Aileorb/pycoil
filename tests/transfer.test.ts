import { describe, expect, it } from 'vitest';
import { decodeState, encodeState } from '../src/engine/transfer';
import { emptyState } from '../src/engine/state';

describe('trasferimento dei progressi', () => {
  it('codice e link danno gli stessi progressi', async () => {
    const s = { ...emptyState(), level: 'base' as const, xp: 420, sections: ['01-01-01'], streak: { current: 5, best: 7, lastFullDay: '2026-11-16', lost: false } };
    const code = await encodeState(s);
    expect(code[0]).toBe('z');
    expect((await decodeState(code))?.xp).toBe(420);
    const link = `https://pycoil.esempio.workers.dev/#importa=${code}`;
    const back = await decodeState(link);
    expect(back?.streak.current).toBe(5);
    expect(back?.sections).toEqual(['01-01-01']);
  });

  it('rifiuta codici rovinati', async () => {
    expect(await decodeState('ciao')).toBeNull();
    expect(await decodeState('zAAAAAAAAAAAAAA')).toBeNull();
  });
});
