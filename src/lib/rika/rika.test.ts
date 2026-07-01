import { describe, it, expect } from 'vitest';
import { RIKA_GROUPS, RIKA_SEQUENCES, RIKA_PREDICTS } from './data';
import { RIKA_UNITS, getRikaUnit } from './units';
import { genClassify, genOdd, genSequence, genPredict, generateRika } from './generate';
import type { RikaUnitId } from './types';

// 決定的に回すための seeded RNG（mulberry32）
function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const UNIT_IDS: RikaUnitId[] = ['ikimono', 'sodatsu', 'ukishizumu', 'jishaku', 'kisetsu'];

describe('単元定義（RikaUnitDef）の整合', () => {
  it('5単元・id はユニーク・kinds は空でない・stampId は rika- で始まる', () => {
    expect(RIKA_UNITS.length).toBe(5);
    expect(new Set(RIKA_UNITS.map((u) => u.id)).size).toBe(5);
    for (const u of RIKA_UNITS) {
      expect(u.kinds.length).toBeGreaterThan(0);
      expect(u.stampId.startsWith('rika-')).toBe(true);
      expect(u.title.length).toBeGreaterThan(0);
    }
  });

  it('各単元の kinds に必要なデータが 存在する（プール枯渇なし）', () => {
    for (const u of RIKA_UNITS) {
      for (const k of u.kinds) {
        if (k === 'classify' || k === 'odd-one-out') {
          expect(RIKA_GROUPS.some((g) => g.unit === u.id)).toBe(true);
        } else if (k === 'sequence') {
          expect(RIKA_SEQUENCES.some((s) => s.unit === u.id)).toBe(true);
        } else if (k === 'predict') {
          expect(RIKA_PREDICTS.some((p) => p.unit === u.id)).toBe(true);
        }
      }
    }
  });
});

describe('なかま辞書（RikaGroup）の整合', () => {
  it('各グループ: members>=4・distractors>=4・空文字なし・unit が正しい', () => {
    for (const g of RIKA_GROUPS) {
      expect(g.members.length).toBeGreaterThanOrEqual(4);
      expect(g.distractors.length).toBeGreaterThanOrEqual(4);
      expect(UNIT_IDS).toContain(g.unit);
      for (const e of [...g.members, ...g.distractors]) {
        expect(typeof e).toBe('string');
        expect(e.length).toBeGreaterThan(0);
      }
    }
  });

  it('members と distractors は 重ならない（答えが一意）', () => {
    for (const g of RIKA_GROUPS) {
      const inter = g.members.filter((m) => g.distractors.includes(m));
      expect(inter).toEqual([]);
      expect(new Set(g.members).size).toBe(g.members.length);
      expect(new Set(g.distractors).size).toBe(g.distractors.length);
    }
  });

  it('prompt は ひらがなガイドで 空でない・どれ を含む', () => {
    for (const g of RIKA_GROUPS) {
      expect(g.prompt.length).toBeGreaterThan(0);
      expect(g.prompt).toContain('どれ');
    }
  });
});

describe('分類(classify)の生成', () => {
  it('100回: 4択・絵は ユニーク・正解は members の1つ', () => {
    for (let s = 0; s < 100; s++) {
      const q = genClassify(seeded(s + 1));
      expect(q.kind).toBe('classify');
      expect(q.choices.length).toBe(4);
      const emojis = q.choices.map((c) => c.emoji);
      expect(new Set(emojis).size).toBe(4);
      expect(q.answer).toBeGreaterThanOrEqual(0);
      expect(q.answer).toBeLessThan(4);
      const g = RIKA_GROUPS.find((x) => x.id === q.groupId)!;
      expect(g.members).toContain(emojis[q.answer]);
      emojis.forEach((e, i) => {
        if (i !== q.answer) expect(g.distractors).toContain(e);
      });
    }
  });

  it('unit を渡すと その単元の グループだけ 出す', () => {
    for (let s = 0; s < 30; s++) {
      const q = genClassify(seeded(s + 1), 'kisetsu');
      const g = RIKA_GROUPS.find((x) => x.id === q.groupId)!;
      expect(g.unit).toBe('kisetsu');
    }
  });
});

describe('なかまはずれ(odd-one-out)の生成', () => {
  it('100回: 4択・正解は distractor・ほか3つは members', () => {
    for (let s = 0; s < 100; s++) {
      const q = genOdd(seeded(s + 7));
      expect(q.kind).toBe('odd-one-out');
      expect(q.choices.length).toBe(4);
      const emojis = q.choices.map((c) => c.emoji);
      expect(new Set(emojis).size).toBe(4);
      const g = RIKA_GROUPS.find((x) => x.id === q.groupId)!;
      expect(g.distractors).toContain(emojis[q.answer]);
      emojis.forEach((e, i) => {
        if (i !== q.answer) expect(g.members).toContain(e);
      });
    }
  });
});

describe('系列辞書（RikaSequence）の整合', () => {
  it('各系列: stages>=3・重複なし・prompt は ならべて・unit が正しい', () => {
    for (const s of RIKA_SEQUENCES) {
      expect(s.stages.length).toBeGreaterThanOrEqual(3);
      expect(new Set(s.stages).size).toBe(s.stages.length);
      expect(s.prompt).toContain('ならべて');
      expect(UNIT_IDS).toContain(s.unit);
    }
  });
});

describe('そだつ じゅんばん(sequence)の生成', () => {
  it('100回: order は 0..n-1 の並べ替え・order どおり タップで 正しい順に なる', () => {
    for (let s = 0; s < 100; s++) {
      const q = genSequence(seeded(s + 13));
      expect(q.kind).toBe('sequence');
      const seq = RIKA_SEQUENCES.find((x) => x.id === q.groupId)!;
      const n = seq.stages.length;
      expect(q.choices.length).toBe(n);
      expect(q.order).toBeDefined();
      const order = q.order!;
      expect([...order].sort((a, b) => a - b)).toEqual(seq.stages.map((_, i) => i));
      const built = order.map((ci) => q.choices[ci].emoji);
      expect(built).toEqual(seq.stages);
    }
  });
});

describe('予想セット（RikaPredictSet）の整合', () => {
  it('各セット: labels は2つ・items>=4・positive 両方あり・reason 空でない', () => {
    for (const p of RIKA_PREDICTS) {
      expect(p.labels.length).toBe(2);
      expect(p.items.length).toBeGreaterThanOrEqual(4);
      expect(UNIT_IDS).toContain(p.unit);
      expect(p.items.some((it) => it.positive)).toBe(true); // うく/くっつく が ある
      expect(p.items.some((it) => !it.positive)).toBe(true); // しずむ/つかない も ある
      for (const it of p.items) {
        expect(it.emoji.length).toBeGreaterThan(0);
        expect(it.reason.length).toBeGreaterThan(0);
      }
    }
  });
});

describe('予想(predict)の生成', () => {
  it('100回: answer は 0か1・itemEmoji と labels と reason を もつ', () => {
    for (let s = 0; s < 100; s++) {
      const q = genPredict(seeded(s + 21));
      expect(q.kind).toBe('predict');
      expect([0, 1]).toContain(q.answer);
      expect(q.itemEmoji).toBeTruthy();
      expect(q.labels?.length).toBe(2);
      expect(q.reason?.length).toBeGreaterThan(0);
      // answer は「その もの の positive/negative」と 一致する
      const set = RIKA_PREDICTS.find((x) => x.id === q.groupId)!;
      const item = set.items.find((it) => it.emoji === q.itemEmoji)!;
      expect(q.answer).toBe(item.positive ? 0 : 1);
    }
  });
});

describe('ディスパッチャ（単元しぼり）', () => {
  it('generateRika は kind 指定で その種類を返す', () => {
    expect(generateRika(seeded(1), 'classify').kind).toBe('classify');
    expect(generateRika(seeded(1), 'odd-one-out').kind).toBe('odd-one-out');
    expect(generateRika(seeded(1), 'sequence').kind).toBe('sequence');
    expect(generateRika(seeded(1), 'predict').kind).toBe('predict');
  });

  it('unit だけ渡すと その単元の kinds のどれかを 返す', () => {
    for (const u of RIKA_UNITS) {
      for (let s = 0; s < 40; s++) {
        const q = generateRika(seeded(s + 1), undefined, u.id);
        expect(u.kinds).toContain(q.kind);
      }
    }
  });

  it('getRikaUnit は 未知idでも 落ちずに 先頭を返す', () => {
    expect(getRikaUnit('ikimono').id).toBe('ikimono');
  });
});
