-- Migration: Shop KYC, Tax Code Compliance, Bank Payout Account & Storefront Reputation
-- Date: 2026-11-24

ALTER TABLE shops ADD COLUMN IF NOT EXISTS entity_type VARCHAR(20) NOT NULL DEFAULT 'INDIVIDUAL';
ALTER TABLE shops ADD COLUMN IF NOT EXISTS tax_status VARCHAR(30) NOT NULL DEFAULT 'PENDING_REVIEW';
ALTER TABLE shops ADD COLUMN IF NOT EXISTS legal_representative_name VARCHAR(150);
ALTER TABLE shops ADD COLUMN IF NOT EXISTS national_id_last4 VARCHAR(4);
ALTER TABLE shops ADD COLUMN IF NOT EXISTS national_id_hash VARCHAR(128);
ALTER TABLE shops ADD COLUMN IF NOT EXISTS operational_mode VARCHAR(20) NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE shops ADD COLUMN IF NOT EXISTS vacation_note TEXT;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS vacation_until TIMESTAMPTZ;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS banner_url TEXT;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS tagline VARCHAR(255);
ALTER TABLE shops ADD COLUMN IF NOT EXISTS tax_lookup_snapshot JSONB;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS reviewed_by UUID;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

ALTER TABLE shops DROP CONSTRAINT IF EXISTS chk_shops_status;
ALTER TABLE shops
  ADD CONSTRAINT chk_shops_status
  CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'));

ALTER TABLE shops DROP CONSTRAINT IF EXISTS chk_shops_entity_type;
ALTER TABLE shops
  ADD CONSTRAINT chk_shops_entity_type
  CHECK (entity_type IN ('INDIVIDUAL', 'HOUSEHOLD', 'ENTERPRISE'));

ALTER TABLE shops DROP CONSTRAINT IF EXISTS chk_shops_operational_mode;
ALTER TABLE shops
  ADD CONSTRAINT chk_shops_operational_mode
  CHECK (operational_mode IN ('ACTIVE', 'VACATION'));

CREATE UNIQUE INDEX IF NOT EXISTS uq_shops_tax_code_nonempty
  ON shops (UPPER(tax_code))
  WHERE tax_code IS NOT NULL AND tax_code <> '';

CREATE UNIQUE INDEX IF NOT EXISTS uq_shops_national_id_hash_nonempty
  ON shops (national_id_hash)
  WHERE national_id_hash IS NOT NULL AND national_id_hash <> '';

CREATE TABLE IF NOT EXISTS shop_kyc_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  doc_type VARCHAR(40) NOT NULL,
  file_url TEXT NOT NULL,
  file_name VARCHAR(255),
  qr_parsed_payload JSONB,
  verification_status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
  reviewer_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (shop_id, doc_type)
);

CREATE INDEX IF NOT EXISTS idx_shop_kyc_documents_shop_id ON shop_kyc_documents (shop_id);

CREATE TABLE IF NOT EXISTS shop_bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  bank_code VARCHAR(30) NOT NULL,
  bank_name VARCHAR(120) NOT NULL,
  account_number VARCHAR(40) NOT NULL,
  account_holder_name VARCHAR(150) NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT TRUE,
  name_match_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  verification_status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (shop_id, account_number)
);

CREATE INDEX IF NOT EXISTS idx_shop_bank_accounts_shop_id ON shop_bank_accounts (shop_id);

