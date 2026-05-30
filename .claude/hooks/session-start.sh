#!/bin/bash
set -euo pipefail

# Claude Code on the web 用 SessionStart フック。
# 依存をインストールして、テスト・ビルド・スクショ（playwright-core）が
# セッション開始直後から すぐ動くようにする。
# ローカル（非リモート）では なにもしない。

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR"

# キャッシュが効くよう npm ci ではなく npm install（冪等・非対話）
npm install --no-audit --no-fund > /tmp/session-start-npm.log 2>&1

echo "依存インストール完了（npm install）"
