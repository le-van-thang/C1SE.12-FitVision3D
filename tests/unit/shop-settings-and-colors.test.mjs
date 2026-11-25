import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizePrepTimeCode,
  formatPrepTimeLabel,
  isValidShopImageUrl,
  addCustomColorWithoutToggle,
} from '../../src/components/shop/settings/shopSettingsHelpers.ts';

test('normalizePrepTimeCode maps legacy Vietnamese strings and canonical codes', () => {
  assert.equal(normalizePrepTimeCode('SAME_DAY'), 'SAME_DAY');
  assert.equal(normalizePrepTimeCode('Trong ngày (24h)'), 'SAME_DAY');
  assert.equal(normalizePrepTimeCode('1–2 ngày làm việc'), '1_2_DAYS');
  assert.equal(normalizePrepTimeCode('2–3 ngày làm việc'), '2_3_DAYS');
  assert.equal(normalizePrepTimeCode('3–5 ngày (Hàng đặt trước)'), '3_5_DAYS');
  assert.equal(normalizePrepTimeCode(null), '1_2_DAYS');
});

test('formatPrepTimeLabel localizes prep time codes cleanly in VI and EN', () => {
  assert.equal(formatPrepTimeLabel('SAME_DAY', 'vi'), 'Trong ngày (24h)');
  assert.equal(formatPrepTimeLabel('SAME_DAY', 'en'), 'Same day (24h)');
  assert.equal(formatPrepTimeLabel('2–3 ngày làm việc', 'en'), '2–3 business days');
});

test('isValidShopImageUrl accepts safe http(s)/base64 images and rejects CSS/JS injection', () => {
  assert.equal(isValidShopImageUrl(''), true);
  assert.equal(isValidShopImageUrl('https://cdn.example.com/logo.png'), true);
  assert.equal(isValidShopImageUrl('data:image/jpeg;base64,/9j/4AAQSkZJRg=='), true);
  assert.equal(isValidShopImageUrl('javascript:alert(1)'), false);
  assert.equal(isValidShopImageUrl('https://a.com/x.png"); background:red;'), false);
  assert.equal(isValidShopImageUrl('data:image/svg+xml;base64,PHN2Zz4='), false);
});

test('addCustomColorWithoutToggle prevents accidental deletion when adding a duplicate color name or hex', () => {
  const initial = [
    { colorName: 'Trắng Kem', colorHex: '#F3F4F6', imageUrl: '' },
    { colorName: 'Xanh Navy', colorHex: '#1E3A8A', imageUrl: '' },
  ];

  const dupByName = addCustomColorWithoutToggle(initial, { name: 'xanh navy', hex: '#1E3A99' });
  assert.equal(dupByName.status, 'duplicate');
  assert.equal(dupByName.variants.length, 2);

  const dupByHex = addCustomColorWithoutToggle(initial, { name: 'Navy Dark', hex: '#1e3a8a' });
  assert.equal(dupByHex.status, 'duplicate');
  assert.equal(dupByHex.variants.length, 2);

  const added = addCustomColorWithoutToggle(initial, { name: 'Xanh Cổ Vịt', hex: '#0F766E' });
  assert.equal(added.status, 'added');
  assert.equal(added.variants.length, 3);
  assert.equal(added.variants[2].colorName, 'Xanh Cổ Vịt');
});
