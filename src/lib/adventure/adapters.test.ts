import { describe, it, expect } from 'vitest';
import {
  makeTenToBattle,
  additionToBattle,
  subtractionToBattle,
  cherryCalcToBattle,
  bigAdditionToBattle,
  wordToBattle,
} from './adapters';
import { generateMap } from './mapGen';
import { MATH_ADVENTURE_ZONES } from './zones';

/** 決定論的 rng（シード付き LCG） */
function seededRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

describe('battle adapters', () => {
  const ADAPTERS = [
    { name: 'makeTen', fn: makeTenToBattle },
    { name: 'addition', fn: additionToBattle },
    { name: 'subtraction', fn: subtractionToBattle },
    { name: 'cherryCalc', fn: cherryCalcToBattle },
    { name: 'bigAddition', fn: bigAdditionToBattle },
  ] as const;

  for (const { name, fn } of ADAPTERS) {
    describe(name, () => {
      it('4択を生成する', () => {
        for (let seed = 1; seed <= 20; seed++) {
          const q = fn(seededRng(seed));
          expect(q.choices).toHaveLength(4);
        }
      });

      it('answerIndex は正解を指す', () => {
        for (let seed = 1; seed <= 20; seed++) {
          const q = fn(seededRng(seed));
          expect(q.answerIndex).toBeGreaterThanOrEqual(0);
          expect(q.answerIndex).toBeLessThan(4);
        }
      });

      it('選択肢に重複がない', () => {
        for (let seed = 1; seed <= 20; seed++) {
          const q = fn(seededRng(seed));
          const unique = new Set(q.choices);
          expect(unique.size).toBe(4);
        }
      });
    });
  }

  describe('wordToBattle', () => {
    it('word-addition: 4択（ひらがな）を生成', () => {
      for (let seed = 1; seed <= 10; seed++) {
        const q = wordToBattle('word-addition', seededRng(seed));
        expect(q.choices).toHaveLength(3); // word は verdict の3種類
        expect(q.answerIndex).toBeGreaterThanOrEqual(0);
        expect(q.answerIndex).toBeLessThan(3);
      }
    });
  });
});

describe('mapGen', () => {
  it('各ゾーンのマップが正しく生成される', () => {
    for (const zone of MATH_ADVENTURE_ZONES) {
      const map = generateMap(zone, seededRng(42));
      expect(map.nodes.length).toBeGreaterThan(0);
      expect(map.startId).toBeTruthy();
      expect(map.bossId).toBeTruthy();

      // ボスはbossノード
      const boss = map.nodes.find((n) => n.id === map.bossId);
      expect(boss?.kind).toBe('boss');

      // 全ノードから接続が繋がっていること（ボス以外は nextIds > 0）
      for (const node of map.nodes) {
        if (node.id !== map.bossId) {
          expect(node.nextIds.length).toBeGreaterThan(0);
        }
      }
    }
  });

  it('スタートノードからボスに到達できる', () => {
    for (const zone of MATH_ADVENTURE_ZONES) {
      const map = generateMap(zone, seededRng(99));
      const visited = new Set<string>();
      const queue = [map.startId];
      while (queue.length) {
        const id = queue.shift()!;
        if (visited.has(id)) continue;
        visited.add(id);
        const node = map.nodes.find((n) => n.id === id)!;
        queue.push(...node.nextIds);
      }
      expect(visited.has(map.bossId)).toBe(true);
    }
  });
});
