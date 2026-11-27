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
  image_url?: string;
  sku: string;
  stock: number;
  spec: GarmentMeasurementSpec;
}

export interface FashionProduct {
  id: string;
  brand_name: string;
  shop_id?: string | null;
  is_mall?: boolean;
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
  video_url?: string | null;
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
  inseam_cm?: number;
  gender: 'male' | 'female' | 'neutral';
  source?: 'scan' | 'manual' | 'demo';
  updated_at?: string;
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

export type PaymentMethod = 'paypal';

export interface OrderMeasurementSnapshot {
  stature_cm: number;
  weight_kg: number;
  gender: string;
  calculated_bmi?: number;
  chest_circ_cm: number;
  waist_circ_cm: number;
  hip_circ_cm: number;
  shoulder_breadth_cm?: number | null;
  arm_length_cm?: number | null;
  inseam_cm?: number | null;
  bicep_circ_cm?: number | null;
  wrist_circ_cm?: number | null;
  thigh_circ_cm?: number | null;
  calf_circ_cm?: number | null;
  ankle_circ_cm?: number | null;
  source?: string;
  captured_at?: string;
}

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
  shop_id?: string | null;
  has_bespoke_items?: boolean;
  measurement_snapshot?: OrderMeasurementSnapshot | null;
  estimated_delivery?: string;
  payment_group_id?: string | null;
  paypal_order_id?: string | null;
  paypal_capture_id?: string | null;
  exchange_rate_vnd?: number;
  paid_amount_usd?: number | null;
  paypal_fee_usd?: number | null;
  platform_fee_rate?: number | null;
  completed_at?: string | null;
  payout_status?: 'PENDING_DELIVERY' | 'READY_FOR_PAYOUT' | 'PROCESSING' | 'PAID_OUT' | string;
}

export interface CreateOrderInput {
  customer_id: string;
  customer_name: string;
  recipient: OrderRecipient;
  items: CartItem[];
  coupon_code?: string;
  subtotal: number;
  shipping_fee: number;
  discount_amount: number;
  total_amount: number;
  payment_method: PaymentMethod;
  store_name?: string;
  has_bespoke_items?: boolean;
  measurement_snapshot?: OrderMeasurementSnapshot | null;
}


