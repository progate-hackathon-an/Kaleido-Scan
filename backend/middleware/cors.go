package middleware

import (
	"strings"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

// SetupCORS はカンマ区切りで複数オリジン(スマホ)を受け付ける。
// 例: "https://localhost:5173,https://IPアドレス:5173"
func SetupCORS(frontendURL string) gin.HandlerFunc {
	origins := strings.Split(frontendURL, ",")
	return cors.New(cors.Config{
		AllowOrigins:     origins,
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		AllowCredentials: true,
	})
}
