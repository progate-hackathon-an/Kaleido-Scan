package services

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/aws/aws-sdk-go-v2/aws"
	awsconfig "github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/bedrockruntime"
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
func (s *BedrockService) Recognize(ctx context.Context, imageData []byte, productNames []string) ([]AIItem, error) {
	mimeType := detectMIMEType(imageData)
	prompt := buildPrompt(productNames)

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
