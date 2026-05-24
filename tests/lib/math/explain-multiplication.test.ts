import { describe, it, expect } from 'vitest';
import { explainMultiplication } from '../../../src/lib/math/multiplication';

describe('explainMultiplication', () => {
  const p = { a: 3, b: 4, groups: [4, 4, 4], choices: [12, 10, 14] };

  it('returns 3 steps: objects, groups, equation', () => {
    const steps = explainMultiplication(p, '🍩');
    expect(steps.map((s) => s.kind)).toEqual(['objects', 'groups', 'equation']);
  });

  it('objects step shows b items of the emoji', () => {
    const steps = explainMultiplication(p, '🍩');
    expect(steps[0].data).toMatchObject({ emoji: '🍩', count: 4 });
  });

  it('groups step has perGroup=b, groups=a', () => {
    const steps = explainMultiplication(p, '🍩');
    expect(steps[1].data).toMatchObject({ emoji: '🍩', perGroup: 4, groups: 3 });
  });

  it('equation step text contains the product', () => {
    const steps = explainMultiplication(p, '🍩');
    expect((steps[2].data as { text: string }).text).toContain('12');
  });

  it('every step has non-empty caption and narration', () => {
    for (const s of explainMultiplication(p, '🍩')) {
      expect(s.caption.length).toBeGreaterThan(0);
      expect(s.narration.length).toBeGreaterThan(0);
    }
  });
});
