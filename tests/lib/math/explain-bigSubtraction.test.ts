import { describe, it, expect } from 'vitest';
import { explainBigSubtraction } from '../../../src/lib/math/bigSubtraction';

describe('explainBigSubtraction', () => {
  // 43 - 28 = 15, ones: 3<8 borrow -> 13-8=5, tens: (4-1)-2=1
  const p = { a: 43, b: 28, onesA: 3, onesB: 8, tensA: 4, tensB: 2, choices: [15, 14, 16] };

  it('returns 3 steps: placeValue, placeValue, equation', () => {
    const steps = explainBigSubtraction(p);
    expect(steps.map((s) => s.kind)).toEqual(['placeValue', 'placeValue', 'equation']);
  });

  it('ones step borrows when onesA < onesB', () => {
    const steps = explainBigSubtraction(p);
    expect(steps[0].data).toMatchObject({ ones: 5, carry: true });
  });

  it('tens step accounts for the borrow', () => {
    const steps = explainBigSubtraction(p);
    expect(steps[1].data).toMatchObject({ tens: 1 });
  });

  it('equation text contains the difference', () => {
    const steps = explainBigSubtraction(p);
    expect((steps[2].data as { text: string }).text).toContain('15');
  });

  it('no borrow when onesA >= onesB', () => {
    const q = { a: 48, b: 23, onesA: 8, onesB: 3, tensA: 4, tensB: 2, choices: [25, 24, 26] };
    const steps = explainBigSubtraction(q);
    expect(steps[0].data).toMatchObject({ ones: 5, carry: false });
    expect(steps[1].data).toMatchObject({ tens: 2 });
  });
});
