package database

import (
	"context"
	"database/sql"
	"fmt"

	"github.com/Hiru-ge/Kaleido-Scan/backend/config"
	_ "github.com/lib/pq"
)

// NewDB はConfigからDSNを構築してDB接続を返す。
// DB_SECRET_ARN が設定されている場合は Secrets Manager からパスワードを取得する。
func NewDB(cfg *config.Config) (*sql.DB, error) {
	password := cfg.DBPassword
	if cfg.DBSecretARN != "" {
		p, err := fetchDBPassword(context.Background(), cfg.DBSecretARN)
		if err != nil {
			return nil, fmt.Errorf("fetchDBPassword: %w", err)
		}
		password = p
	}

	dsn := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		cfg.DBHost, cfg.DBPort, cfg.DBUser, password, cfg.DBName, cfg.DBSSLMode,
	)

	db, err := sql.Open("postgres", dsn)
	if err != nil {
		return nil, fmt.Errorf("sql.Open: %w", err)
	}
	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("db.Ping: %w", err)
	}

	return db, nil
}
