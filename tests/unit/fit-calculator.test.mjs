import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateProductFit } from '../../src/features/ecommerce/fitCalculator.ts';

const SAMPLE_SHIRT = {
  id: 'prod-shirt-1',
  brand_name: 'Sartoria Milan',
  name: 'Áo Sơ Mi Oxford',
  slug: 'ao-so-mi-oxford',
  category: 'shirt',
  gender_target: 'male',
  price: 590000,
  rating: 4.9,
  reviews_count: 10,
  fabric_material: '100% Cotton',
  stretch_type: 'Không co giãn',
  image_url: '',
  description: '',
  variants: [
    {
      id: 'v-s',
      size_label: 'S',
      color_name: 'Trắng',
      color_hex: '#FFFFFF',
      sku: 'SH-S',
      stock: 10,
      spec: { chest_cm: 94, waist_cm: 86, shoulder_cm: 42, length_cm: 70, ease_min_cm: 4, ease_max_cm: 8 },
    },
    {
      id: 'v-m',
      size_label: 'M',
      color_name: 'Trắng',
      color_hex: '#FFFFFF',
      sku: 'SH-M',
      stock: 10,
      spec: { chest_cm: 100, waist_cm: 92, shoulder_cm: 44, length_cm: 72, ease_min_cm: 4, ease_max_cm: 8 },
    },
    {
      id: 'v-l',
      size_label: 'L',
      color_name: 'Trắng',
      color_hex: '#FFFFFF',
      sku: 'SH-L',
      stock: 10,
      spec: { chest_cm: 106, waist_cm: 98, shoulder_cm: 46, length_cm: 74, ease_min_cm: 4, ease_max_cm: 8 },
    },
  ],
};

const SAMPLE_PANTS = {
  ...SAMPLE_SHIRT,
  id: 'prod-pants-1',
  category: 'pants',
  variants: [
    {
      id: 'p-s',
      size_label: 'S',
      color_name: 'Đen',
      color_hex: '#111111',
      sku: 'PT-S',
      stock: 5,
      spec: { chest_cm: 0, waist_cm: 76, hip_cm: 94, shoulder_cm: 0, length_cm: 96, ease_min_cm: 2, ease_max_cm: 4 },
    },
    {
      id: 'p-m',
      size_label: 'M',
      color_name: 'Đen',
      color_hex: '#111111',
      sku: 'PT-M',
      stock: 5,
      spec: { chest_cm: 0, waist_cm: 81, hip_cm: 98, shoulder_cm: 0, length_cm: 100, ease_min_cm: 2, ease_max_cm: 4 },
    },
  ],
};

describe('E-Commerce Fit Engine — calculateProductFit', () => {
  it('TC-FIT-01: selects optimal shirt size M when body chest/waist/shoulder hit target ease allowance', () => {
    // Arrange: body chest 94cm + 6cm ease = 100cm (matches M exactly)
    const user = {
      height_cm: 172,
      weight_kg: 68,
      chest_cm: 94,
      waist_cm: 85,
      hip_cm: 95,
      shoulder_cm: 43,
      arm_length_cm: 59,
      gender: 'male',
    };

    // Act
    const res = calculateProductFit(user, SAMPLE_SHIRT);

    // Assert
    assert.equal(res.recommended_size, 'M');
    assert.ok(res.match_percentage >= 92, `Expected >= 92%, got ${res.match_percentage}%`);
    assert.equal(res.deltas.chest_diff_cm, 6);
  });

  it('TC-FIT-02: penalizes too-tight chest variants and recommends larger size L for broader chest', () => {
    // Arrange: body chest 100cm cannot comfortably button S (94cm) or tight M (100cm)
    const user = {
      height_cm: 175,
      weight_kg: 78,
      chest_cm: 100,
      waist_cm: 91,
      hip_cm: 100,
      shoulder_cm: 45,
      arm_length_cm: 61,
      gender: 'male',
    };

    // Act
    const res = calculateProductFit(user, SAMPLE_SHIRT);

    // Assert
    assert.equal(res.recommended_size, 'L');
    assert.ok(res.deltas.chest_diff_cm > 0);
  });

  it('TC-FIT-03: avoids undersized pants (S) for taller users (>= 167cm, >= 52kg)', () => {
    // Arrange
    const user = {
      height_cm: 173,
      weight_kg: 63,
      chest_cm: 90,
      waist_cm: 76,
      hip_cm: 93,
      shoulder_cm: 43,
      arm_length_cm: 60,
      inseam_cm: 79,
      gender: 'male',
    };

    // Act
    const res = calculateProductFit(user, SAMPLE_PANTS);

    // Assert
    assert.equal(res.recommended_size, 'M');
  });

  it('TC-FIT-04: returns safe fallback recommendation when product has no variants', () => {
    // Arrange
    const emptyProduct = { ...SAMPLE_SHIRT, variants: [] };
    const user = {
      height_cm: 170,
      weight_kg: 65,
      chest_cm: 92,
      waist_cm: 78,
      hip_cm: 94,
      shoulder_cm: 42,
      arm_length_cm: 58,
      gender: 'male',
    };

    // Act
    const res = calculateProductFit(user, emptyProduct);

    // Assert
    assert.equal(res.recommended_size, 'M');
    assert.equal(res.match_percentage, 90);
  });
});
