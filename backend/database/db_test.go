package database_test

import (
	"os"
	"testing"

	"github.com/Hiru-ge/Kaleido-Scan/backend/config"
	"github.com/Hiru-ge/Kaleido-Scan/backend/database"
	_ "github.com/lib/pq"
)

// TestNewDB_Connect は実際のPostgreSQL接続を必要とする統合テスト。
// DATABASE_URL 環境変数が未設定の場合はスキップする。
func TestNewDB_Connect(t *testing.T) {
	if os.Getenv("DATABASE_URL") == "" {
		t.Skip("DATABASE_URL not set, skipping integration test")
	}

	cfg := &config.Config{
		DBHost:     "localhost",
		DBPort:     "5432",
		DBUser:     "postgres",
		DBPassword: "postgres",
		DBName:     "kaleido_scan",
	}

	db, err := database.NewDB(cfg)
	if err != nil {
		t.Fatalf("NewDB returned error: %v", err)
	}
	if db == nil {
		t.Fatal("NewDB returned nil db")
	}
	defer func() {
		if err := db.Close(); err != nil {
			t.Errorf("db.Close: %v", err)
		}
	}()
}
