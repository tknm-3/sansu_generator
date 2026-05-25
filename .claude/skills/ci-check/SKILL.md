---
name: ci-check
description: Use before committing, pushing, or claiming work is complete - runs the full local CI check (tests + build) for this project and blocks progress if anything fails
---

# CI チェック

## 概要

コミット・プッシュ・完了宣言の前に必ず実行する。ローカルで CI と同等のチェックをかけ、失敗があれば修正してから先に進む。

**開始時に宣言する:** 「ci-check スキルを使って CI を確認します。」

## 実行手順

### Step 1: テストを実行

```bash
npm run test
```

**成功条件:** `Test Files  N passed` と表示され、failed が 0 であること。

失敗した場合:
```
テストが失敗しています（N 件）。修正してから先に進みます。

[失敗テストの内容を表示]
```

→ 失敗を修正し、Step 1 からやり直す。Step 2 には進まない。

### Step 2: ビルドを実行

```bash
npm run build
```

**成功条件:** 終了コード 0、エラーなし。

失敗した場合:
```
ビルドが失敗しています。修正してから先に進みます。

[エラー内容を表示]
```

→ 失敗を修正し、Step 2 からやり直す。

### Step 3: 結果を報告

```
CI チェック完了:
  ✓ テスト: 128 件 passed（0 failed）
  ✓ ビルド: 成功

コミット / プッシュの準備ができています。
```

## よくあるミスと対処

| 状況 | やること |
|------|---------|
| テンプレートを追加したのにテストが壊れた | テストの期待値が実装と合っているか確認する（`toHaveLength(N)` を `toBeGreaterThanOrEqual(N)` に変更するなど） |
| ビルドは通るがテストが落ちる | CI は両方を見る。テストも必ず直す |
| `vitest: not found` エラー | `npm install` を先に実行する |
| 1 件だけ落ちているから無視 | 無視しない。1 件でも落ちていれば CI は赤くなる |

## 鉄則

- **テストが落ちている状態でコミット・プッシュしない**
- **ビルドが通らない状態でコミット・プッシュしない**
- **「たぶん通る」は検証ではない。必ずコマンドを実行して出力を確認する**
