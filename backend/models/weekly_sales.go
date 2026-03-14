package models

import (
	"time"

	"github.com/google/uuid"
)

type WeeklySales struct {
	ID        uuid.UUID `db:"id"         json:"id"`
	ProductID uuid.UUID `db:"product_id" json:"product_id"`
	WeekStart time.Time `db:"week_start" json:"week_start"`
	Quantity  int       `db:"quantity"   json:"quantity"`
	CreatedAt time.Time `db:"created_at" json:"created_at"`
}
