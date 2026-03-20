package main

import (
	"flag"
	"log"

	"github.com/Hiru-ge/Kaleido-Scan/backend/config"
	"github.com/Hiru-ge/Kaleido-Scan/backend/database"
	"github.com/Hiru-ge/Kaleido-Scan/backend/handlers"
	"github.com/Hiru-ge/Kaleido-Scan/backend/middleware"
	"github.com/Hiru-ge/Kaleido-Scan/backend/routes"
	"github.com/Hiru-ge/Kaleido-Scan/backend/services"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	seed := flag.Bool("seed", false, "Run seed data")
	flag.Parse()

	_ = godotenv.Load()

	cfg := config.Load()

	db, err := database.NewDB(cfg)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer func() {
		if err := db.Close(); err != nil {
			log.Printf("db.Close: %v", err)
		}
	}()

	if err := database.RunMigrations(db, "/db/migrations"); err != nil {
		log.Fatalf("Failed to run migrations: %v", err)
	}
	log.Println("Migrations applied")

	if *seed || cfg.SeedOnStartup {
		if err := database.Seed(db); err != nil {
			log.Fatalf("Failed to seed database: %v", err)
		}
		log.Println("Seed data inserted successfully")
	}

	ai, err := services.NewAIService(cfg.AIProvider, cfg.GeminiAPIKey, cfg.AWSRegion, cfg.BedrockModelID)
	if err != nil {
		log.Fatalf("Failed to initialize AI service: %v", err)
	}
	svc := services.NewScanService(ai, db)
	trendingSvc := services.NewTrendingService(ai, db)
	scanHandler := handlers.NewScanHandler(svc, trendingSvc)

	hiddenGemsSvc := services.NewHiddenGemsService(ai, db)
	hiddenGemsHandler := handlers.NewHiddenGemsHandler(hiddenGemsSvc)

	productHandler := handlers.NewProductHandler(db)

	r := gin.Default()
	r.Use(middleware.SetupCORS(cfg.FrontendURL))

	routes.Setup(r, scanHandler, hiddenGemsHandler, productHandler)

	log.Printf("Server starting on :%s", cfg.Port)
	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
