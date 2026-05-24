# 仕組み理解・物語問題文・もんだいづくり改善 設計書

作成日: 2026-05-24

## 背景と目的

現状、各単元は「問題を出す」ことはできるが、**なぜその答えになるのか（仕組み）を理解させる仕掛けが実質ない**。

- さくらんぼ計算だけ分解ヒント（`CherryBranch`）があるが、**誤答後にしか出ない**。
- かけ算・わり算は絵のグループを常時出すが、「同じ数のかたまり＝累加／分ける」という意味の解説はない。
- 二桁のたしざんは筆算の形は出るが、「位ごとに計算して繰り上げる」手順の解説はない。

その結果、子どもが暗記や勘で答えてしまうリスクがある。本改修では次の3点を改善する。

1. **仕組み理解**: ヒントボタンで開く「タップで進むステップ解説画面」を全単元に追加。
2. **問題文**: キャラが登場するミニ物語風にして、低学年でも読みやすく・楽しく。
3. **もんだいづくり選択画面**: 「まず演算 → 次に場面」の2段階にし、プレースホルダ表示を廃止。

## エビデンス（設計の根拠）

- **CRA（Concrete–Representational–Abstract / 具体→表象→抽象）**: 具体物 → 図 → 式の順で見せると概念理解が定着する。メタ分析でも大きな効果量。特に繰り上がり・繰り下がりの手続き理解に有効。
  - 出典: [A Meta-Analytic Review of the CRA Math Approach (2025)](https://journals.sagepub.com/doi/10.1177/09388982241292299) / [Using the CRA Framework in Elementary Math (Edutopia)](https://www.edutopia.org/article/using-cra-framework-elementary-math/)
- **かけ算**: 「同じ数のかたまり（equal groups）→ くり返したし算 → アレイ」の順。九九暗記の前に「いくつのかたまりが何個」を体感させると、文章題・大きな数で強い。
  - 出典: [How Repeated Addition Helps Kids Learn Multiplication (Prodigy)](https://www.prodigygame.com/main-en/blog/how-repeated-addition-helps-kids-learn-multiplication) / [Why Teaching Multiplication with Arrays Boosts Understanding](https://hootyshomeroom.com/teaching-multiplication-with-arrays/)
- **わり算**: 「等分（何人に同じ数ずつ）」と「包含（何個ずつで何グループ）」の2つの意味。おはじきを実際に分ける操作が理解の核。
  - 出典: [How to Teach Multiplication and Division Using Different Strategies (BJU)](https://blog.bjupress.com/blog/2021/12/14/how-to-teach-multiplication-and-division-using-different-strategies/)

→ いずれも「**タップで進むステップ解説**」と相性が良く、各ステップを CRA の段階（具体→図→式）に対応させる。

## スコープ

対象単元（全8単元にステップ解説を付与）:
`make-ten` / `addition` / `subtraction` / `cherry-calc` / `big-addition` / `big-subtraction` / `multiplication` / `division`

非スコープ:
- 計算ロジック（出題範囲・採点）の変更はしない。物語文は既存の計算の「包み」を変えるだけ。
- チャレンジ・ミッション・スタンプ等の報酬系は変更しない（ただし物語文の流用は可）。

---

## A. アーキテクチャ：共通ステップ解説

### A-1. 共通コンポーネント `StepExplainer`

`src/components/StepExplainer.tsx`（新規）

- 役割: ステップ配列を受け取り、「つぎへ」で1ステップずつ表示する解説オーバーレイ。
- Props:
  ```ts
  interface StepExplainerProps {
    steps: ExplainStep[];
    onClose: () => void;
  }
  ```
- 機能: 現在ステップの描画、ステップインジケータ（既存 `StepIndicator` 流用）、「つぎへ」「とじる」ボタン、各ステップ表示時に `speakJa(step.narration)` で読み上げ。
- 表示形態: 既存の画面配色に合わせた全画面オーバーレイ（`fixed inset-0`）。

### A-2. ステップ型と種類

`src/lib/math/explain.ts`（新規・共通型）

```ts
export type ExplainStepKind =
  | 'objects'      // 具体物（emoji を個数分ならべる）
  | 'groups'       // かたまり（かけ算: b個ずつ a列 / わり算: 配るアニメ）
  | 'placeValue'   // 位ブロック（十の位・一の位）
  | 'cherryBranch' // さくらんぼ分解（既存 CherryBranch 流用）
  | 'equation';    // 式（抽象）

export interface ExplainStep {
  kind: ExplainStepKind;
  caption: string;     // 画面に出す短い説明（ひらがな）
  narration: string;   // 読み上げ用テキスト
  data: Record<string, unknown>; // kind ごとの描画データ
}
```

`StepExplainer` 内のレンダラが `kind` を見て対応コンポーネントを描画する。`data` の形は kind ごとに固定（下記）。

| kind | data の形 | 描画 |
|------|-----------|------|
| `objects` | `{ emoji: string; count: number }` | emoji を count 個ならべる |
| `groups` | `{ emoji: string; perGroup: number; groups: number }` | perGroup 個ずつ groups 列 |
| `placeValue` | `{ tens: number; ones: number; carry?: boolean }` | 十の位の棒＋一の位の玉 |
| `cherryBranch` | `{ b: number; split: number; carry: number }` | 既存 `CherryBranch` |
| `equation` | `{ text: string }` | 大きな式テキスト |

### A-3. 単元ごとの `explain()` 純粋関数

各単元の math lib に `explain(problem): ExplainStep[]` を追加（TDD 対象）。

- かけ算 `multiplication.ts`：3×4 →
  ① `objects`「🍩4こで 1つの かたまり」
  ② `groups`「それが 3つ。4+4+4 だね」
  ③ `equation`「3×4 ＝ 12」
- わり算 `division.ts`：12÷3 →
  ① `objects`「🍪12こ あるよ」
  ② `groups`「3人に 1こずつ くばると ひとり 4こ」
  ③ `equation`「12÷3 ＝ 4」
- 二桁たしざん `bigAddition.ts`：28+15 →
  ① `placeValue`「一のくらい 8+5＝13。10を くりあげ」(carry=true)
  ② `placeValue`「十のくらい 2+1+1＝4」
  ③ `equation`「28＋15 ＝ 43」
- 二桁ひきざん `bigSubtraction.ts`：繰り下がりを `placeValue` で同様に。
- さくらんぼ `cherryCalc.ts`：既存 `decompose` を ① `cherryBranch` ② `equation` の2ステップに。
- 1桁たし `addition.ts` / ひき `subtraction.ts` / 10をつくる `makeTen.ts`：`objects` 中心の2〜3ステップ。

### A-4. 各 Unit 画面への組み込み

- 各 `*Unit.tsx` に「ヒント💡」ボタンを追加し、`useState` で `StepExplainer` の開閉を管理。
- ボタン押下で `explain(problem)` を呼び、結果を `StepExplainer` に渡す。
- さくらんぼ計算は既存の「誤答後 branch 表示」を残しつつ、ヒントボタンからも開けるようにする。

---

## B. 問題文：ミニ物語風

### B-1. シナリオデータ `src/data/scenarios.ts`（新規）

単元別のシナリオ集を定義し、**問題文・ステップ解説・視覚の emoji を同じ scene から供給**して一貫させる。

```ts
export interface Scenario {
  emoji: string;          // 場面の主役 emoji（視覚・物語で共有）
  // 問題文を作る関数。数値を受け取りひらがなのミニ物語を返す。
  build: (vars: { a: number; b: number }) => string;
}
export const SCENARIOS: Record<string, Scenario[]>; // key = unitId
```

- 全部ひらがな、短文、改行（`\n`）で読みやすく。
- 各単元が問題生成時にランダムに1シナリオを選び、`build()` で問題文を作る。
- 読み上げ（`speakJa`）も同じ物語文を読む。

### B-2. 文体の指針と例

- 登場キャラ（うさぎ・くま等）＋「だれが・どうした」の場面。
- かけ算 例:
  「🐰うさぎさんの おみせ。\nおさら 1まいに 🍩が 4こ。\nおさらが 3まい あるよ。\nドーナツは ぜんぶで なんこ？」
- わり算 例:
  「🍪クッキーが 12こ。\n3にんで おなじ かずずつ わけるよ。\nひとり なんこ？」
- 既存の計算ロジック（数値・選択肢・採点）は不変。文章の包みだけ差し替える。

### B-3. 既存画面との接続

- 各 `*Unit.tsx` の `Companion` の `message` を、固定文字列からシナリオ由来の文字列に置き換える。
- 問題更新時にシナリオも更新する（`nextProblem` 相当の箇所）。

---

## C. もんだいづくり：2段階選択

### C-1. Template の拡張

`src/lib/problemTemplates.ts`

```ts
export interface Template {
  // 既存 ...
  title: string;             // 場面名（例:「どうぶつ」「たべもの」）
  sampleA: number;           // 見本の数字（プレビュー用）
  sampleB: number;
}
```

- 既存6テンプレートに `title` / `sampleA` / `sampleB` を付与。
- 演算別の場面数: たし2 / ひき2 / かけ1 / わり1。**かけ・わりに各+1場面を追加**してバランスを取る（合計8テンプレート）。

### C-2. 画面フロー

`src/screens/ProblemMakerScreen.tsx`

`step` を `'op' | 'select' | 'fill' | 'preview'` に拡張（`'op'` を新設、初期値）。

1. **`op`（新規・演算えらび）**: たしざん➕／ひきざん➖／かけ算✖️／わり算➗ の4枚の大カード。選ぶと `select` へ。
2. **`select`（場面えらび・改修）**: 選んだ演算の Template だけを表示。各カードは
   - `tpl.emojiOptions[0]` の絵
   - `tpl.title`（場面名）
   - **実数入りの例文**（`fillTemplate(tpl, { a: sampleA, b: sampleB, emoji })` の `questionText`）
   - を表示。**`textPattern.slice(0,20)` のプレースホルダ表示は廃止**。
3. **`fill` / `preview`**: 既存のまま流用。`fill` の「もどる」は `select` へ、`select` の「もどる」は `op` へ。

---

## D. ファイル構成

```
src/
  components/
    StepExplainer.tsx        [新規] 共通ステップ解説オーバーレイ
    PlaceValueBlocks.tsx     [新規] 位ブロック描画（placeValue 用）
    GroupsVisual.tsx         [新規] かたまり描画（groups 用、既存 GroupVisual を一般化）
  lib/math/
    explain.ts               [新規] ExplainStep 型・共通ヘルパ
    multiplication.ts        [修正] explain() 追加
    division.ts              [修正] explain() 追加
    bigAddition.ts           [修正] explain() 追加
    bigSubtraction.ts        [修正] explain() 追加
    cherryCalc.ts            [修正] explain() 追加
    addition.ts              [修正] explain() 追加
    subtraction.ts           [修正] explain() 追加
    makeTen.ts               [修正] explain() 追加
  data/
    scenarios.ts             [新規] 単元別ミニ物語シナリオ
  screens/
    *Unit.tsx (8画面)        [修正] ヒント💡ボタン＋StepExplainer＋シナリオ文
    ProblemMakerScreen.tsx   [修正] 2段階選択（op ステップ追加）
  lib/
    problemTemplates.ts      [修正] title/sampleA/sampleB 追加・かけ/わり場面+1
tests/
  lib/math/explain-*.test.ts  各単元 explain() のテスト
```

## E. テストと検証

- `explain()` は純粋関数として Vitest で TDD（各単元、ステップ数・kind・caption の要点を検証）。
- `scenarios.ts` は型で担保し、`build()` が必ず非空文字列を返すことをテスト。
- `npx tsc --noEmit` で型チェック。
- dev サーバ＋プレビューで、各単元のヒント開閉・読み上げ・物語文表示・もんだいづくり2段階を実機確認。

## F. 段階的な進め方（実装計画で詳細化）

1. 共通土台（`explain.ts` 型、`StepExplainer`、描画部品）
2. かけ算・わり算の `explain()` ＋画面組み込み（最優先）
3. 二桁たし・ひきの `explain()` ＋画面組み込み
4. さくらんぼ・1桁・10をつくるの `explain()` ＋画面組み込み
5. シナリオ（物語文）導入（全単元）
6. もんだいづくり2段階選択
