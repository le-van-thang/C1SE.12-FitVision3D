# RULE: QUY TRÌNH GIT & PHỐI HỢP ĐỒNG ĐỘI (GIT COLLABORATION RULES)
**Áp dụng:** Toàn bộ thành viên phát triển dự án FitVision3D

## 1. Quy tắc đặt tên nhánh (Branch Naming Convention)
- **Không bao giờ dùng một nhánh cá nhân cố định** (như `anhtai`, `thang`) để làm việc xuyên suốt dự án.
- Mỗi tính năng hoặc bugfix là một nhánh ngắn hạn (Short-lived feature branch):
  - Tính năng mới: `feat/<tên-tính-năng>` hoặc `feat/<tên-bạn>-<tính-năng>` (vd: `feat/anhtai-auth-api`)
  - Sửa lỗi: `fix/<tên-lỗi>` (vd: `fix/refresh-token-cookie`)
  - Tài liệu/Quy chuẩn: `docs/<tên-tài-liệu>`

## 2. Quy tắc Commit trước khi Pull (Bắt buộc)
1. **Luôn Commit code của mình trước khi Pull từ nhánh chính (`main`/`develop`):**
   - Không bao giờ gõ `git pull` khi đang có uncommitted changes dở dang.
   - Commit tạo mốc lưu trữ an toàn (Snapshot). Nếu xảy ra conflict, bạn luôn có thể `git merge --abort` để quay về trạng thái an toàn 100%.
2. **Quy chuẩn Message theo Conventional Commits:**
   - `feat: add registration endpoint with honeypot check`
   - `fix: resolve token refresh race condition`
   - `docs: update auth api contract specifications`
   - `test: add unit tests for disposable email validator`

## 3. Quy trình Merge & Pull Request
1. Hoàn thành code trên feature branch $\rightarrow$ Commit.
2. Pull code mới nhất từ nhánh chung về để giải quyết conflict tại local máy mình:
   ```bash
   git pull origin develop (hoặc main)
   ```
3. Chạy test kiểm tra toàn bộ ứng dụng vẫn hoạt động bình thường.
4. Push nhánh lên GitHub và tạo **Pull Request (PR)**.
5. Chỉ merge vào nhánh chính sau khi được đồng đội review hoặc xác nhận không xung đột API.

