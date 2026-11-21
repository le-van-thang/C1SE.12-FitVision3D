import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');

describe('Integration — Architecture, Schema & i18n Contracts', () => {
  it('TC-INT-02: complete PostgreSQL schema includes Auth, Measurements, 3D Mesh & Zero-Retention audit tables', () => {
    const schemaPath = path.join(ROOT, 'database/migrations/20261105_complete_schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf-8');

    const requiredTables = [
      'CREATE TABLE IF NOT EXISTS users',
      'CREATE TABLE IF NOT EXISTS refresh_tokens',
      'CREATE TABLE IF NOT EXISTS shops',
      'CREATE TABLE IF NOT EXISTS biometric_inputs',
      'CREATE TABLE IF NOT EXISTS measurements',
      'CREATE TABLE IF NOT EXISTS mesh_parameters',
      'zero_retention_flag',
    ];

    for (const token of requiredTables) {
      assert.ok(sql.includes(token), `Missing expected schema definition: ${token}`);
    }
  });

  it('TC-INT-03: Vietnamese and English i18n bundles are valid JSON with top-level namespaces', () => {
    const vi = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/i18n/vi.json'), 'utf-8'));
    const en = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/i18n/en.json'), 'utf-8'));

    assert.ok(Object.keys(vi).length > 0, 'vi.json must not be empty');
    assert.ok(Object.keys(en).length > 0, 'en.json must not be empty');
    assert.deepEqual(Object.keys(vi).sort(), Object.keys(en).sort(), 'Top-level i18n namespaces must match');
  });

  it('TC-INT-04: .env.example never contains real hardcoded production secrets', () => {
    const envExample = fs.readFileSync(path.join(ROOT, '.env.example'), 'utf-8');
    assert.ok(!envExample.includes('AIzaSy'), 'Found leaked Google API key prefix in .env.example');
    assert.ok(!envExample.includes('eyJhbGciOi'), 'Found leaked JWT token in .env.example');
  });
});
