# Kaleido Scan

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
git clone https://github.com/<org>/Kaleido-Scan.git
cd Kaleido-Scan

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

### フォーマット・リント・テスト

| | フォーマット | リント | テスト |
|-|-------------|--------|--------|
| フロント | Prettier | ESLint | Vitest |
| バック | gofmt | golangci-lint | go test |

- **IDE（VSCode）**: 保存時（Cmd+S / Ctrl+S）に自動フォーマット（`.vscode/settings.json`）
- **Claude Code**: `Write` / `Edit` ツール実行後に自動フォーマット（`.claude/settings.json`）
- **コミット前**: lefthook が自動でフォーマット・リント・テストを実行（[CONTRIBUTING.md](CONTRIBUTING.md) にセットアップ手順あり）

### 接続先URL

| サービス | URL |
|---------|-----|
| フロントエンド | http://localhost:5173 |
| バックエンド | http://localhost:8080 |
| PostgreSQL | localhost:5432 |

### DBのセットアップ

`docker compose up` だけで完結する。追加の手動操作は不要。

- **マイグレーション**: `backend/db/migrations/` 以下の SQL が `embed.FS` でバイナリに埋め込まれ、バックエンド起動時に自動実行される
- **シードデータ**: バックエンド起動時に自動投入される（`SEED_ON_STARTUP=true` がデフォルト）

DB を完全にリセットしたい場合は volume を削除して再起動する。

```bash
docker compose down -v && docker compose up --build
```

## ディレクトリ構造

```
Kaleido-Scan/
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
│   │   ├── api/                    # APIクライアント
│   │   │   ├── client.ts           # 共通設定（BaseURL等）
│   │   │   └── scanApi.ts             # スキャン・商品取得API
│   │   ├── components/             # 再利用可能なUIコンポーネント
│   │   │   ├── common/             # Button, Modal, LoadingSpinner 等
│   │   │   └── layout/             # AppShell, BottomSheet 等
│   │   ├── features/               # 機能単位の垂直分割
│   │   │   ├── camera/             # カメラ制御・シャッター・プレビュー
│   │   │   ├── aura/               # オーラ描画（Canvas API・5段階）
│   │   │   └── product/            # 商品詳細BottomSheet・未検出エラーModal
│   │   ├── pages/                  # ルート対応のページコンポーネント
│   │   │   └── ScanPage.tsx        # メイン撮影画面
│   │   ├── hooks/                  # 横断的カスタムフック（useCamera等）
│   │   ├── utils/                  # 純粋関数（座標変換・画像変換等）
│   │   ├── types/                  # 型定義（*.d.ts）
│   │   ├── App.tsx
│   │   └── main.tsx                # エントリーポイント
│   ├── public/
│   │   └── manifest.json           # PWA設定
│   ├── Dockerfile
│   └── package.json
├── db/
│   └── migrations/          # マイグレーションファイル
├── docs/                    # 設計ドキュメント一式(サンプル画像もここにある)
├── docker-compose.yml
├── .env.example
├── CONTRIBUTING.md
└── README.md
```

## ドキュメント

各ファイルの責任範囲を明確にする。迷ったらここを参照し、重複して書かない。

| ファイル | 書くこと | 書かないこと |
|----------|---------|------------|
| [README.md](README.md) | セットアップ手順・make コマンド・ディレクトリ構造 | 機能仕様・設計判断の根拠 |
| [CONTRIBUTING.md](CONTRIBUTING.md) | コーディング規約・Git運用・テスト方針・チーム役割分担 | 機能仕様・技術選定理由 |
| [docs/product-overview.md](docs/product-overview.md) | Why（コンセプト・ターゲット・ペルソナ・ゲイン） | 画面構成・技術仕様 |
| [docs/requirement.md](docs/requirement.md) | What（機能要件・非機能要件・スコープ・技術スタック・アーキテクチャ・技術判断の根拠） | セットアップ手順・ディレクトリ構造 |
| [docs/api-requirement.md](docs/api-requirement.md) | エンドポイント仕様・リクエスト/レスポンス定義・エラー仕様 | DB設計・フロントの実装詳細 |
| [docs/db-requirement.md](docs/db-requirement.md) | テーブル定義・ER図・主要クエリ・シードデータ | API仕様・フロントの実装詳細 |
| [docs/development-schedule.md](docs/development-schedule.md) | ハッカソンのタイムライン・フェーズ目標・リスク対応策 | 機能仕様・技術仕様 |
| [docs/todo.md](docs/todo.md) | Issue単位の実装タスク一覧・進捗 | 仕様の詳細・設計判断 |
