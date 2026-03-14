package handlers_test

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/Hiru-ge/Kaleid-Scan/backend/handlers"
	"github.com/gin-gonic/gin"
)

func newGetProductRouter() *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.GET("/products/:id", handlers.GetProduct)
	return r
}

func TestGetProduct_ExistingID_Returns200AndProductDetail(t *testing.T) {
	r := newGetProductRouter()

	req := httptest.NewRequest(http.MethodGet, "/products/11111111-1111-1111-1111-111111111111", nil)
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected status 200, got %d", w.Code)
	}

	var body map[string]any
	if err := json.Unmarshal(w.Body.Bytes(), &body); err != nil {
		t.Fatalf("failed to parse response body: %v", err)
	}

	for _, field := range []string{"product_id", "name", "description", "category", "rank", "total_quantity", "aura_level"} {
		if _, exists := body[field]; !exists {
			t.Errorf("response missing field '%s'", field)
		}
	}

	if _, hasBoundingBox := body["bounding_box"]; hasBoundingBox {
		t.Error("response must not contain 'bounding_box'")
	}

	if body["product_id"] != "11111111-1111-1111-1111-111111111111" {
		t.Errorf("expected product_id '11111111-1111-1111-1111-111111111111', got '%v'", body["product_id"])
	}
}

func TestGetProduct_NonExistingID_Returns404(t *testing.T) {
	r := newGetProductRouter()

	req := httptest.NewRequest(http.MethodGet, "/products/00000000-0000-0000-0000-000000000000", nil)
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	if w.Code != http.StatusNotFound {
		t.Errorf("expected status 404, got %d", w.Code)
	}

	var body map[string]map[string]string
	if err := json.Unmarshal(w.Body.Bytes(), &body); err != nil {
		t.Fatalf("failed to parse response body: %v", err)
	}

	errObj, ok := body["error"]
	if !ok {
		t.Fatal("expected 'error' key in response")
	}
	if errObj["code"] != "product_not_found" {
		t.Errorf("expected error code 'product_not_found', got '%s'", errObj["code"])
	}
}
