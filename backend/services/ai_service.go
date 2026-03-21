package services

import (
	"context"
)

// AIItem はAI認識結果の1商品エントリを表す。
type AIItem struct {
	ProductName string
	BoundingBox BoundingBox
}

// BoundingBox は商品正面ラベルの範囲を画像全体を1×1とした相対座標（0.0〜1.0）で表す。
type BoundingBox struct {
	XMin float64 `json:"x_min"`
	YMin float64 `json:"y_min"`
	XMax float64 `json:"x_max"`
	YMax float64 `json:"y_max"`
}

// AIError はAI API呼び出し失敗を表すエラー型。
type AIError struct {
	Cause error
}

func (e *AIError) Error() string {
	if e.Cause != nil {
		return "ai error: " + e.Cause.Error()
	}
	return "ai error"
}

func (e *AIError) Unwrap() error {
	return e.Cause
}

// AIService はAI画像認識サービスのインターフェース。
type AIService interface {
	// Recognize は画像データと商品名リストを受け取り、検出された商品のリストを返す。
	Recognize(ctx context.Context, imageData []byte, productNames []string) ([]AIItem, error)
}

// NewAIService はAI_PROVIDER環境変数に従ってAIServiceを生成するファクトリ。
// provider: "gemini" または "bedrock"
func NewAIService(provider, geminiAPIKey, awsRegion, bedrockModelID string) (AIService, error) {
	switch provider {
	case "bedrock":
		return NewBedrockService(awsRegion, bedrockModelID)
	default:
		return NewGeminiService(geminiAPIKey), nil
	}
}
