import { describe, it, expect } from 'vitest';
import { explainMakeTen } from '../../../src/lib/math/makeTen';

describe('explainMakeTen', () => {
  it('returns 3 steps: objects, objects, equation', () => {
    const steps = explainMakeTen(6, '🍎');
    expect(steps.map((s) => s.kind)).toEqual(['objects', 'objects', 'equation']);
  });

  it('first step shows current count', () => {
    const steps = explainMakeTen(6, '🍎');
    expect(steps[0].data).toMatchObject({ emoji: '🍎', count: 6 });
  });

  it('second step shows the missing count to reach ten', () => {
    const steps = explainMakeTen(6, '🍎');
    expect(steps[1].data).toMatchObject({ emoji: '🍎', count: 4 });
  });

  it('equation text contains 10', () => {
    const steps = explainMakeTen(6, '🍎');
    expect((steps[2].data as { text: string }).text).toContain('10');
  });
});
