import { describe, it, expect } from 'vitest';
import { generateDivision, checkDivision } from '../../../src/lib/math/division';

describe('generateDivision', () => {
  it('dividend = divisor * quotient (no remainder)', () => {
    for (let i = 0; i < 20; i++) {
      const p = generateDivision();
      expect(p.dividend).toBe(p.divisor * p.quotient);
    }
  });
  it('choices include the quotient', () => {
    const p = generateDivision();
    expect(p.choices).toContain(p.quotient);
  });
});

describe('generateDivision remainder', () => {
  it('remainder variant: dividend = divisor * quotient + remainder', () => {
    const p = generateDivision(Math.random, true);
    expect(p.dividend).toBe(p.divisor * p.quotient + (p.remainder ?? 0));
    expect((p.remainder ?? 0)).toBeGreaterThanOrEqual(0);
    expect((p.remainder ?? 0)).toBeLessThan(p.divisor);
  });
});

describe('checkDivision', () => {
  it('correct quotient', () => {
    const p = { dividend: 12, divisor: 3, quotient: 4, remainder: 0, choices: [4, 3, 5] };
    expect(checkDivision(p, 4)).toBe(true);
  });
  it('wrong', () => {
    const p = { dividend: 12, divisor: 3, quotient: 4, remainder: 0, choices: [4, 3, 5] };
    expect(checkDivision(p, 3)).toBe(false);
  });
});
