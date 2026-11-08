# HƯỚNG DẪN ĐỒNG BỘ BACKEND & FRONTEND (FE-BE SYNC GUIDE)
**Dự án:** FitVision3D / Fashion3D  
**Dành cho:** Backend Developer (Bạn) & Frontend Developer (Đồng nghiệp)  
**Mục tiêu:** Giảm thiểu 100% nguy cơ conflict, mismatch dữ liệu, và lỗi tích hợp API.

---

## 1. NGUYÊN TẮC LÀM VIỆC CHUNG (TEAM AGREEMENT)

1. **Tuân thủ tuyệt đối API Contract (`02_API_CONTRACT.md`):**
   - Backend cam kết trả về đúng định dạng payload, HTTP status code và mã `error.code`.
   - Frontend cam kết gửi đúng tên trường, kiểu dữ liệu và bắt lỗi theo mã `error.code`.
   - Bất kỳ thay đổi nào về API (thêm/sửa trường) **phải được cập nhật vào tài liệu trước** và thông báo cho đối phương trước khi sửa code.

2. **Quy chuẩn đặt tên dữ liệu (Data Conventions):**
   - Mọi key trong JSON Request Body và Response Body bắt buộc dùng **`camelCase`** (ví dụ: `fullName`, `confirmPassword`, `phoneNumber`, `turnstileToken`).
   - Mã lỗi `error.code` luôn dùng **`UPPER_SNAKE_CASE`** (ví dụ: `AUTH_INVALID_CREDENTIALS`, `AUTH_EMAIL_NOT_VERIFIED`).
   - Mọi mốc thời gian gửi đi đều dùng định dạng **ISO 8601 UTC** (ví dụ: `2026-11-02T14:30:00.000Z`).

3. **Cơ chế lưu trữ Token:**
   - **Access Token:** Frontend lưu trong RAM / State Management (Redux, Zustand, Pinia, hoặc React Context). **Tuyệt đối không lưu vào `localStorage`** để chống lỗ hổng XSS.
   - **Refresh Token:** Backend tự động thiết lập qua `Set-Cookie` (`HttpOnly`, `Secure`, `SameSite=Lax`). Frontend không cần (và không thể) đọc token này bằng JavaScript.

---

## 2. AXIOS INTERCEPTOR MẪU (DÀNH CHO FRONTEND DEVELOPER)

Khi Access Token hết hạn (sau 15 phút), hàng loạt request đồng thời của người dùng sẽ nhận mã `401 Unauthorized`. 

Đoạn code dưới đây giải quyết triệt để lỗi **Race Condition** (nhiều request cùng lúc làm mới token gây xung đột) bằng kỹ thuật **Request Queue**:

```typescript
import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

// 1. Tạo instance Axios
export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1",
  headers: { "Content-Type": "application/json" },
  withCredentials: true, // BẮT BUỘC: Cho phép gửi và nhận HttpOnly Cookie (RefreshToken)
});

// 2. Biến lưu Access Token trong bộ nhớ RAM
let currentAccessToken: string | null = null;
export const setAccessToken = (token: string | null) => {
  currentAccessToken = token;
};

// 3. Request Interceptor: Luôn tự động gắn Bearer Token nếu có
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (currentAccessToken && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${currentAccessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 4. Response Interceptor: Tự động Refresh Token khi gặp lỗi 401
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Bỏ qua nếu lỗi không phải 401 hoặc request này đã từng thử lại một lần rồi
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Nếu chính API refresh-token bị lỗi 401 -> Phiên đăng nhập đã chết hoàn toàn
    if (originalRequest.url?.includes("/auth/refresh-token")) {
      setAccessToken(null);
      window.location.href = "/login?session_expired=true";
      return Promise.reject(error);
    }

    // Đánh dấu request này đang được xử lý lại
    originalRequest._retry = true;

    if (isRefreshing) {
      // Đưa request vào hàng đợi chờ token mới
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    isRefreshing = true;

    try {
      // Gọi API refresh token (Browser tự đính kèm RefreshToken Cookie)
      const res = await apiClient.post("/auth/refresh-token");
      const newAccessToken = res.data.data.accessToken;

      setAccessToken(newAccessToken);
      processQueue(null, newAccessToken);

      // Thử lại request ban đầu với AccessToken mới
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return apiClient(originalRequest);
    } catch (refreshErr) {
      processQueue(refreshErr, null);
      setAccessToken(null);
      window.location.href = "/login?session_expired=true";
      return Promise.reject(refreshErr);
    } finally {
      isRefreshing = false;
    }
  }
);
```

---

## 3. ZOD VALIDATION SCHEMA CHUNG (DÀNH CHO FRONTEND)

Frontend dùng bộ schema này (với Zod và React Hook Form / Formik) để đảm bảo validation khớp 100% với Backend DTO:

```typescript
import { z } from "zod";

// Regex mật khẩu: Tối thiểu 1 hoa, 1 thường, 1 số, 1 ký tự đặc biệt
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{}|;:,.<>?]).*$/;
const VIETNAM_PHONE_REGEX = /(84|0[3|5|7|8|9])+([0-9]{8})\b/;

// 1. Schema Đăng ký User
export const userRegisterSchema = z
  .object({
    email: z
      .string()
      .trim()
      .min(1, "Vui lòng nhập địa chỉ email.")
      .email("Địa chỉ email không đúng định dạng.")
      .max(254, "Email không được vượt quá 254 ký tự."),
    fullName: z
      .string()
      .trim()
      .min(2, "Họ và tên cần tối thiểu 2 ký tự.")
      .max(100, "Họ và tên tối đa 100 ký tự."),
    password: z
      .string()
      .min(8, "Mật khẩu phải có ít nhất 8 ký tự.")
      .max(32, "Mật khẩu không được dài quá 32 ký tự.")
      .regex(PASSWORD_REGEX, "Mật khẩu cần gồm chữ hoa, chữ thường, số và ký tự đặc biệt."),
    confirmPassword: z.string().min(1, "Vui lòng nhập lại mật khẩu xác nhận."),
    termsAgreed: z.literal(true, {
      errorMap: () => ({ message: "Bạn cần đồng ý với Điều khoản sử dụng." }),
    }),
    extraNotes: z.string().optional(), // Honeypot (luôn để rỗng)
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp.",
    path: ["confirmPassword"],
  });

// 2. Schema Đăng ký Shop Owner
export const shopRegisterSchema = userRegisterSchema
  .innerType()
  .extend({
    shopName: z
      .string()
      .trim()
      .min(3, "Tên cửa hàng phải có ít nhất 3 ký tự.")
      .max(150, "Tên cửa hàng không được quá 150 ký tự."),
    phoneNumber: z
      .string()
      .trim()
      .regex(VIETNAM_PHONE_REGEX, "Số điện thoại không đúng định dạng Việt Nam."),
    shopAddress: z
      .string()
      .trim()
      .min(10, "Địa chỉ kinh doanh cần chi tiết hơn (tối thiểu 10 ký tự).")
      .max(255, "Địa chỉ tối đa 255 ký tự."),
    taxCode: z
      .string()
      .trim()
      .regex(/^[0-9]{10}([0-9]{3})?$/, "Mã số thuế phải là 10 hoặc 13 chữ số.")
      .optional()
      .or(z.literal("")),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp.",
    path: ["confirmPassword"],
  });

// 3. Schema Đăng nhập
export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập email.")
    .email("Email không hợp lệ."),
  password: z.string().min(1, "Vui lòng nhập mật khẩu."),
  rememberMe: z.boolean().default(false),
  turnstileToken: z.string().optional(),
});
```

---

## 4. CHIẾN THUẬT LÀM VIỆC SONG SONG (PARALLEL WORKFLOW)

Để Frontend và Backend có thể làm việc cùng lúc mà không phải chờ đợi nhau:

1. **Frontend Mock Data trước:**  
   Frontend có thể tạo một Mock Adapter hoặc Mock Service Worker (MSW) trả về đúng định dạng trong `02_API_CONTRACT.md`. Nhờ đó, Frontend có thể dựng xong toàn bộ UI, Form validation, State và Route Guard ngay lập tức.
2. **Backend dựng Database & Endpoints:**  
   Backend hoàn thiện Migration, Controller, Service theo hợp đồng.
3. **Tích hợp thực tế (Integration Day):**  
   Khi Backend deploy bản nháp (Local/Staging), Frontend chỉ cần trỏ `baseURL` sang API thực tế. Vì cả hai bên đã tuân thủ đúng Contract, thời gian ghép API chỉ mất dưới 30 phút!

