// ============================================================
// FITVISION 3D - MOCK DATA (typed strictly with database.types)
// Only schema-defined columns are present here.
// ============================================================
import type {
  Profile, BiometricInput, Measurement, MeshParameter, Recommendation,
  TailorDossier, SystemAuditLog, GarmentCategory, BrandSizeChart, Store,
} from "../types/database.types";

export const bmi = (weight_kg: number, stature_cm: number): number =>
  Math.round((weight_kg / Math.pow(stature_cm / 100, 2)) * 100) / 100;

// ── Dashboard demo scan ───────────────────────────────────
export const DEMO_BIOMETRIC: BiometricInput = {
  id: "bio-001", user_id: "usr-001",
  stature_cm: 172, weight_kg: 70, gender: "male",
  calculated_bmi: bmi(70, 172), created_at: "2026-10-18T14:30:00Z",
};

export const DEMO_MEASUREMENT: Measurement = {
  id: "mea-001", user_id: "usr-001", input_id: "bio-001",
  chest_circ_cm: 92.4, waist_circ_cm: 76.8, hip_circ_cm: 96.2,
  inseam_cm: 78.5, shoulder_breadth_cm: 42.1,
  extraction_confidence: 0.94, created_at: "2026-10-18T14:30:02Z",
};

export const DEMO_MESH: MeshParameter = {
  id: "msh-001", measurement_id: "mea-001", base_gender_mesh: "male_base",
  scale_chest: 1.05, scale_waist: 0.95, scale_hips: 1.08,
  morph_payload: null, created_at: "2026-10-18T14:30:02Z",
};

export const DEMO_RECOMMENDATION: Recommendation & { brand_name: string } = {
  id: "rec-001", measurement_id: "mea-001", size_chart_id: "chart-001",
  brand_name: "Urban Atelier",
  recommended_size: "M", fit_type: "regular",
  chest_delta_cm: 0.4, waist_delta_cm: -0.8,
  gemini_advisor_tip:
    "Size M in a regular fit follows your chest closely. The waist sits 0.8 cm inside the chart range, so the garment will drape without pulling.",
  created_at: "2026-10-18T14:30:03Z",
};

export const DEMO_AUDIT: SystemAuditLog = {
  id: 1, user_id: "usr-001", action_type: "body_scan",
  execution_time_ms: 2412, zero_retention_flag: true,
  ip_address_hash: "9f2c41ab07de", created_at: "2026-10-18T14:30:03Z",
};

// ── Tailor Studio dossiers ────────────────────────────────
export interface DossierRecord {
  profile: Profile;
  biometric: BiometricInput;
  measurement: Measurement;
  mesh: MeshParameter;
  dossier: TailorDossier;
  dossier_code: string;
}

const mk = (
  n: number, full_name: string, email: string,
  gender: BiometricInput["gender"], stature_cm: number, weight_kg: number,
  m: Pick<Measurement, "chest_circ_cm" | "waist_circ_cm" | "hip_circ_cm" | "inseam_cm" | "shoulder_breadth_cm" | "extraction_confidence">,
  token: string, expires: string,
  dossier_code: string,
): DossierRecord => ({
  profile: {
    id: `usr-10${n}`, full_name, email, role: "customer", avatar_url: null,
    created_at: "2026-09-01T08:00:00Z", updated_at: "2026-09-01T08:00:00Z",
  },
  biometric: {
    id: `bio-10${n}`, user_id: `usr-10${n}`, stature_cm, weight_kg, gender,
    calculated_bmi: bmi(weight_kg, stature_cm), created_at: "2026-10-16T10:00:00Z",
  },
  measurement: {
    id: `mea-10${n}`, user_id: `usr-10${n}`, input_id: `bio-10${n}`,
    ...m, created_at: "2026-10-16T10:00:02Z",
  },
  mesh: {
    id: `msh-10${n}`, measurement_id: `mea-10${n}`,
    base_gender_mesh: gender === "female" ? "female_base" : gender === "male" ? "male_base" : "neutral_base",
    scale_chest: Math.round((m.chest_circ_cm / 88) * 1000) / 1000,
    scale_waist: Math.round((m.waist_circ_cm / 80) * 1000) / 1000,
    scale_hips:  Math.round((m.hip_circ_cm / 94) * 1000) / 1000,
    morph_payload: null, created_at: "2026-10-16T10:00:02Z",
  },
  dossier: {
    id: `dos-10${n}`, measurement_id: `mea-10${n}`, tailor_id: "usr-tailor-01",
    access_token: token, token_expires_at: expires, pdf_export_url: null,
    created_at: "2026-10-16T10:01:00Z",
  },
  dossier_code,
});

export const DOSSIERS: DossierRecord[] = [
  mk(1, "Alexander Nguyen", "alexander.nguyen@example.com", "male", 176, 74,
    { chest_circ_cm: 94.8, waist_circ_cm: 78.2, hip_circ_cm: 97.4, inseam_cm: 77.8, shoulder_breadth_cm: 44.5, extraction_confidence: 0.96 },
    "fv3d_tok_a1b2c3d4e5f60718293a4b5c6d7e8f90", "2026-12-18T14:30:00Z", "FV-8492-AN"),
  mk(2, "Marcus Tran", "marcus.tran@example.com", "male", 181, 82,
    { chest_circ_cm: 98.2, waist_circ_cm: 82.5, hip_circ_cm: 100.2, inseam_cm: 79.0, shoulder_breadth_cm: 46.0, extraction_confidence: 0.92 },
    "fv3d_tok_0f9e8d7c6b5a4938271605f4e3d2c1b0", "2026-12-17T10:15:00Z", "FV-7215-MT"),
  mk(3, "Linh Pham", "linh.pham@example.com", "female", 164, 55,
    { chest_circ_cm: 84.6, waist_circ_cm: 66.8, hip_circ_cm: 92.0, inseam_cm: 74.2, shoulder_breadth_cm: 37.8, extraction_confidence: 0.89 },
    "fv3d_tok_7c6b5a49382716f5e4d3c2b1a0918273", "2026-12-16T16:45:00Z", "FV-3608-LP"),
];

// ── Size Chart Manager ────────────────────────────────────
export const GARMENT_CATEGORIES: GarmentCategory[] = [
  { id: 1, name: "T-Shirt",     target_gender: "unisex", primary_measurement: "chest_circ_cm", created_at: "" },
  { id: 2, name: "Dress Shirt", target_gender: "male",   primary_measurement: "chest_circ_cm", created_at: "" },
  { id: 3, name: "Blouse",      target_gender: "female", primary_measurement: "chest_circ_cm", created_at: "" },
  { id: 4, name: "Trousers",    target_gender: "male",   primary_measurement: "waist_circ_cm", created_at: "" },
  { id: 5, name: "Skirt",       target_gender: "female", primary_measurement: "hip_circ_cm",   created_at: "" },
  { id: 6, name: "Jacket",      target_gender: "unisex", primary_measurement: "chest_circ_cm", created_at: "" },
];

export const BRAND_NAMES = ["Urban Atelier", "Nordic Thread", "Atelier Hanoi"] as const;
const BRAND_OFFSET: Record<string, number> = { "Urban Atelier": 0, "Nordic Thread": 2, "Atelier Hanoi": -2 };

export type SizeRow = Pick<
  BrandSizeChart,
  "size_label" | "min_chest" | "max_chest" | "min_waist" | "max_waist" | "min_hip" | "max_hip"
> & { id: string };

// CHÚ THÍCH QUAN TRỌNG:
// BASE_ROWS dưới đây là bảng tham chiếu demo dành riêng cho Size Chart Manager / Xưởng may đối tác,
// KHÔNG dùng để tính kích cỡ may mặc đề xuất cho người dùng.
// Logic tính size chuẩn quốc tế (Châu Á, US, EU, UK) được quản lý tập trung tại `shared/size-charts.json`
// và thực thi qua `src/utils/garmentSizeCalculator.ts`.
const BASE_ROWS: Array<[string, number, number, number, number, number, number]> = [
  ["XS", 84, 88, 68, 72, 88, 92],
  ["S",  88, 92, 72, 76, 92, 96],
  ["M",  92, 96, 76, 81, 96, 100],
  ["L",  96, 101, 81, 86, 100, 105],
  ["XL", 101, 107, 86, 92, 105, 111],
  ["2XL", 107, 114, 92, 99, 111, 118],
];

export const buildSizeRows = (brand: string): SizeRow[] => {
  const o = BRAND_OFFSET[brand] ?? 0;
  return BASE_ROWS.map(([label, a, b, c, d, e, f]) => ({
    id: `${brand}-${label}`, size_label: label,
    min_chest: a + o, max_chest: b + o,
    min_waist: c + o, max_waist: d + o,
    min_hip: e + o, max_hip: f + o,
  }));
};

// ── Pre-populated RBAC & Merchant Test States ───────────────
export const TEST_USERS: Record<string, Profile> = {
  regular: {
    id: "usr-regular",
    full_name: "Hoàng Minh Quân",
    email: "quan.hoang@fitvision3d.com",
    role: "user",
    avatar_url: null,
    created_at: "2026-10-01T08:00:00Z",
    updated_at: "2026-10-01T08:00:00Z",
  },
  pending: {
    id: "usr-pending",
    full_name: "Lê Thu Hà (Nhà May Hà Nội)",
    email: "ha.le@ateliervietnam.vn",
    role: "user",
    avatar_url: null,
    created_at: "2026-10-05T09:00:00Z",
    updated_at: "2026-10-05T09:00:00Z",
  },
  store: {
    id: "usr-store",
    full_name: "Bùi Thanh Sơn (Tailor Master)",
    email: "son.bui@urbanatelier.com",
    role: "store",
    avatar_url: null,
    created_at: "2026-09-15T10:00:00Z",
    updated_at: "2026-09-15T10:00:00Z",
  },
  admin: {
    id: "usr-admin",
    full_name: "Lê Văn Thắng",
    email: "levanthang0166@gmail.com",
    role: "admin",
    avatar_url: null,
    created_at: "2026-08-01T00:00:00Z",
    updated_at: "2026-08-01T00:00:00Z",
  },
};

export const INITIAL_MOCK_STORES: Store[] = [
  {
    id: "store-001",
    user_id: "usr-pending",
    brand_name: "Atelier Hà Nội Bespoke",
    phone: "0912345678",
    address: "45 Tràng Tiền, Quận Hoàn Kiếm, Hà Nội",
    verification_doc: "https://atelier-hanoi.vn (GPKD: 0108928374)",
    status: "PENDING",
    is_approved: false,
    rejection_reason: null,
    created_at: "2026-11-01T09:30:00Z",
    updated_at: "2026-11-01T09:30:00Z",
  },
  {
    id: "store-002",
    user_id: "usr-store",
    brand_name: "Urban Atelier Sài Gòn",
    phone: "0987654321",
    address: "128 Đồng Khởi, Quận 1, TP. Hồ Chí Minh",
    verification_doc: "https://urbanatelier.com (GPKD: 0314829103)",
    status: "APPROVED",
    is_approved: true,
    rejection_reason: null,
    created_at: "2026-10-15T10:30:00Z",
    updated_at: "2026-10-15T10:30:00Z",
  },
  {
    id: "store-003",
    user_id: "usr-rejected",
    brand_name: "Fast Fashion Clone Ltd",
    phone: "0905123456",
    address: "12 Chợ Đêm Đồng Xuân, Hà Nội",
    verification_doc: "Không có link hoặc giấy phép hợp lệ",
    status: "REJECTED",
    is_approved: false,
    rejection_reason: "Giấy phép kinh doanh không khớp thông tin đăng ký doanh nghiệp quốc gia và địa chỉ chưa được xác thực.",
    created_at: "2026-10-20T14:00:00Z",
    updated_at: "2026-10-20T14:00:00Z",
  },
];
