import { describe, it, expect } from 'vitest';
import { GOALS, goalsForType } from '../../src/lib/problemGoals';

describe('problemGoals', () => {
  it('全演算ぶんのお題がある', () => {
    expect(goalsForType('addition').length).toBeGreaterThan(0);
    expect(goalsForType('subtraction').length).toBeGreaterThan(0);
    expect(goalsForType('multiplication').length).toBeGreaterThan(0);
    expect(goalsForType('division').length).toBeGreaterThan(0);
  });
  it('たし「こたえ10」: 6+4は満たし 6+3は満たさない', () => {
    const g = GOALS.find((x) => x.id === 'add-make10')!;
    expect(g.validate(6, 4, 10)).toBe(true);
    expect(g.validate(6, 3, 9)).toBe(false);
  });
  it('ひき「のこり1」: 5-4は満たし 5-2は満たさない', () => {
    const g = GOALS.find((x) => x.id === 'sub-left1')!;
    expect(g.validate(5, 4, 1)).toBe(true);
    expect(g.validate(5, 2, 3)).toBe(false);
  });
  it('わり「ちょうど」: 12/3は満たし 12/5は満たさない', () => {
    const g = GOALS.find((x) => x.id === 'div-exact')!;
    expect(g.validate(12, 3, 4)).toBe(true);
    expect(g.validate(12, 5, 2)).toBe(false);
  });
  it('かけ「こたえ12」: 3x4は満たし 3x3は満たさない', () => {
    const g = GOALS.find((x) => x.id === 'mul-make12')!;
    expect(g.validate(3, 4, 12)).toBe(true);
    expect(g.validate(3, 3, 9)).toBe(false);
  });
});
