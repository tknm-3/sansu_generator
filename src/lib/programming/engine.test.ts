import { describe, it, expect } from 'vitest';
import {
  flatten,
  runProgram,
  isCleared,
  isPerfect,
  solve,
  buildHint,
  type Command,
  type Level,
} from './engine';

const baseLevel: Level = {
  id: 't', rows: 3, cols: 3, start: { r: 0, c: 0 }, goal: { r: 0, c: 2 },
  walls: [], optimal: 2,
};

const move = (dir: 'up' | 'down' | 'left' | 'right'): Command => ({ kind: 'move', dir });

describe('flatten', () => {
  it('ループ箱を 矢印の列に 展開する', () => {
    const cmds: Command[] = [move('right'), { kind: 'repeat', times: 3, body: ['down'] }];
    expect(flatten(cmds)).toEqual(['right', 'down', 'down', 'down']);
  });
});

describe('runProgram', () => {
  it('まっすぐ ゴールに つく', () => {
    const result = runProgram(baseLevel, [move('right'), move('right')]);
    expect(isCleared(result)).toBe(true);
    expect(isPerfect(baseLevel, result)).toBe(true);
  });

  it('わくの そとに でると とまる', () => {
    const result = runProgram(baseLevel, [move('up')]);
    expect(result.blockedStep).toBe(0);
    expect(result.blockedCell).toBeNull();
    expect(isCleared(result)).toBe(false);
  });

  it('かべに ぶつかると その セルを かえす', () => {
    const walled: Level = { ...baseLevel, walls: [{ r: 0, c: 1 }] };
    const result = runProgram(walled, [move('right')]);
    expect(result.blockedStep).toBe(0);
    expect(result.blockedCell).toEqual({ r: 0, c: 1 });
  });

  it('ほしを とおらないと クリアにならない', () => {
    const gemLevel: Level = { ...baseLevel, gems: [{ r: 2, c: 2 }], optimal: 6 };
    const result = runProgram(gemLevel, [move('right'), move('right')]);
    expect(result.reachedGoal).toBe(true);
    expect(result.missedGems).toBe(1);
    expect(isCleared(result)).toBe(false);
  });
});

describe('solve', () => {
  it('ほしを とおる 最短ルートを みつける', () => {
    const gemLevel: Level = {
      ...baseLevel, goal: { r: 2, c: 2 }, gems: [{ r: 2, c: 0 }], optimal: 4,
    };
    const path = solve(gemLevel);
    expect(path).not.toBeNull();
    const result = runProgram(gemLevel, path!.map(move));
    expect(isCleared(result)).toBe(true);
  });

  it('いけない めいろは null', () => {
    const blocked: Level = {
      ...baseLevel, walls: [{ r: 0, c: 1 }, { r: 1, c: 0 }, { r: 1, c: 1 }],
      goal: { r: 2, c: 2 },
    };
    expect(solve(blocked)).toBeNull();
  });
});

describe('buildHint', () => {
  it('まちがいを せめる ことばを つかわない', () => {
    const result = runProgram(baseLevel, [move('up')]);
    const hint = buildHint(baseLevel, result, 1);
    expect(hint).not.toMatch(/まちがい|だめ|バツ|ちがう/);
    expect(hint.length).toBeGreaterThan(0);
  });
});
