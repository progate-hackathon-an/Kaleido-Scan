package services

import (
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
)

const geminiDefaultBaseURL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"

// GeminiService はGemini 2.5 Flash Vision APIを使ったAIService実装。
type GeminiService struct {
	apiKey  string
	baseURL string
	client  *http.Client
}

// NewGeminiService はGeminiServiceを生成する。
func NewGeminiService(apiKey string) *GeminiService {
	return &GeminiService{
		apiKey:  apiKey,
		baseURL: geminiDefaultBaseURL,
		client:  &http.Client{},
	}
}

// NewGeminiServiceWithURL はテスト用にベースURLを指定してGeminiServiceを生成する。
func NewGeminiServiceWithURL(apiKey, baseURL string) *GeminiService {
	return &GeminiService{
		apiKey:  apiKey,
		baseURL: baseURL,
		client:  &http.Client{},
	}
}

// Recognize は画像データをGemini APIに送信し、検出商品リストを返す。
func (s *GeminiService) Recognize(ctx context.Context, imageData []byte, productNames []string) ([]AIItem, error) {
	mimeType := detectMIMEType(imageData)
	b64 := base64.StdEncoding.EncodeToString(imageData)

	prompt := buildPrompt(productNames)

	reqBody := map[string]any{
		"contents": []map[string]any{
			{
				"parts": []map[string]any{
					{
						"inlineData": map[string]string{
							"mimeType": mimeType,
							"data":     b64,
						},
					},
					{
						"text": prompt,
					},
				},
			},
		},
		"generationConfig": map[string]string{
			"responseMimeType": "application/json",
		},
	}

	body, err := json.Marshal(reqBody)
	if err != nil {
		return nil, fmt.Errorf("json.Marshal: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, s.baseURL, bytes.NewReader(body))
	if err != nil {
		return nil, fmt.Errorf("http.NewRequest: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	// APIキーはクエリパラメータではなくヘッダーで渡す（アクセスログへの漏洩防止）。
	req.Header.Set("x-goog-api-key", s.apiKey)

	resp, err := s.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("http.Do: %w", err)
	}
	defer func() {
		if err := resp.Body.Close(); err != nil {
			// レスポンスボディのクローズエラーはログ出力のみで継続
			_ = err
		}
	}()

	respBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("io.ReadAll: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("gemini API returned status %d: %s", resp.StatusCode, string(respBytes))
	}

	return parseGeminiResponse(respBytes)
}

// geminiCandidate はGemini APIレスポンスのcandidatesフィールドを表す。
type geminiCandidate struct {
	Content struct {
		Parts []struct {
			Text string `json:"text"`
		} `json:"parts"`
	} `json:"content"`
}

// geminiAPIResponse はGemini APIのレスポンス形式を表す。
type geminiAPIResponse struct {
	Candidates []geminiCandidate `json:"candidates"`
}

// aiItemsResult はAIが返すJSONの構造を表す。GeminiとBedrockで共通のスキーマ。
type aiItemsResult struct {
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

func parseGeminiResponse(respBytes []byte) ([]AIItem, error) {
	var apiResp geminiAPIResponse
	if err := json.Unmarshal(respBytes, &apiResp); err != nil {
		return nil, fmt.Errorf("json.Unmarshal apiResp: %w", err)
	}

	if len(apiResp.Candidates) == 0 || len(apiResp.Candidates[0].Content.Parts) == 0 {
		return []AIItem{}, nil
	}

	text := apiResp.Candidates[0].Content.Parts[0].Text

	var result aiItemsResult
	if err := json.Unmarshal([]byte(text), &result); err != nil {
		return nil, fmt.Errorf("json.Unmarshal items: %w", err)
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

// detectMIMEType はバイト列の先頭から画像のMIMEタイプを判定する。
func detectMIMEType(data []byte) string {
	if len(data) >= 2 && data[0] == 0xFF && data[1] == 0xD8 {
		return "image/jpeg"
	}
	if len(data) >= 4 && string(data[:4]) == "\x89PNG" {
		return "image/png"
	}
	if len(data) >= 12 && string(data[:4]) == "RIFF" && string(data[8:12]) == "WEBP" {
		return "image/webp"
	}
	return "image/jpeg"
}

// buildPrompt はapi-requirement.mdの仕様に従ってGemini用プロンプトを生成する。
func buildPrompt(productNames []string) string {
	var sb strings.Builder
	sb.WriteString("以下の画像を解析し、写っているコンビニ商品を識別してください。\n")
	sb.WriteString("識別可能な商品のみ返してください。\n\n")
	sb.WriteString("対象商品リスト（この中から識別してください）:\n")
	for _, name := range productNames {
		sb.WriteString("- ")
		sb.WriteString(name)
		sb.WriteString("\n")
	}
	sb.WriteString("\n以下のJSONスキーマで返してください:\n")
	sb.WriteString(`{
  "items": [
    {
      "product_name": "<対象商品リスト内の商品名のいずれか>",
      "bounding_box": {
        "x_min": <-1.5〜2.5>,
        "y_min": <-1.5〜2.5>,
        "x_max": <-1.5〜2.5>,
        "y_max": <-1.5〜2.5>
      }
    }
  ]
}`)
	sb.WriteString("\n\nバウンディングボックスは画像全体を1×1とした相対座標で表現してください。\n")
	sb.WriteString("商品が画像からはみ出している場合も、商品全体から推定した座標を返してください（-1.5〜2.5の範囲で指定）。\n")
	sb.WriteString("商品が検出できない場合は items を空配列で返してください。\n")
	sb.WriteString("対象商品リストにない商品名は絶対に返さないでください。\n")
	return sb.String()
}
