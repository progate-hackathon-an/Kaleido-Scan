package services_test

import (
	"context"
	"testing"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/Hiru-ge/Kaleido-Scan/backend/services"
)

// mockAIService はテスト用のAIServiceモック実装。
type mockAIService struct {
	items []services.AIItem
	err   error
}

func (m *mockAIService) Recognize(_ context.Context, _ []byte, _ []string) ([]services.AIItem, error) {
	return m.items, m.err
}

func TestScanService_GetRanking_AuraLevel(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("failed to create sqlmock: %v", err)
	}
	defer func() { _ = db.Close() }()

	// ランキングクエリのモック（名前もここから取得する）
	rankingRows := sqlmock.NewRows([]string{"id", "name", "description", "category", "total_quantity", "rank"}).
		AddRow("11111111-1111-1111-1111-111111111111", "炭火焼紅しゃけおにぎり", "説明1", "food", 12500, 1).
		AddRow("22222222-2222-2222-2222-222222222222", "ツナマヨおにぎり", "説明2", "food", 10800, 2).
		AddRow("33333333-3333-3333-3333-333333333333", "ブラックコーヒー 500ml", "説明3", "drink", 9800, 3).
		AddRow("44444444-4444-4444-4444-444444444444", "ポテトチップス うすしお味", "説明4", "snack", 8200, 4).
		AddRow("55555555-5555-5555-5555-555555555555", "緑茶 350ml", "説明5", "drink", 7100, 5)
	mock.ExpectQuery("SELECT").WillReturnRows(rankingRows)

	// AIはrank1の商品とrank5の商品を返す
	aiItems := []services.AIItem{
		{
			ProductName: "炭火焼紅しゃけおにぎり",
			BoundingBox: services.BoundingBox{XMin: 0.1, YMin: 0.2, XMax: 0.4, YMax: 0.7},
		},
		{
			ProductName: "緑茶 350ml",
			BoundingBox: services.BoundingBox{XMin: 0.5, YMin: 0.1, XMax: 0.8, YMax: 0.6},
		},
	}
	mockAI := &mockAIService{items: aiItems}

	svc := services.NewScanService(mockAI, db)
	results, err := svc.GetRanking(context.Background(), []byte("fake-image"))
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if len(results) != 2 {
		t.Fatalf("expected 2 results, got %d", len(results))
	}

	// rank=1 → aura_level=5 を確認
	var rank1Result, rank5Result *services.ScanResult
	for i := range results {
		if results[i].Rank == 1 {
			rank1Result = &results[i]
		}
		if results[i].Rank == 5 {
			rank5Result = &results[i]
		}
	}

	if rank1Result == nil {
		t.Fatal("rank1 result not found")
	}
	if rank1Result.AuraLevel != 5 {
		t.Errorf("rank=1 should have aura_level=5, got %d", rank1Result.AuraLevel)
	}

	if rank5Result == nil {
		t.Fatal("rank5 result not found")
	}
	if rank5Result.AuraLevel != 1 {
		t.Errorf("rank=5 should have aura_level=1, got %d", rank5Result.AuraLevel)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("unmet sqlmock expectations: %v", err)
	}
}
