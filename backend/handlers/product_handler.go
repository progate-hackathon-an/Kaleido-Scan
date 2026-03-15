package handlers

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"net/http"

	"github.com/Hiru-ge/Kaleid-Scan/backend/services"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// productDetail は GET /products/:id レスポンスを表す（bounding_box を含まない）。
type productDetail struct {
	ProductID     string `json:"product_id"`
	Name          string `json:"name"`
	Description   string `json:"description"`
	Category      string `json:"category"`
	Rank          int    `json:"rank"`
	TotalQuantity int    `json:"total_quantity"`
	AuraLevel     int    `json:"aura_level"`
}

// ProductHandler は /products/:id エンドポイントのハンドラ。
type ProductHandler struct {
	db *sql.DB
}

// NewProductHandler はProductHandlerを生成する。
func NewProductHandler(db *sql.DB) *ProductHandler {
	return &ProductHandler{db: db}
}

// GetProduct は GET /products/:id を処理する。
func (h *ProductHandler) GetProduct(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		ErrorResponse(c, http.StatusBadRequest, "invalid_id", "不正なUUID形式です")
		return
	}

	d, err := h.queryProductByID(c.Request.Context(), id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			ErrorResponse(c, http.StatusNotFound, "product_not_found", "指定された商品が見つかりません")
		} else {
			c.Error(err) //nolint:errcheck
			ErrorResponse(c, http.StatusInternalServerError, "internal_error", "サーバー内部エラーが発生しました")
		}
		return
	}

	c.JSON(http.StatusOK, d)
}

// rankやtotal_quantityはproductsテーブルには存在しないため、JOINクエリで集計してから返す。
func (h *ProductHandler) queryProductByID(ctx context.Context, id uuid.UUID) (*productDetail, error) {
	const query = `
		SELECT p.name, p.description, p.category, ranked.total_quantity, ranked.rank
		FROM products p
		JOIN (
			SELECT p2.id,
			       SUM(ws.quantity) AS total_quantity,
			       RANK() OVER (ORDER BY SUM(ws.quantity) DESC) AS rank
			FROM products p2
			JOIN weekly_sales ws ON p2.id = ws.product_id
			GROUP BY p2.id
		) ranked ON p.id = ranked.id
		WHERE p.id = $1`

	var d productDetail
	d.ProductID = id.String()

	err := h.db.QueryRowContext(ctx, query, id).Scan(
		&d.Name, &d.Description, &d.Category, &d.TotalQuantity, &d.Rank,
	)
	if err != nil {
		return nil, fmt.Errorf("queryProductByID: %w", err)
	}

	d.AuraLevel = services.CalcAuraLevel(d.Rank)
	return &d, nil
}
