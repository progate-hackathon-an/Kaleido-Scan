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
	ai      AIService
	db      *sql.DB
	useStub bool
}

// NewHiddenGemsService はHiddenGemsServiceを生成する。
func NewHiddenGemsService(ai AIService, db *sql.DB, useStub bool) *HiddenGemsService {
	return &HiddenGemsService{ai: ai, db: db, useStub: useStub}
}

// GetHiddenGemsRanking は画像データからランキング取得→AI識別→逆順オーラ付与を行い、HiddenGemResultのスライスを返す。
// 売上下位商品ほど hidden_rank が低く（最下位=1）、aura_level が強くなる。
// DBクエリを1回に削減するため、ランキング取得を先に行い商品名をAIに渡す。
func (s *HiddenGemsService) GetHiddenGemsRanking(ctx context.Context, imageData []byte) ([]HiddenGemResult, error) {
	rankings, err := fetchSalesRankings(ctx, s.db)
	if err != nil {
		return nil, fmt.Errorf("fetchSalesRankings: %w", err)
	}

	aiItems, err := recognizeProducts(ctx, s.ai, imageData, namesFromRankingRows(rankings), s.useStub)
	if err != nil {
		return nil, err
	}

	if len(aiItems) == 0 {
		return []HiddenGemResult{}, nil
	}

	return s.mergeHiddenGemsResults(aiItems, rankings), nil
}

// mergeHiddenGemsResults はAI識別結果とランキング情報を突合してHiddenGemResultのスライスを生成する。
// hidden_rank = (maxRank+1) - sales_rank（売上最下位=sales_rank:5 → hidden_rank=1）。
// aura_level は hidden_rank を CalcAuraLevel に渡すことで逆転計算する（hidden_rank=1 → aura_level=5）。
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
		hiddenRank := (maxRank + 1) - r.rank
		results = append(results, HiddenGemResult{
			ProductID:     r.id,
			Name:          r.name,
			Description:   r.description,
			Category:      r.category,
			SalesRank:     r.rank,
			HiddenRank:    hiddenRank,
			TotalQuantity: r.totalQuantity,
			AuraLevel:     CalcAuraLevel(hiddenRank),
			BoundingBox:   item.BoundingBox,
		})
	}
	return results
}
