export type WordVerdict = 'ぴったり' | 'たりない' | 'あまる';
export type WordVariant = 'word-addition' | 'word-subtraction' | 'word-multiplication' | 'word-division';

export interface WordProblem {
  variant: WordVariant;
  // word-addition: (a + b) items vs c capacity
  // word-subtraction: a supply vs b demand, c unused (0)
  // word-multiplication: a items/group × b groups vs c total items
  // word-division: a total items ÷ b people, c items/person asked
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
    step2: (v) => v === 'たりない' ? 'クッキーが なんまい のれない？' : 'おさらに なんまい あく？',
  },
  {
    emoji: '🍎',
    build: (a, b, c) =>
      `🍎りんごが ${a}こ あります。\n${b}こ もらいました。\n🧺かごに ${c}こ はいります。\nぜんぶ はいる？`,
    step2: (v) => v === 'たりない' ? 'りんごが なんこ はいりきれない？' : 'かごに なんこ あく？',
  },
  {
    emoji: '🐱',
    build: (a, b, c) =>
      `こどもが ${a}にん います。\nあとから ${b}にん きました。\nいすが ${c}こ あります。\nみんな すわれる？`,
    step2: (v) => v === 'たりない' ? 'いすが なんこ たりない？' : 'いすが なんこ あまる？',
  },
  {
    emoji: '🌸',
    build: (a, b, c) =>
      `🌸おはなが ${a}ほん あります。\n${b}ほん つみました。\nはなびんに ${c}ほん はいります。\nぜんぶ はいる？`,
    step2: (v) => v === 'たりない' ? 'おはなが なんぼん はいりきれない？' : 'はなびんに なんぼん あく？',
  },
  {
    emoji: '🍩',
    build: (a, b, c) =>
      `🍩ドーナツが ${a}こ あります。\n${b}こ つくりました。\nはこに ${c}こ はいります。\nぜんぶ はいる？`,
    step2: (v) => v === 'たりない' ? 'ドーナツが なんこ はいりきれない？' : 'はこに なんこ あく？',
  },
  {
    emoji: '🎈',
    build: (a, b, c) =>
      `🎈ふうせんが ${a}こ あります。\nおともだちが ${b}こ くれました。\nふくろに ${c}こ はいります。\nぜんぶ はいる？`,
    step2: (v) => v === 'たりない' ? 'ふうせんが なんこ はいりきれない？' : 'ふくろに なんこ あく？',
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
    step2: (v) => v === 'たりない' ? 'りんごが なんこ たりない？' : 'りんごが なんこ あまる？',
  },
  {
    emoji: '🍪',
    build: (a, b) =>
      `🍪クッキーが ${a}まい あります。\n${b}にんに ひとつずつ くばります。\nぜんぶ くばれる？`,
    step2: (v) => v === 'たりない' ? 'クッキーが なんまい たりない？' : 'クッキーが なんまい あまる？',
  },
  {
    emoji: '🎈',
    build: (a, b) =>
      `🎈ふうせんが ${a}こ あります。\n${b}にんに ひとつずつ あげます。\nぜんぶ あげられる？`,
    step2: (v) => v === 'たりない' ? 'ふうせんが なんこ たりない？' : 'ふうせんが なんこ あまる？',
  },
  {
    emoji: '🐶',
    build: (a, b) =>
      `いすが ${a}こ あります。\nこどもが ${b}にん います。\nみんな すわれる？`,
    step2: (v) => v === 'たりない' ? 'いすが なんこ たりない？' : 'いすが なんこ あまる？',
  },
  {
    emoji: '⭐',
    build: (a, b) =>
      `⭐シールが ${a}まい あります。\n${b}にんに ひとつずつ あげます。\nぜんぶ あげられる？`,
    step2: (v) => v === 'たりない' ? 'シールが なんまい たりない？' : 'シールが なんまい あまる？',
  },
  {
    emoji: '🌸',
    build: (a, b) =>
      `🌸おはなが ${a}ほん あります。\n${b}にんに ひとつずつ あげます。\nぜんぶ あげられる？`,
    step2: (v) => v === 'たりない' ? 'おはなが なんぼん たりない？' : 'おはなが なんぼん あまる？',
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

interface MulScenario {
  emoji: string;
  // a: items per group/box, b: numGroups, c: totalItems to fit
  build: (a: number, b: number, c: number) => string;
  step2: (v: 'たりない' | 'あまる') => string;
}

interface DivScenario {
  emoji: string;
  // a: totalItems, b: numPeople, c: amountPerPerson asked
  build: (a: number, b: number, c: number) => string;
  step2: (v: 'たりない' | 'あまる') => string;
}

// Multiplication scenarios: capacity = a × b groups, c = totalItems to store
// あまる: capacity > c (empty slots remain)
// たりない: capacity < c (not enough room)
const MUL_SCENARIOS: MulScenario[] = [
  {
    emoji: '📦',
    build: (a, b, c) =>
      `📦はこに ${a}こずつ はいります。\nはこが ${b}つ あります。\nりんごが ${c}こ あります。\nぜんぶ はいる？`,
    step2: (v) => v === 'たりない' ? 'りんごが なんこ はいりきれない？' : 'はこに なんこ あく？',
  },
  {
    emoji: '🍡',
    build: (a, b, c) =>
      `🍡1ふくろに あめが ${a}こ はいります。\nふくろが ${b}つ あります。\nあめが ${c}こ あります。\nぜんぶ はいる？`,
    step2: (v) => v === 'たりない' ? 'あめが なんこ はいりきれない？' : 'ふくろに なんこ あく？',
  },
  {
    emoji: '🪑',
    build: (a, b, c) =>
      `つくえに いすが ${a}こずつ つきます。\nつくえが ${b}つ あります。\nこどもが ${c}にん います。\nみんな すわれる？`,
    step2: (v) => v === 'たりない' ? 'いすが なんこ たりない？' : 'いすが なんこ あまる？',
  },
  {
    emoji: '🌺',
    build: (a, b, c) =>
      `🌺はなびんに おはなを ${a}ほんずつ かざります。\nはなびんが ${b}つ あります。\nおはなが ${c}ほん あります。\nぜんぶ かざれる？`,
    step2: (v) => v === 'たりない' ? 'おはなが なんぼん たりない？' : 'はなびんに なんぼん あく？',
  },
  {
    emoji: '🎠',
    build: (a, b, c) =>
      `のりものに ${a}にん ずつ のれます。\nのりものが ${b}だい あります。\nこどもが ${c}にん います。\nみんな のれる？`,
    step2: (v) => v === 'たりない' ? 'こどもが なんにん のれない？' : 'のりものに なんにん あく？',
  },
];

// Division scenarios: a total ÷ b people, c items/person asked
// あまる: a > b×c (leftover items)
// たりない: a < b×c (not enough items)
const DIV_SCENARIOS: DivScenario[] = [
  {
    emoji: '🍎',
    build: (a, b, c) =>
      `🍎りんごが ${a}こ あります。\n${b}にんで おなじかずずつ わけます。\n1にん ${c}こ もらえる？`,
    step2: (v) => v === 'たりない' ? 'りんごが なんこ たりない？' : 'りんごが なんこ あまる？',
  },
  {
    emoji: '🍪',
    build: (a, b, c) =>
      `🍪クッキーが ${a}まい あります。\n${b}にんで おなじかずずつ わけます。\n1にん ${c}まい もらえる？`,
    step2: (v) => v === 'たりない' ? 'クッキーが なんまい たりない？' : 'クッキーが なんまい あまる？',
  },
  {
    emoji: '🎈',
    build: (a, b, c) =>
      `🎈ふうせんが ${a}こ あります。\n${b}にんに ${c}こずつ あげます。\nぜんぶ あげられる？`,
    step2: (v) => v === 'たりない' ? 'ふうせんが なんこ たりない？' : 'ふうせんが なんこ あまる？',
  },
  {
    emoji: '🌸',
    build: (a, b, c) =>
      `🌸おはなが ${a}ほん あります。\n${b}にんに ${c}ほんずつ あげます。\nぜんぶ あげられる？`,
    step2: (v) => v === 'たりない' ? 'おはなが なんぼん たりない？' : 'おはなが なんぼん あまる？',
  },
  {
    emoji: '⭐',
    build: (a, b, c) =>
      `⭐シールが ${a}まい あります。\n${b}にんに ${c}まいずつ くばります。\nぜんぶ くばれる？`,
    step2: (v) => v === 'たりない' ? 'シールが なんまい たりない？' : 'シールが なんまい あまる？',
  },
];

export function generateWordProblem(
  variant: WordVariant,
  rng: () => number = Math.random,
): WordProblem {
  switch (variant) {
    case 'word-addition':        return generateAddWord(rng);
    case 'word-subtraction':     return generateSubWord(rng);
    case 'word-multiplication':  return generateMulWord(rng);
    case 'word-division':        return generateDivWord(rng);
  }
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

function generateMulWord(rng: () => number): WordProblem {
  const verdicts: WordVerdict[] = ['ぴったり', 'あまる', 'たりない'];
  const verdict = verdicts[Math.floor(rng() * verdicts.length)];
  const diff = verdict === 'ぴったり' ? 0 : Math.floor(rng() * 2) + 1;

  let a = 0, b = 0, c = 0;
  let ok = false;
  for (let i = 0; i < 100 && !ok; i++) {
    a = Math.floor(rng() * 3) + 2; // groupSize 2–4
    b = Math.floor(rng() * 3) + 2; // numGroups 2–4
    const capacity = a * b;
    if (verdict === 'ぴったり') {
      c = capacity;
    } else if (verdict === 'あまる') {
      c = capacity - diff; // c < capacity → slots あまる
    } else {
      c = capacity + diff; // c > capacity → not enough room
    }
    ok = c >= 1 && c <= 20;
  }

  const sc = MUL_SCENARIOS[Math.floor(rng() * MUL_SCENARIOS.length)];
  return {
    variant: 'word-multiplication',
    a, b, c,
    verdict,
    diff,
    text: sc.build(a, b, c),
    emoji: sc.emoji,
    step2Question: verdict !== 'ぴったり' ? sc.step2(verdict) : '',
    diffChoices: verdict !== 'ぴったり' ? makeDiffChoices(diff, rng) : [],
  };
}

function generateDivWord(rng: () => number): WordProblem {
  const verdicts: WordVerdict[] = ['ぴったり', 'あまる', 'たりない'];
  const verdict = verdicts[Math.floor(rng() * verdicts.length)];
  const diff = verdict === 'ぴったり' ? 0 : Math.floor(rng() * 2) + 1;

  let a = 0, b = 0, c = 0;
  let ok = false;
  for (let i = 0; i < 100 && !ok; i++) {
    b = Math.floor(rng() * 3) + 2; // numPeople 2–4
    c = Math.floor(rng() * 3) + 1; // amountPerPerson 1–3
    const need = b * c;
    if (verdict === 'ぴったり') {
      a = need;
    } else if (verdict === 'あまる') {
      a = need + diff; // a > need → items あまる
    } else {
      a = need - diff; // a < need → items たりない
    }
    ok = a >= 1 && a <= 15;
  }

  const sc = DIV_SCENARIOS[Math.floor(rng() * DIV_SCENARIOS.length)];
  return {
    variant: 'word-division',
    a, b, c,
    verdict,
    diff,
    text: sc.build(a, b, c),
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
