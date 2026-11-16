import { describe, expect, it } from 'vitest';
import { dayBefore, dayIn, nextFire, reminderText, validTime, validTz, zonedToUtc } from '../worker/schedule';

const ROME = 'Europe/Rome';

describe('calendario dei promemoria', () => {
  it('valida orario e fuso', () => {
    expect(validTime('07:05')).toBe('07:05');
    expect(validTime('24:00')).toBeNull();
    expect(validTime('7:05')).toBeNull();
    expect(validTz('America/New_York')).toBe('America/New_York');
    expect(validTz('Marte/Base')).toBe(ROME);
    expect(validTz(undefined)).toBe(ROME);
  });

  it('converte l’ora locale in UTC con ora solare e legale', () => {
    // 16 novembre: Roma è UTC+1
    expect(new Date(zonedToUtc(ROME, 2026, 11, 16, 18, 30)).toISOString()).toBe('2026-11-16T17:30:00.000Z');
    // 15 luglio: Roma è UTC+2
    expect(new Date(zonedToUtc(ROME, 2026, 7, 15, 18, 30)).toISOString()).toBe('2026-07-15T16:30:00.000Z');
  });

  it('il prossimo promemoria è oggi se l’ora non è passata, altrimenti domani', () => {
    const now = Date.parse('2026-11-16T15:00:00Z'); // 16:00 a Roma
    expect(new Date(nextFire(ROME, '18:30', now)).toISOString()).toBe('2026-11-16T17:30:00.000Z');
    expect(new Date(nextFire(ROME, '09:00', now)).toISOString()).toBe('2026-11-17T08:00:00.000Z');
  });

  it('attraversa il cambio dell’ora legale', () => {
    // 28 marzo 2026, 20:00 a Roma (UTC+1); il giorno dopo si passa a UTC+2
    const now = Date.parse('2026-03-28T19:00:00Z');
    expect(new Date(nextFire(ROME, '18:00', now)).toISOString()).toBe('2026-03-29T16:00:00.000Z');
  });

  it('giorni nel fuso dell’utente', () => {
    expect(dayIn(ROME, Date.parse('2026-11-16T23:30:00Z'))).toBe('2026-11-17');
    expect(dayIn('America/New_York', Date.parse('2026-11-16T23:30:00Z'))).toBe('2026-11-16');
    expect(dayBefore('2026-03-01')).toBe('2026-02-28');
  });

  it('niente notifica se oggi le task sono fatte; ricorda la streak se è in gioco', () => {
    expect(reminderText('2026-11-16', { doneDate: '2026-11-16' })).toBeNull();
    expect(reminderText('2026-11-16', { streak: 12, lastFullDay: '2026-11-15' })?.title).toBe('Streak di 12 giorni');
    expect(reminderText('2026-11-16', { streak: 12, lastFullDay: '2026-11-10' })?.title).toBe('Le tue 3 task di oggi');
    expect(reminderText('2026-11-16', {})?.title).toBe('Le tue 3 task di oggi');
  });
});
