package services_test

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/Hiru-ge/Kaleido-Scan/backend/services"
)

func TestGeminiService_Recognize_Success(t *testing.T) {
	// Gemini APIレスポンスのモック
	geminiResp := map[string]any{
		"candidates": []map[string]any{
			{
				"content": map[string]any{
					"parts": []map[string]any{
						{
							"text": `{"items":[{"product_name":"炭火焼紅しゃけおにぎり","bounding_box":{"x_min":0.1,"y_min":0.2,"x_max":0.4,"y_max":0.7}}]}`,
						},
					},
				},
			},
		},
	}

	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		if err := json.NewEncoder(w).Encode(geminiResp); err != nil {
			http.Error(w, "encode error", http.StatusInternalServerError)
		}
	}))
	defer srv.Close()

	svc := services.NewGeminiServiceWithURL("test-key", srv.URL)
	imageData := []byte{0xFF, 0xD8, 0xFF, 0xE0} // JPEG magic bytes
	productNames := []string{"炭火焼紅しゃけおにぎり", "ツナマヨおにぎり"}

	items, err := svc.Recognize(context.Background(), imageData, productNames)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(items) != 1 {
		t.Fatalf("expected 1 item, got %d", len(items))
	}
	if items[0].ProductName != "炭火焼紅しゃけおにぎり" {
		t.Errorf("expected product name '炭火焼紅しゃけおにぎり', got '%s'", items[0].ProductName)
	}
	if items[0].BoundingBox.XMin != 0.1 {
		t.Errorf("expected x_min 0.1, got %f", items[0].BoundingBox.XMin)
	}
}

func TestGeminiService_Recognize_OutOfRangeBoundingBox(t *testing.T) {
	// ラベルが画像端にかかっている場合、0.0〜1.0の範囲外の座標が返ってもパース可能であることを確認する
	geminiResp := map[string]any{
		"candidates": []map[string]any{
			{
				"content": map[string]any{
					"parts": []map[string]any{
						{
							"text": `{"items":[{"product_name":"炭火焼紅しゃけおにぎり","bounding_box":{"x_min":-0.05,"y_min":0.2,"x_max":0.35,"y_max":0.7}}]}`,
						},
					},
				},
			},
		},
	}

	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		if err := json.NewEncoder(w).Encode(geminiResp); err != nil {
			http.Error(w, "encode error", http.StatusInternalServerError)
		}
	}))
	defer srv.Close()

	svc := services.NewGeminiServiceWithURL("test-key", srv.URL)
	imageData := []byte{0xFF, 0xD8, 0xFF, 0xE0}
	productNames := []string{"炭火焼紅しゃけおにぎり"}

	items, err := svc.Recognize(context.Background(), imageData, productNames)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(items) != 1 {
		t.Fatalf("expected 1 item, got %d", len(items))
	}
	if items[0].BoundingBox.XMin != -0.05 {
		t.Errorf("expected x_min -0.05, got %f", items[0].BoundingBox.XMin)
	}
}

func TestGeminiService_Recognize_EmptyItems(t *testing.T) {
	geminiResp := map[string]any{
		"candidates": []map[string]any{
			{
				"content": map[string]any{
					"parts": []map[string]any{
						{
							"text": `{"items":[]}`,
						},
					},
				},
			},
		},
	}

	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		if err := json.NewEncoder(w).Encode(geminiResp); err != nil {
			http.Error(w, "encode error", http.StatusInternalServerError)
		}
	}))
	defer srv.Close()

	svc := services.NewGeminiServiceWithURL("test-key", srv.URL)
	imageData := []byte{0xFF, 0xD8, 0xFF, 0xE0}
	productNames := []string{"炭火焼紅しゃけおにぎり"}

	items, err := svc.Recognize(context.Background(), imageData, productNames)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(items) != 0 {
		t.Errorf("expected 0 items, got %d", len(items))
	}
}
