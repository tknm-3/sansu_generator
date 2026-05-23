# さんすうあそび（子ども向け算数アプリ）

幼稚園年長〜小3向けの、無料・タブレット中心の算数学習Webアプリ。

## 開発
- `npm install`
- `npm run dev` … 開発サーバ
- `npm run test` … テスト
- `npm run build` … 本番ビルド（dist/）

## デプロイ（Cloudflare Pages・無料）
1. このリポジトリをGitHubにpush
2. Cloudflare Pages で「Connect to Git」→ 当リポジトリを選択
3. ビルド設定:
   - Build command: `npm run build`
   - Build output directory: `dist`
4. デプロイ完了で公開URLが発行される（サーバー維持費ゼロ）

データは各端末のlocalStorageに保存（サーバー送信なし）。

参照: 仕様 `docs/superpowers/specs/2026-05-23-sansu-app-design.md` / 計画 `docs/superpowers/plans/`
