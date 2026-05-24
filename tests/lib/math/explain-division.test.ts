import { describe, it, expect } from 'vitest';
import { explainDivision } from '../../../src/lib/math/division';

describe('explainDivision', () => {
  const p = { dividend: 12, divisor: 3, quotient: 4, remainder: 0, choices: [4, 3, 5] };

  it('returns 3 steps: objects, groups, equation', () => {
    const steps = explainDivision(p, '🍪');
    expect(steps.map((s) => s.kind)).toEqual(['objects', 'groups', 'equation']);
  });

  it('objects step shows dividend items', () => {
    const steps = explainDivision(p, '🍪');
    expect(steps[0].data).toMatchObject({ emoji: '🍪', count: 12 });
  });

  it('groups step: perGroup=quotient, groups=divisor', () => {
    const steps = explainDivision(p, '🍪');
    expect(steps[1].data).toMatchObject({ emoji: '🍪', perGroup: 4, groups: 3 });
  });

  it('equation step text contains the quotient', () => {
    const steps = explainDivision(p, '🍪');
    expect((steps[2].data as { text: string }).text).toContain('4');
  });

  it('every step has non-empty caption and narration', () => {
    for (const s of explainDivision(p, '🍪')) {
      expect(s.caption.length).toBeGreaterThan(0);
      expect(s.narration.length).toBeGreaterThan(0);
    }
  });
});
