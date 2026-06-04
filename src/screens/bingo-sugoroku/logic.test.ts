import { describe, it, expect } from 'vitest';
import {
  generateBonusSquares,
  isLandmark,
  makeCompareQuiz,
  makeNumberLineQuiz,
  makeBonusQuiz,
  isNumberLineCorrect,
  rollBonusSteps,
  NUMBERLINE_TOLERANCE,
} from './logic';

describe('generateBonusSquares（キリ番固定）', () => {
  it('10〜90 の 10の倍数を返す', () => {
    expect(generateBonusSquares()).toEqual([10, 20, 30, 40, 50, 60, 70, 80, 90]);
  });
});

describe('isLandmark', () => {
  it('1〜99 の 10の倍数だけ true（0・100 は除外）', () => {
    expect(isLandmark(10)).toBe(true);
    expect(isLandmark(50)).toBe(true);
    expect(isLandmark(0)).toBe(false);
    expect(isLandmark(100)).toBe(false);
    expect(isLandmark(23)).toBe(false);
  });
});

describe('makeCompareQuiz（大小比較）', () => {
  it('a≠b で answer は大きいほう・両方 1〜99', () => {
    for (let i = 0; i < 500; i++) {
      const q = makeCompareQuiz();
      if (q.kind !== 'compare') throw new Error('compare のはず');
      expect(q.a).not.toBe(q.b);
      expect(q.answer).toBe(Math.max(q.a, q.b));
      for (const n of [q.a, q.b]) {
        expect(n).toBeGreaterThanOrEqual(1);
        expect(n).toBeLessThanOrEqual(99);
      }
    }
  });
});

describe('makeNumberLineQuiz（数直線推定）', () => {
  it('target は 1〜99・tolerance は規定値', () => {
    for (let i = 0; i < 200; i++) {
      const q = makeNumberLineQuiz();
      if (q.kind !== 'numberline') throw new Error('numberline のはず');
      expect(q.target).toBeGreaterThanOrEqual(1);
      expect(q.target).toBeLessThanOrEqual(99);
      expect(q.tolerance).toBe(NUMBERLINE_TOLERANCE);
    }
  });
});

describe('makeBonusQuiz（B/D ランダム）', () => {
  it('rng<0.5 で compare、>=0.5 で numberline', () => {
    expect(makeBonusQuiz(() => 0.1).kind).toBe('compare');
    expect(makeBonusQuiz(() => 0.9).kind).toBe('numberline');
  });
});

describe('rollBonusSteps（ビンゴボーナスの進数）', () => {
  it('常に 5〜10 の整数を返す（何ビンゴでも1回分）', () => {
    for (let i = 0; i < 500; i++) {
      const s = rollBonusSteps();
      expect(Number.isInteger(s)).toBe(true);
      expect(s).toBeGreaterThanOrEqual(5);
      expect(s).toBeLessThanOrEqual(10);
    }
  });
  it('rng の下限/上限で 5 と 10 になる', () => {
    expect(rollBonusSteps(() => 0)).toBe(5);
    expect(rollBonusSteps(() => 0.999)).toBe(10);
  });
});

describe('isNumberLineCorrect', () => {
  it('許容差以内は正解、超えると不正解', () => {
    expect(isNumberLineCorrect(45, 45, 8)).toBe(true);
    expect(isNumberLineCorrect(45, 53, 8)).toBe(true);
    expect(isNumberLineCorrect(45, 37, 8)).toBe(true);
    expect(isNumberLineCorrect(45, 54, 8)).toBe(false);
    expect(isNumberLineCorrect(45, 30, 8)).toBe(false);
  });
});
