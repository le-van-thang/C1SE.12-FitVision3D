-- ============================================================================
-- FitVision 3D - Order Security, Stock Control & 13-Metric Bespoke Snapshot
-- Date: 2026-11-20
-- ============================================================================

ALTER TABLE orders ADD COLUMN IF NOT EXISTS shop_id UUID;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS has_bespoke_items BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS measurement_snapshot JSONB;

CREATE INDEX IF NOT EXISTS idx_orders_shop_id ON orders (shop_id);
