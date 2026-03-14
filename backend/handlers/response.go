package handlers

import (
	"github.com/gin-gonic/gin"
)

// errorResponse はAPIエラーレスポンスの統一形式を表す。
type errorResponse struct {
	Error errorDetail `json:"error"`
}

type errorDetail struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

func newErrorResponse(code, message string) errorResponse {
	return errorResponse{
		Error: errorDetail{Code: code, Message: message},
	}
}

// ErrorResponse はGinコンテキストに統一エラーレスポンスを書き込むヘルパー。
func ErrorResponse(c *gin.Context, status int, code, message string) {
	c.JSON(status, newErrorResponse(code, message))
}
