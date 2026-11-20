# 🧪 FITVISION 3D — ENTERPRISE TEST ARCHITECTURE & TEST MATRIX

> **Chuẩn áp dụng:** Test Pyramid (80% Unit / 15% Integration / 5% E2E), Arrange-Act-Assert (AAA), DAMP over DRY, Real Implementations Over Mocks (`node:test` + `--experimental-strip-types`).  
> **Chất lượng cổng kiểm soát (CI Quality Gates):** `.github/workflows/ci.yml` chạy tự động trên mọi Pull Request và Push vào `Developer` và `main`.

---

## 1. Cấu trúc Thư mục Kiểm thử Chuẩn Doanh Nghiệp

```text
tests/
├── TEST_MATRIX.md                          # Ma trận Test Case & Traceability
├── unit/                                   # Small Tests (~80%, < 50ms, không I/O)
│   ├── biometrics.test.mjs                 # Ramanujan Ellipse, Volume Penalty, BMI
│   ├── fit-calculator.test.mjs             # Product Fit Score %, Ease Allowance, Penalty rules
│   └── validation-rules.test.mjs           # Email, Disposable Domains, VN Phone, Password, Honeypot
├── integration/                            # Medium Tests (~15%, kiểm chứng Contract & Schema)
│   ├── size-charts-integrity.test.mjs      # Kiểm chứng dữ liệu bảng size đa hệ (Asia/US/EU/UK)
│   └── architecture-contracts.test.mjs     # Kiểm chứng SQL Schema, Zero-Retention & i18n parity
└── test_sizing_ts.mjs                      # Legacy CLI verification script (giữ tương thích)
```

---

## 2. Lệnh Chạy Kiểm Thử

```bash
# Chạy toàn bộ Test Suite (Unit + Integration)
npm test

# Chỉ chạy Unit Tests
npm run test:unit

# Chỉ chạy Integration / Contract Tests
npm run test:integration
```

---

## 3. Ma Trận Test Cases Cốt Lõi (Core Test Matrix)

| Test ID | Nhóm (Layer) | Mô tả kịch bản kiểm thử | Kết quả kỳ vọng (Expected) | File kiểm chứng |
| :--- | :--- | :--- | :--- | :--- |
| **TC-BIO-01** | Unit | Chu vi hình tròn ($a = b = 15\text{ cm}$) qua `ramanujanCircumference` | Khớp $2\pi r = 94.2478\text{ cm}$ (sai số $< 0.01\text{ cm}$) | `tests/unit/biometrics.test.mjs` |
| **TC-BIO-02** | Unit | Chu vi elip dẹt ($a = 18, b = 12$) qua `ramanujanCircumference` | Sai số $< 0.4\%$ so với tích phân elip chính xác ($\approx 95.36\text{ cm}$) | `tests/unit/biometrics.test.mjs` |
| **TC-BIO-03** | Unit | Đầu vào không hợp lệ ($a \le 0$ hoặc $b \le 0$) | Throw `Error` bảo vệ khỏi NaN/Infinity | `tests/unit/biometrics.test.mjs` |
| **TC-BIO-04** | Unit | Thể tích sinh học `computeBiologicalVolume(65)` ($\rho = 1.01$) | Trả về `64356.44 cm³`; từ chối cân nặng $\le 0$ hoặc $> 500\text{ kg}$ | `tests/unit/biometrics.test.mjs` |
| **TC-BIO-05** | Unit | Áp dụng `computeVolumePenalty` khi mặc áo phồng ($V_{\text{ellipsoid}} > 1.05 V_{\text{bio}}$) | `penalty_applied = true`, $0 < k_{\text{penalty}} < 1$ | `tests/unit/biometrics.test.mjs` |
| **TC-BIO-06** | Unit | Không phạt thể tích khi mặc đồ ôm sát ($V_{\text{ellipsoid}} \le 1.05 V_{\text{bio}}$) | `penalty_applied = false`, `k_penalty = 1.0` | `tests/unit/biometrics.test.mjs` |
| **TC-FIT-01** | Unit | Chọn size Áo sơ mi khớp ngực & vai (`calculateProductFit`) | Trả đúng biến thể tối ưu, `match_percentage >= 90` | `tests/unit/fit-calculator.test.mjs` |
| **TC-FIT-02** | Unit | Phạt nặng khi ngực áo nhỏ hơn ngực người (`chestDiff < 0`) | Tránh chọn size quá chật, ưu tiên size lớn hơn | `tests/unit/fit-calculator.test.mjs` |
| **TC-FIT-03** | Unit | Chọn size Quần cho người cao $\ge 167\text{ cm}$, nặng $\ge 52\text{ kg}$ | Phạt size XS/S để tránh cộc đáy quần | `tests/unit/fit-calculator.test.mjs` |
| **TC-FIT-04** | Unit | Sản phẩm không có mảng `variants` | Trả về fallback an toàn size `M` không crash | `tests/unit/fit-calculator.test.mjs` |
| **TC-SEC-01** | Unit | Chặn email rác / 10 phút (`tempmail.com`, `yopmail.com`) | `validateEmail` trả về `valid = false` | `tests/unit/validation-rules.test.mjs` |
| **TC-SEC-02** | Unit | Chấp nhận email uy tín (`gmail.com`) & số điện thoại VN (`09x`, `+849x`) | `valid = true` | `tests/unit/validation-rules.test.mjs` |
| **TC-SEC-03** | Unit | Kiểm tra mật khẩu yếu vs mạnh & bẫy Honeypot chống bot | Chặn mật khẩu thiếu ký tự đặc biệt; chặn khi honeypot có giá trị | `tests/unit/validation-rules.test.mjs` |
| **TC-INT-01** | Integration | Tính toàn vẹn bảng size `shared/size-charts.json` (Men & Women) | `min < max`, đầy đủ 4 hệ `asia/us/eu/uk`, inseam tăng dần | `tests/integration/size-charts-integrity.test.mjs` |
| **TC-INT-02** | Integration | Hợp đồng SQL Schema & Zero-Retention Compliance | Có đủ bảng `users`, `biometric_inputs`, `measurements`, `mesh_parameters`, `system_audit_logs` (`zero_retention_flag`) | `tests/integration/architecture-contracts.test.mjs` |
| **TC-INT-03** | Integration | Tính hợp lệ song ngữ `vi.json` & `en.json` | JSON hợp lệ, không rỗng | `tests/integration/architecture-contracts.test.mjs` |
