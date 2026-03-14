package database

import (
	"database/sql"
	"fmt"

	"github.com/Hiru-ge/Kaleid-Scan/backend/config"
	_ "github.com/lib/pq"
)

// NewDB はConfigからDSNを構築してDB接続を返す。
func NewDB(cfg *config.Config) (*sql.DB, error) {
	dsn := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		cfg.DBHost, cfg.DBPort, cfg.DBUser, cfg.DBPassword, cfg.DBName,
	)

	db, err := sql.Open("postgres", dsn)
	if err != nil {
		return nil, fmt.Errorf("sql.Open: %w", err)
	}

	return db, nil
}
