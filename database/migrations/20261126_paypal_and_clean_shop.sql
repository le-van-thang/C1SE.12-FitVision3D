-- Migration: Clean Shop Registration (Remove Individual/Household/Enterprise & Complex KYC/Tax) + PayPal Marketplace Escrow & Payouts
-- Date: 2026-11-26

-- 1. Drop legacy Tax / Entity Type / National ID / Domestic Bank & KYC Document artifacts
DROP INDEX IF EXISTS uq_shops_tax_code_nonempty;
DROP INDEX IF EXISTS uq_shops_national_id_hash_nonempty;
ALTER TABLE shops DROP CONSTRAINT IF EXISTS chk_shops_entity_type;

DROP TABLE IF EXISTS shop_kyc_documents;
DROP TABLE IF EXISTS shop_bank_accounts;

ALTER TABLE shops DROP COLUMN IF EXISTS entity_type;
ALTER TABLE shops DROP COLUMN IF EXISTS tax_code;
ALTER TABLE shops DROP COLUMN IF EXISTS tax_status;
ALTER TABLE shops DROP COLUMN IF EXISTS business_license_no;
ALTER TABLE shops DROP COLUMN IF EXISTS legal_representative_name;
ALTER TABLE shops DROP COLUMN IF EXISTS national_id_last4;
ALTER TABLE shops DROP COLUMN IF EXISTS national_id_hash;
ALTER TABLE shops DROP COLUMN IF EXISTS tax_lookup_snapshot;

-- 2. Add PayPal Payout Email directly on shops + storefront fields
ALTER TABLE shops ADD COLUMN IF NOT EXISTS paypal_payout_email VARCHAR(160);
ALTER TABLE shops ADD COLUMN IF NOT EXISTS brand_slug VARCHAR(160);
ALTER TABLE shops ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255);
ALTER TABLE shops ADD COLUMN IF NOT EXISTS city VARCHAR(120);
ALTER TABLE shops ADD COLUMN IF NOT EXISTS is_mall BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS operational_mode VARCHAR(20) NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE shops ADD COLUMN IF NOT EXISTS vacation_note TEXT;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS vacation_until TIMESTAMPTZ;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS banner_url TEXT;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS tagline VARCHAR(255);
ALTER TABLE shops ADD COLUMN IF NOT EXISTS reviewed_by UUID;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;
ALTER TABLE shops DROP CONSTRAINT IF EXISTS chk_shops_status;
ALTER TABLE shops ADD CONSTRAINT chk_shops_status CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'));

-- 3. Upgrade orders for PayPal-Only Capture + Multi-Shop Escrow Payout Tracking
ALTER TABLE orders ALTER COLUMN payment_method SET DEFAULT 'paypal';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_group_id VARCHAR(48);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS paypal_order_id VARCHAR(64);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS paypal_capture_id VARCHAR(64);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS exchange_rate_vnd INTEGER NOT NULL DEFAULT 25400;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS paid_amount_usd NUMERIC(12,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS paypal_fee_usd NUMERIC(12,2) NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS platform_fee_rate NUMERIC(6,4) NOT NULL DEFAULT 0.05;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payout_status VARCHAR(30) NOT NULL DEFAULT 'PENDING_DELIVERY';

CREATE INDEX IF NOT EXISTS idx_orders_payment_group_id ON orders (payment_group_id);
CREATE INDEX IF NOT EXISTS idx_orders_paypal_order_id ON orders (paypal_order_id);
CREATE INDEX IF NOT EXISTS idx_orders_payout_status ON orders (payout_status);

-- 4. Create shop_payouts table for PayPal Batch Payout Disbursement & Ledger Audit
CREATE TABLE IF NOT EXISTS shop_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  shop_name VARCHAR(160) NOT NULL,
  recipient_paypal_email VARCHAR(160) NOT NULL,
  order_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  exchange_rate_vnd INTEGER NOT NULL DEFAULT 25400,
  platform_fee_rate NUMERIC(6,4) NOT NULL DEFAULT 0.05,
  gross_vnd BIGINT NOT NULL,
  paypal_fee_vnd BIGINT NOT NULL DEFAULT 0,
  platform_fee_vnd BIGINT NOT NULL DEFAULT 0,
  net_payout_vnd BIGINT NOT NULL,
  net_payout_usd NUMERIC(12,2) NOT NULL,
  paypal_payout_batch_id VARCHAR(80),
  paypal_payout_item_id VARCHAR(80),
  status VARCHAR(30) NOT NULL DEFAULT 'PROCESSING',
  note TEXT,
  raw_response JSONB,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  paid_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_shop_payouts_shop_id ON shop_payouts (shop_id);
CREATE INDEX IF NOT EXISTS idx_shop_payouts_batch_id ON shop_payouts (paypal_payout_batch_id);

