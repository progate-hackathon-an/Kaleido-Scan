package config

import "os"

type Config struct {
	Port           string
	FrontendURL    string
	DBHost         string
	DBPort         string
	DBUser         string
	DBPassword     string
	DBName         string
	DBSSLMode      string // "disable" | "require" | "verify-full"
	DBSecretARN    string
	GeminiAPIKey   string
	AIProvider     string
	AWSRegion      string
	BedrockModelID string
	SeedOnStartup  bool
	UseStub        bool
}

func Load() *Config {
	return &Config{
		Port:           getEnv("BACKEND_PORT", "8080"),
		FrontendURL:    getEnv("FRONTEND_URL", "http://localhost:5173"),
		DBHost:         getEnv("DB_HOST", "localhost"),
		DBPort:         getEnv("DB_PORT", "5432"),
		DBUser:         getEnv("DB_USER", "postgres"),
		DBPassword:     getEnv("DB_PASSWORD", "postgres"),
		DBName:         getEnv("DB_NAME", "kaleido_scan"),
		DBSSLMode:      getEnv("DB_SSL_MODE", "disable"),
		DBSecretARN:    getEnv("DB_SECRET_ARN", ""),
		GeminiAPIKey:   getEnv("GEMINI_API_KEY", ""),
		AIProvider:     getEnv("AI_PROVIDER", "gemini"),
		AWSRegion:      getEnv("AWS_DEFAULT_REGION", "us-east-1"),
		BedrockModelID: getEnv("BEDROCK_MODEL_ID", ""),
		SeedOnStartup:  getEnv("SEED_ON_STARTUP", "false") == "true",
		UseStub:        getEnv("USE_STUB", "false") == "true",
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
