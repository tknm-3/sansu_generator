import { describe, it, expect } from 'vitest';
import { explainCherry } from '../../../src/lib/math/cherryCalc';

describe('explainCherry', () => {
  // 8 + 5 = 13: split = 10-8 = 2, carry = 5-2 = 3
  const p = { a: 8, b: 5, choices: [13, 12, 14] };

  it('returns 2 steps: cherryBranch, equation', () => {
    const steps = explainCherry(p);
    expect(steps.map((s) => s.kind)).toEqual(['cherryBranch', 'equation']);
  });

  it('cherryBranch step splits b into split and carry', () => {
    const steps = explainCherry(p);
    expect(steps[0].data).toMatchObject({ b: 5, split: 2, carry: 3 });
  });

  it('equation step asks the answer as a quiz (考え方の小問題)', () => {
    const steps = explainCherry(p);
    // 答えはステップ上で先に見せず、quiz で解かせる
    expect(steps[1].quiz?.answer).toBe(13);
    expect(steps[1].quiz?.choices).toContain(13);
  });
});
