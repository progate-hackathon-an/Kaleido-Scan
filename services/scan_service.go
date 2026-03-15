package services

import (
	"context"
	"database/sql"
	"fmt"
)

// ScanResult は /scan/ranking レスポンスの1商品エントリを表す。
type ScanResult struct {
	ProductID     string      `json:"product_id"`
	Name          string      `json:"name"`
	Description   string      `json:"description"`
	Category      string      `json:"category"`
	Rank          int         `json:"rank"`
	TotalQuantity int         `json:"total_quantity"`
	AuraLevel     int         `json:"aura_level"`
	BoundingBox   BoundingBox `json:"bounding_box"`
}

// ScanService はカメラ画像から商品を識別し、ランキング情報を付与するサービス。
type ScanService struct {
	ai AIService
	db *sql.DB
}

// NewScanService はScanServiceを生成する。
func NewScanService(ai AIService, db *sql.DB) *ScanService {
	return &ScanService{ai: ai, db: db}
}

// GetRanking は画像データからAI識別→ランキング取得→結果突合を行い、ScanResultのスライスを返す。
func (s *ScanService) GetRanking(ctx context.Context, imageData []byte) ([]ScanResult, error) {
	productNames, err := fetchProductNames(ctx, s.db)
	if err != nil {
		return nil, fmt.Errorf("fetchProductNames: %w", err)
	}

	aiItems, err := s.ai.Recognize(ctx, imageData, productNames)
	if err != nil {
		return nil, &AIError{Cause: err}
	}

	if len(aiItems) == 0 {
		return []ScanResult{}, nil
	}

	rankings, err := s.fetchRankings(ctx)
	if err != nil {
		return nil, fmt.Errorf("fetchRankings: %w", err)
	}

	return s.mergeResults(aiItems, rankings), nil
}

// rankingRow はランキングクエリの1行を表す内部型。
type rankingRow struct {
	id            string
	name          string
	description   string
	category      string
	totalQuantity int
	rank          int
}

// fetchProductNames は全商品名をDBから取得するパッケージ共通ヘルパー。
func fetchProductNames(ctx context.Context, db *sql.DB) ([]string, error) {
	rows, err := db.QueryContext(ctx, "SELECT name FROM products ORDER BY name")
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

func (s *ScanService) fetchRankings(ctx context.Context) ([]rankingRow, error) {
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

// mergeResults はAI識別結果とランキング情報を突合してScanResultのスライスを生成する。
func (s *ScanService) mergeResults(aiItems []AIItem, rankings []rankingRow) []ScanResult {
	rankingByName := make(map[string]rankingRow, len(rankings))
	for _, r := range rankings {
		rankingByName[r.name] = r
	}

	results := make([]ScanResult, 0, len(aiItems))
	for _, item := range aiItems {
		r, found := rankingByName[item.ProductName]
		if !found {
			continue
		}
		results = append(results, ScanResult{
			ProductID:     r.id,
			Name:          r.name,
			Description:   r.description,
			Category:      r.category,
			Rank:          r.rank,
			TotalQuantity: r.totalQuantity,
			AuraLevel:     6 - r.rank,
			BoundingBox:   item.BoundingBox,
		})
	}
	return results
}
