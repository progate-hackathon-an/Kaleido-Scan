package routes

import (
	"net/http"

	"github.com/Hiru-ge/Kaleid-Scan/backend/handlers"
	"github.com/gin-gonic/gin"
)

// Setup はルーティングを設定する。
func Setup(r *gin.Engine, scanHandler *handlers.ScanHandler) {
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	r.POST("/scan/ranking", scanHandler.ScanRanking)
	r.GET("/products/:id", handlers.GetProduct)
}
