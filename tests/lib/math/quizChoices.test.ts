import { describe, it, expect } from 'vitest';
import { quizChoices } from '../../../src/lib/math/explain';

describe('quizChoices', () => {
  it('正解を必ず含み、3つのユニークな選択肢を返す', () => {
    for (let answer = 0; answer <= 20; answer++) {
      const choices = quizChoices(answer, () => 0.5);
      expect(choices).toContain(answer);
      expect(new Set(choices).size).toBe(3);
    }
  });

  it('負の数を選択肢に含めない', () => {
    for (let answer = 0; answer <= 3; answer++) {
      const choices = quizChoices(answer, () => 0.1);
      expect(choices.every((c) => c >= 0)).toBe(true);
    }
  });

  it('rng が定数でも無限ループせず3つ返す（answer=0）', () => {
    const choices = quizChoices(0, () => 0);
    expect(new Set(choices).size).toBe(3);
    expect(choices).toContain(0);
  });
});
