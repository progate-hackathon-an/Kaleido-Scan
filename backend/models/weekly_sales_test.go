package models_test

import (
	"testing"

	"github.com/Hiru-ge/Kaleid-Scan/backend/models"
)

func TestWeeklySales_Fields(t *testing.T) {
	ws := models.WeeklySales{}

	// ID, ProductID, WeekStart, Quantity, CreatedAt フィールドの存在確認
	_ = ws.ID
	_ = ws.ProductID
	_ = ws.WeekStart
	_ = ws.Quantity
	_ = ws.CreatedAt
}
