# AWS 移行計画 TODO

> 参照元: [docs/iac-guide.md](iac-guide.md) § 4. progateハッカソン AWS 移行計画手順書
> 実施順: Phase 0 → 1 → 2 → 3 → 4 → 5

---

## Phase 0: AWS アカウント・ツール準備（目安 30 分）

### 0-1. AWS アカウントの確認

- [x] AWS マネジメントコンソールにログインできることを確認

### 0-2. IAM ユーザーと Access Key の発行（AWSコンソール）

> ※ WSParticipantRole（AdministratorAccess 付き）で認証済み。IAM ユーザー作成は不要。

- [x] アクセスキー発行済み（WSParticipantRole）
- [x] Access Key ID と Secret Access Key を設定済み

### 0-3. ローカルへのツールインストール

- [x] AWS CLI をインストール（`aws --version` で確認）
- [x] Node.js をインストール（`node --version` で確認）
- [x] AWS CDK をインストール（`cdk --version` で確認）

### 0-4. AWS CLI への認証情報設定

- [x] `aws configure` でリージョン `us-east-1` を設定
- [x] `aws sts get-caller-identity` でアカウントID（097395515323）が返ることを確認

---

## Phase 1: CDK プロジェクトのセットアップ（目安 1 時間）

### 1-1. infra/ ディレクトリの作成と初期化

- [x] `infra/` ディレクトリ作成済み
- [x] `npm install aws-cdk-lib constructs` を実行済み
- [x] `package.json` / `tsconfig.json` / `cdk.json` 作成済み

### 1-2. スタックファイルを目的別に分割

- [x] `lib/network-stack.ts` を作成（VPC・サブネット・Security Group）
- [x] `lib/database-stack.ts` を作成（Aurora PostgreSQL）
- [x] `lib/lambda-stack.ts` を作成（Lambda + API Gateway）
- [x] `bin/infra.ts` を作成（スタックの組み立て）

---

## Phase 2: インフラ定義をコードで書く（目安 2〜3 時間）

### 2-1. network-stack.ts

- [x] `KaleidoVpc` を定義（maxAzs: 2、NAT Gateway: 1、public + private サブネット）
- [x] `LambdaSG`（Lambda 用 Security Group）を定義してエクスポート

### 2-2. database-stack.ts

- [x] `DbSG` を定義し、LambdaSG からのポート 5432 のみ許可
- [x] Aurora Serverless v2 クラスターを定義（PostgreSQL 16.4、min 0.5 / max 4 ACU）
- [x] `dbEndpoint` / `dbSecretArn` をエクスポート

### 2-3. lambda-stack.ts

- [x] Lambda 関数を定義（PROVIDED_AL2023 / arm64 / 512MB / 30s）
- [x] `secretsmanager:GetSecretValue` / `bedrock:InvokeModel` / `aws-marketplace` の IAM ポリシーを付与
- [x] HTTP API Gateway を定義（CORS: `*`、ルート: `/{proxy+}`）
- [x] API URL を `CfnOutput` で出力

### 2-4. bin/infra.ts（スタックの組み立て）

- [x] `NetworkStack` → `DatabaseStack` → `LambdaStack` の依存関係を設定
- [x] `npm run build` でコンパイルエラーなし
- [x] `cdk synth` で CloudFormation テンプレートが生成されることを確認

### 2-5. Go バックエンドの Lambda 対応

- [x] `main.go` に Lambda adapter を追加（`AWS_LAMBDA_FUNCTION_NAME` 環境変数で分岐）
- [x] `main.go` のマイグレーションパスを `/db/migrations` → `db/migrations`（相対パス）に変更
- [x] `config/config.go` に `DBSecretARN` フィールドを追加
- [x] `database/secrets.go` を作成（Secrets Manager から DB パスワードを取得）
- [x] `database/db.go` を更新（`DBSecretARN` がある場合は Secrets Manager を使用）
- [x] `go.mod` に `aws-lambda-go` / `aws-lambda-go-api-proxy` / `secretsmanager` を追加

---

## Phase 3: ローカルから手動で初回デプロイ（目安 1 時間）

### 3-1. バックエンドのビルド

- [x] `GOOS=linux GOARCH=arm64 go build -tags lambda.norpc -o bootstrap .` を実行
- [x] `zip -j handler.zip bootstrap && zip -r handler.zip db/migrations/` を実行（リポジトリルートで）
- [x] `backend/handler.zip` が生成されていることを確認

### 3-2. CDK Bootstrap（アカウントに 1 回だけ実行）

- [x] `cdk bootstrap aws://097395515323/us-east-1` を実行済み（CDKToolkit: CREATE_COMPLETE）

### 3-3. CDK デプロイ

- [x] `cdk deploy --all` を実行
- [x] `Outputs` に `KaleidoLambdaStack.ApiUrl` が出力されていることを確認
  - API URL: `https://yv0r1dmu8d.execute-api.us-east-1.amazonaws.com/`

### 3-4. 動作確認

- [x] `curl https://<API_URL>/health` で `{"status":"ok"}` が返ることを確認
- [x] `curl -X POST https://<API_URL>/scan/ranking -F "image=@test.jpg"` で商品が検出されることを確認
- [x] CloudWatch Logs で Lambda の実行ログにエラーがないことを確認（Bedrock 正常応答確認）

---

## Phase 4: GitHub Actions の設定（目安 1 時間）

### 4-1. OIDC ロールの作成

- [x] `lib/github-oidc-stack.ts` を作成
- [x] `bin/infra.ts` に `GithubOidcStack` を追加
- [x] `cdk deploy KaleidoGithubOidc` でスタックをデプロイ
- [x] AWSコンソール → IAM → ロール → `github-actions-role` が存在することを確認

### 4-2. GitHub Secrets の登録

- [x] `AWS_ACCOUNT_ID`（097395515323）を GitHub Secrets に登録

### 4-3. ワークフローファイルの配置

- [x] `.github/workflows/deploy.yml` を配置
- [x] `git push origin main` で Actions が自動実行されることを確認
- [x] deploy-infra まで全ジョブ通過を確認

---

## Phase 5: アプリ動作確認・切り替え（目安 1 時間）

### 5-1. フロントエンドの API URL 設定

- [ ] `frontend/.env.production` に `VITE_API_URL=https://<API_URL>` を設定

### 5-2. Amplify Hosting の設定（AWSコンソール）

- [ ] Amplify → 新しいアプリ → GitHub リポジトリを接続
- [ ] ビルドコマンド: `cd frontend && npm run build` / 公開ディレクトリ: `frontend/dist`
- [ ] 環境変数: `VITE_API_URL = https://<API_URL>` を登録
- [ ] Amplify のドメイン（`https://xxx.amplifyapp.com`）をメモ

### 5-3. CORS 設定の更新

- [ ] `lambda-stack.ts` の `allowOrigins` を Amplify ドメインに更新して再デプロイ

### 5-4. 最終確認チェックリスト

- [ ] `cdk deploy --all` がエラーなく完了している
- [ ] `curl` で `/scan/ranking` が HTTP 200 を返す
- [ ] Amplify のデプロイが成功している
- [ ] スマホブラウザからカメラスキャンが動作する
- [ ] Bedrock（Claude Sonnet 4.5）が応答する
- [ ] GitHub に push すると Actions が自動実行される

---

## トラブルシューティング早見表

| エラー | 原因 | 対処 |
|--------|------|------|
| `Unable to resolve AWS account` | AWS CLI 認証未設定 | `aws configure` を再実行 |
| `CDKToolkit stack failed` | Bootstrap 未実行 | `cdk bootstrap` を実行 |
| `Lambda timeout` | Aurora への接続が遅い | Lambda タイムアウト 30 秒の設定を確認 |
| `Bedrock AccessDenied` | IAM ポリシー不足 | `bedrock:InvokeModel` の権限を確認 |
| `on-demand throughput isn't supported` | 新モデルは inference profile 必須 | モデルIDに `us.` プレフィックスを付ける |
| `aws-marketplace AccessDenied` | Marketplace 権限不足 | Lambda ロールに `aws-marketplace:ViewSubscriptions/Subscribe` を付与 |
| `CORS error` | API GW の CORS 設定漏れ | Amplify の URL を `allowOrigins` に追加し再デプロイ |
| `Actions: credentials error` | OIDC ロール未作成 or Secret 未登録 | Phase 4-1・4-2 を再確認 |
| DB 接続エラー（Lambda） | `DB_HOST` / `DB_SECRET_ARN` 未設定 | CDK の環境変数定義と Secrets Manager の ARN を確認 |
