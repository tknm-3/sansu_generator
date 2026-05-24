import { describe, it, expect } from 'vitest';
import { explainBigAddition } from '../../../src/lib/math/bigAddition';

describe('explainBigAddition', () => {
  // 28 + 15 = 43, ones: 8+5=13 (carry), tens: 2+1+1=4
  const p = { a: 28, b: 15, onesA: 8, onesB: 5, tensA: 2, tensB: 1, choices: [43, 41, 45] };

  it('returns 3 steps: placeValue, placeValue, equation', () => {
    const steps = explainBigAddition(p);
    expect(steps.map((s) => s.kind)).toEqual(['placeValue', 'placeValue', 'equation']);
  });

  it('ones step carries when ones sum >= 10', () => {
    const steps = explainBigAddition(p);
    expect(steps[0].data).toMatchObject({ ones: 13, carry: true });
  });

  it('tens step includes the carried ten', () => {
    const steps = explainBigAddition(p);
    expect(steps[1].data).toMatchObject({ tens: 4 });
  });

  it('equation text contains the sum', () => {
    const steps = explainBigAddition(p);
    expect((steps[2].data as { text: string }).text).toContain('43');
  });

  it('no carry when ones sum < 10', () => {
    const q = { a: 21, b: 13, onesA: 1, onesB: 3, tensA: 2, tensB: 1, choices: [34, 33, 35] };
    const steps = explainBigAddition(q);
    expect(steps[0].data).toMatchObject({ ones: 4, carry: false });
    expect(steps[1].data).toMatchObject({ tens: 3 });
  });
});
