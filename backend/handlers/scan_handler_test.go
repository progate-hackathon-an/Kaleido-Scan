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

func newTestRouter(svc handlers.ScanRanker) *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	h := handlers.NewScanHandler(svc)
	r.POST("/scan/ranking", h.ScanRanking)
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
	r := newTestRouter(mock)

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
	r := newTestRouter(mock)

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

func TestScanRanking_AIError(t *testing.T) {
	mock := &mockScanRanker{
		err: &services.AIError{Cause: io.EOF},
	}
	r := newTestRouter(mock)

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
