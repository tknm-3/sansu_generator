import { describe, it, expect } from 'vitest';
import { generateSubtraction, checkSubtraction, type SubtractionProblem } from '../../../src/lib/math/subtraction';

describe('generateSubtraction', () => {
  it('a >= b and a >= 1', () => {
    for (let i = 0; i < 20; i++) {
      const p = generateSubtraction();
      expect(p.a).toBeGreaterThanOrEqual(p.b);
      expect(p.a).toBeGreaterThanOrEqual(2);
    }
  });
  it('choices include the correct answer a - b', () => {
    const p = generateSubtraction();
    expect(p.choices).toContain(p.a - p.b);
  });
  it('choices are 3 unique numbers', () => {
    const p = generateSubtraction();
    expect(p.choices).toHaveLength(3);
    expect(new Set(p.choices).size).toBe(3);
  });
});

describe('checkSubtraction', () => {
  it('returns true for correct answer', () => {
    const p: SubtractionProblem = { a: 7, b: 3, choices: [4, 2, 6] };
    expect(checkSubtraction(p, 4)).toBe(true);
  });
  it('returns false for wrong answer', () => {
    const p: SubtractionProblem = { a: 7, b: 3, choices: [4, 2, 6] };
    expect(checkSubtraction(p, 2)).toBe(false);
  });
});
