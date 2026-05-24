import { describe, it, expect } from 'vitest';
import { explainSubtraction } from '../../../src/lib/math/subtraction';

describe('explainSubtraction', () => {
  const p = { a: 7, b: 3, choices: [4, 5, 3] };

  it('returns 3 steps: objects, objects, equation', () => {
    const steps = explainSubtraction(p, '🍎');
    expect(steps.map((s) => s.kind)).toEqual(['objects', 'objects', 'equation']);
  });

  it('first objects step shows a items', () => {
    const steps = explainSubtraction(p, '🍎');
    expect(steps[0].data).toMatchObject({ emoji: '🍎', count: 7 });
  });

  it('second objects step shows remaining (a-b) items', () => {
    const steps = explainSubtraction(p, '🍎');
    expect(steps[1].data).toMatchObject({ emoji: '🍎', count: 4 });
  });

  it('equation text contains the difference', () => {
    const steps = explainSubtraction(p, '🍎');
    expect((steps[2].data as { text: string }).text).toContain('4');
  });
});
