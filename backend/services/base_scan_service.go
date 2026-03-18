package services

import (
	"context"
	"database/sql"
	"fmt"
)

// rankingRow はランキングクエリの1行を表す内部型。
type rankingRow struct {
	id            string
	name          string
	description   string
	category      string
	totalQuantity int
	rank          int
}

// namesFromRankingRows はrankingRowスライスから商品名のスライスを抽出するヘルパー。
func namesFromRankingRows(rows []rankingRow) []string {
	names := make([]string, len(rows))
	for i, r := range rows {
		names[i] = r.name
	}
	return names
}

// fetchSalesRankings は全商品の累計売上ランキングをDBから取得するパッケージ共通ヘルパー。
func fetchSalesRankings(ctx context.Context, db *sql.DB) ([]rankingRow, error) {
	const query = `
		SELECT p.id, p.name, p.description, p.category,
		       SUM(ws.quantity) AS total_quantity,
		       RANK() OVER (ORDER BY SUM(ws.quantity) DESC) AS rank
		FROM products p
		JOIN weekly_sales ws ON p.id = ws.product_id
		GROUP BY p.id, p.name, p.description, p.category`

	rows, err := db.QueryContext(ctx, query)
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

// recognizeProducts は商品名リストを受け取ってAI識別を実行し、AIItemのスライスを返す。
// AI呼び出しエラーは *AIError でラップして返す。
func recognizeProducts(ctx context.Context, ai AIService, imageData []byte, productNames []string) ([]AIItem, error) {
	aiItems, err := ai.Recognize(ctx, imageData, productNames)
	if err != nil {
		return nil, &AIError{Cause: err}
	}
	return aiItems, nil
}
