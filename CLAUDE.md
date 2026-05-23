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
    storage.ts                     # localStorage
  data/units.ts                    # ユニット定義
```

## 現在のフェーズ
`phase1-foundation-mvp` ブランチ。実装済み: 命名画面・ホーム・さくらんぼ計算ユニット。

## コマンド
```bash
npm run dev      # 開発サーバー
npm run build    # ビルド
npm run test     # テスト
```

## コンテキスト節約の原則
- ファイル全体を読む前に `Grep` で関連行を特定する
- `Read` は `offset`+`limit` で必要な範囲だけ読む
- 変更の確認は `git diff` を先に使う
- 200行超えるファイルは必要なセクションだけ読む
