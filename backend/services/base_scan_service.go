package services

import (
	"context"
	"database/sql"
	"fmt"
	"log"
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
// useStub=true の場合はAI呼び出しをスキップしてスタブを返す。
// AI呼び出しが失敗した場合は *AIError でラップして返す。
func recognizeProducts(ctx context.Context, ai AIService, imageData []byte, productNames []string, useStub bool) ([]AIItem, error) {
	if useStub {
		log.Printf("USE_STUB=true: skipping AI call, returning stub items")
		return fallbackAIItems(productNames), nil
	}
	aiItems, err := ai.Recognize(ctx, imageData, productNames)
	if err != nil {
		return nil, &AIError{Cause: fmt.Errorf("ai recognition failed: %w", err)}
	}
	return aiItems, nil
}

// fallbackPositions は画面内へ散らばった小さめの固定バウンディングボックスを定義する。
// 5商品の場合は上左・上右・中央・下左・下右の配置を基本とする。
var fallbackPositions = []BoundingBox{
	{XMin: 0.05, YMin: 0.05, XMax: 0.30, YMax: 0.25}, // 上左
	{XMin: 0.65, YMin: 0.05, XMax: 0.90, YMax: 0.25}, // 上右
	{XMin: 0.35, YMin: 0.38, XMax: 0.60, YMax: 0.58}, // 中央
	{XMin: 0.05, YMin: 0.70, XMax: 0.30, YMax: 0.90}, // 下左
	{XMin: 0.65, YMin: 0.70, XMax: 0.90, YMax: 0.90}, // 下右
}

// fallbackAIItems は商品名リストを受け取り、散らばった固定バウンディングボックスを付与して返す。
// 商品数が fallbackPositions を超える場合は末尾の位置を再利用する。
func fallbackAIItems(productNames []string) []AIItem {
	if len(productNames) == 0 {
		return []AIItem{}
	}
	items := make([]AIItem, len(productNames))
	for i, name := range productNames {
		pos := fallbackPositions[min(i, len(fallbackPositions)-1)]
		items[i] = AIItem{ProductName: name, BoundingBox: pos}
	}
	return items
}
