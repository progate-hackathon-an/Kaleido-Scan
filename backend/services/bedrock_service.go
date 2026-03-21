package services

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"strings"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	awsconfig "github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/bedrockruntime"
	bedrockdoc "github.com/aws/aws-sdk-go-v2/service/bedrockruntime/document"
	"github.com/aws/aws-sdk-go-v2/service/bedrockruntime/types"
)

const bedrockDefaultModelID = "us.amazon.nova-pro-v1:0"

// BedrockRuntimeClient はBedrockRuntime APIのインターフェース。
// テスト時にモックを注入できるよう抽象化する。
type BedrockRuntimeClient interface {
	Converse(ctx context.Context, params *bedrockruntime.ConverseInput, optFns ...func(*bedrockruntime.Options)) (*bedrockruntime.ConverseOutput, error)
}

// BedrockService はAWS Bedrock（Amazon Nova Pro）を使ったAIService実装。
// Lambda上ではIAMロールによる自動認証を使用する。
type BedrockService struct {
	client  BedrockRuntimeClient
	modelID string
}

// NewBedrockService はBedrockServiceを生成する。
// AWS認証はIAMロール（Lambda）または環境変数（AWS_ACCESS_KEY_ID等）を自動使用する。
func NewBedrockService(region, modelID string) (*BedrockService, error) {
	cfg, err := awsconfig.LoadDefaultConfig(context.Background(), awsconfig.WithRegion(region))
	if err != nil {
		return nil, fmt.Errorf("aws config load: %w", err)
	}
	if modelID == "" {
		modelID = bedrockDefaultModelID
	}
	return &BedrockService{
		client:  bedrockruntime.NewFromConfig(cfg),
		modelID: modelID,
	}, nil
}

// NewBedrockServiceWithClient はテスト用にクライアントを注入してBedrockServiceを生成する。
func NewBedrockServiceWithClient(client BedrockRuntimeClient, modelID string) *BedrockService {
	return &BedrockService{client: client, modelID: modelID}
}

// Recognize は画像から商品を識別し、bboxを1回のAPI呼び出しで返す。
// Amazon Nova Pro のビジュアルグラウンディング機能を活用する。
func (s *BedrockService) Recognize(ctx context.Context, imageData []byte, productNames []string) ([]AIItem, error) {
	mimeType := detectMIMEType(imageData)

	log.Printf("[bedrock] Recognize start: modelID=%s imageSize=%dB products=%d", s.modelID, len(imageData), len(productNames))

	start := time.Now()
	output, err := s.client.Converse(ctx, &bedrockruntime.ConverseInput{
		ModelId:  aws.String(s.modelID),
		Messages: []types.Message{buildImageMessage(imageData, mimeType, buildRecognizePrompt(productNames))},
		ToolConfig: &types.ToolConfiguration{
			Tools: []types.Tool{
				&types.ToolMemberToolSpec{
					Value: types.ToolSpecification{
						Name:        aws.String("recognize_products"),
						Description: aws.String("画像内に写っているコンビニ商品とその正面ラベルのバウンディングボックスを返す"),
						InputSchema: &types.ToolInputSchemaMemberJson{
							Value: bedrockdoc.NewLazyDocument(buildRecognizeSchema(productNames)),
						},
					},
				},
			},
			ToolChoice: &types.ToolChoiceMemberTool{
				Value: types.SpecificToolChoice{Name: aws.String("recognize_products")},
			},
		},
	})
	elapsed := time.Since(start)
	if err != nil {
		log.Printf("[bedrock] Recognize error (elapsed=%.2fs): %v", elapsed.Seconds(), err)
		return nil, &AIError{Cause: fmt.Errorf("bedrock Converse Recognize: %w", err)}
	}
	logConverseMetrics("Recognize", output, elapsed)

	return parseRecognizeResponse(output)
}

// buildImageMessage は画像とテキストを含むConverseメッセージを生成する。
func buildImageMessage(imageData []byte, mimeType, prompt string) types.Message {
	return types.Message{
		Role: types.ConversationRoleUser,
		Content: []types.ContentBlock{
			&types.ContentBlockMemberImage{
				Value: types.ImageBlock{
					Format: toBedrockImageFormat(mimeType),
					Source: &types.ImageSourceMemberBytes{Value: imageData},
				},
			},
			&types.ContentBlockMemberText{Value: prompt},
		},
	}
}

// buildRecognizePrompt は商品識別＋位置特定の1段階処理用プロンプトを生成する。
func buildRecognizePrompt(productNames []string) string {
	var sb strings.Builder
	sb.WriteString("以下の画像を解析し、写っているコンビニ商品を識別して、各商品の正面ラベルのバウンディングボックスを返してください。\n")
	sb.WriteString("対象商品リストに含まれる商品のみ返してください。\n\n")
	sb.WriteString("対象商品リスト（この中から識別してください）:\n")
	for _, name := range productNames {
		sb.WriteString("- ")
		sb.WriteString(name)
		sb.WriteString("\n")
	}
	sb.WriteString("\nバウンディングボックスは商品の正面ラベル（商品名・デザインが印刷されている面）を囲む最小の矩形を、")
	sb.WriteString("画像全体を0〜1000のスケールで表現してください。\n")
	sb.WriteString("商品が検出できない場合はitemsを空配列で返してください。\n")
	return sb.String()
}

// buildRecognizeSchema は1段階処理用JSONスキーマを生成する（Nova の0〜1000座標スケール）。
func buildRecognizeSchema(productNames []string) map[string]any {
	enum := make([]any, len(productNames))
	for i, name := range productNames {
		enum[i] = name
	}
	coordAxis := func() map[string]any {
		return map[string]any{
			"type":    "number",
			"minimum": float64(0),
			"maximum": float64(1000),
		}
	}
	return map[string]any{
		"type": "object",
		"properties": map[string]any{
			"items": map[string]any{
				"type": "array",
				"items": map[string]any{
					"type": "object",
					"properties": map[string]any{
						"product_name": map[string]any{
							"type": "string",
							"enum": enum,
						},
						"bounding_box": map[string]any{
							"type": "object",
							"properties": map[string]any{
								"x_min": coordAxis(),
								"y_min": coordAxis(),
								"x_max": coordAxis(),
								"y_max": coordAxis(),
							},
							"required": []string{"x_min", "y_min", "x_max", "y_max"},
						},
					},
					"required": []string{"product_name", "bounding_box"},
				},
			},
		},
		"required": []string{"items"},
	}
}

// logConverseMetrics はBedrockのレスポンスからトークン数・レイテンシをログ出力する。
func logConverseMetrics(stage string, output *bedrockruntime.ConverseOutput, clientElapsed time.Duration) {
	var inputTokens, outputTokens int32
	if output.Usage != nil {
		inputTokens = aws.ToInt32(output.Usage.InputTokens)
		outputTokens = aws.ToInt32(output.Usage.OutputTokens)
	}
	var bedrockLatencyMs int64
	if output.Metrics != nil {
		bedrockLatencyMs = aws.ToInt64(output.Metrics.LatencyMs)
	}
	log.Printf("[bedrock] %s success: inputTokens=%d outputTokens=%d totalTokens=%d bedrockLatency=%dms clientElapsed=%.2fs",
		stage, inputTokens, outputTokens, inputTokens+outputTokens, bedrockLatencyMs, clientElapsed.Seconds())
}

// parseRecognizeResponse はレスポンスからAIItemリストを取り出す。
// Nova の0〜1000座標スケールを0.0〜1.0に正規化する。
func parseRecognizeResponse(output *bedrockruntime.ConverseOutput) ([]AIItem, error) {
	msg, ok := output.Output.(*types.ConverseOutputMemberMessage)
	if !ok || len(msg.Value.Content) == 0 {
		return []AIItem{}, nil
	}
	for _, block := range msg.Value.Content {
		toolUse, ok := block.(*types.ContentBlockMemberToolUse)
		if !ok {
			continue
		}
		return parseRecognizeToolInput(toolUse.Value.Input)
	}
	return []AIItem{}, nil
}

func parseRecognizeToolInput(input bedrockdoc.Interface) ([]AIItem, error) {
	inputBytes, err := input.MarshalSmithyDocument()
	if err != nil {
		return nil, fmt.Errorf("MarshalSmithyDocument recognize input: %w", err)
	}
	log.Printf("[bedrock] Recognize tool use input: %s", inputBytes)

	var result struct {
		Items []struct {
			ProductName string `json:"product_name"`
			BoundingBox struct {
				XMin float64 `json:"x_min"`
				YMin float64 `json:"y_min"`
				XMax float64 `json:"x_max"`
				YMax float64 `json:"y_max"`
			} `json:"bounding_box"`
		} `json:"items"`
	}
	if err := json.Unmarshal(inputBytes, &result); err != nil {
		return nil, fmt.Errorf("json.Unmarshal recognize input: %w", err)
	}

	items := make([]AIItem, 0, len(result.Items))
	for _, it := range result.Items {
		items = append(items, AIItem{
			ProductName: it.ProductName,
			BoundingBox: BoundingBox{
				XMin: it.BoundingBox.XMin / 1000.0,
				YMin: it.BoundingBox.YMin / 1000.0,
				XMax: it.BoundingBox.XMax / 1000.0,
				YMax: it.BoundingBox.YMax / 1000.0,
			},
		})
	}
	return items, nil
}

// toBedrockImageFormat はMIMEタイプをBedrockのImageFormat型に変換する。
func toBedrockImageFormat(mimeType string) types.ImageFormat {
	switch mimeType {
	case "image/png":
		return types.ImageFormatPng
	case "image/webp":
		return types.ImageFormatWebp
	default:
		return types.ImageFormatJpeg
	}
}
