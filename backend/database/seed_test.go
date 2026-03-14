package database_test

import (
	"testing"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/Hiru-ge/Kaleid-Scan/backend/database"
)

func TestSeed_Insert_Idempotent(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("failed to create sqlmock: %v", err)
	}

	// 1回目の呼び出しに対するExpect設定
	mock.ExpectExec("INSERT INTO products").WillReturnResult(sqlmock.NewResult(5, 5))
	mock.ExpectExec("INSERT INTO weekly_sales").WillReturnResult(sqlmock.NewResult(30, 30))

	if err := database.Seed(db); err != nil {
		t.Fatalf("first Seed call returned error: %v", err)
	}

	// 2回目の呼び出し（ON CONFLICT DO NOTHING により0件更新でもエラーなし）
	mock.ExpectExec("INSERT INTO products").WillReturnResult(sqlmock.NewResult(0, 0))
	mock.ExpectExec("INSERT INTO weekly_sales").WillReturnResult(sqlmock.NewResult(0, 0))

	if err := database.Seed(db); err != nil {
		t.Fatalf("second Seed call returned error (expected idempotent): %v", err)
	}

	// sqlmock v1では Close() の呼び出しも期待登録が必要
	mock.ExpectClose()

	if err := db.Close(); err != nil {
		t.Errorf("db.Close: %v", err)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("unfulfilled mock expectations: %v", err)
	}
}
