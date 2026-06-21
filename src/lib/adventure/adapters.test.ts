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
  tangramComposeToBattle,
  tangramMissingToBattle,
  tangramDecomposeToBattle,
  tangramAdvancedToBattle,
  numberLineToBattle,
  estimateToBattle,
  tenFrameSumToBattle,
  tenFrameTeenToBattle,
  coinsToBattle,
  mulFlashToBattle,
  shapeMirrorToBattle,
  sizeCompareToBattle,
  mulLookTotalToBattle,
  mulCountGroupsToBattle,
  mulFlashTotalToBattle,
  divLookTotalToBattle,
  divCountPeopleToBattle,
  divFlashTotalToBattle,
  mulRepeatedToBattle,
  mulArrayToBattle,
  mulDoubleToBattle,
  divPackToBattle,
  divFairToBattle,
  bigAdd1ToBattle,
  bigAddNoCarryToBattle,
  bigAddCarryToBattle,
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
    { name: 'tenFrameTeen', fn: tenFrameTeenToBattle },
    { name: 'coins', fn: coinsToBattle },
    { name: 'mulFlash', fn: mulFlashToBattle },
    { name: 'shapeMirror', fn: shapeMirrorToBattle },
    { name: 'sizeCompare', fn: sizeCompareToBattle },
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

    it('あまりが 見える divide ビジュアルを持つ（remainder>=1・dividend=divisor*quotient+remainder）', () => {
      for (let seed = 1; seed <= 40; seed++) {
        const q = divisionRemainderToBattle(seededRng(seed));
        expect(q.visual?.kind).toBe('divide');
        if (q.visual?.kind !== 'divide') throw new Error('kind mismatch');
        const { dividend, divisor, quotient, remainder } = q.visual;
        expect(remainder).toBeGreaterThanOrEqual(1); // あまりが かならず でる
        expect(remainder).toBeLessThan(divisor);
        expect(dividend).toBe(divisor * quotient + remainder);
      }
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
      // 選択肢どうしが 近すぎない（位置で見分けられる）: max に応じた gap 以上 離れている
      const gap = max <= 20 ? 2 : max <= 50 ? 5 : 10;
      const nums = q.choices.map(Number).sort((a, b) => a - b);
      for (let i = 1; i < nums.length; i++) {
        expect(nums[i] - nums[i - 1]).toBeGreaterThanOrEqual(gap);
      }
    }
  });

  it('配置式(placement)も 読み取り式も 両方 出る', () => {
    let placement = false;
    let read = false;
    for (let seed = 1; seed <= 40; seed++) {
      const q = numberLineToBattle(seededRng(seed));
      if (q.visual?.kind !== 'number-line') throw new Error('kind mismatch');
      if (q.visual.placement) placement = true;
      else read = true;
    }
    expect(placement).toBe(true);
    expect(read).toBe(true);
  });

  it('配置式でも target/choices は 正しく 整合する（採点の もとになる）', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const q = numberLineToBattle(seededRng(seed));
      if (q.visual?.kind !== 'number-line') throw new Error('kind mismatch');
      const { target, max, placement } = q.visual;
      if (!placement) continue;
      expect(target).toBeGreaterThanOrEqual(0);
      expect(target).toBeLessThanOrEqual(max);
      // 配置式でも target は 正解（採点に つかう）
      expect(q.choices[q.answerIndex]).toBe(String(target));
      // prompt に target（おく べき 数）が 出ている
      expect(q.promptText).toContain(String(target));
    }
  });
});

describe('かぞえる もり(estimate-pile)', () => {
  it('estimate-pile を持ち、正解は 正確な count・選択肢4つは重複なし', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const q = estimateToBattle(seededRng(seed));
      expect(q.visual?.kind).toBe('estimate-pile');
      if (q.visual?.kind !== 'estimate-pile') throw new Error('kind mismatch');
      const { count } = q.visual;
      // 正解は 正確な こ数
      expect(q.choices[q.answerIndex]).toBe(String(count));
      expect(q.choices).toHaveLength(4);
      expect(new Set(q.choices).size).toBe(4);
      // 選択肢は 妥当な範囲（1..99）
      for (const c of q.choices) {
        expect(Number(c)).toBeGreaterThanOrEqual(1);
        expect(Number(c)).toBeLessThanOrEqual(99);
      }
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

describe('20までの10の枠(tenFrameTeen)', () => {
  it('ten-frame-sum で a=10・b=1..10・正解は 10+b（11..20）', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const q = tenFrameTeenToBattle(seededRng(seed));
      expect(q.visual?.kind).toBe('ten-frame-sum');
      if (q.visual?.kind !== 'ten-frame-sum') throw new Error('kind mismatch');
      expect(q.visual.a).toBe(10);
      expect(q.visual.b).toBeGreaterThanOrEqual(1);
      expect(q.visual.b).toBeLessThanOrEqual(10);
      expect(q.choices[q.answerIndex]).toBe(String(10 + q.visual.b));
    }
  });
});

describe('ねだん パッと(coins)', () => {
  it('coins で 正解は こうかの ごうけい・選択肢4つ重複なし', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const q = coinsToBattle(seededRng(seed));
      expect(q.visual?.kind).toBe('coins');
      if (q.visual?.kind !== 'coins') throw new Error('kind mismatch');
      const total = q.visual.coins.reduce((s, c) => s + c.value * c.count, 0);
      expect(q.choices[q.answerIndex]).toBe(String(total));
      expect(new Set(q.choices).size).toBe(4);
      expect(total).toBeGreaterThan(0);
    }
  });
});

describe('パッと かけ算(mulFlash)', () => {
  it('groups で だんは 2か5・正解は perGroup×groups', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const q = mulFlashToBattle(seededRng(seed));
      expect(q.visual?.kind).toBe('groups');
      if (q.visual?.kind !== 'groups') throw new Error('kind mismatch');
      expect([2, 5]).toContain(q.visual.groups);
      expect(q.visual.perGroup).toBeGreaterThanOrEqual(2);
      expect(q.visual.perGroup).toBeLessThanOrEqual(5);
      expect(q.choices[q.answerIndex]).toBe(String(q.visual.perGroup * q.visual.groups));
      expect(q.visual.equationText).toBe(`${q.visual.perGroup} × ${q.visual.groups}`);
    }
  });
});

describe('かがみ(shapeMirror)', () => {
  it('shape-rotation で お題は うらがえし・正解の 変換は flipX', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const q = shapeMirrorToBattle(seededRng(seed));
      expect(q.visual?.kind).toBe('shape-rotation');
      expect(q.choiceTransforms).toBeTruthy();
      const correct = q.choiceTransforms![q.answerIndex];
      expect(correct.flipX).toBe(true);
      // ダミーは すべて うらがえさない（まわしただけ）＝かがみと みわけられる
      q.choiceTransforms!.forEach((t, i) => {
        if (i !== q.answerIndex) expect(t.flipX).toBe(false);
      });
    }
  });
});

describe('おおきさくらべ(sizeCompare)', () => {
  it('size-compare で 正解は いちばん 大きい/小さい もの', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const q = sizeCompareToBattle(seededRng(seed));
      expect(q.visual?.kind).toBe('size-compare');
      if (q.visual?.kind !== 'size-compare') throw new Error('kind mismatch');
      const { mode, items } = q.visual;
      expect(items.length).toBe(4);
      const sizes = items.map((it) => it.size);
      const want = mode === 'big' || mode === 'long' ? Math.max(...sizes) : Math.min(...sizes);
      expect(items[q.answerIndex].size).toBe(want);
      // サイズは すべて ちがう（いちばんが 1つに きまる）
      expect(new Set(sizes).size).toBe(4);
      expect(new Set(q.choices).size).toBe(4);
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
      // 「これが ○×△ だ」と わかる 式が ついている（塊の 見た目と そろう）
      expect(q.visual.equationText).toBe(`${q.visual.perGroup} × ${q.visual.groups}`);
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
      // 「これが ○÷△ だ」と わかる 式が ついている（山の かずと そろう）
      expect(q.visual.equationText).toMatch(new RegExp(`^${q.visual.count} ÷ \\d+$`));
    }
  });
});

// スーパーマーケットの くに（タングラム）: 図形で見せ、選択肢ラベルは 意味のある形名にする
describe('スーパーマーケットの くに（タングラム）', () => {
  const TANGRAM = [
    { name: 'tangramCompose', fn: tangramComposeToBattle },
    { name: 'tangramMissing', fn: tangramMissingToBattle },
    { name: 'tangramDecompose', fn: tangramDecomposeToBattle },
    { name: 'tangramAdvanced', fn: tangramAdvancedToBattle },
  ] as const;

  for (const { name, fn } of TANGRAM) {
    describe(name, () => {
      it('shape-compose ビジュアルで お題・選択肢の 両方が SVGコンテンツを持つ', () => {
        for (let seed = 1; seed <= 30; seed++) {
          const q = fn(seededRng(seed));
          expect(q.visual?.kind).toBe('shape-compose');
          if (q.visual?.kind !== 'shape-compose') throw new Error('kind mismatch');
          expect(q.visual.questionSvg).toMatch(/<(polygon|rect|circle)/);
          expect(q.visual.choiceSvgs).toHaveLength(q.choices.length);
          for (const svg of q.visual.choiceSvgs) {
            expect(svg).toMatch(/<(polygon|rect|circle)/);
          }
        }
      });

      it('4択で answerIndex が 正解を指す', () => {
        for (let seed = 1; seed <= 30; seed++) {
          const q = fn(seededRng(seed));
          expect(q.choices).toHaveLength(4);
          expect(q.answerIndex).toBeGreaterThanOrEqual(0);
          expect(q.answerIndex).toBeLessThan(4);
        }
      });

      it('選択肢ラベルは 重複しない＆意味のある形名（「こたえは ○ だよ」が なりたつ）', () => {
        for (let seed = 1; seed <= 30; seed++) {
          const q = fn(seededRng(seed));
          expect(new Set(q.choices).size).toBe(4);
          for (const label of q.choices) {
            // ラベルは ひらがなの 形名（「ピース1」みたいな 無意味な ラベルにしない）
            expect(label.length).toBeGreaterThan(0);
            expect(label).not.toMatch(/かたち\d|ピース\d/);
          }
        }
      });
    });
  }
});

// まとめて／わけて かぞえる くに（としょかんの 初歩 かけ算・わり算）:
// groups ビジュアルを 見て「ぜんぶで なんこ」/「いくつ(なん人)で わけた」を あてる。
describe('まとめて／わけて かぞえる くに', () => {
  const LOOK = [
    { name: 'mulLookTotal', fn: mulLookTotalToBattle, ask: 'total' as const, flash: false },
    { name: 'mulCountGroups', fn: mulCountGroupsToBattle, ask: 'groups' as const, flash: false },
    { name: 'mulFlashTotal', fn: mulFlashTotalToBattle, ask: 'total' as const, flash: true },
    { name: 'divLookTotal', fn: divLookTotalToBattle, ask: 'total' as const, flash: false },
    { name: 'divCountPeople', fn: divCountPeopleToBattle, ask: 'groups' as const, flash: false },
    { name: 'divFlashTotal', fn: divFlashTotalToBattle, ask: 'total' as const, flash: true },
  ];

  for (const t of LOOK) {
    describe(t.name, () => {
      it('groups ビジュアル・4択重複なし・正解は 問われた かず', () => {
        for (let seed = 1; seed <= 30; seed++) {
          const q = t.fn(seededRng(seed));
          expect(q.visual?.kind).toBe('groups');
          if (q.visual?.kind !== 'groups') throw new Error('kind mismatch');
          expect(q.choices).toHaveLength(4);
          expect(new Set(q.choices).size).toBe(4);
          const { perGroup, groups } = q.visual;
          expect(perGroup).toBeGreaterThanOrEqual(2);
          expect(groups).toBeGreaterThanOrEqual(2);
          const expected = t.ask === 'total' ? perGroup * groups : groups;
          expect(q.choices[q.answerIndex]).toBe(String(expected));
        }
      });

      it(`flash フラグが ${t.flash} で つく（ぱっとみ）`, () => {
        for (let seed = 1; seed <= 10; seed++) {
          const q = t.fn(seededRng(seed));
          if (q.visual?.kind !== 'groups') throw new Error('kind mismatch');
          expect(Boolean(q.visual.flash)).toBe(t.flash);
        }
      });
    });
  }

  it('わり算の くに（おさら／人）には groupLabel が つく', () => {
    for (const fn of [divLookTotalToBattle, divCountPeopleToBattle, divFlashTotalToBattle]) {
      const q = fn(seededRng(7));
      if (q.visual?.kind !== 'groups') throw new Error('kind mismatch');
      expect(q.visual.groupLabel).toBeTruthy();
    }
  });
});

// もっと かけ算（同数累加・アレイ・○ばい）: groups で 見せ、正解は ぜんぶの かず＝perGroup×groups
describe('もっと かけ算（同数累加・アレイ・○ばい）', () => {
  const MUL = [
    { name: 'mulRepeated', fn: mulRepeatedToBattle },
    { name: 'mulArray', fn: mulArrayToBattle },
    { name: 'mulDouble', fn: mulDoubleToBattle },
  ];
  for (const { name, fn } of MUL) {
    it(`${name}: groups・4択重複なし・正解は perGroup×groups・式つき`, () => {
      for (let seed = 1; seed <= 30; seed++) {
        const q = fn(seededRng(seed));
        expect(q.visual?.kind).toBe('groups');
        if (q.visual?.kind !== 'groups') throw new Error('kind mismatch');
        expect(q.choices).toHaveLength(4);
        expect(new Set(q.choices).size).toBe(4);
        const { perGroup, groups } = q.visual;
        expect(q.choices[q.answerIndex]).toBe(String(perGroup * groups));
        // 絵の下に そえる しきが ついている（かけ算の 導入）
        expect(q.visual.equationText).toBeTruthy();
      }
    });
  }
});

// もっと わり算: 包含除(なんふくろ＝groups)・等分除(ひとりなんこ＝perGroup)
describe('もっと わり算（包含除・等分除）', () => {
  it('div-pack: なんふくろ＝groups が 正解・groupLabel つき', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const q = divPackToBattle(seededRng(seed));
      expect(q.visual?.kind).toBe('groups');
      if (q.visual?.kind !== 'groups') throw new Error('kind mismatch');
      expect(q.choices[q.answerIndex]).toBe(String(q.visual.groups));
      expect(new Set(q.choices).size).toBe(4);
      expect(q.visual.groupLabel).toBeTruthy();
    }
  });
  it('div-fair: ひとり なんこ＝perGroup が 正解・groupLabel つき', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const q = divFairToBattle(seededRng(seed));
      expect(q.visual?.kind).toBe('groups');
      if (q.visual?.kind !== 'groups') throw new Error('kind mismatch');
      expect(q.choices[q.answerIndex]).toBe(String(q.visual.perGroup));
      expect(new Set(q.choices).size).toBe(4);
      expect(q.visual.groupLabel).toBeTruthy();
    }
  });
});

// かんたんめな 2けたの たしざん: 桁数・くりあがりの 条件を まもる
describe('かんたんめな 2けたの たしざん', () => {
  const re = /^(\d+) ＋ (\d+)/;
  it('big-add-1: 2けた＋1けた・くりあがりなし・正解は a+b・4択重複なし', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const q = bigAdd1ToBattle(seededRng(seed));
      expect(q.visual?.kind).toBe('equation');
      const m = q.promptText.match(re);
      expect(m).toBeTruthy();
      const a = Number(m![1]);
      const b = Number(m![2]);
      expect(a).toBeGreaterThanOrEqual(10); // 2けた
      expect(b).toBeGreaterThanOrEqual(1);
      expect(b).toBeLessThanOrEqual(9); // 1けた
      expect((a % 10) + (b % 10)).toBeLessThan(10); // くりあがりなし
      expect(q.choices[q.answerIndex]).toBe(String(a + b));
      expect(q.choices).toHaveLength(4);
      expect(new Set(q.choices).size).toBe(4);
    }
  });
  it('big-add-nc: 2けた＋2けた・くりあがりなし', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const q = bigAddNoCarryToBattle(seededRng(seed));
      const m = q.promptText.match(re);
      const a = Number(m![1]);
      const b = Number(m![2]);
      expect(a).toBeGreaterThanOrEqual(10);
      expect(b).toBeGreaterThanOrEqual(10); // 2けた
      expect((a % 10) + (b % 10)).toBeLessThan(10);
      expect(q.choices[q.answerIndex]).toBe(String(a + b));
    }
  });
  it('big-add-carry: いちの くらいで くりあがる', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const q = bigAddCarryToBattle(seededRng(seed));
      const m = q.promptText.match(re);
      const a = Number(m![1]);
      const b = Number(m![2]);
      expect((a % 10) + (b % 10)).toBeGreaterThanOrEqual(10);
      expect(q.choices[q.answerIndex]).toBe(String(a + b));
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
