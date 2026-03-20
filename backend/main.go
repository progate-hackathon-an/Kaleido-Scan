package main

import (
	"context"
	"embed"
	"flag"
	"io/fs"
	"log"
	"os"

	"github.com/Hiru-ge/Kaleido-Scan/backend/config"
	"github.com/Hiru-ge/Kaleido-Scan/backend/database"
	"github.com/Hiru-ge/Kaleido-Scan/backend/handlers"
	"github.com/Hiru-ge/Kaleido-Scan/backend/middleware"
	"github.com/Hiru-ge/Kaleido-Scan/backend/routes"
	"github.com/Hiru-ge/Kaleido-Scan/backend/services"
	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/awslabs/aws-lambda-go-api-proxy/httpadapter"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

//go:embed db/migrations/*.sql
var migrationsFS embed.FS

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

	migrationsSub, err := fs.Sub(migrationsFS, "db/migrations")
	if err != nil {
		log.Fatalf("Failed to sub migrations FS: %v", err)
	}
	if err := database.RunMigrations(db, migrationsSub); err != nil {
		log.Fatalf("Failed to run migrations: %v", err)
	}
	log.Println("Migrations applied")

	if *seed || cfg.SeedOnStartup {
		if err := database.Seed(db); err != nil {
			log.Fatalf("Failed to seed database: %v", err)
		}
		log.Println("Seed data inserted successfully")
	}

	log.Printf("AI provider: %s", cfg.AIProvider)
	if cfg.AIProvider == "bedrock" {
		log.Printf("Bedrock region: %s, modelID: %q", cfg.AWSRegion, cfg.BedrockModelID)
	}
	ai, err := services.NewAIService(cfg.AIProvider, cfg.GeminiAPIKey, cfg.AWSRegion, cfg.BedrockModelID)
	if err != nil {
		log.Fatalf("Failed to initialize AI service: %v", err)
	}
	svc := services.NewScanService(ai, db, cfg.UseStub)
	trendingSvc := services.NewTrendingService(ai, db, cfg.UseStub)
	scanHandler := handlers.NewScanHandler(svc, trendingSvc)

	hiddenGemsSvc := services.NewHiddenGemsService(ai, db, cfg.UseStub)
	hiddenGemsHandler := handlers.NewHiddenGemsHandler(hiddenGemsSvc)

	productHandler := handlers.NewProductHandler(db)

	r := gin.Default()
	r.Use(middleware.SetupCORS(cfg.FrontendURL))

	routes.Setup(r, scanHandler, hiddenGemsHandler, productHandler)

	if os.Getenv("AWS_LAMBDA_FUNCTION_NAME") != "" {
		adapter := httpadapter.NewV2(r)
		lambda.Start(func(ctx context.Context, req events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
			return adapter.ProxyWithContext(ctx, req)
		})
	} else {
		log.Printf("Server starting on :%s", cfg.Port)
		if err := r.Run(":" + cfg.Port); err != nil {
			log.Fatalf("Failed to start server: %v", err)
		}
	}
}
