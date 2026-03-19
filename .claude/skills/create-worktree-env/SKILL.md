---
name: create-worktree-env
description: "Git worktreeを使用する際、.gitignoreされた.envファイル等がworktreeに存在しない問題を解消するスキル。メインworktreeから現在のworktreeへ、.gitignore済みファイル（.env, .env.*, *.local など）を一括コピーする。使用トリガー: (1) /create-worktree-env で呼び出されたとき, (2) worktree内で.envがない・環境変数が読み込めない等の問題が発生したとき, (3) 新しいworktreeを作成した直後に環境ファイルのコピーを依頼されたとき"
---

# create-worktree-env

Git worktreeでは`.gitignore`済みのファイルがコピーされないため、`.env`などの環境ファイルが存在しない。このスキルは`scripts/sync_env.sh`を使って、メインworktreeから現在のworktreeへ一括コピーする。

## 実行方法

スクリプトのパスを特定してから実行する:

```bash
# スキルのパスを確認（リポジトリ配下）
ls ./.claude/skills/create-worktree-env/scripts/

# worktreeのルートで実行（デフォルト: .env, .env.*, *.local をコピー）
bash ./.claude/skills/create-worktree-env/scripts/sync_env.sh

# ドライラン（コピー対象を確認するだけ）
bash ./.claude/skills/create-worktree-env/scripts/sync_env.sh --dry-run

# 全ての.gitignore済みファイルをコピー（node_modules/vendor/は除外）
bash ./.claude/skills/create-worktree-env/scripts/sync_env.sh --all

# パターンを指定してコピー
bash ./.claude/skills/create-worktree-env/scripts/sync_env.sh ".env.production" "secrets.json"
```

## 動作仕様

- **実行場所**: worktree内の任意のディレクトリ（git rev-parse で自動判定）
- **コピー元**: `git worktree list` の先頭に表示されるメインworktree
- **既存ファイルはスキップ**（上書きしない）
- メインworktreeで実行するとエラーを返す

## オプション

| オプション | 説明 |
|-----------|------|
| （なし） | `.env`, `.env.*`, `*.local` にマッチするファイルをコピー |
| `--dry-run` / `-n` | コピー対象を表示するだけで実際にはコピーしない |
| `--all` | `git ls-files --ignored` で列挙した全ファイルをコピー（node_modules等は除外） |
| `パターン...` | 指定したglobパターンにマッチするファイルのみコピー |

## このプロジェクトでの典型的な使い方

worktreeは作成直後に実行:

```bash
bash ./.claude/skills/create-worktree-env/scripts/sync_env.sh
```
