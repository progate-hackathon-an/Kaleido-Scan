.PHONY: up down build logs-fe logs-be db-shell \
        test test-fe test-be \
        lint lint-fe lint-be \
        fmt fmt-fe fmt-be

# 開発サーバー
up:
	docker compose up -d

down:
	docker compose down

build:
	docker compose up -d --build

# ログ
logs-fe:
	docker compose logs -f frontend

logs-be:
	docker compose logs -f backend

# DB接続
db-shell:
	docker compose exec db psql -U $${DB_USER:-kaleid} -d $${DB_NAME:-kaleid_scan}

# テスト
test: test-fe test-be

test-fe:
	cd frontend && npm run test

test-be:
	cd backend && go test ./...

# リント
lint: lint-fe lint-be

lint-fe:
	cd frontend && npx eslint .

lint-be:
	cd backend && golangci-lint run ./...

# フォーマット
fmt: fmt-fe fmt-be

fmt-fe:
	cd frontend && npx prettier --write .

fmt-be:
	cd backend && gofmt -w .
