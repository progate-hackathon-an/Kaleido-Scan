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
	rankingRows := sqlmock.NewRows([]string{"id", "name", "description", "category", "rank"}).
		AddRow("11111111-1111-1111-1111-111111111111", "商品A", "説明A", "food", 1).
		AddRow("22222222-2222-2222-2222-222222222222", "商品B", "説明B", "food", 2).
		AddRow("33333333-3333-3333-3333-333333333333", "商品C", "説明C", "drink", 3).
		AddRow("44444444-4444-4444-4444-444444444444", "商品D", "説明D", "snack", 4).
		AddRow("55555555-5555-5555-5555-555555555555", "商品E", "説明E", "drink", 5)
	mock.ExpectQuery("SELECT").WillReturnRows(rankingRows)

	// AIは売上1位（商品A）と売上5位（商品E）を返す
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
		if results[i].Name == "商品A" {
			topSalesResult = &results[i]
		}
		if results[i].Name == "商品E" {
			bottomSalesResult = &results[i]
		}
	}

	// 売上最下位（商品E）がaura_level最大(5)になること
	if bottomSalesResult == nil {
		t.Fatal("商品E result not found")
	}
	if bottomSalesResult.Rank != 1 {
		t.Errorf("商品E should have rank=1, got %d", bottomSalesResult.Rank)
	}
	if bottomSalesResult.AuraLevel != 5 {
		t.Errorf("商品E should have aura_level=5 (max), got %d", bottomSalesResult.AuraLevel)
	}

	// 売上最上位（商品A）がaura_level最小(1)になること
	if topSalesResult == nil {
		t.Fatal("商品A result not found")
	}
	if topSalesResult.Rank != 5 {
		t.Errorf("商品A should have rank=5, got %d", topSalesResult.Rank)
	}
	if topSalesResult.AuraLevel != 1 {
		t.Errorf("商品A should have aura_level=1, got %d", topSalesResult.AuraLevel)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("unmet sqlmock expectations: %v", err)
	}
}
