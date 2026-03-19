package handlers_test

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/Hiru-ge/Kaleido-Scan/backend/handlers"
	"github.com/gin-gonic/gin"
)

func newGetProductRouter(db *sql.DB) *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	h := handlers.NewProductHandler(db)
	r.GET("/products/:id", h.GetProduct)
	return r
}

func TestGetProduct_Success(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock.New: %v", err)
	}
	defer func() { _ = db.Close() }()

	cols := []string{"name", "description", "category", "total_quantity", "rank"}
	mock.ExpectQuery("SELECT").
		WillReturnRows(sqlmock.NewRows(cols).AddRow(
			"炭火焼紅しゃけおにぎり", "説明", "food", 12500, 1,
		))

	r := newGetProductRouter(db)
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

	for _, field := range []string{"product_id", "name", "rank", "aura_level"} {
		if _, exists := body[field]; !exists {
			t.Errorf("response missing field '%s'", field)
		}
	}

	if body["product_id"] != "11111111-1111-1111-1111-111111111111" {
		t.Errorf("unexpected product_id: %v", body["product_id"])
	}
	// aura_level = 6 - rank(1) = 5
	if body["aura_level"] != float64(5) {
		t.Errorf("expected aura_level 5, got %v", body["aura_level"])
	}

	if _, hasBoundingBox := body["bounding_box"]; hasBoundingBox {
		t.Error("response must not contain 'bounding_box'")
	}
}

func TestGetProduct_NotFound(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock.New: %v", err)
	}
	defer func() { _ = db.Close() }()

	mock.ExpectQuery("SELECT").
		WillReturnRows(sqlmock.NewRows([]string{"name", "description", "category", "total_quantity", "rank"}))

	r := newGetProductRouter(db)
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

func TestGetProduct_InvalidUUID(t *testing.T) {
	db, _, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock.New: %v", err)
	}
	defer func() { _ = db.Close() }()

	r := newGetProductRouter(db)
	req := httptest.NewRequest(http.MethodGet, "/products/not-a-valid-uuid", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected status 400, got %d", w.Code)
	}

	var body map[string]map[string]string
	if err := json.Unmarshal(w.Body.Bytes(), &body); err != nil {
		t.Fatalf("failed to parse response body: %v", err)
	}

	if _, ok := body["error"]; !ok {
		t.Fatal("expected 'error' key in response")
	}
}
