# Kaleid Scan - AI開発ガイド

このファイルはAIアシスタントがコーディング支援を行う際に常に参照する。

## プロジェクト概要

**商品との出会いをエンタメにする** — カメラで商品をスキャンして、売上データに基づいたオーラを表示。新しい商品発見をゲーム感覚で促進するハッカソンプロダクト。

詳細は [docs/product-overview.md](docs/product-overview.md) を参照。

## ドキュメント構成

| ファイル | 内容 |
|----------|------|
| `docs/requirement.md` | 機能要件・非機能要件・技術スタック・アーキテクチャ |
| `docs/api-requirement.md` | API仕様書 |
| `docs/db-requirement.md` | DB設計書 |
| `docs/product-overview.md` | プロダクトコンセプト・ターゲット・ペルソナ |
| `docs/development-schedule.md` | 開発スケジュール |
| `docs/todo.md` | 実装タスク一覧 |
| `CONTRIBUTING.md` | 開発ルール・コーディング規約・Git運用 |

## 開発ルール・規約

技術スタック・コーディング規約・Gitルールは [docs/requirement.md](docs/requirement.md) および [CONTRIBUTING.md](CONTRIBUTING.md) を参照すること。

## 開発原則

- 『リーダブル・コード』、DRY原則、YAGNI原則、SOLID原則を徹底する。「とりあえず動く」実装はしない。
- t-wadaのTDDに従って、RED-GREEN-REFACTORサイクルを回すことを基本とする。テストは実装コードと同時に作成すること。

## タスク完了の定義

コーディングタスクを完了とみなす前に、以下を必ず実行してすべてパスさせること。

```bash
make test   # フロント（Vitest）+ バック（go test）
make lint   # フロント（ESLint）+ バック（golangci-lint）
```

いずれかが失敗した場合はタスク完了としない。修正してから再度確認すること。

## スキル

`.claude/skills/` に以下のスキルが配置されている。該当する作業の際は積極的に参照・適用すること。

| スキル | パス | 使いどころ |
|--------|------|-----------|
| clean-code-principles | `.claude/skills/clean-code-principles/SKILL.md` | **コード作成・レビュー時は必ず参照・適用すること**。リーダブルコード・DRY・YAGNI・SOLID原則を適用する |
| create-worktree-env | `.claude/skills/create-worktree-env/SKILL.md` | Git worktree作成後に `.env` 等のgitignore済みファイルをコピーする（スクリプトあり） |

## エージェント

`.claude/agents/` に以下のサブエージェントが配置されている。複雑・専門的な作業はタスクとして委譲すること。

| エージェント | ファイル | 担当領域 |
|---|---|---|
| architect | `.claude/agents/architect.md` | アーキテクチャ設計・技術選定・DB設計・実装計画 |
| backend-dev | `.claude/agents/backend-dev.md` | Go/Gin API実装・DB操作・認証・バックエンドデバッグ |
| frontend-dev | `.claude/agents/frontend-dev.md` | React/TS UI実装・コンポーネント作成・スタイリング・状態管理 |
| code-reviewer | `.claude/agents/code-reviewer.md` | コードレビュー（可読性・DRY・セキュリティ・テスト観点） |
| project-manager | `.claude/agents/project-manager.md` | タスク分解・優先順位付け・進捗整理・スプリント計画 |
| test-runner | `.claude/agents/test-runner.md` | テスト作成・実行・失敗デバッグ・カバレッジ改善 |
