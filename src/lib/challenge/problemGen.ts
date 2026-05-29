import type { ExplainStep } from '../math/explain';
import { generateAddition, explainAddition } from '../math/addition';
import { generateSubtraction, explainSubtraction } from '../math/subtraction';
import { missingToTen, makeAnswerChoices, explainMakeTen } from '../math/makeTen';
import { generateCarryProblem, explainCherry } from '../math/cherryCalc';
import { generateBigAddition, explainBigAddition } from '../math/bigAddition';
import { generateBigSubtraction, explainBigSubtraction } from '../math/bigSubtraction';
import { generateMultiplication, explainMultiplication } from '../math/multiplication';
import { generateDivision, explainDivision } from '../math/division';

export const ALL_SKILL_IDS = [
  'make-ten',
  'addition',
  'subtraction',
  'cherry-calc',
  'big-addition',
  'big-subtraction',
  'multiplication',
  'division',
] as const;

export type SkillId = (typeof ALL_SKILL_IDS)[number];

export interface Problem {
  skillId: string;
  questionText: string;
  answer: number;
  choices: number[];
  emoji?: string;
  /** 間違えたときの「考え方ヒント」手順（quiz 入り）。 */
  explain?: ExplainStep[];
}

const FLAVOR_ANIMALS = ['🐱', '🐶', '🐸', '🐼', '🦊', '🐨', '🦁', '🐯'];
const FLAVOR_FOODS = ['🍎', '🍊', '🍇', '🍓', '🍌', '🍩', '🍪', '🍭'];

function rndFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const MAKE_TEN_TEMPLATES: ((current: number, food: string) => string)[] = [
  (n, f) => `${f}が ${n}こ。あと なんこで 10こ？`,
  (n, f) => `はこに ${f}が ${n}こ。10こ あつめたい！ あと なんこ？`,
  (n, f) => `${f}を ${n}こ もってる。10こ ほしい！ あと なんこ？`,
  (n, f) => `${f}が ${n}こ あるよ。ぜんぶで 10こに するには あと なんこ？`,
];

const ADDITION_TEMPLATES: ((a: number, b: number, animal: string) => string)[] = [
  (a, b, x) => `${x}が ${a}ひき。${b}ひき きたよ。ぜんぶで？`,
  (a, b, x) => `こうえんに ${x}が ${a}ひき いたよ。${b}ひき やってきた。あわせて なんびき？`,
  (a, b, x) => `${x}を ${a}ひき みつけた。また ${b}ひき みつけた！ぜんぶで？`,
  (a, b, x) => `きのう ${x}が ${a}ひき、きょう ${b}ひき きたよ。あわせて なんびき？`,
];

const SUBTRACTION_TEMPLATES: ((a: number, b: number, food: string) => string)[] = [
  (a, b, f) => `${f}が ${a}こ。${b}こ たべたら？`,
  (a, b, f) => `${f}が ${a}こ あったよ。${b}こ たべちゃった。のこりは？`,
  (a, b, f) => `はこに ${f}が ${a}こ。${b}こ とりだした。のこりは なんこ？`,
  (a, b, f) => `${f}を ${a}こ もってた。${b}こ あげたら のこりは？`,
];

const BIG_ADD_TEMPLATES: ((a: number, b: number) => string)[] = [
  (a, b) => `${a} ＋ ${b} ＝ ？`,
  (a, b) => `${a}こ と ${b}こ。あわせて なんこ？`,
  (a, b) => `きのう ${a}まい、きょう ${b}まい。ぜんぶで？`,
];

const BIG_SUB_TEMPLATES: ((a: number, b: number) => string)[] = [
  (a, b) => `${a} ー ${b} ＝ ？`,
  (a, b) => `${a}こ から ${b}こ ひくと？`,
  (a, b) => `${a}まい あったよ。${b}まい つかった。のこりは？`,
];

const MUL_TEMPLATES: ((a: number, b: number) => string)[] = [
  (a, b) => `${a} × ${b} ＝ ？`,
  (a, b) => `${b}こずつ ${a}グループ。ぜんぶで？`,
  (a, b) => `1はこに ${b}こ。${a}はこ あるよ。ぜんぶで？`,
];

const DIV_TEMPLATES: ((dividend: number, divisor: number) => string)[] = [
  (d, v) => `${d} ÷ ${v} ＝ ？`,
  (d, v) => `${d}こを ${v}にんで わけると ひとり なんこ？`,
  (d, v) => `${d}まいを ${v}つに わけると 1つ なんまい？`,
];

export function generateProblem(skillId: string): Problem {
  switch (skillId as SkillId) {
    case 'make-ten': {
      const current = Math.floor(Math.random() * 9) + 1;
      const answer = missingToTen(current);
      const choices = makeAnswerChoices(current);
      const food = rndFrom(FLAVOR_FOODS);
      return {
        skillId,
        questionText: rndFrom(MAKE_TEN_TEMPLATES)(current, food),
        answer,
        choices,
        emoji: food,
        explain: explainMakeTen(current, food),
      };
    }
    case 'addition': {
      const p = generateAddition();
      const animal = rndFrom(FLAVOR_ANIMALS);
      return {
        skillId,
        questionText: rndFrom(ADDITION_TEMPLATES)(p.a, p.b, animal),
        answer: p.a + p.b,
        choices: p.choices,
        emoji: animal,
        explain: explainAddition(p, animal),
      };
    }
    case 'subtraction': {
      const p = generateSubtraction();
      const food = rndFrom(FLAVOR_FOODS);
      return {
        skillId,
        questionText: rndFrom(SUBTRACTION_TEMPLATES)(p.a, p.b, food),
        answer: p.a - p.b,
        choices: p.choices,
        emoji: food,
        explain: explainSubtraction(p, food),
      };
    }
    case 'cherry-calc': {
      const p = generateCarryProblem();
      return {
        skillId,
        questionText: `さくらんぼで ${p.a} ＋ ${p.b} ＝ ？`,
        answer: p.a + p.b,
        choices: p.choices,
        emoji: '🍒',
        explain: explainCherry(p),
      };
    }
    case 'big-addition': {
      const p = generateBigAddition();
      return {
        skillId,
        questionText: rndFrom(BIG_ADD_TEMPLATES)(p.a, p.b),
        answer: p.a + p.b,
        choices: p.choices,
        explain: explainBigAddition(p),
      };
    }
    case 'big-subtraction': {
      const p = generateBigSubtraction();
      return {
        skillId,
        questionText: rndFrom(BIG_SUB_TEMPLATES)(p.a, p.b),
        answer: p.a - p.b,
        choices: p.choices,
        explain: explainBigSubtraction(p),
      };
    }
    case 'multiplication': {
      const p = generateMultiplication();
      const food = rndFrom(FLAVOR_FOODS);
      return {
        skillId,
        questionText: rndFrom(MUL_TEMPLATES)(p.a, p.b),
        answer: p.a * p.b,
        choices: p.choices,
        emoji: '✖️',
        explain: explainMultiplication(p, food),
      };
    }
    case 'division': {
      const p = generateDivision();
      const food = rndFrom(FLAVOR_FOODS);
      return {
        skillId,
        questionText: rndFrom(DIV_TEMPLATES)(p.dividend, p.divisor),
        answer: p.quotient,
        choices: p.choices,
        emoji: '➗',
        explain: explainDivision(p, food),
      };
    }
    default: {
      const p = generateAddition();
      return {
        skillId,
        questionText: `${p.a} ＋ ${p.b} ＝ ？`,
        answer: p.a + p.b,
        choices: p.choices,
      };
    }
  }
}

export function checkAnswer(p: Problem, chosen: number): boolean {
  return chosen === p.answer;
}
