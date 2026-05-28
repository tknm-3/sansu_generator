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

export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomChoice<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** かけ算のお題に使う「2〜6 のかけ算で作れる」答え */
export const MUL_TARGETS = [6, 8, 9, 10, 12, 15, 16, 20, 24] as const;

/**
 * 1つの「お題」。target は pickTarget() で1回だけ決めて、text/reached/status に渡す。
 * target を使わないお題（ダブルス等）は pickTarget が 0 を返し、各関数で無視する。
 */
export interface GoalSpec<S> {
  id: string;
  text: (target: number) => string;
  pickTarget: () => number;
  reached: (state: S, target: number) => boolean;
  status: (state: S, target: number) => string;
}

export interface AddState {
  a: number;
  b: number;
}
export interface SubState {
  total: number;
  remove: number;
}
export interface MulState {
  groups: number;
  perGroup: number;
}
export interface DivState {
  total: number;
  groups: number;
}
export interface BigAddState {
  total: number;
}

export const ADD_GOALS: GoalSpec<AddState>[] = [
  {
    id: 'exact',
    text: (t) => `ぜんぶで ${t}こ に なるように つくろう！`,
    pickTarget: () => randomInt(5, 10),
    reached: ({ a, b }, t) => a + b === t,
    status: ({ a, b }) => `いまは ぜんぶで ${a + b}こ`,
  },
  {
    id: 'atleast',
    text: (t) => `ぜんぶで ${t}こ以上に なるように つくろう！`,
    pickTarget: () => randomInt(6, 12),
    reached: ({ a, b }, t) => a + b >= t,
    status: ({ a, b }) => `いまは ぜんぶで ${a + b}こ`,
  },
  {
    id: 'maketen',
    text: () => 'ちょうど 10に なるように つくろう！',
    pickTarget: () => 10,
    reached: ({ a, b }) => a + b === 10,
    status: ({ a, b }) => `いまは ぜんぶで ${a + b}こ。10まで あと ${Math.max(0, 10 - (a + b))}こ`,
  },
  {
    id: 'double',
    text: () => 'ふたつを おなじ かずに しよう！',
    pickTarget: () => 0,
    reached: ({ a, b }) => a === b && a > 0,
    status: ({ a, b }) => (a === b && a > 0 ? `おなじ ${a}こ どうし！（${a}の 2ばい）` : `いまは ${a}こ と ${b}こ`),
  },
];

export const SUB_GOALS: GoalSpec<SubState>[] = [
  {
    id: 'leave',
    text: (t) => `${t}こ のこるように バイバイしよう！`,
    pickTarget: () => randomInt(1, 5),
    reached: ({ total, remove }, t) => total - remove === t,
    status: ({ total, remove }) => `いまは ${total - remove}こ のこってる`,
  },
  {
    id: 'empty',
    text: () => 'ぜんぶ なくなるように バイバイしよう！',
    pickTarget: () => 0,
    reached: ({ total, remove }) => total > 0 && total - remove === 0,
    status: ({ total, remove }) => (total - remove === 0 ? 'ぜんぶ なくなった！' : `いまは ${total - remove}こ のこってる`),
  },
  {
    id: 'leaveAtleast',
    text: (t) => `${t}こ以上 のこるように バイバイしよう！`,
    pickTarget: () => randomInt(2, 4),
    reached: ({ total, remove }, t) => total - remove >= t,
    status: ({ total, remove }) => `いまは ${total - remove}こ のこってる`,
  },
  {
    id: 'fromten',
    text: (t) => `ぜんぶを 10こ にして、${t}こ のこるように バイバイしよう！`,
    pickTarget: () => randomInt(2, 8),
    reached: ({ total, remove }, t) => total === 10 && total - remove === t,
    status: ({ total, remove }) =>
      total === 10 ? `10から ${remove}こ とって ${total - remove}こ のこってる` : `まず ぜんぶを 10こ にしよう（いまは ${total}こ）`,
  },
];

export const MUL_GOALS: GoalSpec<MulState>[] = [
  {
    id: 'exact',
    text: (t) => `ぜんぶで ${t}こ に なるように つくろう！`,
    pickTarget: () => randomChoice(MUL_TARGETS),
    reached: ({ groups, perGroup }, t) => groups * perGroup === t,
    status: ({ groups, perGroup }) => `いまは ぜんぶで ${groups * perGroup}こ`,
  },
  {
    id: 'pereach',
    text: (t) => `1さらに ${t}こずつ に なるように つくろう！`,
    pickTarget: () => randomInt(2, 5),
    reached: ({ perGroup }, t) => perGroup === t,
    status: ({ perGroup }) => `いまは 1さらに ${perGroup}こずつ`,
  },
  {
    id: 'atleast',
    text: (t) => `ぜんぶで ${t}こ以上に なるように つくろう！`,
    pickTarget: () => randomInt(10, 18),
    reached: ({ groups, perGroup }, t) => groups * perGroup >= t,
    status: ({ groups, perGroup }) => `いまは ぜんぶで ${groups * perGroup}こ`,
  },
  {
    id: 'double',
    text: () => 'おさらを 2まいに して「○の 2ばい」を つくろう！',
    pickTarget: () => 0,
    reached: ({ groups, perGroup }) => groups === 2 && perGroup > 0,
    status: ({ groups, perGroup }) => (groups === 2 ? `${perGroup}の 2ばい ＝ ${perGroup * 2}こ` : `いまは おさら ${groups}まい`),
  },
];

export const DIV_GOALS: GoalSpec<DivState>[] = [
  {
    id: 'remainder',
    text: (t) => `あまりが ${t}こ に なるように つくろう！`,
    pickTarget: () => randomInt(1, 2),
    reached: ({ total, groups }, t) => total % groups === t,
    status: ({ total, groups }) => `いまは 1にん ${Math.floor(total / groups)}こ、あまり ${total % groups}こ`,
  },
  {
    id: 'noremainder',
    text: () => 'あまりが でないように わけよう！',
    pickTarget: () => 0,
    reached: ({ total, groups }) => total % groups === 0,
    status: ({ total, groups }) => `いまは 1にん ${Math.floor(total / groups)}こ、あまり ${total % groups}こ`,
  },
  {
    id: 'pereach',
    text: (t) => `1にん ${t}こずつ に なるように わけよう！`,
    pickTarget: () => randomInt(2, 4),
    reached: ({ total, groups }, t) => Math.floor(total / groups) === t,
    status: ({ total, groups }) => `いまは 1にん ${Math.floor(total / groups)}こ`,
  },
];

export const BIGADD_GOALS: GoalSpec<BigAddState>[] = [
  {
    id: 'greater',
    text: (t) => `こたえが ${t}より おおきく なるように つくろう！`,
    pickTarget: () => randomInt(4, 8) * 10,
    reached: ({ total }, t) => total > t,
    status: ({ total }) => `いまは こたえが ${total}`,
  },
  {
    id: 'atleast',
    text: (t) => `こたえが ${t}以上に なるように つくろう！`,
    pickTarget: () => randomInt(4, 8) * 10,
    reached: ({ total }, t) => total >= t,
    status: ({ total }) => `いまは こたえが ${total}`,
  },
  {
    id: 'less',
    text: (t) => `こたえが ${t}より ちいさく なるように つくろう！`,
    pickTarget: () => randomInt(5, 9) * 10,
    reached: ({ total }, t) => total < t,
    status: ({ total }) => `いまは こたえが ${total}`,
  },
  {
    id: 'round',
    text: (t) => `こたえが ちょうど ${t}に なるように つくろう！`,
    pickTarget: () => randomChoice([30, 40, 50, 60]),
    reached: ({ total }, t) => total === t,
    status: ({ total }) => `いまは こたえが ${total}`,
  },
  {
    id: 'tensplace',
    text: (t) => `10の くらいが ${t}に なるように つくろう！`,
    pickTarget: () => randomInt(3, 7),
    reached: ({ total }, t) => Math.floor(total / 10) % 10 === t,
    status: ({ total }) => `いまは こたえが ${total}（10のくらいは ${Math.floor(total / 10) % 10}）`,
  },
];

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
  const per = Math.floor(total / groups);
  const remainder = total % groups;
  const questionText =
    remainder === 0
      ? `${emoji}が ${total}こ。${groups}にんで わけると 1にん なんこ？`
      : `${emoji}が ${total}こ。${groups}にんで わけると 1にん なんこで、なんこ あまる？`;
  const hint =
    remainder === 0
      ? `${total}こを ${groups}つに おなじだけ くばってみよう。`
      : `${total}こを ${groups}にんに 1こずつ くばっていくよ。もう くばれない ぶんが「あまり」！`;
  return {
    templateId: 'builder-div',
    type: 'division',
    questionText,
    answer: per,
    remainder,
    emoji,
    a: total,
    b: groups,
    scene: { kind: 'shareOut', emoji, total, groups },
    hint,
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
