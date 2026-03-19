package config

import "os"

type Config struct {
	Port          string
	FrontendURL   string
	DBHost        string
	DBPort        string
	DBUser        string
	DBPassword    string
	DBName        string
	GeminiAPIKey  string
	AIProvider    string
	SeedOnStartup bool
}

func Load() *Config {
	return &Config{
		Port:          getEnv("BACKEND_PORT", "8080"),
		FrontendURL:   getEnv("FRONTEND_URL", "http://localhost:5173"),
		DBHost:        getEnv("DB_HOST", "localhost"),
		DBPort:        getEnv("DB_PORT", "5432"),
		DBUser:        getEnv("DB_USER", "postgres"),
		DBPassword:    getEnv("DB_PASSWORD", "postgres"),
		DBName:        getEnv("DB_NAME", "kaleido_scan"),
		GeminiAPIKey:  getEnv("GEMINI_API_KEY", ""),
		AIProvider:    getEnv("AI_PROVIDER", "gemini"),
		SeedOnStartup: getEnv("SEED_ON_STARTUP", "false") == "true",
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
