import { describe, it, expect } from 'vitest';
import { dateKey } from '../../src/lib/dateKey';

describe('dateKey', () => {
  it('ローカル日付を YYYY-MM-DD で返す', () => {
    const d = new Date(2026, 4, 24, 9, 30);
    expect(dateKey(d.getTime())).toBe('2026-05-24');
  });
  it('1桁の月日をゼロ埋めする', () => {
    const d = new Date(2026, 0, 3, 0, 0);
    expect(dateKey(d.getTime())).toBe('2026-01-03');
  });
});
