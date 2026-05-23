import { describe, it, expect } from 'vitest';
import { generateBigAddition, checkBigAddition } from '../../../src/lib/math/bigAddition';

describe('generateBigAddition', () => {
  it('a and b are 2-digit numbers (10..99)', () => {
    for (let i = 0; i < 20; i++) {
      const p = generateBigAddition();
      expect(p.a).toBeGreaterThanOrEqual(10);
      expect(p.a).toBeLessThanOrEqual(99);
      expect(p.b).toBeGreaterThanOrEqual(10);
    }
  });
  it('choices include the correct answer', () => {
    const p = generateBigAddition();
    expect(p.choices).toContain(p.a + p.b);
  });
  it('provides decomposition for cherry-calc visualization', () => {
    const p = generateBigAddition();
    const { onesA, onesB, tensA, tensB } = p;
    expect(onesA + tensA * 10).toBe(p.a);
    expect(onesB + tensB * 10).toBe(p.b);
  });
});

describe('checkBigAddition', () => {
  it('returns true for correct answer', () => {
    const p = { a: 28, b: 15, choices: [43, 42, 44], onesA: 8, onesB: 5, tensA: 2, tensB: 1 };
    expect(checkBigAddition(p, 43)).toBe(true);
  });
});
