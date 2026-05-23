import { describe, it, expect } from 'vitest';
import { generateBigSubtraction, checkBigSubtraction } from '../../../src/lib/math/bigSubtraction';

describe('generateBigSubtraction', () => {
  it('a > b and both 2-digit', () => {
    for (let i = 0; i < 20; i++) {
      const p = generateBigSubtraction();
      expect(p.a).toBeGreaterThan(p.b);
      expect(p.a - p.b).toBeGreaterThanOrEqual(1);
    }
  });
  it('choices include the correct answer', () => {
    const p = generateBigSubtraction();
    expect(p.choices).toContain(p.a - p.b);
  });
});

describe('checkBigSubtraction', () => {
  it('returns true for correct answer', () => {
    const p = { a: 43, b: 28, choices: [15, 14, 16], onesA: 3, onesB: 8, tensA: 4, tensB: 2 };
    expect(checkBigSubtraction(p, 15)).toBe(true);
  });
});
