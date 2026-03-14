package models_test

import (
	"testing"

	"github.com/Hiru-ge/Kaleid-Scan/backend/models"
)

func TestProduct_Fields(t *testing.T) {
	p := models.Product{}

	// ID, Name, Description, Category, CreatedAt フィールドの存在確認
	_ = p.ID
	_ = p.Name
	_ = p.Description
	_ = p.Category
	_ = p.CreatedAt
}
