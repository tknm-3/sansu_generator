import { describe, it, expect } from 'vitest';
import { RIKA_GROUPS } from './data';
import { genClassify, genOdd, generateRika } from './generate';

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

describe('なかま辞書（RikaGroup）の整合', () => {
  it('各グループ: members>=4・distractors>=4・空文字なし', () => {
    for (const g of RIKA_GROUPS) {
      expect(g.members.length).toBeGreaterThanOrEqual(4);
      expect(g.distractors.length).toBeGreaterThanOrEqual(4);
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
      // グループ内で 絵の 重複も なし
      expect(new Set(g.members).size).toBe(g.members.length);
      expect(new Set(g.distractors).size).toBe(g.distractors.length);
    }
  });

  it('prompt は ひらがなガイドで 空でない', () => {
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
      // 正解は member、ほかは distractor
      expect(g.members).toContain(emojis[q.answer]);
      emojis.forEach((e, i) => {
        if (i !== q.answer) expect(g.distractors).toContain(e);
      });
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
      expect(g.distractors).toContain(emojis[q.answer]); // 仲間外れ
      emojis.forEach((e, i) => {
        if (i !== q.answer) expect(g.members).toContain(e); // ほかは仲間
      });
    }
  });
});

describe('ディスパッチャ', () => {
  it('generateRika は kind 指定で その種類を返す', () => {
    expect(generateRika(seeded(1), 'classify').kind).toBe('classify');
    expect(generateRika(seeded(1), 'odd-one-out').kind).toBe('odd-one-out');
  });
});
