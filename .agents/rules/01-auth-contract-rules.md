# RULE: BẮT BUỘC TUÂN THỦ API CONTRACT & DTO
**Áp dụng:** Toàn bộ mã nguồn Backend (Controllers, Services, DTOs) & Frontend (API Services, Types)

## 1. Cấu trúc Response
Mọi Controller / Handler trả về cho Client bắt buộc phải tuân theo interface sau:
```typescript
interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: {
    code: string;       // Bắt buộc thuộc ErrorCode enum
    message: string;    // Thông báo thân thiện cho người dùng
    details?: Array<{ field: string; issue: string }>;
  } | null;
  timestamp: string;    // ISO 8601 UTC
}
```

## 2. Quy tắc bắt buộc khi viết DTO & Schema
- Tất cả field names gửi lên hoặc trả về phải dùng định dạng `camelCase`.
- DTO validation ở Backend phải có cùng giá trị min, max và regex với Zod Schema ở Frontend:
  - `email`: max 254 ký tự, chuẩn RFC 5322, tự động `trim()` và `toLowerCase()`.
  - `password`: 8–32 ký tự, regex: `/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{}|;:,.<>?]).*$/`.
  - `confirmPassword`: Phải trùng khớp với `password`.
  - `termsAgreed`: Bắt buộc là `true`.
- Khi validation thất bại: Trả về HTTP `400 Bad Request` với mã `VALIDATION_FAILED` và mảng `details` chỉ rõ trường nào bị sai.

