# Kaleid Scan API仕様書

## 基本方針

- ベースURL: `http://localhost:8080`（ローカル）
- レスポンス形式: `application/json`
- エラー形式: 統一エラーレスポンス（後述）

---

## エンドポイント一覧

| メソッド | パス | 説明 |
|----------|------|------|
| `POST` | `/scan/ranking` | 画像を送信して商品識別・ランキング情報を取得 |
| `GET` | `/products/:id` | 商品詳細情報を取得 |

---

## 詳細仕様

### POST `/scan/ranking`

カメラで撮影した静止画を送信し、検出された商品のオーラ情報・ランキング情報を返す。
まず静止画をAI画像認識API（ローカル: Gemini 2.5 Flash / 本番: AWS Bedrock）に送信し、商品名とオーラを表示すべき領域の座標を受け取る。その後、バックエンド処理のとして商品名をもとにDBからランキング情報を取得し、最終的に以下の形式でレスポンスを返す。

**リクエスト**

```
Content-Type: multipart/form-data
```

| フィールド | 型 | 必須 | 説明 |
|------------|-----|------|------|
| `image` | file | ✅ | 撮影した静止画（JPEG / PNG / WebP） |

**AIへのプロンプト（バックエンド内部）**

ローカルは Gemini 2.5 Flash、本番は AWS Bedrock（Claude Sonnet）を使用。インターフェースは環境変数で切り替える。

**プロンプト（Gemini 2.5 Flash / ローカル用）**

Gemini はプロンプト内に JSON 形式の指示を含める方式。

```
以下の画像を解析し、写っているコンビニ商品を識別してください。
識別可能な商品のみ返してください。

対象商品リスト（この中から識別してください）:
- <DBから取得した商品名のリスト>

以下のJSONスキーマで返してください:
{
  "items": [
    {
      "product_name": "<対象商品リスト内の商品名のいずれか>",
      "bounding_box": {
        "x_min": <0.0-1.0>,
        "y_min": <0.0-1.0>,
        "x_max": <0.0-1.0>,
        "y_max": <0.0-1.0>
      }
    }
  ]
}

バウンディングボックスは画像全体を1×1とした相対座標で表現してください。
商品が検出できない場合は items を空配列で返してください。
対象商品リストにない商品名は絶対に返さないでください。
```

**構造化出力（JSON Schema）— Bedrock / 本番用**

Bedrock は API パラメータとして JSON Schema を渡すことで出力形式をモデルに強制する。プロンプトへの JSON 指示は不要。

- `converse` API の `additionalModelRequestFields` にスキーマを渡す
- `product_name` の `enum` に DB の商品名リストを設定することで、存在しない商品名の返却を根本から防ぐ

```json
{
  "type": "object",
  "properties": {
    "items": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "product_name": {
            "type": "string",
            "enum": ["<DBから取得した商品名1>", "<商品名2>", "..."]
          },
          "bounding_box": {
            "type": "object",
            "properties": {
              "x_min": { "type": "number", "minimum": 0, "maximum": 1 },
              "y_min": { "type": "number", "minimum": 0, "maximum": 1 },
              "x_max": { "type": "number", "minimum": 0, "maximum": 1 },
              "y_max": { "type": "number", "minimum": 0, "maximum": 1 }
            },
            "required": ["x_min", "y_min", "x_max", "y_max"]
          }
        },
        "required": ["product_name", "bounding_box"]
      }
    }
  },
  "required": ["items"]
}
```

> **参考**: Bedrock の構造化出力は `converse` API の `toolUse` または `additionalModelRequestFields` で JSON Schema を渡す方式。
> - [Amazon Bedrock 構造化出力](https://docs.aws.amazon.com/bedrock/latest/userguide/structured-output.html)
> - [classmethod 解説記事](https://dev.classmethod.jp/articles/amazon-bedrock-structured-outputs-json/)
>
> **GenKit を使う方法もある**: Google の GenKit（OSS）経由で Bedrock を呼ぶと、構造化出力・スキーマ定義・ローカル/本番の切り替えをフレームワーク側で吸収できる。実装コストと要相談。
> - [GenKit × Bedrock 参考記事](https://techblog.jmdc.co.jp/entry/20251221)

**レスポンス 200 OK**

```json
{
  "detected_items": [
    {
      "product_id": "11111111-1111-1111-1111-111111111111",
      "name": "味付海苔　炭火焼紅しゃけ",
      "description": "炭火で香ばしく焼き上げた紅しゃけを中具にした手巻おにぎり。パリッとした海苔を巻いて食べる。",
      "category": "food",
      "rank": 1,
      "total_quantity": 12500,
      "aura_level": 5,
      "bounding_box": {
        "x_min": 0.1,
        "y_min": 0.2,
        "x_max": 0.4,
        "y_max": 0.7
      }
    },
    {
      "product_id": "33333333-3333-3333-3333-333333333333",
      "name": "ブラックコーヒー 500ml",
      "description": "ブラックコーヒー本来の飲みごたえと香り豊かで飲みやすい味わいを両立した無糖ブラックコーヒー。",
      "category": "drink",
      "rank": 3,
      "total_quantity": 9800,
      "aura_level": 3,
      "bounding_box": {
        "x_min": 0.5,
        "y_min": 0.1,
        "x_max": 0.8,
        "y_max": 0.6
      }
    }
  ]
}
```

| フィールド | 型 | 説明 |
|------------|-----|------|
| `detected_items` | array | 検出された商品の配列。未検出時は空配列 |
| `product_id` | string (UUID) | 商品ID |
| `name` | string | 商品名 |
| `description` | string | 商品説明 |
| `category` | string | カテゴリ（`food` / `drink` / `snack`） |
| `rank` | integer | 売上ランキング（1〜5） |
| `total_quantity` | integer | 累計売上個数 |
| `aura_level` | integer | オーラ強度（1〜5。rank 1 → aura_level 5） |
| `bounding_box` | object | 商品の位置座標（画像全体を1×1とした相対座標） |

**aura_level の計算式**

```
aura_level = 6 - rank
```

| rank | aura_level |
|------|------------|
| 1 | 5 |
| 2 | 4 |
| 3 | 3 |
| 4 | 2 |
| 5 | 1 |

**エラーレスポンス**

| ステータス | エラーコード | 発生条件 |
|-----------|------------|---------|
| `400` | `invalid_image` | 画像が送信されていない、またはサポート外の形式 |
| `500` | `ai_error` | AI API（Gemini / Bedrock）の呼び出し失敗 |
| `500` | `internal_error` | その他のサーバーエラー |

---

### GET `/products/:id`

商品の詳細情報とランキングを返す。

**パスパラメータ**

| パラメータ | 型 | 必須 | 説明 |
|------------|-----|------|------|
| `id` | string (UUID) | ✅ | 商品ID |

**レスポンス 200 OK**

```json
{
  "product_id": "11111111-1111-1111-1111-111111111111",
  "name": "味付海苔　炭火焼紅しゃけ",
  "description": "炭火で香ばしく焼き上げた紅しゃけを中具にした手巻おにぎり。パリッとした海苔を巻いて食べる。",
  "category": "food",
  "rank": 1,
  "total_quantity": 12500,
  "aura_level": 5
}
```

**エラーレスポンス**

| ステータス | エラーコード | 発生条件 |
|-----------|------------|---------|
| `404` | `product_not_found` | 指定IDの商品が存在しない |
| `500` | `internal_error` | その他のサーバーエラー |

---

## 統一エラーレスポンス

```json
{
  "error": {
    "code": "invalid_image",
    "message": "画像ファイルが送信されていません"
  }
}
```

| フィールド | 型 | 説明 |
|------------|-----|------|
| `code` | string | エラーコード（英字スネークケース） |
| `message` | string | エラーメッセージ（日本語） |

---

## 将来拡張エンドポイント（発展機能用・実装はMVP後）

| メソッド | パス | 説明 |
|----------|------|------|
| `POST` | `/scan/trending` | 急上昇モード（直近1週 vs 前週の増加率ベースのオーラ表示） |
| `POST` | `/scan/hidden-gems` | 掘り出し物モード（売上下位商品ベースのオーラ表示） |
