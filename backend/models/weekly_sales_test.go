package models_test

import (
	"encoding/json"
	"strings"
	"testing"
	"time"

	"github.com/Hiru-ge/Kaleid-Scan/backend/models"
	"github.com/google/uuid"
)

func TestWeeklySales_JSONTags(t *testing.T) {
	ws := models.WeeklySales{
		ID:        uuid.MustParse("00000000-0000-0000-0000-000000000001"),
		ProductID: uuid.MustParse("00000000-0000-0000-0000-000000000002"),
		WeekStart: time.Time{},
		Quantity:  100,
		CreatedAt: time.Time{},
	}

	b, err := json.Marshal(ws)
	if err != nil {
		t.Fatalf("json.Marshal: %v", err)
	}
	s := string(b)

	for _, key := range []string{`"id"`, `"product_id"`, `"week_start"`, `"quantity"`, `"created_at"`} {
		if !strings.Contains(s, key) {
			t.Errorf("JSON key %s not found in %s", key, s)
		}
	}
}
