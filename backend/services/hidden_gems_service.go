package services

import (
	"context"
	"database/sql"
	"fmt"
)

// HiddenGemResult は /scan/hidden-gems レスポンスの1商品エントリを表す。
type HiddenGemResult struct {
	ProductID     string      `json:"product_id"`
	Name          string      `json:"name"`
	Description   string      `json:"description"`
	Category      string      `json:"category"`
	SalesRank     int         `json:"sales_rank"`
	HiddenRank    int         `json:"hidden_rank"`
	TotalQuantity int         `json:"total_quantity"`
	AuraLevel     int         `json:"aura_level"`
	BoundingBox   BoundingBox `json:"bounding_box"`
}

// HiddenGemsService はカメラ画像から商品を識別し、掘り出し物ランキング情報を付与するサービス。
type HiddenGemsService struct {
	ai AIService
	db *sql.DB
}

// NewHiddenGemsService はHiddenGemsServiceを生成する。
func NewHiddenGemsService(ai AIService, db *sql.DB) *HiddenGemsService {
	return &HiddenGemsService{ai: ai, db: db}
}

// GetHiddenGemsRanking は画像データからAI識別→累計売上ランキング取得→逆順オーラ付与を行い、HiddenGemResultのスライスを返す。
// 売上下位商品ほど hidden_rank が高く、aura_level が強くなる。
func (s *HiddenGemsService) GetHiddenGemsRanking(ctx context.Context, imageData []byte) ([]HiddenGemResult, error) {
	productNames, err := s.fetchProductNames(ctx)
	if err != nil {
		return nil, fmt.Errorf("fetchProductNames: %w", err)
	}

	aiItems, err := s.ai.Recognize(ctx, imageData, productNames)
	if err != nil {
		return nil, &AIError{Cause: err}
	}

	if len(aiItems) == 0 {
		return []HiddenGemResult{}, nil
	}

	rankings, err := s.fetchSalesRankings(ctx)
	if err != nil {
		return nil, fmt.Errorf("fetchSalesRankings: %w", err)
	}

	return s.mergeHiddenGemsResults(aiItems, rankings), nil
}

func (s *HiddenGemsService) fetchProductNames(ctx context.Context) ([]string, error) {
	rows, err := s.db.QueryContext(ctx, "SELECT name FROM products ORDER BY name")
	if err != nil {
		return nil, fmt.Errorf("db.QueryContext products: %w", err)
	}
	defer func() { _ = rows.Close() }()

	var names []string
	for rows.Next() {
		var name string
		if err := rows.Scan(&name); err != nil {
			return nil, fmt.Errorf("rows.Scan: %w", err)
		}
		names = append(names, name)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("rows.Err: %w", err)
	}
	return names, nil
}

func (s *HiddenGemsService) fetchSalesRankings(ctx context.Context) ([]rankingRow, error) {
	const query = `
		SELECT p.id, p.name, p.description, p.category,
		       SUM(ws.quantity) AS total_quantity,
		       RANK() OVER (ORDER BY SUM(ws.quantity) DESC) AS rank
		FROM products p
		JOIN weekly_sales ws ON p.id = ws.product_id
		GROUP BY p.id, p.name, p.description, p.category`

	rows, err := s.db.QueryContext(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("db.QueryContext rankings: %w", err)
	}
	defer func() { _ = rows.Close() }()

	var rankings []rankingRow
	for rows.Next() {
		var r rankingRow
		if err := rows.Scan(&r.id, &r.name, &r.description, &r.category, &r.totalQuantity, &r.rank); err != nil {
			return nil, fmt.Errorf("rows.Scan: %w", err)
		}
		rankings = append(rankings, r)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("rows.Err: %w", err)
	}
	return rankings, nil
}

// mergeHiddenGemsResults はAI識別結果とランキング情報を突合してHiddenGemResultのスライスを生成する。
// hidden_rank = 6 - sales_rank, aura_level = 6 - hidden_rank = sales_rank
func (s *HiddenGemsService) mergeHiddenGemsResults(aiItems []AIItem, rankings []rankingRow) []HiddenGemResult {
	rankingByName := make(map[string]rankingRow, len(rankings))
	for _, r := range rankings {
		rankingByName[r.name] = r
	}

	results := make([]HiddenGemResult, 0, len(aiItems))
	for _, item := range aiItems {
		r, found := rankingByName[item.ProductName]
		if !found {
			continue
		}
		hiddenRank := 6 - r.rank
		results = append(results, HiddenGemResult{
			ProductID:     r.id,
			Name:          r.name,
			Description:   r.description,
			Category:      r.category,
			SalesRank:     r.rank,
			HiddenRank:    hiddenRank,
			TotalQuantity: r.totalQuantity,
			AuraLevel:     6 - hiddenRank,
			BoundingBox:   item.BoundingBox,
		})
	}
	return results
}
