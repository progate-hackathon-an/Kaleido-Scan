package database_test

import (
	"testing"

	"github.com/Hiru-ge/Kaleid-Scan/backend/config"
	"github.com/Hiru-ge/Kaleid-Scan/backend/database"
	_ "github.com/lib/pq"
)

func TestNewDB_Connect(t *testing.T) {
	cfg := &config.Config{
		DBHost:     "localhost",
		DBPort:     "5432",
		DBUser:     "postgres",
		DBPassword: "postgres",
		DBName:     "kaleid_scan",
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
