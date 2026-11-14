// ============================================================
// FITVISION 3D - E-COMMERCE & SMART SIZING TYPES
// Designed under UI/UX Pro Max & Frontend-Design Principles
// ============================================================

export interface GarmentMeasurementSpec {
  chest_cm: number;
  waist_cm: number;
  hip_cm?: number;
  shoulder_cm: number;
  sleeve_cm?: number;
  length_cm: number;
  ease_min_cm: number;
  ease_max_cm: number;
}

export interface ProductVariant {
  id: string;
  size_label: 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL';
  color_name: string;
  color_name_en?: string;
  color_hex: string;
  sku: string;
  stock: number;
  spec: GarmentMeasurementSpec;
}

export interface FashionProduct {
  id: string;
  brand_name: string;
  name: string;
  name_en?: string;
  slug: string;
  category: 'all' | 'shirt' | 'polo' | 'pants' | 'dress' | 'tailored';
  gender_target: 'male' | 'female' | 'unisex';
  price: number;
  sale_price?: number;
  rating: number;
  reviews_count: number;
  fabric_material: string;
  fabric_material_en?: string;
  stretch_type: 'Không co giãn' | 'Co giãn nhẹ (2-3%)' | 'Co giãn tốt (4-way)';
  image_url: string;
  secondary_image_url?: string;
  description: string;
  description_en?: string;
  variants: ProductVariant[];
  is_bestseller?: boolean;
  is_bespoke?: boolean;
}

export interface UserBodyProfile {
  height_cm: number;
  weight_kg: number;
  chest_cm: number;
  waist_cm: number;
  hip_cm: number;
  shoulder_cm: number;
  arm_length_cm: number;
  gender: 'male' | 'female' | 'neutral';
}

export interface FitMatchResult {
  recommended_size: 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL';
  match_percentage: number;
  fit_verdict: 'PERFECT_FIT' | 'SLIGHTLY_SNUG' | 'RELAXED' | 'OUT_OF_RANGE';
  verdict_label_vi: string;
  verdict_label_en: string;
  deltas: {
    chest_diff_cm: number; // Garment chest - Body chest (Ease allowance)
    waist_diff_cm: number;
    shoulder_diff_cm: number;
  };
  advisor_advice_vi: string;
  advisor_advice_en: string;
}

export interface CartItem {
  id: string;
  product: FashionProduct;
  variant: ProductVariant;
  quantity: number;
  fit_score: number;
  is_ai_recommended: boolean;
}

export type OrderStatus = 'pending' | 'confirmed' | 'tailoring' | 'shipping' | 'completed' | 'cancelled';

export interface OrderRecipient {
  full_name: string;
  phone: string;
  address: string;
  city: string;
  note?: string;
}

export type PaymentMethod = 'cod' | 'vietqr_sepay';

export interface Order {
  id: string;
  customer_id: string;
  customer_name: string;
  recipient: OrderRecipient;
  items: CartItem[];
  subtotal: number;
  shipping_fee: number;
  discount_amount: number;
  total_amount: number;
  payment_method: PaymentMethod;
  payment_status: 'unpaid' | 'paid';
  status: OrderStatus;
  created_at: string;
  store_name?: string;
  estimated_delivery?: string;
}

export interface CreateOrderInput {
  customer_id: string;
  customer_name: string;
  recipient: OrderRecipient;
  items: CartItem[];
  subtotal: number;
  shipping_fee: number;
  discount_amount: number;
  total_amount: number;
  payment_method: PaymentMethod;
  store_name?: string;
}


