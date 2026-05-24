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

  it('equation text contains the answer', () => {
    const steps = explainCherry(p);
    expect((steps[1].data as { text: string }).text).toContain('13');
  });
});
