import { describe, it, expect } from 'vitest';
import { decompose, generateCarryProblem, checkCarry, type CarryProblem } from '../../../src/lib/math/cherryCalc';

describe('decompose', () => {
  it('8+5: splits 5 into 2+3 to make 10', () => {
    const d = decompose(8, 5);
    expect(d.split).toBe(2);
    expect(d.carry).toBe(3);
    expect(d.ten).toBe(10);
    expect(d.answer).toBe(13);
  });
  it('9+4: splits 4 into 1+3', () => {
    const d = decompose(9, 4);
    expect(d.split).toBe(1);
    expect(d.carry).toBe(3);
    expect(d.answer).toBe(13);
  });
  it('7+6: splits 6 into 3+3', () => {
    const d = decompose(7, 6);
    expect(d.split).toBe(3);
    expect(d.carry).toBe(3);
    expect(d.answer).toBe(13);
  });
});

describe('generateCarryProblem', () => {
  it('always results in an answer between 11 and 18', () => {
    for (let i = 0; i < 20; i++) {
      const p = generateCarryProblem();
      expect(p.a + p.b).toBeGreaterThanOrEqual(11);
      expect(p.a + p.b).toBeLessThanOrEqual(18);
    }
  });
  it('choices include the correct answer', () => {
    const p = generateCarryProblem();
    expect(p.choices).toContain(p.a + p.b);
  });
});

describe('checkCarry', () => {
  it('returns true for correct answer', () => {
    const p: CarryProblem = { a: 8, b: 5, choices: [13, 12, 14] };
    expect(checkCarry(p, 13)).toBe(true);
  });
  it('returns false for wrong answer', () => {
    const p: CarryProblem = { a: 8, b: 5, choices: [13, 12, 14] };
    expect(checkCarry(p, 12)).toBe(false);
  });
});
