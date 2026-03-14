package models

import (
	"time"

	"github.com/google/uuid"
)

type Product struct {
	ID          uuid.UUID `db:"id"          json:"id"`
	Name        string    `db:"name"         json:"name"`
	Description string    `db:"description"  json:"description"`
	Category    string    `db:"category"     json:"category"`
	CreatedAt   time.Time `db:"created_at"   json:"created_at"`
}
