package models_test

import (
	"encoding/json"
	"strings"
	"testing"
	"time"

	"github.com/Hiru-ge/Kaleido-Scan/backend/models"
	"github.com/google/uuid"
)

func TestProduct_JSONTags(t *testing.T) {
	p := models.Product{
		ID:          uuid.MustParse("00000000-0000-0000-0000-000000000001"),
		Name:        "テスト商品",
		Description: "説明文",
		Category:    "food",
		CreatedAt:   time.Time{},
	}

	b, err := json.Marshal(p)
	if err != nil {
		t.Fatalf("json.Marshal: %v", err)
	}
	s := string(b)

	for _, key := range []string{`"id"`, `"name"`, `"description"`, `"category"`, `"created_at"`} {
		if !strings.Contains(s, key) {
			t.Errorf("JSON key %s not found in %s", key, s)
		}
	}
}
