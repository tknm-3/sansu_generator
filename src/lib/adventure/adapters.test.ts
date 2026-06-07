import { describe, it, expect } from 'vitest';
import {
  makeTenToBattle,
  additionToBattle,
  subtractionToBattle,
  cherryCalcToBattle,
  bigAdditionToBattle,
  bigSubtractionToBattle,
  multiplicationToBattle,
  divisionToBattle,
  divisionRemainderToBattle,
  wordToBattle,
  shapeComposeToBattle,
  shapePatternToBattle,
  shapeSpatialToBattle,
  numberLineToBattle,
  estimateToBattle,
  tenFrameSumToBattle,
  generateBattleQuestion,
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
    { name: 'bigSubtraction', fn: bigSubtractionToBattle },
    { name: 'multiplication', fn: multiplicationToBattle },
    { name: 'division', fn: divisionToBattle },
    { name: 'divisionRemainder', fn: divisionRemainderToBattle },
    { name: 'numberLine', fn: numberLineToBattle },
    { name: 'estimate', fn: estimateToBattle },
    { name: 'tenFrameSum', fn: tenFrameSumToBattle },
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

  describe('divisionRemainder', () => {
    it('しょうを きく と あまりを きく の 両方が 出る', () => {
      let askQuotient = false;
      let askRemainder = false;
      for (let seed = 1; seed <= 40; seed++) {
        const q = divisionRemainderToBattle(seededRng(seed));
        if (q.promptText.includes('あまる')) askRemainder = true;
        else askQuotient = true;
      }
      expect(askQuotient).toBe(true);
      expect(askRemainder).toBe(true);
    });
  });
});

describe('数直線わたり(numberLine)', () => {
  it('number-line ビジュアルを持ち、target は 0..max の範囲で 正解と一致', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const q = numberLineToBattle(seededRng(seed));
      expect(q.visual?.kind).toBe('number-line');
      if (q.visual?.kind !== 'number-line') throw new Error('kind mismatch');
      const { max, target } = q.visual;
      expect([20, 50, 100]).toContain(max);
      expect(target).toBeGreaterThanOrEqual(0);
      expect(target).toBeLessThanOrEqual(max);
      // 選択肢の正解は target
      expect(q.choices[q.answerIndex]).toBe(String(target));
      // 全選択肢が 0..max に収まる
      for (const c of q.choices) {
        const n = Number(c);
        expect(n).toBeGreaterThanOrEqual(0);
        expect(n).toBeLessThanOrEqual(max);
      }
    }
  });
});

describe('みつもりめいじん(estimate)', () => {
  it('estimate-pile を持ち、正解は count に最も近い 10の倍数', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const q = estimateToBattle(seededRng(seed));
      expect(q.visual?.kind).toBe('estimate-pile');
      if (q.visual?.kind !== 'estimate-pile') throw new Error('kind mismatch');
      const { count } = q.visual;
      const nearestTen = Math.round(count / 10) * 10;
      expect(q.choices[q.answerIndex]).toBe(String(nearestTen));
      // 選択肢は すべて 10の倍数
      for (const c of q.choices) expect(Number(c) % 10).toBe(0);
    }
  });
});

describe('パッとそろばん(tenFrameSum)', () => {
  it('ten-frame-sum を持ち、正解は a+b・a,b は 2..9', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const q = tenFrameSumToBattle(seededRng(seed));
      expect(q.visual?.kind).toBe('ten-frame-sum');
      if (q.visual?.kind !== 'ten-frame-sum') throw new Error('kind mismatch');
      const { a, b } = q.visual;
      expect(a).toBeGreaterThanOrEqual(2);
      expect(a).toBeLessThanOrEqual(9);
      expect(b).toBeGreaterThanOrEqual(2);
      expect(b).toBeLessThanOrEqual(9);
      expect(q.choices[q.answerIndex]).toBe(String(a + b));
    }
  });
});

// としょかんモードの図形問題は「テキスト代替(word)」ではなく
// 図形をそのまま見せるビジュアルで出題する（視覚的にわかるように）。
describe('図形バトルは視覚的なビジュアルで出す', () => {
  it('shapeCompose: お題と選択肢の両方がSVGコンテンツを持つ', () => {
    for (let i = 0; i < 20; i++) {
      const q = shapeComposeToBattle();
      expect(q.visual?.kind).toBe('shape-compose');
      if (q.visual?.kind !== 'shape-compose') throw new Error('kind mismatch');
      expect(q.visual.questionSvg).toMatch(/<(polygon|rect|circle)/);
      expect(q.visual.choiceSvgs).toHaveLength(q.choices.length);
      for (const svg of q.visual.choiceSvgs) {
        expect(svg).toMatch(/<(polygon|rect|circle)/);
      }
    }
  });

  it('shapePattern: 並びと選択肢を図形データで持つ（？を1つ含む）', () => {
    for (let i = 0; i < 20; i++) {
      const q = shapePatternToBattle();
      expect(q.visual?.kind).toBe('shape-pattern');
      if (q.visual?.kind !== 'shape-pattern') throw new Error('kind mismatch');
      expect(q.visual.sequence.filter((x) => x === null)).toHaveLength(1);
      expect(q.visual.choiceItems.length).toBeGreaterThan(0);
      for (const item of q.visual.choiceItems) {
        expect(item).toHaveProperty('shape');
        expect(item).toHaveProperty('color');
      }
    }
  });

  it('shapeSpatial: グリッド配置オブジェクトを持つ', () => {
    for (let i = 0; i < 20; i++) {
      const q = shapeSpatialToBattle();
      expect(q.visual?.kind).toBe('shape-spatial');
      if (q.visual?.kind !== 'shape-spatial') throw new Error('kind mismatch');
      expect(q.visual.objects.length).toBeGreaterThan(0);
      for (const obj of q.visual.objects) {
        expect(obj).toHaveProperty('emoji');
        expect(typeof obj.col).toBe('number');
        expect(typeof obj.row).toBe('number');
      }
    }
  });
});

// 図書館モードの かけ算・わり算は「5の段まで」かつ 視覚的に かたまり/山を見せる
describe('かけ算バトルは かたまりを 目で見せる（5の段まで）', () => {
  it('groups ビジュアルで、かたまり数・1つあたりが 2..5', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const q = multiplicationToBattle(seededRng(seed));
      expect(q.visual?.kind).toBe('groups');
      if (q.visual?.kind !== 'groups') throw new Error('kind mismatch');
      expect(q.visual.groups).toBeGreaterThanOrEqual(2);
      expect(q.visual.groups).toBeLessThanOrEqual(5);
      expect(q.visual.perGroup).toBeGreaterThanOrEqual(2);
      expect(q.visual.perGroup).toBeLessThanOrEqual(5);
      // ビジュアルの かけ算が こたえと あう
      const answer = q.visual.groups * q.visual.perGroup;
      expect(q.choices[q.answerIndex]).toBe(String(answer));
    }
  });
});

describe('わり算バトルは わける まえの 山を 見せる（5の段まで）', () => {
  it('objects ビジュアルで、ぜんぶの かずが 25いか', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const q = divisionToBattle(seededRng(seed));
      expect(q.visual?.kind).toBe('objects');
      if (q.visual?.kind !== 'objects') throw new Error('kind mismatch');
      expect(q.visual.count).toBeGreaterThanOrEqual(4);
      expect(q.visual.count).toBeLessThanOrEqual(25);
    }
  });
});

describe('zone adapter coverage', () => {
  it('全ゾーンの unitId にアダプターが登録されている', () => {
    for (const zone of MATH_ADVENTURE_ZONES) {
      for (const unitId of zone.unitIds) {
        expect(
          () => generateBattleQuestion(unitId),
          `zone "${zone.id}" の unitId "${unitId}" にアダプターがない`,
        ).not.toThrow();
      }
    }
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
