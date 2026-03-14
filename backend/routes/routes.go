package routes

import (
	"net/http"

	"github.com/Hiru-ge/Kaleid-Scan/backend/handlers"
	"github.com/gin-gonic/gin"
)

func Setup(r *gin.Engine) {
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	r.POST("/scan/ranking", handlers.ScanRanking)
	r.GET("/products/:id", handlers.GetProduct)
}
