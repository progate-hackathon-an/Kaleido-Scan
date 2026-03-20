package services

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"

	"github.com/aws/aws-sdk-go-v2/aws"
	awsconfig "github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/bedrockruntime"
	brdocument "github.com/aws/aws-sdk-go-v2/service/bedrockruntime/document"
	"github.com/aws/aws-sdk-go-v2/service/bedrockruntime/types"
)

const bedrockDefaultModelID = "anthropic.claude-sonnet-4-5"

// BedrockRuntimeClient はBedrockRuntime APIのインターフェース。
// テスト時にモックを注入できるよう抽象化する。
type BedrockRuntimeClient interface {
	Converse(ctx context.Context, params *bedrockruntime.ConverseInput, optFns ...func(*bedrockruntime.Options)) (*bedrockruntime.ConverseOutput, error)
}

// BedrockService はAWS Bedrock（Claude Sonnet）を使ったAIService実装。
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

// Recognize は画像データをBedrock（Claude Sonnet）に送信し、検出商品リストを返す。
// additionalModelRequestFields に JSON Schema を渡すことで出力形式をモデルレベルで強制する。
// product_name の enum に商品名リストを設定し、存在しない商品名の返却を根本から防ぐ。
func (s *BedrockService) Recognize(ctx context.Context, imageData []byte, productNames []string) ([]AIItem, error) {
	mimeType := detectMIMEType(imageData)
	prompt := buildBedrockPrompt(productNames)

	output, err := s.client.Converse(ctx, &bedrockruntime.ConverseInput{
		ModelId: aws.String(s.modelID),
		Messages: []types.Message{
			{
				Role: types.ConversationRoleUser,
				Content: []types.ContentBlock{
					&types.ContentBlockMemberImage{
						Value: types.ImageBlock{
							Format: toBedrockImageFormat(mimeType),
							Source: &types.ImageSourceMemberBytes{
								Value: imageData,
							},
						},
					},
					&types.ContentBlockMemberText{
						Value: prompt,
					},
				},
			},
		},
		// JSON Schema を渡してモデルの出力形式を強制する。
		// product_name の enum に商品名リストを設定するため、
		// プロンプト内にスキーマ指示を書く必要はない。
		AdditionalModelRequestFields: brdocument.NewLazyDocument(
			buildProductSchema(productNames),
		),
	})
	if err != nil {
		return nil, &AIError{Cause: fmt.Errorf("bedrock Converse: %w", err)}
	}

	return parseBedrockResponse(output)
}

func parseBedrockResponse(output *bedrockruntime.ConverseOutput) ([]AIItem, error) {
	msg, ok := output.Output.(*types.ConverseOutputMemberMessage)
	if !ok || len(msg.Value.Content) == 0 {
		return []AIItem{}, nil
	}

	textBlock, ok := msg.Value.Content[0].(*types.ContentBlockMemberText)
	if !ok {
		return []AIItem{}, nil
	}

	var result aiItemsResult
	if err := json.Unmarshal([]byte(textBlock.Value), &result); err != nil {
		return nil, fmt.Errorf("json.Unmarshal bedrock items: %w", err)
	}

	items := make([]AIItem, 0, len(result.Items))
	for _, it := range result.Items {
		items = append(items, AIItem{
			ProductName: it.ProductName,
			BoundingBox: BoundingBox{
				XMin: it.BoundingBox.XMin,
				YMin: it.BoundingBox.YMin,
				XMax: it.BoundingBox.XMax,
				YMax: it.BoundingBox.YMax,
			},
		})
	}
	return items, nil
}

// buildBedrockPrompt はBedrock用プロンプトを生成する。
// JSON Schema は additionalModelRequestFields で渡すため、プロンプト内にスキーマ指示は含めない。
func buildBedrockPrompt(productNames []string) string {
	var sb strings.Builder
	sb.WriteString("以下の画像を解析し、写っているコンビニ商品を識別してください。\n")
	sb.WriteString("識別可能な商品のみ返してください。\n\n")
	sb.WriteString("対象商品リスト（この中から識別してください）:\n")
	for _, name := range productNames {
		sb.WriteString("- ")
		sb.WriteString(name)
		sb.WriteString("\n")
	}
	sb.WriteString("\nバウンディングボックスは画像全体を1×1とした相対座標で表現してください。\n")
	sb.WriteString("商品が画像からはみ出している場合も、商品全体から推定した座標を返してください（-1.5〜2.5の範囲で指定）。\n")
	sb.WriteString("商品が検出できない場合は items を空配列で返してください。\n")
	return sb.String()
}

// buildProductSchema は商品認識結果のJSON Schemaを生成する。
// product_name の enum に商品名リストを設定することで、存在しない商品名の返却をモデルレベルで防ぐ。
func buildProductSchema(productNames []string) map[string]interface{} {
	enum := make([]interface{}, len(productNames))
	for i, name := range productNames {
		enum[i] = name
	}

	numberAxis := func() map[string]interface{} {
		return map[string]interface{}{
			"type":    "number",
			"minimum": float64(-1.5),
			"maximum": float64(2.5),
		}
	}

	return map[string]interface{}{
		"type": "object",
		"properties": map[string]interface{}{
			"items": map[string]interface{}{
				"type": "array",
				"items": map[string]interface{}{
					"type": "object",
					"properties": map[string]interface{}{
						"product_name": map[string]interface{}{
							"type": "string",
							"enum": enum,
						},
						"bounding_box": map[string]interface{}{
							"type": "object",
							"properties": map[string]interface{}{
								"x_min": numberAxis(),
								"y_min": numberAxis(),
								"x_max": numberAxis(),
								"y_max": numberAxis(),
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
