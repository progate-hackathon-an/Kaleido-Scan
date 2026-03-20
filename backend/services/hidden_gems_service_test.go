package services_test

import (
	"context"
	"testing"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/Hiru-ge/Kaleido-Scan/backend/services"
)

func TestHiddenGemsService_GetRanking_ReverseOrder(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("failed to create sqlmock: %v", err)
	}
	defer func() { _ = db.Close() }()

	// ランキングクエリのモック（名前もここから取得する）
	rankingRows := sqlmock.NewRows([]string{"id", "name", "description", "category", "total_quantity", "rank"}).
		AddRow("11111111-1111-1111-1111-111111111111", "商品A", "説明A", "food", 12500, 1).
		AddRow("22222222-2222-2222-2222-222222222222", "商品B", "説明B", "food", 10800, 2).
		AddRow("33333333-3333-3333-3333-333333333333", "商品C", "説明C", "drink", 9800, 3).
		AddRow("44444444-4444-4444-4444-444444444444", "商品D", "説明D", "snack", 8200, 4).
		AddRow("55555555-5555-5555-5555-555555555555", "商品E", "説明E", "drink", 7100, 5)
	mock.ExpectQuery("SELECT").WillReturnRows(rankingRows)

	// AIはsales_rank=1の商品とsales_rank=5の商品を返す
	aiItems := []services.AIItem{
		{
			ProductName: "商品A",
			BoundingBox: services.BoundingBox{XMin: 0.1, YMin: 0.2, XMax: 0.4, YMax: 0.7},
		},
		{
			ProductName: "商品E",
			BoundingBox: services.BoundingBox{XMin: 0.5, YMin: 0.1, XMax: 0.8, YMax: 0.6},
		},
	}
	mockAI := &mockAIService{items: aiItems}

	svc := services.NewHiddenGemsService(mockAI, db, false)
	results, err := svc.GetHiddenGemsRanking(context.Background(), []byte("fake-image"))
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if len(results) != 2 {
		t.Fatalf("expected 2 results, got %d", len(results))
	}

	var topSalesResult, bottomSalesResult *services.HiddenGemResult
	for i := range results {
		if results[i].SalesRank == 1 {
			topSalesResult = &results[i]
		}
		if results[i].SalesRank == 5 {
			bottomSalesResult = &results[i]
		}
	}

	// 売上最下位(sales_rank=5)の商品がaura_level最大(5)になること
	if bottomSalesResult == nil {
		t.Fatal("sales_rank=5 result not found")
	}
	if bottomSalesResult.HiddenRank != 1 {
		t.Errorf("sales_rank=5 should have hidden_rank=1, got %d", bottomSalesResult.HiddenRank)
	}
	if bottomSalesResult.AuraLevel != 5 {
		t.Errorf("sales_rank=5 should have aura_level=5 (max), got %d", bottomSalesResult.AuraLevel)
	}

	// 売上最上位(sales_rank=1)の商品がaura_level最小(1)になること
	if topSalesResult == nil {
		t.Fatal("sales_rank=1 result not found")
	}
	if topSalesResult.HiddenRank != 5 {
		t.Errorf("sales_rank=1 should have hidden_rank=5, got %d", topSalesResult.HiddenRank)
	}
	if topSalesResult.AuraLevel != 1 {
		t.Errorf("sales_rank=1 should have aura_level=1, got %d", topSalesResult.AuraLevel)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("unmet sqlmock expectations: %v", err)
	}
}
