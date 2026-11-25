import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const REPO_ROOT = path.resolve(import.meta.dirname, '..', '..');

function readRepoFile(relPath) {
  return fs.readFileSync(path.join(REPO_ROOT, relPath), 'utf8');
}

test('TC-SHOP-W2-01: ShopPortal renders order.items, filters/searches orders, locks terminal status with 2-step confirm, and computes realized revenue', () => {
  const shopSrc = readRepoFile('src/pages/ShopPortal.tsx');

  // Revenue counts only non-cancelled paid or completed orders
  assert.match(
    shopSrc,
    /orders[\s\S]*\.filter\(\(o\) => o\.status !== 'cancelled' && \(o\.payment_status === 'paid' \|\| o\.status === 'completed'\)\)/
  );

  // Order search & status filters
  assert.match(shopSrc, /orderSearchQuery/);
  assert.match(shopSrc, /orderStatusFilter/);
  assert.match(shopSrc, /filteredOrders\.map\(\(order\) =>/);

  // Renders order line items with image, color, size, quantity, and bespoke indicator
  assert.match(shopSrc, /Array\.isArray\(order\.items\) && order\.items\.length > 0/);
  assert.match(shopSrc, /item\.variant\?\.color_name/);
  assert.match(shopSrc, /item\.variant\?\.size_label/);
  assert.match(shopSrc, /x\{item\.quantity\}/);

  // Disables terminal order transitions and requires 2-step confirm for completed / cancelled
  assert.match(shopSrc, /const isTerminal = order\.status === 'completed' \|\| order\.status === 'cancelled';/);
  assert.match(shopSrc, /disabled=\{isTerminal\}/);
  assert.match(shopSrc, /pendingOrderStatusChange/);
});

test('TC-SHOP-W2-02: ShopPortal provides Edit/Restock modal, 2-step product delete confirm, safe base64 image handling, and mobile sidebar drawer', () => {
  const shopSrc = readRepoFile('src/pages/ShopPortal.tsx');
  const apiSrc = readRepoFile('src/services/commerceApi.ts');

  // Edit/Restock modal & API patch signature
  assert.match(shopSrc, /openEditProductModal/);
  assert.match(shopSrc, /handleSaveEditProduct/);
  assert.match(shopSrc, /variantStocks:\s*editVariantStocks/);
  assert.match(apiSrc, /variantStocks\?:\s*Record<string,\s*number>/);

  // 2-step product delete confirmation
  assert.match(shopSrc, /confirmDeleteProductId/);
  assert.match(shopSrc, /Xác nhận xóa/);

  // Base64 image state displayed as non-editable indicator instead of input string
  assert.doesNotMatch(shopSrc, /value=\{cv\.imageUrl\.startsWith\('data:image'\) \? '✓ Đã chọn ảnh từ máy/);
  assert.match(shopSrc, /✓ Đã tải ảnh từ máy/);

  // Mobile sidebar drawer
  assert.match(shopSrc, /mobileSidebarOpen/);
  assert.match(shopSrc, /data-testid="shop-mobile-menu-toggle"/);
  assert.match(shopSrc, /hidden md:flex w-\[260px\]/);
});

test('TC-SHOP-W2-03: Backend enforces non-negative stock (allowing 0), validates updateShopProduct fields, and eliminates N+1 in listPublicStores', () => {
  const repoSrc = readRepoFile('backend/src/modules/commerce/commerce.repository.ts');

  // createShopProduct rejects negative stock and does not coerce 0 to 20 via || 20
  assert.doesNotMatch(repoSrc, /stock:\s*Number\(stockMap\[sz\]\) \|\| 20/);
  assert.match(repoSrc, /const parsed = Number\(rawVal\);[\s\S]*if \(!Number\.isFinite\(parsed\) \|\| parsed < 0\)/);
  assert.match(repoSrc, /stock:\s*resolvedStockBySize\[sz\]/);

  // updateShopProduct validates name, price, salePrice < price, and variantStocks >= 0
  assert.match(repoSrc, /Tên sản phẩm phải có tối thiểu 3 ký tự\./);
  assert.match(repoSrc, /Giá khuyến mãi phải từ 1\.000₫ trở lên và thấp hơn giá gốc\./);
  assert.match(repoSrc, /if \(patch\.variantStocks && typeof patch\.variantStocks === 'object'\)/);

  // listPublicStores aggregates via SQL GROUP BY instead of N+1 computeShopReputation loop
  const listStoresMatch = repoSrc.match(/async listPublicStores\(\)\s*\{[\s\S]*?\n  \},/);
  assert.ok(listStoresMatch, 'Expected listPublicStores implementation');
  assert.doesNotMatch(listStoresMatch[0], /computeShopReputation\(/);
  assert.match(listStoresMatch[0], /GROUP BY p\.shop_id, LOWER\(p\.brand_name\)/);
});
