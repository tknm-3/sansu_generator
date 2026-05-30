import { describe, it, expect } from 'vitest';
import {
  ADVENTURE_QUEST,
  ADVENTURE_ZONES,
  buildBranchProgram,
  type AdventureQuest,
} from './adventureLevels';
import {
  solve,
  runProgram,
  isCleared,
  isPerfect,
  samePos,
  type Command,
  type Dir,
  type Pos,
} from './engine';
import { runBranch } from './branch';
import { runRelative, solveRelative } from './relativeEngine';

function toCommands(dirs: Dir[]): Command[] {
  return dirs.map((dir) => ({ kind: 'move' as const, dir }));
}

const all = ADVENTURE_QUEST;

describe('ぼうけん 問題集', () => {
  it('30問 ある', () => {
    expect(all.length).toBeGreaterThanOrEqual(30);
  });

  it('questId は ぜんぶ ユニーク', () => {
    const ids = all.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('chase ゾンビは つかわない（solve で 検証できる）', () => {
    for (const q of all) {
      const hasChase = (q.zombies ?? []).some((z) => z.kind === 'chase');
      expect(hasChase, `${q.id} に chase ゾンビが ある`).toBe(false);
    }
  });

  it('すべての zoneId が ADVENTURE_ZONES に ある', () => {
    const zoneIds = new Set(ADVENTURE_ZONES.map((z) => z.id));
    for (const q of all) {
      expect(zoneIds.has(q.zoneId), `${q.id} の zoneId=${q.zoneId} が ない`).toBe(true);
    }
  });

  it('問題は ゾーンごとに まとまって ならんでいる', () => {
    // 同じ zoneId が とびとびに ならんでいない（出題じゅんが ゾーンで くぎれている）
    const seen = new Set<string>();
    let prev = '';
    for (const q of all) {
      if (q.zoneId !== prev) {
        expect(seen.has(q.zoneId), `${q.zoneId} が とびとびに ある`).toBe(false);
        seen.add(q.zoneId);
        prev = q.zoneId;
      }
    }
  });

  function inBounds(q: AdventureQuest, p: Pos): boolean {
    return p.r >= 0 && p.r < q.rows && p.c >= 0 && p.c < q.cols;
  }

  it.each(all)('$id は ばんめんが せいごう（start/goal/かべ/ゾンビ）', (q) => {
    expect(inBounds(q, q.start), `${q.id} start が そと`).toBe(true);
    expect(inBounds(q, q.goal), `${q.id} goal が そと`).toBe(true);
    expect(samePos(q.start, q.goal), `${q.id} start と goal が おなじ`).toBe(false);
    for (const w of q.walls) {
      expect(inBounds(q, w)).toBe(true);
      expect(samePos(w, q.start), `${q.id} かべが start に かさなる`).toBe(false);
      expect(samePos(w, q.goal), `${q.id} かべが goal に かさなる`).toBe(false);
    }
    for (const g of q.gems ?? []) {
      expect(inBounds(q, g)).toBe(true);
      expect(q.walls.some((w) => samePos(w, g)), `${q.id} ほしが かべに かさなる`).toBe(false);
    }
    for (const z of q.zombies ?? []) {
      expect(inBounds(q, z.pos)).toBe(true);
      expect(samePos(z.pos, q.start), `${q.id} ゾンビが start に かさなる`).toBe(false);
    }
  });

  it.each(all)('$id は maxSlots >= optimal（やじるしが たりる）', (q) => {
    expect(q.maxSlots, `${q.id} に maxSlots が ない`).toBeDefined();
    expect(q.maxSlots!, `${q.id} は maxSlots が optimal より すくない`).toBeGreaterThanOrEqual(
      q.optimal,
    );
  });

  const arrowQuests = all.filter((q) => q.kind === undefined);
  const branchQuests = all.filter((q) => q.kind === 'branch');
  const relativeQuests = all.filter((q) => q.kind === 'relative');

  it.each(arrowQuests)('$id は 解けて optimal が 最短と 一致する', (q) => {
    const sol = q.solution ?? solve(q);
    expect(sol, `${q.id} に 解が ない`).not.toBeNull();
    if (!q.solution) {
      expect(sol!.length, `${q.id} の optimal が 最短と ずれている`).toBe(q.optimal);
    }
    expect(sol!.length, `${q.id} の 解が maxSlots を こえる`).toBeLessThanOrEqual(q.maxSlots!);
    const result = runProgram(q, toCommands(sol!));
    expect(isCleared(result), `${q.id} の 解が ゴールに つかない`).toBe(true);
  });

  it.each(branchQuests)('$id（分岐）は 正解プログラムで クリアできて optimal が ステップ数と 一致する', (q) => {
    const fill = q.branchFill!;
    expect(fill, `${q.id} に branchFill が ない`).toBeDefined();
    const program = buildBranchProgram(fill);
    const result = runBranch(q, program);
    expect(isCleared(result), `${q.id} の 正解プログラムが クリアに ならない`).toBe(true);
    expect(isPerfect(q, result), `${q.id} の ステップ数が optimal(${q.optimal})と ずれている（実際: ${result.steps}）`).toBe(true);
  });

  // 穴埋めは「あてずっぽうでも解ける」と 学びが うすい。穴の むきの 全組み合わせを ためし、
  // クリアできるのは 正解の 1とおり だけ（＝一意解）であることを 保証する。
  // フェーズが 2つ（つきゾーン）でも、すべての 穴の くみあわせを 総当りする。
  const DIRS: Dir[] = ['up', 'right', 'down', 'left'];
  it.each(branchQuests)('$id（分岐）は 穴の くみあわせで 正解 1とおり だけ クリアできる（一意解）', (q) => {
    const fill = q.branchFill!;
    // 穴スロット（フェーズ番号・どの項目か）を あつめる
    type Slot = { phase: number; field: 'sensor' | 'thenDir' | 'elseDir' };
    const slots: Slot[] = [];
    fill.phases.forEach((ph, i) => {
      if (ph.rule.holeSensor) slots.push({ phase: i, field: 'sensor' });
      if (ph.rule.holeThen) slots.push({ phase: i, field: 'thenDir' });
      if (ph.rule.holeElse) slots.push({ phase: i, field: 'elseDir' });
    });
    // 正解の しるし
    const correct = fill.phases.map((ph) => `${ph.rule.sensor}/${ph.rule.thenDir}/${ph.rule.elseDir}`).join(' | ');

    const solutions: string[] = [];
    const total = Math.pow(4, slots.length);
    for (let combo = 0; combo < total; combo++) {
      // この くみあわせの 穴の値を きめる
      const assign = new Map<string, Dir>();
      let rest = combo;
      for (const s of slots) {
        assign.set(`${s.phase}:${s.field}`, DIRS[rest % 4]);
        rest = Math.floor(rest / 4);
      }
      const program = buildBranchProgram(fill, (phaseIdx, rule) => ({
        sensor: assign.get(`${phaseIdx}:sensor`) ?? rule.sensor,
        thenDir: assign.get(`${phaseIdx}:thenDir`) ?? rule.thenDir,
        elseDir: assign.get(`${phaseIdx}:elseDir`) ?? rule.elseDir,
      }));
      if (isCleared(runBranch(q, program))) {
        const sig = fill.phases.map((ph, i) => {
          const s = assign.get(`${i}:sensor`) ?? ph.rule.sensor;
          const t = assign.get(`${i}:thenDir`) ?? ph.rule.thenDir;
          const e = assign.get(`${i}:elseDir`) ?? ph.rule.elseDir;
          return `${s}/${t}/${e}`;
        }).join(' | ');
        if (!solutions.includes(sig)) solutions.push(sig);
      }
    }
    expect(solutions, `${q.id} は 正解いがいでも クリアできる: ${solutions.join(', ')}`).toEqual([correct]);
  });

  // ゆきのゾーン（そうたい方向）。relSolution で クリアでき、optimal が 最短（BFS）と 一致する。
  it.each(relativeQuests)('$id（そうたい方向）は relSolution で クリアでき optimal が 最短と 一致する', (q) => {
    expect(q.startFacing, `${q.id} に startFacing が ない`).toBeDefined();
    expect(q.relSolution, `${q.id} に relSolution が ない`).toBeDefined();
    const result = runRelative(q, q.relSolution!);
    expect(isCleared(result), `${q.id} の relSolution が ゴールに つかない`).toBe(true);
    expect(q.relSolution!.length, `${q.id} の relSolution が maxSlots を こえる`).toBeLessThanOrEqual(q.maxSlots!);
    const best = solveRelative(q);
    expect(best, `${q.id} に そうたい解が ない`).not.toBeNull();
    expect(best!.length, `${q.id} の optimal が 最短と ずれている（最短: ${best!.length}）`).toBe(q.optimal);
    expect(result.steps, `${q.id} の relSolution が 最短手数で ない`).toBe(q.optimal);
  });

  // loopOnly の たには、ふつうの 1マス矢印を ださず ループ箱だけ つかわせる。
  // LoopBuilder の せいやく（1ループ＝1方向 × 2〜5かい）の はんいで 解けることを 確認する。
  const loopOnly = all.filter((q) => q.loopOnly);

  it('loopOnly は ループの たに（valley）に そろっている', () => {
    expect(loopOnly.length).toBeGreaterThan(0);
    for (const q of loopOnly) {
      expect(q.allowLoop, `${q.id} は loopOnly なのに allowLoop でない`).toBe(true);
    }
  });

  it.each(loopOnly)('$id は ループ箱だけ（1方向×2〜5）で 解ける', (q) => {
    const sol = q.solution ?? solve(q)!;
    // 最短解を「おなじ むきの れんぞく」で くぎる＝ループ箱の かたまり
    const runs: { dir: Dir; len: number }[] = [];
    for (const d of sol) {
      const last = runs[runs.length - 1];
      if (last && last.dir === d) last.len += 1;
      else runs.push({ dir: d, len: 1 });
    }
    // どの かたまりも 2〜5かい に おさまれば ループ箱で 表現できる
    for (const run of runs) {
      expect(run.len, `${q.id} の ${run.dir} が ${run.len}かい連続（ループ箱2〜5に おさまらない）`).toBeGreaterThanOrEqual(2);
      expect(run.len, `${q.id} の ${run.dir} が ${run.len}かい連続（ループ箱2〜5に おさまらない）`).toBeLessThanOrEqual(5);
    }
    // ループ箱の かず（かたまり数）が maxSlots に おさまる
    const flatLen = runs.reduce((n, r) => n + r.len, 0);
    expect(flatLen, `${q.id} の 解が maxSlots を こえる`).toBeLessThanOrEqual(q.maxSlots!);
  });
});
