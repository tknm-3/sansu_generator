# 設計: 問題画面の常時視覚化（具体先・Concrete-first）

日付: 2026-05-24

## 背景・狙い

メモ `docs/second.txt` の方針（CRA: 具体→表象→式で考えを育てる）をもとに、
**問題画面そのものを視覚的にし、子どもが現実のものを想像しながら考えられるようにする**。

現状、実物を並べる視覚はヒントの `StepExplainer` の中が中心で、メイン問題画面に
場面の絵が無い単元が残っている。具体（Concrete）がヒントの奥に隠れ、子どもは
最初から抽象的な文章で考えさせられている。本仕様で、メイン画面に最初から実物を
並べて見せる（具体先）。

### 決定事項（ブレストで合意）
- 視覚は **最初から常に表示**（ボタンで後出しにしない）。
- 絵で **数えれば答えが分かる状態でOK**（指で数えるのが低年齢の考える土台）。
- 今回の範囲は **問題画面の視覚化のみ**。誤答タイプ別フィードバック(Phase 5)は含めない。

## 対象範囲

メイン画面に場面の絵が無い／不十分な **4単元** が対象:
- AdditionUnit … 絵なし
- SubtractionUnit … 現状 `food.repeat(answer)` で「残り＝答え」だけ表示。場面の絵に置き換える。
- BigAdditionUnit … 絵なし
- BigSubtractionUnit … 絵なし

対象外（既にメイン画面に絵あり、触らない）:
- MakeTenUnit（`MakeTenFrame`）
- CherryCalcUnit（`CherryBranch`）
- MultiplicationUnit（ローカル `GroupVisual`）
- DivisionUnit（ローカル `ShareVisual`）

## アーキテクチャ

純関数 + 描画コンポーネントの2層（既存方針に一致）。

### 1. `src/lib/problemScene.ts`（新規・純関数）

問題から「画面に出す場面」を表す軽量モデルを返す。

```ts
export type ProblemScene =
  | { kind: 'combine'; emoji: string; a: number; b: number }                 // たし算: 2山
  | { kind: 'takeAway'; emoji: string; total: number; remove: number }       // 引き算: 全部+消す印
  | { kind: 'placeValue'; aTens: number; aOnes: number; bTens: number; bOnes: number }; // 二桁: 位ブロック2つ

export function sceneFor(
  unitId: string,
  problem: Record<string, unknown>,
  emoji: string,
): ProblemScene | null;
```

単元 → scene 種別の対応:
- `addition` → `combine { emoji, a, b }`
- `subtraction` → `takeAway { emoji, total: a, remove: b }`
- `big-addition` → `placeValue { aTens: tensA, aOnes: onesA, bTens: tensB, bOnes: onesB }`
- `big-subtraction` → `placeValue { aTens: tensA, aOnes: onesA, bTens: tensB, bOnes: onesB }`
- 未対応 unitId → `null`

純関数・副作用なし。Vitest でテスト可能。

### 2. `src/components/ProblemVisual.tsx`（新規・描画）

```ts
interface Props { scene: ProblemScene | null }
```

scene が `null` のとき何も描画しない（`return null`）。種別ごとに描画:
- `combine`: a個の emoji 群と b個の emoji 群を2つの枠で並べ、間に「と」を表示。
  全部見えるので数えれば合計が分かる。
- `takeAway`: total個を並べ、後ろ remove個に半透明＋「✕」を重ねる。
  残り（消えていない数）を数えれば答え。
- `placeValue`: 既存 `PlaceValueBlocks` を2つ並べる（A と B、carry無し）。
  十のまとまりと一のばらで二桁の量を具体表現。

ひらがな中心・大きめ表示。登場アニメは既存 `GroupsVisual` に倣い framer-motion の
`initial/animate` scale を使う（任意）。白カード `bg-white rounded-2xl shadow p-4` で統一。

### 3. 4単元画面への組み込み

各画面で、Companion（文章）と AnswerButtons（数字ボタン）の間に常時表示:

```tsx
<ProblemVisual scene={sceneFor(SKILL_ID, problem, <emoji>)} />
```

- `<emoji>` は各画面が既に持つ `scenario.emoji`（`animal` / `food` 等の変数）を渡す。
- AdditionUnit: AnswerButtons の直前に追加。
- SubtractionUnit: 既存の `<div className="text-6xl">{food.repeat(...)}</div>`（答え表示）を
  `<ProblemVisual>` に置き換える。
- BigAdditionUnit / BigSubtractionUnit: AnswerButtons の直前に追加。

出題・採点ロジックは一切変更しない。`showFormula` / ヒント / 既存UIはそのまま。

## データフロー

`generateXxx()` → `problem` → `sceneFor(unitId, problem, emoji)` → `ProblemScene`
→ `<ProblemVisual>` が種別描画。一方向、状態追加なし。

## エラー処理

- `sceneFor` が未知 unitId や想定外データを受けたら `null` を返す。
- `ProblemVisual` は `null` で何も出さない（画面は壊れない）。

## テスト（Vitest）

`src/lib/problemScene.test.ts`:
- addition → `combine`、emoji/a/b 一致。
- subtraction → `takeAway`、total=a / remove=b。
- big-addition → `placeValue`、aTens/aOnes/bTens/bOnes が a,b の桁と一致。
- big-subtraction → `placeValue`、同上。
- 未知 unitId（例 `'xyz'`）→ `null`。

## 数値レンジ（確認済み）

- addition: a 1〜9, a+b ≤ 20（2山で最大~18個、表示可）。
- subtraction: a 2〜10, b 1..a-1（≤10個）。
- big-addition: a,b 10〜49 → 位ブロック2つ。
- big-subtraction: a 最大~89, b 10〜49 → 位ブロック2つ。

## 禁止事項（メモ準拠）

- サーバー / DB / 外部API / アカウント追加なし。
- 既存の採点・出題ロジックを変更しない。
- 報酬・スタンプを増やさない。
- 既に絵のある単元（MakeTen/Cherry/Mult/Div）を触らない。

## 実装順（小さく）

1. `problemScene.ts` + テスト。
2. `ProblemVisual.tsx`。
3. 4単元に組み込み（Subtraction は既存答え表示を置換）。
4. `npm run test` / `npm run build` 確認。
