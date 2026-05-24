# 設計: 問題画面の常時視覚化（具体先・Concrete-first）

日付: 2026-05-24

## 背景・狙い

メモ `docs/second.txt` の方針（CRA: 具体→表象→式で考えを育てる）をもとに、
**問題画面そのものを視覚的にし、子どもが現実のものを想像しながら考えられるようにする**。

現状、実物を並べる視覚（GroupsVisual / PlaceValueBlocks / objects など）は
ヒントの `StepExplainer` の中にしか無く、メイン問題画面は「文章 + emoji + 数字ボタン」のみ。
つまり具体（Concrete）がヒントの奥に隠れ、子どもは最初から抽象的な文章で考えさせられている。

本仕様で、メイン画面に最初から実物を並べて見せる（具体先）。

### 決定事項（ブレストで合意）
- 視覚は **最初から常に表示**（ボタンで後出しにしない）。
- 絵で **数えれば答えが分かる状態でOK**（指で数えるのが低年齢の考える土台）。
- 今回の範囲は **問題画面の視覚化のみ**。誤答タイプ別フィードバック(Phase 5)は今回含めない。

## 対象範囲

絵なしの6単元のみ対象:
- AdditionUnit
- SubtractionUnit
- MultiplicationUnit
- DivisionUnit
- BigAdditionUnit
- BigSubtractionUnit

対象外（既にメイン画面に絵あり、触らない）:
- MakeTenUnit（MakeTenFrame 表示済み）
- CherryCalcUnit（CherryBranch 表示済み）

## アーキテクチャ

純関数 + 描画コンポーネントの2層（既存方針に一致）。

### 1. `src/lib/problemScene.ts`（新規・純関数）

問題から「画面に出す場面」を表す軽量モデルを返す。

```ts
export type ProblemScene =
  | { kind: 'combine'; emoji: string; a: number; b: number }            // たし算
  | { kind: 'takeAway'; emoji: string; total: number; remove: number }  // 引き算
  | { kind: 'groups'; emoji: string; perGroup: number; groups: number } // かけ算
  | { kind: 'share'; emoji: string; total: number; containers: number } // わり算
  | { kind: 'placeValue'; tens: number; ones: number };                 // 二桁(big)

export function sceneFor(
  unitId: string,
  problem: Record<string, unknown>,
  emoji: string,
): ProblemScene | null;
```

単元 → scene 種別の対応:
- `addition` → `combine { a, b }`
- `subtraction` → `takeAway { total: a, remove: b }`
- `multiplication` → `groups { perGroup: b, groups: a }`
- `division` → `share { total: dividend, containers: divisor }`
- `big-addition` / `big-subtraction` → `placeValue { tens, ones }`（a の十・一の位）
- 未対応 unitId → `null`

純関数なので副作用なし。Vitest でテスト可能。

### 2. `src/components/ProblemVisual.tsx`（新規・描画）

```ts
interface Props { scene: ProblemScene | null }
```

scene が `null` のとき何も描画しない。種別ごとに描画:
- `combine`: a個の emoji と b個の emoji を2グループで並べ、「と」でつなぐ。
- `takeAway`: total個を並べ、後ろ remove個に × 印（残りを数えられる）。
- `groups`: 既存 `GroupsVisual` を再利用（emoji, perGroup, groups）。
- `share`: total個の山 + 空のいれもの containers個を並べる。
- `placeValue`: 既存 `PlaceValueBlocks` を再利用（tens, ones、carry無し）。

ひらがな中心・大きめ表示。framer-motion の登場アニメは任意（既存 objects 描画に合わせる程度）。

### 3. 6単元画面への組み込み

各画面で、Companion（文章）と AnswerButtons（数字ボタン）の間に常時表示:

```tsx
<ProblemVisual scene={sceneFor(SKILL_ID, problem, animal)} />
```

`emoji` は各画面が既に持つ `scenario.emoji` / `animal` を渡す。
出題・採点ロジックは一切変更しない。`showFormula` / ヒント / 既存UIはそのまま。

## データフロー

`generateXxx()` → `problem` → `sceneFor(unitId, problem, emoji)` → `ProblemScene`
→ `<ProblemVisual>` が種別描画。一方向、状態追加なし。

## エラー処理

- `sceneFor` が未知 unitId や想定外データを受けたら `null` を返す。
- `ProblemVisual` は `null` で何も出さない（画面は壊れない）。

## テスト（Vitest）

`src/lib/problemScene.test.ts`:
- addition → `combine`、a/b が一致。
- subtraction → `takeAway`、total=a / remove=b。
- multiplication → `groups`、perGroup=b / groups=a。
- division → `share`、total=dividend / containers=divisor。
- big-addition / big-subtraction → `placeValue`、tens/ones が a の桁と一致。
- 未知 unitId → `null`。

## 数値レンジ（確認済み）

- addition: a+b ≤ 20（最大~18個、2山で表示可）。
- subtraction: ≤10個。
- multiplication: a,b 2〜9（最大9×9、GroupsVisual がグリッド表示）。
- division: dividend 最大~81、containers 2〜8（山＋いれもの）。
- big add/sub: 二桁 → 位ブロックで表示（実物個別表示はしない）。

## 禁止事項（メモ準拠）

- サーバー / DB / 外部API / アカウント追加なし。
- 既存の採点・出題ロジックを変更しない。
- 報酬・スタンプを増やさない。
- MakeTen / Cherry の既存表示を壊さない。

## 実装順（小さく）

1. `problemScene.ts` + テスト。
2. `ProblemVisual.tsx`。
3. 6単元に `<ProblemVisual>` を差す。
4. `npm run test` / `npm run build` 確認。
