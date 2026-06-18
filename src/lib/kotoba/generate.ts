import { WORDS, KANA_POOL, SUBSTITUTE_PAIRS, ADD_PAIRS, getWord } from './words';
import type { LineId, MojiQuestion, WordItem, MojiChoice } from './types';

// もじギア・ファクトリーの問題生成（§7）。
// すべて (rng) => MojiQuestion。rng 既定は Math.random（テストは seeded を渡す）。

export type Rng = () => number;
const R = (rng?: Rng): number => (rng ? rng() : Math.random());

function pick<T>(arr: T[], rng?: Rng): T {
  return arr[Math.floor(R(rng) * arr.length)];
}
function shuffle<T>(arr: T[], rng?: Rng): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(R(rng) * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export interface GenOpts {
  minMora?: number;
  maxMora?: number;
  special?: boolean; // true なら特殊音節の語だけ
  choiceCount?: number; // 文字/数 選択肢の数（既定 4）
}

function poolWords(opts?: GenOpts): WordItem[] {
  const min = opts?.minMora ?? 2;
  const max = opts?.maxMora ?? 4;
  let ws = WORDS.filter((w) => w.mora.length >= min && w.mora.length <= max);
  if (opts?.special) ws = ws.filter((w) => w.special && w.special.length > 0);
  return ws.length ? ws : WORDS;
}

/** 正解1文字＋ダミー文字 で n択の文字選択肢を作る（重複なし） */
function letterChoices(correct: string, n: number, rng?: Rng): { choices: MojiChoice[]; answer: number } {
  const pool = shuffle(KANA_POOL.filter((k) => k !== correct), rng);
  const labels = [correct, ...pool.slice(0, n - 1)];
  const shuffled = shuffle(labels, rng);
  return { choices: shuffled.map((l) => ({ label: l })), answer: shuffled.indexOf(correct) };
}

// ── 1. モーラ計数 ──
function genCount(rng?: Rng, opts?: GenOpts): MojiQuestion {
  const w = pick(poolWords(opts), rng);
  const n = w.mora.length;
  const cands = Array.from(new Set([n, n - 1, n + 1].filter((x) => x >= 1)));
  const shuffled = shuffle(cands, rng);
  return {
    lineId: 'count-mora',
    mode: 'choose',
    prompt: 'いくつの おと かな？',
    speak: w.reading,
    mora: w.mora,
    pictureEmoji: w.display,
    choices: shuffled.map((x) => ({ label: String(x) })),
    answer: shuffled.indexOf(n),
  };
}

// ── 2. 語頭音 ──
function genFirst(rng?: Rng, opts?: GenOpts): MojiQuestion {
  const w = pick(poolWords(opts), rng);
  const { choices, answer } = letterChoices(w.mora[0], opts?.choiceCount ?? 4, rng);
  return { lineId: 'first-mora', mode: 'choose', prompt: 'さいしょの おとは？', speak: w.reading, mora: w.mora, pictureEmoji: w.display, choices, answer };
}

// ── 3. 語尾音 ──
function genLast(rng?: Rng, opts?: GenOpts): MojiQuestion {
  const w = pick(poolWords(opts), rng);
  const { choices, answer } = letterChoices(w.mora[w.mora.length - 1], opts?.choiceCount ?? 4, rng);
  return { lineId: 'last-mora', mode: 'choose', prompt: 'おしりの おとは？', speak: w.reading, mora: w.mora, pictureEmoji: w.display, choices, answer };
}

// ── 4. 音の同定（さいしょが おなじ なかま）──
function genMatch(rng?: Rng, opts?: GenOpts): MojiQuestion {
  const ws = poolWords(opts);
  let sample: WordItem, matches: WordItem[];
  // さいしょの おとが おなじ 別語が ある sample を さがす
  const shuffledWs = shuffle(ws, rng);
  for (const s of shuffledWs) {
    const m = ws.filter((w) => w.id !== s.id && w.mora[0] === s.mora[0]);
    if (m.length) { sample = s; matches = m; break; }
  }
  sample = sample!; matches = matches!;
  const correct = pick(matches, rng);
  const distractors = shuffle(ws.filter((w) => w.mora[0] !== sample.mora[0] && w.id !== correct.id), rng).slice(0, 2);
  const opts3 = shuffle([correct, ...distractors], rng);
  return {
    lineId: 'match-sound',
    mode: 'choose',
    prompt: 'さいしょが おなじ なかま どれ？',
    speak: sample.reading,
    mora: sample.mora,
    pictureEmoji: sample.display,
    choices: opts3.map((w) => ({ label: w.reading, emoji: w.display })),
    answer: opts3.indexOf(correct),
  };
}

// ── 5. 文字合成（順に ならべる）──
function genBuild(rng?: Rng, opts?: GenOpts): MojiQuestion {
  const w = pick(poolWords({ minMora: opts?.minMora ?? 2, maxMora: opts?.maxMora ?? 3 }), rng);
  const order = shuffle(w.mora.map((_, i) => i), rng); // choices に置く モーラの順
  const choices = order.map((i) => ({ label: w.mora[i] }));
  // answer: 正しい語順になる choice index 列
  const answer = w.mora.map((_, target) => order.indexOf(target));
  return { lineId: 'build-word', mode: 'build', prompt: 'もじを ならべて！', speak: w.reading, mora: w.mora, pictureEmoji: w.display, choices, answer };
}

// ── 6. IF-THEN 切替（たべもの→さいしょ／いきもの→おしり）──
function genRule(rng?: Rng, opts?: GenOpts): MojiQuestion {
  const ws = poolWords(opts).filter((w) => w.category === 'food' || w.category === 'animal');
  const w = pick(ws.length ? ws : poolWords(opts), rng);
  const useFirst = w.category === 'food';
  const correct = useFirst ? w.mora[0] : w.mora[w.mora.length - 1];
  const { choices, answer } = letterChoices(correct, opts?.choiceCount ?? 4, rng);
  const rule = useFirst ? 'たべものは さいしょの おと！' : 'いきものは おしりの おと！';
  return { lineId: 'rule-card', mode: 'choose', prompt: rule, speak: w.reading, mora: w.mora, pictureEmoji: w.display, choices, answer };
}

// ── 7. 音の削除（さいしょの おとを ぬくと？）──
function genDelete(rng?: Rng, opts?: GenOpts): MojiQuestion {
  const w = pick(poolWords({ minMora: 3, maxMora: opts?.maxMora ?? 4 }), rng);
  const correct = w.mora.slice(1).join('');
  const cand = new Set<string>([correct]);
  cand.add(w.mora.slice(0, -1).join('')); // おしりを ぬいた
  cand.add(w.mora.slice().reverse().join('')); // さかさま
  cand.add(w.reading); // そのまま
  const labels = shuffle(Array.from(cand), rng).slice(0, 4);
  if (!labels.includes(correct)) labels[0] = correct;
  const shuffled = shuffle(labels, rng);
  return {
    lineId: 'delete-mora',
    mode: 'choose',
    prompt: 'さいしょの おとを ぬくと？',
    speak: w.reading,
    mora: w.mora,
    pictureEmoji: w.display,
    choices: shuffled.map((l) => ({ label: l })),
    answer: shuffled.indexOf(correct),
  };
}

// ── 8. 逆唱（さかさまに ならべる）──
function genReverse(rng?: Rng, opts?: GenOpts): MojiQuestion {
  const w = pick(poolWords({ minMora: opts?.minMora ?? 2, maxMora: opts?.maxMora ?? 3 }), rng);
  const order = shuffle(w.mora.map((_, i) => i), rng);
  const choices = order.map((i) => ({ label: w.mora[i] }));
  // 正解は さかさま（mora を 逆順に）
  const reversed = w.mora.map((_, i) => w.mora.length - 1 - i);
  const answer = reversed.map((target) => order.indexOf(target));
  return { lineId: 'reverse-word', mode: 'build', prompt: 'さかさまに ならべて！', speak: w.reading, mora: w.mora, pictureEmoji: w.display, choices, answer };
}

// ── 9. 特殊音節（とくべつな おと）──
function genSpecial(rng?: Rng): MojiQuestion {
  const q = genFirst(rng, { special: true, minMora: 2, maxMora: 4 });
  return { ...q, lineId: 'special-mora', prompt: 'さいしょの おとは？（とくべつ）' };
}

// ── 10. 合体ボス（IF-THEN を むずかしい語で）──
function genFactory(rng?: Rng): MojiQuestion {
  const q = genRule(rng, { minMora: 3, maxMora: 4 });
  return { ...q, lineId: 'if-factory' };
}

// ── まんなかの音（語中音）。3モーラ語に限定＝まんなかが 1つに きまる ──
function genMiddle(rng?: Rng, opts?: GenOpts): MojiQuestion {
  const w = pick(poolWords({ minMora: 3, maxMora: 3, special: opts?.special }), rng);
  const mid = w.mora[1];
  const { choices, answer } = letterChoices(mid, opts?.choiceCount ?? 4, rng);
  return { lineId: 'middle-mora', mode: 'choose', prompt: 'まんなかの おとは？', speak: w.reading, mora: w.mora, pictureEmoji: w.display, choices, answer };
}

// ── おしりが おなじ なかま（押韻マッチ）──
function genRhyme(rng?: Rng, opts?: GenOpts): MojiQuestion {
  const ws = poolWords(opts);
  const last = (w: WordItem) => w.mora[w.mora.length - 1];
  let sample: WordItem | undefined, matches: WordItem[] = [];
  for (const s of shuffle(ws, rng)) {
    const m = ws.filter((w) => w.id !== s.id && last(w) === last(s));
    if (m.length) { sample = s; matches = m; break; }
  }
  sample = sample ?? ws[0];
  const correct = pick(matches.length ? matches : ws.filter((w) => w.id !== sample!.id), rng);
  const distractors = shuffle(ws.filter((w) => last(w) !== last(sample!) && w.id !== correct.id), rng).slice(0, 2);
  const opts3 = shuffle([correct, ...distractors], rng);
  return {
    lineId: 'rhyme-match',
    mode: 'choose',
    prompt: 'おしりが おなじ なかま どれ？',
    speak: sample.reading,
    mora: sample.mora,
    pictureEmoji: sample.display,
    choices: opts3.map((w) => ({ label: w.reading, emoji: w.display })),
    answer: opts3.indexOf(correct),
  };
}

// ── ○ばんめの音（位置を指定して抽出）。first/last/middle の一般化 ──
// 3モーラ以上の語で「○ばんめ」を問う。位置は highlightIndex で 光の粒に 示す。
function genNth(rng?: Rng, opts?: GenOpts): MojiQuestion {
  const w = pick(poolWords({ minMora: Math.max(3, opts?.minMora ?? 3), maxMora: opts?.maxMora ?? 6 }), rng);
  const pos = 1 + Math.floor(R(rng) * w.mora.length); // 1..len（端も ふくむ＝ばんめの 学び）
  const correct = w.mora[pos - 1];
  const { choices, answer } = letterChoices(correct, opts?.choiceCount ?? 4, rng);
  return {
    lineId: 'nth-mora',
    mode: 'choose',
    prompt: `${pos} ばんめの おとは？`,
    speak: w.reading,
    mora: w.mora,
    pictureEmoji: w.display,
    highlightIndex: pos - 1,
    choices,
    answer,
  };
}

function posLabel(pos: number, len: number): string {
  if (pos === 0) return 'あたま';
  if (pos === len - 1) return 'おしり';
  return 'まんなか';
}

// ── まんなかの音を ぬく（語中削除）。3モーラ語＝まんなかが 1つに きまる ──
// 既存の delete-mora（語頭/語尾）より難しい操作（位置特定＋保持）。
function genDeleteMedial(rng?: Rng): MojiQuestion {
  const w = pick(poolWords({ minMora: 3, maxMora: 3 }), rng);
  const correct = w.mora[0] + w.mora[2];
  const cand = new Set<string>([correct]);
  cand.add(w.reading); // そのまま
  cand.add(w.mora.slice(1).join('')); // あたまを ぬいた
  cand.add(w.mora.slice(0, -1).join('')); // おしりを ぬいた
  cand.add(w.mora.slice().reverse().join('')); // さかさま
  const labels = shuffle(Array.from(cand), rng).slice(0, 4);
  if (!labels.includes(correct)) labels[0] = correct;
  const shuffled = shuffle(labels, rng);
  return {
    lineId: 'delete-medial',
    mode: 'choose',
    prompt: 'まんなかの おとを ぬくと？',
    speak: w.reading,
    mora: w.mora,
    pictureEmoji: w.display,
    choices: shuffled.map((l) => ({ label: l })),
    answer: shuffled.indexOf(correct),
  };
}

// ── 音を たす（添加）。ベース語に 1音 たすと 別の ことばに なる ──
// 答えは「たす おと（文字）」。削除と対を なす 操作系。
function genAdd(rng?: Rng, opts?: GenOpts): MojiQuestion {
  const p = pick(ADD_PAIRS, rng);
  const base = getWord(p.baseId)!;
  const { choices, answer } = letterChoices(p.mora, opts?.choiceCount ?? 4, rng);
  const where = p.pos === 'head' ? 'あたま' : 'おしり';
  return {
    lineId: 'add-mora',
    mode: 'choose',
    prompt: `${where}に なにを たすと「${p.reading}」？`,
    speak: base.reading,
    mora: base.mora,
    pictureEmoji: base.display,
    choices,
    answer,
  };
}

// ── 音を おきかえる（置換）。指定の おとに かえると どの ことばに なる？──
// 削除より 上位の 音韻操作（文字-音対応＋WM＋抑制）。
function genSubstitute(rng?: Rng, opts?: GenOpts): MojiQuestion {
  let pairs = SUBSTITUTE_PAIRS;
  if (opts?.special) {
    const sp = pairs.filter((p) => p.special);
    if (sp.length) pairs = sp;
  }
  const p = pick(pairs, rng);
  const base = getWord(p.baseId)!;
  const target = getWord(p.targetId)!;
  const newMora = target.mora[p.pos];
  // ダミーは base/target いがいの語（読みが かぶらないように）
  const used = new Set<string>([base.reading, target.reading]);
  const distractors: WordItem[] = [];
  for (const d of shuffle(WORDS, rng)) {
    if (used.has(d.reading)) continue;
    used.add(d.reading);
    distractors.push(d);
    if (distractors.length >= (opts?.choiceCount ?? 4) - 1) break;
  }
  const opt = shuffle([target, ...distractors], rng);
  return {
    lineId: 'substitute-mora',
    mode: 'choose',
    prompt: `${posLabel(p.pos, base.mora.length)}を「${newMora}」に かえると？`,
    speak: base.reading,
    mora: base.mora,
    pictureEmoji: base.display,
    choices: opt.map((w) => ({ label: w.reading, emoji: w.display })),
    answer: opt.indexOf(target),
  };
}

// ── その音は ○ばんめ？（位置同定）。nth-mora の 逆操作（音→位置）──
function genFindPosition(rng?: Rng, opts?: GenOpts): MojiQuestion {
  // 1度だけ でてくる モーラを もつ語に しぼる（位置が 1つに きまる）
  const min = Math.max(3, opts?.minMora ?? 3);
  const cands = poolWords({ minMora: min, maxMora: opts?.maxMora ?? 6 }).filter((w) =>
    w.mora.some((m) => w.mora.filter((x) => x === m).length === 1),
  );
  const w = pick(cands.length ? cands : poolWords({ minMora: 3, maxMora: 4 }), rng);
  const uniques = w.mora.map((m, i) => ({ m, i })).filter(({ m }) => w.mora.filter((x) => x === m).length === 1);
  const target = pick(uniques.length ? uniques : w.mora.map((m, i) => ({ m, i })), rng);
  const ansPos = target.i + 1;
  // 選択肢＝位置の すうじ（正解を ふくむ ばんめ群）
  const allPos = w.mora.map((_, i) => i + 1);
  const others = shuffle(allPos.filter((p) => p !== ansPos), rng).slice(0, (opts?.choiceCount ?? 4) - 1);
  const positions = shuffle([ansPos, ...others], rng);
  return {
    lineId: 'find-position',
    mode: 'choose',
    prompt: `「${target.m}」は なんばんめ？`,
    speak: w.reading,
    mora: w.mora,
    pictureEmoji: w.display,
    choices: positions.map((p) => ({ label: String(p) })),
    answer: positions.indexOf(ansPos),
  };
}

// ── さいしょと おしりを いれかえる（転置・spoonerism）。WM最大級 ──
function genSwap(rng?: Rng, opts?: GenOpts): MojiQuestion {
  const w = pick(poolWords({ minMora: Math.max(3, opts?.minMora ?? 3), maxMora: opts?.maxMora ?? 4 }), rng);
  const order = shuffle(w.mora.map((_, i) => i), rng);
  const choices = order.map((i) => ({ label: w.mora[i] }));
  // さいしょ(0)と おしり(len-1)を いれかえた 原index列
  const swapped = w.mora.map((_, i) => i);
  const last = swapped.length - 1;
  [swapped[0], swapped[last]] = [swapped[last], swapped[0]];
  const answer = swapped.map((origIdx) => order.indexOf(origIdx));
  return {
    lineId: 'swap-mora',
    mode: 'build',
    prompt: 'さいしょと おしりを いれかえて！',
    speak: w.reading,
    mora: w.mora,
    pictureEmoji: w.display,
    choices,
    answer,
  };
}

/** ライン別ディスパッチャ */
export function generateQuestion(lineId: LineId, rng?: Rng, opts?: GenOpts): MojiQuestion {
  switch (lineId) {
    case 'count-mora': return genCount(rng, opts);
    case 'first-mora': return genFirst(rng, opts);
    case 'last-mora': return genLast(rng, opts);
    case 'match-sound': return genMatch(rng, opts);
    case 'build-word': return genBuild(rng, opts);
    case 'rule-card': return genRule(rng, opts);
    case 'delete-mora': return genDelete(rng, opts);
    case 'reverse-word': return genReverse(rng, opts);
    case 'special-mora': return genSpecial(rng);
    case 'if-factory': return genFactory(rng);
    case 'middle-mora': return genMiddle(rng, opts);
    case 'rhyme-match': return genRhyme(rng, opts);
    case 'nth-mora': return genNth(rng, opts);
    case 'delete-medial': return genDeleteMedial(rng);
    case 'add-mora': return genAdd(rng, opts);
    case 'substitute-mora': return genSubstitute(rng, opts);
    case 'find-position': return genFindPosition(rng, opts);
    case 'swap-mora': return genSwap(rng, opts);
  }
}
