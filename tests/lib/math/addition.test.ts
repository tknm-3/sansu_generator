import { describe, it, expect } from 'vitest';
import { generateAddition, checkAddition, type AdditionProblem } from '../../../src/lib/math/addition';

describe('generateAddition', () => {
  it('returns a problem with a + b <= 20', () => {
    for (let i = 0; i < 20; i++) {
      const p = generateAddition();
      expect(p.a + p.b).toBeLessThanOrEqual(20);
      expect(p.a).toBeGreaterThanOrEqual(1);
      expect(p.b).toBeGreaterThanOrEqual(1);
    }
  });
  it('choices include the correct answer', () => {
    const p = generateAddition();
    expect(p.choices).toContain(p.a + p.b);
  });
  it('choices are 3 unique numbers', () => {
    const p = generateAddition();
    expect(p.choices).toHaveLength(3);
    expect(new Set(p.choices).size).toBe(3);
  });
});

describe('checkAddition', () => {
  it('returns true for correct answer', () => {
    const p: AdditionProblem = { a: 3, b: 4, choices: [7, 5, 2] };
    expect(checkAddition(p, 7)).toBe(true);
  });
  it('returns false for wrong answer', () => {
    const p: AdditionProblem = { a: 3, b: 4, choices: [7, 5, 2] };
    expect(checkAddition(p, 5)).toBe(false);
  });
});
