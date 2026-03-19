package routes

import (
	"net/http"

	"github.com/Hiru-ge/Kaleido-Scan/backend/handlers"
	"github.com/gin-gonic/gin"
)

// Setup はルーティングを設定する。
func Setup(r *gin.Engine, scanHandler *handlers.ScanHandler, hiddenGemsHandler *handlers.HiddenGemsHandler, productHandler *handlers.ProductHandler) {
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	r.POST("/scan/ranking", scanHandler.ScanRanking)
	r.POST("/scan/hidden-gems", hiddenGemsHandler.ScanHiddenGems)
	r.POST("/scan/trending", scanHandler.ScanTrending)
	r.GET("/products/:id", productHandler.GetProduct)
}
