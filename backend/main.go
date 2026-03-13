package main

import (
	"log"

	"github.com/Hiru-ge/Kaleid-Scan/backend/config"
	"github.com/Hiru-ge/Kaleid-Scan/backend/middleware"
	"github.com/Hiru-ge/Kaleid-Scan/backend/routes"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	_ = godotenv.Load()

	cfg := config.Load()

	r := gin.Default()
	r.Use(middleware.SetupCORS(cfg.FrontendURL))

	routes.Setup(r)

	log.Printf("Server starting on :%s", cfg.Port)
	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
