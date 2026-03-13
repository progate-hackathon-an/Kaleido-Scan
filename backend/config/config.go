package config

import (
	"os"
)

type Config struct {
	Port        string
	FrontendURL string
}

func Load() *Config {
	return &Config{
		Port:        getEnv("BACKEND_PORT", "8080"),
		FrontendURL: getEnv("FRONTEND_URL", "http://localhost:5173"),
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
