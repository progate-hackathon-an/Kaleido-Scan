package handlers

import (
	"context"
	"errors"
	"io"
	"net/http"

	"github.com/Hiru-ge/Kaleid-Scan/backend/services"
	"github.com/gin-gonic/gin"
)

// ScanRanker はScanHandlerが依存するサービスインターフェース（DIP原則）。
type ScanRanker interface {
	GetRanking(ctx context.Context, imageData []byte) ([]services.ScanResult, error)
}

// ScanHandler は /scan/ranking エンドポイントのハンドラ。
type ScanHandler struct {
	svc ScanRanker
}

// NewScanHandler はScanHandlerを生成する。
func NewScanHandler(svc ScanRanker) *ScanHandler {
	return &ScanHandler{svc: svc}
}

// ScanRanking は POST /scan/ranking を処理する。
// multipart/form-data の image フィールドを受け取り、AI識別とランキング取得を行う。
func (h *ScanHandler) ScanRanking(c *gin.Context) {
	file, _, err := c.Request.FormFile("image")
	if err != nil {
		ErrorResponse(c, http.StatusBadRequest, "invalid_image", "画像ファイルが送信されていません")
		return
	}
	defer func() {
		if err := file.Close(); err != nil {
			_ = err // multipart FileHeader.Close は通常エラーを返さない
		}
	}()

	imageData, err := io.ReadAll(file)
	if err != nil {
		ErrorResponse(c, http.StatusInternalServerError, "internal_error", "画像の読み込みに失敗しました")
		return
	}

	results, err := h.svc.GetRanking(c.Request.Context(), imageData)
	if err != nil {
		var aiErr *services.AIError
		if errors.As(err, &aiErr) {
			c.Error(err) //nolint:errcheck
			ErrorResponse(c, http.StatusInternalServerError, "ai_error", "AI APIの呼び出しに失敗しました")
		} else {
			c.Error(err) //nolint:errcheck
			ErrorResponse(c, http.StatusInternalServerError, "internal_error", "サーバー内部エラーが発生しました")
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"detected_items": results})
}
