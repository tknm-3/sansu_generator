export type ProblemType = 'addition' | 'subtraction' | 'multiplication' | 'division';

export interface Template {
  id: string;
  type: ProblemType;
  textPattern: string;
  answerFn: (vars: { a: number; b: number }) => number;
  emojiOptions: string[];
  aRange: [number, number];
  bRange: [number, number];
}

export interface TemplateFilled {
  templateId: string;
  type: ProblemType;
  questionText: string;
  answer: number;
  emoji: string;
  a: number;
  b: number;
}

function fillText(pattern: string, vars: { emoji: string; a: number; b: number }): string {
  return pattern
    .replace('{emoji}', vars.emoji)
    .replace('{a}', String(vars.a))
    .replace('{b}', String(vars.b));
}

export const TEMPLATES: Template[] = [
  {
    id: 'add-animals',
    type: 'addition',
    textPattern: '{emoji}が {a}ひき。{b}ひき やってきた。ぜんぶで なんびき？',
    answerFn: ({ a, b }) => a + b,
    emojiOptions: ['🐱', '🐶', '🐸', '🐼', '🦊'],
    aRange: [1, 9],
    bRange: [1, 9],
  },
  {
    id: 'add-food',
    type: 'addition',
    textPattern: '{emoji}が {a}こ。{b}こ もらった。ぜんぶで？',
    answerFn: ({ a, b }) => a + b,
    emojiOptions: ['🍎', '🍊', '🍩', '🍪', '🍭'],
    aRange: [1, 9],
    bRange: [1, 9],
  },
  {
    id: 'sub-eat',
    type: 'subtraction',
    textPattern: '{emoji}が {a}こ あったよ。{b}こ たべちゃった。のこりは なんこ？',
    answerFn: ({ a, b }) => a - b,
    emojiOptions: ['🍪', '🍬', '🍭', '🍩', '🍰'],
    aRange: [5, 10],
    bRange: [1, 4],
  },
  {
    id: 'sub-lost',
    type: 'subtraction',
    textPattern: '{emoji}が {a}こ あった。{b}こ なくなった。のこりは？',
    answerFn: ({ a, b }) => a - b,
    emojiOptions: ['🔴', '🔵', '⭐', '🎈', '🌸'],
    aRange: [5, 10],
    bRange: [1, 4],
  },
  {
    id: 'mul-groups',
    type: 'multiplication',
    textPattern: '{emoji}が {b}こずつ {a}つの グループ。ぜんぶで なんこ？',
    answerFn: ({ a, b }) => a * b,
    emojiOptions: ['🍩', '⭐', '🎈', '🐟', '🌸'],
    aRange: [2, 5],
    bRange: [2, 5],
  },
  {
    id: 'div-share',
    type: 'division',
    textPattern: '{emoji}が {a}こ。{b}にんで わけると 1にん なんこ？',
    answerFn: ({ a, b }) => Math.floor(a / b),
    emojiOptions: ['🍪', '🍬', '🍭', '🍩', '🍰'],
    aRange: [6, 20],
    bRange: [2, 5],
  },
];

export function fillTemplate(
  tpl: Template,
  vars: { a: number; b: number; emoji: string },
): TemplateFilled {
  const answer = tpl.answerFn(vars);
  return {
    templateId: tpl.id,
    type: tpl.type,
    questionText: fillText(tpl.textPattern, vars),
    answer,
    emoji: vars.emoji,
    a: vars.a,
    b: vars.b,
  };
}

export function randomFillTemplate(tpl: Template, rng: () => number = Math.random): TemplateFilled {
  const a = Math.floor(rng() * (tpl.aRange[1] - tpl.aRange[0] + 1)) + tpl.aRange[0];
  const b = Math.floor(rng() * (tpl.bRange[1] - tpl.bRange[0] + 1)) + tpl.bRange[0];
  const emoji = tpl.emojiOptions[Math.floor(rng() * tpl.emojiOptions.length)];
  return fillTemplate(tpl, { a, b, emoji });
}
