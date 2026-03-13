#!/bin/bash
# Claude Code PostToolUse hook: ファイル保存後に自動フォーマット

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | python3 -c "
import json, sys
try:
    d = json.load(sys.stdin)
    print(d.get('tool_input', {}).get('file_path', ''))
except:
    print('')
" 2>/dev/null)

if [ -z "$FILE_PATH" ]; then
  exit 0
fi

PROJECT_ROOT="/Users/hiruge/Project/Kaleid-Scan"

case "$FILE_PATH" in
  *.ts|*.tsx|*.js|*.jsx|*.css|*.json)
    cd "$PROJECT_ROOT/frontend" && \
      npx prettier --write "$FILE_PATH" --log-level silent 2>/dev/null
    ;;
  *.go)
    gofmt -w "$FILE_PATH" 2>/dev/null
    ;;
esac
