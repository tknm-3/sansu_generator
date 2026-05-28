import type { TemplateFilled } from './problemTemplates';

export type BuilderKind = 'add' | 'sub' | 'big-add' | 'pittari' | 'mul' | 'div';

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
  {
    kind: 'mul',
    label: 'かけざん',
    mark: '✖️',
    color: 'bg-pink-400 shadow-[0_4px_0_#be185d]',
    emojiOptions: ['🍩', '⭐', '🍓', '🐟', '🌸', '🍬'],
    grade: '小2',
    desc: 'おさらに ○○ずつ のせる',
  },
  {
    kind: 'div',
    label: 'わりざん',
    mark: '➗',
    color: 'bg-teal-500 shadow-[0_4px_0_#0f766e]',
    emojiOptions: ['🍪', '🍬', '🍎', '⭐', '🍩'],
    grade: '小3',
    desc: 'みんなで おなじだけ わける',
  },
  {
    kind: 'pittari',
    label: 'ぴったり？',
    mark: '🧺',
    color: 'bg-green-500 shadow-[0_4px_0_#15803d]',
    emojiOptions: ['🍎', '🍪', '🍊', '⭐', '🐟', '🍩'],
    grade: '年長〜小1',
    desc: 'かごに ぴったり？ あまる？ たりない？',
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

export type PittariVerdict = 'ぴったり' | 'あまる' | 'たりない';

export function pittariVerdict(items: number, capacity: number): PittariVerdict {
  if (items === capacity) return 'ぴったり';
  return items > capacity ? 'たりない' : 'あまる';
}

export function buildPittari(items: number, capacity: number, emoji: string): TemplateFilled {
  const verdict = pittariVerdict(items, capacity);
  let questionText: string;
  let answer: number;
  let hint: string;
  if (verdict === 'ぴったり') {
    questionText = `🧺かごに ${emoji}が ${capacity}こ はいるよ。\n${emoji}を ${items}こ いれた。\nなんこ あまる？`;
    answer = 0;
    hint = 'ちょうど はいったね。あまりは いくつかな？';
  } else if (verdict === 'あまる') {
    questionText = `🧺かごに ${emoji}が ${capacity}こ はいるよ。\n${emoji}を ${items}こ いれた。\nあと なんこ はいる？`;
    answer = capacity - items;
    hint = `${capacity}こ から ${items}こ ひくと いくつ？`;
  } else {
    questionText = `🧺かごに ${emoji}が ${capacity}こ はいるよ。\n${emoji}が ${items}こ ある。\nなんこ はいらない？`;
    answer = items - capacity;
    hint = `${items}こ から ${capacity}こ ひくと いくつ？`;
  }
  return {
    templateId: 'builder-pittari',
    type: 'subtraction',
    questionText,
    answer,
    emoji,
    a: items,
    b: capacity,
    scene: { kind: 'container', emoji, items, capacity },
    hint,
  };
}

export function buildMultiplication(groups: number, perGroup: number, emoji: string): TemplateFilled {
  return {
    templateId: 'builder-mul',
    type: 'multiplication',
    questionText: `${emoji}が ${perGroup}こずつ。おさらが ${groups}まい。ぜんぶで なんこ？`,
    answer: groups * perGroup,
    emoji,
    a: groups,
    b: perGroup,
    scene: { kind: 'groups', emoji, groups, perGroup },
    hint: `${perGroup}この かたまりが ${groups}つ。${perGroup}ずつ かぞえてみよう。`,
  };
}

export function buildDivision(total: number, groups: number, emoji: string): TemplateFilled {
  return {
    templateId: 'builder-div',
    type: 'division',
    questionText: `${emoji}が ${total}こ。${groups}にんで わけると 1にん なんこ？`,
    answer: Math.floor(total / groups),
    emoji,
    a: total,
    b: groups,
    scene: { kind: 'shareOut', emoji, total, groups },
    hint: `${total}こを ${groups}つに おなじだけ くばってみよう。`,
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
