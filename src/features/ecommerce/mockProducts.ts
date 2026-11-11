import type { FashionProduct } from './types';

export const INITIAL_USER_BODY: import('./types').UserBodyProfile = {
  height_cm: 172,
  weight_kg: 68,
  chest_cm: 96,
  waist_cm: 78,
  hip_cm: 96,
  shoulder_cm: 43,
  arm_length_cm: 58,
  gender: 'male',
};

export const MOCK_PRODUCTS: FashionProduct[] = [
  {
    id: 'prod-01',
    brand_name: 'Sartoria Milan',
    name: 'Áo Sơ Mi Oxford Dệt Nổi Royal Tailored',
    name_en: 'Royal Tailored Oxford Textured Shirt',
    slug: 'ao-so-mi-oxford-royal',
    category: 'shirt',
    gender_target: 'male',
    price: 680000,
    sale_price: 590000,
    rating: 4.9,
    reviews_count: 142,
    fabric_material: '100% Giza Cotton Ai Cập (Sợi chải kỹ 80/2)',
    fabric_material_en: '100% Egyptian Giza Cotton (80/2 Combed Yarn)',
    stretch_type: 'Không co giãn',
    image_url: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80',
    secondary_image_url: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80',
    description: 'Chế tác từ sợi bông Giza quý hiếm dệt cấu trúc Oxford thanh lịch. Phom dáng Regular Slim tôn bờ vai và lồng ngực vững chãi, chống nhăn tự nhiên.',
    description_en: 'Crafted from rare Egyptian Giza cotton with classic Oxford weave. Regular Slim silhouette highlights broad shoulders and firm chest with natural wrinkle resistance.',
    is_bestseller: true,
    variants: [
      {
        id: 'var-01-s',
        size_label: 'S',
        color_name: 'Trắng Sữa (Optic White)',
        color_hex: '#FAFAF9',
        sku: 'OXF-WHT-S',
        stock: 14,
        spec: { chest_cm: 98, waist_cm: 84, shoulder_cm: 42, length_cm: 71, ease_min_cm: 3, ease_max_cm: 7 }
      },
      {
        id: 'var-01-m',
        size_label: 'M',
        color_name: 'Trắng Sữa (Optic White)',
        color_hex: '#FAFAF9',
        sku: 'OXF-WHT-M',
        stock: 28,
        spec: { chest_cm: 102, waist_cm: 88, shoulder_cm: 43.5, length_cm: 73, ease_min_cm: 4, ease_max_cm: 8 }
      },
      {
        id: 'var-01-l',
        size_label: 'L',
        color_name: 'Trắng Sữa (Optic White)',
        color_hex: '#FAFAF9',
        sku: 'OXF-WHT-L',
        stock: 35,
        spec: { chest_cm: 106, waist_cm: 92, shoulder_cm: 45, length_cm: 75, ease_min_cm: 4, ease_max_cm: 8 }
      },
      {
        id: 'var-01-xl',
        size_label: 'XL',
        color_name: 'Trắng Sữa (Optic White)',
        color_hex: '#FAFAF9',
        sku: 'OXF-WHT-XL',
        stock: 12,
        spec: { chest_cm: 110, waist_cm: 96, shoulder_cm: 46.5, length_cm: 76.5, ease_min_cm: 5, ease_max_cm: 9 }
      }
    ]
  },
  {
    id: 'prod-02',
    brand_name: 'Nordic Thread',
    name: 'Áo Polo Dệt Kim Piqué Silk Blend',
    name_en: 'Piqué Silk Blend Knitted Polo',
    slug: 'ao-polo-piqué-silk-blend',
    category: 'polo',
    gender_target: 'male',
    price: 520000,
    rating: 4.8,
    reviews_count: 98,
    fabric_material: '85% Cotton chải kỹ + 15% Lụa Tự Nhiên',
    fabric_material_en: '85% Combed Cotton + 15% Natural Silk',
    stretch_type: 'Co giãn nhẹ (2-3%)',
    image_url: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&w=800&q=80',
    description: 'Thiết kế cổ sơ mi dệt liền khối không quăn mép. Sự pha trộn lụa tự nhiên mang lại bề mặt bóng mờ quý phái và độ thoáng khí tuyệt đối.',
    description_en: 'One-piece knitted shirt collar that never curls. Natural silk blend delivers understated luster and supreme all-day breathability.',
    is_bestseller: true,
    variants: [
      {
        id: 'var-02-s',
        size_label: 'S',
        color_name: 'Xanh Navy Hoàng Gia',
        color_hex: '#1E3A8A',
        sku: 'POLO-NVY-S',
        stock: 18,
        spec: { chest_cm: 96, waist_cm: 82, shoulder_cm: 41.5, length_cm: 69, ease_min_cm: 2, ease_max_cm: 6 }
      },
      {
        id: 'var-02-m',
        size_label: 'M',
        color_name: 'Xanh Navy Hoàng Gia',
        color_hex: '#1E3A8A',
        sku: 'POLO-NVY-M',
        stock: 22,
        spec: { chest_cm: 100, waist_cm: 86, shoulder_cm: 43, length_cm: 71, ease_min_cm: 3, ease_max_cm: 6.5 }
      },
      {
        id: 'var-02-l',
        size_label: 'L',
        color_name: 'Xanh Navy Hoàng Gia',
        color_hex: '#1E3A8A',
        sku: 'POLO-NVY-L',
        stock: 40,
        spec: { chest_cm: 104, waist_cm: 90, shoulder_cm: 44.5, length_cm: 73, ease_min_cm: 3, ease_max_cm: 7 }
      },
      {
        id: 'var-02-xl',
        size_label: 'XL',
        color_name: 'Xanh Navy Hoàng Gia',
        color_hex: '#1E3A8A',
        sku: 'POLO-NVY-XL',
        stock: 9,
        spec: { chest_cm: 108, waist_cm: 94, shoulder_cm: 46, length_cm: 74.5, ease_min_cm: 4, ease_max_cm: 8 }
      }
    ]
  },
  {
    id: 'prod-03',
    brand_name: 'Sartoria Milan',
    name: 'Quần Tây Tapered Fit Xếp Ly Đôi Ý',
    name_en: 'Italian Double-Pleated Tapered Trousers',
    slug: 'quan-tay-tapered-y',
    category: 'pants',
    gender_target: 'male',
    price: 850000,
    sale_price: 765000,
    rating: 5.0,
    reviews_count: 73,
    fabric_material: 'Wool Blend Cao Cấp (70% Wool Úc + 30% Spun Poly)',
    fabric_material_en: 'Premium Australian Wool Blend (70% Wool + 30% Spun Poly)',
    stretch_type: 'Co giãn nhẹ (2-3%)',
    image_url: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=800&q=80',
    description: 'Thiết kế cạp cao Gurkha kèm đai chỉnh hông Side-adjusters không cần thắt lưng. Phom dáng xếp ly đôi buông rủ thanh lịch kéo dài đôi chân.',
    description_en: 'Gurkha high-rise waistband with side-adjusters for a clean beltless look. Double forward pleats create an elegant drape that elongates leg lines.',
    is_bespoke: true,
    variants: [
      {
        id: 'var-03-s',
        size_label: 'S',
        color_name: 'Xám Khói Charcoal',
        color_hex: '#334155',
        sku: 'TR-CHR-S',
        stock: 10,
        spec: { chest_cm: 0, waist_cm: 78, hip_cm: 96, shoulder_cm: 0, length_cm: 97, ease_min_cm: 1, ease_max_cm: 4 }
      },
      {
        id: 'var-03-m',
        size_label: 'M',
        color_name: 'Xám Khói Charcoal',
        color_hex: '#334155',
        sku: 'TR-CHR-M',
        stock: 25,
        spec: { chest_cm: 0, waist_cm: 82, hip_cm: 100, shoulder_cm: 0, length_cm: 99, ease_min_cm: 2, ease_max_cm: 4.5 }
      },
      {
        id: 'var-03-l',
        size_label: 'L',
        color_name: 'Xám Khói Charcoal',
        color_hex: '#334155',
        sku: 'TR-CHR-L',
        stock: 30,
        spec: { chest_cm: 0, waist_cm: 86, hip_cm: 104, shoulder_cm: 0, length_cm: 101, ease_min_cm: 2, ease_max_cm: 5 }
      },
      {
        id: 'var-03-xl',
        size_label: 'XL',
        color_name: 'Xám Khói Charcoal',
        color_hex: '#334155',
        sku: 'TR-CHR-XL',
        stock: 8,
        spec: { chest_cm: 0, waist_cm: 90, hip_cm: 108, shoulder_cm: 0, length_cm: 102.5, ease_min_cm: 2, ease_max_cm: 5 }
      }
    ]
  },
  {
    id: 'prod-04',
    brand_name: "L'Étoile Atelier",
    name: 'Đầm Lụa Satin Cổ Đổ Silk Bias Cut',
    name_en: 'Mulberry Silk Cowl-Neck Bias Cut Dress',
    slug: 'dam-lua-satin-co-do',
    category: 'dress',
    gender_target: 'female',
    price: 1250000,
    rating: 4.9,
    reviews_count: 64,
    fabric_material: '100% Lụa Tằm Dâu Mulberry Satin 19 Momme',
    fabric_material_en: '100% Mulberry Silk Satin 19 Momme',
    stretch_type: 'Không co giãn',
    image_url: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=800&q=80',
    description: 'Kỹ thuật cắt xéo vải Bias-cut độc quyền ôm sát từng đường cong cơ thể mà không gây bó thắt. Cổ đổ quyến rũ tôn xương quai xanh.',
    description_en: 'Proprietary bias-cut technique wraps natural curves gracefully without tightness. Dramatic cowl neck gracefully frames the collarbone.',
    is_bespoke: true,
    variants: [
      {
        id: 'var-04-xs',
        size_label: 'XS',
        color_name: 'Vàng Champagne Ánh Kim',
        color_hex: '#FDE68A',
        sku: 'DRS-GLD-XS',
        stock: 6,
        spec: { chest_cm: 82, waist_cm: 64, hip_cm: 88, shoulder_cm: 37, length_cm: 118, ease_min_cm: 1.5, ease_max_cm: 4 }
      },
      {
        id: 'var-04-s',
        size_label: 'S',
        color_name: 'Vàng Champagne Ánh Kim',
        color_hex: '#FDE68A',
        sku: 'DRS-GLD-S',
        stock: 14,
        spec: { chest_cm: 86, waist_cm: 68, hip_cm: 92, shoulder_cm: 38, length_cm: 120, ease_min_cm: 2, ease_max_cm: 4.5 }
      },
      {
        id: 'var-04-m',
        size_label: 'M',
        color_name: 'Vàng Champagne Ánh Kim',
        color_hex: '#FDE68A',
        sku: 'DRS-GLD-M',
        stock: 18,
        spec: { chest_cm: 90, waist_cm: 72, hip_cm: 96, shoulder_cm: 39, length_cm: 122, ease_min_cm: 2, ease_max_cm: 5 }
      },
      {
        id: 'var-04-l',
        size_label: 'L',
        color_name: 'Vàng Champagne Ánh Kim',
        color_hex: '#FDE68A',
        sku: 'DRS-GLD-L',
        stock: 7,
        spec: { chest_cm: 94, waist_cm: 76, hip_cm: 100, shoulder_cm: 40.5, length_cm: 123.5, ease_min_cm: 2, ease_max_cm: 5 }
      }
    ]
  },
  {
    id: 'prod-05',
    brand_name: 'Atelier 12',
    name: 'Áo Blazer Cấu Trúc Nhẹ Deconstructed Linen',
    name_en: 'Deconstructed French Linen Lightweight Blazer',
    slug: 'ao-blazer-linen-deconstructed',
    category: 'tailored',
    gender_target: 'unisex',
    price: 1850000,
    sale_price: 1650000,
    rating: 4.95,
    reviews_count: 51,
    fabric_material: '100% Linen Thuần Pháp (Normandy Flax 240gsm)',
    fabric_material_en: '100% French Normandy Flax Linen (240gsm)',
    stretch_type: 'Không co giãn',
    image_url: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80',
    description: 'Loại bỏ hoàn toàn đệm vai cứng nhắc, may nửa lót bán thủ công mang lại cảm giác nhẹ bẫng và bay bổng trong tiết trời hè thu.',
    description_en: 'Zero rigid shoulder pads with semi-lined artisan tailoring for an airy, weightless feel through summer and autumn.',
    is_bespoke: true,
    variants: [
      {
        id: 'var-05-s',
        size_label: 'S',
        color_name: 'Nâu Cát Mộc (Sand Beige)',
        color_hex: '#D7C4B7',
        sku: 'BLZ-SND-S',
        stock: 8,
        spec: { chest_cm: 100, waist_cm: 88, shoulder_cm: 43, length_cm: 72, ease_min_cm: 5, ease_max_cm: 9 }
      },
      {
        id: 'var-05-m',
        size_label: 'M',
        color_name: 'Nâu Cát Mộc (Sand Beige)',
        color_hex: '#D7C4B7',
        sku: 'BLZ-SND-M',
        stock: 15,
        spec: { chest_cm: 104, waist_cm: 92, shoulder_cm: 44.5, length_cm: 74, ease_min_cm: 5, ease_max_cm: 10 }
      },
      {
        id: 'var-05-l',
        size_label: 'L',
        color_name: 'Nâu Cát Mộc (Sand Beige)',
        color_hex: '#D7C4B7',
        sku: 'BLZ-SND-L',
        stock: 20,
        spec: { chest_cm: 108, waist_cm: 96, shoulder_cm: 46, length_cm: 76, ease_min_cm: 6, ease_max_cm: 10.5 }
      },
      {
        id: 'var-05-xl',
        size_label: 'XL',
        color_name: 'Nâu Cát Mộc (Sand Beige)',
        color_hex: '#D7C4B7',
        sku: 'BLZ-SND-XL',
        stock: 5,
        spec: { chest_cm: 112, waist_cm: 100, shoulder_cm: 47.5, length_cm: 77.5, ease_min_cm: 6, ease_max_cm: 11 }
      }
    ]
  },
  {
    id: 'prod-06',
    brand_name: 'Nordic Thread',
    name: 'Quần Chino Slim Tapered Vải Cotton Co Giãn',
    name_en: 'Stretch Cotton Twill Slim Tapered Chinos',
    slug: 'quan-chino-cotton-stretch',
    category: 'pants',
    gender_target: 'male',
    price: 590000,
    rating: 4.75,
    reviews_count: 110,
    fabric_material: '97% Cotton chéo Twill + 3% Elastane',
    fabric_material_en: '97% Cotton Twill + 3% Elastane Comfort Stretch',
    stretch_type: 'Co giãn tốt (4-way)',
    image_url: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=800&q=80',
    description: 'Chất vải chéo Twill bền bỉ bổ sung sợi co giãn giúp đứng ngồi vận động thoải mái mà không bị gãy ly quần.',
    description_en: 'Robust twill weave infused with elastane stretch ensures crisp creases and ease of movement between sitting and walking.',
    variants: [
      {
        id: 'var-06-s',
        size_label: 'S',
        color_name: 'Xanh Rêu Ôliu (Olive Drab)',
        color_hex: '#556B2F',
        sku: 'CHN-OLV-S',
        stock: 12,
        spec: { chest_cm: 0, waist_cm: 76, hip_cm: 94, shoulder_cm: 0, length_cm: 96, ease_min_cm: 1, ease_max_cm: 3.5 }
      },
      {
        id: 'var-06-m',
        size_label: 'M',
        color_name: 'Xanh Rêu Ôliu (Olive Drab)',
        color_hex: '#556B2F',
        sku: 'CHN-OLV-M',
        stock: 24,
        spec: { chest_cm: 0, waist_cm: 80, hip_cm: 98, shoulder_cm: 0, length_cm: 98, ease_min_cm: 1.5, ease_max_cm: 4 }
      },
      {
        id: 'var-06-l',
        size_label: 'L',
        color_name: 'Xanh Rêu Ôliu (Olive Drab)',
        color_hex: '#556B2F',
        sku: 'CHN-OLV-L',
        stock: 28,
        spec: { chest_cm: 0, waist_cm: 84, hip_cm: 102, shoulder_cm: 0, length_cm: 100, ease_min_cm: 2, ease_max_cm: 4.5 }
      },
      {
        id: 'var-06-xl',
        size_label: 'XL',
        color_name: 'Xanh Rêu Ôliu (Olive Drab)',
        color_hex: '#556B2F',
        sku: 'CHN-OLV-XL',
        stock: 14,
        spec: { chest_cm: 0, waist_cm: 88, hip_cm: 106, shoulder_cm: 0, length_cm: 101.5, ease_min_cm: 2, ease_max_cm: 5 }
      }
    ]
  }
];

