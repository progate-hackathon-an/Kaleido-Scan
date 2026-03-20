// パッケージ内テスト（unexportedの buildProductSchema を直接テストする）
package services

import (
	"testing"
)

func TestBuildProductSchema_ContainsProductNamesInEnum(t *testing.T) {
	productNames := []string{"炭火焼紅しゃけおにぎり", "ツナマヨおにぎり"}
	schema := buildProductSchema(productNames)

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

func TestBuildProductSchema_TopLevelRequiredItems(t *testing.T) {
	schema := buildProductSchema([]string{"商品A"})

	required, ok := schema["required"].([]string)
	if !ok {
		t.Fatalf("expected required to be []string, got %T", schema["required"])
	}
	if len(required) != 1 || required[0] != "items" {
		t.Errorf("expected required=[items], got %v", required)
	}
}

func TestBuildProductSchema_BoundingBoxHasNumberBounds(t *testing.T) {
	schema := buildProductSchema([]string{"商品A"})

	bbox := extractBoundingBoxSchema(t, schema)
	bboxProps := bbox["properties"].(map[string]interface{})

	for _, axis := range []string{"x_min", "y_min", "x_max", "y_max"} {
		axisSchema := bboxProps[axis].(map[string]interface{})
		if axisSchema["minimum"].(float64) != -1.5 {
			t.Errorf("%s: expected minimum -1.5, got %v", axis, axisSchema["minimum"])
		}
		if axisSchema["maximum"].(float64) != 2.5 {
			t.Errorf("%s: expected maximum 2.5, got %v", axis, axisSchema["maximum"])
		}
	}
}

// --- ヘルパー ---

func extractEnum(t *testing.T, schema map[string]interface{}) []interface{} {
	t.Helper()
	props := schema["properties"].(map[string]interface{})
	itemsArray := props["items"].(map[string]interface{})
	itemSchema := itemsArray["items"].(map[string]interface{})
	itemProps := itemSchema["properties"].(map[string]interface{})
	productName := itemProps["product_name"].(map[string]interface{})
	return productName["enum"].([]interface{})
}

func extractBoundingBoxSchema(t *testing.T, schema map[string]interface{}) map[string]interface{} {
	t.Helper()
	props := schema["properties"].(map[string]interface{})
	itemsArray := props["items"].(map[string]interface{})
	itemSchema := itemsArray["items"].(map[string]interface{})
	itemProps := itemSchema["properties"].(map[string]interface{})
	return itemProps["bounding_box"].(map[string]interface{})
}
