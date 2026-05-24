import { describe, it, expect } from 'vitest';
import { explainAddition } from '../../../src/lib/math/addition';

describe('explainAddition', () => {
  const p = { a: 3, b: 2, choices: [5, 4, 6] };

  it('returns 3 steps: objects, objects, equation', () => {
    const steps = explainAddition(p, '🐱');
    expect(steps.map((s) => s.kind)).toEqual(['objects', 'objects', 'equation']);
  });

  it('first objects step shows a items', () => {
    const steps = explainAddition(p, '🐱');
    expect(steps[0].data).toMatchObject({ emoji: '🐱', count: 3 });
  });

  it('second objects step shows b items', () => {
    const steps = explainAddition(p, '🐱');
    expect(steps[1].data).toMatchObject({ emoji: '🐱', count: 2 });
  });

  it('equation text contains the sum', () => {
    const steps = explainAddition(p, '🐱');
    expect((steps[2].data as { text: string }).text).toContain('5');
  });
});
