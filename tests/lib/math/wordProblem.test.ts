import { describe, it, expect } from 'vitest';
import {
  generateWordProblem,
  checkVerdict,
  checkDiff,
  type WordProblem,
  type WordVerdict,
} from '../../../src/lib/math/wordProblem';

// deterministic rng: returns values from a fixed sequence
function seqRng(values: number[]): () => number {
  let i = 0;
  return () => values[i++ % values.length];
}

describe('generateWordProblem – word-addition', () => {
  it('produces numbers within 1–10', () => {
    for (let i = 0; i < 30; i++) {
      const p = generateWordProblem('word-addition');
      expect(p.a).toBeGreaterThanOrEqual(1);
      expect(p.a).toBeLessThanOrEqual(5);
      expect(p.b).toBeGreaterThanOrEqual(1);
      expect(p.b).toBeLessThanOrEqual(5);
      expect(p.c).toBeGreaterThanOrEqual(1);
      expect(p.c).toBeLessThanOrEqual(10);
    }
  });

  it('verdict ぴったり: c equals a+b, diff is 0', () => {
    // rng sequence: verdict index 0 = ぴったり; a=2,b=3 → total=5; c=5
    const p = generateWordProblem('word-addition', seqRng([0 / 3, 0.4, 0.6, 0, 0, 0]));
    expect(p.verdict).toBe('ぴったり');
    expect(p.diff).toBe(0);
    expect(p.c).toBe(p.a + p.b);
    expect(p.diffChoices).toHaveLength(0);
    expect(p.step2Question).toBe('');
  });

  it('verdict あまる: c > a+b, diff is c-(a+b)', () => {
    for (let i = 0; i < 20; i++) {
      const p = generateWordProblem('word-addition');
      if (p.verdict === 'あまる') {
        expect(p.c).toBeGreaterThan(p.a + p.b);
        expect(p.diff).toBe(p.c - (p.a + p.b));
        expect(p.diffChoices).toContain(p.diff);
        expect(p.diffChoices).toHaveLength(3);
        expect(new Set(p.diffChoices).size).toBe(3);
        break;
      }
    }
  });

  it('verdict たりない: c < a+b, diff is (a+b)-c', () => {
    for (let i = 0; i < 20; i++) {
      const p = generateWordProblem('word-addition');
      if (p.verdict === 'たりない') {
        expect(p.c).toBeLessThan(p.a + p.b);
        expect(p.diff).toBe(p.a + p.b - p.c);
        expect(p.diffChoices).toContain(p.diff);
        expect(p.diffChoices).toHaveLength(3);
        break;
      }
    }
  });

  it('text and emoji are non-empty', () => {
    const p = generateWordProblem('word-addition');
    expect(p.text.length).toBeGreaterThan(0);
    expect(p.emoji.length).toBeGreaterThan(0);
  });
});

describe('generateWordProblem – word-subtraction', () => {
  it('produces numbers within 1–10', () => {
    for (let i = 0; i < 30; i++) {
      const p = generateWordProblem('word-subtraction');
      expect(p.a).toBeGreaterThanOrEqual(1);
      expect(p.a).toBeLessThanOrEqual(10);
      expect(p.b).toBeGreaterThanOrEqual(1);
      expect(p.b).toBeLessThanOrEqual(10);
      expect(p.c).toBe(0);
    }
  });

  it('verdict ぴったり: a equals b', () => {
    for (let i = 0; i < 20; i++) {
      const p = generateWordProblem('word-subtraction');
      if (p.verdict === 'ぴったり') {
        expect(p.a).toBe(p.b);
        expect(p.diff).toBe(0);
        break;
      }
    }
  });

  it('verdict あまる: a > b, diff is a-b', () => {
    for (let i = 0; i < 20; i++) {
      const p = generateWordProblem('word-subtraction');
      if (p.verdict === 'あまる') {
        expect(p.a).toBeGreaterThan(p.b);
        expect(p.diff).toBe(p.a - p.b);
        expect(p.diffChoices).toContain(p.diff);
        expect(p.diffChoices).toHaveLength(3);
        break;
      }
    }
  });

  it('verdict たりない: b > a, diff is b-a', () => {
    for (let i = 0; i < 20; i++) {
      const p = generateWordProblem('word-subtraction');
      if (p.verdict === 'たりない') {
        expect(p.b).toBeGreaterThan(p.a);
        expect(p.diff).toBe(p.b - p.a);
        expect(p.diffChoices).toContain(p.diff);
        break;
      }
    }
  });
});

describe('checkVerdict', () => {
  const base: WordProblem = {
    variant: 'word-subtraction',
    a: 5, b: 3, c: 0,
    verdict: 'あまる',
    diff: 2,
    text: 'test', emoji: '🍎',
    verdictLabels: { ぴったり: 'ちょうど くばれる', あまる: 'りんごが あまる', たりない: 'りんごが たりない' },
    step2Question: 'なんこ あまる？',
    diffChoices: [1, 2, 3],
  };

  it('returns true for correct verdict', () => {
    expect(checkVerdict(base, 'あまる')).toBe(true);
  });

  it('returns false for wrong verdict', () => {
    expect(checkVerdict(base, 'たりない')).toBe(false);
    expect(checkVerdict(base, 'ぴったり')).toBe(false);
  });
});

describe('checkDiff', () => {
  const base: WordProblem = {
    variant: 'word-subtraction',
    a: 5, b: 3, c: 0,
    verdict: 'あまる',
    diff: 2,
    text: 'test', emoji: '🍎',
    verdictLabels: { ぴったり: 'ちょうど くばれる', あまる: 'りんごが あまる', たりない: 'りんごが たりない' },
    step2Question: 'なんこ あまる？',
    diffChoices: [1, 2, 3],
  };

  it('returns true when chosen equals diff', () => {
    expect(checkDiff(base, 2)).toBe(true);
  });

  it('returns false when chosen does not equal diff', () => {
    expect(checkDiff(base, 1)).toBe(false);
    expect(checkDiff(base, 3)).toBe(false);
  });
});

describe('all three verdicts appear across 100 trials', () => {
  for (const variant of ['word-addition', 'word-subtraction'] as const) {
    it(`${variant}: generates all three verdicts`, () => {
      const seen = new Set<WordVerdict>();
      for (let i = 0; i < 100; i++) {
        seen.add(generateWordProblem(variant).verdict);
      }
      expect(seen.has('ぴったり')).toBe(true);
      expect(seen.has('あまる')).toBe(true);
      expect(seen.has('たりない')).toBe(true);
    });
  }
});
