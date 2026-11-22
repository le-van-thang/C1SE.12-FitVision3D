import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  BOT_ACCESS_POLICIES,
  checkBotAccessPolicy,
} from '../../backend/src/modules/ai/bots/accessPolicy.ts';
import { BOT_UI_PROFILES } from '../../src/components/ai/botProfiles.ts';

describe('Role-Based AI Assistants — RBAC Matrix & UI Profiles', () => {
  const userActor = { sub: 'usr-1', role: 'USER' };
  const shopActor = { sub: 'shop-1', role: 'SHOP_OWNER' };
  const adminActor = { sub: 'adm-1', role: 'ADMIN' };

  it('TC-AI-01: customer bot allows Guest, USER, SHOP_OWNER, and ADMIN', () => {
    assert.equal(checkBotAccessPolicy(BOT_ACCESS_POLICIES.customer, undefined).allowed, true);
    assert.equal(checkBotAccessPolicy(BOT_ACCESS_POLICIES.customer, userActor).allowed, true);
    assert.equal(checkBotAccessPolicy(BOT_ACCESS_POLICIES.customer, shopActor).allowed, true);
    assert.equal(checkBotAccessPolicy(BOT_ACCESS_POLICIES.customer, adminActor).allowed, true);
  });

  it('TC-AI-02: shop bot strictly allows SHOP_OWNER only and denies Guest (401), USER (403), ADMIN (403)', () => {
    const guestRes = checkBotAccessPolicy(BOT_ACCESS_POLICIES.shop, undefined);
    assert.equal(guestRes.allowed, false);
    assert.equal(guestRes.status, 401);

    const userRes = checkBotAccessPolicy(BOT_ACCESS_POLICIES.shop, userActor);
    assert.equal(userRes.allowed, false);
    assert.equal(userRes.status, 403);

    const adminRes = checkBotAccessPolicy(BOT_ACCESS_POLICIES.shop, adminActor);
    assert.equal(adminRes.allowed, false);
    assert.equal(adminRes.status, 403);

    assert.equal(checkBotAccessPolicy(BOT_ACCESS_POLICIES.shop, shopActor).allowed, true);
  });

  it('TC-AI-03: admin bot strictly allows ADMIN only and denies Guest (401), USER (403), SHOP_OWNER (403)', () => {
    const guestRes = checkBotAccessPolicy(BOT_ACCESS_POLICIES.admin, undefined);
    assert.equal(guestRes.allowed, false);
    assert.equal(guestRes.status, 401);

    const userRes = checkBotAccessPolicy(BOT_ACCESS_POLICIES.admin, userActor);
    assert.equal(userRes.allowed, false);
    assert.equal(userRes.status, 403);

    const shopRes = checkBotAccessPolicy(BOT_ACCESS_POLICIES.admin, shopActor);
    assert.equal(shopRes.allowed, false);
    assert.equal(shopRes.status, 403);

    assert.equal(checkBotAccessPolicy(BOT_ACCESS_POLICIES.admin, adminActor).allowed, true);
  });

  it('TC-AI-04: frontend defines 3 distinct visual & prompt profiles for customer, shop, and admin', () => {
    const ids = Object.keys(BOT_UI_PROFILES);
    assert.deepEqual(ids.sort(), ['admin', 'customer', 'shop']);

    const badges = new Set(Object.values(BOT_UI_PROFILES).map((p) => p.badgeText));
    assert.equal(badges.size, 3, 'Each role bot must have a unique badge');

    for (const profile of Object.values(BOT_UI_PROFILES)) {
      assert.ok(profile.quickPromptsVi.length >= 3);
      assert.ok(profile.quickPromptsEn.length >= 3);
      assert.ok(profile.floatingHintsVi.length >= 3);
    }
  });
});
