import { describe, it, expect, beforeEach } from 'vitest';
import { loadJson, saveJson } from '../../src/lib/storage';

beforeEach(() => localStorage.clear());

describe('saveJson / loadJson', () => {
  it('round-trips an object', () => {
    saveJson('math-app:test', { a: 1, b: 'x' });
    expect(loadJson('math-app:test', { a: 0, b: '' })).toEqual({ a: 1, b: 'x' });
  });
  it('returns fallback when key is missing', () => {
    expect(loadJson('math-app:missing', { ok: true })).toEqual({ ok: true });
  });
  it('returns fallback when stored value is corrupt', () => {
    localStorage.setItem('math-app:bad', '{not json');
    expect(loadJson('math-app:bad', { ok: true })).toEqual({ ok: true });
  });
  it('does not throw when saving fails (returns false)', () => {
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    expect(saveJson('math-app:circular', circular)).toBe(false);
  });
});
