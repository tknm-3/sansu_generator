export type WordVerdict = 'ぴったり' | 'たりない' | 'あまる';

export interface WordProblem {
  variant: 'word-addition' | 'word-subtraction';
  // word-addition: (a + b) items vs c capacity
  // word-subtraction: a supply vs b demand, c unused (0)
  a: number;
  b: number;
  c: number;
  verdict: WordVerdict;
  diff: number; // 0 for ぴったり
  text: string;
  emoji: string;
  step2Question: string; // empty string when verdict is ぴったり
  diffChoices: number[]; // empty when verdict is ぴったり
}

interface AddScenario {
  emoji: string;
  // a, b: items in two groups; c: capacity
  build: (a: number, b: number, c: number) => string;
  step2: (v: 'たりない' | 'あまる') => string;
}

interface SubScenario {
  emoji: string;
  // a: supply; b: demand
  build: (a: number, b: number) => string;
  step2: (v: 'たりない' | 'あまる') => string;
}

// Addition scenarios: (a + b) items trying to fit into c capacity
// あまる: c > a+b → capacity あまる (empty slots left)
// たりない: c < a+b → capacity たりない (not enough room)
const ADD_SCENARIOS: AddScenario[] = [
  {
    emoji: '🍪',
    build: (a, b, c) =>
      `🍪クッキーが ${a}まい あります。\n${b}まい もらいました。\nおさらに ${c}まい のせられます。\nぜんぶ のせられる？`,
    step2: (v) => v === 'たりない' ? 'なんまい たりない？' : 'なんまい あまる？',
  },
  {
    emoji: '🍎',
    build: (a, b, c) =>
      `🍎りんごが ${a}こ あります。\n${b}こ もらいました。\n🧺かごに ${c}こ はいります。\nぜんぶ はいる？`,
    step2: (v) => v === 'たりない' ? 'なんこ たりない？' : 'なんこ あまる？',
  },
  {
    emoji: '🐱',
    build: (a, b, c) =>
      `こどもが ${a}にん います。\nあとから ${b}にん きました。\nいすが ${c}こ あります。\nみんな すわれる？`,
    step2: (v) => v === 'たりない' ? 'なんこ たりない？' : 'なんこ あまる？',
  },
  {
    emoji: '🌸',
    build: (a, b, c) =>
      `🌸おはなが ${a}ほん あります。\n${b}ほん つみました。\nはなびんに ${c}ほん はいります。\nぜんぶ はいる？`,
    step2: (v) => v === 'たりない' ? 'なんぼん たりない？' : 'なんぼん あまる？',
  },
  {
    emoji: '🍩',
    build: (a, b, c) =>
      `🍩ドーナツが ${a}こ あります。\n${b}こ つくりました。\n${c}にんに ひとつずつ あげます。\nぜんぶ あげられる？`,
    step2: (v) => v === 'たりない' ? 'なんこ たりない？' : 'なんこ あまる？',
  },
  {
    emoji: '🎈',
    build: (a, b, c) =>
      `🎈ふうせんが ${a}こ あります。\nおともだちが ${b}こ くれました。\n${c}にんに ひとつずつ くばります。\nぜんぶ くばれる？`,
    step2: (v) => v === 'たりない' ? 'なんこ たりない？' : 'なんこ あまる？',
  },
];

// Subtraction scenarios: a supply vs b demand
// あまる: a > b → supply あまる (leftover items)
// たりない: a < b → supply たりない (not enough for everyone)
const SUB_SCENARIOS: SubScenario[] = [
  {
    emoji: '🍎',
    build: (a, b) =>
      `🍎りんごが ${a}こ あります。\n${b}にんに ひとつずつ あげます。\nぜんぶ くばれる？`,
    step2: (v) => v === 'たりない' ? 'なんこ たりない？' : 'なんこ あまる？',
  },
  {
    emoji: '🍪',
    build: (a, b) =>
      `🍪クッキーが ${a}まい あります。\n${b}にんに ひとつずつ くばります。\nぜんぶ くばれる？`,
    step2: (v) => v === 'たりない' ? 'なんまい たりない？' : 'なんまい あまる？',
  },
  {
    emoji: '🎈',
    build: (a, b) =>
      `🎈ふうせんが ${a}こ あります。\n${b}にんに ひとつずつ あげます。\nぜんぶ あげられる？`,
    step2: (v) => v === 'たりない' ? 'なんこ たりない？' : 'なんこ あまる？',
  },
  {
    emoji: '🐶',
    build: (a, b) =>
      `いすが ${a}こ あります。\nこどもが ${b}にん います。\nみんな すわれる？`,
    step2: (v) => v === 'たりない' ? 'なんこ たりない？' : 'なんこ あまる？',
  },
  {
    emoji: '⭐',
    build: (a, b) =>
      `⭐シールが ${a}まい あります。\n${b}にんに ひとつずつ あげます。\nぜんぶ あげられる？`,
    step2: (v) => v === 'たりない' ? 'なんまい たりない？' : 'なんまい あまる？',
  },
  {
    emoji: '🌸',
    build: (a, b) =>
      `🌸おはなが ${a}ほん あります。\n${b}にんに ひとつずつ あげます。\nぜんぶ あげられる？`,
    step2: (v) => v === 'たりない' ? 'なんぼん たりない？' : 'なんぼん あまる？',
  },
];

function makeDiffChoices(diff: number, rng: () => number): number[] {
  const choices = new Set<number>([diff]);
  while (choices.size < 3) {
    const c = Math.floor(rng() * 4) + 1; // 1–4
    if (c !== diff) choices.add(c);
  }
  return [...choices].sort(() => rng() - 0.5);
}

export function generateWordProblem(
  variant: 'word-addition' | 'word-subtraction',
  rng: () => number = Math.random,
): WordProblem {
  return variant === 'word-addition'
    ? generateAddWord(rng)
    : generateSubWord(rng);
}

function generateAddWord(rng: () => number): WordProblem {
  const verdicts: WordVerdict[] = ['ぴったり', 'あまる', 'たりない'];
  const verdict = verdicts[Math.floor(rng() * verdicts.length)];
  const diff = verdict === 'ぴったり' ? 0 : Math.floor(rng() * 2) + 1;

  let a = 0, b = 0, c = 0;
  let ok = false;
  for (let i = 0; i < 100 && !ok; i++) {
    a = Math.floor(rng() * 5) + 1; // 1–5
    b = Math.floor(rng() * 5) + 1; // 1–5
    const total = a + b;
    if (verdict === 'ぴったり') {
      c = total;
    } else if (verdict === 'あまる') {
      c = total + diff; // c > total → capacity あまる
    } else {
      c = total - diff; // c < total → capacity たりない
    }
    ok = c >= 1 && c <= 10;
  }

  const sc = ADD_SCENARIOS[Math.floor(rng() * ADD_SCENARIOS.length)];
  return {
    variant: 'word-addition',
    a, b, c,
    verdict,
    diff,
    text: sc.build(a, b, c),
    emoji: sc.emoji,
    step2Question: verdict !== 'ぴったり' ? sc.step2(verdict) : '',
    diffChoices: verdict !== 'ぴったり' ? makeDiffChoices(diff, rng) : [],
  };
}

function generateSubWord(rng: () => number): WordProblem {
  const verdicts: WordVerdict[] = ['ぴったり', 'あまる', 'たりない'];
  const verdict = verdicts[Math.floor(rng() * verdicts.length)];
  const diff = verdict === 'ぴったり' ? 0 : Math.floor(rng() * 2) + 1;

  let a = 0, b = 0;
  let ok = false;
  for (let i = 0; i < 100 && !ok; i++) {
    if (verdict === 'ぴったり') {
      a = Math.floor(rng() * 8) + 2; // 2–9
      b = a;
    } else if (verdict === 'あまる') {
      b = Math.floor(rng() * 8) + 1; // 1–8
      a = b + diff; // a > b → supply あまる
    } else {
      a = Math.floor(rng() * 8) + 1; // 1–8
      b = a + diff; // b > a → supply たりない
    }
    ok = a >= 1 && a <= 10 && b >= 1 && b <= 10;
  }

  const sc = SUB_SCENARIOS[Math.floor(rng() * SUB_SCENARIOS.length)];
  return {
    variant: 'word-subtraction',
    a, b, c: 0,
    verdict,
    diff,
    text: sc.build(a, b),
    emoji: sc.emoji,
    step2Question: verdict !== 'ぴったり' ? sc.step2(verdict) : '',
    diffChoices: verdict !== 'ぴったり' ? makeDiffChoices(diff, rng) : [],
  };
}

export function checkVerdict(problem: WordProblem, chosen: WordVerdict): boolean {
  return chosen === problem.verdict;
}

export function checkDiff(problem: WordProblem, chosen: number): boolean {
  return chosen === problem.diff;
}
