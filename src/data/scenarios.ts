export interface Scenario {
  emoji: string; // 場面の主役 emoji（視覚・物語で共有）
  build: (vars: { a: number; b: number }) => string; // ひらがなのミニ物語
}

export const SCENARIOS: Record<string, Scenario[]> = {
  'make-ten': [
    {
      emoji: '🍎',
      build: ({ a }) => `🐰うさぎさんが\n🍎を ${a}こ もってるよ。\nあと なんこで 10こ？`,
    },
    {
      emoji: '🍊',
      build: ({ a }) => `🐻くまさんの かごに\n🍊が ${a}こ。\nあと なんこで 10こ?`,
    },
  ],
  addition: [
    {
      emoji: '🐱',
      build: ({ a, b }) => `🐱ねこが ${a}ひき あそんでる。\n${b}ひき やってきた。\nぜんぶで なんびき？`,
    },
    {
      emoji: '🍩',
      build: ({ a, b }) => `🐰うさぎさんが\n🍩を ${a}こ もってる。\n${b}こ もらった。\nぜんぶで なんこ？`,
    },
  ],
  subtraction: [
    {
      emoji: '🍎',
      build: ({ a, b }) => `🐻くまさんの 🍎が ${a}こ。\n${b}こ たべちゃった。\nのこりは なんこ？`,
    },
    {
      emoji: '🎈',
      build: ({ a, b }) => `🎈ふうせんが ${a}こ。\n${b}こ とんでいった。\nのこりは なんこ？`,
    },
  ],
  'cherry-calc': [
    {
      emoji: '🍓',
      build: ({ a, b }) => `🐰うさぎさんが\n🍓を ${a}こと ${b}こ つんだよ。\nさくらんぼけいさんで\nぜんぶで なんこ？`,
    },
  ],
  'big-addition': [
    {
      emoji: '🍪',
      build: ({ a, b }) => `🐻くまさんの おみせ。\n🍪が ${a}まいと ${b}まい。\nぜんぶで なんまい？`,
    },
  ],
  'big-subtraction': [
    {
      emoji: '⭐',
      build: ({ a, b }) => `⭐シールが ${a}まい あったよ。\n${b}まい つかった。\nのこりは なんまい？`,
    },
  ],
  multiplication: [
    {
      emoji: '🍩',
      build: ({ a, b }) =>
        `🐰うさぎさんの おみせ。\nおさら 1まいに 🍩が ${b}こ。\nおさらが ${a}まい あるよ。\nドーナツは ぜんぶで なんこ？`,
    },
    {
      emoji: '🐟',
      build: ({ a, b }) =>
        `🐱ねこが おさかなを\n1かごに ${b}びき。\n${a}かご あるよ。\nぜんぶで なんびき？`,
    },
  ],
  division: [
    {
      emoji: '🍪',
      build: ({ a, b }) =>
        `🍪クッキーが ${a}こ。\n${b}にんで おなじ かずずつ\nわけるよ。\nひとり なんこ？`,
    },
    {
      emoji: '🎀',
      build: ({ a, b }) =>
        `🎀リボンが ${a}ほん。\n${b}にんで わけると\nひとり なんぼん？`,
    },
  ],
};

export function pickScenario(unitId: string, rng: () => number = Math.random): Scenario {
  const list = SCENARIOS[unitId] ?? [];
  return list[Math.floor(rng() * list.length)];
}
