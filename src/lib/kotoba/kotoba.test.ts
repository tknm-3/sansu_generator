import { describe, it, expect } from 'vitest';
import { WORDS, KANA_POOL, SUBSTITUTE_PAIRS, ADD_PAIRS, SHIRITORI_CHAINS, getWord } from './words';
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
  it('reading は ユニーク（reading で 語を 引く テストが 多いため）', () => {
    expect(new Set(WORDS.map((w) => w.reading)).size).toBe(WORDS.length);
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

describe('ながい ことば（文字数の多い お題）', () => {
  it('5モーラ以上の語が じゅうぶん ある（般化の燃料）', () => {
    const long = WORDS.filter((w) => w.mora.length >= 5);
    expect(long.length).toBeGreaterThanOrEqual(15);
  });
  it('6モーラの語も ある', () => {
    expect(WORDS.some((w) => w.mora.length === 6)).toBe(true);
  });
  it('minMora/maxMora を 5〜6 にすると ながい語だけ 出る（プール枯渇で 短語に 落ちない）', () => {
    for (let s = 0; s < 60; s++) {
      const q = generateQuestion('count-mora', seeded(s + 1), { minMora: 5, maxMora: 6 });
      expect(q.mora.length).toBeGreaterThanOrEqual(5);
      expect(q.mora.length).toBeLessThanOrEqual(6);
    }
  });
});

describe('置き換え・添加ペア（新メカの 燃料）の整合', () => {
  it('SUBSTITUTE_PAIRS: base/target は 実在語・同じ長さ・pos だけ ちがう', () => {
    for (const p of SUBSTITUTE_PAIRS) {
      const b = getWord(p.baseId)!;
      const t = getWord(p.targetId)!;
      expect(b).toBeTruthy();
      expect(t).toBeTruthy();
      expect(b.mora.length).toBe(t.mora.length);
      expect(p.pos).toBeGreaterThanOrEqual(0);
      expect(p.pos).toBeLessThan(b.mora.length);
      // pos の モーラだけ ちがう（ほかは いっち）
      b.mora.forEach((m, i) => {
        if (i === p.pos) expect(m).not.toBe(t.mora[i]);
        else expect(m).toBe(t.mora[i]);
      });
    }
  });
  it('SUBSTITUTE_PAIRS: special印は 濁/半濁/拗を ふくむ ペア', () => {
    expect(SUBSTITUTE_PAIRS.some((p) => p.special)).toBe(true);
  });
  it('ADD_PAIRS: base は 実在語・mora を pos に たすと reading に なる', () => {
    for (const p of ADD_PAIRS) {
      const b = getWord(p.baseId)!;
      expect(b).toBeTruthy();
      const built = p.pos === 'head' ? p.mora + b.reading : b.reading + p.mora;
      expect(built).toBe(p.reading);
    }
  });
  it('SHIRITORI_CHAINS: すべて 実在語・語尾→語頭が つながる・2語いじょう', () => {
    expect(SHIRITORI_CHAINS.length).toBeGreaterThan(0);
    for (const chain of SHIRITORI_CHAINS) {
      expect(chain.length).toBeGreaterThanOrEqual(2);
      const ws = chain.map((id) => getWord(id)!);
      ws.forEach((w) => expect(w).toBeTruthy());
      for (let i = 0; i < ws.length - 1; i++) {
        const tail = ws[i].mora[ws[i].mora.length - 1];
        const head = ws[i + 1].mora[0];
        expect(tail).toBe(head); // しりとりが つながる
      }
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
  'middle-mora', 'rhyme-match', 'nth-mora',
  'delete-medial', 'add-mora', 'substitute-mora', 'find-position', 'swap-mora',
  'voice-mora', 'semivoice-mora', 'odd-one-out',
  'count-target-mora', 'anagram',
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

  it('nth-mora: 正解文字は highlightIndex の モーラ・prompt は その ばんめ', () => {
    for (let s = 0; s < 100; s++) {
      const q = generateQuestion('nth-mora', seeded(s + 1));
      const w = WORDS.find((w) => w.reading === q.speak)!;
      expect(q.highlightIndex).not.toBeUndefined();
      const idx = q.highlightIndex as number;
      expect(idx).toBeGreaterThanOrEqual(0);
      expect(idx).toBeLessThan(w.mora.length);
      expect(q.choices[q.answer as number].label).toBe(w.mora[idx]);
      expect(q.prompt).toContain(`${idx + 1} ばんめ`);
    }
  });

  it('delete-medial: 正解は まんなかを ぬいた 文字れつ（3モーラ語）', () => {
    for (let s = 0; s < 80; s++) {
      const q = generateQuestion('delete-medial', seeded(s + 1));
      const w = WORDS.find((w) => w.reading === q.speak)!;
      expect(w.mora.length).toBe(3);
      expect(q.choices[q.answer as number].label).toBe(w.mora[0] + w.mora[2]);
    }
  });

  it('add-mora: 正解文字は たす おと（あたま/おしり）', () => {
    for (let s = 0; s < 80; s++) {
      const q = generateQuestion('add-mora', seeded(s + 1));
      const base = WORDS.find((w) => w.reading === q.speak)!;
      const pair = ADD_PAIRS.find((p) => p.baseId === base.id && q.prompt.includes(p.reading))!;
      expect(pair).toBeTruthy();
      expect(q.choices[q.answer as number].label).toBe(pair.mora);
    }
  });

  it('substitute-mora: 正解は ペアの target・base とは ちがう絵', () => {
    for (let s = 0; s < 80; s++) {
      const q = generateQuestion('substitute-mora', seeded(s + 1));
      const ans = q.choices[q.answer as number];
      const target = WORDS.find((w) => w.reading === ans.label)!;
      const base = WORDS.find((w) => w.reading === q.speak)!;
      // base→target は 1音だけ ちがう（置換の 関係）
      expect(target.mora.length).toBe(base.mora.length);
      const diff = base.mora.filter((m, i) => m !== target.mora[i]).length;
      expect(diff).toBe(1);
    }
  });

  it('find-position: 正解の すうじは その音の ばんめ・その音は 1度だけ', () => {
    for (let s = 0; s < 100; s++) {
      const q = generateQuestion('find-position', seeded(s + 1));
      const w = WORDS.find((w) => w.reading === q.speak)!;
      const m = q.prompt.match(/「(.+?)」/)![1];
      const occur = w.mora.filter((x) => x === m);
      expect(occur.length).toBe(1); // 一意に きまる
      const pos = w.mora.indexOf(m) + 1;
      expect(Number(q.choices[q.answer as number].label)).toBe(pos);
    }
  });

  it('swap-mora: answer の順に ならべると さいしょと おしりが いれかわる', () => {
    for (let s = 0; s < 100; s++) {
      const q = generateQuestion('swap-mora', seeded(s + 1));
      const a = q.answer as number[];
      const built = a.map((i) => q.choices[i].label).join('');
      const w = WORDS.find((w) => w.reading === q.speak)!;
      const sw = w.mora.slice();
      [sw[0], sw[sw.length - 1]] = [sw[sw.length - 1], sw[0]];
      expect(built).toBe(sw.join(''));
    }
  });

  it('voice-mora: 正解は さいしょの音の 濁音（てんてん）', () => {
    const VOICE: Record<string, string> = { か: 'が', き: 'ぎ', く: 'ぐ', け: 'げ', こ: 'ご', さ: 'ざ', し: 'じ', す: 'ず', せ: 'ぜ', そ: 'ぞ', た: 'だ', ち: 'ぢ', つ: 'づ', て: 'で', と: 'ど' };
    for (let s = 0; s < 80; s++) {
      const q = generateQuestion('voice-mora', seeded(s + 1));
      const w = WORDS.find((w) => w.reading === q.speak)!;
      expect(VOICE[w.mora[0]]).toBeTruthy(); // 清音始まりに しぼれている
      expect(q.choices[q.answer as number].label).toBe(VOICE[w.mora[0]]);
    }
  });

  it('semivoice-mora: 正解は さいしょの音の 半濁音（まる・は行→ぱ行）', () => {
    const SEMI: Record<string, string> = { は: 'ぱ', ひ: 'ぴ', ふ: 'ぷ', へ: 'ぺ', ほ: 'ぽ' };
    for (let s = 0; s < 80; s++) {
      const q = generateQuestion('semivoice-mora', seeded(s + 1));
      const w = WORDS.find((w) => w.reading === q.speak)!;
      expect(SEMI[w.mora[0]]).toBeTruthy();
      expect(q.choices[q.answer as number].label).toBe(SEMI[w.mora[0]]);
    }
  });

  it('odd-one-out: 正解だけ さいしょ/おしりの音が ちがい・ほかは そろう', () => {
    for (let s = 0; s < 100; s++) {
      const q = generateQuestion('odd-one-out', seeded(s + 1));
      const words = q.choices.map((c) => WORDS.find((w) => w.reading === c.label)!);
      const useLast = q.prompt.includes('おしり');
      const keyOf = (w: typeof words[number]) => (useLast ? w.mora[w.mora.length - 1] : w.mora[0]);
      const oddKey = keyOf(words[q.answer as number]);
      const others = words.filter((_, i) => i !== (q.answer as number));
      // ほかの3つは ぜんぶ おなじ key・odd だけ ちがう
      expect(new Set(others.map(keyOf)).size).toBe(1);
      expect(oddKey).not.toBe(keyOf(others[0]));
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

  it('count-target-mora: 正解の すうじは その音が お題に でる かいすう', () => {
    for (let s = 0; s < 100; s++) {
      const q = generateQuestion('count-target-mora', seeded(s + 1));
      const w = WORDS.find((w) => w.reading === q.speak)!;
      const target = q.prompt.match(/「(.+?)」/)![1];
      const occur = w.mora.filter((m) => m === target).length;
      expect(occur).toBeGreaterThanOrEqual(1);
      expect(Number(q.choices[q.answer as number].label)).toBe(occur);
    }
  });

  it('anagram: build で answer の順に ならべると もとの ことばに なる', () => {
    for (let s = 0; s < 100; s++) {
      const q = generateQuestion('anagram', seeded(s + 1));
      expect(q.lineId).toBe('anagram');
      expect(q.mode).toBe('build');
      const a = q.answer as number[];
      const built = a.map((i) => q.choices[i].label).join('');
      expect(built).toBe(q.speak);
    }
  });

  it('shiritori-chain: build・絵つき・answer順に ならべると しりとりチェーンに なる', () => {
    for (let s = 0; s < 100; s++) {
      const q = generateQuestion('shiritori-chain', seeded(s + 1));
      expect(q.lineId).toBe('shiritori-chain');
      expect(q.mode).toBe('build');
      const a = q.answer as number[];
      // answer は choices 全indexの 並べ替え
      expect([...a].sort((x, y) => x - y)).toEqual(q.choices.map((_, i) => i));
      // すべての 選択肢に 絵が ある（絵で ならべる）
      q.choices.forEach((c) => expect(c.emoji).toBeTruthy());
      // answer順に ならべた 語れつが SHIRITORI_CHAINS の どれかと いっち
      const ordered = a.map((i) => q.choices[i].label);
      const match = SHIRITORI_CHAINS.some((chain) =>
        chain.map((id) => getWord(id)!.reading).join('|') === ordered.join('|'),
      );
      expect(match).toBe(true);
      // しりとりが つながる
      for (let i = 0; i < ordered.length - 1; i++) {
        const cur = WORDS.find((w) => w.reading === ordered[i])!;
        const nxt = WORDS.find((w) => w.reading === ordered[i + 1])!;
        expect(cur.mora[cur.mora.length - 1]).toBe(nxt.mora[0]);
      }
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
