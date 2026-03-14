package handlers_test

import (
	"bytes"
	"encoding/json"
	"io"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/Hiru-ge/Kaleid-Scan/backend/handlers"
	"github.com/gin-gonic/gin"
)

func newScanRankingRouter() *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.POST("/scan/ranking", handlers.ScanRanking)
	return r
}

func TestScanRanking_NoImage_Returns400(t *testing.T) {
	r := newScanRankingRouter()

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

func TestScanRanking_WithImage_Returns200AndFiveItems(t *testing.T) {
	r := newScanRankingRouter()

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
	if len(items) != 5 {
		t.Errorf("expected 5 detected items, got %d", len(items))
	}

	for i, item := range items {
		for _, field := range []string{"product_id", "name", "aura_level", "bounding_box"} {
			if _, exists := item[field]; !exists {
				t.Errorf("item[%d] missing field '%s'", i, field)
			}
		}
	}
}
