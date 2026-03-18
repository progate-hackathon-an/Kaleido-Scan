# IaC ガイド — Kaleid Scan AWS インフラ自動化

## 目次

1. [IaC ツール選定](#1-iac-ツール選定)
2. [Kaleid Scan の AWS アーキテクチャについて](#2-kaleid-scan-の-aws-アーキテクチャについて)
3. [GitHub Actions による CI/CD](#3-github-actions-による-cicd)
4. [progateハッカソン AWS 移行計画手順書](#4-progateハッカソン-aws-移行計画手順書)

---

## 1. IaC ツール選定

### 候補ツールの概要

| ツール | 言語 | State 管理 | AWS 専用か |
|--------|------|-----------|-----------|
| **AWS CDK** | TypeScript / Python 等 | CloudFormation が自動管理 | AWS 専用 |
| **Terraform** | HCL（独自言語） | tfstate ファイル（自己管理） | マルチクラウド |
| **AWS SAM** | YAML | CloudFormation が自動管理 | AWS 専用（サーバーレス特化） |
| **Pulumi** | TypeScript / Python 等 | Pulumi Cloud（外部サービス） | マルチクラウド |
| **CloudFormation 直書き** | YAML / JSON | CloudFormation が自動管理 | AWS 専用 |

---

### 定量評価（ハッカソン観点）

評価基準はすべて 1〜5 点（5が最良）。

| 評価項目 | 重み | CDK | Terraform | SAM | Pulumi | CFn直書き |
|---------|:---:|:---:|:---------:|:---:|:------:|:--------:|
| セットアップ速度 | 20% | 4 | 3 | 5 | 4 | 2 |
| TypeScript 対応 | 20% | 5 | 2 | 1 | 5 | 1 |
| State 管理のシンプルさ | 20% | 5 | 2 | 5 | 4 | 5 |
| Amplify / Lambda / RDS 対応 | 15% | 5 | 5 | 3 | 5 | 5 |
| GitHub Actions 統合 | 15% | 5 | 3 | 5 | 4 | 3 |
| ハッカソン実績・情報量 | 10% | 4 | 3 | 5 | 2 | 3 |
| **加重合計** | | **4.70** | **2.80** | **4.10** | **4.05** | **3.10** |

#### 各ツールの主な強み・弱み

**AWS CDK（推奨）**
- React/Go と同じ TypeScript でインフラを記述できる
- State ファイルを自分で管理しない（CloudFormation に委譲）
- `cdk deploy --all` のワンコマンドで全スタックをデプロイ
- IAM ロールをメソッドチェーンで自動生成（手書き不要）
- Amplify Hosting も Lambda も RDS もすべてカバー

**Terraform（不採用）**
- HCL という専用言語の学習コストが発生
- `terraform.tfstate` をチームで共有するために S3 + DynamoDB の初期設定が必要
- GitHub Actions での State Lock エラーがハッカソン中に起きやすい
- マルチクラウド対応は不要なので優位性がない

**SAM（参考）**
- Lambda + API Gateway に特化した YAML で最速
- Amplify Hosting のリソース管理に非対応（フロント側は別管理が必要）
- バックエンドのみで完結するなら SAM も有力

**Pulumi**
- TypeScript ネイティブで CDK に近い書き心地
- Pulumi Cloud への認証トークン管理が別途必要
- コミュニティ・日本語情報量が CDK より少ない

---

### 結論

> **AWS CDK（TypeScript）を採用する**

理由: TypeScript 統一・State 管理ゼロ・Amplify 完全対応・GitHub Actions との統合が最も簡潔。

---

## 2. Kaleid Scan の AWS アーキテクチャについて
### Kaleid Scan の構成
Kaleid Scan は認証不要・サーバーレス構成なので以下のように最適化させる

```
  [   Mobile Browser（PWA）  ]
    │                     │
    │ ① アプリ取得         │ ② API 呼び出し（HTTPS）
    │   （初回のみ）        │   POST /scan/ranking
    ▼                     ▼
┌──────────────┐   ┌─────────────────────────────┐
│    Amplify   │   │    API Gateway（HTTP API）   │
│    Hosting   │   │    CORS 設定・レート制限        │
│              │   └──────────────┬──────────────┘
│ React + TS   │                  │ Lambda プロキシ統合
│ 静的ホスティング│                  ▼
└──────────────┘   ┌─────────────────────────────┐
                   │    Lambda（Go + Gin）        │
                   │    画像受信・AI 呼び出し・DB 検索│
                   │    512MB / タイムアウト: 30s  │
                   └────────┬────────────────────┘
                            │                │
                            ▼                ▼
                   ┌────────────────┐  ┌────────────────────┐
                   │ Aurora          │  │ Bedrock             │
                   │ PostgreSQL      │  │（Claude Sonnet）    │
                   │（VPC Private）  │  │ 画像認識            │
                   │ 売上ランキング   │  │ バウンディングボックス │
                   └────────────────┘  └────────────────────┘
```

> **ポイント**: Amplify は React アプリのファイルをブラウザに配布するだけ。
> API 呼び出しはブラウザが直接 API Gateway に投げる。Amplify は関与しない。

### AWSアーキテクチャ図
draw.ioを使用し、よりイメージしやすくするためのAWS構成図を以下に示す
![alt text](<iac-guide-image/aws-architecture.png>)

---

### 各 AWS サービスの設定値

| サービス | 設定 | 値 |
|---------|------|----|
| **Amplify Hosting** | ビルドコマンド | `npm run build` |
| | 公開ディレクトリ | `dist` |
| | 環境変数 | `VITE_API_URL` |
| **API Gateway** | タイプ | HTTP API（v2）|
| | ルート | `GET /health`、`POST /scan/ranking`、`POST /scan/hidden-gems`、`POST /scan/trending`、`GET /products/:id` |
| | CORS | Amplify のドメインのみ許可 |
| **Lambda** | ランタイム | `provided.al2023`（Go カスタムランタイム）|
| | アーキテクチャ | `arm64` |
| | メモリ | 512 MB |
| | タイムアウト | 30 秒 |
| | 環境変数 | `DB_HOST`、`DB_SECRET_ARN`、`AI_PROVIDER=bedrock`、`AWS_REGION` |
| **Aurora** | エンジン | Aurora PostgreSQL 16 |
| | タイプ | Serverless v2（ハッカソン向け: 低負荷時に自動スケールダウン） |
| | キャパシティ | min 0.5 ACU / max 2 ACU |
| | サブネット | VPC プライベートサブネット |
| | 接続 | Lambda の Security Group のみ許可 |

> **コールドスタートに注意**: Aurora Serverless v2 はアイドル状態から最初のリクエストで数秒〜10秒のコールドスタートが発生する場合がある。
> 対策として [UptimeRobot](https://uptimerobot.com/)（無料）で API エンドポイントを5分おきに監視・ping させると、Lambda と Aurora の両方をウォームな状態に保てる。
| **Bedrock** | モデル | `anthropic.claude-sonnet-4-5` |
| | アクセス | Lambda IAM ロールにポリシー付与 |

---

### CDK スタック構成（ファイル分割案）

```
infra/
├── bin/
│   └── kaleid-scan.ts        # エントリーポイント（スタック列挙）
└── lib/
    ├── network-stack.ts      # VPC・サブネット・Security Group
    ├── database-stack.ts     # Aurora PostgreSQL
    ├── lambda-stack.ts       # Lambda + API Gateway + IAM
    └── frontend-stack.ts     # Amplify Hosting
```

`network-stack` → `database-stack` → `lambda-stack` の順に依存する。
`frontend-stack` は独立して並列デプロイ可能。

---


### 参考：類似サービスのアーキテクチャパターン

![alt text](<shoppy/スクリーンショット 2026-03-17 23.29.14.png>)


> 上記は EC2 + Cognito + Aurora + Bedrock + S3 を CloudFlare Tunnel で接続する構成。<br>
> 引用： [Shoppy](https://topaz.dev/projects/0ee03e327e7bb753ce6c)

---

## 3. GitHub Actions による CI/CD

### ブランチ戦略とデプロイ対象

| ブランチ | トリガー | デプロイ先 |
|---------|---------|----------|
| `main` | push | 本番（AWS Lambda + Amplify） |

---

### ワークフロー全体像

```
push (main)
  └─ deploy.yml
       ├─ [job1] build-backend   → Go binary をビルド → ZIP 化
       ├─ [job2] test-frontend   → Vitest + ESLint
       ├─ [job3] test-backend    → go test + golangci-lint
       ├─ [job4] deploy-infra    → cdk deploy（job1,2,3 完了後）
       └─ [job5] deploy-frontend → Amplify が GitHub 連携で自動実行
```

---

### AWS 認証（OIDC）— シークレットキー不要

GitHub Actions から AWS へのアクセスは **OIDC（OpenID Connect）** を使用する。
シークレットキーをリポジトリに持たせないため、セキュリティ上推奨。

```yaml
# .github/workflows/deploy.yml（抜粋）
permissions:
  id-token: write   # OIDC トークン発行
  contents: read

- name: Configure AWS credentials (OIDC)
  uses: aws-actions/configure-aws-credentials@v4
  with:
    role-to-assume: arn:aws:iam::${{ secrets.AWS_ACCOUNT_ID }}:role/github-actions-role
    aws-region: ap-northeast-1
```

事前に AWS 側で以下を作成する:
1. OIDC プロバイダー（`token.actions.githubusercontent.com`）
2. IAM ロール（`github-actions-role`）に必要なポリシーを付与

---

### deploy.yml（完全版）

```yaml
# .github/workflows/deploy.yml
name: Deploy to AWS

on:
  push:
    branches: [main]

permissions:
  id-token: write
  contents: read

jobs:
  # ─── バックエンドビルド ──────────────────────────────────────
  build-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-go@v5
        with:
          go-version: '1.22'

      - name: Build Go binary
        working-directory: backend
        run: |
          GOOS=linux GOARCH=arm64 go build -o bootstrap ./cmd/api
          zip handler.zip bootstrap

      - uses: actions/upload-artifact@v4
        with:
          name: backend-zip
          path: backend/handler.zip

  # ─── フロントエンドテスト ────────────────────────────────────
  test-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: npm
          cache-dependency-path: frontend/package-lock.json
      - run: npm ci
        working-directory: frontend
      - run: npm run lint
        working-directory: frontend
      - run: npm run test
        working-directory: frontend

  # ─── バックエンドテスト ──────────────────────────────────────
  test-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-go@v5
        with:
          go-version: '1.22'
      - run: go test ./...
        working-directory: backend
      - name: golangci-lint
        uses: golangci/golangci-lint-action@v6
        with:
          working-directory: backend

  # ─── インフラ + Lambda デプロイ ──────────────────────────────
  deploy-infra:
    needs: [build-backend, test-frontend, test-backend]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - uses: actions/download-artifact@v4
        with:
          name: backend-zip
          path: backend/

      - name: Configure AWS credentials (OIDC)
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::${{ secrets.AWS_ACCOUNT_ID }}:role/github-actions-role
          aws-region: ap-northeast-1

      - name: Install CDK dependencies
        working-directory: infra
        run: npm ci

      - name: CDK Bootstrap（初回のみ有効）
        working-directory: infra
        run: npx cdk bootstrap --ci || true

      - name: CDK Deploy
        working-directory: infra
        run: npx cdk deploy --all --require-approval never --ci
        env:
          AWS_ACCOUNT_ID: ${{ secrets.AWS_ACCOUNT_ID }}
```

---

---

### 初回セットアップ手順

```bash
# 1. CDK プロジェクト作成（infra/ ディレクトリ）
mkdir infra && cd infra
npx cdk init app --language typescript
npm install aws-cdk-lib constructs

# 2. AWS OIDC プロバイダー作成（CLI で1回だけ実行）
aws iam create-open-id-connect-provider \
  --url https://token.actions.githubusercontent.com \
  --client-id-list sts.amazonaws.com

# 3. IAM ロール作成（CDK でも可）
#    信頼ポリシー: repo:your-org/kaleid-scan:ref:refs/heads/main
#    許可ポリシー: Lambda, RDS, APIGateway, CDK 実行に必要な権限

# 4. リポジトリの Secrets に登録
#    Settings > Secrets > New secret
#    AWS_ACCOUNT_ID = 123456789012

# 5. 初回デプロイ（ローカルから）
cd infra
npx cdk bootstrap aws://123456789012/ap-northeast-1
npx cdk deploy --all
```

---

### GitHub Actions と Amplify の関係

**Amplify Hosting はリポジトリを直接ウォッチして自動デプロイする。**
GitHub Actions 側では Amplify のデプロイを呼ばなくてよい。

```
push to main
  ├─ GitHub Actions → CDK → Lambda + API Gateway + Aurora を更新
  └─ Amplify        → フロントエンドを自動ビルド・デプロイ（独立）
```

CDK の `frontend-stack.ts` で Amplify アプリを定義し、GitHub リポジトリとのブランチ接続を設定する。
その後の実際のフロントエンドビルドは Amplify 側が GitHub Webhook で自律的に実行する。

---

### 環境変数の管理

| 変数 | 管理場所 | 参照先 |
|------|---------|-------|
| `AWS_ACCOUNT_ID` | GitHub Secrets | deploy.yml |
| `VITE_API_URL` | Amplify 環境変数（コンソール or CDK） | フロントエンドビルド時 |
| `DB_HOST` | CDK で Aurora のエンドポイントを Lambda に自動注入 | Lambda 環境変数 |
| `DB_SECRET_ARN` | CDK で Secrets Manager の ARN を Lambda に自動注入 | Lambda 環境変数 |
| `AI_PROVIDER` | CDK のスタック定義内にハードコード | Lambda 環境変数 |

`DB_HOST` と `DB_SECRET_ARN` は CDK が Aurora クラスター作成後に自動生成される値を Lambda の `environment` に渡すため、手動管理不要。
Go 側の起動処理で `DB_SECRET_ARN` を使って Secrets Manager から DB パスワードを取得し、接続文字列を組み立てること。

---

## まとめ

| 項目 | 選択 | 理由 |
|------|------|------|
| IaC ツール | **AWS CDK（TypeScript）** | TS 統一・State 管理ゼロ・Amplify 対応 |
| AWS 認証 | **OIDC** | シークレットキー不要・セキュア |
| フロントデプロイ | **Amplify 自動** | CDK と独立・GitHub 連携で設定不要 |
| バックエンドデプロイ | **CDK + GitHub Actions** | `cdk deploy` ワンコマンド |
| テスト | **main push 時に必須実行** | デプロイ前にブロック |

---

## 4. progateハッカソン AWS 移行計画手順書

ローカル（Docker Compose + Gemini）で動いているアプリを AWS 本番環境に移行するための全手順。
**初めてやる場合は Phase 0 から順番に進めること。**

---

### 全体フェーズ

```
Phase 0: AWS アカウント・ツール準備       （30分）
Phase 1: CDK プロジェクトのセットアップ   （1時間）
Phase 2: インフラ定義をコードで書く       （2〜3時間）
Phase 3: ローカルから手動で初回デプロイ   （1時間）
Phase 4: GitHub Actions の設定          （1時間）
Phase 5: アプリ動作確認・切り替え        （1時間）
```

---

### Phase 0: AWS アカウント・ツール準備

#### 0-1. AWS アカウントの確認

これは、AWSアカウント配布されるのでAWSマネジメントコンソールに行ければOK

#### 0-2. IAM ユーザーと Access Key の発行

AWSコンソール（GUI）での操作。**これだけがGUI作業。**

```
AWSコンソール
  → IAM → ユーザー → ユーザーを作成
  → ユーザー名: kaleid-scan-dev
  → 許可ポリシー: AdministratorAccess（ハッカソン用途のため簡略化）
  → 作成後: セキュリティ認証情報 → アクセスキーを作成
  → Access Key ID と Secret Access Key をメモ
```

#### 0-3. ローカルへのツールインストール
Mac
```bash
# AWS CLI
brew install awscli

# Node.js（CDK に必要）
brew install node

# AWS CDK
npm install -g aws-cdk

# インストール確認
aws --version     # aws-cli/2.x.x
cdk --version     # 2.x.x
```

WSL（Ubuntu）
```bash
# AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip && sudo ./aws/install

# Node.js（nvm 経由が推奨）
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 20 && nvm use 20

# AWS CDK
npm install -g aws-cdk

# インストール確認
aws --version     # aws-cli/2.x.x
cdk --version     # 2.x.x
```

#### 0-4. AWS CLI に認証情報を設定

**自分のMac / WSL のターミナルで実行する。** これはローカルのMacに認証情報を保存する作業で、`~/.aws/credentials` に書き込まれる。
GitHub Actions は別途 OIDC で認証するため、このローカル設定は Phase 3（手動デプロイ）のときだけ使う。

```bash
aws configure
# AWS Access Key ID:     （0-2 でメモした値）
# AWS Secret Access Key: （0-2 でメモした値）
# Default region name:   ap-northeast-1
# Default output format: json

# 確認（アカウントIDと名前が返れば成功）
aws sts get-caller-identity
```

---

### Phase 1: CDK プロジェクトのセットアップ

#### 1-1. infra/ ディレクトリの作成と初期化

リポジトリルートで実行する。

```bash
mkdir infra && cd infra
cdk init app --language typescript
npm install aws-cdk-lib constructs
```

実行後に以下のファイルが生成される:

```
infra/
├── bin/
│   └── infra.ts          # エントリーポイント（ここでスタックを列挙）
├── lib/
│   └── infra-stack.ts    # デフォルトのスタック（後で分割する）
├── cdk.json              # CDKの設定ファイル
└── package.json
```

#### 1-2. スタックファイルを目的別に分割

`lib/infra-stack.ts` を削除して以下4ファイルを作成する:

```bash
touch lib/network-stack.ts   # VPC・サブネット
touch lib/database-stack.ts  # Aurora PostgreSQL
touch lib/lambda-stack.ts    # Lambda + API Gateway
touch lib/frontend-stack.ts  # Amplify Hosting
```

#### 1-3. CDK Bootstrap（アカウントに1回だけ実行）

CDKが内部で使う S3 バケットなどを AWS 側に準備するコマンド。

```bash
# infra/ ディレクトリで実行
# 123456789012 は自分の AWS アカウントID に置き換える
cdk bootstrap aws://123456789012/ap-northeast-1
```

---

### Phase 2: インフラ定義をコードで書く

#### 2-1. network-stack.ts（VPC・サブネット・NAT Gateway）

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

export class NetworkStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly lambdaSG: ec2.SecurityGroup;

  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // VPC（public + private サブネット × 2AZ、NAT Gateway 1個）
    this.vpc = new ec2.Vpc(this, 'KaleidVpc', {
      maxAzs: 2,
      natGateways: 1,
      subnetConfiguration: [
        { name: 'public',  subnetType: ec2.SubnetType.PUBLIC,              cidrMask: 24 },
        { name: 'private', subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS, cidrMask: 24 },
      ],
    });

    // Lambda 用 Security Group
    this.lambdaSG = new ec2.SecurityGroup(this, 'LambdaSG', {
      vpc: this.vpc,
      description: 'Security group for Lambda function',
    });
  }
}
```

#### 2-2. database-stack.ts（Aurora PostgreSQL Serverless v2）

Aurora Serverless v2 はリクエストがないときに自動でスケールダウンするため、ハッカソンのように負荷が不規則な環境でコストを抑えやすい。

```typescript
import * as cdk from 'aws-cdk-lib';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

type Props = cdk.StackProps & {
  vpc:      ec2.Vpc;
  lambdaSG: ec2.SecurityGroup;
};

export class DatabaseStack extends cdk.Stack {
  public readonly dbEndpoint: string;
  public readonly dbSecretArn: string;

  constructor(scope: cdk.App, id: string, props: Props) {
    super(scope, id, props);

    const dbSG = new ec2.SecurityGroup(this, 'DbSG', { vpc: props.vpc });
    // Lambda からの接続のみ許可
    dbSG.addIngressRule(props.lambdaSG, ec2.Port.tcp(5432));

    const cluster = new rds.DatabaseCluster(this, 'KaleidDb', {
      engine: rds.DatabaseClusterEngine.auroraPostgres({
        version: rds.AuroraPostgresEngineVersion.VER_16_1,
      }),
      // Aurora Serverless v2: 低負荷時に 0.5 ACU まで自動縮小
      serverlessV2MinCapacity: 0.5,
      serverlessV2MaxCapacity: 2,
      writer: rds.ClusterInstance.serverlessV2('writer'),
      vpc:                props.vpc,
      vpcSubnets:         { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      securityGroups:     [dbSG],
      defaultDatabaseName: 'kaleid',
      credentials:        rds.Credentials.fromGeneratedSecret('postgres'),
      deletionProtection: false, // ハッカソン用途: 削除可能にする
    });

    this.dbEndpoint = cluster.clusterEndpoint.hostname;
    this.dbSecretArn = cluster.secret!.secretArn;
    new cdk.CfnOutput(this, 'DbEndpoint', { value: this.dbEndpoint });
  }
}
```

#### 2-3. lambda-stack.ts（Lambda + API Gateway）

```typescript
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigw from 'aws-cdk-lib/aws-apigatewayv2';
import * as integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

type Props = cdk.StackProps & {
  vpc:         ec2.Vpc;
  lambdaSG:    ec2.SecurityGroup;
  dbEndpoint:  string;
  dbSecretArn: string;
};

export class LambdaStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props: Props) {
    super(scope, id, props);

    const fn = new lambda.Function(this, 'ScanHandler', {
      runtime:        lambda.Runtime.PROVIDED_AL2023,
      architecture:   lambda.Architecture.ARM_64,
      handler:        'bootstrap',
      code:           lambda.Code.fromAsset('../backend/handler.zip'),
      memorySize:     512,
      timeout:        cdk.Duration.seconds(30),
      vpc:            props.vpc,
      securityGroups: [props.lambdaSG],
      environment: {
        DB_HOST:       props.dbEndpoint,
        DB_SECRET_ARN: props.dbSecretArn,
        AI_PROVIDER:   'bedrock',
        AWS_REGION:    this.region,
      },
    });

    // Secrets Manager から DB 認証情報を取得する権限を付与
    // Go 側では起動時に GetSecretValue を呼んで DB パスワードを取得する
    fn.addToRolePolicy(new iam.PolicyStatement({
      actions:   ['secretsmanager:GetSecretValue'],
      resources: [props.dbSecretArn],
    }));

    // Bedrock 呼び出し権限を Lambda に付与
    // ※ Bedrock 自体のリソースは AWS が管理しているため CDK で作成するものはない。
    //   CDK でやることは「Lambda に Bedrock を呼ぶ権限を与える」だけ。
    // ※ Bedrock は東京リージョン（ap-northeast-1）で Claude Sonnet が使えるか事前確認すること。
    //   使えない場合はバージニア（us-east-1）などに変更が必要。
    fn.addToRolePolicy(new iam.PolicyStatement({
      actions:   ['bedrock:InvokeModel'],
      resources: ['*'],
    }));

    // HTTP API Gateway
    // Amplify のドメインは CDK コンテキスト変数で渡す:
    //   cdk deploy -c amplifyDomain=https://xxx.amplifyapp.com
    const amplifyDomain = this.node.tryGetContext('amplifyDomain') as string;
    const api = new apigw.HttpApi(this, 'ScanApi', {
      corsPreflight: {
        allowOrigins: [amplifyDomain],
        allowMethods: [apigw.CorsHttpMethod.POST],
        allowHeaders: ['Content-Type'],
      },
    });

    const integration = new integrations.HttpLambdaIntegration('ScanIntegration', fn);
    api.addRoutes({ path: '/health',           methods: [apigw.HttpMethod.GET],  integration });
    api.addRoutes({ path: '/scan/ranking',     methods: [apigw.HttpMethod.POST], integration });
    api.addRoutes({ path: '/scan/hidden-gems', methods: [apigw.HttpMethod.POST], integration });
    api.addRoutes({ path: '/scan/trending',    methods: [apigw.HttpMethod.POST], integration });
    api.addRoutes({ path: '/products/{id}',    methods: [apigw.HttpMethod.GET],  integration });

    new cdk.CfnOutput(this, 'ApiUrl', { value: api.apiEndpoint });
  }
}
```

#### 2-4. bin/infra.ts（スタックの組み立て）

```typescript
import * as cdk from 'aws-cdk-lib';
import { NetworkStack }  from '../lib/network-stack';
import { DatabaseStack } from '../lib/database-stack';
import { LambdaStack }   from '../lib/lambda-stack';
import { FrontendStack } from '../lib/frontend-stack';

const app = new cdk.App();
const env = { account: process.env.CDK_DEFAULT_ACCOUNT, region: 'ap-northeast-1' };

const network  = new NetworkStack(app,  'KaleidNetwork',  { env });
const database = new DatabaseStack(app, 'KaleidDatabase', { env, vpc: network.vpc, lambdaSG: network.lambdaSG });
new LambdaStack(app,   'KaleidLambda',   { env, vpc: network.vpc, lambdaSG: network.lambdaSG, dbEndpoint: database.dbEndpoint, dbSecretArn: database.dbSecretArn });
new FrontendStack(app, 'KaleidFrontend', { env });
```

---

### Phase 3: ローカルから手動で初回デプロイ

GitHub Actions を設定する前に、まずローカルから手動で動作確認する。

```bash
# 1. バックエンドをビルド（Lambda 用の Linux バイナリ）
cd backend
GOOS=linux GOARCH=arm64 go build -o bootstrap ./cmd/api
zip handler.zip bootstrap
cd ..

# 2. CDK のコードをコンパイル
cd infra
npm run build

# 3. 変更内容のプレビュー（実際には何も変わらない）
cdk diff

# 4. デプロイ（全スタック）
cdk deploy --all
# → VPC → Aurora → Lambda → API GW の順に作成される（10〜15分）

# 5. 出力された API URL を確認
# Outputs:
#   KaleidLambda.ApiUrl = https://xxxxxxxx.execute-api.ap-northeast-1.amazonaws.com
```

#### 動作確認

```bash
curl -X POST https://xxxxxxxx.execute-api.ap-northeast-1.amazonaws.com/scan/ranking \
  -F "image=@test.jpg"
# → JSON レスポンスが返れば成功
```

---

### Phase 4: GitHub Actions の設定

#### 4-1. OIDC ロールの作成（CDK で自動化）

`lib/github-oidc-stack.ts` を追加して CDK で作成する:

```typescript
import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';

export class GithubOidcStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const provider = new iam.OpenIdConnectProvider(this, 'GithubOidc', {
      url: 'https://token.actions.githubusercontent.com',
      clientIds: ['sts.amazonaws.com'],
    });

    new iam.Role(this, 'GithubActionsRole', {
      roleName: 'github-actions-role',
      assumedBy: new iam.WebIdentityPrincipal(provider.openIdConnectProviderArn, {
        StringLike: {
          // progate-hackathon-an/Kaleid-Scan の main ブランチのみ許可
          'token.actions.githubusercontent.com:sub':
            'repo:progate-hackathon-an/Kaleid-Scan:ref:refs/heads/main',
        },
      }),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AdministratorAccess'), // ハッカソン用途
      ],
    });
  }
}
```

```bash
# OIDC スタックだけ先にデプロイ
cdk deploy KaleidGithubOidc
```

#### 4-2. GitHub Secrets の登録

```
GitHubリポジトリ
  → Settings → Secrets and variables → Actions → New repository secret

登録する値:
  AWS_ACCOUNT_ID = （自分の AWS アカウントID: 12桁の数字）
```

**AWS アカウントID の確認方法（どちらでも可）:**

- AWSコンソール右上のアカウント名をクリック → 「アカウントID: 1234-5678-9012」と表示される（ハイフンを除いた12桁を使う）
- ターミナルから取得（`aws configure` 設定後）:

```bash
aws sts get-caller-identity --query Account --output text
# → 123456789012
```

#### 4-3. ワークフローファイルの配置

Section 3 の `deploy.yml` を `.github/workflows/` に置く。

```bash
mkdir -p .github/workflows
# deploy.yml を配置（Section 3 のコードをコピー）

git add .github/workflows/
git commit -m "[add] GitHub Actions CI/CD ワークフロー"
git push origin main
# → Actions タブで自動実行されることを確認
```

---

### Phase 5: アプリ動作確認・切り替え

#### 5-1. フロントエンドの API URL を本番に切り替え

```bash
# frontend/.env.production
VITE_API_URL=https://xxxxxxxx.execute-api.ap-northeast-1.amazonaws.com
```

#### 5-2. Amplify Hosting の設定

```
AWSコンソール → Amplify → 新しいアプリ
  → GitHub リポジトリを接続
  → ブランチ: main
  → ビルドコマンド: cd frontend && npm run build
  → 公開ディレクトリ: frontend/dist
  → 環境変数: VITE_API_URL = （Phase 3 で確認した API URL）
```

#### 5-3. DB マイグレーションの実行

Aurora は VPC のプライベートサブネットにあるため、外部から直接 psql で接続できない。
ハッカソンでは Lambda の初回起動時に自動マイグレーションする実装が最も楽。

#### 5-4. 最終確認チェックリスト

```
[ ] cdk deploy --all がエラーなく完了した
[ ] curl で /scan/ranking が 200 を返す
[ ] Amplify のデプロイが成功している
[ ] スマホブラウザからカメラスキャンが動く
[ ] Bedrock（Claude Sonnet）が応答する
[ ] GitHub に push すると Actions が自動実行される
[ ] テスト失敗時に Actions がデプロイをブロックする
```

---

### トラブルシューティング

| エラー | 原因 | 対処 |
|--------|------|------|
| `Unable to resolve AWS account` | AWS CLI の認証未設定 | `aws configure` を再実行 |
| `CDKToolkit stack failed` | Bootstrap 未実行 | `cdk bootstrap` を実行 |
| `Lambda timeout` | Aurora への接続が遅い | Lambda タイムアウトを 30 秒に設定確認 |
| `Bedrock AccessDenied` | IAM ポリシー不足 | `bedrock:InvokeModel` の権限を確認 |
| `CORS error` | API GW の CORS 設定漏れ | Amplify の URL を `allowOrigins` に追加 |
| `Actions: credentials error` | OIDC ロール未作成 or Secret 未登録 | Phase 4-1・4-2 を再確認 |
