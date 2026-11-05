import { query, pool } from '../../config/database.js';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../../.data');
const DATA_FILE = path.join(DATA_DIR, 'dev_store.json');

export interface UserEntity {
  id: string;
  email: string;
  password_hash: string;
  full_name: string;
  role: 'ADMIN' | 'SHOP_OWNER' | 'USER';
  status: 'PENDING_VERIFY' | 'PENDING_APPROVAL' | 'ACTIVE' | 'LOCKED' | 'BANNED';
  failed_login_attempts: number;
  lockout_until: Date | null;
  last_login_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface ShopEntity {
  id: string;
  owner_id: string;
  shop_name: string;
  phone_number: string;
  shop_address: string;
  tax_code: string | null;
  logo_url: string | null;
  approved_at: Date | null;
}

export interface RefreshTokenEntity {
  id: string;
  user_id: string;
  token_hash: string;
  token_family: string;
  is_revoked: boolean;
  expires_at: Date;
  created_at: Date;
}

// In-Memory Fallback Cache Store (Active if DB server is offline during dev)
const memUsers = new Map<string, UserEntity>();
const memShops = new Map<string, ShopEntity>();
const memTokens = new Map<string, RefreshTokenEntity>();

function saveStore() {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    const data = {
      users: Array.from(memUsers.entries()),
      shops: Array.from(memShops.entries()),
      tokens: Array.from(memTokens.entries()),
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    // ignore
  }
}

function loadStore() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const data = JSON.parse(raw);
      if (data.users) {
        for (const [k, v] of data.users) {
          memUsers.set(k, {
            ...v,
            created_at: new Date(v.created_at),
            updated_at: new Date(v.updated_at),
            lockout_until: v.lockout_until ? new Date(v.lockout_until) : null,
            last_login_at: v.last_login_at ? new Date(v.last_login_at) : null,
          });
        }
      }
      if (data.shops) {
        for (const [k, v] of data.shops) memShops.set(k, v);
      }
      if (data.tokens) {
        for (const [k, v] of data.tokens) memTokens.set(k, v);
      }
    }
  } catch (err) {
    // ignore
  }

  // Pre-seed Admin
  if (!Array.from(memUsers.values()).some((u) => u.email.toLowerCase() === 'admin@fitvision3d.com')) {
    const adminId = '11111111-1111-1111-1111-111111111111';
    memUsers.set(adminId, {
      id: adminId,
      email: 'admin@fitvision3d.com',
      password_hash: '$2a$12$eYTjkn9GeVvRJdXHfyk0J.5FsAfjQ521Q50RGNV/Uz34AtGawH2la',
      full_name: 'Super Admin',
      role: 'ADMIN',
      status: 'ACTIVE',
      failed_login_attempts: 0,
      lockout_until: null,
      last_login_at: null,
      created_at: new Date(),
      updated_at: new Date(),
    });
  }

  // Pre-seed Lê Văn Thắng là Super Administrator (ADMIN)
  let thangUser = Array.from(memUsers.values()).find((u) => u.email.toLowerCase() === 'levanthang0166@gmail.com');
  if (!thangUser) {
    const thangId = '708f1bd6-f6fa-4bfe-b7d2-ad1c260d6625';
    memUsers.set(thangId, {
      id: thangId,
      email: 'levanthang0166@gmail.com',
      password_hash: '$2a$12$eYTjkn9GeVvRJdXHfyk0J.5FsAfjQ521Q50RGNV/Uz34AtGawH2la',
      full_name: 'Lê Văn Thắng',
      role: 'ADMIN',
      status: 'ACTIVE',
      failed_login_attempts: 0,
      lockout_until: null,
      last_login_at: null,
      created_at: new Date(),
      updated_at: new Date(),
    });
  } else {
    thangUser.role = 'ADMIN';
    thangUser.status = 'ACTIVE';
  }

  // Pre-seed Thái Anh Tài luôn ACTIVE để kiểm thử mượt mà không lo bị mất
  let taiUser = Array.from(memUsers.values()).find((u) => u.email.toLowerCase() === 'taithai27052005@gmail.com');
  if (!taiUser) {
    const taiId = '7638de6c-de6d-4144-9965-eb3a60eafcc8';
    memUsers.set(taiId, {
      id: taiId,
      email: 'taithai27052005@gmail.com',
      password_hash: '$2a$12$idhuh3Or5KI26CR/mdtRR./Ywj3S9QmHxsulwDJZADnjpyGL5ypq6',
      full_name: 'Thái Anh Tài',
      role: 'USER',
      status: 'ACTIVE',
      failed_login_attempts: 0,
      lockout_until: null,
      last_login_at: null,
      created_at: new Date(),
      updated_at: new Date(),
    });
  } else {
    taiUser.status = 'ACTIVE'; // Luôn đảm bảo ACTIVE
    taiUser.password_hash = '$2a$12$idhuh3Or5KI26CR/mdtRR./Ywj3S9QmHxsulwDJZADnjpyGL5ypq6';
  }
  saveStore();
}
loadStore();

let dbConnected: boolean | null = null;

async function isDbAvailable(): Promise<boolean> {
  if (dbConnected !== null) return dbConnected;
  try {
    const res = await pool.query('SELECT 1');
    dbConnected = res.rowCount !== null;
    return true;
  } catch {
    dbConnected = false;
    console.warn('[Database]: PostgreSQL offline. Using in-memory store for instant testing.');
    return false;
  }
}

export const authRepository = {
  async findUserByEmail(email: string): Promise<UserEntity | null> {
    const cleanEmail = email.toLowerCase().trim();
    if (await isDbAvailable()) {
      const rows = await query<UserEntity>(
        'SELECT * FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1',
        [cleanEmail]
      );
      return rows[0] || null;
    }
    for (const u of memUsers.values()) {
      if (u.email.toLowerCase() === cleanEmail) return u;
    }
    return null;
  },

  async findUserById(id: string): Promise<UserEntity | null> {
    if (await isDbAvailable()) {
      const rows = await query<UserEntity>('SELECT * FROM users WHERE id = $1 LIMIT 1', [id]);
      return rows[0] || null;
    }
    return memUsers.get(id) || null;
  },

  async createUser(data: {
    email: string;
    passwordHash: string;
    fullName: string;
    role: 'ADMIN' | 'SHOP_OWNER' | 'USER';
    status: 'PENDING_VERIFY' | 'PENDING_APPROVAL' | 'ACTIVE';
  }): Promise<UserEntity> {
    const id = crypto.randomUUID();
    const now = new Date();

    if (await isDbAvailable()) {
      const rows = await query<UserEntity>(
        `INSERT INTO users (id, email, password_hash, full_name, role, status, failed_login_attempts, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, 0, $7, $8)
         RETURNING *`,
        [id, data.email.toLowerCase(), data.passwordHash, data.fullName, data.role, data.status, now, now]
      );
      return rows[0];
    }

    const newUser: UserEntity = {
      id,
      email: data.email.toLowerCase(),
      password_hash: data.passwordHash,
      full_name: data.fullName,
      role: data.role,
      status: data.status,
      failed_login_attempts: 0,
      lockout_until: null,
      last_login_at: null,
      created_at: now,
      updated_at: now,
    };
    memUsers.set(id, newUser);
    saveStore();
    return newUser;
  },

  async createShop(data: {
    ownerId: string;
    shopName: string;
    phoneNumber: string;
    shopAddress: string;
    taxCode?: string;
  }): Promise<ShopEntity> {
    const id = crypto.randomUUID();
    const now = new Date();

    if (await isDbAvailable()) {
      const rows = await query<ShopEntity>(
        `INSERT INTO shops (id, owner_id, shop_name, phone_number, shop_address, tax_code, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [id, data.ownerId, data.shopName, data.phoneNumber, data.shopAddress, data.taxCode || null, now, now]
      );
      return rows[0];
    }

    const newShop: ShopEntity = {
      id,
      owner_id: data.ownerId,
      shop_name: data.shopName,
      phone_number: data.phoneNumber,
      shop_address: data.shopAddress,
      tax_code: data.taxCode || null,
      logo_url: null,
      approved_at: null,
    };
    memShops.set(id, newShop);
    saveStore();
    return newShop;
  },

  async incrementFailedLogin(userId: string): Promise<number> {
    if (await isDbAvailable()) {
      const rows = await query<{ failed_login_attempts: number }>(
        `UPDATE users 
         SET failed_login_attempts = failed_login_attempts + 1, updated_at = NOW()
         WHERE id = $1
         RETURNING failed_login_attempts`,
        [userId]
      );
      return rows[0]?.failed_login_attempts || 1;
    }
    const u = memUsers.get(userId);
    if (u) {
      u.failed_login_attempts += 1;
      return u.failed_login_attempts;
    }
    return 1;
  },

  async lockUser(userId: string, lockoutMinutes = 15): Promise<void> {
    const lockoutUntil = new Date(Date.now() + lockoutMinutes * 60 * 1000);
    if (await isDbAvailable()) {
      await query('UPDATE users SET lockout_until = $1, updated_at = NOW() WHERE id = $2', [
        lockoutUntil,
        userId,
      ]);
      return;
    }
    const u = memUsers.get(userId);
    if (u) u.lockout_until = lockoutUntil;
  },

  async activateUser(email: string): Promise<UserEntity | null> {
    const cleanEmail = email.toLowerCase().trim();
    if (await isDbAvailable()) {
      const rows = await query<UserEntity>(
        `UPDATE users SET status = 'ACTIVE', updated_at = NOW() 
         WHERE LOWER(email) = LOWER($1) AND status = 'PENDING_VERIFY'
         RETURNING *`,
        [cleanEmail]
      );
      return rows[0] || null;
    }
    for (const u of memUsers.values()) {
      if (u.email.toLowerCase() === cleanEmail) {
        u.status = 'ACTIVE';
        saveStore();
        return u;
      }
    }
    return null;
  },

  async updatePassword(email: string, passwordHash: string): Promise<boolean> {
    const cleanEmail = email.toLowerCase().trim();
    const now = new Date();
    if (await isDbAvailable()) {
      const rows = await query<UserEntity>(
        `UPDATE users SET password_hash = $1, failed_login_attempts = 0, lockout_until = NULL, updated_at = $2
         WHERE LOWER(email) = LOWER($3)
         RETURNING *`,
        [passwordHash, now, cleanEmail]
      );
      return rows.length > 0;
    }
    for (const u of memUsers.values()) {
      if (u.email.toLowerCase() === cleanEmail) {
        u.password_hash = passwordHash;
        u.failed_login_attempts = 0;
        u.lockout_until = null;
        u.updated_at = now;
        saveStore();
        return true;
      }
    }
    return false;
  },

  async findOrCreateGoogleUser(data: {
    email: string;
    fullName: string;
    avatarUrl?: string;
  }): Promise<UserEntity> {
    const cleanEmail = data.email.toLowerCase().trim();
    const existing = await this.findUserByEmail(cleanEmail);
    if (existing) {
      if (existing.status === 'PENDING_VERIFY') {
        existing.status = 'ACTIVE';
        saveStore();
      }
      return existing;
    }

    // Tạo mới tài khoản Google (role USER hoặc ADMIN nếu là chủ hệ thống, status ACTIVE)
    return this.createUser({
      email: cleanEmail,
      fullName: data.fullName || (cleanEmail === 'levanthang0166@gmail.com' ? 'Lê Văn Thắng' : 'Google User'),
      passwordHash: '$2a$12$google_oauth_no_direct_password_' + crypto.randomUUID(),
      role: (cleanEmail === 'levanthang0166@gmail.com' || cleanEmail === 'admin@fitvision3d.com') ? 'ADMIN' : 'USER',
      status: 'ACTIVE',
    });
  },

  async resetLoginAttempts(userId: string): Promise<void> {
    const now = new Date();
    if (await isDbAvailable()) {
      await query(
        'UPDATE users SET failed_login_attempts = 0, lockout_until = NULL, last_login_at = $1, updated_at = $1 WHERE id = $2',
        [now, userId]
      );
      return;
    }
    const u = memUsers.get(userId);
    if (u) {
      u.failed_login_attempts = 0;
      u.lockout_until = null;
      u.last_login_at = now;
    }
  },

  async saveRefreshToken(data: {
    userId: string;
    tokenHash: string;
    tokenFamily: string;
    expiresAt: Date;
  }): Promise<void> {
    const id = crypto.randomUUID();
    const now = new Date();
    if (await isDbAvailable()) {
      await query(
        `INSERT INTO refresh_tokens (id, user_id, token_hash, token_family, is_revoked, expires_at, created_at)
         VALUES ($1, $2, $3, $4, FALSE, $5, $6)`,
        [id, data.userId, data.tokenHash, data.tokenFamily, data.expiresAt, now]
      );
      return;
    }
    memTokens.set(data.tokenHash, {
      id,
      user_id: data.userId,
      token_hash: data.tokenHash,
      token_family: data.tokenFamily,
      is_revoked: false,
      expires_at: data.expiresAt,
      created_at: now,
    });
    saveStore();
  },

  async findRefreshToken(tokenHash: string): Promise<RefreshTokenEntity | null> {
    if (await isDbAvailable()) {
      const rows = await query<RefreshTokenEntity>(
        'SELECT * FROM refresh_tokens WHERE token_hash = $1 LIMIT 1',
        [tokenHash]
      );
      return rows[0] || null;
    }
    return memTokens.get(tokenHash) || null;
  },

  async revokeToken(tokenHash: string): Promise<void> {
    if (await isDbAvailable()) {
      await query('UPDATE refresh_tokens SET is_revoked = TRUE WHERE token_hash = $1', [tokenHash]);
      return;
    }
    const t = memTokens.get(tokenHash);
    if (t) {
      t.is_revoked = true;
      saveStore();
    }
  },

  async revokeTokenFamily(tokenFamily: string): Promise<void> {
    if (await isDbAvailable()) {
      await query('UPDATE refresh_tokens SET is_revoked = TRUE WHERE token_family = $1', [tokenFamily]);
      return;
    }
    for (const t of memTokens.values()) {
      if (t.token_family === tokenFamily) t.is_revoked = true;
    }
    saveStore();
  },
};

