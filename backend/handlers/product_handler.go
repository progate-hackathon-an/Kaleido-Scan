package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// GetProduct は GET /products/:id を処理する。
// スタブデータから一致するIDの商品詳細を返す。bounding_box は含まない。
func GetProduct(c *gin.Context) {
	id := c.Param("id")

	for _, p := range stubProducts {
		if p.ProductID == id {
			c.JSON(http.StatusOK, productDetail{
				ProductID:     p.ProductID,
				Name:          p.Name,
				Description:   p.Description,
				Category:      p.Category,
				Rank:          p.Rank,
				TotalQuantity: p.TotalQuantity,
				AuraLevel:     p.AuraLevel,
			})
			return
		}
	}

	c.JSON(http.StatusNotFound, newErrorResponse("product_not_found", "指定された商品が見つかりません"))
}
