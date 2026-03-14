package main

import (
	"flag"
	"log"

	"github.com/Hiru-ge/Kaleid-Scan/backend/config"
	"github.com/Hiru-ge/Kaleid-Scan/backend/database"
	"github.com/Hiru-ge/Kaleid-Scan/backend/middleware"
	"github.com/Hiru-ge/Kaleid-Scan/backend/routes"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	seed := flag.Bool("seed", false, "Run seed data")
	flag.Parse()

	_ = godotenv.Load()

	cfg := config.Load()

	if *seed {
		db, err := database.NewDB(cfg)
		if err != nil {
			log.Fatalf("Failed to connect to database: %v", err)
		}
		defer func() {
			if err := db.Close(); err != nil {
				log.Printf("db.Close: %v", err)
			}
		}()

		if err := database.Seed(db); err != nil {
			log.Fatalf("Failed to seed database: %v", err)
		}
		log.Println("Seed data inserted successfully")
	}

	r := gin.Default()
	r.Use(middleware.SetupCORS(cfg.FrontendURL))

	routes.Setup(r)

	log.Printf("Server starting on :%s", cfg.Port)
	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
