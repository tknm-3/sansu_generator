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
});
