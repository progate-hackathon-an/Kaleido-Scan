#!/usr/bin/env bash
set -euo pipefail

# Copies .gitignore'd files from the main worktree to the current worktree.
# Usage: sync_env.sh [--all] [--dry-run] [pattern...]
# Default patterns: .env .env.* *.local

# Parse arguments
DRY_RUN=false
COPY_ALL=false
PATTERNS=()

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run|-n) DRY_RUN=true; shift ;;
    --all) COPY_ALL=true; shift ;;
    *) PATTERNS+=("$1"); shift ;;
  esac
done

# Default patterns if none specified
if [ ${#PATTERNS[@]} -eq 0 ] && [ "$COPY_ALL" = false ]; then
  PATTERNS=(".env" ".env.*" "*.local")
fi

# Get git roots
CURRENT_ROOT=$(git rev-parse --show-toplevel 2>/dev/null) || {
  echo "エラー: Gitリポジトリ内で実行してください"
  exit 1
}
MAIN_ROOT=$(git worktree list --porcelain | grep "^worktree" | head -1 | awk '{print $2}')

if [ "$MAIN_ROOT" = "$CURRENT_ROOT" ]; then
  echo "エラー: 現在メインのworktreeにいます。worktreeに切り替えてから実行してください。"
  exit 1
fi

echo "メインworktree: $MAIN_ROOT"
echo "現在のworktree: $CURRENT_ROOT"
echo ""

# Find target files
if [ "$COPY_ALL" = true ]; then
  # Find all gitignored files (excluding large dependency dirs)
  FILES=$(cd "$MAIN_ROOT" && git ls-files --others --ignored --exclude-standard 2>/dev/null \
    | grep -v "^node_modules/" \
    | grep -v "^vendor/" \
    | grep -v "^\.git/" \
    | grep -v "/node_modules/" \
    | grep -v "/vendor/") || true
else
  # Find files matching patterns
  FILES_LIST=()
  for pattern in "${PATTERNS[@]}"; do
    while IFS= read -r -d '' f; do
      rel="${f#"$MAIN_ROOT"/}"
      FILES_LIST+=("$rel")
    done < <(find "$MAIN_ROOT" -name "$pattern" \
      -not -path "*/node_modules/*" \
      -not -path "*/.git/*" \
      -not -path "*/vendor/*" \
      -type f \
      -print0 2>/dev/null)
  done
  # Sort and deduplicate
  FILES=$(printf '%s\n' "${FILES_LIST[@]}" 2>/dev/null | sort -u) || true
fi

if [ -z "$FILES" ]; then
  echo "コピー対象のファイルが見つかりませんでした。"
  if [ "$COPY_ALL" = false ]; then
    echo "ヒント: --all オプションで全ての.gitignore済みファイルをコピーできます。"
  fi
  exit 0
fi

echo "コピー対象ファイル:"
echo "$FILES" | sed 's/^/  /'
echo ""

if [ "$DRY_RUN" = true ]; then
  echo "（ドライラン: 実際のコピーは行いません）"
  exit 0
fi

COPIED=0
SKIPPED=0
ERRORS=0

while IFS= read -r file; do
  [ -z "$file" ] && continue
  SRC="$MAIN_ROOT/$file"
  DST="$CURRENT_ROOT/$file"

  if [ ! -f "$SRC" ]; then
    continue
  fi

  if [ -f "$DST" ]; then
    echo "スキップ（既存）: $file"
    SKIPPED=$((SKIPPED + 1))
    continue
  fi

  DEST_DIR="$(dirname "$DST")"
  if ! mkdir -p "$DEST_DIR"; then
    echo "エラー（ディレクトリ作成失敗）: $DEST_DIR"
    ERRORS=$((ERRORS + 1))
    continue
  fi

  if cp "$SRC" "$DST"; then
    echo "コピー完了: $file"
    COPIED=$((COPIED + 1))
  else
    echo "エラー（コピー失敗）: $file"
    ERRORS=$((ERRORS + 1))
  fi
done <<< "$FILES"

echo ""
echo "完了: ${COPIED}ファイルをコピー、${SKIPPED}ファイルをスキップ、${ERRORS}件エラー"
