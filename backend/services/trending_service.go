package services

import (
	"context"
	"database/sql"
	"fmt"
)

// TrendingResult は /scan/trending レスポンスの1商品エントリを表す。
type TrendingResult struct {
	ProductID       string      `json:"product_id"`
	Name            string      `json:"name"`
	Description     string      `json:"description"`
	Category        string      `json:"category"`
	TrendingRank    int         `json:"trending_rank"`
	CurrentQuantity int         `json:"current_quantity"`
	PrevQuantity    int         `json:"prev_quantity"`
	GrowthRate      *float64    `json:"growth_rate"`
	AuraLevel       int         `json:"aura_level"`
	BoundingBox     BoundingBox `json:"bounding_box"`
}

// TrendingService はカメラ画像から急上昇ランキングを返すサービス。
type TrendingService struct {
	ai      AIService
	db      *sql.DB
	useStub bool
}

// NewTrendingService はTrendingServiceを生成する。
func NewTrendingService(ai AIService, db *sql.DB, useStub bool) *TrendingService {
	return &TrendingService{ai: ai, db: db, useStub: useStub}
}

// GetTrendingRanking は画像データから急上昇ランキング取得→AI識別→結果突合を行い、TrendingResultのスライスを返す。
// DBクエリを1回に削減するため、ランキング取得を先に行い商品名をAIに渡す。
func (s *TrendingService) GetTrendingRanking(ctx context.Context, imageData []byte) ([]TrendingResult, error) {
	rankings, err := s.fetchTrendingRankings(ctx)
	if err != nil {
		return nil, fmt.Errorf("fetchTrendingRankings: %w", err)
	}

	names := make([]string, len(rankings))
	for i, r := range rankings {
		names[i] = r.name
	}

	aiItems, err := recognizeProducts(ctx, s.ai, imageData, names, s.useStub)
	if err != nil {
		return nil, err
	}

	if len(aiItems) == 0 {
		return []TrendingResult{}, nil
	}

	return s.mergeTrendingResults(aiItems, rankings), nil
}

// trendingRow は急上昇ランキングクエリの1行を表す内部型。
type trendingRow struct {
	id              string
	name            string
	description     string
	category        string
	currentQuantity int
	prevQuantity    int
	growthRate      sql.NullFloat64
	trendingRank    int
}

func (s *TrendingService) fetchTrendingRankings(ctx context.Context) ([]trendingRow, error) {
	const query = `
		WITH latest_week AS (
			SELECT MAX(week_start) AS w FROM weekly_sales
		),
		current_week AS (
			SELECT product_id, quantity
			FROM weekly_sales, latest_week
			WHERE week_start = latest_week.w
		),
		prev_week AS (
			SELECT product_id, quantity
			FROM weekly_sales, latest_week
			WHERE week_start = latest_week.w - INTERVAL '7 days'
		),
		trending AS (
			SELECT
				p.id,
				p.name,
				p.description,
				p.category,
				cw.quantity AS current_quantity,
				COALESCE(pw.quantity, 0) AS prev_quantity,
				ROUND(
					cw.quantity::NUMERIC
					/ NULLIF(COALESCE(pw.quantity, 0), 0) * 100,
					1
				) AS growth_rate
			FROM products p
			JOIN current_week cw ON p.id = cw.product_id
			LEFT JOIN prev_week pw ON p.id = pw.product_id
		)
		SELECT
			id,
			name,
			description,
			category,
			current_quantity,
			prev_quantity,
			growth_rate,
			RANK() OVER (ORDER BY growth_rate DESC NULLS LAST) AS trending_rank
		FROM trending
		ORDER BY growth_rate DESC NULLS LAST`

	rows, err := s.db.QueryContext(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("db.QueryContext trending: %w", err)
	}
	defer func() { _ = rows.Close() }()

	var rankings []trendingRow
	for rows.Next() {
		var r trendingRow
		if err := rows.Scan(&r.id, &r.name, &r.description, &r.category,
			&r.currentQuantity, &r.prevQuantity, &r.growthRate, &r.trendingRank); err != nil {
			return nil, fmt.Errorf("rows.Scan: %w", err)
		}
		rankings = append(rankings, r)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("rows.Err: %w", err)
	}
	return rankings, nil
}

// mergeTrendingResults はAI識別結果と急上昇ランキング情報を突合してTrendingResultのスライスを生成する。
func (s *TrendingService) mergeTrendingResults(aiItems []AIItem, rankings []trendingRow) []TrendingResult {
	rankingByName := make(map[string]trendingRow, len(rankings))
	for _, r := range rankings {
		rankingByName[r.name] = r
	}

	results := make([]TrendingResult, 0, len(aiItems))
	for _, item := range aiItems {
		r, found := rankingByName[item.ProductName]
		if !found {
			continue
		}
		var growthRate *float64
		if r.growthRate.Valid {
			v := r.growthRate.Float64
			growthRate = &v
		}
		results = append(results, TrendingResult{
			ProductID:       r.id,
			Name:            r.name,
			Description:     r.description,
			Category:        r.category,
			TrendingRank:    r.trendingRank,
			CurrentQuantity: r.currentQuantity,
			PrevQuantity:    r.prevQuantity,
			GrowthRate:      growthRate,
			AuraLevel:       CalcAuraLevel(r.trendingRank),
			BoundingBox:     item.BoundingBox,
		})
	}
	return results
}
