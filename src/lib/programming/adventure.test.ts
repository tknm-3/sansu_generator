import { describe, it, expect } from 'vitest';
import { ADVENTURE_QUEST, ADVENTURE_ZONES, type AdventureQuest } from './adventureLevels';
import {
  solve,
  runProgram,
  isCleared,
  samePos,
  type Command,
  type Dir,
  type Pos,
} from './engine';

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

  it.each(all)('$id は 解けて optimal が 最短と 一致する', (q) => {
    const sol = q.solution ?? solve(q);
    expect(sol, `${q.id} に 解が ない`).not.toBeNull();
    // ぴったり賞が とれるよう、optimal は 最短手数と そろっている
    if (!q.solution) {
      expect(sol!.length, `${q.id} の optimal が 最短と ずれている`).toBe(q.optimal);
    }
    // 解の てかずは maxSlots に おさまる
    expect(sol!.length, `${q.id} の 解が maxSlots を こえる`).toBeLessThanOrEqual(q.maxSlots!);
    // じっさいに クリアできる
    const result = runProgram(q, toCommands(sol!));
    expect(isCleared(result), `${q.id} の 解が ゴールに つかない`).toBe(true);
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
