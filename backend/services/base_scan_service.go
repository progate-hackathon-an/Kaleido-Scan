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

// recognizeProducts は商品名一覧をDBから取得してAI識別を実行し、AIItemのスライスを返す。
// AI呼び出しエラーは *AIError でラップして返す。
func recognizeProducts(ctx context.Context, ai AIService, db *sql.DB, imageData []byte) ([]AIItem, error) {
	productNames, err := fetchProductNames(ctx, db)
	if err != nil {
		return nil, fmt.Errorf("fetchProductNames: %w", err)
	}

	aiItems, err := ai.Recognize(ctx, imageData, productNames)
	if err != nil {
		return nil, &AIError{Cause: err}
	}

	return aiItems, nil
}
