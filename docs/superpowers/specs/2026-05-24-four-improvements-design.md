# 6つの改善 設計書

日付: 2026-05-24

## 概要

小学生向け算数アプリ「算数ジェネレーター」に6つの改善を加える。

1. **ヒント画面に問題を常時表示** — ヒント表示中も元の問題が見えるようにする
2. **子供向け「がんばりカレンダー」** — 何日にどのくらいできたかを子供向けに記録・表示
3. **BGMをユニット画面ごとに切替** — 飽きさせないため画面ごとに曲を変える
4. **お題付き作問モード** — 作る側も答えの構造を考える必要がある制約付き作問
5. **文章先・式は後出し** — 数字の概念理解を目的に、最初は文章だけ出し、式はボタンで表示する
6. **二桁の足し算・引き算を式形式に** — 筆算（縦書き）ではなく、普通の横式で表示する

いずれも既存の仕組みに乗せる。新規データ収集は不要（②はスタンプ履歴を再利用）。

実装順の注意: ⑥を⑤より先に行う。⑥で二桁ユニットに横式ボックスができてから、⑤の「式の後出し」が他ユニットと同じ形で適用できる。

---

## ① ヒント画面に問題を常時表示

### 現状の問題
`StepExplainer`（[src/components/StepExplainer.tsx](../../../src/components/StepExplainer.tsx)）は `fixed inset-0 z-50` の全画面オーバーレイで、元の問題（例 `5 ＋ 8 ＝ ？`）を完全に覆い隠す。子供はヒントと問題を頭の中で照合する必要があり、ワーキングメモリの負荷が高い。

### 設計
- `StepExplainer` に `problem: string` prop を追加する。
- 見出し「どうして そうなる？」の直下に、全ステップを通して固定表示する（ステップ送りで消えない）。
- 8ユニットそれぞれが、画面に出している式と同じ文字列を `problem` として渡す。例: `AdditionUnit` は `` `${problem.a} ＋ ${problem.b} ＝ ？` ``。
- ロジック変更なし。表示の追加のみ。
- ⑤と相乗効果がある。⑤で各ユニットが算出する「式の文字列」をそのまま `problem` として渡せるよう、ユニット内で式文字列を1箇所にまとめる。

### 各ユニットの式文字列（①⑤共通で使う）
| ユニット | 式文字列 |
|---|---|
| AdditionUnit | `` `${problem.a} ＋ ${problem.b} ＝ ？` `` |
| SubtractionUnit | `` `${problem.a} － ${problem.b} ＝ ？` `` |
| CherryCalcUnit | `` `${problem.a} ＋ ${problem.b} ＝ ？` `` |
| MultiplicationUnit | `` `${problem.a} ✕ ${problem.b} ＝ ？` `` |
| DivisionUnit | `` `${problem.dividend} ÷ ${problem.divisor} ＝ ？` `` |
| BigAdditionUnit | `` `${problem.a} ＋ ${problem.b} ＝ ？` `` |
| BigSubtractionUnit | `` `${problem.a} － ${problem.b} ＝ ？` `` |
| MakeTenUnit | 式ボックスなし。①では `` `${current} ＋ ？ ＝ 10` `` を渡す。⑤の対象外。 |

### 対象ファイル
- `src/components/StepExplainer.tsx`（prop追加・表示）
- 各ユニット画面（`problem` を渡す）: AdditionUnit, SubtractionUnit, MakeTenUnit, CherryCalcUnit, BigAdditionUnit, BigSubtractionUnit, MultiplicationUnit, DivisionUnit

### 単位（コンポーネント）
- `StepExplainer`: ステップ解説 + 問題見出しを描画。入力は `steps` と `problem`、依存は表示系のみ。

---

## ② 子供向け「がんばりカレンダー」

### データ
新規収集は不要。`StampState.history`（[src/features/rewards/stamps.ts](../../../src/features/rewards/stamps.ts)）が `{ unitId, at }`（取得時刻ms）を全履歴で保持済み。これを日付ごとに集計する。

### 設計
- ホームから入れる新画面 `ProgressCalendar`（仮）を追加する。
- `at`(ms) をローカル日付文字列(YYYY-MM-DD)へ変換するヘルパーを `src/lib/dateKey.ts`（新規）に置く。`MissionScreen` の `todayStr()` と重複するなら共通化を検討するが、まずは新規ヘルパーで完結させる。
- 子供向けに数値評価の印象を避ける。直近14日を1日1マスのカレンダー（グリッド）で表示。
  - やった日のマスにはその日のスタンプ数だけ🌸（または⭐）を並べる。
  - 「れんぞく◯にち」（今日から連続でスタンプがある日数）と「きょうは◯こ」を添える。
  - 何もしていない日は空のマス（叱責的表現は出さない）。
- 読み取り専用。保存はしない。

### 集計ロジック
- `history` を日付キーでグルーピングし `Map<dateKey, count>` を作る。
- 連続日数: 今日のキーから過去へ1日ずつ遡り、count>0 が続く限りカウント。
- これらは純関数として `src/lib/progress.ts`（新規）に切り出し、単体テスト可能にする。

### 対象ファイル
- `src/lib/dateKey.ts`（新規・日付変換）
- `src/lib/progress.ts`（新規・集計純関数）
- `src/screens/ProgressCalendar.tsx`（新規・表示）
- `src/App.tsx`（`progress` 画面のルーティング追加）
- `src/screens/HomeScreen.tsx`（入口ボタン追加）

### 単位
- `progress.ts`: history配列 → 日別集計・連続日数を返す純関数。依存なし。テスト容易。
- `ProgressCalendar`: 集計結果を子供向けに描画。入力は history、依存は progress.ts。

---

## ③ BGMをユニット画面ごとに切替

### 現状
`bgm.ts`（[src/features/sound/bgm.ts](../../../src/features/sound/bgm.ts)）は単一の `MELODY`/`BASS` を手続き的にループ再生するシングルトン。全画面で同じ曲。

### 設計
- 曲データ（メロディ、ベース、1音の長さ、メロディ波形）を `TRACKS: Record<string, Track>` に外出しする。
- `Track` 型: `{ melody: (number|null)[]; bass: (number|null)[]; note: number; melodyWave?: OscillatorType }`。
- 現状のメロディを `default` トラックとして温存。さらにキー/旋法/テンポを変えた複数曲を手書きで用意する（飽き防止）。曲数は画面数に対し、最低でも主要ユニット分（さくらんぼ／たし／大きいたし／ひき／大きいひき／かけ／わり）を用意。
- `setBgmTrack(id: string)` を追加: 現在のトラックを差し替える。
  - 再生中なら `noteIndex` をリセットして新トラックへ滑らかに移行（再生は継続）。
  - 同じ id を再指定したら何もしない（同じ曲をリスタートさせない）。
  - `enabled`/再生状態は維持。enabled=false の間に呼ばれてもトラック選択だけ記録し再生はしない。
- 切替の起点: 各ユニット画面のマウント時に自分のトラック id を `setBgmTrack` で指定する。`App.tsx` の `screen` から決定する方式でもよいが、まずは画面側 `useEffect` で指定する方が局所的で安全。ホーム等は `default` を指定。

### 対象ファイル
- `src/features/sound/bgm.ts`（TRACKS化・setBgmTrack追加）
- 各ユニット画面（マウント時に `setBgmTrack`）
- ホーム/その他主要画面（`default` 指定）

### 単位
- `bgm.ts`: トラック定義 + 再生エンジン + `startBgm`/`stopBgm`/`setBgmTrack`/`setBgmEnabled`。外部インターフェースは関数のみ。内部のスケジューラは隠蔽。

---

## ④ お題付き作問モード

### 現状
`ProblemMakerScreen`（[src/screens/ProblemMakerScreen.tsx](../../../src/screens/ProblemMakerScreen.tsx)）は「演算選択 → 場面テンプレ選択 → 数字を自由に選ぶ → プレビュー → ちょうせん（保護者へ）」。子供は答えを考えずに作れる。

### 判定モデル（決定済み）
子供がお題を満たすように問題を構成 → **達成判定はアプリが作問時に行う** → 解くのは保護者（既存の「ちょうせん！→ ParentSolveScreen」フロー維持）。子供は「お題を満たす＝答えの構造を理解する」必要が出る。

### お題の実現（決定済み）
**既存テンプレを使い、数値だけを制約する**。新しい場面は作らない。

- お題型: `interface Goal { id: string; type: ProblemType; label: string; prompt: string; validate: (a: number, b: number, answer: number) => boolean; hint: string }`
- `src/lib/problemGoals.ts`（新規）に演算ごとのお題を定義。例:
  - たし: 「こたえが 10 に なるように つくろう」 `validate: (_,__,ans) => ans === 10`
  - ひき: 「のこりが 1こ に なるように つくろう」 `validate: (a,b) => a - b === 1`
  - かけ: 「こたえが 12 に なるように つくろう」 `validate: (_,__,ans) => ans === 12`
  - わり: 「ちょうど わけきれるように つくろう（あまり なし）」 `validate: (a,b) => a % b === 0`
  - （各演算に1〜2個。お題は既存テンプレの aRange/bRange で必ず達成可能なものに限定する）

### フロー
- 演算選択（`op` ステップ）の後に分岐画面を追加: 「**じゆうに つくる**（既存）／**おだいに ちょうせん**」。
- お題モード:
  1. その演算のお題カードを1つ選ぶ。
  2. 場面テンプレを選ぶ（既存 `select` ステップを流用）。
  3. 数字を調整する（既存 `fill` ステップを流用）。画面上部にお題プロンプトを常時表示。
  4. 「これで かんせい！」押下時に `validate(a, b, answer)` を実行。
     - 満たす → ○演出 → 既存 `preview` → 「ちょうせん！」で保護者へ。
     - 満たさない → 「おしい！」と `hint` を表示し、`fill` に留まってやり直し。
- 自由モードは現状の挙動を完全に維持する。

### 対象ファイル
- `src/lib/problemGoals.ts`（新規・お題定義 + validate）
- `src/screens/ProblemMakerScreen.tsx`（モード分岐・お題選択・fill時のお題表示・完成時の判定）

### 単位
- `problemGoals.ts`: お題定義と純粋な `validate`。依存なし。テスト容易。
- `ProblemMakerScreen`: ステップ機械 + お題モード分岐。`problemGoals` と既存 `problemTemplates` に依存。

---

## ⑤ 文章先・式は後出し

### 目的
数字の概念を頭の中で理解することを助ける。最初は文章（場面）だけを見せ、子供がイメージで数を捉えてから、必要なら式を見る。式の機械的計算に頼らせない。

### 現状
各ユニットは Companion のセリフ（文章）と式ボックス（例 `5 ＋ 8 ＝ ？`）を**同時に**表示している。

### 設計（決定済み）
- 適用範囲: **横式ボックスを持つ全ユニット（7つ）** = Addition, Subtraction, CherryCalc, Multiplication, Division, BigAddition, BigSubtraction。MakeTen は式ボックスがないため対象外。BigAddition/BigSubtraction は元々筆算表示だが、⑥で横式ボックスに変えた後に⑤を適用する。
- 各ユニットに `showFormula` 状態（初期 `false`）を追加する。
- `showFormula === false` のとき: 既存の式ボックスの代わりに「**しきを みる**」ボタンを表示する。
- ボタン押下で `showFormula = true` にし、既存の式ボックスを表示する。`playSfx('tap')` を鳴らす。
- 答えの選択肢ボタン（`AnswerButtons`）は**最初から表示**する（決定済み）。文章＋選択肢を見て頭の中で考え、式は任意で見る。
- 次の問題に進むとき（`setProblem` するタイミング）に `showFormula` を `false` に戻す。
- 式文字列は①の表でユニットごとに定義したものと同一。ユニット内で `const formula = ...` として1箇所で組み立て、式ボックス表示と `StepExplainer` の `problem` prop の両方に使う（DRY）。

### 対象ファイル
- 7ユニット画面（`showFormula` 状態、式ボックスのトグル、「しきを みる」ボタン、次問題でのリセット）

### 単位
- 各ユニット: 表示状態の追加のみ。算数ロジック・正誤判定は変更しない。

### ①との関係
①（ヒントに式表示）はこのまま有効。ヒントは「どうして そうなる？」を解説する場で、そこでは式を見せて理解を助ける。⑤は通常画面で式を後出しにするだけで、両者は矛盾しない。

## ⑥ 二桁の足し算・引き算を式形式に

### 現状
`BigAdditionUnit`（[src/screens/BigAdditionUnit.tsx](../../../src/screens/BigAdditionUnit.tsx)）は `ColumnAddition`、`BigSubtractionUnit`（[src/screens/BigSubtractionUnit.tsx](../../../src/screens/BigSubtractionUnit.tsx)）は `ColumnSubtraction` という**筆算（縦書き・位を縦に揃えた）**コンポーネントで問題を表示している。各 problem は `problem.a`/`problem.b`（二桁の数）を持つ。

### 設計
- 筆算コンポーネント（`ColumnAddition`/`ColumnSubtraction`）の使用をやめ、他ユニットと同じ**横式ボックス**で表示する。
  - BigAddition: `` `${problem.a} ＋ ${problem.b} ＝ ？` ``
  - BigSubtraction: `` `${problem.a} － ${problem.b} ＝ ？` ``
- 筆算に付いていた「くり上がり あり！／くり下がり あり！」の注記は廃止する。くり上がり・くり下がりの理解はヒント（StepExplainer の位ブロック解説）で引き続き行うため、通常画面では出さない。
- `ColumnAddition`/`ColumnSubtraction` 関数は不要になるので削除する。
- 算数ロジック（生成・正誤判定・ヒント）は変更しない。表示のみ。
- この横式ボックスに対して⑤（式の後出し）と①（ヒントに式表示）を適用する。

### 対象ファイル
- `src/screens/BigAdditionUnit.tsx`、`src/screens/BigSubtractionUnit.tsx`

## テスト方針
- 純関数（`progress.ts` の集計・連続日数、`problemGoals.ts` の各 validate）は Vitest で単体テスト。
- 表示系（StepExplainer の問題表示、ProgressCalendar、ProblemMaker のお題フロー）は dev サーバーで実機確認。
- BGM はブラウザのユーザー操作が必要なため手動確認。

## エラーハンドリング
- localStorage は既存の `loadJson`/`saveJson`（優雅な劣化）を踏襲。
- お題は aRange/bRange 内で必ず達成可能なものに限定し、詰み状態を作らない。
- BGM 切替は AudioContext 未初期化や enabled=false でも例外を投げない。

## スコープ外（YAGNI）
- 保護者向けの詳細統計・グラフ。
- お題専用の新しい場面・ビジュアル（既存テンプレ制約のみ）。
- BGM の自動生成・ランダム生成（曲は手書き固定）。
