package handlers

import (
	"context"
	"errors"
	"io"
	"log"
	"net/http"

	"github.com/Hiru-ge/Kaleid-Scan/backend/services"
	"github.com/gin-gonic/gin"
)

const maxImageSize = 10 * 1024 * 1024 // 10MB

// ScanRanker はScanHandlerが依存するScanServiceインターフェース（DIP原則）。
type ScanRanker interface {
	GetRanking(ctx context.Context, imageData []byte) ([]services.ScanResult, error)
}

// HiddenGemsGetter はHiddenGemsHandlerが依存するサービスインターフェース（DIP原則）。
type HiddenGemsGetter interface {
	GetHiddenGemsRanking(ctx context.Context, imageData []byte) ([]services.HiddenGemResult, error)
}

// TrendingRanker はScanHandlerが依存するTrendingServiceインターフェース（DIP原則）。
type TrendingRanker interface {
	GetTrendingRanking(ctx context.Context, imageData []byte) ([]services.TrendingResult, error)
}

// ScanHandler は /scan/ranking と /scan/trending エンドポイントのハンドラ。
type ScanHandler struct {
	svc      ScanRanker
	trending TrendingRanker
}

// NewScanHandler はScanHandlerを生成する。
func NewScanHandler(svc ScanRanker, trending TrendingRanker) *ScanHandler {
	return &ScanHandler{svc: svc, trending: trending}
}

// readImageFromForm は multipart フォームから "image" フィールドを読み取り、バイト列を返す。
// エラー時はレスポンスを書き込み false を返す。
func readImageFromForm(c *gin.Context) ([]byte, bool) {
	file, _, err := c.Request.FormFile("image")
	if err != nil {
		ErrorResponse(c, http.StatusBadRequest, "invalid_image", "画像ファイルが送信されていません")
		return nil, false
	}
	defer func() {
		if err := file.Close(); err != nil {
			_ = err // multipart FileHeader.Close は通常エラーを返さない
		}
	}()

	imageData, err := io.ReadAll(io.LimitReader(file, maxImageSize+1))
	if err != nil {
		ErrorResponse(c, http.StatusInternalServerError, "internal_error", "画像の読み込みに失敗しました")
		return nil, false
	}
	if len(imageData) > maxImageSize {
		ErrorResponse(c, http.StatusBadRequest, "image_too_large", "画像サイズが上限（10MB）を超えています")
		return nil, false
	}
	return imageData, true
}

// handleScanServiceError はサービス層のエラーを適切なHTTPレスポンスに変換する。
func handleScanServiceError(c *gin.Context, err error) {
	var aiErr *services.AIError
	if errors.As(err, &aiErr) {
		log.Printf("AI service error: %v", err)
		c.Error(err) //nolint:errcheck
		ErrorResponse(c, http.StatusInternalServerError, "ai_error", "AI APIの呼び出しに失敗しました")
	} else {
		c.Error(err) //nolint:errcheck
		ErrorResponse(c, http.StatusInternalServerError, "internal_error", "サーバー内部エラーが発生しました")
	}
}

// ScanRanking は POST /scan/ranking を処理する。
// multipart/form-data の image フィールドを受け取り、AI識別とランキング取得を行う。
func (h *ScanHandler) ScanRanking(c *gin.Context) {
	imageData, ok := readImageFromForm(c)
	if !ok {
		return
	}

	results, err := h.svc.GetRanking(c.Request.Context(), imageData)
	if err != nil {
		handleScanServiceError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{"detected_items": results})
}

// HiddenGemsHandler は /scan/hidden-gems エンドポイントのハンドラ。
type HiddenGemsHandler struct {
	svc HiddenGemsGetter
}

// NewHiddenGemsHandler はHiddenGemsHandlerを生成する。
func NewHiddenGemsHandler(svc HiddenGemsGetter) *HiddenGemsHandler {
	return &HiddenGemsHandler{svc: svc}
}

// ScanHiddenGems は POST /scan/hidden-gems を処理する。
// multipart/form-data の image フィールドを受け取り、AI識別と掘り出し物ランキング取得を行う。
func (h *HiddenGemsHandler) ScanHiddenGems(c *gin.Context) {
	imageData, ok := readImageFromForm(c)
	if !ok {
		return
	}

	results, err := h.svc.GetHiddenGemsRanking(c.Request.Context(), imageData)
	if err != nil {
		handleScanServiceError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{"detected_items": results})
}

// ScanTrending は POST /scan/trending を処理する。
// multipart/form-data の image フィールドを受け取り、AI識別と急上昇ランキング取得を行う。
func (h *ScanHandler) ScanTrending(c *gin.Context) {
	imageData, ok := readImageFromForm(c)
	if !ok {
		return
	}

	results, err := h.trending.GetTrendingRanking(c.Request.Context(), imageData)
	if err != nil {
		handleScanServiceError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{"detected_items": results})
}
