package services_test

import (
	"context"
	"testing"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/Hiru-ge/Kaleido-Scan/backend/services"
)

func TestTrendingService_GetRanking_GrowthRate(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("failed to create sqlmock: %v", err)
	}
	defer func() { _ = db.Close() }()

	// 急上昇ランキングクエリのモック（名前もここから取得する。オレンジが growth_rate=130.8 で上位）
	trendingRows := sqlmock.NewRows([]string{"id", "name", "description", "category", "current_quantity", "prev_quantity", "growth_rate", "trending_rank"}).
		AddRow("44444444-4444-4444-4444-444444444444", "オレンジ 500ml", "説明A", "drink", 1700, 1300, 130.8, 1).
		AddRow("33333333-3333-3333-3333-333333333333", "ブラックコーヒー 500ml", "説明B", "drink", 9800, 9600, 102.1, 2)
	mock.ExpectQuery("SELECT").WillReturnRows(trendingRows)

	aiItems := []services.AIItem{
		{ProductName: "オレンジ 500ml", BoundingBox: services.BoundingBox{XMin: 0.1, YMin: 0.1, XMax: 0.4, YMax: 0.4}},
		{ProductName: "ブラックコーヒー 500ml", BoundingBox: services.BoundingBox{XMin: 0.5, YMin: 0.1, XMax: 0.8, YMax: 0.4}},
	}
	mockAI := &mockAIService{items: aiItems}

	svc := services.NewTrendingService(mockAI, db, false)
	results, err := svc.GetTrendingRanking(context.Background(), []byte("fake-image"))
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if len(results) != 2 {
		t.Fatalf("expected 2 results, got %d", len(results))
	}

	// growth_rate が高い商品が上位（trending_rank=1 → aura_level=5）
	var orangeResult, coffeeResult *services.TrendingResult
	for i := range results {
		if results[i].Name == "オレンジ 500ml" {
			orangeResult = &results[i]
		}
		if results[i].Name == "ブラックコーヒー 500ml" {
			coffeeResult = &results[i]
		}
	}

	if orangeResult == nil {
		t.Fatal("orange result not found")
	}
	if orangeResult.TrendingRank != 1 {
		t.Errorf("orange should have trending_rank=1, got %d", orangeResult.TrendingRank)
	}
	if orangeResult.AuraLevel != 5 {
		t.Errorf("orange (trending_rank=1) should have aura_level=5, got %d", orangeResult.AuraLevel)
	}
	if orangeResult.GrowthRate == nil || *orangeResult.GrowthRate != 130.8 {
		t.Errorf("orange should have growth_rate=130.8, got %v", orangeResult.GrowthRate)
	}

	if coffeeResult == nil {
		t.Fatal("coffee result not found")
	}
	if coffeeResult.TrendingRank != 2 {
		t.Errorf("coffee should have trending_rank=2, got %d", coffeeResult.TrendingRank)
	}
	if coffeeResult.AuraLevel != 4 {
		t.Errorf("coffee (trending_rank=2) should have aura_level=4, got %d", coffeeResult.AuraLevel)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("unmet sqlmock expectations: %v", err)
	}
}

func TestTrendingService_GetRanking_NoPrevWeek(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("failed to create sqlmock: %v", err)
	}
	defer func() { _ = db.Close() }()

	// 前週データなし: prev_quantity=0, growth_rate=NULL（名前もここから取得する）
	trendingRows := sqlmock.NewRows([]string{"id", "name", "description", "category", "current_quantity", "prev_quantity", "growth_rate", "trending_rank"}).
		AddRow("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", "新商品A", "新しい商品", "food", 500, 0, nil, 1)
	mock.ExpectQuery("SELECT").WillReturnRows(trendingRows)

	aiItems := []services.AIItem{
		{ProductName: "新商品A", BoundingBox: services.BoundingBox{XMin: 0.1, YMin: 0.1, XMax: 0.4, YMax: 0.4}},
	}
	mockAI := &mockAIService{items: aiItems}

	svc := services.NewTrendingService(mockAI, db, false)
	results, err := svc.GetTrendingRanking(context.Background(), []byte("fake-image"))
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if len(results) != 1 {
		t.Fatalf("expected 1 result, got %d", len(results))
	}

	// 前週データなし → prev_quantity=0, growth_rate=nil
	if results[0].PrevQuantity != 0 {
		t.Errorf("expected prev_quantity=0, got %d", results[0].PrevQuantity)
	}
	if results[0].GrowthRate != nil {
		t.Errorf("expected growth_rate=nil for no prev week data, got %v", results[0].GrowthRate)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("unmet sqlmock expectations: %v", err)
	}
}
