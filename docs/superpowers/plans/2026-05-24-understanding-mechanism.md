# 仕組み理解・物語問題文・もんだいづくり改善 実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 全8単元に「タップで進むステップ解説（ヒントボタンで開く）」を追加し、問題文をミニ物語風にし、もんだいづくりを「演算→場面」の2段階選択にする。

**Architecture:** 各単元の math lib に純粋関数 `explain()` を追加し、`ExplainStep[]` を返す。共通の `StepExplainer` オーバーレイがその配列を受け取り、kind ごとの描画部品（objects/groups/placeValue/cherryBranch/equation）で1ステップずつ表示・読み上げする。物語文は `src/data/scenarios.ts` から供給。もんだいづくりは `ProblemMakerScreen` に `op` ステップを追加。

**Tech Stack:** React 19 + TypeScript + Vite / framer-motion / canvas-confetti / Vitest + @testing-library/react / Tailwind CSS v4

設計書: `docs/superpowers/specs/2026-05-24-understanding-mechanism-design.md`

---

## ファイル構成

新規:
- `src/lib/math/explain.ts` — `ExplainStepKind` / `ExplainStep` 型と共通ヘルパ
- `src/components/StepExplainer.tsx` — ステップ解説オーバーレイ（kind ごとのレンダラ内蔵）
- `src/components/PlaceValueBlocks.tsx` — 位ブロック描画（placeValue 用）
- `src/components/GroupsVisual.tsx` — かたまり描画（groups 用）
- `src/data/scenarios.ts` — 単元別ミニ物語シナリオ

修正（explain 追加）:
- `src/lib/math/multiplication.ts` / `division.ts` / `bigAddition.ts` / `bigSubtraction.ts` / `cherryCalc.ts` / `addition.ts` / `subtraction.ts` / `makeTen.ts`

修正（画面）:
- `src/screens/MultiplicationUnit.tsx` / `DivisionUnit.tsx` / `BigAdditionUnit.tsx` / `BigSubtractionUnit.tsx` / `CherryCalcUnit.tsx` / `AdditionUnit.tsx` / `SubtractionUnit.tsx` / `MakeTenUnit.tsx` — ヒント💡ボタン＋StepExplainer＋シナリオ文
- `src/lib/problemTemplates.ts` — `title`/`sampleA`/`sampleB` 追加・かけ/わり場面+1
- `src/screens/ProblemMakerScreen.tsx` — `op` ステップ追加・場面えらび改修

テスト:
- `tests/lib/math/explain-multiplication.test.ts` ほか各単元
- `tests/data/scenarios.test.ts`
- `tests/lib/problemTemplates.test.ts`（既存に追記）

---

# フェーズ1: 共通土台

## Task 1: ExplainStep 型の定義

**Files:**
- Create: `src/lib/math/explain.ts`

- [ ] **Step 1: 型ファイルを作成**

`src/lib/math/explain.ts`:

```ts
export type ExplainStepKind =
  | 'objects'      // 具体物（emoji を個数分ならべる）
  | 'groups'       // かたまり（perGroup 個ずつ groups 列）
  | 'placeValue'   // 位ブロック（十の位・一の位）
  | 'cherryBranch' // さくらんぼ分解
  | 'equation';    // 式（抽象）

export interface ExplainStep {
  kind: ExplainStepKind;
  caption: string; // 画面に出す短い説明（ひらがな）
  narration: string; // 読み上げ用テキスト
  data: Record<string, unknown>; // kind ごとの描画データ
}

// kind ごとの data の形（描画側で参照する）
export interface ObjectsData {
  emoji: string;
  count: number;
}
export interface GroupsData {
  emoji: string;
  perGroup: number;
  groups: number;
}
export interface PlaceValueData {
  tens: number;
  ones: number;
  carry?: boolean;
}
export interface CherryBranchData {
  b: number;
  split: number;
  carry: number;
}
export interface EquationData {
  text: string;
}
```

- [ ] **Step 2: 型チェック**

Run: `npx tsc --noEmit`
Expected: エラーなし

- [ ] **Step 3: コミット**

```bash
git add src/lib/math/explain.ts
git commit -m "feat: add ExplainStep types for step explanation"
```

---

## Task 2: PlaceValueBlocks コンポーネント

**Files:**
- Create: `src/components/PlaceValueBlocks.tsx`

- [ ] **Step 1: コンポーネントを作成**

`src/components/PlaceValueBlocks.tsx`:

```tsx
import { motion } from 'framer-motion';

interface Props {
  tens: number;
  ones: number;
  carry?: boolean;
}

export function PlaceValueBlocks({ tens, ones, carry }: Props) {
  return (
    <div className="flex items-end justify-center gap-8 bg-white rounded-2xl shadow p-4 select-none">
      <div className="flex flex-col items-center gap-1">
        <div className="flex gap-1">
          {Array.from({ length: tens }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ delay: i * 0.05, type: 'spring' }}
              className="w-3 h-16 rounded bg-blue-400 origin-bottom"
            />
          ))}
        </div>
        <span className="text-xs text-blue-600 font-bold">じゅう</span>
      </div>
      <div className="flex flex-col items-center gap-1">
        <div className="flex flex-wrap gap-1 max-w-[7rem] justify-center">
          {Array.from({ length: ones }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.04, type: 'spring' }}
              className="w-4 h-4 rounded-full bg-orange-400"
            />
          ))}
        </div>
        <span className="text-xs text-orange-600 font-bold">いち</span>
      </div>
      {carry && <span className="text-2xl">➡️🔟</span>}
    </div>
  );
}
```

- [ ] **Step 2: 型チェック**

Run: `npx tsc --noEmit`
Expected: エラーなし

- [ ] **Step 3: コミット**

```bash
git add src/components/PlaceValueBlocks.tsx
git commit -m "feat: add PlaceValueBlocks component for place-value explanation"
```

---

## Task 3: GroupsVisual コンポーネント

**Files:**
- Create: `src/components/GroupsVisual.tsx`

- [ ] **Step 1: コンポーネントを作成**

`src/components/GroupsVisual.tsx`:

```tsx
import { motion } from 'framer-motion';

interface Props {
  emoji: string;
  perGroup: number;
  groups: number;
}

export function GroupsVisual({ emoji, perGroup, groups }: Props) {
  return (
    <div className="bg-white rounded-2xl shadow p-4 flex flex-wrap gap-3 justify-center max-w-xs">
      {Array.from({ length: groups }).map((_, gi) => (
        <div key={gi} className="flex gap-1 rounded-lg border-2 border-amber-200 p-1">
          {Array.from({ length: perGroup }).map((_, ii) => (
            <motion.span
              key={ii}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: (gi * perGroup + ii) * 0.03, type: 'spring' }}
              className="text-2xl"
            >
              {emoji}
            </motion.span>
          ))}
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: 型チェック**

Run: `npx tsc --noEmit`
Expected: エラーなし

- [ ] **Step 3: コミット**

```bash
git add src/components/GroupsVisual.tsx
git commit -m "feat: add GroupsVisual component for equal-groups explanation"
```

---

## Task 4: StepExplainer オーバーレイ

**Files:**
- Create: `src/components/StepExplainer.tsx`

- [ ] **Step 1: コンポーネントを作成**

`src/components/StepExplainer.tsx`:

```tsx
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StepIndicator } from './StepIndicator';
import { PlaceValueBlocks } from './PlaceValueBlocks';
import { GroupsVisual } from './GroupsVisual';
import { CherryBranch } from './CherryBranch';
import { speakJa } from '../features/speech/tts';
import type {
  ExplainStep,
  ObjectsData,
  GroupsData,
  PlaceValueData,
  CherryBranchData,
  EquationData,
} from '../lib/math/explain';

interface Props {
  steps: ExplainStep[];
  onClose: () => void;
}

function StepBody({ step }: { step: ExplainStep }) {
  switch (step.kind) {
    case 'objects': {
      const d = step.data as unknown as ObjectsData;
      return (
        <div className="bg-white rounded-2xl shadow p-4 flex flex-wrap gap-1 justify-center max-w-xs">
          {Array.from({ length: d.count }).map((_, i) => (
            <motion.span
              key={i}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.04, type: 'spring' }}
              className="text-2xl"
            >
              {d.emoji}
            </motion.span>
          ))}
        </div>
      );
    }
    case 'groups': {
      const d = step.data as unknown as GroupsData;
      return <GroupsVisual emoji={d.emoji} perGroup={d.perGroup} groups={d.groups} />;
    }
    case 'placeValue': {
      const d = step.data as unknown as PlaceValueData;
      return <PlaceValueBlocks tens={d.tens} ones={d.ones} carry={d.carry} />;
    }
    case 'cherryBranch': {
      const d = step.data as unknown as CherryBranchData;
      return (
        <div className="bg-white rounded-2xl shadow p-4">
          <CherryBranch b={d.b} split={d.split} carry={d.carry} visible />
        </div>
      );
    }
    case 'equation': {
      const d = step.data as unknown as EquationData;
      return (
        <div className="rounded-3xl bg-white shadow-lg px-8 py-5 text-4xl font-bold text-amber-900">
          {d.text}
        </div>
      );
    }
  }
}

export function StepExplainer({ steps, onClose }: Props) {
  const [index, setIndex] = useState(0);
  const step = steps[index];
  const isLast = index >= steps.length - 1;

  useEffect(() => {
    if (step) speakJa(step.narration);
  }, [step]);

  if (!step) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-5 bg-gradient-to-b from-sky-100/95 to-amber-50/95 p-6 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <span className="text-lg font-bold text-amber-700">どうして そうなる？</span>
        <StepIndicator total={steps.length} current={index} />
      </div>
      <p className="text-xl font-bold text-amber-900 text-center whitespace-pre-line max-w-sm">
        {step.caption}
      </p>
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.25 }}
          className="flex justify-center"
        >
          <StepBody step={step} />
        </motion.div>
      </AnimatePresence>
      <div className="flex gap-4">
        {!isLast ? (
          <button
            type="button"
            onClick={() => setIndex((i) => i + 1)}
            className="rounded-2xl bg-blue-500 px-8 py-4 text-xl font-bold text-white shadow-[0_4px_0_#1565c0] active:translate-y-1 transition-all"
          >
            つぎへ ▶
          </button>
        ) : (
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl bg-green-500 px-8 py-4 text-xl font-bold text-white shadow-[0_4px_0_#2e7d32] active:translate-y-1 transition-all"
          >
            わかった！
          </button>
        )}
        <button type="button" onClick={onClose} className="text-sm text-amber-600 underline">
          とじる
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 型チェック**

Run: `npx tsc --noEmit`
Expected: エラーなし

- [ ] **Step 3: コミット**

```bash
git add src/components/StepExplainer.tsx
git commit -m "feat: add StepExplainer overlay for step-by-step explanation"
```

---

# フェーズ2: かけ算・わり算（最優先）

## Task 5: multiplication.explain（TDD）

**Files:**
- Test: `tests/lib/math/explain-multiplication.test.ts`
- Modify: `src/lib/math/multiplication.ts`

- [ ] **Step 1: 失敗するテストを書く**

`tests/lib/math/explain-multiplication.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { explainMultiplication } from '../../../src/lib/math/multiplication';

describe('explainMultiplication', () => {
  const p = { a: 3, b: 4, groups: [4, 4, 4], choices: [12, 10, 14] };

  it('returns 3 steps: objects, groups, equation', () => {
    const steps = explainMultiplication(p, '🍩');
    expect(steps.map((s) => s.kind)).toEqual(['objects', 'groups', 'equation']);
  });

  it('objects step shows b items of the emoji', () => {
    const steps = explainMultiplication(p, '🍩');
    expect(steps[0].data).toMatchObject({ emoji: '🍩', count: 4 });
  });

  it('groups step has perGroup=b, groups=a', () => {
    const steps = explainMultiplication(p, '🍩');
    expect(steps[1].data).toMatchObject({ emoji: '🍩', perGroup: 4, groups: 3 });
  });

  it('equation step text contains the product', () => {
    const steps = explainMultiplication(p, '🍩');
    expect((steps[2].data as { text: string }).text).toContain('12');
  });

  it('every step has non-empty caption and narration', () => {
    for (const s of explainMultiplication(p, '🍩')) {
      expect(s.caption.length).toBeGreaterThan(0);
      expect(s.narration.length).toBeGreaterThan(0);
    }
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx vitest run tests/lib/math/explain-multiplication.test.ts`
Expected: FAIL（`explainMultiplication` is not exported / not a function）

- [ ] **Step 3: 実装を追加**

`src/lib/math/multiplication.ts` の末尾に追加（ファイル先頭に import 追加）:

```ts
import type { ExplainStep } from './explain';
```

```ts
export function explainMultiplication(p: MultiplicationProblem, emoji: string): ExplainStep[] {
  const repeated = Array(p.a).fill(p.b).join('＋');
  return [
    {
      kind: 'objects',
      caption: `${emoji}が ${p.b}こで\n1つの かたまり`,
      narration: `${p.b}こで ひとつの かたまりだよ`,
      data: { emoji, count: p.b },
    },
    {
      kind: 'groups',
      caption: `それが ${p.a}つ。\n${repeated} だね`,
      narration: `${p.b}こが ${p.a}つ。${repeated}`,
      data: { emoji, perGroup: p.b, groups: p.a },
    },
    {
      kind: 'equation',
      caption: 'しきに すると…',
      narration: `${p.a}かける${p.b}は ${p.a * p.b}`,
      data: { text: `${p.a}×${p.b} ＝ ${p.a * p.b}` },
    },
  ];
}
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npx vitest run tests/lib/math/explain-multiplication.test.ts`
Expected: PASS

- [ ] **Step 5: コミット**

```bash
git add tests/lib/math/explain-multiplication.test.ts src/lib/math/multiplication.ts
git commit -m "feat: add explainMultiplication step generator"
```

---

## Task 6: division.explain（TDD）

**Files:**
- Test: `tests/lib/math/explain-division.test.ts`
- Modify: `src/lib/math/division.ts`

- [ ] **Step 1: 失敗するテストを書く**

`tests/lib/math/explain-division.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { explainDivision } from '../../../src/lib/math/division';

describe('explainDivision', () => {
  const p = { dividend: 12, divisor: 3, quotient: 4, remainder: 0, choices: [4, 3, 5] };

  it('returns 3 steps: objects, groups, equation', () => {
    const steps = explainDivision(p, '🍪');
    expect(steps.map((s) => s.kind)).toEqual(['objects', 'groups', 'equation']);
  });

  it('objects step shows dividend items', () => {
    const steps = explainDivision(p, '🍪');
    expect(steps[0].data).toMatchObject({ emoji: '🍪', count: 12 });
  });

  it('groups step: perGroup=quotient, groups=divisor', () => {
    const steps = explainDivision(p, '🍪');
    expect(steps[1].data).toMatchObject({ emoji: '🍪', perGroup: 4, groups: 3 });
  });

  it('equation step text contains the quotient', () => {
    const steps = explainDivision(p, '🍪');
    expect((steps[2].data as { text: string }).text).toContain('4');
  });

  it('every step has non-empty caption and narration', () => {
    for (const s of explainDivision(p, '🍪')) {
      expect(s.caption.length).toBeGreaterThan(0);
      expect(s.narration.length).toBeGreaterThan(0);
    }
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx vitest run tests/lib/math/explain-division.test.ts`
Expected: FAIL

- [ ] **Step 3: 実装を追加**

`src/lib/math/division.ts` の先頭に import 追加:

```ts
import type { ExplainStep } from './explain';
```

末尾に追加:

```ts
export function explainDivision(p: DivisionProblem, emoji: string): ExplainStep[] {
  return [
    {
      kind: 'objects',
      caption: `${emoji}が ${p.dividend}こ\nあるよ`,
      narration: `${emoji}が ${p.dividend}こ あるよ`,
      data: { emoji, count: p.dividend },
    },
    {
      kind: 'groups',
      caption: `${p.divisor}人に おなじ かずずつ。\nひとり ${p.quotient}こ`,
      narration: `${p.divisor}人に わけると ひとり ${p.quotient}こ`,
      data: { emoji, perGroup: p.quotient, groups: p.divisor },
    },
    {
      kind: 'equation',
      caption: 'しきに すると…',
      narration: `${p.dividend}わる${p.divisor}は ${p.quotient}`,
      data: { text: `${p.dividend}÷${p.divisor} ＝ ${p.quotient}` },
    },
  ];
}
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npx vitest run tests/lib/math/explain-division.test.ts`
Expected: PASS

- [ ] **Step 5: コミット**

```bash
git add tests/lib/math/explain-division.test.ts src/lib/math/division.ts
git commit -m "feat: add explainDivision step generator"
```

---

## Task 7: MultiplicationUnit にヒントボタンを組み込む

**Files:**
- Modify: `src/screens/MultiplicationUnit.tsx`

- [ ] **Step 1: import と state を追加**

`src/screens/MultiplicationUnit.tsx` の import 群に追加:

```tsx
import { StepExplainer } from '../components/StepExplainer';
import { generateMultiplication, checkMultiplication, explainMultiplication, type MultiplicationProblem } from '../lib/math/multiplication';
```

（既存の `generateMultiplication, checkMultiplication, type MultiplicationProblem` の import 行は上の1行に置き換える）

`const cleared = ...` の直前に state を追加:

```tsx
  const [showHint, setShowHint] = useState(false);
```

- [ ] **Step 2: ヒントボタンと StepExplainer を描画**

問題式の `<div className="rounded-3xl ...">{problem.a} ✕ {problem.b} ＝ ？</div>` の直後に追加:

```tsx
      <button
        type="button"
        onClick={() => { setShowHint(true); playSfx('tap'); }}
        className="rounded-full bg-amber-400 px-5 py-2 text-lg font-bold text-white shadow-[0_3px_0_#b45309] active:translate-y-0.5"
      >
        💡 ヒント
      </button>
```

`return (` ブロックの最後、いちばん外側の `</div>` の直前に追加:

```tsx
      {showHint && (
        <StepExplainer steps={explainMultiplication(problem, emoji)} onClose={() => setShowHint(false)} />
      )}
```

- [ ] **Step 3: 型チェック**

Run: `npx tsc --noEmit`
Expected: エラーなし

- [ ] **Step 4: コミット**

```bash
git add src/screens/MultiplicationUnit.tsx
git commit -m "feat: add hint button with StepExplainer to MultiplicationUnit"
```

---

## Task 8: DivisionUnit にヒントボタンを組み込む

**Files:**
- Modify: `src/screens/DivisionUnit.tsx`

- [ ] **Step 1: import と state を追加**

import 群に追加し、既存の division import 行を置き換える:

```tsx
import { StepExplainer } from '../components/StepExplainer';
import { generateDivision, checkDivision, explainDivision, type DivisionProblem } from '../lib/math/division';
```

`const cleared = ...` の直前に追加:

```tsx
  const [showHint, setShowHint] = useState(false);
```

- [ ] **Step 2: ヒントボタンと StepExplainer を描画**

`<ShareVisual problem={problem} emoji={emoji} />` の直後に追加:

```tsx
      <button
        type="button"
        onClick={() => { setShowHint(true); playSfx('tap'); }}
        className="rounded-full bg-amber-400 px-5 py-2 text-lg font-bold text-white shadow-[0_3px_0_#b45309] active:translate-y-0.5"
      >
        💡 ヒント
      </button>
```

いちばん外側の `</div>` の直前に追加:

```tsx
      {showHint && (
        <StepExplainer steps={explainDivision(problem, emoji)} onClose={() => setShowHint(false)} />
      )}
```

- [ ] **Step 3: 型チェック**

Run: `npx tsc --noEmit`
Expected: エラーなし

- [ ] **Step 4: コミット**

```bash
git add src/screens/DivisionUnit.tsx
git commit -m "feat: add hint button with StepExplainer to DivisionUnit"
```

---

# フェーズ3: 二桁たしざん・ひきざん

## Task 9: bigAddition.explain（TDD）

**Files:**
- Test: `tests/lib/math/explain-bigAddition.test.ts`
- Modify: `src/lib/math/bigAddition.ts`

- [ ] **Step 1: 失敗するテストを書く**

`tests/lib/math/explain-bigAddition.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { explainBigAddition } from '../../../src/lib/math/bigAddition';

describe('explainBigAddition', () => {
  // 28 + 15 = 43, ones: 8+5=13 (carry), tens: 2+1+1=4
  const p = { a: 28, b: 15, onesA: 8, onesB: 5, tensA: 2, tensB: 1, choices: [43, 41, 45] };

  it('returns 3 steps: placeValue, placeValue, equation', () => {
    const steps = explainBigAddition(p);
    expect(steps.map((s) => s.kind)).toEqual(['placeValue', 'placeValue', 'equation']);
  });

  it('ones step carries when ones sum >= 10', () => {
    const steps = explainBigAddition(p);
    expect(steps[0].data).toMatchObject({ ones: 13, carry: true });
  });

  it('tens step includes the carried ten', () => {
    const steps = explainBigAddition(p);
    expect(steps[1].data).toMatchObject({ tens: 4 });
  });

  it('equation text contains the sum', () => {
    const steps = explainBigAddition(p);
    expect((steps[2].data as { text: string }).text).toContain('43');
  });

  it('no carry when ones sum < 10', () => {
    const q = { a: 21, b: 13, onesA: 1, onesB: 3, tensA: 2, tensB: 1, choices: [34, 33, 35] };
    const steps = explainBigAddition(q);
    expect(steps[0].data).toMatchObject({ ones: 4, carry: false });
    expect(steps[1].data).toMatchObject({ tens: 3 });
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx vitest run tests/lib/math/explain-bigAddition.test.ts`
Expected: FAIL

- [ ] **Step 3: 実装を追加**

`src/lib/math/bigAddition.ts` の先頭に import 追加:

```ts
import type { ExplainStep } from './explain';
```

末尾に追加:

```ts
export function explainBigAddition(p: BigAdditionProblem): ExplainStep[] {
  const onesSum = p.onesA + p.onesB;
  const carry = onesSum >= 10;
  const tensSum = p.tensA + p.tensB + (carry ? 1 : 0);
  return [
    {
      kind: 'placeValue',
      caption: carry
        ? `いちの くらい: ${p.onesA}＋${p.onesB}＝${onesSum}\n10は じゅうに くりあげ`
        : `いちの くらい: ${p.onesA}＋${p.onesB}＝${onesSum}`,
      narration: `いちのくらいは ${p.onesA}たす${p.onesB}で ${onesSum}`,
      data: { tens: 0, ones: onesSum, carry },
    },
    {
      kind: 'placeValue',
      caption: carry
        ? `じゅうの くらい: ${p.tensA}＋${p.tensB}＋1＝${tensSum}`
        : `じゅうの くらい: ${p.tensA}＋${p.tensB}＝${tensSum}`,
      narration: `じゅうのくらいは あわせて ${tensSum}`,
      data: { tens: tensSum, ones: 0 },
    },
    {
      kind: 'equation',
      caption: 'ぜんぶ あわせると…',
      narration: `${p.a}たす${p.b}は ${p.a + p.b}`,
      data: { text: `${p.a}＋${p.b} ＝ ${p.a + p.b}` },
    },
  ];
}
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npx vitest run tests/lib/math/explain-bigAddition.test.ts`
Expected: PASS

- [ ] **Step 5: コミット**

```bash
git add tests/lib/math/explain-bigAddition.test.ts src/lib/math/bigAddition.ts
git commit -m "feat: add explainBigAddition step generator with carry handling"
```

---

## Task 10: bigSubtraction.explain（TDD）

**Files:**
- Test: `tests/lib/math/explain-bigSubtraction.test.ts`
- Modify: `src/lib/math/bigSubtraction.ts`

- [ ] **Step 1: 失敗するテストを書く**

`tests/lib/math/explain-bigSubtraction.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { explainBigSubtraction } from '../../../src/lib/math/bigSubtraction';

describe('explainBigSubtraction', () => {
  // 43 - 28 = 15, ones: 3<8 borrow -> 13-8=5, tens: (4-1)-2=1
  const p = { a: 43, b: 28, onesA: 3, onesB: 8, tensA: 4, tensB: 2, choices: [15, 14, 16] };

  it('returns 3 steps: placeValue, placeValue, equation', () => {
    const steps = explainBigSubtraction(p);
    expect(steps.map((s) => s.kind)).toEqual(['placeValue', 'placeValue', 'equation']);
  });

  it('ones step borrows when onesA < onesB', () => {
    const steps = explainBigSubtraction(p);
    expect(steps[0].data).toMatchObject({ ones: 5, carry: true });
  });

  it('tens step accounts for the borrow', () => {
    const steps = explainBigSubtraction(p);
    expect(steps[1].data).toMatchObject({ tens: 1 });
  });

  it('equation text contains the difference', () => {
    const steps = explainBigSubtraction(p);
    expect((steps[2].data as { text: string }).text).toContain('15');
  });

  it('no borrow when onesA >= onesB', () => {
    const q = { a: 48, b: 23, onesA: 8, onesB: 3, tensA: 4, tensB: 2, choices: [25, 24, 26] };
    const steps = explainBigSubtraction(q);
    expect(steps[0].data).toMatchObject({ ones: 5, carry: false });
    expect(steps[1].data).toMatchObject({ tens: 2 });
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx vitest run tests/lib/math/explain-bigSubtraction.test.ts`
Expected: FAIL

- [ ] **Step 3: 実装を追加**

`src/lib/math/bigSubtraction.ts` の先頭に import 追加:

```ts
import type { ExplainStep } from './explain';
```

末尾に追加:

```ts
export function explainBigSubtraction(p: BigSubtractionProblem): ExplainStep[] {
  const borrow = p.onesA < p.onesB;
  const onesResult = borrow ? p.onesA + 10 - p.onesB : p.onesA - p.onesB;
  const tensResult = (borrow ? p.tensA - 1 : p.tensA) - p.tensB;
  return [
    {
      kind: 'placeValue',
      caption: borrow
        ? `いちの くらい: ${p.onesA}から ${p.onesB}は ひけない\nじゅうから 10 かりて ${p.onesA + 10}－${p.onesB}＝${onesResult}`
        : `いちの くらい: ${p.onesA}－${p.onesB}＝${onesResult}`,
      narration: borrow
        ? `いちのくらいは じゅうから かりて ${onesResult}`
        : `いちのくらいは ${p.onesA}ひく${p.onesB}で ${onesResult}`,
      data: { tens: 0, ones: onesResult, carry: borrow },
    },
    {
      kind: 'placeValue',
      caption: borrow
        ? `じゅうの くらい: ${p.tensA}－1－${p.tensB}＝${tensResult}`
        : `じゅうの くらい: ${p.tensA}－${p.tensB}＝${tensResult}`,
      narration: `じゅうのくらいは ${tensResult}`,
      data: { tens: tensResult, ones: 0 },
    },
    {
      kind: 'equation',
      caption: 'のこりは…',
      narration: `${p.a}ひく${p.b}は ${p.a - p.b}`,
      data: { text: `${p.a}－${p.b} ＝ ${p.a - p.b}` },
    },
  ];
}
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npx vitest run tests/lib/math/explain-bigSubtraction.test.ts`
Expected: PASS

- [ ] **Step 5: コミット**

```bash
git add tests/lib/math/explain-bigSubtraction.test.ts src/lib/math/bigSubtraction.ts
git commit -m "feat: add explainBigSubtraction step generator with borrow handling"
```

---

## Task 11: BigAdditionUnit にヒントボタンを組み込む

**Files:**
- Modify: `src/screens/BigAdditionUnit.tsx`

- [ ] **Step 1: import と state を追加**

import 群に追加し、既存の bigAddition import 行を置き換える:

```tsx
import { StepExplainer } from '../components/StepExplainer';
import { generateBigAddition, checkBigAddition, explainBigAddition, type BigAdditionProblem } from '../lib/math/bigAddition';
```

`const cleared = ...` の直前に追加:

```tsx
  const [showHint, setShowHint] = useState(false);
```

- [ ] **Step 2: ヒントボタンと StepExplainer を描画**

`<ColumnAddition problem={problem} />` の直後に追加:

```tsx
      <button
        type="button"
        onClick={() => { setShowHint(true); playSfx('tap'); }}
        className="rounded-full bg-amber-400 px-5 py-2 text-lg font-bold text-white shadow-[0_3px_0_#b45309] active:translate-y-0.5"
      >
        💡 ヒント
      </button>
```

いちばん外側の `</div>` の直前に追加:

```tsx
      {showHint && (
        <StepExplainer steps={explainBigAddition(problem)} onClose={() => setShowHint(false)} />
      )}
```

- [ ] **Step 3: 型チェック**

Run: `npx tsc --noEmit`
Expected: エラーなし

- [ ] **Step 4: コミット**

```bash
git add src/screens/BigAdditionUnit.tsx
git commit -m "feat: add hint button with StepExplainer to BigAdditionUnit"
```

---

## Task 12: BigSubtractionUnit にヒントボタンを組み込む

**Files:**
- Modify: `src/screens/BigSubtractionUnit.tsx`

- [ ] **Step 1: import と state を追加**

import 群に追加し、既存の bigSubtraction import 行を置き換える:

```tsx
import { StepExplainer } from '../components/StepExplainer';
import { generateBigSubtraction, checkBigSubtraction, explainBigSubtraction, type BigSubtractionProblem } from '../lib/math/bigSubtraction';
```

`const cleared = ...` の直前に追加:

```tsx
  const [showHint, setShowHint] = useState(false);
```

- [ ] **Step 2: ヒントボタンと StepExplainer を描画**

`<ColumnSubtraction problem={problem} />` の直後に追加:

```tsx
      <button
        type="button"
        onClick={() => { setShowHint(true); playSfx('tap'); }}
        className="rounded-full bg-amber-400 px-5 py-2 text-lg font-bold text-white shadow-[0_3px_0_#b45309] active:translate-y-0.5"
      >
        💡 ヒント
      </button>
```

いちばん外側の `</div>` の直前に追加:

```tsx
      {showHint && (
        <StepExplainer steps={explainBigSubtraction(problem)} onClose={() => setShowHint(false)} />
      )}
```

- [ ] **Step 3: 型チェック**

Run: `npx tsc --noEmit`
Expected: エラーなし

- [ ] **Step 4: コミット**

```bash
git add src/screens/BigSubtractionUnit.tsx
git commit -m "feat: add hint button with StepExplainer to BigSubtractionUnit"
```

---

# フェーズ4: さくらんぼ・1桁たし/ひき・10をつくる

## Task 13: cherryCalc.explain（TDD）

**Files:**
- Test: `tests/lib/math/explain-cherryCalc.test.ts`
- Modify: `src/lib/math/cherryCalc.ts`

- [ ] **Step 1: 失敗するテストを書く**

`tests/lib/math/explain-cherryCalc.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { explainCherry } from '../../../src/lib/math/cherryCalc';

describe('explainCherry', () => {
  // 8 + 5 = 13: split = 10-8 = 2, carry = 5-2 = 3
  const p = { a: 8, b: 5, choices: [13, 12, 14] };

  it('returns 2 steps: cherryBranch, equation', () => {
    const steps = explainCherry(p);
    expect(steps.map((s) => s.kind)).toEqual(['cherryBranch', 'equation']);
  });

  it('cherryBranch step splits b into split and carry', () => {
    const steps = explainCherry(p);
    expect(steps[0].data).toMatchObject({ b: 5, split: 2, carry: 3 });
  });

  it('equation text contains the answer', () => {
    const steps = explainCherry(p);
    expect((steps[1].data as { text: string }).text).toContain('13');
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx vitest run tests/lib/math/explain-cherryCalc.test.ts`
Expected: FAIL

- [ ] **Step 3: 実装を追加**

`src/lib/math/cherryCalc.ts` の先頭に import 追加:

```ts
import type { ExplainStep } from './explain';
```

末尾に追加:

```ts
export function explainCherry(p: CarryProblem): ExplainStep[] {
  const dec = decompose(p.a, p.b);
  return [
    {
      kind: 'cherryBranch',
      caption: `${p.b}を ${dec.split}と ${dec.carry}に わけよう\n${p.a}＋${dec.split}で 10`,
      narration: `${p.b}を ${dec.split}と ${dec.carry}に わけて まず 10をつくる`,
      data: { b: p.b, split: dec.split, carry: dec.carry },
    },
    {
      kind: 'equation',
      caption: '10と のこりで…',
      narration: `10たす${dec.carry}で ${dec.answer}`,
      data: { text: `10 ＋ ${dec.carry} ＝ ${dec.answer}` },
    },
  ];
}
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npx vitest run tests/lib/math/explain-cherryCalc.test.ts`
Expected: PASS

- [ ] **Step 5: コミット**

```bash
git add tests/lib/math/explain-cherryCalc.test.ts src/lib/math/cherryCalc.ts
git commit -m "feat: add explainCherry step generator"
```

---

## Task 14: addition.explain と subtraction.explain（TDD）

**Files:**
- Test: `tests/lib/math/explain-addition.test.ts`
- Test: `tests/lib/math/explain-subtraction.test.ts`
- Modify: `src/lib/math/addition.ts`
- Modify: `src/lib/math/subtraction.ts`

- [ ] **Step 1: 失敗するテストを書く（addition）**

`tests/lib/math/explain-addition.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { explainAddition } from '../../../src/lib/math/addition';

describe('explainAddition', () => {
  const p = { a: 3, b: 2, choices: [5, 4, 6] };

  it('returns 3 steps: objects, objects, equation', () => {
    const steps = explainAddition(p, '🐱');
    expect(steps.map((s) => s.kind)).toEqual(['objects', 'objects', 'equation']);
  });

  it('first objects step shows a items', () => {
    const steps = explainAddition(p, '🐱');
    expect(steps[0].data).toMatchObject({ emoji: '🐱', count: 3 });
  });

  it('second objects step shows b items', () => {
    const steps = explainAddition(p, '🐱');
    expect(steps[1].data).toMatchObject({ emoji: '🐱', count: 2 });
  });

  it('equation text contains the sum', () => {
    const steps = explainAddition(p, '🐱');
    expect((steps[2].data as { text: string }).text).toContain('5');
  });
});
```

- [ ] **Step 2: 失敗するテストを書く（subtraction）**

`tests/lib/math/explain-subtraction.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { explainSubtraction } from '../../../src/lib/math/subtraction';

describe('explainSubtraction', () => {
  const p = { a: 7, b: 3, choices: [4, 5, 3] };

  it('returns 3 steps: objects, objects, equation', () => {
    const steps = explainSubtraction(p, '🍎');
    expect(steps.map((s) => s.kind)).toEqual(['objects', 'objects', 'equation']);
  });

  it('first objects step shows a items', () => {
    const steps = explainSubtraction(p, '🍎');
    expect(steps[0].data).toMatchObject({ emoji: '🍎', count: 7 });
  });

  it('second objects step shows remaining (a-b) items', () => {
    const steps = explainSubtraction(p, '🍎');
    expect(steps[1].data).toMatchObject({ emoji: '🍎', count: 4 });
  });

  it('equation text contains the difference', () => {
    const steps = explainSubtraction(p, '🍎');
    expect((steps[2].data as { text: string }).text).toContain('4');
  });
});
```

- [ ] **Step 3: テストが失敗することを確認**

Run: `npx vitest run tests/lib/math/explain-addition.test.ts tests/lib/math/explain-subtraction.test.ts`
Expected: FAIL（両方）

- [ ] **Step 4: addition.explain を実装**

`src/lib/math/addition.ts` の先頭に import 追加:

```ts
import type { ExplainStep } from './explain';
```

末尾に追加:

```ts
export function explainAddition(p: AdditionProblem, emoji: string): ExplainStep[] {
  return [
    {
      kind: 'objects',
      caption: `${emoji}が ${p.a}こ`,
      narration: `はじめに ${p.a}こ`,
      data: { emoji, count: p.a },
    },
    {
      kind: 'objects',
      caption: `${p.b}こ ふえた`,
      narration: `${p.b}こ ふえたよ`,
      data: { emoji, count: p.b },
    },
    {
      kind: 'equation',
      caption: 'あわせると…',
      narration: `${p.a}たす${p.b}は ${p.a + p.b}`,
      data: { text: `${p.a}＋${p.b} ＝ ${p.a + p.b}` },
    },
  ];
}
```

- [ ] **Step 5: subtraction.explain を実装**

`src/lib/math/subtraction.ts` の先頭に import 追加:

```ts
import type { ExplainStep } from './explain';
```

末尾に追加:

```ts
export function explainSubtraction(p: SubtractionProblem, emoji: string): ExplainStep[] {
  return [
    {
      kind: 'objects',
      caption: `${emoji}が ${p.a}こ あるよ`,
      narration: `はじめに ${p.a}こ`,
      data: { emoji, count: p.a },
    },
    {
      kind: 'objects',
      caption: `${p.b}こ へると…\nのこりは ${p.a - p.b}こ`,
      narration: `${p.b}こ へって のこりは ${p.a - p.b}こ`,
      data: { emoji, count: p.a - p.b },
    },
    {
      kind: 'equation',
      caption: 'のこりは…',
      narration: `${p.a}ひく${p.b}は ${p.a - p.b}`,
      data: { text: `${p.a}－${p.b} ＝ ${p.a - p.b}` },
    },
  ];
}
```

- [ ] **Step 6: テストが通ることを確認**

Run: `npx vitest run tests/lib/math/explain-addition.test.ts tests/lib/math/explain-subtraction.test.ts`
Expected: PASS（両方）

- [ ] **Step 7: コミット**

```bash
git add tests/lib/math/explain-addition.test.ts tests/lib/math/explain-subtraction.test.ts src/lib/math/addition.ts src/lib/math/subtraction.ts
git commit -m "feat: add explainAddition and explainSubtraction step generators"
```

---

## Task 15: makeTen.explain（TDD）

**Files:**
- Test: `tests/lib/math/explain-makeTen.test.ts`
- Modify: `src/lib/math/makeTen.ts`

- [ ] **Step 1: 失敗するテストを書く**

`tests/lib/math/explain-makeTen.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { explainMakeTen } from '../../../src/lib/math/makeTen';

describe('explainMakeTen', () => {
  it('returns 3 steps: objects, objects, equation', () => {
    const steps = explainMakeTen(6, '🍎');
    expect(steps.map((s) => s.kind)).toEqual(['objects', 'objects', 'equation']);
  });

  it('first step shows current count', () => {
    const steps = explainMakeTen(6, '🍎');
    expect(steps[0].data).toMatchObject({ emoji: '🍎', count: 6 });
  });

  it('second step shows the missing count to reach ten', () => {
    const steps = explainMakeTen(6, '🍎');
    expect(steps[1].data).toMatchObject({ emoji: '🍎', count: 4 });
  });

  it('equation text contains 10', () => {
    const steps = explainMakeTen(6, '🍎');
    expect((steps[2].data as { text: string }).text).toContain('10');
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx vitest run tests/lib/math/explain-makeTen.test.ts`
Expected: FAIL

- [ ] **Step 3: 実装を追加**

`src/lib/math/makeTen.ts` の先頭に import 追加:

```ts
import type { ExplainStep } from './explain';
```

末尾に追加:

```ts
export function explainMakeTen(current: number, emoji: string): ExplainStep[] {
  const missing = missingToTen(current);
  return [
    {
      kind: 'objects',
      caption: `いま ${current}こ`,
      narration: `いま ${current}こ あるよ`,
      data: { emoji, count: current },
    },
    {
      kind: 'objects',
      caption: `あと ${missing}こ たすと…`,
      narration: `あと ${missing}こで 10こ`,
      data: { emoji, count: missing },
    },
    {
      kind: 'equation',
      caption: '10の できあがり！',
      narration: `${current}たす${missing}で 10`,
      data: { text: `${current} ＋ ${missing} ＝ 10` },
    },
  ];
}
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npx vitest run tests/lib/math/explain-makeTen.test.ts`
Expected: PASS

- [ ] **Step 5: コミット**

```bash
git add tests/lib/math/explain-makeTen.test.ts src/lib/math/makeTen.ts
git commit -m "feat: add explainMakeTen step generator"
```

---

## Task 16: CherryCalcUnit にヒントボタンを組み込む

**Files:**
- Modify: `src/screens/CherryCalcUnit.tsx`

既存の「誤答後 branch 表示」は残し、ヒントボタンからも `StepExplainer` を開けるようにする。

- [ ] **Step 1: import と state を追加**

import 群に追加し、既存の cherryCalc import を置き換える:

```tsx
import { StepExplainer } from '../components/StepExplainer';
import {
  generateCarryProblem,
  checkCarry,
  decompose,
  explainCherry,
  type CarryProblem,
} from '../lib/math/cherryCalc';
```

`const cleared = ...` の直前に追加:

```tsx
  const [showHint, setShowHint] = useState(false);
```

- [ ] **Step 2: ヒントボタンと StepExplainer を描画**

問題式 `<div className="rounded-3xl ...">{problem.a} ＋ {problem.b} ＝ ？</div>` の直後に追加:

```tsx
      <button
        type="button"
        onClick={() => { setShowHint(true); playSfx('tap'); }}
        className="rounded-full bg-amber-400 px-5 py-2 text-lg font-bold text-white shadow-[0_3px_0_#b45309] active:translate-y-0.5"
      >
        💡 ヒント
      </button>
```

いちばん外側の `</div>` の直前に追加:

```tsx
      {showHint && (
        <StepExplainer steps={explainCherry(problem)} onClose={() => setShowHint(false)} />
      )}
```

- [ ] **Step 3: 型チェック**

Run: `npx tsc --noEmit`
Expected: エラーなし

- [ ] **Step 4: コミット**

```bash
git add src/screens/CherryCalcUnit.tsx
git commit -m "feat: add hint button with StepExplainer to CherryCalcUnit"
```

---

## Task 17: AdditionUnit・SubtractionUnit・MakeTenUnit にヒントボタンを組み込む

**Files:**
- Modify: `src/screens/AdditionUnit.tsx`
- Modify: `src/screens/SubtractionUnit.tsx`
- Modify: `src/screens/MakeTenUnit.tsx`

- [ ] **Step 1: AdditionUnit を修正**

import 群に追加し、既存の addition import を置き換える:

```tsx
import { StepExplainer } from '../components/StepExplainer';
import { generateAddition, checkAddition, explainAddition, type AdditionProblem } from '../lib/math/addition';
```

`const cleared = ...` の直前に追加:

```tsx
  const [showHint, setShowHint] = useState(false);
```

問題式 `<div className="rounded-3xl ...">{problem.a} ＋ {problem.b} ＝ ？</div>` の直後に追加:

```tsx
      <button
        type="button"
        onClick={() => { setShowHint(true); playSfx('tap'); }}
        className="rounded-full bg-amber-400 px-5 py-2 text-lg font-bold text-white shadow-[0_3px_0_#b45309] active:translate-y-0.5"
      >
        💡 ヒント
      </button>
```

いちばん外側の `</div>` の直前に追加:

```tsx
      {showHint && (
        <StepExplainer steps={explainAddition(problem, animal)} onClose={() => setShowHint(false)} />
      )}
```

- [ ] **Step 2: SubtractionUnit を修正**

import 群に追加し、既存の subtraction import を置き換える:

```tsx
import { StepExplainer } from '../components/StepExplainer';
import { generateSubtraction, checkSubtraction, explainSubtraction, type SubtractionProblem } from '../lib/math/subtraction';
```

`const cleared = ...` の直前に追加:

```tsx
  const [showHint, setShowHint] = useState(false);
```

問題式 `<div className="rounded-3xl ...">{problem.a} － {problem.b} ＝ ？</div>` の直後に追加:

```tsx
      <button
        type="button"
        onClick={() => { setShowHint(true); playSfx('tap'); }}
        className="rounded-full bg-amber-400 px-5 py-2 text-lg font-bold text-white shadow-[0_3px_0_#b45309] active:translate-y-0.5"
      >
        💡 ヒント
      </button>
```

いちばん外側の `</div>` の直前に追加:

```tsx
      {showHint && (
        <StepExplainer steps={explainSubtraction(problem, food)} onClose={() => setShowHint(false)} />
      )}
```

- [ ] **Step 3: MakeTenUnit を修正**

import 群に追加:

```tsx
import { StepExplainer } from '../components/StepExplainer';
import { missingToTen, isCorrectMissing, makeAnswerChoices, explainMakeTen } from '../lib/math/makeTen';
```

（既存の `missingToTen, isCorrectMissing, makeAnswerChoices` の import 行を上の1行に置き換える）

`const cleared = ...` の直前に追加:

```tsx
  const [showHint, setShowHint] = useState(false);
```

`<MakeTenFrame filled={current} fruit={fruit} flash={flash} />` の直後に追加:

```tsx
      <button
        type="button"
        onClick={() => { setShowHint(true); playSfx('tap'); }}
        className="rounded-full bg-amber-400 px-5 py-2 text-lg font-bold text-white shadow-[0_3px_0_#b45309] active:translate-y-0.5"
      >
        💡 ヒント
      </button>
```

いちばん外側の `</div>` の直前に追加:

```tsx
      {showHint && (
        <StepExplainer steps={explainMakeTen(current, fruit)} onClose={() => setShowHint(false)} />
      )}
```

- [ ] **Step 4: 型チェック**

Run: `npx tsc --noEmit`
Expected: エラーなし

- [ ] **Step 5: コミット**

```bash
git add src/screens/AdditionUnit.tsx src/screens/SubtractionUnit.tsx src/screens/MakeTenUnit.tsx
git commit -m "feat: add hint buttons with StepExplainer to addition/subtraction/make-ten units"
```

---

## Task 18: フェーズ1〜4の全体検証（プレビュー）

**Files:** なし（手動検証）

- [ ] **Step 1: 全テストと型チェック**

Run: `npx vitest run` then `npx tsc --noEmit`
Expected: 全テスト PASS、型エラーなし

- [ ] **Step 2: dev サーバを起動してプレビュー**

`preview_start` で dev サーバ（`npm run dev`）を起動。各単元（かけ算・わり算・二桁たし・二桁ひき・さくらんぼ・たし・ひき・10をつくる）を開き、💡ヒントボタンを押す。確認項目:
- StepExplainer が全画面で開く
- 「つぎへ ▶」でステップが進み、最後に「わかった！」が出る
- 各ステップで読み上げ（speakJa）が走る
- 「とじる」「わかった！」で閉じてゲームに戻れる
- `preview_console_logs` でエラーが出ていないこと

問題があればソースを修正し、再確認する。

- [ ] **Step 3: 検証結果をユーザーに共有（screenshot）**

`preview_screenshot` でヒント画面を1枚撮ってユーザーに見せる。

---

# フェーズ5: 物語問題文（scenarios）

## Task 19: scenarios.ts とテスト（TDD）

**Files:**
- Create: `src/data/scenarios.ts`
- Test: `tests/data/scenarios.test.ts`

- [ ] **Step 1: 失敗するテストを書く**

`tests/data/scenarios.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { SCENARIOS, pickScenario } from '../../src/data/scenarios';

const UNIT_IDS = [
  'make-ten',
  'addition',
  'subtraction',
  'cherry-calc',
  'big-addition',
  'big-subtraction',
  'multiplication',
  'division',
];

describe('SCENARIOS', () => {
  it('has at least one scenario for every unit', () => {
    for (const id of UNIT_IDS) {
      expect(SCENARIOS[id]?.length ?? 0).toBeGreaterThan(0);
    }
  });

  it('every build() returns a non-empty string', () => {
    for (const id of UNIT_IDS) {
      for (const sc of SCENARIOS[id]) {
        expect(sc.build({ a: 3, b: 2 }).length).toBeGreaterThan(0);
        expect(sc.emoji.length).toBeGreaterThan(0);
      }
    }
  });
});

describe('pickScenario', () => {
  it('returns a scenario for a known unit', () => {
    const sc = pickScenario('multiplication', () => 0);
    expect(sc).toBe(SCENARIOS['multiplication'][0]);
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx vitest run tests/data/scenarios.test.ts`
Expected: FAIL（モジュールが存在しない）

- [ ] **Step 3: scenarios.ts を実装**

`src/data/scenarios.ts`:

```ts
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
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npx vitest run tests/data/scenarios.test.ts`
Expected: PASS

- [ ] **Step 5: コミット**

```bash
git add src/data/scenarios.ts tests/data/scenarios.test.ts
git commit -m "feat: add scenarios data for mini-story problem text"
```

---

## Task 20: かけ算・わり算の Companion 文をシナリオ化

**Files:**
- Modify: `src/screens/MultiplicationUnit.tsx`
- Modify: `src/screens/DivisionUnit.tsx`

各単元は、問題の `emoji` をシナリオから供給し、Companion の `message` をシナリオ文に置き換える。問題更新時にシナリオも更新する。

- [ ] **Step 1: MultiplicationUnit を修正**

import に追加:

```tsx
import { pickScenario } from '../data/scenarios';
```

既存の `GROUP_EMOJI` 定数と `const [emoji] = useState(...)` を削除し、scenario state に置き換える。`const [problem, setProblem] = useState(...)` の直後に:

```tsx
  const [scenario, setScenario] = useState(() => pickScenario('multiplication'));
  const emoji = scenario.emoji;
```

正答後に次問題へ進む `setTimeout` 内（`setProblem(generateMultiplication());` の行）を以下に置き換える:

```tsx
        setTimeout(() => { setExpression('normal'); setProblem(generateMultiplication()); setScenario(pickScenario('multiplication')); processing.current = false; }, 900);
```

Companion の `message` を置き換える:

```tsx
        message={scenario.build({ a: problem.a, b: problem.b })}
```

- [ ] **Step 2: DivisionUnit を修正**

import に追加:

```tsx
import { pickScenario } from '../data/scenarios';
```

既存の `SHARE_EMOJI` 定数と `const [emoji] = useState(...)` を削除。`const [problem, setProblem] = useState(...)` の直後に:

```tsx
  const [scenario, setScenario] = useState(() => pickScenario('division'));
  const emoji = scenario.emoji;
```

正答後の `setTimeout` 内（`setProblem(generateDivision());`）を置き換える:

```tsx
        setTimeout(() => { setExpression('normal'); setProblem(generateDivision()); setScenario(pickScenario('division')); processing.current = false; }, 900);
```

Companion の `message` を置き換える:

```tsx
        message={scenario.build({ a: problem.dividend, b: problem.divisor })}
```

- [ ] **Step 3: 型チェック**

Run: `npx tsc --noEmit`
Expected: エラーなし

- [ ] **Step 4: コミット**

```bash
git add src/screens/MultiplicationUnit.tsx src/screens/DivisionUnit.tsx
git commit -m "feat: use scenario story text in multiplication/division units"
```

---

## Task 21: 残り6単元の Companion 文をシナリオ化

**Files:**
- Modify: `src/screens/MakeTenUnit.tsx`
- Modify: `src/screens/AdditionUnit.tsx`
- Modify: `src/screens/SubtractionUnit.tsx`
- Modify: `src/screens/CherryCalcUnit.tsx`
- Modify: `src/screens/BigAdditionUnit.tsx`
- Modify: `src/screens/BigSubtractionUnit.tsx`

- [ ] **Step 1: MakeTenUnit を修正**

import に追加:

```tsx
import { pickScenario } from '../data/scenarios';
```

`FRUITS` 定数と `randomFruit()` と `const [fruit, setFruit] = useState(randomFruit);` を削除。`const [current, setCurrent] = useState(newCurrent);` の直後に:

```tsx
  const [scenario, setScenario] = useState(() => pickScenario('make-ten'));
  const fruit = scenario.emoji;
```

正答後の `setTimeout` 内、`setFruit(randomFruit());` の行を削除し、代わりに `setCurrent(newCurrent());` の行の直後に追加:

```tsx
          setScenario(pickScenario('make-ten'));
```

Companion の `message` を置き換える:

```tsx
        message={scenario.build({ a: current, b: missingToTen(current) })}
```

- [ ] **Step 2: AdditionUnit を修正**

import に追加:

```tsx
import { pickScenario } from '../data/scenarios';
```

`ANIMALS` 定数と `const [animal] = useState(...)` を削除。`const [problem, setProblem] = useState(...)` の直後に:

```tsx
  const [scenario, setScenario] = useState(() => pickScenario('addition'));
  const animal = scenario.emoji;
```

正答後の `setTimeout` 内（`setProblem(generateAddition());`）を置き換える:

```tsx
        setTimeout(() => { setExpression('normal'); setProblem(generateAddition()); setScenario(pickScenario('addition')); processing.current = false; }, 900);
```

Companion の `message` を置き換える:

```tsx
        message={scenario.build({ a: problem.a, b: problem.b })}
```

（Task 17 で追加した `explainAddition(problem, animal)` の `animal` はそのまま機能する）

- [ ] **Step 3: SubtractionUnit を修正**

import に追加:

```tsx
import { pickScenario } from '../data/scenarios';
```

`FOODS` 定数と `const [food] = useState(...)` を削除。`const [problem, setProblem] = useState(...)` の直後に:

```tsx
  const [scenario, setScenario] = useState(() => pickScenario('subtraction'));
  const food = scenario.emoji;
```

正答後の `setTimeout` 内（`setProblem(generateSubtraction());`）を置き換える:

```tsx
        setTimeout(() => { setExpression('normal'); setProblem(generateSubtraction()); setScenario(pickScenario('subtraction')); processing.current = false; }, 900);
```

`const message = ...` の行を置き換える:

```tsx
  const message = scenario.build({ a: problem.a, b: problem.b });
```

（`food.repeat(...)` の視覚と `explainSubtraction(problem, food)` はそのまま機能する）

- [ ] **Step 4: CherryCalcUnit を修正**

import に追加:

```tsx
import { pickScenario } from '../data/scenarios';
```

`const [problem, setProblem] = useState(...)` の直後に:

```tsx
  const [scenario, setScenario] = useState(() => pickScenario('cherry-calc'));
```

`nextProblem()` 関数内の `setProblem(generateCarryProblem());` の直後に追加:

```tsx
    setScenario(pickScenario('cherry-calc'));
```

Companion の `message` を置き換える:

```tsx
        message={scenario.build({ a: problem.a, b: problem.b })}
```

- [ ] **Step 5: BigAdditionUnit を修正**

import に追加:

```tsx
import { pickScenario } from '../data/scenarios';
```

`const [problem, setProblem] = useState(...)` の直後に:

```tsx
  const [scenario, setScenario] = useState(() => pickScenario('big-addition'));
```

正答後の `setTimeout` 内（`setProblem(generateBigAddition());`）を置き換える:

```tsx
        setTimeout(() => { setExpression('normal'); setProblem(generateBigAddition()); setScenario(pickScenario('big-addition')); processing.current = false; }, 900);
```

Companion の `message` を置き換える:

```tsx
        message={scenario.build({ a: problem.a, b: problem.b })}
```

- [ ] **Step 6: BigSubtractionUnit を修正**

import に追加:

```tsx
import { pickScenario } from '../data/scenarios';
```

`const [problem, setProblem] = useState(...)` の直後に:

```tsx
  const [scenario, setScenario] = useState(() => pickScenario('big-subtraction'));
```

正答後の `setTimeout` 内（`setProblem(generateBigSubtraction());`）を置き換える:

```tsx
        setTimeout(() => { setExpression('normal'); setProblem(generateBigSubtraction()); setScenario(pickScenario('big-subtraction')); processing.current = false; }, 900);
```

Companion の `message` を置き換える:

```tsx
        message={scenario.build({ a: problem.a, b: problem.b })}
```

- [ ] **Step 7: 型チェックとテスト**

Run: `npx tsc --noEmit` then `npx vitest run`
Expected: エラーなし、全テスト PASS

- [ ] **Step 8: コミット**

```bash
git add src/screens/MakeTenUnit.tsx src/screens/AdditionUnit.tsx src/screens/SubtractionUnit.tsx src/screens/CherryCalcUnit.tsx src/screens/BigAdditionUnit.tsx src/screens/BigSubtractionUnit.tsx
git commit -m "feat: use scenario story text across remaining units"
```

---

# フェーズ6: もんだいづくり 2段階選択

## Task 22: Template に title/sampleA/sampleB を追加し場面を+2（TDD）

**Files:**
- Modify: `src/lib/problemTemplates.ts`
- Test: `tests/lib/problemTemplates.test.ts`（追記）

- [ ] **Step 1: 失敗するテストを追記**

`tests/lib/problemTemplates.test.ts` の `describe('TEMPLATES', ...)` ブロック内に追加:

```ts
  it('every template has title and sample numbers in range', () => {
    for (const t of TEMPLATES) {
      expect(t.title.length).toBeGreaterThan(0);
      expect(t.sampleA).toBeGreaterThanOrEqual(t.aRange[0]);
      expect(t.sampleA).toBeLessThanOrEqual(t.aRange[1]);
      expect(t.sampleB).toBeGreaterThanOrEqual(t.bRange[0]);
      expect(t.sampleB).toBeLessThanOrEqual(t.bRange[1]);
    }
  });

  it('has 2 templates each for multiplication and division', () => {
    expect(TEMPLATES.filter((t) => t.type === 'multiplication')).toHaveLength(2);
    expect(TEMPLATES.filter((t) => t.type === 'division')).toHaveLength(2);
  });
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx vitest run tests/lib/problemTemplates.test.ts`
Expected: FAIL（`title` が型に無い / かけ・わりが各1件）

- [ ] **Step 3: Template 型に項目を追加**

`src/lib/problemTemplates.ts` の `Template` interface を更新:

```ts
export interface Template {
  id: string;
  type: ProblemType;
  title: string; // 場面名（例:「どうぶつ」「たべもの」）
  textPattern: string;
  answerFn: (vars: { a: number; b: number }) => number;
  emojiOptions: string[];
  aRange: [number, number];
  bRange: [number, number];
  sampleA: number; // プレビュー用の見本の数字
  sampleB: number;
}
```

- [ ] **Step 4: 既存6テンプレートに title/sampleA/sampleB を付与し、かけ・わりに各+1場面**

`TEMPLATES` 配列を以下に置き換える:

```ts
export const TEMPLATES: Template[] = [
  {
    id: 'add-animals',
    type: 'addition',
    title: 'どうぶつ',
    textPattern: '{emoji}が {a}ひき。{b}ひき やってきた。ぜんぶで なんびき？',
    answerFn: ({ a, b }) => a + b,
    emojiOptions: ['🐱', '🐶', '🐸', '🐼', '🦊'],
    aRange: [1, 9],
    bRange: [1, 9],
    sampleA: 3,
    sampleB: 2,
  },
  {
    id: 'add-food',
    type: 'addition',
    title: 'たべもの',
    textPattern: '{emoji}が {a}こ。{b}こ もらった。ぜんぶで？',
    answerFn: ({ a, b }) => a + b,
    emojiOptions: ['🍎', '🍊', '🍩', '🍪', '🍭'],
    aRange: [1, 9],
    bRange: [1, 9],
    sampleA: 4,
    sampleB: 3,
  },
  {
    id: 'sub-eat',
    type: 'subtraction',
    title: 'たべちゃった',
    textPattern: '{emoji}が {a}こ あったよ。{b}こ たべちゃった。のこりは なんこ？',
    answerFn: ({ a, b }) => a - b,
    emojiOptions: ['🍪', '🍬', '🍭', '🍩', '🍰'],
    aRange: [5, 10],
    bRange: [1, 4],
    sampleA: 8,
    sampleB: 3,
  },
  {
    id: 'sub-lost',
    type: 'subtraction',
    title: 'なくなった',
    textPattern: '{emoji}が {a}こ あった。{b}こ なくなった。のこりは？',
    answerFn: ({ a, b }) => a - b,
    emojiOptions: ['🔴', '🔵', '⭐', '🎈', '🌸'],
    aRange: [5, 10],
    bRange: [1, 4],
    sampleA: 7,
    sampleB: 2,
  },
  {
    id: 'mul-groups',
    type: 'multiplication',
    title: 'おさらに のせる',
    textPattern: '{emoji}が {b}こずつ {a}つの グループ。ぜんぶで なんこ？',
    answerFn: ({ a, b }) => a * b,
    emojiOptions: ['🍩', '⭐', '🎈', '🐟', '🌸'],
    aRange: [2, 5],
    bRange: [2, 5],
    sampleA: 3,
    sampleB: 4,
  },
  {
    id: 'mul-baskets',
    type: 'multiplication',
    title: 'かごに いれる',
    textPattern: '{emoji}を 1かごに {b}こ。{a}かご あるよ。ぜんぶで なんこ？',
    answerFn: ({ a, b }) => a * b,
    emojiOptions: ['🍓', '🍊', '🥕', '🌰', '🍇'],
    aRange: [2, 5],
    bRange: [2, 5],
    sampleA: 4,
    sampleB: 3,
  },
  {
    id: 'div-share',
    type: 'division',
    title: 'みんなで わける',
    textPattern: '{emoji}が {a}こ。{b}にんで わけると 1にん なんこ？',
    answerFn: ({ a, b }) => Math.floor(a / b),
    emojiOptions: ['🍪', '🍬', '🍭', '🍩', '🍰'],
    aRange: [6, 20],
    bRange: [2, 5],
    sampleA: 12,
    sampleB: 3,
  },
  {
    id: 'div-rows',
    type: 'division',
    title: 'おなじ かずに ならべる',
    textPattern: '{emoji}が {a}こ。{b}れつに ならべると 1れつ なんこ？',
    answerFn: ({ a, b }) => Math.floor(a / b),
    emojiOptions: ['⭐', '🎀', '🌸', '🔵', '🍬'],
    aRange: [6, 20],
    bRange: [2, 5],
    sampleA: 12,
    sampleB: 4,
  },
];
```

- [ ] **Step 5: テストが通ることを確認**

Run: `npx vitest run tests/lib/problemTemplates.test.ts`
Expected: PASS

- [ ] **Step 6: コミット**

```bash
git add src/lib/problemTemplates.ts tests/lib/problemTemplates.test.ts
git commit -m "feat: add title/sample fields and +1 scene each for multiply/divide templates"
```

---

## Task 23: ProblemMakerScreen に演算えらび（op）ステップを追加

**Files:**
- Modify: `src/screens/ProblemMakerScreen.tsx`

- [ ] **Step 1: step 型と state を拡張**

import に追加:

```tsx
import { TEMPLATES, fillTemplate, type ProblemType, type Template, type TemplateFilled } from '../lib/problemTemplates';
```

（既存の problemTemplates import 行を上に置き換え）

`const [step, setStep] = useState<'select' | 'fill' | 'preview'>('select');` を置き換える:

```tsx
  const [step, setStep] = useState<'op' | 'select' | 'fill' | 'preview'>('op');
  const [op, setOp] = useState<ProblemType | null>(null);
```

- [ ] **Step 2: op ステップ（演算えらび）を描画**

`if (step === 'select') {` のブロックの直前に、以下の新しいブロックを追加:

```tsx
  const OPS: { type: ProblemType; label: string; mark: string; color: string }[] = [
    { type: 'addition', label: 'たしざん', mark: '➕', color: 'bg-sky-400 shadow-[0_4px_0_#0369a1]' },
    { type: 'subtraction', label: 'ひきざん', mark: '➖', color: 'bg-orange-400 shadow-[0_4px_0_#c2410c]' },
    { type: 'multiplication', label: 'かけざん', mark: '✖️', color: 'bg-purple-400 shadow-[0_4px_0_#7e22ce]' },
    { type: 'division', label: 'わりざん', mark: '➗', color: 'bg-green-500 shadow-[0_4px_0_#15803d]' },
  ];

  if (step === 'op') {
    return (
      <div className="flex min-h-screen flex-col items-center gap-6 bg-gradient-to-b from-green-100 to-amber-50 p-6">
        <h1 className="text-2xl font-bold text-green-800">どの けいさんに する？</h1>
        <div className="grid grid-cols-2 gap-4">
          {OPS.map((o) => (
            <motion.button
              key={o.type}
              type="button"
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.05 }}
              onClick={() => {
                setOp(o.type);
                setStep('select');
              }}
              className={`flex h-32 w-40 flex-col items-center justify-center rounded-2xl text-white ${o.color} active:translate-y-1`}
            >
              <span className="text-5xl">{o.mark}</span>
              <span className="mt-2 text-xl font-bold">{o.label}</span>
            </motion.button>
          ))}
        </div>
        <button type="button" onClick={onExit} className="text-sm text-amber-600 underline">もどる</button>
      </div>
    );
  }
```

- [ ] **Step 3: select ステップを改修（演算で絞り込み・実例文を表示・もどる先を op に）**

`if (step === 'select') {` ブロック全体を以下に置き換える:

```tsx
  if (step === 'select') {
    const list = TEMPLATES.filter((t) => t.type === op);
    return (
      <div className="flex min-h-screen flex-col items-center gap-6 bg-gradient-to-b from-green-100 to-amber-50 p-6">
        <h1 className="text-2xl font-bold text-green-800">どの ばめんに する？</h1>
        <div className="flex flex-wrap justify-center gap-4">
          {list.map((tpl) => {
            const example = fillTemplate(tpl, {
              a: tpl.sampleA,
              b: tpl.sampleB,
              emoji: tpl.emojiOptions[0],
            });
            return (
              <motion.button
                key={tpl.id}
                type="button"
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.05 }}
                onClick={() => {
                  setSelectedTpl(tpl);
                  setA(tpl.sampleA);
                  setB(tpl.sampleB);
                  setEmojiIdx(0);
                  setStep('fill');
                }}
                className="w-56 rounded-2xl border-2 border-green-200 bg-white p-4 text-center shadow-md"
              >
                <div className="text-3xl">{tpl.emojiOptions[0]}</div>
                <div className="mt-1 text-base font-bold text-green-800">{tpl.title}</div>
                <div className="mt-2 text-xs text-amber-700 whitespace-pre-line">{example.questionText}</div>
              </motion.button>
            );
          })}
        </div>
        <button type="button" onClick={() => setStep('op')} className="text-sm text-amber-600 underline">もどる</button>
      </div>
    );
  }
```

- [ ] **Step 4: fill ステップの「もどる」先は select のまま（変更不要を確認）**

`if (step === 'fill' && selectedTpl) {` ブロック内の `onClick={() => setStep('select')}` はそのまま（select へ戻る）。変更不要。

- [ ] **Step 5: 型チェック**

Run: `npx tsc --noEmit`
Expected: エラーなし

- [ ] **Step 6: コミット**

```bash
git add src/screens/ProblemMakerScreen.tsx
git commit -m "feat: add operation-picker step and example-text scene selection to ProblemMakerScreen"
```

---

## Task 24: 最終検証（全テスト・型・プレビュー）

**Files:** なし（検証）

- [ ] **Step 1: 全テストと型チェック**

Run: `npx vitest run` then `npx tsc --noEmit`
Expected: 全テスト PASS、型エラーなし

- [ ] **Step 2: ビルド確認**

Run: `npm run build`
Expected: ビルド成功

- [ ] **Step 3: dev サーバでプレビュー検証**

`preview_start` で起動し、以下を確認:
- もんだいづくり: 演算えらび（➕➖✖️➗）→ 場面えらび（実例文が出る・プレースホルダ無し）→ かず → かんせい の流れ。「もどる」が op まで戻れること
- 各単元の物語問題文が改行付きで表示されること
- 💡ヒントの StepExplainer がシナリオ emoji と一致した絵で表示されること
- `preview_console_logs` でエラーなし

問題があれば修正して再確認。

- [ ] **Step 4: 検証結果を screenshot で共有**

`preview_screenshot` でもんだいづくりの演算えらび画面と、いずれかの単元のヒント画面を撮ってユーザーに共有。

---

## 自己レビュー結果

- **仕様カバレッジ**: A（StepExplainer＋explain×8単元: Task 1-17）/ B（scenarios: Task 19-21）/ C（2段階もんだいづくり: Task 22-23）すべてにタスクが対応。
- **プレースホルダ**: なし（全コードを記載）。
- **型整合性**: `ExplainStep` 型は Task 1 で定義し全 explain 関数で共用。`explainMultiplication/Division/Addition/Subtraction/MakeTen` は emoji 引数あり、`explainBigAddition/BigSubtraction/Cherry` は emoji 引数なしで、画面側の呼び出し（Task 7,8,11,12,16,17）と一致。`Template` の新フィールドは Task 22 で定義し Task 23 で参照。
```
