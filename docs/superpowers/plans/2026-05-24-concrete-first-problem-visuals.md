# 問題画面の常時視覚化 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 絵が無い4単元（addition / subtraction / big-addition / big-subtraction）のメイン問題画面に、最初から実物を並べた場面の絵を常時表示する。

**Architecture:** 純関数 `sceneFor()` が問題から `ProblemScene` を返し、描画コンポーネント `<ProblemVisual>` が種別ごとに描く2層構成。既存の `PlaceValueBlocks` を再利用。出題・採点ロジックは不変。

**Tech Stack:** React 19 + TypeScript + Vite, Tailwind v4, framer-motion, Vitest。

仕様書: `docs/superpowers/specs/2026-05-24-concrete-first-problem-visuals-design.md`

---

## File Structure

- Create: `src/lib/problemScene.ts` — `ProblemScene` 型と純関数 `sceneFor()`。
- Create: `src/lib/problemScene.test.ts` — `sceneFor()` のテスト。
- Create: `src/components/ProblemVisual.tsx` — scene を種別描画。
- Modify: `src/screens/AdditionUnit.tsx` — `<ProblemVisual>` 追加。
- Modify: `src/screens/SubtractionUnit.tsx` — 既存の答え表示を `<ProblemVisual>` に置換。
- Modify: `src/screens/BigAdditionUnit.tsx` — `<ProblemVisual>` 追加。
- Modify: `src/screens/BigSubtractionUnit.tsx` — `<ProblemVisual>` 追加。

---

### Task 1: `problemScene.ts` 純関数と型

**Files:**
- Create: `src/lib/problemScene.ts`
- Test: `src/lib/problemScene.test.ts`

- [ ] **Step 1: 失敗するテストを書く**

`src/lib/problemScene.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { sceneFor } from './problemScene';

describe('sceneFor', () => {
  it('addition は combine を返す', () => {
    const s = sceneFor('addition', { a: 3, b: 4, choices: [] }, '🐱');
    expect(s).toEqual({ kind: 'combine', emoji: '🐱', a: 3, b: 4 });
  });

  it('subtraction は takeAway を返す (total=a, remove=b)', () => {
    const s = sceneFor('subtraction', { a: 7, b: 2, choices: [] }, '🍎');
    expect(s).toEqual({ kind: 'takeAway', emoji: '🍎', total: 7, remove: 2 });
  });

  it('big-addition は placeValue を返す (両オペランドの桁)', () => {
    const s = sceneFor(
      'big-addition',
      { a: 23, b: 45, onesA: 3, tensA: 2, onesB: 5, tensB: 4, choices: [] },
      '🍪',
    );
    expect(s).toEqual({ kind: 'placeValue', aTens: 2, aOnes: 3, bTens: 4, bOnes: 5 });
  });

  it('big-subtraction は placeValue を返す', () => {
    const s = sceneFor(
      'big-subtraction',
      { a: 58, b: 23, onesA: 8, tensA: 5, onesB: 3, tensB: 2, choices: [] },
      '⭐',
    );
    expect(s).toEqual({ kind: 'placeValue', aTens: 5, aOnes: 8, bTens: 2, bOnes: 3 });
  });

  it('未知の unitId は null', () => {
    expect(sceneFor('xyz', { a: 1, b: 1 }, '🍎')).toBeNull();
  });
});
```

- [ ] **Step 2: テストが失敗するのを確認**

Run: `npx vitest run src/lib/problemScene.test.ts`
Expected: FAIL（`sceneFor` が存在しない / モジュール解決エラー）

- [ ] **Step 3: 最小実装を書く**

`src/lib/problemScene.ts`:

```ts
export type ProblemScene =
  | { kind: 'combine'; emoji: string; a: number; b: number }
  | { kind: 'takeAway'; emoji: string; total: number; remove: number }
  | { kind: 'placeValue'; aTens: number; aOnes: number; bTens: number; bOnes: number };

export function sceneFor(
  unitId: string,
  problem: Record<string, unknown>,
  emoji: string,
): ProblemScene | null {
  const num = (key: string): number => {
    const v = problem[key];
    return typeof v === 'number' ? v : 0;
  };

  switch (unitId) {
    case 'addition':
      return { kind: 'combine', emoji, a: num('a'), b: num('b') };
    case 'subtraction':
      return { kind: 'takeAway', emoji, total: num('a'), remove: num('b') };
    case 'big-addition':
    case 'big-subtraction':
      return {
        kind: 'placeValue',
        aTens: num('tensA'),
        aOnes: num('onesA'),
        bTens: num('tensB'),
        bOnes: num('onesB'),
      };
    default:
      return null;
  }
}
```

- [ ] **Step 4: テストが通るのを確認**

Run: `npx vitest run src/lib/problemScene.test.ts`
Expected: PASS（5件）

- [ ] **Step 5: コミット**

```bash
git add src/lib/problemScene.ts src/lib/problemScene.test.ts
git commit -m "feat: add sceneFor pure function for problem visuals"
```

---

### Task 2: `ProblemVisual` 描画コンポーネント

**Files:**
- Create: `src/components/ProblemVisual.tsx`

このコンポーネントは描画のみ（テストは Task 1 の純関数で担保。UIは最終ビルド/手動で確認）。

- [ ] **Step 1: コンポーネントを作成**

`src/components/ProblemVisual.tsx`:

```tsx
import { motion } from 'framer-motion';
import { PlaceValueBlocks } from './PlaceValueBlocks';
import type { ProblemScene } from '../lib/problemScene';

interface Props {
  scene: ProblemScene | null;
}

function Pile({ emoji, count, startDelay = 0 }: { emoji: string; count: number; startDelay?: number }) {
  return (
    <div className="flex flex-wrap gap-1 justify-center rounded-lg border-2 border-amber-200 p-2 max-w-[8rem]">
      {Array.from({ length: count }).map((_, i) => (
        <motion.span
          key={i}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: startDelay + i * 0.04, type: 'spring' }}
          className="text-2xl"
        >
          {emoji}
        </motion.span>
      ))}
    </div>
  );
}

export function ProblemVisual({ scene }: Props) {
  if (!scene) return null;

  if (scene.kind === 'combine') {
    return (
      <div className="bg-white rounded-2xl shadow p-4 flex items-center gap-2 justify-center max-w-md">
        <Pile emoji={scene.emoji} count={scene.a} />
        <span className="text-xl font-bold text-amber-700">と</span>
        <Pile emoji={scene.emoji} count={scene.b} startDelay={scene.a * 0.04} />
      </div>
    );
  }

  if (scene.kind === 'takeAway') {
    return (
      <div className="bg-white rounded-2xl shadow p-4 flex flex-wrap gap-1 justify-center max-w-xs">
        {Array.from({ length: scene.total }).map((_, i) => {
          const removed = i >= scene.total - scene.remove;
          return (
            <motion.span
              key={i}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.04, type: 'spring' }}
              className="relative text-2xl"
            >
              <span className={removed ? 'opacity-30' : ''}>{scene.emoji}</span>
              {removed && (
                <span className="absolute inset-0 flex items-center justify-center text-red-500 font-bold">
                  ✕
                </span>
              )}
            </motion.span>
          );
        })}
      </div>
    );
  }

  // placeValue
  return (
    <div className="flex flex-col items-center gap-2">
      <PlaceValueBlocks tens={scene.aTens} ones={scene.aOnes} />
      <PlaceValueBlocks tens={scene.bTens} ones={scene.bOnes} />
    </div>
  );
}
```

- [ ] **Step 2: 型エラーが無いか確認**

Run: `npx tsc --noEmit`
Expected: エラーなし（終了コード 0）

- [ ] **Step 3: コミット**

```bash
git add src/components/ProblemVisual.tsx
git commit -m "feat: add ProblemVisual component for concrete problem layouts"
```

---

### Task 3: AdditionUnit に組み込み

**Files:**
- Modify: `src/screens/AdditionUnit.tsx`

- [ ] **Step 1: import を追加**

`src/screens/AdditionUnit.tsx` の import 群（`StepExplainer` の import 行の下）に追加:

```tsx
import { ProblemVisual } from '../components/ProblemVisual';
import { sceneFor } from '../lib/problemScene';
```

- [ ] **Step 2: AnswerButtons の直前に視覚を追加**

`<AnswerButtons choices={problem.choices} onPick={handlePick} disabled={expression === 'happy'} />` の
**直前** の行に追加:

```tsx
<ProblemVisual scene={sceneFor(SKILL_ID, problem, animal)} />
```

（`animal` は `const animal = scenario.emoji;` で既に定義済み、`SKILL_ID` は `'addition'`）

- [ ] **Step 3: 型エラーが無いか確認**

Run: `npx tsc --noEmit`
Expected: エラーなし

- [ ] **Step 4: コミット**

```bash
git add src/screens/AdditionUnit.tsx
git commit -m "feat: show combine visual on AdditionUnit"
```

---

### Task 4: SubtractionUnit の答え表示を視覚に置換

**Files:**
- Modify: `src/screens/SubtractionUnit.tsx`

- [ ] **Step 1: import を追加**

`StepExplainer` の import 行の下に追加:

```tsx
import { ProblemVisual } from '../components/ProblemVisual';
import { sceneFor } from '../lib/problemScene';
```

- [ ] **Step 2: 既存の答え表示行を置換**

次の既存行（`food.repeat` で残り＝答えを出している）を:

```tsx
<div className="text-6xl">{food.repeat(Math.max(0, answer))}</div>
```

次に置き換える:

```tsx
<ProblemVisual scene={sceneFor(SKILL_ID, problem, food)} />
```

（`food` は `const food = scenario.emoji;` で定義済み、`SKILL_ID` は `'subtraction'`。
これにより「残り＝答え」だけ出していた表示が、「全部＋消す印」の場面表示になる。）

- [ ] **Step 3: 未使用変数の確認**

`answer` 変数が他で使われていなければ未使用警告が出る。
Run: `grep -n "answer" src/screens/SubtractionUnit.tsx`
`const answer = problem.a - problem.b;` 以外に参照が無ければ、その宣言行を削除する。
参照が残っていれば削除しない。

- [ ] **Step 4: 型エラー・ビルド確認**

Run: `npx tsc --noEmit`
Expected: エラーなし（未使用変数エラーが出たら Step 3 を見直す）

- [ ] **Step 5: コミット**

```bash
git add src/screens/SubtractionUnit.tsx
git commit -m "feat: replace answer-only display with takeAway visual on SubtractionUnit"
```

---

### Task 5: BigAdditionUnit に組み込み

**Files:**
- Modify: `src/screens/BigAdditionUnit.tsx`

- [ ] **Step 1: import を追加**

import 群の末尾付近（`recordAnswer` の import 行の下など）に追加:

```tsx
import { ProblemVisual } from '../components/ProblemVisual';
import { sceneFor } from '../lib/problemScene';
```

- [ ] **Step 2: AnswerButtons の直前に視覚を追加**

`<AnswerButtons choices={problem.choices} onPick={handlePick} disabled={expression === 'happy'} />` の
**直前** に追加（`scenario.emoji` を直接渡す。Big画面は emoji 変数を持たないため）:

```tsx
<ProblemVisual scene={sceneFor(SKILL_ID, problem, scenario.emoji)} />
```

（`SKILL_ID` は `'big-addition'`）

- [ ] **Step 3: 型エラー確認**

Run: `npx tsc --noEmit`
Expected: エラーなし

- [ ] **Step 4: コミット**

```bash
git add src/screens/BigAdditionUnit.tsx
git commit -m "feat: show place-value visual on BigAdditionUnit"
```

---

### Task 6: BigSubtractionUnit に組み込み

**Files:**
- Modify: `src/screens/BigSubtractionUnit.tsx`

- [ ] **Step 1: import を追加**

import 群の末尾付近に追加:

```tsx
import { ProblemVisual } from '../components/ProblemVisual';
import { sceneFor } from '../lib/problemScene';
```

- [ ] **Step 2: AnswerButtons の直前に視覚を追加**

`<AnswerButtons choices={problem.choices} onPick={handlePick} disabled={expression === 'happy'} />` の
**直前** に追加:

```tsx
<ProblemVisual scene={sceneFor(SKILL_ID, problem, scenario.emoji)} />
```

（`SKILL_ID` は `'big-subtraction'`）

- [ ] **Step 3: 型エラー確認**

Run: `npx tsc --noEmit`
Expected: エラーなし

- [ ] **Step 4: コミット**

```bash
git add src/screens/BigSubtractionUnit.tsx
git commit -m "feat: show place-value visual on BigSubtractionUnit"
```

---

### Task 7: 全体検証

**Files:** なし（検証のみ）

- [ ] **Step 1: テスト全実行**

Run: `npm run test`
Expected: 全テスト PASS（`problemScene.test.ts` の5件を含む）

- [ ] **Step 2: 型チェック＋ビルド**

Run: `npm run build`
Expected: `tsc` エラーなし → `vite build` 成功（終了コード 0）

- [ ] **Step 3: 手動確認（開発サーバー）**

Run: `npm run dev`
ブラウザで 4単元（たし算・ひき算・大きいたし算・大きいひき算）を開き、確認:
- たし算: 2つの山＋「と」が最初から見える。
- ひき算: 全部の絵があり、後ろ remove個に ✕。残りを数えられる。
- 大きいたし算/ひき算: 位ブロックが2つ（A・B）表示される。
- 既存の文章・「しきを みる」・ヒント・数字ボタンが従来どおり動く。
- mult/div/make-ten/cherry は変化なし（触っていない）。
