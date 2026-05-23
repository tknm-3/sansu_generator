import { describe, it, expect } from 'vitest';
import { generateProblem, checkAnswer, ALL_SKILL_IDS } from '../../../src/lib/challenge/problemGen';

describe('generateProblem', () => {
  it('generates a problem for each skill', () => {
    for (const skillId of ALL_SKILL_IDS) {
      const p = generateProblem(skillId);
      expect(p.skillId).toBe(skillId);
      expect(p.choices).toHaveLength(3);
      expect(p.choices).toContain(p.answer);
    }
  });
});

describe('checkAnswer', () => {
  it('returns true for correct choice', () => {
    const p = generateProblem('addition');
    expect(checkAnswer(p, p.answer)).toBe(true);
  });
  it('returns false for wrong choice', () => {
    const p = generateProblem('addition');
    const wrong = p.choices.find((c) => c !== p.answer)!;
    expect(checkAnswer(p, wrong)).toBe(false);
  });
});
