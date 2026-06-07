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
  const eqText = `${p.dividend} ÷ ${p.divisor}`;
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
      visual: { kind: 'equation', text: eqText },
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
    visual: { kind: 'equation', text: eqText },
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
  return {
    unitId: 'number-line',
    promptText: '🐸カエルは いくつの ところ？',
    visual: { kind: 'number-line', max, target, marker: '🐸' },
    choices: arr.map(String),
    answerIndex: arr.indexOf(target),
    explainSteps: [],
  };
}

/** みつもりめいじん: たくさんの ものを 見て「だいたい いくつ?」を 10の倍数から 当てる（見積もり・概数） */
export function estimateToBattle(rng: () => number = Math.random): BattleQuestion {
  const emoji = pickEmoji(rng);
  // 23〜78こ（正確に数えにくい量）。こたえは いちばん近い 10の倍数
  const count = 23 + Math.floor(rng() * 56);
  const nearestTen = Math.round(count / 10) * 10;
  // 選択肢は 10の倍数を 20間隔で（推定で「どっちに近い?」を問う）
  const set = new Set<number>([nearestTen]);
  let k = 1;
  while (set.size < 4 && k < 40) {
    const sign = set.size % 2 === 0 ? 1 : -1;
    const cand = nearestTen + sign * 20 * Math.ceil(k / 2);
    if (cand >= 10 && cand <= 100) set.add(cand);
    k++;
  }
  for (let d = 10; set.size < 4 && d <= 100; d += 10) {
    if (nearestTen + d <= 100) set.add(nearestTen + d);
    if (set.size < 4 && nearestTen - d >= 10) set.add(nearestTen - d);
  }
  const arr = [...set].sort(() => rng() - 0.5);
  return {
    unitId: 'estimate-pile',
    promptText: `${emoji} だいたい いくつ？`,
    visual: { kind: 'estimate-pile', emoji, count },
    choices: arr.map(String),
    answerIndex: arr.indexOf(nearestTen),
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
  'number-line': numberLineToBattle,
  'estimate-pile': estimateToBattle,
  'ten-frame-sum': tenFrameSumToBattle,
};

export function generateBattleQuestion(
  unitId: string,
  rng: () => number = Math.random,
): BattleQuestion {
  const fn = ADAPTERS[unitId];
  if (!fn) throw new Error(`adapter not found: ${unitId}`);
  return fn(rng);
}
