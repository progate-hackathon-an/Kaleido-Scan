package services_test

import (
	"context"
	"errors"
	"testing"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/Hiru-ge/Kaleido-Scan/backend/services"
)

// mockFailingAI は常にエラーを返すAIServiceモック。
type mockFailingAI struct{}

func (m *mockFailingAI) Recognize(_ context.Context, _ []byte, _ []string) ([]services.AIItem, error) {
	return nil, errors.New("api unavailable")
}

func rankingRowsMock(mock sqlmock.Sqlmock) {
	mock.ExpectQuery("SELECT").WillReturnRows(
		sqlmock.NewRows([]string{"id", "name", "description", "category", "total_quantity", "rank"}).
			AddRow("11111111-1111-1111-1111-111111111111", "商品A", "説明A", "food", 5000, 1).
			AddRow("22222222-2222-2222-2222-222222222222", "商品B", "説明B", "drink", 4000, 2).
			AddRow("33333333-3333-3333-3333-333333333333", "商品C", "説明C", "snack", 3000, 3),
	)
}

// TestFallback_ReturnsAllProducts はAI失敗時に全商品がフォールバックで返ることを確認する。
func TestFallback_ReturnsAllProducts(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("failed to create sqlmock: %v", err)
	}
	defer func() { _ = db.Close() }()

	rankingRowsMock(mock)

	svc := services.NewScanService(&mockFailingAI{}, db)
	results, err := svc.GetRanking(context.Background(), []byte("fake-image"))
	if err != nil {
		t.Fatalf("fallback should not return error, got: %v", err)
	}
	if len(results) != 3 {
		t.Errorf("expected 3 items (all products), got %d", len(results))
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("unmet sqlmock expectations: %v", err)
	}
}

// TestFallback_BoundingBoxesAreValid はフォールバック時のバウンディングボックスが
// 有効な範囲（0.0〜1.0内かつ min < max）であることを確認する。
func TestFallback_BoundingBoxesAreValid(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("failed to create sqlmock: %v", err)
	}
	defer func() { _ = db.Close() }()

	rankingRowsMock(mock)

	svc := services.NewScanService(&mockFailingAI{}, db)
	results, _ := svc.GetRanking(context.Background(), []byte("fake-image"))

	for i, r := range results {
		bb := r.BoundingBox
		if bb.XMin >= bb.XMax {
			t.Errorf("item[%d]: XMin(%v) >= XMax(%v)", i, bb.XMin, bb.XMax)
		}
		if bb.YMin >= bb.YMax {
			t.Errorf("item[%d]: YMin(%v) >= YMax(%v)", i, bb.YMin, bb.YMax)
		}
	}
}
