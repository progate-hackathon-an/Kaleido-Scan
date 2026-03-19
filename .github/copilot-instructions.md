## プロジェクト概要

**Kaleido Scan** — カメラで商品をスキャンして、売上データに基づいたオーラを表示する買い物体験アプリ。新しい商品との出会いをゲーム感覚で促進するハッカソンプロダクト。

## 技術スタック

- **フロントエンド**: React + TypeScript（Vite）+ PWA
- **バックエンド**: Go + Gin
- **データベース**: PostgreSQL（Docker ローカル / RDS 本番）
- **AI**: Gemini 2.5 Flash（ローカル） → AWS Bedrock Claude Sonnet（本番）
- **開発環境**: Docker Compose
- **本番環境**: AWS Lambda + API Gateway + Amplify Hosting + RDS

## ディレクトリ構造

```
Kaleido-Scan/
├── backend/
│   ├── main.go
│   ├── config/       # 環境変数・設定読み込み
│   ├── database/     # DB接続・マイグレーション
│   ├── handlers/     # HTTPハンドラー（scan, hidden-gems, products）
│   ├── middleware/   # CORS等
│   ├── models/       # データモデル
│   ├── routes/       # ルーティング定義
│   └── services/     # ビジネスロジック・AI API呼び出し（ranking/trending/hidden-gems）
├── frontend/
│   ├── public/
│   └── src/
│       ├── api/
│       ├── components/
│       ├── hooks/
│       ├── types/
│       └── utils/
├── db/migrations/    # マイグレーションファイル
├── docs/
└── docker-compose.yml
```

## APIエンドポイント

| メソッド | パス                | 説明                                    |
| -------- | ------------------- | --------------------------------------- |
| `POST`   | `/scan/ranking`     | 画像送信 → 商品識別・ランキング情報取得 |
| `POST`   | `/scan/trending`    | 画像送信 → 急上昇ランキング情報取得     |
| `POST`   | `/scan/hidden-gems` | 画像送信 → 掘り出し物ランキング情報取得 |
| `GET`    | `/products/:id`     | 商品詳細情報取得                        |

エラーレスポンス形式: `{ "error": { "code": "snake_case", "message": "日本語メッセージ" } }`

## コーディング規約

### フロントエンド（React + TypeScript）

- React コンポーネント・ファイル名・`type` 型名: `UpperCamelCase`
- 変数・関数名・`.ts` ファイル名: `camelCase`
- 定数: `CONSTANT_CASE`
- リンター・フォーマッター: ESLint + Prettier

### バックエンド（Go）

- Effective Go に準拠
- ファイル名: `lower_snake_case`
- 公開関数・定数: `UpperCamelCase`
- 非公開関数・変数: `lowerCamelCase`
- リンター: golangci-lint / フォーマッター: gofmt

## 開発原則

- 『リーダブル・コード』、DRY原則、YAGNI原則、SOLID原則を徹底する。「とりあえず動く」実装はしない。
- t-wadaのTDDに従って、RED-GREEN-REFACTORサイクルを回す。テストは実装コードと同時に作成すること。

## タスク完了の定義

コーディングタスクを完了とみなす前に、以下を必ず実行してすべてパスさせること。

```bash
make test   # フロント（Vitest）+ バック（go test）
make lint   # フロント（ESLint）+ バック（golangci-lint）
```

## Gitルール

- `main` ブランチは常にデプロイ可能に保つ
- ブランチ名: `feat/<Issue番号>`
- コミットメッセージ: `[タグ] #<Issue番号> 実装内容`（タグ: `add` / `fix` / `update` / `remove` / `clean`）
