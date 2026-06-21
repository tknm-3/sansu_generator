import type { BattleQuestion } from './types';
import { generateAddition, explainAddition } from '../math/addition';
import { generateSubtraction, explainSubtraction } from '../math/subtraction';
import { missingToTen, makeAnswerChoices, explainMakeTen } from '../math/makeTen';
import { generateCarryProblem, explainCherry } from '../math/cherryCalc';
import { generateBigAddition, explainBigAddition } from '../math/bigAddition';
import { generateBigSubtraction, explainBigSubtraction } from '../math/bigSubtraction';
import { generateMultiplication, explainMultiplication } from '../math/multiplication';
import { generateDivision, explainDivision } from '../math/division';
import { generateWordProblem, type WordVariant, type WordVerdict } from '../math/wordProblem';
import { generateRotationProblem, generateMirrorProblem } from '../geometry/rotation';
import { generateComposeProblem } from '../geometry/compose';
import { generatePatternProblem } from '../geometry/pattern';
import { generateSpatialProblem } from '../geometry/spatial';
import {
  generateTangramCompose,
  generateTangramMissing,
  generateTangramDecompose,
  generateTangramAdvanced,
} from '../geometry/tangram';

/** 3択の数値配列に4つ目のダミー選択肢を追加してシャッフル。answerIndex を返す */
function toFourChoices(
  choices3: number[],
  answer: number,
  rng: () => number,
): { choices: string[]; answerIndex: number } {
  const used = new Set(choices3);
  let extra = Math.max(0, answer + Math.floor(rng() * 7) - 3);
  for (let i = 0; i < 20 && used.has(extra); i++) extra = Math.max(0, extra + 1);
  const all4 = [...choices3, extra].sort(() => rng() - 0.5);
  return { choices: all4.map(String), answerIndex: all4.indexOf(answer) };
}

export function makeTenToBattle(rng: () => number = Math.random): BattleQuestion {
  const current = Math.floor(rng() * 9) + 1;
  const answer = missingToTen(current);
  const choices3 = makeAnswerChoices(current, rng);
  const { choices, answerIndex } = toFourChoices(choices3, answer, rng);
  return {
    unitId: 'make-ten',
    promptText: 'あと なんこで 10に なる？',
    visual: { kind: 'objects', emoji: '🟡', count: current },
    choices,
    answerIndex,
    explainSteps: explainMakeTen(current, '🟡'),
  };
}

export function additionToBattle(rng: () => number = Math.random): BattleQuestion {
  const p = generateAddition(rng);
  const answer = p.a + p.b;
  const { choices, answerIndex } = toFourChoices(p.choices, answer, rng);
  return {
    unitId: 'addition',
    promptText: `${p.a} ＋ ${p.b} ＝ ？`,
    visual: { kind: 'equation', text: `${p.a} ＋ ${p.b}` },
    choices,
    answerIndex,
    explainSteps: explainAddition(p, '⭐'),
  };
}

export function subtractionToBattle(rng: () => number = Math.random): BattleQuestion {
  const p = generateSubtraction(rng);
  const answer = p.a - p.b;
  const { choices, answerIndex } = toFourChoices(p.choices, answer, rng);
  return {
    unitId: 'subtraction',
    promptText: `${p.a} ー ${p.b} ＝ ？`,
    visual: { kind: 'equation', text: `${p.a} ー ${p.b}` },
    choices,
    answerIndex,
    explainSteps: explainSubtraction(p, '⭐'),
  };
}

export function cherryCalcToBattle(rng: () => number = Math.random): BattleQuestion {
  const p = generateCarryProblem(rng);
  const answer = p.a + p.b;
  const { choices, answerIndex } = toFourChoices(p.choices, answer, rng);
  return {
    unitId: 'cherry-calc',
    promptText: `${p.a} ＋ ${p.b} ＝ ？`,
    visual: { kind: 'equation', text: `${p.a} ＋ ${p.b}` },
    choices,
    answerIndex,
    explainSteps: explainCherry(p),
  };
}

export function bigAdditionToBattle(rng: () => number = Math.random): BattleQuestion {
  const p = generateBigAddition(rng, { mixed: true });
  const answer = p.a + p.b;
  const { choices, answerIndex } = toFourChoices(p.choices, answer, rng);
  return {
    unitId: 'big-addition',
    promptText: `${p.a} ＋ ${p.b} ＝ ？`,
    visual: { kind: 'equation', text: `${p.a} ＋ ${p.b}` },
    choices,
    answerIndex,
    explainSteps: explainBigAddition(p),
  };
}

const FOOD_EMOJI = ['🍎', '🍪', '🍓', '🌰', '🍇', '🐟'];
function pickEmoji(rng: () => number): string {
  return FOOD_EMOJI[Math.floor(rng() * FOOD_EMOJI.length)];
}

export function bigSubtractionToBattle(rng: () => number = Math.random): BattleQuestion {
  const p = generateBigSubtraction(rng, { subtrahendOnesOnly: true });
  const answer = p.a - p.b;
  const { choices, answerIndex } = toFourChoices(p.choices, answer, rng);
  return {
    unitId: 'big-subtraction',
    promptText: `${p.a} ー ${p.b} ＝ ？`,
    visual: { kind: 'equation', text: `${p.a} ー ${p.b}` },
    choices,
    answerIndex,
    explainSteps: explainBigSubtraction(p),
  };
}

export function multiplicationToBattle(rng: () => number = Math.random): BattleQuestion {
  // 5の段まで（2〜5 × 2〜5）に しぼって やさしくする
  const p = generateMultiplication(rng, { maxFactor: 5 });
  const answer = p.a * p.b;
  const emoji = pickEmoji(rng);
  const { choices, answerIndex } = toFourChoices(p.choices, answer, rng);
  return {
    unitId: 'multiplication',
    promptText: `${emoji} ${p.b}こずつ ${p.a}つ。ぜんぶで なんこ？`,
    // 「○こずつ の かたまりが △つ」を 目で見て かぞえられるように＋これが ○×△ だと わかるように
    visual: { kind: 'groups', emoji, perGroup: p.b, groups: p.a, equationText: `${p.b} × ${p.a}` },
    choices,
    answerIndex,
    explainSteps: explainMultiplication(p, emoji),
  };
}

const WORD_VERDICTS: WordVerdict[] = ['ぴったり', 'たりない', 'あまる'];

export function wordToBattle(
  variant: 'word-addition' | 'word-subtraction',
  rng: () => number = Math.random,
): BattleQuestion {
  const p = generateWordProblem(variant as WordVariant, rng);
  const choices = [...WORD_VERDICTS].sort(() => rng() - 0.5);
  return {
    unitId: variant,
    promptText: p.text,
    visual: { kind: 'word', text: p.text, emoji: p.emoji },
    choices,
    answerIndex: choices.indexOf(p.verdict),
    explainSteps: [],
  };
}

export function divisionToBattle(rng: () => number = Math.random): BattleQuestion {
  // 5の段まで（人数 2〜5・こたえ 2〜5）に しぼって やさしくする
  const p = generateDivision(rng, false, { maxDivisor: 5, maxQuotient: 5 }); // あまりなし
  const emoji = pickEmoji(rng);
  const { choices, answerIndex } = toFourChoices(p.choices, p.quotient, rng);
  return {
    unitId: 'division',
    promptText: `${emoji} ${p.dividend}こを ${p.divisor}人で わけると ひとり なんこ？`,
    // わける まえの 山（ぜんぶの かず）を 目で見せる＋これが ○÷△ だと わかるように
    visual: { kind: 'objects', emoji, count: p.dividend, equationText: `${p.dividend} ÷ ${p.divisor}` },
    choices,
    answerIndex,
    explainSteps: explainDivision(p, emoji),
  };
}

export function divisionRemainderToBattle(rng: () => number = Math.random): BattleQuestion {
  // あまりが かならず でる わりざん（しょうを きく / あまりを きく の どちらか）
  let p = generateDivision(rng, true);
  for (let i = 0; i < 20 && p.remainder === 0; i++) p = generateDivision(rng, true);
  const emoji = pickEmoji(rng);
  // わける まえの 山＋かご、こたえた あとは わけて「あまり」を 目で見せる
  const visual = {
    kind: 'divide' as const,
    emoji,
    dividend: p.dividend,
    divisor: p.divisor,
    quotient: p.quotient,
    remainder: p.remainder,
  };
  if (rng() < 0.5) {
    // 「なんこ あまる？」… 0..divisor-1 を ちゅうしんに 4択
    const set = new Set<number>([p.remainder]);
    for (let v = 0; v < p.divisor && set.size < 4; v++) set.add(v);
    let extra = p.divisor;
    while (set.size < 4) set.add(extra++);
    const arr = [...set].sort(() => rng() - 0.5);
    return {
      unitId: 'division-remainder',
      promptText: `${emoji} ${p.dividend}こを ${p.divisor}人で わけると なんこ あまる？`,
      visual,
      choices: arr.map(String),
      answerIndex: arr.indexOf(p.remainder),
      explainSteps: [],
    };
  }
  // 「ひとり なんこ？」… しょうを きく（あまりは のこる）
  const { choices, answerIndex } = toFourChoices(p.choices, p.quotient, rng);
  return {
    unitId: 'division-remainder',
    promptText: `${emoji} ${p.dividend}こを ${p.divisor}人で わけると ひとり なんこ？（あまりが でるよ）`,
    visual,
    choices,
    answerIndex,
    explainSteps: [],
  };
}

export function shapeComposeToBattle(_rng: () => number = Math.random): BattleQuestion {
  const p = generateComposeProblem(false);
  return {
    unitId: 'shape-compose',
    promptText: p.questionLabel,
    visual: { kind: 'shape-compose', questionSvg: p.questionSvg, choiceSvgs: p.choices.map((c) => c.svg) },
    choices: p.choices.map((c) => c.label),
    answerIndex: p.answerIndex,
    explainSteps: [],
  };
}

export function shapePatternToBattle(_rng: () => number = Math.random): BattleQuestion {
  const p = generatePatternProblem(false);
  return {
    unitId: 'shape-pattern',
    promptText: 'つぎに くる かたちは？',
    visual: { kind: 'shape-pattern', sequence: p.sequence, choiceItems: p.choices },
    choices: p.choices.map((_, i) => `かたち${i + 1}`),
    answerIndex: p.answerIndex,
    explainSteps: [],
  };
}

export function shapeSpatialToBattle(_rng: () => number = Math.random): BattleQuestion {
  const p = generateSpatialProblem(false);
  return {
    unitId: 'shape-spatial',
    promptText: p.question,
    visual: { kind: 'shape-spatial', objects: p.objects },
    choices: p.choices,
    answerIndex: p.answerIndex,
    explainSteps: [],
  };
}

// ── スーパーマーケットの くに（タングラム）──
// すべて shape-compose ビジュアル（questionSvg＋choiceSvgs）に乗せて 図形で見せる。

/** タングラム・くみあわせ: ピースを あわせると どの しなものが できる？ */
export function tangramComposeToBattle(rng: () => number = Math.random): BattleQuestion {
  const p = generateTangramCompose(rng);
  return {
    unitId: 'tangram-compose',
    promptText: p.questionLabel,
    visual: { kind: 'shape-compose', questionSvg: p.questionSvg, choiceSvgs: p.choices.map((c) => c.svg) },
    choices: p.choices.map((c) => c.label),
    answerIndex: p.answerIndex,
    explainSteps: [],
  };
}

/** タングラム・たりないピース: あなに ぴったり あう ピースは どれ？ */
export function tangramMissingToBattle(rng: () => number = Math.random): BattleQuestion {
  const p = generateTangramMissing(rng);
  return {
    unitId: 'tangram-missing',
    promptText: p.questionLabel,
    visual: { kind: 'shape-compose', questionSvg: p.questionSvg, choiceSvgs: p.choices.map((c) => c.svg) },
    choices: p.choices.map((c) => c.label),
    answerIndex: p.answerIndex,
    explainSteps: [],
  };
}

/** タングラム・ぶんかい: この しなものは どの ピースで できてる？ */
export function tangramDecomposeToBattle(rng: () => number = Math.random): BattleQuestion {
  const p = generateTangramDecompose(rng);
  return {
    unitId: 'tangram-decompose',
    promptText: p.questionLabel,
    visual: { kind: 'shape-compose', questionSvg: p.questionSvg, choiceSvgs: p.choices.map((c) => c.svg) },
    choices: p.choices.map((c) => c.label),
    answerIndex: p.answerIndex,
    explainSteps: [],
  };
}

/** 数直線わたり: カエルが立つ位置を見て「いくつ?」を当てる（線形数感覚・推定） */
export function numberLineToBattle(rng: () => number = Math.random): BattleQuestion {
  // できる子向け: 0〜100 を中心に、20・50 も混ぜてレンジに変化を出す
  const max = [20, 50, 100, 100][Math.floor(rng() * 4)];
  // 端ちょうど・目盛りちょうどは避けて「推定」を促す
  const lo = Math.round(max * 0.08);
  const hi = Math.round(max * 0.92);
  let target = lo + Math.floor(rng() * (hi - lo + 1));
  // 0/まんなか/max ぴったりは避ける
  for (let i = 0; i < 10 && (target % 10 === 0 || target === max / 2); i++) {
    target = lo + Math.floor(rng() * (hi - lo + 1));
  }
  // 選択肢は「target から gap の倍数だけ離れた値」を 近い順に3つ＝位置で 必ず見分けられる距離に
  const gap = max <= 20 ? 2 : max <= 50 ? 5 : 10;
  const pool = new Set<number>();
  for (let i = 1; i <= Math.ceil(max / gap); i++) {
    if (target - i * gap >= 0) pool.add(target - i * gap);
    if (target + i * gap <= max) pool.add(target + i * gap);
  }
  const others = [...pool]
    .sort((a, b) => Math.abs(a - target) - Math.abs(b - target))
    .slice(0, 3);
  const arr = [target, ...others].sort(() => rng() - 0.5);
  // はんぶんは「配置式」: 数を 自分で 線の上に おく（推定力を 直接きたえる / Siegler）
  const placement = rng() < 0.5;
  return {
    unitId: 'number-line',
    promptText: placement
      ? `🐸カエルを ${target}の ところに おいてね`
      : '🐸カエルは いくつの ところ？',
    visual: { kind: 'number-line', max, target, marker: '🐸', placement },
    choices: arr.map(String),
    answerIndex: arr.indexOf(target),
    explainSteps: [],
  };
}

/** かぞえる もり: 10こずつの かたまりを 見て「ぜんぶで なんこ?」を 正確に 当てる（10ずつ数える・位取り） */
export function estimateToBattle(rng: () => number = Math.random): BattleQuestion {
  const emoji = pickEmoji(rng);
  // 23〜78こ。10ずつの かたまり＋あまり を かぞえる
  const count = 23 + Math.floor(rng() * 56);
  const rem = count % 10;
  const tensOnly = count - rem; // あまりを 忘れた こたえ（ひっかけ）
  // 距離の近い ひっかけから 4択に: かたまり数ちがい(±10)・あまり関係・1ちがい
  const candidates = [
    count - 10, count + 10,
    ...(rem !== 0 ? [tensOnly, tensOnly + 10] : [count - 5, count + 5]),
    count - 1, count + 1, count - 2, count + 2,
  ];
  const set = new Set<number>([count]);
  for (const c of candidates) {
    if (set.size >= 4) break;
    if (c >= 1 && c <= 99 && !set.has(c)) set.add(c);
  }
  const arr = [...set].sort(() => rng() - 0.5);
  return {
    unitId: 'estimate-pile',
    promptText: `${emoji} ぜんぶで なんこ？`,
    visual: { kind: 'estimate-pile', emoji, count },
    choices: arr.map(String),
    answerIndex: arr.indexOf(count),
    explainSteps: [],
  };
}

/** パッとそろばん: 10の枠で a＋b を 色ちがいの かたまりで 見せ、合計を 素早く 答える（概念的サビタイジング・暗算の自動化） */
export function tenFrameSumToBattle(rng: () => number = Math.random): BattleQuestion {
  const a = 2 + Math.floor(rng() * 8); // 2..9
  const b = 2 + Math.floor(rng() * 8); // 2..9
  const answer = a + b; // 4..18（くりあがりも 出る）
  // 合計の 近くで 重複なし 4択
  const set = new Set<number>([answer]);
  let k = 1;
  while (set.size < 4 && k < 30) {
    const sign = set.size % 2 === 0 ? 1 : -1;
    const cand = answer + sign * Math.ceil(k / 2);
    if (cand >= 0) set.add(cand);
    k++;
  }
  const arr = [...set].sort(() => rng() - 0.5);
  return {
    unitId: 'ten-frame-sum',
    promptText: '⚡ パッと いくつ？',
    visual: { kind: 'ten-frame-sum', a, b, emojiA: '🔴', emojiB: '🟡' },
    choices: arr.map(String),
    answerIndex: arr.indexOf(answer),
    explainSteps: [],
  };
}

/** パッとひきざん: 10の枠に total こ ならべ、b こ「とった（✕）」のを 見せて のこりを 答える（ひき算のサビタイジング） */
export function tenFrameSubToBattle(rng: () => number = Math.random): BattleQuestion {
  const total = 4 + Math.floor(rng() * 7); // 4..10
  const take = 1 + Math.floor(rng() * (total - 2)); // 1..total-2（のこりが 2いじょう）
  const rest = total - take; // のこり = こたえ
  // のこりの 近くで 重複なし 4択（0..total）
  const set = new Set<number>([rest]);
  let k = 1;
  while (set.size < 4 && k < 30) {
    const sign = set.size % 2 === 0 ? 1 : -1;
    const cand = rest + sign * Math.ceil(k / 2);
    if (cand >= 0 && cand <= total) set.add(cand);
    k++;
  }
  const arr = [...set].sort(() => rng() - 0.5);
  return {
    unitId: 'ten-frame-sub',
    promptText: `⚡ ${take}こ とったら のこりは？`,
    // a=のこり（そのまま）, b=とった分（✕で うすく）
    visual: { kind: 'ten-frame-sum', a: rest, b: take, emojiA: '🟢', emojiB: '🔴', taken: true },
    choices: arr.map(String),
    answerIndex: arr.indexOf(rest),
    explainSteps: [],
  };
}

/** 10のおともだち: 10の枠に aこ あるのを 見せて「あと いくつで 10？」を 答える（10の補数・くりあがりの素地） */
export function tenFrameComplementToBattle(rng: () => number = Math.random): BattleQuestion {
  const a = 1 + Math.floor(rng() * 9); // 1..9
  const need = 10 - a; // こたえ = あと いくつで 10
  // need の 近くで 重複なし 4択（0..10）
  const set = new Set<number>([need]);
  let k = 1;
  while (set.size < 4 && k < 30) {
    const sign = set.size % 2 === 0 ? 1 : -1;
    const cand = need + sign * Math.ceil(k / 2);
    if (cand >= 0 && cand <= 10) set.add(cand);
    k++;
  }
  const arr = [...set].sort(() => rng() - 0.5);
  return {
    unitId: 'ten-frame-complement',
    promptText: '⚡ あと いくつで 10？',
    // a こ だけ ぬる、のこりは 空（点線）。b=0
    visual: { kind: 'ten-frame-sum', a, b: 0, emojiA: '🔵', emojiB: '🟡' },
    choices: arr.map(String),
    answerIndex: arr.indexOf(need),
    explainSteps: [],
  };
}

/** こたえの 近くで 重複なし 4択（0いじょう）を つくる */
function nearFourChoices(answer: number, rng: () => number, steps: number[]): { choices: string[]; answerIndex: number } {
  const set = new Set<number>([answer]);
  for (const d of steps) {
    if (set.size >= 4) break;
    if (answer + d >= 0 && !set.has(answer + d)) set.add(answer + d);
  }
  let pad = 1;
  while (set.size < 4) {
    const cand = answer + pad;
    if (cand >= 0 && !set.has(cand)) set.add(cand);
    pad++;
  }
  const arr = [...set].sort(() => rng() - 0.5);
  return { choices: arr.map(String), answerIndex: arr.indexOf(answer) };
}

/** 20までの10の枠: 10の かたまり（色1）＋のこり（色2）を 見せて「ぜんぶで いくつ?」（10といくつ・位取りの素地） */
export function tenFrameTeenToBattle(rng: () => number = Math.random): BattleQuestion {
  const b = 1 + Math.floor(rng() * 10); // 1..10
  const answer = 10 + b; // 11..20
  const { choices, answerIndex } = nearFourChoices(answer, rng, [-1, 1, -2, 2, -10, 10]);
  return {
    unitId: 'ten-frame-teen',
    promptText: '⚡ 10と いくつ？ ぜんぶで パッと いくつ？',
    visual: { kind: 'ten-frame-sum', a: 10, b, emojiA: '🟦', emojiB: '🟧' },
    choices,
    answerIndex,
    explainSteps: [],
  };
}

/** ねだん パッと: こうかを しゅるいごとに 見せて「ぜんぶで なんえん?」（位取り・暗算の自動化） */
export function coinsToBattle(rng: () => number = Math.random): BattleQuestion {
  // ベース（10いじょうの こうか）を 1しゅるい＋おまけ 1〜2しゅるい
  const base = [10, 50, 100][Math.floor(rng() * 3)];
  const baseCount = base === 100 ? 1 + Math.floor(rng() * 2) : 1 + Math.floor(rng() * 4);
  const coins: { value: number; count: number }[] = [{ value: base, count: baseCount }];
  const extras = [50, 10, 5, 1].filter((v) => v !== base);
  const extraKinds = Math.floor(rng() * 3); // 0..2しゅるい
  for (let i = 0; i < extraKinds && extras.length; i++) {
    const v = extras.splice(Math.floor(rng() * extras.length), 1)[0];
    coins.push({ value: v, count: 1 + Math.floor(rng() * 3) });
  }
  // おおきい じゅんに ならべる
  coins.sort((a, b) => b.value - a.value);
  const total = coins.reduce((s, c) => s + c.value * c.count, 0);
  const { choices, answerIndex } = nearFourChoices(total, rng, [-10, 10, -5, 5, -1, 1, -20, 20]);
  return {
    unitId: 'coins',
    promptText: '💰 ぜんぶで なんえん？',
    visual: { kind: 'coins', coins },
    choices,
    answerIndex,
    explainSteps: [],
  };
}

/** パッと かけ算: ×2・×5 を ちゅうしんに かたまりで 見せて 素早く こたえる（やさしい段の自動化） */
export function mulFlashToBattle(rng: () => number = Math.random): BattleQuestion {
  const groups = [2, 5][Math.floor(rng() * 2)]; // 2か5の だん
  const perGroup = 2 + Math.floor(rng() * 4); // 2..5
  const answer = perGroup * groups;
  const emoji = pickEmoji(rng);
  const { choices, answerIndex } = nearFourChoices(answer, rng, [groups, -groups, perGroup, -perGroup, 1, -1]);
  return {
    unitId: 'mul-flash',
    promptText: `${emoji} ${perGroup}こずつ ${groups}つ。パッと なんこ？`,
    visual: { kind: 'groups', emoji, perGroup, groups, equationText: `${perGroup} × ${groups}` },
    choices,
    answerIndex,
    explainSteps: [],
  };
}

/** かがみ（線対称）: お題を「うらがえし」、まわしただけの ダミーと みわける（線対称 vs 回転） */
export function shapeMirrorToBattle(_rng: () => number = Math.random): BattleQuestion {
  const p = generateMirrorProblem(false);
  return {
    unitId: 'shape-mirror',
    promptText: '🪞 かがみに うつすと どれ？',
    visual: { kind: 'shape-rotation', shapeId: p.shapeId, rotationLabel: p.rotationLabel },
    choices: p.choices.map((_, i) => `かたち${i + 1}`),
    answerIndex: p.answerIndex,
    explainSteps: [],
    choiceTransforms: p.choices,
  };
}

/** タングラム・つづき（おうよう）: 3〜4まいの ピースで もっと むずかしい かたちを つくる */
export function tangramAdvancedToBattle(rng: () => number = Math.random): BattleQuestion {
  const p = generateTangramAdvanced(rng);
  return {
    unitId: 'tangram-advanced',
    promptText: p.questionLabel,
    visual: { kind: 'shape-compose', questionSvg: p.questionSvg, choiceSvgs: p.choices.map((c) => c.svg) },
    choices: p.choices.map((c) => c.label),
    answerIndex: p.answerIndex,
    explainSteps: [],
  };
}

const SIZE_COLORS = [
  { label: 'あか', color: '#ef4444' },
  { label: 'あお', color: '#3b82f6' },
  { label: 'きいろ', color: '#eab308' },
  { label: 'みどり', color: '#22c55e' },
  { label: 'むらさき', color: '#a855f7' },
];
const SIZE_FRACTIONS = [0.5, 0.65, 0.8, 1.0];

/** おおきさくらべ: おおきさ／ながさの ちがう ものを 見て いちばんを えらぶ（大小・長短の比較） */
export function sizeCompareToBattle(rng: () => number = Math.random): BattleQuestion {
  const mode = (['big', 'small', 'long', 'short'] as const)[Math.floor(rng() * 4)];
  const colors = [...SIZE_COLORS].sort(() => rng() - 0.5).slice(0, 4);
  const fractions = [...SIZE_FRACTIONS].sort(() => rng() - 0.5);
  const items = colors.map((c, i) => ({ label: c.label, color: c.color, size: fractions[i] }));
  const wantMax = mode === 'big' || mode === 'long';
  let winner = 0;
  for (let i = 1; i < items.length; i++) {
    if (wantMax ? items[i].size > items[winner].size : items[i].size < items[winner].size) winner = i;
  }
  const promptByMode: Record<typeof mode, string> = {
    big: '📏 いちばん おおきいのは どれ？',
    small: '📏 いちばん ちいさいのは どれ？',
    long: '📏 いちばん ながいのは どれ？',
    short: '📏 いちばん みじかいのは どれ？',
  };
  return {
    unitId: 'size-compare',
    promptText: promptByMode[mode],
    visual: { kind: 'size-compare', mode, items },
    choices: items.map((it) => it.label),
    answerIndex: winner,
    explainSteps: [],
  };
}

// ── まとめて／わけて かぞえる くに（としょかんモードの 初歩 かけ算・わり算）──
// すべて groups ビジュアル（かたまりを わくで囲って 並べる）で、
// 「全部で なんこ」か「なん人(いくつ)で わけた」を 目で見て あてる。
// flash:true は ぱっとみ（一瞬だけ 見せて かくす）。

/** ちいさい かず（くみ／人数）の 4択を つくる。answer を ふくみ 重複なし */
function smallCountChoices(
  answer: number,
  rng: () => number,
  lo: number,
  hi: number,
): { choices: string[]; answerIndex: number } {
  const set = new Set<number>([answer]);
  let k = 1;
  while (set.size < 4 && k < 40) {
    const sign = set.size % 2 === 0 ? 1 : -1;
    const cand = answer + sign * Math.ceil(k / 2);
    if (cand >= lo && cand <= hi) set.add(cand);
    k++;
  }
  for (let v = lo; v <= hi && set.size < 4; v++) set.add(v);
  const arr = [...set].sort(() => rng() - 0.5);
  return { choices: arr.map(String), answerIndex: arr.indexOf(answer) };
}

type CountAsk = 'total' | 'groups' | 'perGroup';
type CountNums = { perGroup: number; groups: number; total: number; emoji: string };

/** groups ビジュアルを 見て「全部で なんこ」/「いくつ(なん人)で わけた」/「ひとり なんこ」を あてる 共通ロジック */
function lookCountToBattle(opts: {
  unitId: string;
  ask: CountAsk;
  prompt: (n: CountNums) => string;
  rng: () => number;
  groupLabel?: string;
  flash?: boolean;
  maxPer?: number;
  maxGroups?: number;
  /** 絵の下に そえる しき（例「2＋2＋2」「3 × 4」）。かけ算の 導入で つかう */
  equationText?: (n: CountNums) => string;
}): BattleQuestion {
  const { rng, ask } = opts;
  const maxPer = opts.maxPer ?? 5;
  const maxGroups = opts.maxGroups ?? 5;
  const perGroup = 2 + Math.floor(rng() * (maxPer - 1)); // 2..maxPer
  const groups = 2 + Math.floor(rng() * (maxGroups - 1)); // 2..maxGroups
  const total = perGroup * groups;
  const emoji = pickEmoji(rng);
  const nums: CountNums = { perGroup, groups, total, emoji };
  const answer = ask === 'total' ? total : ask === 'groups' ? groups : perGroup;
  const { choices, answerIndex } =
    ask === 'total'
      ? nearFourChoices(answer, rng, [perGroup, -perGroup, groups, -groups, 1, -1, 2, -2])
      : smallCountChoices(answer, rng, 1, Math.max(maxPer, maxGroups) + 1);
  return {
    unitId: opts.unitId,
    promptText: opts.prompt(nums),
    visual: {
      kind: 'groups',
      emoji,
      perGroup,
      groups,
      groupLabel: opts.groupLabel,
      flash: opts.flash,
      equationText: opts.equationText?.(nums),
    },
    choices,
    answerIndex,
    explainSteps: [],
  };
}

// ── かけ算（まとめて かぞえる）──

/** はこの なかみ: ○こずつ △つの かたまりを 見て「ぜんぶで なんこ?」 */
export function mulLookTotalToBattle(rng: () => number = Math.random): BattleQuestion {
  return lookCountToBattle({
    unitId: 'mul-look-total',
    ask: 'total',
    rng,
    prompt: ({ perGroup, groups, emoji }) => `${emoji} ${perGroup}こずつ ${groups}つ。ぜんぶで なんこ？`,
  });
}

/** いくつの かたまり?: おなじ かずの かたまりを 見て「かたまりは いくつ?」（わける数を 読む） */
export function mulCountGroupsToBattle(rng: () => number = Math.random): BattleQuestion {
  return lookCountToBattle({
    unitId: 'mul-count-groups',
    ask: 'groups',
    rng,
    prompt: ({ perGroup, emoji }) => `${emoji} ${perGroup}こずつの かたまり。かたまりは いくつ？`,
  });
}

/** パッと まとめて: かたまりを 一瞬だけ 見せて「ぜんぶで なんこ?」（サビタイジング） */
export function mulFlashTotalToBattle(rng: () => number = Math.random): BattleQuestion {
  return lookCountToBattle({
    unitId: 'mul-flash-total',
    ask: 'total',
    flash: true,
    rng,
    maxPer: 4,
    maxGroups: 4,
    prompt: ({ emoji }) => `⚡ パッと見て！ ${emoji} ぜんぶで なんこ？`,
  });
}

// ── わり算（わけて かぞえる）──

/** おさらに わけて: おさらに おなじ かずずつ くばった ようすを 見て「ぜんぶで なんこ?」 */
export function divLookTotalToBattle(rng: () => number = Math.random): BattleQuestion {
  return lookCountToBattle({
    unitId: 'div-look-total',
    ask: 'total',
    groupLabel: '🍽️',
    rng,
    prompt: ({ groups, emoji }) => `${emoji} ${groups}まいの おさらに わけたよ。ぜんぶで なんこ？`,
  });
}

/** なん人で わけた?: おなじ かずずつ くばった ようすを 見て「なん人で わけた?」（わる数を 読む） */
export function divCountPeopleToBattle(rng: () => number = Math.random): BattleQuestion {
  return lookCountToBattle({
    unitId: 'div-count-people',
    ask: 'groups',
    groupLabel: '🙂',
    rng,
    prompt: ({ emoji }) => `${emoji} おなじ かずずつ わけたよ。なん人で わけた？`,
  });
}

/** パッと わけわけ: くばった ようすを 一瞬だけ 見せて「ぜんぶで なんこ?」（サビタイジング） */
export function divFlashTotalToBattle(rng: () => number = Math.random): BattleQuestion {
  return lookCountToBattle({
    unitId: 'div-flash-total',
    ask: 'total',
    groupLabel: '🍽️',
    flash: true,
    rng,
    maxPer: 4,
    maxGroups: 4,
    prompt: ({ emoji }) => `⚡ パッと見て！ ${emoji} ぜんぶで なんこ？`,
  });
}

// ── かけ算 もっと（としょかんモード 追加ゾーン）──

/** たして かぞえる: ○こずつ △つを「2＋2＋2」の たしざんで まとめて（同数累加→かけ算の はしわたし） */
export function mulRepeatedToBattle(rng: () => number = Math.random): BattleQuestion {
  return lookCountToBattle({
    unitId: 'mul-repeated',
    ask: 'total',
    rng,
    maxPer: 5,
    maxGroups: 4,
    prompt: ({ perGroup, groups, emoji }) => `${emoji} ${perGroup}こずつ ${groups}つ。ぜんぶ たすと なんこ？`,
    equationText: ({ perGroup, groups }) => Array(groups).fill(perGroup).join(' ＋ '),
  });
}

/** ならんだ タイル: たて△・よこ○の アレイを 見て「ぜんぶで なんこ?」（かけ算の ならびの 見かた） */
export function mulArrayToBattle(rng: () => number = Math.random): BattleQuestion {
  return lookCountToBattle({
    unitId: 'mul-array',
    ask: 'total',
    rng,
    prompt: ({ perGroup, groups, emoji }) =>
      `${emoji} たてに ${groups}、よこに ${perGroup} ならんでる。ぜんぶで なんこ？`,
    equationText: ({ perGroup, groups }) => `${perGroup} × ${groups}`,
  });
}

/** ○ばいの まほう: もとの かずの △ばいを 見て「ぜんぶで なんこ?」（〜ばい＝かけ算） */
export function mulDoubleToBattle(rng: () => number = Math.random): BattleQuestion {
  return lookCountToBattle({
    unitId: 'mul-double',
    ask: 'total',
    rng,
    prompt: ({ perGroup, groups, emoji }) => `${emoji} ${perGroup}この ${groups}ばい。ぜんぶで なんこ？`,
    equationText: ({ perGroup, groups }) => `${perGroup} × ${groups}`,
  });
}

// ── わり算 もっと（としょかんモード 追加ゾーン）──

/** ○こずつ ふくろづめ: ぜんぶを ○こずつ ふくろに 入れると「なんふくろ?」（包含除＝いくつ分） */
export function divPackToBattle(rng: () => number = Math.random): BattleQuestion {
  return lookCountToBattle({
    unitId: 'div-pack',
    ask: 'groups',
    groupLabel: '🛍️',
    rng,
    prompt: ({ perGroup, total, emoji }) =>
      `${emoji} ${total}こを ${perGroup}こずつ ふくろに。なんふくろ できる？`,
  });
}

/** なかよく わけっこ: ぜんぶを △人で おなじ かずずつ。「ひとり なんこ?」（等分除＝1つ分） */
export function divFairToBattle(rng: () => number = Math.random): BattleQuestion {
  return lookCountToBattle({
    unitId: 'div-fair',
    ask: 'perGroup',
    groupLabel: '🙂',
    rng,
    prompt: ({ groups, total, emoji }) => `${emoji} ${total}こを ${groups}人で わけっこ。ひとり なんこ？`,
  });
}

// ── 2けたの たしざん もっと（としょかんモード 追加ゾーン）──

function bigAdditionWith(
  unitId: string,
  opts: { oneDigitB?: boolean; carry?: boolean },
  rng: () => number,
): BattleQuestion {
  const p = generateBigAddition(rng, opts);
  const answer = p.a + p.b;
  const { choices, answerIndex } = toFourChoices(p.choices, answer, rng);
  return {
    unitId,
    promptText: `${p.a} ＋ ${p.b} ＝ ？`,
    visual: { kind: 'equation', text: `${p.a} ＋ ${p.b}` },
    choices,
    answerIndex,
    explainSteps: explainBigAddition(p),
  };
}

/** 2けた＋1けた（くりあがり なし）: いちばん やさしい 2けたの たしざん */
export function bigAdd1ToBattle(rng: () => number = Math.random): BattleQuestion {
  return bigAdditionWith('big-add-1', { oneDigitB: true, carry: false }, rng);
}

/** 2けた＋2けた（くりあがり なし）: くらいごとに たすと とける */
export function bigAddNoCarryToBattle(rng: () => number = Math.random): BattleQuestion {
  return bigAdditionWith('big-add-nc', { carry: false }, rng);
}

/** 2けた＋2けた（くりあがり あり）: いちの くらいが 10を こえる すこし むずかしい たしざん */
export function bigAddCarryToBattle(rng: () => number = Math.random): BattleQuestion {
  return bigAdditionWith('big-add-carry', { carry: true }, rng);
}

type AdapterFn = (rng: () => number) => BattleQuestion;

export function shapeRotationToBattle(_rng: () => number = Math.random): BattleQuestion {
  const p = generateRotationProblem(false);
  return {
    unitId: 'shape-rotation',
    promptText: p.transform.flipX ? 'うらがえしたら どのかたち？' : 'まわしたら どのかたち？',
    visual: { kind: 'shape-rotation', shapeId: p.shapeId, rotationLabel: p.rotationLabel },
    choices: p.choices.map((_, i) => `かたち${i + 1}`),
    answerIndex: p.answerIndex,
    explainSteps: [],
    choiceTransforms: p.choices,
  };
}

const ADAPTERS: Record<string, AdapterFn> = {
  'make-ten': makeTenToBattle,
  'addition': additionToBattle,
  'subtraction': subtractionToBattle,
  'cherry-calc': cherryCalcToBattle,
  'big-addition': bigAdditionToBattle,
  'big-subtraction': bigSubtractionToBattle,
  'multiplication': multiplicationToBattle,
  'division': divisionToBattle,
  'division-remainder': divisionRemainderToBattle,
  'word-addition': (rng) => wordToBattle('word-addition', rng),
  'word-subtraction': (rng) => wordToBattle('word-subtraction', rng),
  'shape-rotation': shapeRotationToBattle,
  'shape-compose': shapeComposeToBattle,
  'shape-pattern': shapePatternToBattle,
  'shape-spatial': shapeSpatialToBattle,
  'tangram-compose': tangramComposeToBattle,
  'tangram-missing': tangramMissingToBattle,
  'tangram-decompose': tangramDecomposeToBattle,
  'number-line': numberLineToBattle,
  'estimate-pile': estimateToBattle,
  'ten-frame-sum': tenFrameSumToBattle,
  'ten-frame-sub': tenFrameSubToBattle,
  'ten-frame-complement': tenFrameComplementToBattle,
  'ten-frame-teen': tenFrameTeenToBattle,
  'coins': coinsToBattle,
  'mul-flash': mulFlashToBattle,
  'shape-mirror': shapeMirrorToBattle,
  'tangram-advanced': tangramAdvancedToBattle,
  'size-compare': sizeCompareToBattle,
  'mul-look-total': mulLookTotalToBattle,
  'mul-count-groups': mulCountGroupsToBattle,
  'mul-flash-total': mulFlashTotalToBattle,
  'div-look-total': divLookTotalToBattle,
  'div-count-people': divCountPeopleToBattle,
  'div-flash-total': divFlashTotalToBattle,
  'mul-repeated': mulRepeatedToBattle,
  'mul-array': mulArrayToBattle,
  'mul-double': mulDoubleToBattle,
  'div-pack': divPackToBattle,
  'div-fair': divFairToBattle,
  'big-add-1': bigAdd1ToBattle,
  'big-add-nc': bigAddNoCarryToBattle,
  'big-add-carry': bigAddCarryToBattle,
};

export function generateBattleQuestion(
  unitId: string,
  rng: () => number = Math.random,
): BattleQuestion {
  const fn = ADAPTERS[unitId];
  if (!fn) throw new Error(`adapter not found: ${unitId}`);
  return fn(rng);
}
