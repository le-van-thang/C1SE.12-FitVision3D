# RULE: PHÂN QUYỀN 3 ROLE (RBAC) & ROUTE PROTECTION
**Áp dụng:** Toàn bộ API Endpoints & Giao diện người dùng

## 1. Định nghĩa 3 Vai trò
- `ADMIN`: Quản trị viên sàn FitVision3D.
- `SHOP_OWNER`: Đối tác bán hàng thời trang 3D.
- `USER`: Khách hàng mua sắm & thử đồ 3D.

## 2. Quy tắc cấp Role
1. **Tuyệt đối cấm tạo Endpoint đăng ký công khai cho `ADMIN`:** Role `ADMIN` chỉ được tạo qua database seeder nội bộ hoặc do Super Admin cấp.
2. **Đăng ký Khách Hàng:** Gán cứng `role: "USER"`, `status: "PENDING_VERIFY"`. Bỏ qua bất kỳ giá trị `role` nào gửi lên từ client.
3. **Đăng ký Chủ Shop:** Gán cứng `role: "SHOP_OWNER"`, `status: "PENDING_APPROVAL"`. Tài khoản này KHÔNG ĐƯỢC PHÉP truy cập trang quản trị shop cho đến khi `ADMIN` duyệt đổi trạng thái thành `ACTIVE`.

## 3. Bảo vệ Tài nguyên (Authorization Guard)
- Mọi endpoint cần bảo vệ phải có Middleware/Guard kiểm tra Role.
- Nếu token hợp lệ nhưng Role không đủ quyền $\rightarrow$ Luôn trả về `HTTP 403 Forbidden` với mã lỗi `FORBIDDEN_INSUFFICIENT_PERMISSIONS`. Không được trả về 401 hoặc 404 gây nhầm lẫn.
- Tài khoản có trạng thái `BANNED` phải bị chặn ở tầng Authentication Middleware đầu tiên.

