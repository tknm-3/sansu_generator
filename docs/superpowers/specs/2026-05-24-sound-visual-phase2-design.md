# サウンド・視覚強化 + フェーズ2〜5 実装設計

作成日: 2026-05-24

## 1. サウンド強化

### 現状の問題
`sfx.ts` は Howler.js でファイル再生を試みるが、`public/sounds/` にファイルが未配置で常に無音。

### 設計方針：Web Audio API プログラマティック音声

外部ファイル不要で全環境で即動作する合成音声を `src/features/sound/synth.ts` として実装し、`sfx.ts` から呼び出す。

#### 効果音の仕様

| 名前 | 波形 | 音程/時間 | 用途 |
|------|------|-----------|------|
| `tap` | sine | 440Hz, 0.05s | ボタンタップ全般 |
| `correct` | sine | C5→E5→G5 アルペジオ | 正解 |
| `wrong` | sawtooth | 220Hz→180Hz, 0.15s | 不正解 |
| `levelup` | sine | C5→E5→G5→C6 上昇, 0.6s | 単元クリア |
| `fanfare` | sine | 複数和音, 1.2s | 全クリア演出 |

- `enabled` フラグで全体ミュート可能（仕様§5.0 演出オフ）
- Web Audio API 非対応ブラウザでも例外を出さない（優雅な劣化）

## 2. 視覚強化

### 2.1 MakeTenFrame 改善
- 各セルに framer-motion `spring` を適用：果物が「ポンッ」と入るバウンスアニメーション
- 正解時：全セルが 0.3s 黄色に輝くフラッシュ（`filled` が 10 になった瞬間）
- 空きセルの pulse を明確に（現在の `animate-pulse` は Tailwind 組み込みのままで可）
- `fruit` プロップを問題ごとにランダム変化（🍎🍊🍇🍓🍌から選択）

### 2.2 Companion 改善（SVGキャラクター）
- 現在の絵文字から SVG 描画のうさぎキャラクターに変更
- 表情：`normal`（通常）/ `happy`（正解・跳ねる）/ `hint`（ヒント時・首傾げ）
- framer-motion で跳ねるアニメーションを強化（現在は `y` 移動のみ → スケール＋回転も追加）
- 吹き出しを speech-bubble SVG/CSS クラウド型に変更

### 2.3 AnswerButtons 改善
- framer-motion `whileTap={{ scale: 0.92 }}` でタップフィードバック
- 正解後 0.2s 緑フラッシュ → 次の問題に遷移
- 不正解後 0.15s 赤シェイク

### 2.4 背景・全体レイアウト
- 背景を単色 `bg-amber-50` → 空グラデーション（青→白）に変更（全画面共通）
- HomeScreen：ユニットカードにホバー時浮き上がりアニメーション
- クリア画面：スタンプが1つずつポップして出現するアニメーション

## 3. フェーズ2：がくしゅうモード拡充

### 3.1 さくらんぼ計算単元（繰り上がりたしざん）

**対象：** 小1〜小2。例 8+5=13

**STEP分解UI：**
```
STEP1: 8はあと2で10 → 数直線/10マスで視覚化
STEP2: 5を2と3に分ける → さくらんぼの枝で分解を描画
STEP3: 8+2=10（10マス満タンアニメーション）
STEP4: 10+3=13（答え表示）
```

**新コンポーネント：**
- `src/components/CherryBranch.tsx`：さくらんぼ分解 SVG
- `src/screens/CherryCalcUnit.tsx`：STEP進行UI
- `src/lib/math/cherryCalc.ts`：計算ロジック

### 3.2 習熟度トラッキング土台

- `src/lib/mastery.ts`：スキル別 正答数・誤答数・最終出題日時・習熟レベルの記録と更新
- `math-app:mastery` キーで localStorage に保存
- 習熟レベル：0（未学習）→ 1（練習中）→ 2（定着）→ 3（習得）

### 3.3 追加単元（算数ロジック + 画面）

優先順：
1. たしざん（1位数）
2. ひきざん（1位数）
3. 二桁のたしざん（繰り上がり）
4. 二桁のひきざん（繰り下がり）
5. かけ算のしくみ（小2〜）
6. わり算のしくみ（小3）

各単元：`src/lib/math/<unit>.ts` + `src/screens/<Unit>Screen.tsx`

## 4. フェーズ3：もんだいチャレンジモード

- `src/screens/ChallengeMode.tsx`：問題タイプ別の出題・絵操作UI
- `src/lib/challenge/problemGen.ts`：手続き的問題生成（フレーバー文ランダム）
- `src/lib/challenge/spacedRepetition.ts`：間隔反復で次の出題スキルを選択
- `src/screens/MissionScreen.tsx`：「きょうのミッション」（新問題2〜3問＋復習1問）

## 5. フェーズ4：もんだいづくりモード

- `src/screens/ProblemMakerScreen.tsx`：テンプレート穴埋めUI
- `src/lib/problemTemplates.ts`：テンプレート定義（数・絵・名前の穴）
- `src/screens/ParentSolveScreen.tsx`：親が解く → 子どもが◯つけ
- `math-app:myProblems` に localStorage 保存

## 6. フェーズ5：ごほうび・コレクション拡充

- `src/features/character/CharacterCollection.tsx`：なかま図鑑（シルエット→解放）
- 複数キャラクター定義（うさぎ・ひよこ・くまなど 5〜7体）
- キャラ交代・なかよし度・着せ替えアイテム
- レベルシステム（スタンプ → 経験値 → レベルアップ演出）

## 7. 実装の分離原則（既存方針継続）

- 算数ロジック：純粋関数 + ユニットテスト（TDD）
- UIコンポーネント：framer-motion アニメーション
- データ：localStorage ストレージ層経由
- 音声・演出：`enabled` フラグで ON/OFF 可能

## スコープ外（本設計で扱わない）

- PixiJS 等ゲームエンジン導入（将来検討）
- 端末間データ同期
- PWA化
