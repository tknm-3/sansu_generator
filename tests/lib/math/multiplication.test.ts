import { describe, it, expect } from 'vitest';
import { generateMultiplication, checkMultiplication } from '../../../src/lib/math/multiplication';

describe('generateMultiplication', () => {
  it('a and b are 2..9', () => {
    for (let i = 0; i < 20; i++) {
      const p = generateMultiplication();
      expect(p.a).toBeGreaterThanOrEqual(2);
      expect(p.a).toBeLessThanOrEqual(9);
      expect(p.b).toBeGreaterThanOrEqual(2);
      expect(p.b).toBeLessThanOrEqual(9);
    }
  });
  it('choices include a * b', () => {
    const p = generateMultiplication();
    expect(p.choices).toContain(p.a * p.b);
  });
  it('groups array has length a (b items each)', () => {
    const p = generateMultiplication();
    expect(p.groups).toHaveLength(p.a);
    p.groups.forEach((g) => expect(g).toBe(p.b));
  });
});

describe('checkMultiplication', () => {
  it('correct', () => {
    const p = { a: 3, b: 4, groups: [4, 4, 4], choices: [12, 10, 14] };
    expect(checkMultiplication(p, 12)).toBe(true);
  });
  it('wrong', () => {
    const p = { a: 3, b: 4, groups: [4, 4, 4], choices: [12, 10, 14] };
    expect(checkMultiplication(p, 10)).toBe(false);
  });
});
