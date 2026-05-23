import { generateAddition } from '../math/addition';
import { generateSubtraction } from '../math/subtraction';
import { missingToTen, makeAnswerChoices } from '../math/makeTen';
import { generateCarryProblem } from '../math/cherryCalc';
import { generateBigAddition } from '../math/bigAddition';
import { generateBigSubtraction } from '../math/bigSubtraction';
import { generateMultiplication } from '../math/multiplication';
import { generateDivision } from '../math/division';

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
}

const FLAVOR_ANIMALS = ['🐱', '🐶', '🐸', '🐼', '🦊', '🐨', '🦁', '🐯'];
const FLAVOR_FOODS = ['🍎', '🍊', '🍇', '🍓', '🍌', '🍩', '🍪', '🍭'];

function rndFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateProblem(skillId: string): Problem {
  switch (skillId as SkillId) {
    case 'make-ten': {
      const current = Math.floor(Math.random() * 9) + 1;
      const answer = missingToTen(current);
      const choices = makeAnswerChoices(current);
      return {
        skillId,
        questionText: `${rndFrom(FLAVOR_FOODS)}が ${current}こ。あと なんこで 10こ？`,
        answer,
        choices,
        emoji: rndFrom(FLAVOR_FOODS),
      };
    }
    case 'addition': {
      const p = generateAddition();
      return {
        skillId,
        questionText: `${rndFrom(FLAVOR_ANIMALS)}が ${p.a}ひき。${p.b}ひき きたよ。ぜんぶで？`,
        answer: p.a + p.b,
        choices: p.choices,
        emoji: rndFrom(FLAVOR_ANIMALS),
      };
    }
    case 'subtraction': {
      const p = generateSubtraction();
      return {
        skillId,
        questionText: `${rndFrom(FLAVOR_FOODS)}が ${p.a}こ。${p.b}こ たべたら？`,
        answer: p.a - p.b,
        choices: p.choices,
        emoji: rndFrom(FLAVOR_FOODS),
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
      };
    }
    case 'big-addition': {
      const p = generateBigAddition();
      return {
        skillId,
        questionText: `${p.a} ＋ ${p.b} ＝ ？`,
        answer: p.a + p.b,
        choices: p.choices,
      };
    }
    case 'big-subtraction': {
      const p = generateBigSubtraction();
      return {
        skillId,
        questionText: `${p.a} ー ${p.b} ＝ ？`,
        answer: p.a - p.b,
        choices: p.choices,
      };
    }
    case 'multiplication': {
      const p = generateMultiplication();
      return {
        skillId,
        questionText: `${p.a} × ${p.b} ＝ ？`,
        answer: p.a * p.b,
        choices: p.choices,
        emoji: '✖️',
      };
    }
    case 'division': {
      const p = generateDivision();
      return {
        skillId,
        questionText: `${p.dividend} ÷ ${p.divisor} ＝ ？`,
        answer: p.quotient,
        choices: p.choices,
        emoji: '➗',
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
