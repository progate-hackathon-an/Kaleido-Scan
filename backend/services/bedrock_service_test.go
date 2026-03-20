package services_test

import (
	"context"
	"errors"
	"testing"

	"github.com/Hiru-ge/Kaleido-Scan/backend/services"
	"github.com/aws/aws-sdk-go-v2/service/bedrockruntime"
	"github.com/aws/aws-sdk-go-v2/service/bedrockruntime/types"
)

// mockBedrockClient はBedrockRuntimeClientのテスト用モック実装。
type mockBedrockClient struct {
	output *bedrockruntime.ConverseOutput
	err    error
}

func (m *mockBedrockClient) Converse(ctx context.Context, params *bedrockruntime.ConverseInput, optFns ...func(*bedrockruntime.Options)) (*bedrockruntime.ConverseOutput, error) {
	return m.output, m.err
}

// makeBedrockOutput はテキストレスポンスを持つConverseOutputを生成するヘルパー。
func makeBedrockOutput(text string) *bedrockruntime.ConverseOutput {
	return &bedrockruntime.ConverseOutput{
		Output: &types.ConverseOutputMemberMessage{
			Value: types.Message{
				Role: types.ConversationRoleAssistant,
				Content: []types.ContentBlock{
					&types.ContentBlockMemberText{Value: text},
				},
			},
		},
	}
}

func TestBedrockService_Recognize_Success(t *testing.T) {
	mock := &mockBedrockClient{
		output: makeBedrockOutput(`{"items":[{"product_name":"炭火焼紅しゃけおにぎり","bounding_box":{"x_min":0.1,"y_min":0.2,"x_max":0.4,"y_max":0.7}}]}`),
	}

	svc := services.NewBedrockServiceWithClient(mock, "test-model")
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
		t.Errorf("expected '炭火焼紅しゃけおにぎり', got '%s'", items[0].ProductName)
	}
	if items[0].BoundingBox.XMin != 0.1 {
		t.Errorf("expected x_min 0.1, got %f", items[0].BoundingBox.XMin)
	}
}

func TestBedrockService_Recognize_OutOfRangeBoundingBox(t *testing.T) {
	// 商品が画像からはみ出している場合、0.0〜1.0の範囲外の座標も許容する
	mock := &mockBedrockClient{
		output: makeBedrockOutput(`{"items":[{"product_name":"炭火焼紅しゃけおにぎり","bounding_box":{"x_min":-0.05,"y_min":0.2,"x_max":0.35,"y_max":0.7}}]}`),
	}

	svc := services.NewBedrockServiceWithClient(mock, "test-model")
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

func TestBedrockService_Recognize_EmptyItems(t *testing.T) {
	mock := &mockBedrockClient{
		output: makeBedrockOutput(`{"items":[]}`),
	}

	svc := services.NewBedrockServiceWithClient(mock, "test-model")
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

func TestBedrockService_Recognize_APIError(t *testing.T) {
	mock := &mockBedrockClient{
		err: errors.New("bedrock: AccessDeniedException"),
	}

	svc := services.NewBedrockServiceWithClient(mock, "test-model")
	imageData := []byte{0xFF, 0xD8, 0xFF, 0xE0}
	productNames := []string{"炭火焼紅しゃけおにぎり"}

	_, err := svc.Recognize(context.Background(), imageData, productNames)
	if err == nil {
		t.Fatal("expected error, got nil")
	}
	var aiErr *services.AIError
	if !errors.As(err, &aiErr) {
		t.Errorf("expected *services.AIError, got %T", err)
	}
}
