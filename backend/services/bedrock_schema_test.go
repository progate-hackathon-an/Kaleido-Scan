// パッケージ内テスト（unexportedの buildRecognizeSchema を直接テストする）
package services

import (
	"testing"
)

func TestBuildRecognizeSchema_ContainsProductNamesInEnum(t *testing.T) {
	productNames := []string{"炭火焼紅しゃけおにぎり", "ツナマヨおにぎり"}
	schema := buildRecognizeSchema(productNames)

	enum := extractEnum(t, schema)
	if len(enum) != 2 {
		t.Fatalf("expected 2 enum values, got %d", len(enum))
	}
	if enum[0].(string) != "炭火焼紅しゃけおにぎり" {
		t.Errorf("expected first enum '炭火焼紅しゃけおにぎり', got '%v'", enum[0])
	}
	if enum[1].(string) != "ツナマヨおにぎり" {
		t.Errorf("expected second enum 'ツナマヨおにぎり', got '%v'", enum[1])
	}
}

func TestBuildRecognizeSchema_TopLevelRequiredItems(t *testing.T) {
	schema := buildRecognizeSchema([]string{"商品A"})

	required, ok := schema["required"].([]string)
	if !ok {
		t.Fatalf("expected required to be []string, got %T", schema["required"])
	}
	if len(required) != 1 || required[0] != "items" {
		t.Errorf("expected required=[items], got %v", required)
	}
}

func TestBuildRecognizeSchema_BoundingBoxHasNovaBounds(t *testing.T) {
	schema := buildRecognizeSchema([]string{"商品A"})

	bbox := extractBoundingBoxSchema(t, schema)
	bboxProps := bbox["properties"].(map[string]any)

	for _, axis := range []string{"x_min", "y_min", "x_max", "y_max"} {
		axisSchema := bboxProps[axis].(map[string]any)
		if axisSchema["minimum"].(float64) != 0 {
			t.Errorf("%s: expected minimum 0, got %v", axis, axisSchema["minimum"])
		}
		if axisSchema["maximum"].(float64) != 1000 {
			t.Errorf("%s: expected maximum 1000, got %v", axis, axisSchema["maximum"])
		}
	}
}

// --- ヘルパー ---

func extractEnum(t *testing.T, schema map[string]any) []any {
	t.Helper()
	props := schema["properties"].(map[string]any)
	itemsArray := props["items"].(map[string]any)
	itemSchema := itemsArray["items"].(map[string]any)
	itemProps := itemSchema["properties"].(map[string]any)
	productName := itemProps["product_name"].(map[string]any)
	return productName["enum"].([]any)
}

func extractBoundingBoxSchema(t *testing.T, schema map[string]any) map[string]any {
	t.Helper()
	props := schema["properties"].(map[string]any)
	itemsArray := props["items"].(map[string]any)
	itemSchema := itemsArray["items"].(map[string]any)
	itemProps := itemSchema["properties"].(map[string]any)
	return itemProps["bounding_box"].(map[string]any)
}
