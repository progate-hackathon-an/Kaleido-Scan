# Kaleido Scan - AI開発ガイド

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

## 技術スタック

| レイヤー | 技術 |
|----------|------|
| フロントエンド | React + TypeScript（Vite）+ PWA |
| バックエンド | Go + Gin |
| データベース | PostgreSQL（Docker ローカル / RDS 本番） |
| AI | Gemini 2.5 Flash（ローカル、無料枠: 10 RPM / 250 req/日） → AWS Bedrock Claude Sonnet（本番） |
| 開発環境 | Docker Compose |
| 本番環境 | AWS Lambda + API Gateway + Amplify Hosting + RDS |

## コーディング規約（抜粋）

詳細は [CONTRIBUTING.md](CONTRIBUTING.md) を参照。

- **フロントエンド**: コンポーネント・型 → `UpperCamelCase` / 変数・関数 → `camelCase` / 定数 → `CONSTANT_CASE`
- **バックエンド（Go）**: ファイル → `lower_snake_case` / 公開 → `UpperCamelCase` / 非公開 → `lowerCamelCase`

## アーキテクチャ方針

- フロントエンドは表示に徹し、ビジネスロジックはバックエンド（`services/`）に集約する
- AI呼び出しは `services/` に閉じ込め、`handlers/` からは直接呼ばない
- AI プロバイダーは `AI_PROVIDER` 環境変数で切り替える（`gemini`: ローカル / `bedrock`: 本番）

## フロントエンド 実装パターン

- カメラ: `navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })`（バックカメラ固定）
- スキャン: シャッター押下で静止画取得 → `POST /scan/ranking`（`multipart/form-data`）へ送信
- オーラ描画: Canvas API を使用。`bounding_box` の相対座標（0.0〜1.0）を実ピクセルに変換してから描画する
- AI解析中はローディング演出を表示すること

## 開発原則

- 『リーダブル・コード』、DRY原則、YAGNI原則、SOLID原則を徹底する。「とりあえず動く」実装はしない。
- t-wadaのTDDに従って、RED-GREEN-REFACTORサイクルを回すことを基本とする。テストは実装コードと同時に作成すること。

## タスク完了の定義

コーディングタスクを完了とみなす前に、以下を必ず実行してすべてパスさせること。

**Issueの各タスクが完了したら、`docs/todo.md` の該当チェックボックスを `- [ ]` から `- [x]` に更新すること。** テスト・lintがパスしてから更新する。

```bash
# フロントエンド
cd frontend && npm run test   # Vitest
cd frontend && npm run lint   # ESLint

# バックエンド
cd backend && go test ./...   # go test
cd backend && golangci-lint run  # golangci-lint
```

`make test` / `make lint` でも同様に実行できる。いずれかが失敗した場合はタスク完了としない。修正してから再度確認すること。

## スキル

`.claude/skills/` に以下のスキルが配置されている。該当する作業の際は積極的に参照・適用すること。

| スキル | パス | 使いどころ |
|--------|------|-----------|
| clean-code-principles | `.claude/skills/clean-code-principles/SKILL.md` | **コード作成・レビュー時は必ず参照・適用すること**。リーダブルコード・DRY・YAGNI・SOLID原則を適用する |
| create-worktree-env | `.claude/skills/create-worktree-env/SKILL.md` | Git worktree作成後に `.env` 等のgitignore済みファイルをコピーする（スクリプトあり） |
| design-guide | `.claude/skills/design-guide/SKILL.md` | **フロントエンドスタイリングやコンポーネント作成は必ず参照・適用すること**。UI/UXデザインの品質向上と、プロジェクトのデザインルールを把握し、デザインを設計する |
## エージェント

`.claude/agents/` に以下のサブエージェントが配置されている。複雑・専門的な作業はタスクとして委譲すること。

| エージェント | ファイル | 担当領域 |
|---|---|---|
| code-reviewer | `.claude/agents/code-reviewer.md` | コードレビュー（可読性・DRY・セキュリティ・テスト観点） |
| test-runner | `.claude/agents/test-runner.md` | テスト作成・実行・失敗デバッグ・カバレッジ改善 |
