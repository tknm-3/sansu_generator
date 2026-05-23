# フェーズ2：がくしゅうモード拡充 実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** さくらんぼ計算・たしざん・ひきざん・二桁計算・かけ算・わり算の各単元と習熟度トラッキングを実装し、ホームから全単元を遊べるようにする。

**Architecture:** 各単元の算数ロジックを純粋関数（`src/lib/math/`）として TDD で実装し、その上に画面（`src/screens/`）を載せる。習熟度は `src/lib/mastery.ts` に集約して localStorage に保存。App.tsx でルーティングを拡張する。

**Tech Stack:** React 19 + TypeScript + Vite / framer-motion / Tailwind CSS / Vitest

参照仕様: `docs/superpowers/specs/2026-05-24-sound-visual-phase2-design.md` §3

---

## ファイル構成

```
src/
  lib/
    math/
      addition.ts          [新規] たしざんロジック
      subtraction.ts       [新規] ひきざんロジック
      cherryCalc.ts        [新規] さくらんぼ計算ロジック
      bigAddition.ts       [新規] 二桁のたしざん（繰り上がり）
      bigSubtraction.ts    [新規] 二桁のひきざん（繰り下がり）
      multiplication.ts    [新規] かけ算ロジック
      division.ts          [新規] わり算ロジック
    mastery.ts             [新規] スキル別習熟度トラッキング
  components/
    CherryBranch.tsx       [新規] さくらんぼ分解 SVG
    StepIndicator.tsx      [新規] STEP 進行インジケーター
  screens/
    AdditionUnit.tsx       [新規] たしざん画面
    SubtractionUnit.tsx    [新規] ひきざん画面
    CherryCalcUnit.tsx     [新規] さくらんぼ計算 STEP 画面
    BigAdditionUnit.tsx    [新規] 二桁のたしざん画面
    BigSubtractionUnit.tsx [新規] 二桁のひきざん画面
    MultiplicationUnit.tsx [新規] かけ算画面
    DivisionUnit.tsx       [新規] わり算画面
  data/
    units.ts               [修正] 全単元データを追加
  App.tsx                  [修正] 新単元のルーティング追加
tests/
  lib/math/addition.test.ts
  lib/math/subtraction.test.ts
  lib/math/cherryCalc.test.ts
  lib/math/bigAddition.test.ts
  lib/math/bigSubtraction.test.ts
  lib/math/multiplication.test.ts
  lib/math/division.test.ts
  lib/mastery.test.ts
```

---

### Task 1: 習熟度トラッキング（mastery.ts）

**Files:**
- Create: `src/lib/mastery.ts`
- Test: `tests/lib/mastery.test.ts`

習熟レベル: 0=未学習, 1=練習中, 2=定着, 3=習得

- [ ] **Step 1: 失敗するテストを書く**

`tests/lib/mastery.test.ts`:
```ts
import { describe, it, expect, beforeEach } from 'vitest';
import {
  recordAnswer,
  getMasteryLevel,
  getSkillForReview,
  type MasteryMap,
} from '../../src/lib/mastery';

const emptyMap: MasteryMap = {};
const now = 1000000;

describe('recordAnswer', () => {
  it('correct answer increments correct count', () => {
    const m = recordAnswer(emptyMap, 'addition', true, now);
    expect(m['addition'].correct).toBe(1);
    expect(m['addition'].wrong).toBe(0);
    expect(m['addition'].lastAt).toBe(now);
  });
  it('wrong answer increments wrong count', () => {
    const m = recordAnswer(emptyMap, 'addition', false, now);
    expect(m['addition'].wrong).toBe(1);
  });
  it('does not mutate input', () => {
    recordAnswer(emptyMap, 'addition', true, now);
    expect(emptyMap['addition']).toBeUndefined();
  });
});

describe('getMasteryLevel', () => {
  it('returns 0 for unknown skill', () => {
    expect(getMasteryLevel(emptyMap, 'addition')).toBe(0);
  });
  it('returns 1 with 1-4 correct and accuracy >= 60%', () => {
    let m = emptyMap;
    for (let i = 0; i < 3; i++) m = recordAnswer(m, 'addition', true, now);
    expect(getMasteryLevel(m, 'addition')).toBe(1);
  });
  it('returns 2 with 5-9 correct and accuracy >= 70%', () => {
    let m = emptyMap;
    for (let i = 0; i < 7; i++) m = recordAnswer(m, 'addition', true, now);
    expect(getMasteryLevel(m, 'addition')).toBe(2);
  });
  it('returns 3 with 10+ correct and accuracy >= 80%', () => {
    let m = emptyMap;
    for (let i = 0; i < 12; i++) m = recordAnswer(m, 'addition', true, now);
    expect(getMasteryLevel(m, 'addition')).toBe(3);
  });
});

describe('getSkillForReview', () => {
  it('returns null when no skills exist', () => {
    expect(getSkillForReview(emptyMap, [])).toBeNull();
  });
  it('returns oldest lastAt skill from candidates', () => {
    let m = recordAnswer(emptyMap, 'addition', true, 500);
    m = recordAnswer(m, 'subtraction', true, 1000);
    const skill = getSkillForReview(m, ['addition', 'subtraction']);
    expect(skill).toBe('addition');
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx vitest run tests/lib/mastery.test.ts`
Expected: FAIL（`recordAnswer` 等 未定義）

- [ ] **Step 3: mastery.ts を実装する**

`src/lib/mastery.ts`:
```ts
import { loadJson, saveJson } from './storage';

export interface SkillRecord {
  correct: number;
  wrong: number;
  lastAt: number;
}

export type MasteryMap = Record<string, SkillRecord>;

const KEY = 'math-app:mastery';

export function loadMastery(): MasteryMap {
  return loadJson<MasteryMap>(KEY, {});
}

export function saveMastery(m: MasteryMap): void {
  saveJson(KEY, m);
}

export function recordAnswer(
  map: MasteryMap,
  skillId: string,
  correct: boolean,
  at: number,
): MasteryMap {
  const prev = map[skillId] ?? { correct: 0, wrong: 0, lastAt: 0 };
  return {
    ...map,
    [skillId]: {
      correct: prev.correct + (correct ? 1 : 0),
      wrong: prev.wrong + (correct ? 0 : 1),
      lastAt: at,
    },
  };
}

export function getMasteryLevel(map: MasteryMap, skillId: string): 0 | 1 | 2 | 3 {
  const r = map[skillId];
  if (!r) return 0;
  const total = r.correct + r.wrong;
  const acc = total === 0 ? 0 : r.correct / total;
  if (r.correct >= 10 && acc >= 0.8) return 3;
  if (r.correct >= 5 && acc >= 0.7) return 2;
  if (r.correct >= 1 && acc >= 0.6) return 1;
  return 0;
}

export function getSkillForReview(
  map: MasteryMap,
  candidates: string[],
): string | null {
  if (candidates.length === 0) return null;
  const known = candidates.filter((s) => map[s]);
  if (known.length === 0) return candidates[0];
  return known.sort((a, b) => (map[a]?.lastAt ?? 0) - (map[b]?.lastAt ?? 0))[0];
}
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npx vitest run tests/lib/mastery.test.ts`
Expected: PASS（全ケース緑）

- [ ] **Step 5: Commit**

```bash
git add src/lib/mastery.ts tests/lib/mastery.test.ts
git commit -m "feat: skill mastery tracking (pure functions, TDD)"
```

---

### Task 2: たしざんロジック（addition.ts）

**Files:**
- Create: `src/lib/math/addition.ts`
- Test: `tests/lib/math/addition.test.ts`

1位数 + 1位数（答えが20以下）の問題生成と採点。

- [ ] **Step 1: 失敗するテストを書く**

`tests/lib/math/addition.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { generateAddition, checkAddition, type AdditionProblem } from '../../../src/lib/math/addition';

describe('generateAddition', () => {
  it('returns a problem with a + b <= 20', () => {
    for (let i = 0; i < 20; i++) {
      const p = generateAddition();
      expect(p.a + p.b).toBeLessThanOrEqual(20);
      expect(p.a).toBeGreaterThanOrEqual(1);
      expect(p.b).toBeGreaterThanOrEqual(1);
    }
  });
  it('choices include the correct answer', () => {
    const p = generateAddition();
    expect(p.choices).toContain(p.a + p.b);
  });
  it('choices are 3 unique numbers', () => {
    const p = generateAddition();
    expect(p.choices).toHaveLength(3);
    expect(new Set(p.choices).size).toBe(3);
  });
});

describe('checkAddition', () => {
  it('returns true for correct answer', () => {
    const p: AdditionProblem = { a: 3, b: 4, choices: [7, 5, 2] };
    expect(checkAddition(p, 7)).toBe(true);
  });
  it('returns false for wrong answer', () => {
    const p: AdditionProblem = { a: 3, b: 4, choices: [7, 5, 2] };
    expect(checkAddition(p, 5)).toBe(false);
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx vitest run tests/lib/math/addition.test.ts`
Expected: FAIL

- [ ] **Step 3: addition.ts を実装する**

`src/lib/math/addition.ts`:
```ts
export interface AdditionProblem {
  a: number;
  b: number;
  choices: number[];
}

export function generateAddition(rng: () => number = Math.random): AdditionProblem {
  const a = Math.floor(rng() * 9) + 1; // 1..9
  const b = Math.floor(rng() * Math.min(9, 20 - a)) + 1;
  const answer = a + b;
  const choices = new Set<number>([answer]);
  while (choices.size < 3) {
    const c = Math.floor(rng() * 19) + 2; // 2..20
    if (c !== answer) choices.add(c);
  }
  return { a, b, choices: [...choices].sort(() => rng() - 0.5) };
}

export function checkAddition(p: AdditionProblem, chosen: number): boolean {
  return chosen === p.a + p.b;
}
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npx vitest run tests/lib/math/addition.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/math/addition.ts tests/lib/math/addition.test.ts
git commit -m "feat: addition math logic (TDD)"
```

---

### Task 3: ひきざんロジック（subtraction.ts）

**Files:**
- Create: `src/lib/math/subtraction.ts`
- Test: `tests/lib/math/subtraction.test.ts`

- [ ] **Step 1: 失敗するテストを書く**

`tests/lib/math/subtraction.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { generateSubtraction, checkSubtraction, type SubtractionProblem } from '../../../src/lib/math/subtraction';

describe('generateSubtraction', () => {
  it('a >= b and a >= 1', () => {
    for (let i = 0; i < 20; i++) {
      const p = generateSubtraction();
      expect(p.a).toBeGreaterThanOrEqual(p.b);
      expect(p.a).toBeGreaterThanOrEqual(2);
    }
  });
  it('choices include the correct answer a - b', () => {
    const p = generateSubtraction();
    expect(p.choices).toContain(p.a - p.b);
  });
  it('choices are 3 unique numbers', () => {
    const p = generateSubtraction();
    expect(p.choices).toHaveLength(3);
    expect(new Set(p.choices).size).toBe(3);
  });
});

describe('checkSubtraction', () => {
  it('returns true for correct answer', () => {
    const p: SubtractionProblem = { a: 7, b: 3, choices: [4, 2, 6] };
    expect(checkSubtraction(p, 4)).toBe(true);
  });
  it('returns false for wrong answer', () => {
    const p: SubtractionProblem = { a: 7, b: 3, choices: [4, 2, 6] };
    expect(checkSubtraction(p, 2)).toBe(false);
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx vitest run tests/lib/math/subtraction.test.ts`
Expected: FAIL

- [ ] **Step 3: subtraction.ts を実装する**

`src/lib/math/subtraction.ts`:
```ts
export interface SubtractionProblem {
  a: number;
  b: number;
  choices: number[];
}

export function generateSubtraction(rng: () => number = Math.random): SubtractionProblem {
  const a = Math.floor(rng() * 9) + 2; // 2..10
  const b = Math.floor(rng() * (a - 1)) + 1; // 1..a-1
  const answer = a - b;
  const choices = new Set<number>([answer]);
  while (choices.size < 3) {
    const c = Math.floor(rng() * 10); // 0..9
    if (c !== answer) choices.add(c);
  }
  return { a, b, choices: [...choices].sort(() => rng() - 0.5) };
}

export function checkSubtraction(p: SubtractionProblem, chosen: number): boolean {
  return chosen === p.a - p.b;
}
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npx vitest run tests/lib/math/subtraction.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/math/subtraction.ts tests/lib/math/subtraction.test.ts
git commit -m "feat: subtraction math logic (TDD)"
```

---

### Task 4: さくらんぼ計算ロジック（cherryCalc.ts）

**Files:**
- Create: `src/lib/math/cherryCalc.ts`
- Test: `tests/lib/math/cherryCalc.test.ts`

繰り上がりのある 1 位数 + 1 位数（答えが 11〜18）の STEP 分解を返す純粋関数。

例: 8 + 5 → split=2, carry=3, step1=10, answer=13

- [ ] **Step 1: 失敗するテストを書く**

`tests/lib/math/cherryCalc.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { decompose, generateCarryProblem, checkCarry, type CarryProblem } from '../../../src/lib/math/cherryCalc';

describe('decompose', () => {
  it('8+5: splits 5 into 2+3 to make 10', () => {
    const d = decompose(8, 5);
    expect(d.split).toBe(2);  // 8 + 2 = 10
    expect(d.carry).toBe(3);  // 5 - 2 = 3
    expect(d.ten).toBe(10);
    expect(d.answer).toBe(13);
  });
  it('9+4: splits 4 into 1+3', () => {
    const d = decompose(9, 4);
    expect(d.split).toBe(1);
    expect(d.carry).toBe(3);
    expect(d.answer).toBe(13);
  });
  it('7+6: splits 6 into 3+3', () => {
    const d = decompose(7, 6);
    expect(d.split).toBe(3);
    expect(d.carry).toBe(3);
    expect(d.answer).toBe(13);
  });
});

describe('generateCarryProblem', () => {
  it('always results in an answer between 11 and 18', () => {
    for (let i = 0; i < 20; i++) {
      const p = generateCarryProblem();
      expect(p.a + p.b).toBeGreaterThanOrEqual(11);
      expect(p.a + p.b).toBeLessThanOrEqual(18);
    }
  });
  it('choices include the correct answer', () => {
    const p = generateCarryProblem();
    expect(p.choices).toContain(p.a + p.b);
  });
});

describe('checkCarry', () => {
  it('returns true for correct answer', () => {
    const p: CarryProblem = { a: 8, b: 5, choices: [13, 12, 14] };
    expect(checkCarry(p, 13)).toBe(true);
  });
  it('returns false for wrong answer', () => {
    const p: CarryProblem = { a: 8, b: 5, choices: [13, 12, 14] };
    expect(checkCarry(p, 12)).toBe(false);
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx vitest run tests/lib/math/cherryCalc.test.ts`
Expected: FAIL

- [ ] **Step 3: cherryCalc.ts を実装する**

`src/lib/math/cherryCalc.ts`:
```ts
export interface Decomposition {
  a: number;
  b: number;
  split: number;  // b のうち a に足して 10 にする量（a + split = 10）
  carry: number;  // b - split（10 を超えた分）
  ten: number;    // 常に 10
  answer: number; // a + b
}

export interface CarryProblem {
  a: number;
  b: number;
  choices: number[];
}

/** a + b のさくらんぼ分解を返す（a + b > 10 の前提） */
export function decompose(a: number, b: number): Decomposition {
  const split = 10 - a;
  return {
    a,
    b,
    split,
    carry: b - split,
    ten: 10,
    answer: a + b,
  };
}

export function generateCarryProblem(rng: () => number = Math.random): CarryProblem {
  let a: number, b: number;
  do {
    a = Math.floor(rng() * 4) + 6; // 6..9
    b = Math.floor(rng() * 4) + 2; // 2..9（実際には a+b>10 を保証するため下でフィルタ）
  } while (a + b <= 10 || a + b > 18);
  const answer = a + b;
  const choices = new Set<number>([answer]);
  while (choices.size < 3) {
    const c = Math.floor(rng() * 8) + 11; // 11..18
    if (c !== answer) choices.add(c);
  }
  return { a, b, choices: [...choices].sort(() => rng() - 0.5) };
}

export function checkCarry(p: CarryProblem, chosen: number): boolean {
  return chosen === p.a + p.b;
}
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npx vitest run tests/lib/math/cherryCalc.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/math/cherryCalc.ts tests/lib/math/cherryCalc.test.ts
git commit -m "feat: cherry-calc (carry addition) math logic (TDD)"
```

---

### Task 5: 二桁のたしざん・ひきざんロジック

**Files:**
- Create: `src/lib/math/bigAddition.ts`, `src/lib/math/bigSubtraction.ts`
- Test: `tests/lib/math/bigAddition.test.ts`, `tests/lib/math/bigSubtraction.test.ts`

- [ ] **Step 1: bigAddition のテストを書く**

`tests/lib/math/bigAddition.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { generateBigAddition, checkBigAddition } from '../../../src/lib/math/bigAddition';

describe('generateBigAddition', () => {
  it('a and b are 2-digit numbers (10..99)', () => {
    for (let i = 0; i < 20; i++) {
      const p = generateBigAddition();
      expect(p.a).toBeGreaterThanOrEqual(10);
      expect(p.a).toBeLessThanOrEqual(99);
      expect(p.b).toBeGreaterThanOrEqual(10);
    }
  });
  it('choices include the correct answer', () => {
    const p = generateBigAddition();
    expect(p.choices).toContain(p.a + p.b);
  });
  it('provides decomposition for cherry-calc visualization', () => {
    const p = generateBigAddition();
    const { onesA, onesB, tensA, tensB } = p;
    expect(onesA + tensA * 10).toBe(p.a);
    expect(onesB + tensB * 10).toBe(p.b);
  });
});

describe('checkBigAddition', () => {
  it('returns true for correct answer', () => {
    const p = { a: 28, b: 15, choices: [43, 42, 44], onesA: 8, onesB: 5, tensA: 2, tensB: 1 };
    expect(checkBigAddition(p, 43)).toBe(true);
  });
});
```

- [ ] **Step 2: bigSubtraction のテストを書く**

`tests/lib/math/bigSubtraction.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { generateBigSubtraction, checkBigSubtraction } from '../../../src/lib/math/bigSubtraction';

describe('generateBigSubtraction', () => {
  it('a > b and both 2-digit', () => {
    for (let i = 0; i < 20; i++) {
      const p = generateBigSubtraction();
      expect(p.a).toBeGreaterThan(p.b);
      expect(p.a - p.b).toBeGreaterThanOrEqual(1);
    }
  });
  it('choices include the correct answer', () => {
    const p = generateBigSubtraction();
    expect(p.choices).toContain(p.a - p.b);
  });
});
```

- [ ] **Step 3: テストが失敗することを確認**

Run: `npx vitest run tests/lib/math/bigAddition.test.ts tests/lib/math/bigSubtraction.test.ts`
Expected: FAIL（未定義）

- [ ] **Step 4: bigAddition.ts を実装する**

`src/lib/math/bigAddition.ts`:
```ts
export interface BigAdditionProblem {
  a: number;
  b: number;
  onesA: number;
  onesB: number;
  tensA: number;
  tensB: number;
  choices: number[];
}

export function generateBigAddition(rng: () => number = Math.random): BigAdditionProblem {
  const a = Math.floor(rng() * 40) + 10; // 10..49
  const b = Math.floor(rng() * 40) + 10; // 10..49
  const answer = a + b;
  const onesA = a % 10;
  const tensA = Math.floor(a / 10);
  const onesB = b % 10;
  const tensB = Math.floor(b / 10);
  const choices = new Set<number>([answer]);
  while (choices.size < 3) {
    const c = answer + (Math.floor(rng() * 10) - 5);
    if (c > 0 && c !== answer) choices.add(c);
  }
  return { a, b, onesA, onesB, tensA, tensB, choices: [...choices].sort(() => rng() - 0.5) };
}

export function checkBigAddition(p: BigAdditionProblem, chosen: number): boolean {
  return chosen === p.a + p.b;
}
```

- [ ] **Step 5: bigSubtraction.ts を実装する**

`src/lib/math/bigSubtraction.ts`:
```ts
export interface BigSubtractionProblem {
  a: number;
  b: number;
  onesA: number;
  onesB: number;
  tensA: number;
  tensB: number;
  choices: number[];
}

export function generateBigSubtraction(rng: () => number = Math.random): BigSubtractionProblem {
  const b = Math.floor(rng() * 40) + 10; // 10..49
  const a = b + Math.floor(rng() * 40) + 1; // b+1..b+40
  const answer = a - b;
  const onesA = a % 10;
  const tensA = Math.floor(a / 10);
  const onesB = b % 10;
  const tensB = Math.floor(b / 10);
  const choices = new Set<number>([answer]);
  while (choices.size < 3) {
    const c = Math.max(1, answer + (Math.floor(rng() * 10) - 5));
    if (c !== answer) choices.add(c);
  }
  return { a, b, onesA, onesB, tensA, tensB, choices: [...choices].sort(() => rng() - 0.5) };
}

export function checkBigSubtraction(p: BigSubtractionProblem, chosen: number): boolean {
  return chosen === p.a - p.b;
}
```

- [ ] **Step 6: テストが通ることを確認**

Run: `npx vitest run tests/lib/math/bigAddition.test.ts tests/lib/math/bigSubtraction.test.ts`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/lib/math/bigAddition.ts src/lib/math/bigSubtraction.ts tests/lib/math/bigAddition.test.ts tests/lib/math/bigSubtraction.test.ts
git commit -m "feat: 2-digit addition/subtraction math logic (TDD)"
```

---

### Task 6: かけ算・わり算ロジック

**Files:**
- Create: `src/lib/math/multiplication.ts`, `src/lib/math/division.ts`
- Test: `tests/lib/math/multiplication.test.ts`, `tests/lib/math/division.test.ts`

- [ ] **Step 1: かけ算のテストを書く**

`tests/lib/math/multiplication.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { generateMultiplication, checkMultiplication } from '../../../src/lib/math/multiplication';

describe('generateMultiplication', () => {
  it('a and b are 2..9', () => {
    for (let i = 0; i < 20; i++) {
      const p = generateMultiplication();
      expect(p.a).toBeGreaterThanOrEqual(2);
      expect(p.a).toBeLessThanOrEqual(9);
      expect(p.b).toBeGreaterThanOrEqual(2);
      expect(p.b).toBeLessThanOrEqual(9);
    }
  });
  it('choices include a * b', () => {
    const p = generateMultiplication();
    expect(p.choices).toContain(p.a * p.b);
  });
  it('groups array has length a (b items each)', () => {
    const p = generateMultiplication();
    expect(p.groups).toHaveLength(p.a);
    p.groups.forEach((g) => expect(g).toBe(p.b));
  });
});

describe('checkMultiplication', () => {
  it('correct', () => {
    const p = { a: 3, b: 4, groups: [4, 4, 4], choices: [12, 10, 14] };
    expect(checkMultiplication(p, 12)).toBe(true);
  });
  it('wrong', () => {
    const p = { a: 3, b: 4, groups: [4, 4, 4], choices: [12, 10, 14] };
    expect(checkMultiplication(p, 10)).toBe(false);
  });
});
```

- [ ] **Step 2: わり算のテストを書く**

`tests/lib/math/division.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { generateDivision, checkDivision } from '../../../src/lib/math/division';

describe('generateDivision', () => {
  it('dividend = divisor * quotient (no remainder)', () => {
    for (let i = 0; i < 20; i++) {
      const p = generateDivision();
      expect(p.dividend).toBe(p.divisor * p.quotient);
    }
  });
  it('choices include the quotient', () => {
    const p = generateDivision();
    expect(p.choices).toContain(p.quotient);
  });
});

describe('generateDivision remainder', () => {
  it('remainder variant: dividend = divisor * quotient + remainder', () => {
    const p = generateDivision(Math.random, true);
    expect(p.dividend).toBe(p.divisor * p.quotient + (p.remainder ?? 0));
    expect((p.remainder ?? 0)).toBeGreaterThanOrEqual(0);
    expect((p.remainder ?? 0)).toBeLessThan(p.divisor);
  });
});

describe('checkDivision', () => {
  it('correct quotient', () => {
    const p = { dividend: 12, divisor: 3, quotient: 4, remainder: 0, choices: [4, 3, 5] };
    expect(checkDivision(p, 4)).toBe(true);
  });
  it('wrong', () => {
    const p = { dividend: 12, divisor: 3, quotient: 4, remainder: 0, choices: [4, 3, 5] };
    expect(checkDivision(p, 3)).toBe(false);
  });
});
```

- [ ] **Step 3: テストが失敗することを確認**

Run: `npx vitest run tests/lib/math/multiplication.test.ts tests/lib/math/division.test.ts`
Expected: FAIL

- [ ] **Step 4: multiplication.ts を実装する**

`src/lib/math/multiplication.ts`:
```ts
export interface MultiplicationProblem {
  a: number;
  b: number;
  groups: number[]; // 長さ a の配列、各要素は b（視覚化用）
  choices: number[];
}

export function generateMultiplication(rng: () => number = Math.random): MultiplicationProblem {
  const a = Math.floor(rng() * 8) + 2; // 2..9
  const b = Math.floor(rng() * 8) + 2; // 2..9
  const answer = a * b;
  const choices = new Set<number>([answer]);
  while (choices.size < 3) {
    const c = Math.max(1, answer + (Math.floor(rng() * 10) - 5));
    if (c !== answer) choices.add(c);
  }
  return {
    a,
    b,
    groups: Array(a).fill(b),
    choices: [...choices].sort(() => rng() - 0.5),
  };
}

export function checkMultiplication(p: MultiplicationProblem, chosen: number): boolean {
  return chosen === p.a * p.b;
}
```

- [ ] **Step 5: division.ts を実装する**

`src/lib/math/division.ts`:
```ts
export interface DivisionProblem {
  dividend: number;
  divisor: number;
  quotient: number;
  remainder: number;
  choices: number[];
}

export function generateDivision(
  rng: () => number = Math.random,
  withRemainder = false,
): DivisionProblem {
  const divisor = Math.floor(rng() * 7) + 2; // 2..8
  const quotient = Math.floor(rng() * 8) + 2; // 2..9
  const remainder = withRemainder ? Math.floor(rng() * (divisor - 1)) : 0;
  const dividend = divisor * quotient + remainder;
  const choices = new Set<number>([quotient]);
  while (choices.size < 3) {
    const c = Math.max(1, quotient + (Math.floor(rng() * 6) - 3));
    if (c !== quotient) choices.add(c);
  }
  return {
    dividend,
    divisor,
    quotient,
    remainder,
    choices: [...choices].sort(() => rng() - 0.5),
  };
}

export function checkDivision(p: DivisionProblem, chosen: number): boolean {
  return chosen === p.quotient;
}
```

- [ ] **Step 6: テストが通ることを確認**

Run: `npx vitest run tests/lib/math/multiplication.test.ts tests/lib/math/division.test.ts`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/lib/math/multiplication.ts src/lib/math/division.ts tests/lib/math/multiplication.test.ts tests/lib/math/division.test.ts
git commit -m "feat: multiplication and division math logic (TDD)"
```

---

### Task 7: 全単元データを units.ts に追加

**Files:**
- Modify: `src/data/units.ts`（全置換）

- [ ] **Step 1: units.ts を更新する**

`src/data/units.ts` を全置換:
```ts
export interface UnitMeta {
  id: string;
  title: string;
  grade: string;
  curriculum: string;
  emoji: string;
}

export const UNITS: UnitMeta[] = [
  {
    id: 'make-ten',
    title: '10をつくる',
    grade: '年長〜小1',
    curriculum: '小1：10の合成・分解、加法の素地',
    emoji: '🔟',
  },
  {
    id: 'addition',
    title: 'たしざん',
    grade: '小1',
    curriculum: '小1：加法（1位数±1位数）',
    emoji: '➕',
  },
  {
    id: 'subtraction',
    title: 'ひきざん',
    grade: '小1',
    curriculum: '小1：減法（1位数±1位数）',
    emoji: '➖',
  },
  {
    id: 'cherry-calc',
    title: 'さくらんぼ計算',
    grade: '小1〜小2',
    curriculum: '小1：繰り上がりのある加法',
    emoji: '🍒',
  },
  {
    id: 'big-addition',
    title: '二桁のたしざん',
    grade: '小2',
    curriculum: '小2：加法（2位数）、繰り上がり',
    emoji: '🔢',
  },
  {
    id: 'big-subtraction',
    title: '二桁のひきざん',
    grade: '小2',
    curriculum: '小2：減法（2位数）、繰り下がり',
    emoji: '🔣',
  },
  {
    id: 'multiplication',
    title: 'かけ算',
    grade: '小2〜小3',
    curriculum: '小2：乗法の意味、九九',
    emoji: '✖️',
  },
  {
    id: 'division',
    title: 'わり算',
    grade: '小3',
    curriculum: '小3：除法、余りのある除法',
    emoji: '➗',
  },
];

export function getUnit(id: string): UnitMeta | undefined {
  return UNITS.find((u) => u.id === id);
}
```

- [ ] **Step 2: 型チェック確認**

Run: `npx tsc --noEmit`
Expected: エラーなし

- [ ] **Step 3: Commit**

```bash
git add src/data/units.ts
git commit -m "feat: add all units to unit data (addition through division)"
```

---

### Task 8: さくらんぼ計算コンポーネント（CherryBranch + StepIndicator）

**Files:**
- Create: `src/components/CherryBranch.tsx`
- Create: `src/components/StepIndicator.tsx`

- [ ] **Step 1: CherryBranch.tsx を実装する**

`src/components/CherryBranch.tsx`:
```tsx
import { motion } from 'framer-motion';

interface Props {
  b: number;       // 分解する数（さくらんぼの親）
  split: number;   // 左（a に足して 10 にする量）
  carry: number;   // 右（余り）
  visible: boolean;
}

export function CherryBranch({ b, split, carry, visible }: Props) {
  return (
    <div className="flex flex-col items-center gap-1 select-none">
      {/* 親の数 */}
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-pink-200 text-2xl font-bold text-pink-800 border-2 border-pink-400">
        {b}
      </div>

      {/* 枝 SVG */}
      <svg width="100" height="40" viewBox="0 0 100 40">
        <motion.line
          x1="50" y1="0" x2="20" y2="40"
          stroke="#e91e63" strokeWidth="3" strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: visible ? 1 : 0 }}
          transition={{ duration: 0.4 }}
        />
        <motion.line
          x1="50" y1="0" x2="80" y2="40"
          stroke="#e91e63" strokeWidth="3" strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: visible ? 1 : 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        />
      </svg>

      {/* さくらんぼ（左：split、右：carry） */}
      <div className="flex gap-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: visible ? 1 : 0 }}
          transition={{ type: 'spring', delay: 0.3 }}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-red-400 text-2xl font-bold text-white border-2 border-red-600"
        >
          {split}
        </motion.div>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: visible ? 1 : 0 }}
          transition={{ type: 'spring', delay: 0.45 }}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-red-400 text-2xl font-bold text-white border-2 border-red-600"
        >
          {carry}
        </motion.div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: StepIndicator.tsx を実装する**

`src/components/StepIndicator.tsx`:
```tsx
interface Props {
  total: number;
  current: number; // 0-indexed
}

export function StepIndicator({ total, current }: Props) {
  return (
    <div className="flex gap-2 items-center">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={
            'rounded-full transition-all duration-300 ' +
            (i < current
              ? 'w-4 h-4 bg-green-400'
              : i === current
              ? 'w-5 h-5 bg-blue-500 ring-2 ring-blue-300'
              : 'w-4 h-4 bg-gray-200')
          }
        />
      ))}
    </div>
  );
}
```

- [ ] **Step 3: 型チェック確認**

Run: `npx tsc --noEmit`
Expected: エラーなし

- [ ] **Step 4: Commit**

```bash
git add src/components/CherryBranch.tsx src/components/StepIndicator.tsx
git commit -m "feat: CherryBranch SVG and StepIndicator components"
```

---

### Task 9: たしざん・ひきざん画面

**Files:**
- Create: `src/screens/AdditionUnit.tsx`
- Create: `src/screens/SubtractionUnit.tsx`

共通パターン：問題生成 → 選択 → 正解/不正解フィードバック → 3問クリアでスタンプ

- [ ] **Step 1: AdditionUnit.tsx を実装する**

`src/screens/AdditionUnit.tsx`:
```tsx
import { useMemo, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import { Companion } from '../features/character/Companion';
import { AnswerButtons } from '../components/AnswerButtons';
import { generateAddition, checkAddition, type AdditionProblem } from '../lib/math/addition';
import { playSfx } from '../features/sound/sfx';
import { speakJa } from '../features/speech/tts';
import { loadJson, saveJson } from '../lib/storage';
import { addStamp, EMPTY_STAMPS, type StampState } from '../features/rewards/stamps';
import { recordAnswer, loadMastery, saveMastery } from '../lib/mastery';

const QUESTIONS_PER_UNIT = 3;
const STAMP_KEY = 'math-app:stamps';
const SKILL_ID = 'addition';

const ANIMALS = ['🐱', '🐶', '🐸', '🐼', '🦊'];

interface Props {
  characterName: string;
  onExit: () => void;
}

function randomAnimal(): string {
  return ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
}

export function AdditionUnit({ characterName, onExit }: Props) {
  const [problem, setProblem] = useState<AdditionProblem>(() => generateAddition());
  const [animal] = useState(randomAnimal);
  const [solved, setSolved] = useState(0);
  const [expression, setExpression] = useState<'normal' | 'happy' | 'hint'>('normal');
  const [feedback, setFeedback] = useState<'none' | 'wrong'>('none');
  const cleared = solved >= QUESTIONS_PER_UNIT;
  const processing = useRef(false);

  function handlePick(value: number) {
    if (processing.current) return;
    processing.current = true;
    playSfx('tap');
    const correct = checkAddition(problem, value);
    const mastery = loadMastery();
    saveMastery(recordAnswer(mastery, SKILL_ID, correct, Date.now()));
    if (correct) {
      playSfx('correct');
      setExpression('happy');
      confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
      const nextSolved = solved + 1;
      setSolved(nextSolved);
      setFeedback('none');
      if (nextSolved >= QUESTIONS_PER_UNIT) {
        const stamps = loadJson<StampState>(STAMP_KEY, EMPTY_STAMPS);
        saveJson(STAMP_KEY, addStamp(stamps, SKILL_ID, Date.now()));
        playSfx('fanfare');
        speakJa('クリア！ よくできたね！');
      } else {
        setTimeout(() => {
          setExpression('normal');
          setProblem(generateAddition());
          processing.current = false;
        }, 900);
      }
    } else {
      playSfx('wrong');
      setFeedback('wrong');
      setExpression('hint');
      speakJa('おしい！ もういちど やってみよう');
      processing.current = false;
    }
  }

  if (cleared) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gradient-to-b from-sky-200 to-amber-50 p-8">
        <motion.div initial={{ scale: 0 }} animate={{ scale: [0, 1.2, 1] }} className="text-7xl">🎉</motion.div>
        <p className="text-2xl font-bold text-green-700">クリア！ スタンプ ゲット！</p>
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5, type: 'spring', stiffness: 300 }} className="text-5xl">⭐</motion.div>
        <button type="button" onClick={onExit} className="rounded-2xl bg-blue-500 px-8 py-4 text-2xl font-bold text-white shadow-[0_5px_0_#1565c0] active:translate-y-1 transition-all">
          ホームに もどる
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center gap-6 bg-gradient-to-b from-sky-200 to-amber-50 p-6">
      <div className="self-stretch text-sm text-amber-700 font-bold">
        といた かず: {solved} / {QUESTIONS_PER_UNIT}
      </div>
      <Companion
        name={characterName}
        expression={expression}
        message={`${animal}が ${problem.a}ひき。${problem.b}ひき きたよ。ぜんぶで なんびき？`}
      />
      <div className="rounded-3xl bg-white shadow-lg px-10 py-6 text-5xl font-bold text-amber-900">
        {problem.a} ＋ {problem.b} ＝ ？
      </div>
      <AnswerButtons choices={problem.choices} onPick={handlePick} disabled={expression === 'happy'} />
      <AnimatePresence>
        {feedback === 'wrong' && (
          <motion.p key="wrong" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: [0, -8, 8, -4, 0] }} exit={{ opacity: 0 }} className="text-lg font-bold text-orange-600">
            おしい！ もういちど！
          </motion.p>
        )}
      </AnimatePresence>
      <button type="button" onClick={onExit} className="mt-4 text-sm text-amber-600 underline">やめる</button>
    </div>
  );
}
```

- [ ] **Step 2: SubtractionUnit.tsx を実装する**

`src/screens/SubtractionUnit.tsx`:
```tsx
import { useMemo, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import { Companion } from '../features/character/Companion';
import { AnswerButtons } from '../components/AnswerButtons';
import { generateSubtraction, checkSubtraction, type SubtractionProblem } from '../lib/math/subtraction';
import { playSfx } from '../features/sound/sfx';
import { speakJa } from '../features/speech/tts';
import { loadJson, saveJson } from '../lib/storage';
import { addStamp, EMPTY_STAMPS, type StampState } from '../features/rewards/stamps';
import { recordAnswer, loadMastery, saveMastery } from '../lib/mastery';

const QUESTIONS_PER_UNIT = 3;
const STAMP_KEY = 'math-app:stamps';
const SKILL_ID = 'subtraction';

const FOODS = ['🍪', '🍬', '🍭', '🍩', '🍰'];

interface Props {
  characterName: string;
  onExit: () => void;
}

export function SubtractionUnit({ characterName, onExit }: Props) {
  const [problem, setProblem] = useState<SubtractionProblem>(() => generateSubtraction());
  const [food] = useState(() => FOODS[Math.floor(Math.random() * FOODS.length)]);
  const [solved, setSolved] = useState(0);
  const [expression, setExpression] = useState<'normal' | 'happy' | 'hint'>('normal');
  const [feedback, setFeedback] = useState<'none' | 'wrong'>('none');
  const cleared = solved >= QUESTIONS_PER_UNIT;
  const processing = useRef(false);

  function handlePick(value: number) {
    if (processing.current) return;
    processing.current = true;
    playSfx('tap');
    const correct = checkSubtraction(problem, value);
    const mastery = loadMastery();
    saveMastery(recordAnswer(mastery, SKILL_ID, correct, Date.now()));
    if (correct) {
      playSfx('correct');
      setExpression('happy');
      confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
      const nextSolved = solved + 1;
      setSolved(nextSolved);
      setFeedback('none');
      if (nextSolved >= QUESTIONS_PER_UNIT) {
        const stamps = loadJson<StampState>(STAMP_KEY, EMPTY_STAMPS);
        saveJson(STAMP_KEY, addStamp(stamps, SKILL_ID, Date.now()));
        playSfx('fanfare');
        speakJa('クリア！ よくできたね！');
      } else {
        setTimeout(() => {
          setExpression('normal');
          setProblem(generateSubtraction());
          processing.current = false;
        }, 900);
      }
    } else {
      playSfx('wrong');
      setFeedback('wrong');
      setExpression('hint');
      speakJa('おしい！ もういちど やってみよう');
      processing.current = false;
    }
  }

  if (cleared) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gradient-to-b from-sky-200 to-amber-50 p-8">
        <motion.div initial={{ scale: 0 }} animate={{ scale: [0, 1.2, 1] }} className="text-7xl">🎉</motion.div>
        <p className="text-2xl font-bold text-green-700">クリア！ スタンプ ゲット！</p>
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5, type: 'spring', stiffness: 300 }} className="text-5xl">⭐</motion.div>
        <button type="button" onClick={onExit} className="rounded-2xl bg-blue-500 px-8 py-4 text-2xl font-bold text-white shadow-[0_5px_0_#1565c0] active:translate-y-1 transition-all">
          ホームに もどる
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center gap-6 bg-gradient-to-b from-sky-200 to-amber-50 p-6">
      <div className="self-stretch text-sm text-amber-700 font-bold">
        といた かず: {solved} / {QUESTIONS_PER_UNIT}
      </div>
      <Companion
        name={characterName}
        expression={expression}
        message={`${food}が ${problem.a}こ あるよ。${problem.b}こ たべたら のこりは なんこ？`}
      />
      <div className="rounded-3xl bg-white shadow-lg px-10 py-6 text-5xl font-bold text-amber-900">
        {problem.a} ー {problem.b} ＝ ？
      </div>
      <AnswerButtons choices={problem.choices} onPick={handlePick} disabled={expression === 'happy'} />
      <AnimatePresence>
        {feedback === 'wrong' && (
          <motion.p key="wrong" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: [0, -8, 8, -4, 0] }} exit={{ opacity: 0 }} className="text-lg font-bold text-orange-600">
            おしい！ もういちど！
          </motion.p>
        )}
      </AnimatePresence>
      <button type="button" onClick={onExit} className="mt-4 text-sm text-amber-600 underline">やめる</button>
    </div>
  );
}
```

- [ ] **Step 3: 型チェック確認**

Run: `npx tsc --noEmit`
Expected: エラーなし

- [ ] **Step 4: Commit**

```bash
git add src/screens/AdditionUnit.tsx src/screens/SubtractionUnit.tsx
git commit -m "feat: addition and subtraction unit screens with mastery tracking"
```

---

### Task 10: さくらんぼ計算 STEP 画面（CherryCalcUnit.tsx）

**Files:**
- Create: `src/screens/CherryCalcUnit.tsx`

STEP1〜4 を「つぎへ」ボタンで順番に展開し、最後に答え選択。

- [ ] **Step 1: CherryCalcUnit.tsx を実装する**

`src/screens/CherryCalcUnit.tsx`:
```tsx
import { useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import { Companion } from '../features/character/Companion';
import { AnswerButtons } from '../components/AnswerButtons';
import { MakeTenFrame } from '../components/MakeTenFrame';
import { CherryBranch } from '../components/CherryBranch';
import { StepIndicator } from '../components/StepIndicator';
import { generateCarryProblem, checkCarry, decompose, type CarryProblem } from '../lib/math/cherryCalc';
import { playSfx } from '../features/sound/sfx';
import { speakJa } from '../features/speech/tts';
import { loadJson, saveJson } from '../lib/storage';
import { addStamp, EMPTY_STAMPS, type StampState } from '../features/rewards/stamps';
import { recordAnswer, loadMastery, saveMastery } from '../lib/mastery';

const QUESTIONS_PER_UNIT = 3;
const STAMP_KEY = 'math-app:stamps';
const SKILL_ID = 'cherry-calc';

interface Props {
  characterName: string;
  onExit: () => void;
}

export function CherryCalcUnit({ characterName, onExit }: Props) {
  const [problem, setProblem] = useState<CarryProblem>(() => generateCarryProblem());
  const [solved, setSolved] = useState(0);
  const [step, setStep] = useState(0); // 0=STEP1説明, 1=STEP2分解, 2=STEP3+2=10, 3=STEP4答え選択
  const [expression, setExpression] = useState<'normal' | 'happy' | 'hint'>('normal');
  const [feedback, setFeedback] = useState<'none' | 'wrong'>('none');
  const [flash, setFlash] = useState(false);
  const cleared = solved >= QUESTIONS_PER_UNIT;
  const processing = useRef(false);
  const d = decompose(problem.a, problem.b);

  const STEP_MESSAGES = [
    `${problem.a} に あと いくつ たせば 10 になるかな？`,
    `${problem.b} を ${d.split} と ${d.carry} に わけよう！`,
    `${problem.a} ＋ ${d.split} ＝ 10 になったよ！`,
    `10 ＋ ${d.carry} ＝ ？ こたえを えらんでね！`,
  ];

  function handleNext() {
    playSfx('tap');
    setStep((s) => Math.min(s + 1, 3));
  }

  function handlePick(value: number) {
    if (processing.current) return;
    processing.current = true;
    playSfx('tap');
    const correct = checkCarry(problem, value);
    const mastery = loadMastery();
    saveMastery(recordAnswer(mastery, SKILL_ID, correct, Date.now()));
    if (correct) {
      playSfx('correct');
      setExpression('happy');
      setFlash(true);
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      const nextSolved = solved + 1;
      setSolved(nextSolved);
      setFeedback('none');
      if (nextSolved >= QUESTIONS_PER_UNIT) {
        const stamps = loadJson<StampState>(STAMP_KEY, EMPTY_STAMPS);
        saveJson(STAMP_KEY, addStamp(stamps, SKILL_ID, Date.now()));
        playSfx('fanfare');
        speakJa('クリア！ よくできたね！');
      } else {
        setTimeout(() => {
          setExpression('normal');
          setFlash(false);
          setProblem(generateCarryProblem());
          setStep(0);
          processing.current = false;
        }, 900);
      }
    } else {
      playSfx('wrong');
      setFeedback('wrong');
      setExpression('hint');
      speakJa('おしい！ もういちど やってみよう');
      processing.current = false;
    }
  }

  if (cleared) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gradient-to-b from-sky-200 to-amber-50 p-8">
        <motion.div initial={{ scale: 0 }} animate={{ scale: [0, 1.2, 1] }} className="text-7xl">🎉</motion.div>
        <p className="text-2xl font-bold text-green-700">クリア！ スタンプ ゲット！</p>
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5, type: 'spring', stiffness: 300 }} className="text-5xl">⭐</motion.div>
        <button type="button" onClick={onExit} className="rounded-2xl bg-blue-500 px-8 py-4 text-2xl font-bold text-white shadow-[0_5px_0_#1565c0] active:translate-y-1 transition-all">
          ホームに もどる
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center gap-4 bg-gradient-to-b from-sky-200 to-amber-50 p-6">
      <div className="flex w-full items-center justify-between">
        <div className="text-sm text-amber-700 font-bold">
          といた かず: {solved} / {QUESTIONS_PER_UNIT}
        </div>
        <StepIndicator total={4} current={step} />
      </div>

      <Companion
        name={characterName}
        expression={expression}
        message={STEP_MESSAGES[step]}
      />

      {/* 問題 */}
      <div className="rounded-3xl bg-white shadow-lg px-8 py-4 text-4xl font-bold text-amber-900">
        {problem.a} ＋ {problem.b} ＝ ？
      </div>

      {/* STEP 1: 10マスフレームで a を表示 */}
      <MakeTenFrame filled={problem.a} flash={flash} />

      {/* STEP 2: さくらんぼ分解 */}
      {step >= 1 && (
        <AnimatePresence>
          <motion.div key="cherry" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <CherryBranch b={problem.b} split={d.split} carry={d.carry} visible />
          </motion.div>
        </AnimatePresence>
      )}

      {/* STEP 3: a + split = 10 表示 */}
      {step >= 2 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-2xl bg-green-100 px-6 py-3 text-2xl font-bold text-green-800"
        >
          {problem.a} ＋ {d.split} ＝ 10 🎉
        </motion.div>
      )}

      {/* STEP 4: 答え選択 */}
      {step >= 3 ? (
        <>
          <AnswerButtons choices={problem.choices} onPick={handlePick} disabled={expression === 'happy'} />
          <AnimatePresence>
            {feedback === 'wrong' && (
              <motion.p key="wrong" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: [0, -8, 8, -4, 0] }} exit={{ opacity: 0 }} className="text-lg font-bold text-orange-600">
                おしい！ もういちど！
              </motion.p>
            )}
          </AnimatePresence>
        </>
      ) : (
        <button
          type="button"
          onClick={handleNext}
          className="rounded-2xl bg-blue-500 px-8 py-3 text-xl font-bold text-white shadow-[0_4px_0_#1565c0] active:translate-y-1 transition-all"
        >
          つぎへ →
        </button>
      )}

      <button type="button" onClick={onExit} className="mt-2 text-sm text-amber-600 underline">やめる</button>
    </div>
  );
}
```

- [ ] **Step 2: 型チェック確認**

Run: `npx tsc --noEmit`
Expected: エラーなし

- [ ] **Step 3: Commit**

```bash
git add src/screens/CherryCalcUnit.tsx
git commit -m "feat: cherry-calc STEP decomposition screen"
```

---

### Task 11: 残り単元画面（二桁・かけ算・わり算）

**Files:**
- Create: `src/screens/BigAdditionUnit.tsx`
- Create: `src/screens/BigSubtractionUnit.tsx`
- Create: `src/screens/MultiplicationUnit.tsx`
- Create: `src/screens/DivisionUnit.tsx`

- [ ] **Step 1: BigAdditionUnit.tsx を実装する**

`src/screens/BigAdditionUnit.tsx`:
```tsx
import { useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import { Companion } from '../features/character/Companion';
import { AnswerButtons } from '../components/AnswerButtons';
import { StepIndicator } from '../components/StepIndicator';
import { generateBigAddition, checkBigAddition, type BigAdditionProblem } from '../lib/math/bigAddition';
import { playSfx } from '../features/sound/sfx';
import { speakJa } from '../features/speech/tts';
import { loadJson, saveJson } from '../lib/storage';
import { addStamp, EMPTY_STAMPS, type StampState } from '../features/rewards/stamps';
import { recordAnswer, loadMastery, saveMastery } from '../lib/mastery';

const QUESTIONS_PER_UNIT = 3;
const STAMP_KEY = 'math-app:stamps';
const SKILL_ID = 'big-addition';

interface Props { characterName: string; onExit: () => void; }

export function BigAdditionUnit({ characterName, onExit }: Props) {
  const [problem, setProblem] = useState<BigAdditionProblem>(() => generateBigAddition());
  const [solved, setSolved] = useState(0);
  const [step, setStep] = useState(0);
  const [expression, setExpression] = useState<'normal' | 'happy' | 'hint'>('normal');
  const [feedback, setFeedback] = useState<'none' | 'wrong'>('none');
  const cleared = solved >= QUESTIONS_PER_UNIT;
  const processing = useRef(false);
  const onesSum = problem.onesA + problem.onesB;
  const carry = onesSum >= 10 ? 1 : 0;

  const STEPS = [
    `${problem.a} ＋ ${problem.b} を けたごとに わけよう！`,
    `いちのくらい: ${problem.onesA} ＋ ${problem.onesB} ＝ ${onesSum}${carry ? '（くりあがり！）' : ''}`,
    `こたえを えらんでね！`,
  ];

  function handlePick(value: number) {
    if (processing.current) return;
    processing.current = true;
    playSfx('tap');
    const correct = checkBigAddition(problem, value);
    saveMastery(recordAnswer(loadMastery(), SKILL_ID, correct, Date.now()));
    if (correct) {
      playSfx('correct'); setExpression('happy');
      confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
      const nextSolved = solved + 1; setSolved(nextSolved); setFeedback('none');
      if (nextSolved >= QUESTIONS_PER_UNIT) {
        saveJson(STAMP_KEY, addStamp(loadJson<StampState>(STAMP_KEY, EMPTY_STAMPS), SKILL_ID, Date.now()));
        playSfx('fanfare'); speakJa('クリア！ よくできたね！');
      } else {
        setTimeout(() => { setExpression('normal'); setProblem(generateBigAddition()); setStep(0); processing.current = false; }, 900);
      }
    } else {
      playSfx('wrong'); setFeedback('wrong'); setExpression('hint');
      speakJa('おしい！ もういちど！'); processing.current = false;
    }
  }

  if (cleared) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gradient-to-b from-sky-200 to-amber-50 p-8">
        <motion.div initial={{ scale: 0 }} animate={{ scale: [0, 1.2, 1] }} className="text-7xl">🎉</motion.div>
        <p className="text-2xl font-bold text-green-700">クリア！ スタンプ ゲット！</p>
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5, type: 'spring' }} className="text-5xl">⭐</motion.div>
        <button type="button" onClick={onExit} className="rounded-2xl bg-blue-500 px-8 py-4 text-2xl font-bold text-white shadow-[0_5px_0_#1565c0]">ホームに もどる</button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center gap-4 bg-gradient-to-b from-sky-200 to-amber-50 p-6">
      <div className="flex w-full items-center justify-between">
        <span className="text-sm text-amber-700 font-bold">といた かず: {solved} / {QUESTIONS_PER_UNIT}</span>
        <StepIndicator total={3} current={step} />
      </div>
      <Companion name={characterName} expression={expression} message={STEPS[step]} />
      <div className="rounded-3xl bg-white shadow-lg px-10 py-6 text-5xl font-bold text-amber-900">
        {problem.a} ＋ {problem.b} ＝ ？
      </div>
      {step >= 1 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-blue-50 px-6 py-3 text-xl font-bold text-blue-800">
          いちのくらい: {problem.onesA} ＋ {problem.onesB} ＝ {onesSum}{carry ? ' → くりあがり！' : ''}
        </motion.div>
      )}
      {step >= 2 ? (
        <>
          <AnswerButtons choices={problem.choices} onPick={handlePick} disabled={expression === 'happy'} />
          <AnimatePresence>
            {feedback === 'wrong' && (
              <motion.p key="w" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-lg font-bold text-orange-600">おしい！ もういちど！</motion.p>
            )}
          </AnimatePresence>
        </>
      ) : (
        <button type="button" onClick={() => { playSfx('tap'); setStep((s) => s + 1); }}
          className="rounded-2xl bg-blue-500 px-8 py-3 text-xl font-bold text-white shadow-[0_4px_0_#1565c0]">つぎへ →</button>
      )}
      <button type="button" onClick={onExit} className="mt-2 text-sm text-amber-600 underline">やめる</button>
    </div>
  );
}
```

- [ ] **Step 2: BigSubtractionUnit.tsx を実装する**

`src/screens/BigSubtractionUnit.tsx`:
```tsx
import { useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import { Companion } from '../features/character/Companion';
import { AnswerButtons } from '../components/AnswerButtons';
import { StepIndicator } from '../components/StepIndicator';
import { generateBigSubtraction, checkBigSubtraction, type BigSubtractionProblem } from '../lib/math/bigSubtraction';
import { playSfx } from '../features/sound/sfx';
import { speakJa } from '../features/speech/tts';
import { loadJson, saveJson } from '../lib/storage';
import { addStamp, EMPTY_STAMPS, type StampState } from '../features/rewards/stamps';
import { recordAnswer, loadMastery, saveMastery } from '../lib/mastery';

const QUESTIONS_PER_UNIT = 3;
const STAMP_KEY = 'math-app:stamps';
const SKILL_ID = 'big-subtraction';

interface Props { characterName: string; onExit: () => void; }

export function BigSubtractionUnit({ characterName, onExit }: Props) {
  const [problem, setProblem] = useState<BigSubtractionProblem>(() => generateBigSubtraction());
  const [solved, setSolved] = useState(0);
  const [step, setStep] = useState(0);
  const [expression, setExpression] = useState<'normal' | 'happy' | 'hint'>('normal');
  const [feedback, setFeedback] = useState<'none' | 'wrong'>('none');
  const cleared = solved >= QUESTIONS_PER_UNIT;
  const processing = useRef(false);
  const needsBorrow = problem.onesA < problem.onesB;
  const STEPS = [
    `${problem.a} ー ${problem.b} を けたごとに かんがえよう！`,
    needsBorrow ? `いちのくらい: ${problem.onesA} < ${problem.onesB} なので くりさがり！` : `いちのくらい: ${problem.onesA} ー ${problem.onesB} ＝ ${problem.onesA - problem.onesB}`,
    `こたえを えらんでね！`,
  ];

  function handlePick(value: number) {
    if (processing.current) return;
    processing.current = true;
    playSfx('tap');
    const correct = checkBigSubtraction(problem, value);
    saveMastery(recordAnswer(loadMastery(), SKILL_ID, correct, Date.now()));
    if (correct) {
      playSfx('correct'); setExpression('happy');
      confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
      const nextSolved = solved + 1; setSolved(nextSolved); setFeedback('none');
      if (nextSolved >= QUESTIONS_PER_UNIT) {
        saveJson(STAMP_KEY, addStamp(loadJson<StampState>(STAMP_KEY, EMPTY_STAMPS), SKILL_ID, Date.now()));
        playSfx('fanfare'); speakJa('クリア！ よくできたね！');
      } else {
        setTimeout(() => { setExpression('normal'); setProblem(generateBigSubtraction()); setStep(0); processing.current = false; }, 900);
      }
    } else {
      playSfx('wrong'); setFeedback('wrong'); setExpression('hint');
      speakJa('おしい！ もういちど！'); processing.current = false;
    }
  }

  if (cleared) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gradient-to-b from-sky-200 to-amber-50 p-8">
        <motion.div initial={{ scale: 0 }} animate={{ scale: [0, 1.2, 1] }} className="text-7xl">🎉</motion.div>
        <p className="text-2xl font-bold text-green-700">クリア！ スタンプ ゲット！</p>
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5, type: 'spring' }} className="text-5xl">⭐</motion.div>
        <button type="button" onClick={onExit} className="rounded-2xl bg-blue-500 px-8 py-4 text-2xl font-bold text-white shadow-[0_5px_0_#1565c0]">ホームに もどる</button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center gap-4 bg-gradient-to-b from-sky-200 to-amber-50 p-6">
      <div className="flex w-full items-center justify-between">
        <span className="text-sm text-amber-700 font-bold">といた かず: {solved} / {QUESTIONS_PER_UNIT}</span>
        <StepIndicator total={3} current={step} />
      </div>
      <Companion name={characterName} expression={expression} message={STEPS[step]} />
      <div className="rounded-3xl bg-white shadow-lg px-10 py-6 text-5xl font-bold text-amber-900">
        {problem.a} ー {problem.b} ＝ ？
      </div>
      {step >= 1 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl px-6 py-3 text-xl font-bold ${needsBorrow ? 'bg-orange-100 text-orange-800' : 'bg-blue-50 text-blue-800'}`}>
          {needsBorrow ? `くりさがり: ${problem.onesA + 10} ー ${problem.onesB} ＝ ${problem.onesA + 10 - problem.onesB}` : `いちのくらい: ${problem.onesA} ー ${problem.onesB} ＝ ${problem.onesA - problem.onesB}`}
        </motion.div>
      )}
      {step >= 2 ? (
        <>
          <AnswerButtons choices={problem.choices} onPick={handlePick} disabled={expression === 'happy'} />
          <AnimatePresence>
            {feedback === 'wrong' && (
              <motion.p key="w" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-lg font-bold text-orange-600">おしい！ もういちど！</motion.p>
            )}
          </AnimatePresence>
        </>
      ) : (
        <button type="button" onClick={() => { playSfx('tap'); setStep((s) => s + 1); }}
          className="rounded-2xl bg-blue-500 px-8 py-3 text-xl font-bold text-white shadow-[0_4px_0_#1565c0]">つぎへ →</button>
      )}
      <button type="button" onClick={onExit} className="mt-2 text-sm text-amber-600 underline">やめる</button>
    </div>
  );
}
```

- [ ] **Step 3: MultiplicationUnit.tsx を実装する**

`src/screens/MultiplicationUnit.tsx`:
```tsx
import { useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import { Companion } from '../features/character/Companion';
import { AnswerButtons } from '../components/AnswerButtons';
import { generateMultiplication, checkMultiplication, type MultiplicationProblem } from '../lib/math/multiplication';
import { playSfx } from '../features/sound/sfx';
import { speakJa } from '../features/speech/tts';
import { loadJson, saveJson } from '../lib/storage';
import { addStamp, EMPTY_STAMPS, type StampState } from '../features/rewards/stamps';
import { recordAnswer, loadMastery, saveMastery } from '../lib/mastery';

const QUESTIONS_PER_UNIT = 3;
const STAMP_KEY = 'math-app:stamps';
const SKILL_ID = 'multiplication';

const THINGS = [
  { emoji: '🍩', counter: 'こ' },
  { emoji: '⭐', counter: 'つ' },
  { emoji: '🎈', counter: 'こ' },
  { emoji: '🐟', counter: 'ひき' },
  { emoji: '🌸', counter: 'ほん' },
];

interface Props { characterName: string; onExit: () => void; }

export function MultiplicationUnit({ characterName, onExit }: Props) {
  const [problem, setProblem] = useState<MultiplicationProblem>(() => generateMultiplication());
  const [thing] = useState(() => THINGS[Math.floor(Math.random() * THINGS.length)]);
  const [solved, setSolved] = useState(0);
  const [expression, setExpression] = useState<'normal' | 'happy' | 'hint'>('normal');
  const [feedback, setFeedback] = useState<'none' | 'wrong'>('none');
  const cleared = solved >= QUESTIONS_PER_UNIT;
  const processing = useRef(false);

  function handlePick(value: number) {
    if (processing.current) return;
    processing.current = true;
    playSfx('tap');
    const correct = checkMultiplication(problem, value);
    saveMastery(recordAnswer(loadMastery(), SKILL_ID, correct, Date.now()));
    if (correct) {
      playSfx('correct'); setExpression('happy');
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      const nextSolved = solved + 1; setSolved(nextSolved); setFeedback('none');
      if (nextSolved >= QUESTIONS_PER_UNIT) {
        saveJson(STAMP_KEY, addStamp(loadJson<StampState>(STAMP_KEY, EMPTY_STAMPS), SKILL_ID, Date.now()));
        playSfx('fanfare'); speakJa('クリア！ よくできたね！');
      } else {
        setTimeout(() => { setExpression('normal'); setProblem(generateMultiplication()); processing.current = false; }, 900);
      }
    } else {
      playSfx('wrong'); setFeedback('wrong'); setExpression('hint');
      speakJa('おしい！ もういちど！'); processing.current = false;
    }
  }

  if (cleared) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gradient-to-b from-sky-200 to-amber-50 p-8">
        <motion.div initial={{ scale: 0 }} animate={{ scale: [0, 1.2, 1] }} className="text-7xl">🎉</motion.div>
        <p className="text-2xl font-bold text-green-700">クリア！ スタンプ ゲット！</p>
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5, type: 'spring' }} className="text-5xl">⭐</motion.div>
        <button type="button" onClick={onExit} className="rounded-2xl bg-blue-500 px-8 py-4 text-2xl font-bold text-white shadow-[0_5px_0_#1565c0]">ホームに もどる</button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center gap-5 bg-gradient-to-b from-sky-200 to-amber-50 p-6">
      <div className="self-stretch text-sm text-amber-700 font-bold">
        といた かず: {solved} / {QUESTIONS_PER_UNIT}
      </div>
      <Companion name={characterName} expression={expression}
        message={`${thing.emoji}が ${problem.b}${thing.counter}ずつ、${problem.a}つの グループ。ぜんぶで なん${thing.counter}？`} />
      {/* グループ視覚化 */}
      <div className="flex flex-wrap justify-center gap-3">
        {problem.groups.map((count, gi) => (
          <div key={gi} className="rounded-xl bg-white shadow-md p-2 flex flex-wrap gap-1" style={{ minWidth: 48 }}>
            {Array.from({ length: count }).map((_, ei) => (
              <span key={ei} className="text-xl">{thing.emoji}</span>
            ))}
          </div>
        ))}
      </div>
      <div className="rounded-3xl bg-white shadow-lg px-10 py-4 text-4xl font-bold text-amber-900">
        {problem.a} × {problem.b} ＝ ？
      </div>
      <AnswerButtons choices={problem.choices} onPick={handlePick} disabled={expression === 'happy'} />
      <AnimatePresence>
        {feedback === 'wrong' && (
          <motion.p key="w" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-lg font-bold text-orange-600">おしい！ もういちど！</motion.p>
        )}
      </AnimatePresence>
      <button type="button" onClick={onExit} className="mt-2 text-sm text-amber-600 underline">やめる</button>
    </div>
  );
}
```

- [ ] **Step 4: DivisionUnit.tsx を実装する**

`src/screens/DivisionUnit.tsx`:
```tsx
import { useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import { Companion } from '../features/character/Companion';
import { AnswerButtons } from '../components/AnswerButtons';
import { generateDivision, checkDivision, type DivisionProblem } from '../lib/math/division';
import { playSfx } from '../features/sound/sfx';
import { speakJa } from '../features/speech/tts';
import { loadJson, saveJson } from '../lib/storage';
import { addStamp, EMPTY_STAMPS, type StampState } from '../features/rewards/stamps';
import { recordAnswer, loadMastery, saveMastery } from '../lib/mastery';

const QUESTIONS_PER_UNIT = 3;
const STAMP_KEY = 'math-app:stamps';
const SKILL_ID = 'division';

const SCENARIOS = [
  { item: '🍪', container: '🍽️', itemName: 'クッキー', containerName: 'おさら' },
  { item: '🍬', container: '🎁', itemName: 'あめ', containerName: 'ふくろ' },
  { item: '🌸', container: '🏺', itemName: 'はな', containerName: 'かびん' },
];

interface Props { characterName: string; onExit: () => void; }

export function DivisionUnit({ characterName, onExit }: Props) {
  const [problem, setProblem] = useState<DivisionProblem>(() => generateDivision());
  const [scenario] = useState(() => SCENARIOS[Math.floor(Math.random() * SCENARIOS.length)]);
  const [solved, setSolved] = useState(0);
  const [expression, setExpression] = useState<'normal' | 'happy' | 'hint'>('normal');
  const [feedback, setFeedback] = useState<'none' | 'wrong'>('none');
  const cleared = solved >= QUESTIONS_PER_UNIT;
  const processing = useRef(false);

  function handlePick(value: number) {
    if (processing.current) return;
    processing.current = true;
    playSfx('tap');
    const correct = checkDivision(problem, value);
    saveMastery(recordAnswer(loadMastery(), SKILL_ID, correct, Date.now()));
    if (correct) {
      playSfx('correct'); setExpression('happy');
      confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
      const nextSolved = solved + 1; setSolved(nextSolved); setFeedback('none');
      if (nextSolved >= QUESTIONS_PER_UNIT) {
        saveJson(STAMP_KEY, addStamp(loadJson<StampState>(STAMP_KEY, EMPTY_STAMPS), SKILL_ID, Date.now()));
        playSfx('fanfare'); speakJa('クリア！ よくできたね！');
      } else {
        setTimeout(() => { setExpression('normal'); setProblem(generateDivision()); processing.current = false; }, 900);
      }
    } else {
      playSfx('wrong'); setFeedback('wrong'); setExpression('hint');
      speakJa('おしい！ もういちど！'); processing.current = false;
    }
  }

  if (cleared) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gradient-to-b from-sky-200 to-amber-50 p-8">
        <motion.div initial={{ scale: 0 }} animate={{ scale: [0, 1.2, 1] }} className="text-7xl">🎉</motion.div>
        <p className="text-2xl font-bold text-green-700">クリア！ スタンプ ゲット！</p>
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5, type: 'spring' }} className="text-5xl">⭐</motion.div>
        <button type="button" onClick={onExit} className="rounded-2xl bg-blue-500 px-8 py-4 text-2xl font-bold text-white shadow-[0_5px_0_#1565c0]">ホームに もどる</button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center gap-5 bg-gradient-to-b from-sky-200 to-amber-50 p-6">
      <div className="self-stretch text-sm text-amber-700 font-bold">
        といた かず: {solved} / {QUESTIONS_PER_UNIT}
      </div>
      <Companion name={characterName} expression={expression}
        message={`${scenario.item}が ${problem.dividend}こ。${scenario.containerName}${problem.divisor}まいに おなじかずずつ わけると 1まい なんこ？`} />
      {/* 視覚化: dividend 個のアイテム */}
      <div className="flex flex-wrap justify-center gap-1 max-w-xs bg-white rounded-2xl p-3 shadow">
        {Array.from({ length: Math.min(problem.dividend, 30) }).map((_, i) => (
          <span key={i} className="text-2xl">{scenario.item}</span>
        ))}
        {problem.dividend > 30 && <span className="text-sm text-gray-400">…ぜんぶで{problem.dividend}こ</span>}
      </div>
      <div className="rounded-3xl bg-white shadow-lg px-10 py-4 text-4xl font-bold text-amber-900">
        {problem.dividend} ÷ {problem.divisor} ＝ ？
      </div>
      {problem.remainder > 0 && (
        <p className="text-sm text-amber-600 font-bold">（あまりは {problem.remainder}こ）</p>
      )}
      <AnswerButtons choices={problem.choices} onPick={handlePick} disabled={expression === 'happy'} />
      <AnimatePresence>
        {feedback === 'wrong' && (
          <motion.p key="w" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-lg font-bold text-orange-600">おしい！ もういちど！</motion.p>
        )}
      </AnimatePresence>
      <button type="button" onClick={onExit} className="mt-2 text-sm text-amber-600 underline">やめる</button>
    </div>
  );
}
```

- [ ] **Step 5: 型チェック確認**

Run: `npx tsc --noEmit`
Expected: エラーなし

- [ ] **Step 6: Commit**

```bash
git add src/screens/BigAdditionUnit.tsx src/screens/BigSubtractionUnit.tsx src/screens/MultiplicationUnit.tsx src/screens/DivisionUnit.tsx
git commit -m "feat: 2-digit, multiplication, division unit screens"
```

---

### Task 12: App.tsx に全単元ルーティングを追加

**Files:**
- Modify: `src/App.tsx`（全置換）

- [ ] **Step 1: App.tsx を全置換する**

`src/App.tsx`:
```tsx
import { useState } from 'react';
import { HomeScreen } from './screens/HomeScreen';
import { MakeTenUnit } from './screens/MakeTenUnit';
import { AdditionUnit } from './screens/AdditionUnit';
import { SubtractionUnit } from './screens/SubtractionUnit';
import { CherryCalcUnit } from './screens/CherryCalcUnit';
import { BigAdditionUnit } from './screens/BigAdditionUnit';
import { BigSubtractionUnit } from './screens/BigSubtractionUnit';
import { MultiplicationUnit } from './screens/MultiplicationUnit';
import { DivisionUnit } from './screens/DivisionUnit';
import { NamingScreen } from './features/character/NamingScreen';
import { loadCharacter } from './features/character/character';
import { loadJson } from './lib/storage';
import { EMPTY_STAMPS, type StampState } from './features/rewards/stamps';

type Screen = { kind: 'home' } | { kind: 'unit'; unitId: string };

export default function App() {
  const [character, setCharacter] = useState(loadCharacter);
  const [screen, setScreen] = useState<Screen>({ kind: 'home' });
  const [refresh, setRefresh] = useState(0);
  const stampTotal = loadJson<StampState>('math-app:stamps', EMPTY_STAMPS).total;

  if (!character.named) {
    return <NamingScreen onDone={(name) => setCharacter({ ...character, name, named: true })} />;
  }

  function handleExit() {
    setRefresh((r) => r + 1);
    setScreen({ kind: 'home' });
  }

  if (screen.kind === 'unit') {
    const props = { characterName: character.name, onExit: handleExit };
    switch (screen.unitId) {
      case 'make-ten':       return <MakeTenUnit key={refresh} {...props} />;
      case 'addition':       return <AdditionUnit key={refresh} {...props} />;
      case 'subtraction':    return <SubtractionUnit key={refresh} {...props} />;
      case 'cherry-calc':    return <CherryCalcUnit key={refresh} {...props} />;
      case 'big-addition':   return <BigAdditionUnit key={refresh} {...props} />;
      case 'big-subtraction':return <BigSubtractionUnit key={refresh} {...props} />;
      case 'multiplication': return <MultiplicationUnit key={refresh} {...props} />;
      case 'division':       return <DivisionUnit key={refresh} {...props} />;
      default:               return <MakeTenUnit key={refresh} {...props} />;
    }
  }

  return (
    <HomeScreen
      key={refresh}
      characterName={character.name}
      stampTotal={stampTotal}
      onSelectUnit={(unitId) => setScreen({ kind: 'unit', unitId })}
    />
  );
}
```

- [ ] **Step 2: 型チェック + 全テスト確認**

Run: `npx tsc --noEmit && npm run test`
Expected: 型エラーなし、全テスト PASS

- [ ] **Step 3: 本番ビルド確認**

Run: `npm run build`
Expected: `dist/` 生成、エラーなし

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx
git commit -m "feat: route all phase-2 units from App.tsx"
```

---

## 完了の定義（フェーズ2）

- `npm run test` が全 PASS
- `npm run build` が成功
- ホームから 8 単元すべてを選択でき、各単元を 3 問クリアしてスタンプが増える
- さくらんぼ計算は STEP1〜4 が順番に展開される
- 習熟度が localStorage の `math-app:mastery` に記録される
