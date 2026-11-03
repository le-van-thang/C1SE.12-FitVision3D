import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

/**
 * Hash password with bcrypt cost >= 12
 * Tuân thủ @.agent/rules/02-security-anti-spam-rules.md
 */
export async function hashPassword(plainText: string): Promise<string> {
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  return bcrypt.hash(plainText, salt);
}

/**
 * Compare plain text password against stored hash
 */
export async function verifyPassword(plainText: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(plainText, hashed);
}

