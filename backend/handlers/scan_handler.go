package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// ScanRanking は POST /scan/ranking を処理する。
// multipart/form-data の image フィールドを受け取り、固定の5商品をランキング付きで返す。
func ScanRanking(c *gin.Context) {
	_, _, err := c.Request.FormFile("image")
	if err != nil {
		c.JSON(http.StatusBadRequest, newErrorResponse("invalid_image", "画像ファイルが送信されていません"))
		return
	}

	c.JSON(http.StatusOK, gin.H{"detected_items": stubProducts})
}
