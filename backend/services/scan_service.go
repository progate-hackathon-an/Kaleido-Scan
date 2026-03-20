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
	ai      AIService
	db      *sql.DB
	useStub bool
}

// NewScanService はScanServiceを生成する。
func NewScanService(ai AIService, db *sql.DB, useStub bool) *ScanService {
	return &ScanService{ai: ai, db: db, useStub: useStub}
}

// GetRanking は画像データからランキング取得→AI識別→結果突合を行い、ScanResultのスライスを返す。
// DBクエリを1回に削減するため、ランキング取得を先に行い商品名をAIに渡す。
func (s *ScanService) GetRanking(ctx context.Context, imageData []byte) ([]ScanResult, error) {
	rankings, err := fetchSalesRankings(ctx, s.db)
	if err != nil {
		return nil, fmt.Errorf("fetchSalesRankings: %w", err)
	}

	aiItems, err := recognizeProducts(ctx, s.ai, imageData, namesFromRankingRows(rankings), s.useStub)
	if err != nil {
		return nil, err
	}

	if len(aiItems) == 0 {
		return []ScanResult{}, nil
	}

	return s.mergeResults(aiItems, rankings), nil
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
			AuraLevel:     CalcAuraLevel(r.rank),
			BoundingBox:   item.BoundingBox,
		})
	}
	return results
}
