import { describe, it, expect } from 'vitest';
import { runBranch, countNodes, type BranchCommand } from './branch';
import { BRANCH_LEVELS, type BranchDifficulty } from './branchLevels';
import type { Level } from './engine';

const BRANCH_DIFFS: BranchDifficulty[] = ['easy', 'normal', 'hard'];

const move = (dir: 'up' | 'down' | 'left' | 'right'): BranchCommand => ({ kind: 'move', dir });

describe('runBranch インタプリタ', () => {
  const base: Level = {
    id: 't', rows: 3, cols: 3, start: { r: 0, c: 0 }, goal: { r: 0, c: 2 }, walls: [], optimal: 2,
  };

  it('まっすぐ move で ゴールに とどく', () => {
    const res = runBranch(base, [move('right'), move('right')]);
    expect(res.reachedGoal).toBe(true);
    expect(res.steps).toBe(2);
  });

  it('かべ／そとに あたると とまる', () => {
    const res = runBranch(base, [move('left')]);
    expect(res.blockedStep).toBeGreaterThanOrEqual(0);
    expect(res.reachedGoal).toBe(false);
  });

  it('if は その場の かべを 見て えだを えらぶ', () => {
    // (0,0) で みぎは あいてる → else（みぎ）が はしる
    const prog: BranchCommand[] = [
      { kind: 'if', cond: { kind: 'wall', dir: 'right' }, then: [move('down')], else: [move('right')] },
    ];
    const res = runBranch(base, prog);
    expect(res.finalPos).toEqual({ r: 0, c: 1 });
  });

  it('repeat は body を くりかえす', () => {
    const prog: BranchCommand[] = [{ kind: 'repeat', times: 2, body: [move('right')] }];
    const res = runBranch(base, prog);
    expect(res.reachedGoal).toBe(true);
  });

  it('むげんに ならず とまる（ほけん）', () => {
    const prog: BranchCommand[] = [{ kind: 'repeat', times: 100000, body: [move('right'), move('left')] }];
    const res = runBranch(base, prog);
    expect(res.steps).toBeLessThanOrEqual(300);
  });

  it('countNodes は ネストも かぞえる', () => {
    const prog: BranchCommand[] = [
      { kind: 'repeat', times: 3, body: [
        { kind: 'if', cond: { kind: 'wall', dir: 'right' }, then: [move('down')], else: [move('right')] },
      ] },
    ];
    // repeat(1) + if(1) + then(1) + else(1) = 4
    expect(countNodes(prog)).toBe(4);
  });
});

describe('分岐レベルは おてほんで クリアできる', () => {
  for (const diff of BRANCH_DIFFS) {
    for (const level of BRANCH_LEVELS[diff]) {
      it(`${level.id} (${diff})`, () => {
        const res = runBranch(level, level.answer);
        expect(res.reachedGoal, `${level.id} は ゴール到達すべき`).toBe(true);
        expect(res.collectedAll, `${level.id} は ほしを ぜんぶ とるべき`).toBe(true);
      });
    }
  }
});
