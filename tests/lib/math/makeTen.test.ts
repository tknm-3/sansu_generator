import { describe, it, expect } from 'vitest';
import { missingToTen, isCorrectMissing, makeAnswerChoices } from '../../../src/lib/math/makeTen';

describe('missingToTen', () => {
  it('returns how many are needed to reach 10', () => {
    expect(missingToTen(3)).toBe(7);
    expect(missingToTen(0)).toBe(10);
    expect(missingToTen(10)).toBe(0);
  });
  it('clamps inputs above 10 to 0', () => {
    expect(missingToTen(12)).toBe(0);
  });
});

describe('isCorrectMissing', () => {
  it('true when chosen value completes 10', () => {
    expect(isCorrectMissing(3, 7)).toBe(true);
    expect(isCorrectMissing(3, 6)).toBe(false);
  });
});

describe('makeAnswerChoices', () => {
  it('always includes the correct answer', () => {
    const choices = makeAnswerChoices(3, () => 0.5);
    expect(choices).toContain(7);
  });
  it('returns 3 unique choices within 0..10', () => {
    const choices = makeAnswerChoices(3, () => 0.5);
    expect(choices).toHaveLength(3);
    expect(new Set(choices).size).toBe(3);
    choices.forEach((c) => {
      expect(c).toBeGreaterThanOrEqual(0);
      expect(c).toBeLessThanOrEqual(10);
    });
  });
});
