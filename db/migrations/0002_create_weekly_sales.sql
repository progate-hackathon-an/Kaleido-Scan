CREATE TABLE weekly_sales (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id  UUID        NOT NULL REFERENCES products(id),
    week_start  DATE        NOT NULL,
    quantity    INTEGER     NOT NULL CHECK (quantity >= 0),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (product_id, week_start)
);

CREATE INDEX idx_weekly_sales_product_id ON weekly_sales(product_id);
CREATE INDEX idx_weekly_sales_week_start ON weekly_sales(week_start);
