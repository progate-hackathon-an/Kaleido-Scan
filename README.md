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

### 起動手順

```bash
# リポジトリをクローン
git clone https://github.com/<org>/Kaleid-Scan.git
cd Kaleid-Scan

# 環境変数を設定
cp .env.example .env
# .env を編集して GEMINI_API_KEY 等を設定

# 起動
docker compose up --build

# 動作確認
# フロントエンド: http://localhost:5173にアクセスして200 OK を確認
# バックエンド: http://localhost:8080/health にアクセスして{"status":"ok"}が返ることを確認
```

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
