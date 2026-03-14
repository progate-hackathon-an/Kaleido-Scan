package handlers

// boundingBox は画像全体を1×1とした相対座標（0.0〜1.0）を表す。
type boundingBox struct {
	XMin float64 `json:"x_min"`
	YMin float64 `json:"y_min"`
	XMax float64 `json:"x_max"`
	YMax float64 `json:"y_max"`
}

// detectedItem は /scan/ranking レスポンスの1商品エントリを表す。
type detectedItem struct {
	ProductID     string      `json:"product_id"`
	Name          string      `json:"name"`
	Description   string      `json:"description"`
	Category      string      `json:"category"`
	Rank          int         `json:"rank"`
	TotalQuantity int         `json:"total_quantity"`
	AuraLevel     int         `json:"aura_level"`
	BoundingBox   boundingBox `json:"bounding_box"`
}

// productDetail は /products/:id レスポンスを表す（bounding_box を含まない）。
type productDetail struct {
	ProductID     string `json:"product_id"`
	Name          string `json:"name"`
	Description   string `json:"description"`
	Category      string `json:"category"`
	Rank          int    `json:"rank"`
	TotalQuantity int    `json:"total_quantity"`
	AuraLevel     int    `json:"aura_level"`
}

// stubProducts はスタブ実装で使用する固定商品データ。
// aura_level = 6 - rank の関係を満たす。
var stubProducts = []detectedItem{
	{
		ProductID:     "11111111-1111-1111-1111-111111111111",
		Name:          "炭火焼紅しゃけおにぎり",
		Description:   "炭火で香ばしく焼き上げた紅しゃけを中具にした手巻おにぎり。",
		Category:      "food",
		Rank:          1,
		TotalQuantity: 12500,
		AuraLevel:     5,
		BoundingBox:   boundingBox{XMin: 0.05, YMin: 0.10, XMax: 0.35, YMax: 0.65},
	},
	{
		ProductID:     "22222222-2222-2222-2222-222222222222",
		Name:          "ツナマヨおにぎり",
		Description:   "まろやかなマヨネーズで和えたツナを中具にした定番おにぎり。",
		Category:      "food",
		Rank:          2,
		TotalQuantity: 10800,
		AuraLevel:     4,
		BoundingBox:   boundingBox{XMin: 0.40, YMin: 0.05, XMax: 0.65, YMax: 0.60},
	},
	{
		ProductID:     "33333333-3333-3333-3333-333333333333",
		Name:          "ブラックコーヒー 500ml",
		Description:   "ブラックコーヒー本来の飲みごたえと香り豊かで飲みやすい無糖コーヒー。",
		Category:      "drink",
		Rank:          3,
		TotalQuantity: 9800,
		AuraLevel:     3,
		BoundingBox:   boundingBox{XMin: 0.10, YMin: 0.50, XMax: 0.35, YMax: 0.95},
	},
	{
		ProductID:     "44444444-4444-4444-4444-444444444444",
		Name:          "ポテトチップス うすしお味",
		Description:   "厳選じゃがいもを使用したサクサク食感のうすしお味ポテトチップス。",
		Category:      "snack",
		Rank:          4,
		TotalQuantity: 8200,
		AuraLevel:     2,
		BoundingBox:   boundingBox{XMin: 0.55, YMin: 0.45, XMax: 0.85, YMax: 0.90},
	},
	{
		ProductID:     "55555555-5555-5555-5555-555555555555",
		Name:          "緑茶 350ml",
		Description:   "国産茶葉を使用した香り豊かな緑茶。すっきりとした後味。",
		Category:      "drink",
		Rank:          5,
		TotalQuantity: 7100,
		AuraLevel:     1,
		BoundingBox:   boundingBox{XMin: 0.65, YMin: 0.10, XMax: 0.90, YMax: 0.55},
	},
}
