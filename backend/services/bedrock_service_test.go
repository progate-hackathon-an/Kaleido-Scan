package services_test

import (
	"context"
	"errors"
	"testing"

	"github.com/Hiru-ge/Kaleido-Scan/backend/services"
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/bedrockruntime"
	bedrockdoc "github.com/aws/aws-sdk-go-v2/service/bedrockruntime/document"
	"github.com/aws/aws-sdk-go-v2/service/bedrockruntime/types"
)

// mockBedrockClient はBedrockRuntimeClientのテスト用モック実装。
// outputs に複数のレスポンスを設定すると呼び出し順に返す。
type mockBedrockClient struct {
	outputs        []*bedrockruntime.ConverseOutput
	errs           []error
	callCount      int
	capturedInputs []*bedrockruntime.ConverseInput
}

func (m *mockBedrockClient) Converse(_ context.Context, params *bedrockruntime.ConverseInput, _ ...func(*bedrockruntime.Options)) (*bedrockruntime.ConverseOutput, error) {
	m.capturedInputs = append(m.capturedInputs, params)
	i := m.callCount
	m.callCount++

	var out *bedrockruntime.ConverseOutput
	if i < len(m.outputs) {
		out = m.outputs[i]
	}
	var err error
	if i < len(m.errs) {
		err = m.errs[i]
	}
	return out, err
}

// makeRecognizeOutput は recognize_products ツール呼び出しのレスポンスを生成するヘルパー。
// Nova の0〜1000座標スケールを使用する。
func makeRecognizeOutput(items []map[string]any) *bedrockruntime.ConverseOutput {
	return &bedrockruntime.ConverseOutput{
		Output: &types.ConverseOutputMemberMessage{
			Value: types.Message{
				Role: types.ConversationRoleAssistant,
				Content: []types.ContentBlock{
					&types.ContentBlockMemberToolUse{
						Value: types.ToolUseBlock{
							ToolUseId: aws.String("tool-1"),
							Name:      aws.String("recognize_products"),
							Input:     bedrockdoc.NewLazyDocument(map[string]any{"items": items}),
						},
					},
				},
			},
		},
	}
}

func TestBedrockService_Recognize_Success(t *testing.T) {
	mock := &mockBedrockClient{
		outputs: []*bedrockruntime.ConverseOutput{
			makeRecognizeOutput([]map[string]any{
				{
					"product_name": "炭火焼紅しゃけおにぎり",
					// Nova スケール（0〜1000）で指定 → 0.1, 0.2, 0.4, 0.7 に正規化される
					"bounding_box": map[string]any{"x_min": 100.0, "y_min": 200.0, "x_max": 400.0, "y_max": 700.0},
				},
			}),
		},
	}

	svc := services.NewBedrockServiceWithClient(mock, "test-model")
	items, err := svc.Recognize(context.Background(), []byte{0xFF, 0xD8, 0xFF, 0xE0}, []string{"炭火焼紅しゃけおにぎり", "ツナマヨおにぎり"})
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
	if mock.callCount != 1 {
		t.Errorf("expected 1 API call (single-stage), got %d", mock.callCount)
	}
}

func TestBedrockService_Recognize_EmptyItems(t *testing.T) {
	mock := &mockBedrockClient{
		outputs: []*bedrockruntime.ConverseOutput{
			makeRecognizeOutput([]map[string]any{}),
		},
	}

	svc := services.NewBedrockServiceWithClient(mock, "test-model")
	items, err := svc.Recognize(context.Background(), []byte{0xFF, 0xD8, 0xFF, 0xE0}, []string{"炭火焼紅しゃけおにぎり"})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(items) != 0 {
		t.Errorf("expected 0 items, got %d", len(items))
	}
	if mock.callCount != 1 {
		t.Errorf("expected 1 API call, got %d", mock.callCount)
	}
}

func TestBedrockService_Recognize_UsesCorrectTool(t *testing.T) {
	mock := &mockBedrockClient{
		outputs: []*bedrockruntime.ConverseOutput{
			makeRecognizeOutput([]map[string]any{}),
		},
	}

	svc := services.NewBedrockServiceWithClient(mock, "test-model")
	_, err := svc.Recognize(context.Background(), []byte{0xFF, 0xD8, 0xFF, 0xE0}, []string{"商品A"})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if mock.callCount != 1 {
		t.Fatalf("expected 1 API call, got %d", mock.callCount)
	}

	input := mock.capturedInputs[0]
	if input.ToolConfig == nil {
		t.Fatal("expected ToolConfig to be set")
	}
	tool := input.ToolConfig.Tools[0].(*types.ToolMemberToolSpec)
	if aws.ToString(tool.Value.Name) != "recognize_products" {
		t.Errorf("expected tool 'recognize_products', got '%s'", aws.ToString(tool.Value.Name))
	}
	choice := input.ToolConfig.ToolChoice.(*types.ToolChoiceMemberTool)
	if aws.ToString(choice.Value.Name) != "recognize_products" {
		t.Errorf("expected tool choice 'recognize_products', got '%s'", aws.ToString(choice.Value.Name))
	}
}

func TestBedrockService_Recognize_NormalizesNovaCoordinates(t *testing.T) {
	mock := &mockBedrockClient{
		outputs: []*bedrockruntime.ConverseOutput{
			makeRecognizeOutput([]map[string]any{
				{
					"product_name": "商品A",
					"bounding_box": map[string]any{"x_min": 0.0, "y_min": 500.0, "x_max": 1000.0, "y_max": 1000.0},
				},
			}),
		},
	}

	svc := services.NewBedrockServiceWithClient(mock, "test-model")
	items, err := svc.Recognize(context.Background(), []byte{0xFF, 0xD8, 0xFF, 0xE0}, []string{"商品A"})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(items) != 1 {
		t.Fatalf("expected 1 item, got %d", len(items))
	}
	if items[0].BoundingBox.XMin != 0.0 {
		t.Errorf("expected x_min 0.0, got %f", items[0].BoundingBox.XMin)
	}
	if items[0].BoundingBox.YMin != 0.5 {
		t.Errorf("expected y_min 0.5, got %f", items[0].BoundingBox.YMin)
	}
	if items[0].BoundingBox.XMax != 1.0 {
		t.Errorf("expected x_max 1.0, got %f", items[0].BoundingBox.XMax)
	}
	if items[0].BoundingBox.YMax != 1.0 {
		t.Errorf("expected y_max 1.0, got %f", items[0].BoundingBox.YMax)
	}
}

func TestBedrockService_Recognize_APIError(t *testing.T) {
	mock := &mockBedrockClient{
		errs: []error{errors.New("bedrock: AccessDeniedException")},
	}

	svc := services.NewBedrockServiceWithClient(mock, "test-model")
	_, err := svc.Recognize(context.Background(), []byte{0xFF, 0xD8, 0xFF, 0xE0}, []string{"炭火焼紅しゃけおにぎり"})
	if err == nil {
		t.Fatal("expected error, got nil")
	}
	var aiErr *services.AIError
	if !errors.As(err, &aiErr) {
		t.Errorf("expected *services.AIError, got %T", err)
	}
}
