package handlers_test

import (
	"bytes"
	"context"
	"encoding/json"
	"io"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/Hiru-ge/Kaleid-Scan/backend/handlers"
	"github.com/Hiru-ge/Kaleid-Scan/backend/services"
	"github.com/gin-gonic/gin"
)

// mockScanRanker はテスト用のScanRankerモック実装。
type mockScanRanker struct {
	results []services.ScanResult
	err     error
}

func (m *mockScanRanker) GetRanking(_ context.Context, _ []byte) ([]services.ScanResult, error) {
	return m.results, m.err
}

// mockHiddenGemsGetter はテスト用のHiddenGemsGetterモック実装。
type mockHiddenGemsGetter struct {
	results []services.HiddenGemResult
	err     error
}

func (m *mockHiddenGemsGetter) GetHiddenGemsRanking(_ context.Context, _ []byte) ([]services.HiddenGemResult, error) {
	return m.results, m.err
}

// mockTrendingRanker はテスト用のTrendingRankerモック実装。
type mockTrendingRanker struct {
	results []services.TrendingResult
	err     error
}

func (m *mockTrendingRanker) GetTrendingRanking(_ context.Context, _ []byte) ([]services.TrendingResult, error) {
	return m.results, m.err
}

func newTestRouter(svc handlers.ScanRanker, trending handlers.TrendingRanker) *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	h := handlers.NewScanHandler(svc, trending)
	r.POST("/scan/ranking", h.ScanRanking)
	r.POST("/scan/trending", h.ScanTrending)
	return r
}

func newHiddenGemsTestRouter(svc handlers.HiddenGemsGetter) *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	h := handlers.NewHiddenGemsHandler(svc)
	r.POST("/scan/hidden-gems", h.ScanHiddenGems)
	return r
}

func buildMultipartRequest(t *testing.T) *http.Request {
	t.Helper()
	var buf bytes.Buffer
	mw := multipart.NewWriter(&buf)
	fw, err := mw.CreateFormFile("image", "test.jpg")
	if err != nil {
		t.Fatalf("failed to create form file: %v", err)
	}
	_, _ = io.WriteString(fw, "fake image data")
	if err := mw.Close(); err != nil {
		t.Fatalf("failed to close multipart writer: %v", err)
	}
	req := httptest.NewRequest(http.MethodPost, "/scan/ranking", &buf)
	req.Header.Set("Content-Type", mw.FormDataContentType())
	return req
}

func TestScanRanking_Success(t *testing.T) {
	mock := &mockScanRanker{
		results: []services.ScanResult{
			{
				ProductID:     "11111111-1111-1111-1111-111111111111",
				Name:          "炭火焼紅しゃけおにぎり",
				Description:   "説明",
				Category:      "food",
				Rank:          1,
				TotalQuantity: 12500,
				AuraLevel:     5,
				BoundingBox:   services.BoundingBox{XMin: 0.1, YMin: 0.2, XMax: 0.4, YMax: 0.7},
			},
		},
	}
	r := newTestRouter(mock, &mockTrendingRanker{})

	req := buildMultipartRequest(t)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected status 200, got %d", w.Code)
	}

	var body map[string][]map[string]any
	if err := json.Unmarshal(w.Body.Bytes(), &body); err != nil {
		t.Fatalf("failed to parse response body: %v", err)
	}

	items, ok := body["detected_items"]
	if !ok {
		t.Fatal("expected 'detected_items' key in response")
	}
	if len(items) != 1 {
		t.Errorf("expected 1 detected item, got %d", len(items))
	}
}

func TestScanRanking_NoImage(t *testing.T) {
	mock := &mockScanRanker{}
	r := newTestRouter(mock, &mockTrendingRanker{})

	req := httptest.NewRequest(http.MethodPost, "/scan/ranking", nil)
	req.Header.Set("Content-Type", "multipart/form-data")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected status 400, got %d", w.Code)
	}

	var body map[string]map[string]string
	if err := json.Unmarshal(w.Body.Bytes(), &body); err != nil {
		t.Fatalf("failed to parse response body: %v", err)
	}

	errObj, ok := body["error"]
	if !ok {
		t.Fatal("expected 'error' key in response")
	}
	if errObj["code"] != "invalid_image" {
		t.Errorf("expected error code 'invalid_image', got '%s'", errObj["code"])
	}
}

func buildHiddenGemsRequest(t *testing.T) *http.Request {
	t.Helper()
	var buf bytes.Buffer
	mw := multipart.NewWriter(&buf)
	fw, err := mw.CreateFormFile("image", "test.jpg")
	if err != nil {
		t.Fatalf("failed to create form file: %v", err)
	}
	_, _ = io.WriteString(fw, "fake image data")
	if err := mw.Close(); err != nil {
		t.Fatalf("failed to close multipart writer: %v", err)
	}
	req := httptest.NewRequest(http.MethodPost, "/scan/hidden-gems", &buf)
	req.Header.Set("Content-Type", mw.FormDataContentType())
	return req
}

func TestScanHiddenGems_Success(t *testing.T) {
	mock := &mockHiddenGemsGetter{
		results: []services.HiddenGemResult{
			{
				ProductID:     "55555555-5555-5555-5555-555555555555",
				Name:          "セブンプレミアム アーモンドボール",
				Description:   "アーモンドをホワイトチョコレートでコーティングしたひとくちサイズのスナック。香ばしいアーモンドとチョコレートの絶妙な組み合わせ。",
				Category:      "snack",
				SalesRank:     5,
				HiddenRank:    1,
				TotalQuantity: 4850,
				AuraLevel:     5,
				BoundingBox:   services.BoundingBox{XMin: 0.2, YMin: 0.3, XMax: 0.6, YMax: 0.8},
			},
		},
	}
	r := newHiddenGemsTestRouter(mock)

	req := buildHiddenGemsRequest(t)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected status 200, got %d", w.Code)
	}

	var body map[string][]map[string]any
	if err := json.Unmarshal(w.Body.Bytes(), &body); err != nil {
		t.Fatalf("failed to parse response body: %v", err)
	}

	items, ok := body["detected_items"]
	if !ok {
		t.Fatal("expected 'detected_items' key in response")
	}
	if len(items) != 1 {
		t.Errorf("expected 1 detected item, got %d", len(items))
	}
}

func TestScanRanking_AIError(t *testing.T) {
	mock := &mockScanRanker{
		err: &services.AIError{Cause: io.EOF},
	}
	r := newTestRouter(mock, &mockTrendingRanker{})

	req := buildMultipartRequest(t)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusInternalServerError {
		t.Errorf("expected status 500, got %d", w.Code)
	}

	var body map[string]map[string]string
	if err := json.Unmarshal(w.Body.Bytes(), &body); err != nil {
		t.Fatalf("failed to parse response body: %v", err)
	}

	errObj, ok := body["error"]
	if !ok {
		t.Fatal("expected 'error' key in response")
	}
	if errObj["code"] != "ai_error" {
		t.Errorf("expected error code 'ai_error', got '%s'", errObj["code"])
	}
}

func TestScanTrending_Success(t *testing.T) {
	growthRate := 130.8
	trendingMock := &mockTrendingRanker{
		results: []services.TrendingResult{
			{
				ProductID:       "44444444-4444-4444-4444-444444444444",
				Name:            "オレンジ 500ml",
				Description:     "説明",
				Category:        "drink",
				TrendingRank:    1,
				CurrentQuantity: 1700,
				PrevQuantity:    1300,
				GrowthRate:      &growthRate,
				AuraLevel:       5,
				BoundingBox:     services.BoundingBox{XMin: 0.5, YMin: 0.1, XMax: 0.8, YMax: 0.6},
			},
		},
	}
	r := newTestRouter(&mockScanRanker{}, trendingMock)

	var buf bytes.Buffer
	mw := multipart.NewWriter(&buf)
	fw, err := mw.CreateFormFile("image", "test.jpg")
	if err != nil {
		t.Fatalf("failed to create form file: %v", err)
	}
	_, _ = io.WriteString(fw, "fake image data")
	if err := mw.Close(); err != nil {
		t.Fatalf("failed to close multipart writer: %v", err)
	}
	req := httptest.NewRequest(http.MethodPost, "/scan/trending", &buf)
	req.Header.Set("Content-Type", mw.FormDataContentType())
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected status 200, got %d", w.Code)
	}

	var body map[string][]map[string]any
	if err := json.Unmarshal(w.Body.Bytes(), &body); err != nil {
		t.Fatalf("failed to parse response body: %v", err)
	}

	items, ok := body["detected_items"]
	if !ok {
		t.Fatal("expected 'detected_items' key in response")
	}
	if len(items) != 1 {
		t.Errorf("expected 1 detected item, got %d", len(items))
	}
	if _, ok := items[0]["growth_rate"]; !ok {
		t.Error("expected 'growth_rate' field in detected item")
	}
}
