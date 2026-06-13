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
import { generateRotationProblem } from '../geometry/rotation';
import { generateComposeProblem } from '../geometry/compose';
import { generatePatternProblem } from '../geometry/pattern';
import { generateSpatialProblem } from '../geometry/spatial';
import {
  generateTangramCompose,
  generateTangramMissing,
  generateTangramDecompose,
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
};

export function generateBattleQuestion(
  unitId: string,
  rng: () => number = Math.random,
): BattleQuestion {
  const fn = ADAPTERS[unitId];
  if (!fn) throw new Error(`adapter not found: ${unitId}`);
  return fn(rng);
}
