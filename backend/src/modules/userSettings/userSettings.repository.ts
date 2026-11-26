import { pool, query } from '../../config/database.js';
import { AppError } from '../../utils/responseEnvelope.js';
import { ErrorCode } from '../../constants/errorCodes.js';

let schemaPromise: Promise<void> | null = null;

/**
 * Tự động tạo các bảng cài đặt người dùng (hồ sơ, sổ địa chỉ, ngân hàng hoàn tiền, tùy chọn)
 * khi backend khởi động mà không cần chạy SQL thủ công.
 */
export async function ensureUserSettingsSchema(): Promise<void> {
  if (schemaPromise) return schemaPromise;

  schemaPromise = (async () => {
    try {
      await query(`
        CREATE EXTENSION IF NOT EXISTS "pgcrypto";

        CREATE TABLE IF NOT EXISTS user_profiles (
          user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
          phone VARCHAR(20),
          city VARCHAR(100),
          address VARCHAR(255),
          gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
          birth_date DATE,
          avatar_url VARCHAR(500),
          notes VARCHAR(500),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500);

        CREATE TABLE IF NOT EXISTS user_addresses (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          recipient_name VARCHAR(100) NOT NULL,
          phone VARCHAR(20) NOT NULL,
          city VARCHAR(100) NOT NULL,
          district VARCHAR(100),
          ward VARCHAR(100),
          detailed_address VARCHAR(255) NOT NULL,
          label VARCHAR(10) NOT NULL DEFAULT 'home' CHECK (label IN ('home', 'office', 'other')),
          is_default BOOLEAN NOT NULL DEFAULT FALSE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_user_addresses_user ON user_addresses (user_id, created_at);
        CREATE UNIQUE INDEX IF NOT EXISTS uq_user_addresses_one_default
          ON user_addresses (user_id) WHERE is_default;

        CREATE TABLE IF NOT EXISTS user_refund_banks (
          user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
          bank_code VARCHAR(20) NOT NULL,
          bank_name VARCHAR(100) NOT NULL,
          account_number VARCHAR(30) NOT NULL,
          account_holder_name VARCHAR(100) NOT NULL,
          linked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS user_preferences (
          user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
          email_order_updates BOOLEAN NOT NULL DEFAULT TRUE,
          email_promotions BOOLEAN NOT NULL DEFAULT FALSE,
          ease_allowance VARCHAR(10) NOT NULL DEFAULT 'regular'
            CHECK (ease_allowance IN ('slim', 'regular', 'relaxed')),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);
    } catch {
      schemaPromise = null;
      throw new AppError(
        503,
        ErrorCode.INTERNAL_SERVER_ERROR,
        'Cơ sở dữ liệu chưa sẵn sàng. Vui lòng thử lại sau.'
      );
    }
  })();

  return schemaPromise;
}

export interface UserProfileRow {
  fullName?: string;
  avatarUrl?: string;
  phone: string;
  city: string;
  address: string;
  gender: 'male' | 'female' | 'other' | null;
  birthDate: string | null;
  notes: string;
}

export interface UserAddressRow {
  id: string;
  recipientName: string;
  phone: string;
  city: string;
  district?: string;
  ward?: string;
  detailedAddress: string;
  label: 'home' | 'office' | 'other';
  isDefault: boolean;
  createdAt: string;
}

export interface RefundBankRow {
  bankCode: string;
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
  linkedAt: string;
}

export interface UserPreferencesRow {
  emailOrderUpdates: boolean;
  emailPromotions: boolean;
  easeAllowancePreference: 'slim' | 'regular' | 'relaxed';
}

const ADDRESS_COLUMNS = `id, recipient_name, phone, city, district, ward, detailed_address, label, is_default, created_at`;

function mapAddress(r: any): UserAddressRow {
  return {
    id: r.id,
    recipientName: r.recipient_name,
    phone: r.phone,
    city: r.city,
    district: r.district || undefined,
    ward: r.ward || undefined,
    detailedAddress: r.detailed_address,
    label: r.label,
    isDefault: r.is_default,
    createdAt: new Date(r.created_at).toISOString(),
  };
}

export const userSettingsRepository = {
  async getProfile(userId: string): Promise<UserProfileRow> {
    await ensureUserSettingsSchema();
    const rows = await query(
      `SELECT u.full_name, p.avatar_url, p.phone, p.city, p.address, p.gender,
              to_char(p.birth_date, 'YYYY-MM-DD') AS birth_date, p.notes
       FROM users u
       LEFT JOIN user_profiles p ON p.user_id = u.id
       WHERE u.id = $1`,
      [userId]
    );
    const r = rows[0];
    return {
      fullName: r?.full_name || '',
      avatarUrl: r?.avatar_url || '',
      phone: r?.phone || '',
      city: r?.city || '',
      address: r?.address || '',
      gender: r?.gender || null,
      birthDate: r?.birth_date || null,
      notes: r?.notes || '',
    };
  },

  async upsertProfile(userId: string, data: UserProfileRow): Promise<UserProfileRow> {
    await ensureUserSettingsSchema();
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      if (data.fullName && data.fullName.trim()) {
        await client.query(
          'UPDATE users SET full_name = $1, updated_at = NOW() WHERE id = $2',
          [data.fullName.trim(), userId]
        );
      }
      await client.query(
        `INSERT INTO user_profiles (user_id, phone, city, address, gender, birth_date, avatar_url, notes, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
         ON CONFLICT (user_id) DO UPDATE SET
           phone = EXCLUDED.phone, city = EXCLUDED.city, address = EXCLUDED.address,
           gender = EXCLUDED.gender, birth_date = EXCLUDED.birth_date,
           avatar_url = CASE WHEN $9::boolean THEN EXCLUDED.avatar_url ELSE user_profiles.avatar_url END,
           notes = EXCLUDED.notes, updated_at = NOW()`,
        [
          userId,
          data.phone,
          data.city,
          data.address,
          data.gender,
          data.birthDate,
          data.avatarUrl ?? '',
          data.notes,
          data.avatarUrl !== undefined,
        ]
      );
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK').catch(() => undefined);
      throw err;
    } finally {
      client.release();
    }
    return this.getProfile(userId);
  },

  async listAddresses(userId: string): Promise<UserAddressRow[]> {
    await ensureUserSettingsSchema();
    const rows = await query(
      `SELECT ${ADDRESS_COLUMNS} FROM user_addresses WHERE user_id = $1
       ORDER BY is_default DESC, created_at ASC`,
      [userId]
    );
    return rows.map(mapAddress);
  },

  async saveAddress(
    userId: string,
    data: Omit<UserAddressRow, 'id' | 'createdAt' | 'isDefault'> & { id?: string; isDefault?: boolean }
  ): Promise<UserAddressRow[]> {
    await ensureUserSettingsSchema();
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const existingCount = Number(
        (await client.query('SELECT COUNT(*)::int AS n FROM user_addresses WHERE user_id = $1', [userId])).rows[0].n
      );
      const wantsDefault = Boolean(data.isDefault) || (!data.id && existingCount === 0);
      if (wantsDefault) {
        await client.query('UPDATE user_addresses SET is_default = FALSE WHERE user_id = $1', [userId]);
      }

      if (data.id) {
        const res = await client.query(
          `UPDATE user_addresses SET recipient_name = $3, phone = $4, city = $5, district = $6,
             ward = $7, detailed_address = $8, label = $9,
             is_default = CASE WHEN $10::boolean THEN TRUE ELSE is_default END
           WHERE id = $1 AND user_id = $2 RETURNING id`,
          [
            data.id, userId, data.recipientName, data.phone, data.city,
            data.district || null, data.ward || null, data.detailedAddress, data.label, wantsDefault,
          ]
        );
        if (res.rowCount === 0) {
          throw new AppError(404, ErrorCode.RESOURCE_NOT_FOUND, 'Không tìm thấy địa chỉ.');
        }
      } else {
        if (existingCount >= 10) {
          throw new AppError(400, ErrorCode.VALIDATION_FAILED, 'Bạn chỉ có thể lưu tối đa 10 địa chỉ.');
        }
        await client.query(
          `INSERT INTO user_addresses
             (user_id, recipient_name, phone, city, district, ward, detailed_address, label, is_default)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            userId, data.recipientName, data.phone, data.city,
            data.district || null, data.ward || null, data.detailedAddress, data.label, wantsDefault,
          ]
        );
      }
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK').catch(() => undefined);
      throw err;
    } finally {
      client.release();
    }
    return this.listAddresses(userId);
  },

  async setDefaultAddress(userId: string, addressId: string): Promise<UserAddressRow[]> {
    await ensureUserSettingsSchema();
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const exists = await client.query('SELECT 1 FROM user_addresses WHERE id = $1 AND user_id = $2', [addressId, userId]);
      if (exists.rowCount === 0) {
        throw new AppError(404, ErrorCode.RESOURCE_NOT_FOUND, 'Không tìm thấy địa chỉ.');
      }
      await client.query('UPDATE user_addresses SET is_default = FALSE WHERE user_id = $1', [userId]);
      await client.query('UPDATE user_addresses SET is_default = TRUE WHERE id = $1 AND user_id = $2', [addressId, userId]);
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK').catch(() => undefined);
      throw err;
    } finally {
      client.release();
    }
    return this.listAddresses(userId);
  },

  async deleteAddress(userId: string, addressId: string): Promise<UserAddressRow[]> {
    await ensureUserSettingsSchema();
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const del = await client.query(
        'DELETE FROM user_addresses WHERE id = $1 AND user_id = $2 RETURNING is_default',
        [addressId, userId]
      );
      if (del.rowCount === 0) {
        throw new AppError(404, ErrorCode.RESOURCE_NOT_FOUND, 'Không tìm thấy địa chỉ.');
      }
      if (del.rows[0].is_default) {
        await client.query(
          `UPDATE user_addresses SET is_default = TRUE
           WHERE id = (SELECT id FROM user_addresses WHERE user_id = $1 ORDER BY created_at ASC LIMIT 1)`,
          [userId]
        );
      }
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK').catch(() => undefined);
      throw err;
    } finally {
      client.release();
    }
    return this.listAddresses(userId);
  },

  async getRefundBank(userId: string): Promise<RefundBankRow | null> {
    await ensureUserSettingsSchema();
    const rows = await query(
      `SELECT bank_code, bank_name, account_number, account_holder_name, linked_at
       FROM user_refund_banks WHERE user_id = $1`,
      [userId]
    );
    const r = rows[0];
    if (!r) return null;
    return {
      bankCode: r.bank_code,
      bankName: r.bank_name,
      accountNumber: r.account_number,
      accountHolderName: r.account_holder_name,
      linkedAt: new Date(r.linked_at).toISOString(),
    };
  },

  async upsertRefundBank(userId: string, data: Omit<RefundBankRow, 'linkedAt'>): Promise<RefundBankRow> {
    await ensureUserSettingsSchema();
    await query(
      `INSERT INTO user_refund_banks (user_id, bank_code, bank_name, account_number, account_holder_name, linked_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (user_id) DO UPDATE SET
         bank_code = EXCLUDED.bank_code, bank_name = EXCLUDED.bank_name,
         account_number = EXCLUDED.account_number,
         account_holder_name = EXCLUDED.account_holder_name, linked_at = NOW()`,
      [userId, data.bankCode, data.bankName, data.accountNumber, data.accountHolderName]
    );
    return (await this.getRefundBank(userId))!;
  },

  async deleteRefundBank(userId: string): Promise<void> {
    await ensureUserSettingsSchema();
    await query('DELETE FROM user_refund_banks WHERE user_id = $1', [userId]);
  },

  async getPreferences(userId: string): Promise<UserPreferencesRow> {
    await ensureUserSettingsSchema();
    const rows = await query(
      'SELECT email_order_updates, email_promotions, ease_allowance FROM user_preferences WHERE user_id = $1',
      [userId]
    );
    const r = rows[0];
    return {
      emailOrderUpdates: r ? r.email_order_updates : true,
      emailPromotions: r ? r.email_promotions : false,
      easeAllowancePreference: r ? r.ease_allowance : 'regular',
    };
  },

  async upsertPreferences(userId: string, data: UserPreferencesRow): Promise<UserPreferencesRow> {
    await ensureUserSettingsSchema();
    await query(
      `INSERT INTO user_preferences (user_id, email_order_updates, email_promotions, ease_allowance, updated_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (user_id) DO UPDATE SET
         email_order_updates = EXCLUDED.email_order_updates,
         email_promotions = EXCLUDED.email_promotions,
         ease_allowance = EXCLUDED.ease_allowance, updated_at = NOW()`,
      [userId, data.emailOrderUpdates, data.emailPromotions, data.easeAllowancePreference]
    );
    return this.getPreferences(userId);
  },
};
