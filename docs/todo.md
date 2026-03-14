# Kaleid Scan TODO

> 工数の目安: S = 半日 / M = 1日 / L = 2日

## Issue一覧

| #   | タイトル                                                                      | 区分     | 優先度 | 工数 | フェーズ |
| --- | ----------------------------------------------------------------------------- | -------- | ------ | ---- | -------- |
| [Issue 2](https://github.com/progate-hackathon-an/Kaleid-Scan/issues/2)   | [バックエンドスタブ実装](#2-バックエンドスタブ実装)                             | Backend  | 高     | S    | Phase 1  |
| [Issue 3](https://github.com/progate-hackathon-an/Kaleid-Scan/issues/3)   | [DBマイグレーション・モデル実装](#3-dbマイグレーションモデル実装)             | Backend  | 高     | S    | Phase 1  |
| [Issue 4](https://github.com/progate-hackathon-an/Kaleid-Scan/issues/4)   | [DB接続・シードデータ実装](#4-db接続シードデータ実装)                         | Backend  | 高     | M    | Phase 1  |
| [Issue 5](https://github.com/progate-hackathon-an/Kaleid-Scan/issues/5)   | [スキャンエンドポイント実装](#5-スキャンエンドポイント実装)                   | Backend  | 高     | L    | Phase 1  |
| [Issue 6](https://github.com/progate-hackathon-an/Kaleid-Scan/issues/6)   | [商品詳細エンドポイント実装](#6-商品詳細エンドポイント実装)                   | Backend  | 高     | S    | Phase 1  |
| [Issue 7](https://github.com/progate-hackathon-an/Kaleid-Scan/issues/7)   | [型定義・APIクライアント実装](#7-型定義apiクライアント実装)                   | Frontend | 高     | S    | Phase 1  |
| [Issue 8](https://github.com/progate-hackathon-an/Kaleid-Scan/issues/8)   | [カメラスキャン画面実装](#8-カメラスキャン画面実装)                           | Frontend | 高     | M    | Phase 1  |
| [Issue 9](https://github.com/progate-hackathon-an/Kaleid-Scan/issues/9)   | [オーラ表示実装](#9-オーラ表示実装)                                           | Frontend | 高     | M    | Phase 1  |
| [Issue 10](https://github.com/progate-hackathon-an/Kaleid-Scan/issues/10) | [商品詳細ボトムシート実装](#10-商品詳細ボトムシート実装)                       | Frontend | 高     | M    | Phase 1  |
| [Issue 11](https://github.com/progate-hackathon-an/Kaleid-Scan/issues/11) | [エラーモーダル・ローディング演出実装](#11-エラーモーダルローディング演出実装) | Frontend | 中     | S    | Phase 1  |
| [Issue 12](https://github.com/progate-hackathon-an/Kaleid-Scan/issues/12) | [PWA対応実装](#12-pwa対応実装)                                                | Frontend | 中     | S    | Phase 1  |
| [Issue 13](https://github.com/progate-hackathon-an/Kaleid-Scan/issues/13) | [急上昇モードエンドポイント実装](#13-急上昇モードエンドポイント実装)          | Backend  | 中     | M    | Phase 2  |
| [Issue 14](https://github.com/progate-hackathon-an/Kaleid-Scan/issues/14) | [急上昇モードUI実装](#14-急上昇モードui実装)                                  | Frontend | 中     | M    | Phase 2  |
| [Issue 15](https://github.com/progate-hackathon-an/Kaleid-Scan/issues/15) | [掘り出し物モードエンドポイント実装](#15-掘り出し物モードエンドポイント実装)  | Backend  | 低     | M    | Phase 2  |
| [Issue 16](https://github.com/progate-hackathon-an/Kaleid-Scan/issues/16) | [掘り出し物モードUI実装](#16-掘り出し物モードui実装)                          | Frontend | 低     | M    | Phase 2  |
| [Issue 17](https://github.com/progate-hackathon-an/Kaleid-Scan/issues/17) | [X共有機能実装](#17-x共有機能実装)                                            | Frontend | 低     | M    | Phase 3  |

---

## Phase 1: MVP（〜 2026/3/19）

### Issue 2. バックエンドスタブ実装

**区分**: Backend | **優先度**: 高 | **工数**: S
**GitHub ラベル**: `Phase 1`, `backend`

フロントエンド開発をバックエンド実装と並行して進められるよう、固定レスポンスを返すスタブAPIを先に実装する。Issue #7〜#12のフロント実装はこのスタブを前提に進め、Issue #5・#6完成後にスタブを本実装へ差し替える。

**🟢 GREEN**

- [ ] `backend/handlers/scan_handler.go` に `ScanRanking` スタブ実装（`docs/api-requirement.md` の形式に従い、固定の5商品・`aura_level` 1〜5 を返す）
- [ ] `backend/handlers/product_handler.go` に `GetProduct` スタブ実装（固定の商品詳細を返す）
- [ ] `backend/routes/routes.go` に `POST /scan/ranking`・`GET /products/:id` ルート追加
- [ ] `backend/main.go` でサーバーが起動できる最低限の構成を整える（DB接続不要）

---

### Issue 3. DBマイグレーション・モデル実装

**区分**: Backend | **優先度**: 高 | **工数**: S
**GitHub ラベル**: `Phase 1`, `backend`

`products` / `weekly_sales` テーブルのマイグレーションSQLとGoモデルを実装する。

**🔴 RED**

- [ ] `backend/models/product_test.go` に `TestProduct_Fields` テスト作成（`ID`, `Name`, `Description`, `Category`, `CreatedAt` フィールドの存在確認）
- [ ] `backend/models/weekly_sales_test.go` に `TestWeeklySales_Fields` テスト作成（`ID`, `ProductID`, `WeekStart`, `Quantity`, `CreatedAt` フィールドの存在確認）

**🟢 GREEN**

- [ ] `db/migrations/0001_create_products.sql` 作成（`products` テーブルDDL。`id UUID PK`, `name VARCHAR(100) NOT NULL UNIQUE`, `description TEXT`, `category VARCHAR(50) NOT NULL`, `created_at TIMESTAMPTZ`）
- [ ] `db/migrations/0001_create_products_down.sql` 作成（`DROP TABLE IF EXISTS products`）
- [ ] `db/migrations/0002_create_weekly_sales.sql` 作成（`weekly_sales` テーブルDDL。`UNIQUE(product_id, week_start)` 制約・インデックス含む）
- [ ] `db/migrations/0002_create_weekly_sales_down.sql` 作成（`DROP TABLE IF EXISTS weekly_sales`）
- [ ] `backend/models/product.go` に `Product` struct 定義（フィールド: `ID uuid.UUID`, `Name string`, `Description string`, `Category string`, `CreatedAt time.Time`）
- [ ] `backend/models/weekly_sales.go` に `WeeklySales` struct 定義（フィールド: `ID uuid.UUID`, `ProductID uuid.UUID`, `WeekStart time.Time`, `Quantity int`, `CreatedAt time.Time`）

**🔵 REFACTOR**

- [ ] DBタグ（`db:"..."`）・JSONタグの整合性確認

---

### Issue 4. DB接続・シードデータ実装

**区分**: Backend | **優先度**: 高 | **工数**: M
**GitHub ラベル**: `Phase 1`, `backend`

`database/db.go` で接続を確立し、`database/seed.go` で5商品・6週分の売上データを冪等投入できるようにする。`main.go` に `--seed` フラグを追加する。

**🔴 RED**

- [ ] `backend/database/db_test.go` に `TestNewDB_Connect` テスト作成（DSNが正しく構築されること・`sql.Open` が成功すること）
- [ ] `backend/database/seed_test.go` に `TestSeed_Insert_Idempotent` テスト作成（2回呼んでもエラーにならないこと。`ON CONFLICT DO NOTHING` の動作確認）

**🟢 GREEN**

- [ ] `backend/database/db.go` に `NewDB(cfg *config.Config) (*sql.DB, error)` 実装（DSN: `host=%s port=%s user=%s password=%s dbname=%s sslmode=disable`）
- [ ] `backend/database/migrate.go` に `RunMigrations(db *sql.DB, migrationsDir string) error` 実装（`db/migrations/*.sql` をファイル名順に実行）
- [ ] `backend/database/seed.go` に `Seed(db *sql.DB) error` 実装（`INSERT INTO products ... ON CONFLICT (name) DO NOTHING`・`INSERT INTO weekly_sales ... ON CONFLICT (product_id, week_start) DO NOTHING`。シードデータは `docs/db-requirement.md` の値を使用）
- [ ] `backend/config/config.go` に `DBHost`, `DBPort`, `DBUser`, `DBPassword`, `DBName` フィールド追加
- [ ] `backend/main.go` に `--seed` フラグ追加（`flag.Bool("seed", false, "Run seed data")` で受け取り `database.Seed(db)` を呼ぶ）

**🔵 REFACTOR**

- [ ] `config.Config` の環境変数マッピングを整理（`DB_*` プレフィックス統一）

---

### Issue 5. スキャンエンドポイント実装

**区分**: Backend | **優先度**: 高 | **工数**: L
**GitHub ラベル**: `Phase 1`, `backend`

`POST /scan/ranking` を実装する。バックエンドがGemini（ローカル） / Bedrock（本番）へ画像を送信し、商品名とバウンディングボックスを受け取った後、DBからランキングを取得して返す。AIサービスは環境変数 `AI_PROVIDER=gemini|bedrock` で切り替える。

**🔴 RED**

- [ ] `backend/services/ai_service_test.go` に `TestGeminiService_Recognize_Success` テスト作成（モックHTTPサーバーでGemini APIレスポンスを再現し、`[]AIItem` が正しくパースされること）
- [ ] `backend/services/ai_service_test.go` に `TestGeminiService_Recognize_EmptyItems` テスト作成（`items: []` のレスポンスで空スライスが返ること）
- [ ] `backend/services/scan_service_test.go` に `TestScanService_GetRanking_AuraLevel` テスト作成（rank=1→aura_level=5, rank=5→aura_level=1 になること）
- [ ] `backend/handlers/scan_handler_test.go` に `TestScanRanking_Success` テスト作成（期待: HTTP 200, `detected_items` が配列で返ること）
- [ ] `backend/handlers/scan_handler_test.go` に `TestScanRanking_NoImage` テスト作成（期待: HTTP 400, `{"error":{"code":"invalid_image",...}}`）
- [ ] `backend/handlers/scan_handler_test.go` に `TestScanRanking_AIError` テスト作成（期待: HTTP 500, `{"error":{"code":"ai_error",...}}`）

**🟢 GREEN**

- [ ] `backend/services/ai_service.go` に `AIService` interface 定義（`Recognize(ctx context.Context, imageData []byte, productNames []string) ([]AIItem, error)`）
- [ ] `backend/services/ai_service.go` に `AIItem` struct 定義（`ProductName string`, `BoundingBox BoundingBox`）
- [ ] `backend/services/ai_service.go` に `BoundingBox` struct 定義（`XMin, YMin, XMax, YMax float64`）
- [ ] `backend/services/gemini_service.go` に `GeminiService` struct 実装（Gemini 2.0 Flash Vision API呼び出し。プロンプトは `docs/api-requirement.md` の形式に従う）
- [ ] `backend/services/scan_service.go` に `ScanService` struct 定義（`ai AIService`, `db *sql.DB`）
- [ ] `backend/services/scan_service.go` に `GetRanking(ctx context.Context, imageData []byte) ([]ScanResult, error)` 実装（AI呼び出し → DB検索 → `aura_level = 6 - rank` 計算）
- [ ] `backend/services/scan_service.go` に `ScanResult` struct 定義（`api-requirement.md` の `detected_items` 要素に対応）
- [ ] `backend/handlers/scan_handler.go` に `ScanHandler` struct 定義（`svc *services.ScanService`）
- [ ] `backend/handlers/scan_handler.go` に `ScanRanking(c *gin.Context)` 実装（`c.FormFile("image")` でファイル取得 → `svc.GetRanking` 呼び出し → JSONレスポンス）
- [ ] `backend/routes/routes.go` に `POST /scan/ranking` ルート追加

**🔵 REFACTOR**

- [ ] エラーレスポンス生成を `handlers/response.go` の `ErrorResponse(c, status, code, message string)` ヘルパーに切り出し
- [ ] `AIService` の実装選択ロジック（`NewAIService(cfg) AIService`）を `services/ai_service.go` に集約

---

### Issue 6. 商品詳細エンドポイント実装

**区分**: Backend | **優先度**: 高 | **工数**: S
**GitHub ラベル**: `Phase 1`, `backend`

`GET /products/:id` を実装する。指定UUIDの商品情報とランキングをDBから取得して返す。

**🔴 RED**

- [ ] `backend/handlers/product_handler_test.go` に `TestGetProduct_Success` テスト作成（期待: HTTP 200, `product_id`・`name`・`rank`・`aura_level` が含まれること）
- [ ] `backend/handlers/product_handler_test.go` に `TestGetProduct_NotFound` テスト作成（期待: HTTP 404, `{"error":{"code":"product_not_found",...}}`）
- [ ] `backend/handlers/product_handler_test.go` に `TestGetProduct_InvalidUUID` テスト作成（期待: HTTP 400）

**🟢 GREEN**

- [ ] `backend/services/product_service.go` に `ProductService` struct 定義
- [ ] `backend/services/product_service.go` に `GetProductByID(ctx context.Context, id uuid.UUID) (*ProductDetail, error)` 実装（`docs/db-requirement.md` の「商品1件のランキングを取得」クエリを使用）
- [ ] `backend/services/product_service.go` に `ProductDetail` struct 定義（`api-requirement.md` の GET レスポンスに対応）
- [ ] `backend/handlers/product_handler.go` に `ProductHandler` struct 定義（`svc *services.ProductService`）
- [ ] `backend/handlers/product_handler.go` に `GetProduct(c *gin.Context)` 実装
- [ ] `backend/routes/routes.go` に `GET /products/:id` ルート追加

**🔵 REFACTOR**

- [ ] `ErrorResponse` ヘルパーをIssue #5で作成したものに統一

---

### Issue 7. 型定義・APIクライアント実装

**区分**: Frontend | **優先度**: 高 | **工数**: S
**GitHub ラベル**: `Phase 1`, `frontend`

フロントエンドの型定義とバックエンドAPIを呼び出す `scanApi.ts` を実装する。

**🔴 RED**

- [ ] `frontend/src/api/scanApi.test.ts` に `TestPostScanRanking_Success` テスト作成（`fetch` をモックし、`ScanResponse` 型のオブジェクトが返ること）
- [ ] `frontend/src/api/scanApi.test.ts` に `TestPostScanRanking_NetworkError` テスト作成（fetch失敗時にエラーがthrowされること）

**🟢 GREEN**

- [ ] `frontend/src/types/scan.ts` に `BoundingBox`, `DetectedItem`, `ScanResponse`, `ApiError` 型定義
- [ ] `frontend/src/api/scanApi.ts` に `postScanRanking(imageFile: File): Promise<ScanResponse>` 実装（`multipart/form-data` でPOST）
- [ ] `frontend/src/api/scanApi.ts` に `getProduct(id: string): Promise<DetectedItem>` 実装

**🔵 REFACTOR**

- [ ] ベースURL取得を `import.meta.env.VITE_API_BASE_URL` に統一

---

### Issue 8. カメラスキャン画面実装

**区分**: Frontend | **優先度**: 高 | **工数**: M
**GitHub ラベル**: `Phase 1`, `frontend`

ブラウザのカメラアクセスAPI（`getUserMedia`）を使って、スマートフォン背面カメラ（スマホを持ったとき外側にある、写真撮影に使う方のカメラ）にアクセスし、シャッターボタンで静止画を取得するカメラ画面を実装する。

**🔴 RED**

- [ ] `frontend/src/hooks/useCamera.test.ts` に `TestUseCamera_StartCamera` テスト作成（`navigator.mediaDevices.getUserMedia` がモックで呼ばれること）
- [ ] `frontend/src/hooks/useCamera.test.ts` に `TestUseCamera_CapturePhoto` テスト作成（`capturePhoto()` 呼び出しで `File` オブジェクトが返ること）
- [ ] `frontend/src/components/CameraView.test.tsx` に `TestCameraView_RenderShutterButton` テスト作成（シャッターボタンが描画されること）

**🟢 GREEN**

- [ ] `frontend/src/hooks/useCamera.ts` に `useCamera(): { videoRef: RefObject<HTMLVideoElement>, isReady: boolean, startCamera: () => Promise<void>, capturePhoto: () => File | null }` 実装（`facingMode: "environment"` でバックカメラ指定）
- [ ] `frontend/src/components/CameraView.tsx` に `CameraView` コンポーネント実装（`<video>` + シャッターボタン）

**🔵 REFACTOR**

- [ ] カメラ停止処理（`srcObject.getTracks().forEach(t => t.stop())`）をunmount時に確実に呼ぶよう整理

---

### Issue 9. オーラ表示実装

**区分**: Frontend | **優先度**: 高 | **工数**: M
**GitHub ラベル**: `Phase 1`, `frontend`

Canvas APIとはブラウザ上で図形・グラデーション・アニメーションを自由に描画できるHTML標準の描画機能。`<canvas>` 要素を用意してJavaScriptで描画命令を呼ぶことで、ピクセル単位の表現が可能になる。これを使って各商品の座標に5段階のオーラ（円形ハローグロー）を描画する。オーラをタップすると商品詳細ボトムシートが開く。

**🔴 RED**

- [ ] `frontend/src/utils/auraRenderer.test.ts` に `TestGetAuraConfig_Level5` テスト作成（`aura_level=5` で金色・最大サイズの設定が返ること）
- [ ] `frontend/src/utils/auraRenderer.test.ts` に `TestGetAuraConfig_Level1` テスト作成（`aura_level=1` でグレー・最小サイズの設定が返ること）
- [ ] `frontend/src/components/AuraCanvas.test.tsx` に `TestAuraCanvas_Render` テスト作成（`<canvas>` 要素が描画されること）

**🟢 GREEN**

- [ ] `frontend/src/utils/auraRenderer.ts` に `AuraConfig` 型定義（`color: string`, `radius: number`, `opacity: number`）
- [ ] `frontend/src/utils/auraRenderer.ts` に `AURA_LEVEL_CONFIG: Record<number, AuraConfig>` 定数定義（5段階分: Lv5=金, Lv4=青, Lv3=緑, Lv2=紫, Lv1=グレー）
- [ ] `frontend/src/utils/auraRenderer.ts` に `renderAura(ctx: CanvasRenderingContext2D, item: DetectedItem, canvasWidth: number, canvasHeight: number): void` 実装（`createRadialGradient` で円形ハローグロー描画）
- [ ] `frontend/src/components/AuraCanvas.tsx` に `AuraCanvas` コンポーネント実装（`items: DetectedItem[]` を受け取り全商品にオーラ描画。各オーラにクリックイベントを設定して `onItemSelect(item)` を呼ぶ）
- [ ] `frontend/src/hooks/useScan.ts` に `useScan(): { scan: (file: File) => Promise<void>, result: ScanResponse | null, isLoading: boolean, error: string | null }` 実装（`postScanRanking` をラップ）

**🔵 REFACTOR**

- [ ] オーラの描画パラメータ（サイズ比率・グロー半径）を `AURA_LEVEL_CONFIG` に集約

---

### Issue 10. 商品詳細ボトムシート実装

**区分**: Frontend | **優先度**: 高 | **工数**: M
**GitHub ラベル**: `Phase 1`, `frontend`

オーラをタップするとスキャン画面下から競り上がるボトムシートで商品詳細を表示する。上部ドラッグハンドルを下スワイプで閉じる。

**🔴 RED**

- [ ] `frontend/src/components/ProductBottomSheet.test.tsx` に `TestProductBottomSheet_ShowOnOpen` テスト作成（`isOpen=true` で商品名・ランクバッジが表示されること）
- [ ] `frontend/src/components/ProductBottomSheet.test.tsx` に `TestProductBottomSheet_HideOnClose` テスト作成（`isOpen=false` で非表示になること）

**🟢 GREEN**

- [ ] `frontend/src/components/ProductBottomSheet.tsx` に `ProductBottomSheet` コンポーネント実装（props: `isOpen: boolean`, `item: DetectedItem | null`, `onClose: () => void`）
  - 商品画像（バウンディングボックスでトリミングした写真）
  - ランクバッジ（例: 🏅 1位）
  - 商品名・商品説明
  - ドラッグハンドル（下スワイプで `onClose` 呼び出し）

**🔵 REFACTOR**

- [ ] スワイプ検出ロジックをカスタムフック `useSwipeDown(onSwipe)` に切り出し

---

### Issue 11. エラーモーダル・ローディング演出実装

**区分**: Frontend | **優先度**: 中 | **工数**: S
**GitHub ラベル**: `Phase 1`, `frontend`

AI解析中のローディング演出と、商品未検出時のエラーモーダルを実装する。

**🔴 RED**

- [ ] `frontend/src/components/ErrorModal.test.tsx` に `TestErrorModal_ShowMessage` テスト作成（`isOpen=true` で「商品が検出できませんでした」が表示されること）
- [ ] `frontend/src/components/LoadingOverlay.test.tsx` に `TestLoadingOverlay_ShowWhileLoading` テスト作成（`isLoading=true` でローディング要素が表示されること）

**🟢 GREEN**

- [ ] `frontend/src/components/ErrorModal.tsx` に `ErrorModal` コンポーネント実装（props: `isOpen: boolean`, `message: string`, `onClose: () => void`）
- [ ] `frontend/src/components/LoadingOverlay.tsx` に `LoadingOverlay` コンポーネント実装（props: `isLoading: boolean`。AI解析中のアニメーション表示）

**🔵 REFACTOR**

- [ ] `ErrorModal` と `LoadingOverlay` のオーバーレイ共通スタイルを抽出

---

### Issue 12. PWA対応実装

**区分**: Frontend | **優先度**: 中 | **工数**: S
**GitHub ラベル**: `Phase 1`, `frontend`

PWA（Progressive Web App）とは、通常のWebページをネイティブアプリのように使えるようにする仕組み。ホーム画面への追加・オフライン動作・カメラアクセスなどが可能になる。本タスクでは Web App Manifest（アプリ名・アイコン・表示設定を記述したJSONファイル）を設定し、iOS Safari / Android Chrome でホーム画面追加とカメラアクセスができるようにする。

**🔴 RED**

- [ ] `frontend/public/manifest.json` のバリデーションテスト（`name`, `short_name`, `start_url`, `display: "standalone"`, `icons` フィールドが存在すること）

**🟢 GREEN**

- [ ] `frontend/public/manifest.json` 作成（`name: "Kaleid Scan"`, `short_name: "KaleidScan"`, `display: "standalone"`, `start_url: "/"`, `theme_color`, `background_color`, `icons` を含む）
- [ ] `frontend/index.html` に `<link rel="manifest">` タグ追加
- [ ] `frontend/index.html` に iOS向け `<meta name="apple-mobile-web-app-capable">` タグ追加
- [ ] `frontend/vite.config.ts` に `vite-plugin-pwa` 設定追加（Service Worker: キャッシュ対象は静的アセットのみ）

**🔵 REFACTOR**

- [ ] PWAアイコン（192x192, 512x512）の生成・配置

---

## Phase 2: 発展機能（MVP完成後）

### Issue 13. 急上昇モードエンドポイント実装

**区分**: Backend | **優先度**: 中 | **工数**: M
**GitHub ラベル**: `Phase 2`, `backend`

`POST /scan/trending` を実装する。直近1週と前週の売上増加率をベースにオーラを表示する。増加率の計算式・クエリの詳細は `docs/db-requirement.md` の「急上昇ランキング」を参照。

**🔴 RED**

- [ ] `backend/services/trending_service_test.go` に `TestTrendingService_GetRanking_GrowthRate` テスト作成（直近週が前週より増加している商品が上位になること）
- [ ] `backend/services/trending_service_test.go` に `TestTrendingService_GetRanking_NoPrevWeek` テスト作成（前週データなし時に `prev_quantity=0` で扱われること）
- [ ] `backend/handlers/scan_handler_test.go` に `TestScanTrending_Success` テスト作成（期待: HTTP 200, `detected_items` に `growth_rate` フィールドが含まれること）

**🟢 GREEN**

- [ ] `backend/services/trending_service.go` に `TrendingService` struct 定義（`ai AIService`, `db *sql.DB`）
- [ ] `backend/services/trending_service.go` に `TrendingResult` struct 定義（`ScanResult` に加え `GrowthRate float64` フィールドを追加）
- [ ] `backend/services/trending_service.go` に `GetTrendingRanking(ctx context.Context, imageData []byte) ([]TrendingResult, error)` 実装（AI呼び出し → 急上昇ランキングクエリ実行 → 検出商品に growth_rate を付与）
- [ ] `backend/handlers/scan_handler.go` に `ScanTrending(c *gin.Context)` 実装
- [ ] `backend/routes/routes.go` に `POST /scan/trending` ルート追加

**🔵 REFACTOR**

- [ ] `ScanService` と `TrendingService` の共通AI呼び出しロジックを `services/base_scan_service.go` に切り出し

---

### Issue 14. 急上昇モードUI実装

**区分**: Frontend | **優先度**: 中 | **工数**: M
**GitHub ラベル**: `Phase 2`, `frontend`

スキャン画面にモード切り替えUIを追加し、急上昇モード時は増加率に応じたオーラ演出（上昇アニメーション等）を表示する。

> **UIイメージ**: iOSカメラアプリの撮影モード変更（画面下部に「シネマティック / ビデオ / 写真 / ポートレート」が横並びになっており、スワイプで選択できるUI）のような横スクロール選択バーが理想。スワイプまたはタップでモードを切り替える。

**🔴 RED**

- [ ] `frontend/src/hooks/useTrending.test.ts` に `TestUseTrending_Scan_Success` テスト作成（`postScanTrending` が呼ばれ `TrendingResponse` が返ること）
- [ ] `frontend/src/components/ModeToggle.test.tsx` に `TestModeToggle_SwitchMode` テスト作成（ボタン押下で `onModeChange` が呼ばれること）

**🟢 GREEN**

- [ ] `frontend/src/types/scan.ts` に `TrendingItem`（`DetectedItem` + `growthRate: number`）・`TrendingResponse` 型追加
- [ ] `frontend/src/api/scanApi.ts` に `postScanTrending(imageFile: File): Promise<TrendingResponse>` 実装
- [ ] `frontend/src/hooks/useTrending.ts` に `useTrending(): { scan, result, isLoading, error }` 実装
- [ ] `frontend/src/components/ModeToggle.tsx` に `ModeToggle` コンポーネント実装（props: `mode: "ranking" | "trending"`, `onModeChange: (mode) => void`）
- [ ] `frontend/src/utils/auraRenderer.ts` に急上昇オーラ演出用の設定・描画関数追加（増加率が高いほど輝度・サイズを強調）

**🔵 REFACTOR**

- [ ] `useRanking` と `useTrending` の共通ロジックをカスタムフック `useScanBase` に切り出し

---

### Issue 15. 掘り出し物モードエンドポイント実装

**区分**: Backend | **優先度**: 低 | **工数**: M
**GitHub ラベル**: `Phase 2`, `backend`

`POST /scan/hidden-gems` を実装する。売上下位商品をベースに「あえて選ぶ価値」をオーラで表現する。ランキングの逆順（売上が低い商品ほどオーラが強い）で表示する。

**🔴 RED**

- [ ] `backend/services/hidden_gems_service_test.go` に `TestHiddenGemsService_GetRanking_ReverseOrder` テスト作成（売上最下位の商品の `aura_level` が最大になること）
- [ ] `backend/handlers/scan_handler_test.go` に `TestScanHiddenGems_Success` テスト作成（期待: HTTP 200, `detected_items` が配列で返ること）

**🟢 GREEN**

- [ ] `backend/services/hidden_gems_service.go` に `HiddenGemsService` struct 定義
- [ ] `backend/services/hidden_gems_service.go` に `GetHiddenGemsRanking(ctx context.Context, imageData []byte) ([]ScanResult, error)` 実装（全期間累計の逆順で `aura_level` を付与: `aura_level = rank`）
- [ ] `backend/handlers/scan_handler.go` に `ScanHiddenGems(c *gin.Context)` 実装
- [ ] `backend/routes/routes.go` に `POST /scan/hidden-gems` ルート追加

**🔵 REFACTOR**

- [ ] `aura_level` 計算ロジックを `services/aura.go` の `CalcAuraLevel(rank int, mode string) int` に集約

---

### Issue 16. 掘り出し物モードUI実装

**区分**: Frontend | **優先度**: 低 | **工数**: M
**GitHub ラベル**: `Phase 2`, `frontend`

ModeToggle に「掘り出し物」モードを追加し、掘り出し物モード時は独自のオーラカラー（宝石・レアリティ感）で描画する。

> **UIイメージ**: Issue #14 と同様に、iOSカメラアプリの撮影モード変更（画面下部の横スクロール選択バー）のようなUIに「掘り出し物」を追加する形が理想。最終的に「通常 / 急上昇 / 掘り出し物」の3モードを1つの選択バーで切り替えられるようにする。

**🔴 RED**

- [ ] `frontend/src/hooks/useHiddenGems.test.ts` に `TestUseHiddenGems_Scan_Success` テスト作成（`postScanHiddenGems` が呼ばれること）
- [ ] `frontend/src/utils/auraRenderer.test.ts` に `TestGetHiddenGemsAuraConfig_Level5` テスト作成（掘り出し物モードで固有カラーが返ること）

**🟢 GREEN**

- [ ] `frontend/src/api/scanApi.ts` に `postScanHiddenGems(imageFile: File): Promise<ScanResponse>` 実装
- [ ] `frontend/src/hooks/useHiddenGems.ts` に `useHiddenGems(): { scan, result, isLoading, error }` 実装
- [ ] `frontend/src/utils/auraRenderer.ts` に `HIDDEN_GEMS_AURA_CONFIG: Record<number, AuraConfig>` 定数定義（宝石・レア感のカラースキーム）
- [ ] `frontend/src/components/ModeToggle.tsx` に `"hidden-gems"` モード選択肢を追加

**🔵 REFACTOR**

- [ ] `useRanking` / `useTrending` / `useHiddenGems` を統合した `useScan(mode)` フックへリファクタリング

---

## Phase 3: SNS共有（Phase 2完成後）

### Issue 17. X共有機能実装

**区分**: Frontend | **優先度**: 低 | **工数**: M
**GitHub ラベル**: `Phase 3`, `frontend`

Canvas APIでオーラ合成画像を生成し、Web Share API（`navigator.share`）でXへ画像＋テキストを渡す。サーバーサイド不要でフロントエンドのみで完結する。

**🔴 RED**

- [ ] `frontend/src/utils/shareImage.test.ts` に `TestGenerateShareImage_ReturnsFile` テスト作成（Canvasにオーラ合成した結果が `File` オブジェクトで返ること）
- [ ] `frontend/src/hooks/useShare.test.ts` に `TestUseShare_CallsNavigatorShare` テスト作成（`navigator.share` がモックで呼ばれること・`files` と `text` が渡されること）
- [ ] `frontend/src/hooks/useShare.test.ts` に `TestUseShare_UnsupportedBrowser` テスト作成（`navigator.share` が未定義の場合にエラー状態になること）

**🟢 GREEN**

- [ ] `frontend/src/utils/shareImage.ts` に `generateShareImage(canvas: HTMLCanvasElement, items: DetectedItem[]): Promise<File>` 実装（Canvas APIでオーラ合成画像を生成し `image/png` の `File` を返す）
- [ ] `frontend/src/hooks/useShare.ts` に `useShare(): { share: (canvas, items, topItem) => Promise<void>, isSupported: boolean, error: string | null }` 実装（`navigator.share({ files: [imageFile], text: "KaleidScanで〇〇を発見しました！ #KaleidScan" })`）
- [ ] `frontend/src/components/ShareButton.tsx` に `ShareButton` コンポーネント実装（props: `canvas: HTMLCanvasElement | null`, `items: DetectedItem[]`。`isSupported=false` 時は非表示）
- [ ] `frontend/src/components/ProductBottomSheet.tsx` に `ShareButton` を追加（Issue #10で作成したボトムシートの下部に配置）

**🔵 REFACTOR**

- [ ] 投稿文言をテキスト定数として `constants/share.ts` に切り出し
