import { describe, it, expect } from 'vitest';
import { WORDS, KANA_POOL } from './words';
import { WORLDS } from './worlds';
import { generateQuestion } from './generate';
import { makeAdaptive, optsForLevel } from './adaptive';
import type { LineId } from './types';

// 決定的に回すための seeded RNG（mulberry32）
function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe('語辞書（WordItem）の整合', () => {
  it('mora を つなげると reading に なる（拗音は1要素・全部ひらがな）', () => {
    for (const w of WORDS) {
      expect(w.mora.join('')).toBe(w.reading);
    }
  });
  it('id は ユニーク', () => {
    expect(new Set(WORDS.map((w) => w.id)).size).toBe(WORDS.length);
  });
  it('special 印の語は ほんとうに 特殊音を もつ（濁/半濁/拗/長/促）', () => {
    const isVoiced = (c: string) => /[がぎぐげござじずぜぞだぢづでどばびぶべぼ]/.test(c);
    const isSemi = (c: string) => /[ぱぴぷぺぽ]/.test(c);
    for (const w of WORDS) {
      if (!w.special) continue;
      if (w.special.includes('voiced')) expect(w.mora.some(isVoiced)).toBe(true);
      if (w.special.includes('semivoiced')) expect(w.mora.some(isSemi)).toBe(true);
      if (w.special.includes('choon')) expect(w.mora.includes('ー')).toBe(true);
      if (w.special.includes('sokuon')) expect(w.mora.includes('っ')).toBe(true);
      if (w.special.includes('youon')) expect(w.mora.some((m) => m.length === 2)).toBe(true);
    }
  });
});

describe('世界（WORLDS）の整合', () => {
  it('id は ユニーク', () => {
    expect(new Set(WORLDS.map((w) => w.id)).size).toBe(WORLDS.length);
  });
  it('lineIds は からっぽでない・最初の10は単一（教材の順）', () => {
    WORLDS.forEach((w, i) => {
      expect(w.lineIds.length).toBeGreaterThan(0);
      if (i < 10) expect(w.lineIds.length).toBe(1);
    });
  });
  it('11以降は 腕試しか 新メカの ゾーン（教材10より あと）', () => {
    expect(WORLDS.length).toBeGreaterThanOrEqual(13);
  });
  it('story は ひらがな主体（漢字を含まない）', () => {
    for (const w of WORLDS) {
      expect(w.story).not.toMatch(/[一-龯]/);
    }
  });
});

const LINES: LineId[] = [
  'count-mora', 'first-mora', 'last-mora', 'match-sound', 'build-word',
  'rule-card', 'delete-mora', 'reverse-word', 'special-mora', 'if-factory',
  'middle-mora', 'rhyme-match',
];

describe('問題生成（全10メカニクス）', () => {
  for (const line of LINES) {
    it(`${line}: 100回まわして 構造が ただしい`, () => {
      for (let s = 0; s < 100; s++) {
        const q = generateQuestion(line, seeded(s + 1));
        expect(q.lineId).toBe(line);
        expect(q.choices.length).toBeGreaterThanOrEqual(2);
        // choose は選択肢ラベルが ユニーク（build は同じモーラが重複しうる）
        if (q.mode === 'choose') {
          const labels = q.choices.map((c) => c.label);
          expect(new Set(labels).size).toBe(labels.length);
        }
        // prompt/speak は からでない・mora をつなぐと speak に なる
        expect(q.prompt.length).toBeGreaterThan(0);
        expect(q.speak.length).toBeGreaterThan(0);
        expect(q.mora.join('')).toBe(q.speak);

        if (q.mode === 'choose') {
          const a = q.answer as number;
          expect(a).toBeGreaterThanOrEqual(0);
          expect(a).toBeLessThan(q.choices.length);
        } else {
          // build: answer は choices の 全indexの 並べ替え
          const a = q.answer as number[];
          expect(a.length).toBe(q.choices.length);
          expect([...a].sort((x, y) => x - y)).toEqual(q.choices.map((_, i) => i));
        }
      }
    });
  }

  it('build-word: answer の順に ならべると もとの ことばに なる', () => {
    for (let s = 0; s < 100; s++) {
      const q = generateQuestion('build-word', seeded(s + 1));
      const a = q.answer as number[];
      const built = a.map((i) => q.choices[i].label).join('');
      expect(built).toBe(q.speak);
    }
  });

  it('reverse-word: answer の順に ならべると モーラ逆順に なる', () => {
    for (let s = 0; s < 100; s++) {
      const q = generateQuestion('reverse-word', seeded(s + 1));
      const a = q.answer as number[];
      const built = a.map((i) => q.choices[i].label).join('');
      const w = WORDS.find((w) => w.reading === q.speak)!;
      expect(built).toBe(w.mora.slice().reverse().join(''));
    }
  });

  it('count-mora: 正解の数字は その語の モーラ数', () => {
    for (let s = 0; s < 50; s++) {
      const q = generateQuestion('count-mora', seeded(s + 1));
      const w = WORDS.find((w) => w.reading === q.speak)!;
      expect(Number(q.choices[q.answer as number].label)).toBe(w.mora.length);
    }
  });

  it('middle-mora: 正解文字は まんなか（3モーラ語の mora[1]）', () => {
    for (let s = 0; s < 50; s++) {
      const q = generateQuestion('middle-mora', seeded(s + 1));
      const w = WORDS.find((w) => w.reading === q.speak)!;
      expect(w.mora.length).toBe(3);
      expect(q.choices[q.answer as number].label).toBe(w.mora[1]);
    }
  });

  it('rhyme-match: 正解は サンプルと おしりの おとが おなじ', () => {
    for (let s = 0; s < 50; s++) {
      const q = generateQuestion('rhyme-match', seeded(s + 1));
      const sample = WORDS.find((w) => w.reading === q.speak)!;
      const ans = q.choices[q.answer as number];
      const correctWord = WORDS.find((w) => w.reading === ans.label)!;
      const lastOf = (w: typeof sample) => w.mora[w.mora.length - 1];
      expect(lastOf(correctWord)).toBe(lastOf(sample));
    }
  });

  it('first/last-mora: 正解文字は 語頭/語尾の モーラ', () => {
    for (let s = 0; s < 50; s++) {
      const qf = generateQuestion('first-mora', seeded(s + 1));
      const wf = WORDS.find((w) => w.reading === qf.speak)!;
      expect(qf.choices[qf.answer as number].label).toBe(wf.mora[0]);
      const ql = generateQuestion('last-mora', seeded(s + 100));
      const wl = WORDS.find((w) => w.reading === ql.speak)!;
      expect(ql.choices[ql.answer as number].label).toBe(wl.mora[wl.mora.length - 1]);
    }
  });
});

// build/reverse の答えに使う speak は すべて KANA_POOL か mora にある文字（描画前提の sanity）
describe('文字プール', () => {
  it('KANA_POOL は ユニーク', () => {
    expect(new Set(KANA_POOL).size).toBe(KANA_POOL.length);
  });
});

describe('適応難易度', () => {
  it('2連続せいかいで レベルが あがる（最大4）', () => {
    const a = makeAdaptive(1);
    expect(a.level).toBe(1);
    a.record(true); a.record(true);
    expect(a.level).toBe(2);
    a.record(true); a.record(true);
    expect(a.level).toBe(3);
    a.record(true); a.record(true);
    expect(a.level).toBe(4);
    a.record(true); a.record(true);
    expect(a.level).toBe(4); // 上限
  });
  it('つまずきで レベルが さがる（最小1）', () => {
    const a = makeAdaptive(3);
    a.record(false);
    expect(a.level).toBe(2);
    a.record(false); a.record(false);
    expect(a.level).toBe(1); // 下限
  });
  it('レベルごとに モーラ数の レンジが ひろがる（床は保ち上だけ）', () => {
    expect(optsForLevel(1).maxMora).toBe(2);
    expect(optsForLevel(3).maxMora).toBe(4);
    expect(optsForLevel(4).maxMora).toBe(5); // 天井を のばした
    expect(optsForLevel(1).minMora).toBe(2); // 床は すえおき
  });
  it('レベルは 4 まで あがる', () => {
    const a = makeAdaptive(3);
    a.record(true); a.record(true);
    expect(a.level).toBe(4);
    a.record(true); a.record(true);
    expect(a.level).toBe(4);
  });
  it('choiceCount を 渡すと その数の 選択肢に なる（first-mora）', () => {
    const q = generateQuestion('first-mora', undefined, { choiceCount: 3 });
    expect(q.choices.length).toBe(3);
  });
});
