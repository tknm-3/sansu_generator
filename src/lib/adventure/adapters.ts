import type { BattleQuestion } from './types';
import { generateAddition, explainAddition } from '../math/addition';
import { generateSubtraction, explainSubtraction } from '../math/subtraction';
import { missingToTen, makeAnswerChoices, explainMakeTen } from '../math/makeTen';
import { generateCarryProblem, explainCherry } from '../math/cherryCalc';
import { generateBigAddition, explainBigAddition } from '../math/bigAddition';
import { generateWordProblem, type WordVariant, type WordVerdict } from '../math/wordProblem';
import { generateRotationProblem } from '../geometry/rotation';
import { generateComposeProblem } from '../geometry/compose';
import { generatePatternProblem, type PatternItem, type ColorKey, type ShapeType } from '../geometry/pattern';
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
  const p = generateBigAddition(rng);
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

const SHAPE_SYMBOL: Record<ShapeType, string> = {
  circle: '○', triangle: '△', square: '□', star: '★',
};
const COLOR_NAME: Record<ColorKey, string> = {
  red: 'あか', blue: 'あお', yellow: 'きいろ', green: 'みどり',
};

function patternItemToText(item: PatternItem, monochrome: boolean): string {
  return monochrome ? SHAPE_SYMBOL[item.shape] : `${COLOR_NAME[item.color]}${SHAPE_SYMBOL[item.shape]}`;
}

export function shapeComposeToBattle(_rng: () => number = Math.random): BattleQuestion {
  const p = generateComposeProblem(false);
  return {
    unitId: 'shape-compose',
    promptText: p.questionLabel,
    visual: { kind: 'word', text: p.questionLabel, emoji: '🧩' },
    choices: p.choices.map((c) => c.label),
    answerIndex: p.answerIndex,
    explainSteps: [],
  };
}

export function shapePatternToBattle(_rng: () => number = Math.random): BattleQuestion {
  const p = generatePatternProblem(false);
  const items = p.sequence.filter((x): x is PatternItem => x !== null);
  const colors = new Set(items.map((i) => i.color));
  const monochrome = colors.size === 1;
  const seqText = p.sequence
    .map((item) => (item === null ? '？' : patternItemToText(item, monochrome)))
    .join(' → ');
  return {
    unitId: 'shape-pattern',
    promptText: 'つぎに くる かたちは？',
    visual: { kind: 'word', text: seqText, emoji: '🔁' },
    choices: p.choices.map((c) => patternItemToText(c, monochrome)),
    answerIndex: p.answerIndex,
    explainSteps: [],
  };
}

export function shapeSpatialToBattle(_rng: () => number = Math.random): BattleQuestion {
  const p = generateSpatialProblem(false);
  const scene = p.objects.map((o) => `${o.emoji}${o.name}`).join('  ');
  return {
    unitId: 'shape-spatial',
    promptText: p.question,
    visual: { kind: 'word', text: `${scene}\n${p.question}`, emoji: '📐' },
    choices: p.choices,
    answerIndex: p.answerIndex,
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
  'word-addition': (rng) => wordToBattle('word-addition', rng),
  'word-subtraction': (rng) => wordToBattle('word-subtraction', rng),
  'shape-rotation': shapeRotationToBattle,
  'shape-compose': shapeComposeToBattle,
  'shape-pattern': shapePatternToBattle,
  'shape-spatial': shapeSpatialToBattle,
};

export function generateBattleQuestion(
  unitId: string,
  rng: () => number = Math.random,
): BattleQuestion {
  const fn = ADAPTERS[unitId];
  if (!fn) throw new Error(`adapter not found: ${unitId}`);
  return fn(rng);
}
