package services

import (
	"context"
	"database/sql"
	"fmt"
)

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
