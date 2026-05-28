import type { TemplateFilled } from './problemTemplates';

export type BuilderKind = 'add' | 'sub' | 'big-add';

export interface BuilderDef {
  kind: BuilderKind;
  label: string;
  mark: string;
  color: string;
  emojiOptions: string[];
  grade: string;
  desc: string;
}

export const BUILDERS: BuilderDef[] = [
  {
    kind: 'add',
    label: 'たしざん',
    mark: '➕',
    color: 'bg-sky-400 shadow-[0_4px_0_#0369a1]',
    emojiOptions: ['🍎', '🍊', '🍪', '⭐', '🐱', '🐸', '🌸'],
    grade: '小1',
    desc: 'りんごを おいて あわせる',
  },
  {
    kind: 'sub',
    label: 'ひきざん',
    mark: '➖',
    color: 'bg-orange-400 shadow-[0_4px_0_#c2410c]',
    emojiOptions: ['🍪', '🍬', '🍎', '🎈', '⭐', '🍩'],
    grade: '小1',
    desc: 'おいて バイバイする',
  },
  {
    kind: 'big-add',
    label: '2けたの たしざん',
    mark: '🔢',
    color: 'bg-purple-400 shadow-[0_4px_0_#7e22ce]',
    emojiOptions: [],
    grade: '小2',
    desc: '10のまとまりを おく',
  },
];

export function builderFor(kind: BuilderKind): BuilderDef {
  return BUILDERS.find((b) => b.kind === kind) ?? BUILDERS[0];
}

export function buildAddition(a: number, b: number, emoji: string): TemplateFilled {
  return {
    templateId: 'builder-add',
    type: 'addition',
    questionText: `${emoji}が ${a}こ と ${b}こ。あわせて なんこ？`,
    answer: a + b,
    emoji,
    a,
    b,
    scene: { kind: 'combine', emoji, a, b },
    hint: `${emoji}を ぜんぶ かぞえてみよう。${a}このつぎから ${b}こ かぞえると…`,
  };
}

export function buildSubtraction(total: number, remove: number, emoji: string): TemplateFilled {
  return {
    templateId: 'builder-sub',
    type: 'subtraction',
    questionText: `${emoji}が ${total}こ。${remove}こ バイバイした。のこりは なんこ？`,
    answer: total - remove,
    emoji,
    a: total,
    b: remove,
    scene: { kind: 'takeAway', emoji, total, remove },
    hint: `${total}こ から ${remove}こ とると、のこりは いくつ？`,
  };
}

export function buildBigAddition(tensA: number, onesA: number, tensB: number, onesB: number): TemplateFilled {
  const a = tensA * 10 + onesA;
  const b = tensB * 10 + onesB;
  return {
    templateId: 'builder-big-add',
    type: 'addition',
    questionText: `${a} + ${b} = ？`,
    answer: a + b,
    emoji: '🟧',
    a,
    b,
    scene: { kind: 'placeValue', aTens: tensA, aOnes: onesA, bTens: tensB, bOnes: onesB },
    hint: '10のまとまり どうし、ばら どうしを たしてみよう。',
  };
}
