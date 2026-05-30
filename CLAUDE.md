# 算数ジェネレーター (Sansu Generator)

小学生向け算数学習アプリ。Claude の返答は日本語で。

## 技術スタック
- React 19 + TypeScript + Vite
- Tailwind CSS v4
- framer-motion / canvas-confetti / howler / @dnd-kit
- テスト: Vitest + @testing-library/react
- デプロイ: Cloudflare Pages

## ソース構造
```
src/
  App.tsx                          # ルーター (NamingScreen → HomeScreen → Unit)
  screens/
    HomeScreen.tsx                 # ユニット選択
    MakeTenUnit.tsx                # さくらんぼ計算ゲーム画面
  components/
    MakeTenFrame.tsx               # 10の枠コンポーネント
    AnswerButtons.tsx              # 選択肢ボタン
  features/
    character/                     # キャラクター命名・表示
    rewards/stamps.ts              # スタンプ報酬
    speech/tts.ts                  # 読み上げ
    sound/sfx.ts                   # 効果音
  lib/
    math/makeTen.ts                # さくらんぼ計算ロジック
    programming/                   # プログラミング単元
      engine.ts                    # 矢印実行エンジン・BFSソルバー・前向きヒント生成
      branch.ts                    # 分岐インタプリタ（もし〜なら/くりかえし）・分岐用ヒント
      levels.ts                    # 矢印ならべ/デバッグの難易度別レベル
      branchLevels.ts              # 分岐単元の難易度別レベル
      progress.ts                  # 難易度アンロック（かんたん→ふつう→むずかしい）
    storage.ts                     # localStorage
  data/units.ts                    # ユニット定義
```

## カテゴリ
- `sansu`（さんすう）/ `katachi`（かたち）/ `programming`（プログラミング）
- プログラミングは 4単元: 矢印ならべ(arrow-sequence)・デバッグ(arrow-debug)・分岐(arrow-branch)・自分で作る(arrow-maker)
- 分岐(arrow-branch)は「もし <むき> が かべ なら…」のセンサー条件＋くりかえし箱で、かべの形が変わっても同じプログラムで解ける体験を狙う（`lib/programming/branch.ts`）
- 難易度は 単元×難易度ごとに クリア回数を記録し、規定回数で 次の難易度を解放（`lib/programming/progress.ts`）
- ヒントは「まちがい」と言わず こどもの思考を後押しする文言にする（`buildHint`）
- **問題・レベルを作る/直すときは `authoring-problems` スキルを見る**（アプリの目的・こども向け
  文言ルール・出題のコツ・検証テスト）。新しいコツは同スキル下部の「追記ログ」に足していく。

## 現在のフェーズ
`phase1-foundation-mvp` ブランチ。実装済み: 命名画面・ホーム・さくらんぼ計算ユニット。

## コマンド
```bash
npm run dev      # 開発サーバー
npm run build    # ビルド
npm run test     # テスト
```

## ブラウザ確認（スクリーンショット）
実画面の見た目を確認したいときは **`screenshot-app` スキル**を使う
（`.claude/skills/screenshot-app/`）。手順・localStorageシードキー・遷移文言の確定方法・
スマホ実機での確認方法・はまりどころ（命名画面で止まる/真っ白/module not found）をまとめてある。
- Chromium は `/opt/pw-browsers` にプリインストール済み（`PLAYWRIGHT_BROWSERS_PATH` は設定済み）。
  `npx playwright install` はネット許可外で失敗するので使わない。
- 基本は `scripts/screenshot.mjs` の `capture({ url, out, initScript, steps })` を使う。

## コンテキスト節約の原則
- ファイル全体を読む前に `Grep` で関連行を特定する
- `Read` は `offset`+`limit` で必要な範囲だけ読む
- 変更の確認は `git diff` を先に使う
- 200行超えるファイルは必要なセクションだけ読む

## プルリク（PR）を出すときの方針
- 作業中に**詰まったところ・はまった罠は、PRを出す前にスキル化する**
  （`.claude/skills/<name>/SKILL.md`）。次回以降の自分・他セッションが同じ罠を踏まないように。
- ノウハウや再現手順はスキルに書き、**CLAUDE.md は「どのスキルを見るか」のポインタに留める**
  （肥大化を避ける）。手順・シード値・確定方法などの具体はスキル側へ。
- 既存スキルに該当があれば追記、なければ新設。スキル化したら PR 本文にもひとこと触れる。
