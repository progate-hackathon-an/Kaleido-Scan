package database

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/secretsmanager"
)

type dbSecret struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

func fetchDBPassword(ctx context.Context, secretARN string) (string, error) {
	cfg, err := config.LoadDefaultConfig(ctx)
	if err != nil {
		return "", fmt.Errorf("load aws config: %w", err)
	}
	client := secretsmanager.NewFromConfig(cfg)
	out, err := client.GetSecretValue(ctx, &secretsmanager.GetSecretValueInput{
		SecretId: &secretARN,
	})
	if err != nil {
		return "", fmt.Errorf("get secret value: %w", err)
	}
	var s dbSecret
	if err := json.Unmarshal([]byte(*out.SecretString), &s); err != nil {
		return "", fmt.Errorf("unmarshal secret: %w", err)
	}
	return s.Password, nil
}
