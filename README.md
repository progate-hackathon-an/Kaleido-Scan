# Kaleid Scan

カメラで商品をスキャンするだけで、売上ランキングが「オーラ」として可視化される新しい買い物体験アプリ。

## コンセプト

**商品との出会いにエンタメ性を足す**

いつも同じ商品を買ってしまうユーザーに、新たな商品との出会いを生むきっかけを提供する。

## 技術スタック

| レイヤー | ローカル | 本番（AWS） |
|----------|---------|------------|
| フロントエンド | React + TypeScript (Vite) + PWA | Amplify Hosting |
| バックエンド | Go + Gin | Lambda + API Gateway |
| データベース | PostgreSQL (Docker) | RDS |
| AI | Gemini 2.0 Flash | AWS Bedrock (Claude Sonnet) |

## ローカル開発のセットアップ

### 前提条件

- Docker / Docker Compose
- Go 1.21+
- Node.js 20+

### コードフォーマッター

| 対象 | ツール | 設定ファイル |
|------|--------|------------|
| TypeScript / TSX / CSS / JSON | [Prettier](https://prettier.io/) | `frontend/.prettierrc` |
| Go | gofmt（Go標準） | — |

VSCode では保存時（Cmd+S / Ctrl+S）に自動フォーマットが走る（`.vscode/settings.json`）。推奨拡張は `.vscode/extensions.json` を参照。
Claude Code では `Write` / `Edit` ツール実行後に自動フォーマットが走る（`.claude/settings.json`）。
また、コミット前に lefthook が自動でフォーマット・リント・テストを実行するよう設定されている（[CONTRIBUTING.md](CONTRIBUTING.md) にセットアップ手順あり）。

### 起動手順

```bash
# リポジトリをクローン
git clone https://github.com/<org>/Kaleid-Scan.git
cd Kaleid-Scan

# 環境変数を設定
cp .env.example .env
# .env を編集して GEMINI_API_KEY 等を設定

# 起動
make build

# 動作確認
# フロントエンド: http://localhost:5173にアクセスして200 OK を確認
# バックエンド: http://localhost:8080/health にアクセスして{"status":"ok"}が返ることを確認
```

### make コマンド一覧
開発を効率化するための便利な make コマンドを用意しています。

| コマンド | 内容 |
|----------|------|
| `make up` | 開発サーバー起動 |
| `make down` | 停止 |
| `make build` | 再ビルドして起動 |
| `make logs-fe` | フロントのログを追跡 |
| `make logs-be` | バックのログを追跡 |
| `make db-shell` | PostgreSQL に接続 |
| `make test` | フロント・バック両テスト実行 |
| `make test-fe` / `make test-be` | 個別テスト実行 |
| `make lint` | フロント・バック両リント実行 |
| `make fmt` | フロント・バック両フォーマット実行 |

### 自動フォーマット・テスト

コミット前に lefthook が以下を自動実行します（[CONTRIBUTING.md](CONTRIBUTING.md) にセットアップ手順あり）。

| | フォーマット | リント | テスト |
|-|-------------|--------|--------|
| フロント | Prettier | ESLint | Vitest |
| バック | gofmt | golangci-lint | go test |

| サービス | URL |
|---------|-----|
| フロントエンド | http://localhost:5173 |
| バックエンド | http://localhost:8080 |
| PostgreSQL | localhost:5432 |

### DBのセットアップ

`docker compose up` だけで完結する。追加の手動操作は不要。

- **マイグレーション**: `db/migrations/` 以下の SQL が DB コンテナの初回起動時に自動実行される
- **シードデータ**: バックエンド起動時に自動投入される（`SEED_ON_STARTUP=true` がデフォルト）

DB を完全にリセットしたい場合は volume を削除して再起動する。

```bash
docker compose down -v && docker compose up --build
```

## ディレクトリ構造

```
Kaleid-Scan/
├── backend/
│   ├── main.go              # エントリーポイント
│   ├── config/              # 環境変数・設定読み込み
│   ├── database/            # DB接続・マイグレーション
│   ├── handlers/            # HTTPハンドラー（scan, products）
│   ├── middleware/          # CORS等
│   ├── models/              # データモデル
│   ├── routes/              # ルーティング定義
│   ├── services/            # ビジネスロジック（AI API呼び出しはここ）
│   ├── Dockerfile
│   ├── .air.toml            # Air（ホットリロード）設定
│   └── go.mod / go.sum
├── frontend/
│   ├── src/
│   ├── public/
│   │   └── manifest.json    # PWA設定
│   ├── Dockerfile
│   └── package.json
├── db/
│   └── migrations/          # マイグレーションファイル
├── docs/                    # 設計ドキュメント一式
├── docker-compose.yml
├── .env.example
├── CONTRIBUTING.md
└── README.md
```

## ドキュメント

| ファイル | 内容 |
|----------|------|
| [docs/product-overview.md](docs/product-overview.md) | プロダクトコンセプト・ターゲット・ペルソナ |
| [docs/requirement.md](docs/requirement.md) | 機能要件・技術スタック・アーキテクチャ |
| [docs/api-requirement.md](docs/api-requirement.md) | API仕様書 |
| [docs/db-requirement.md](docs/db-requirement.md) | DB設計書 |
| [docs/development-schedule.md](docs/development-schedule.md) | 開発スケジュール |
| [CONTRIBUTING.md](CONTRIBUTING.md) | 開発ルール・コーディング規約・Git運用 |
