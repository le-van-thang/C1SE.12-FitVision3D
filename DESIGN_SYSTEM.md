# HỆ THỐNG THIẾT KẾ: TINH GỌN – EDITORIAL HIỆN ĐẠI
*FitVision 3D (C1SE.12) | Bản cập nhật chuẩn mực v2.5*

---

## 1. TRIẾT LÝ & ĐỊNH HƯỚNG THỊ GIÁC

Giao diện FitVision 3D định vị theo phong cách **"Tinh gọn – Editorial Hiện đại"**:
- **Không gian thoáng đãng**: Ứng dụng lưới 8px, tối đa 1200px chiều rộng nội dung (`max-w-[1200px]`), và độ dài dòng văn bản tối đa 68 ký tự (`max-w-prose`) để đảm bảo trải nghiệm đọc thư thái, tự nhiên.
- **Kỷ luật hình học & Viền mỏng Hairline**: Thay thế toàn bộ các viền đen dày và bóng cứng thô ráp bằng đường viền mỏng hairline 1px màu `kraft/60`.
- **Chiều sâu mềm mại**: Đổ bóng phân tầng siêu nhẹ (độ mờ ≤ 8%), không dùng nền gradient nhân tạo, không dùng kính mờ (glassmorphism) gây nhiễu thị giác.
- **Thước cuộn có mục đích**: Thước dây đo may mặc CHỈ xuất hiện tại ba vị trí có ý nghĩa chức năng:
  1. Thanh tiến trình quy trình đo 7 bước (Wizard Progress).
  2. Thước so khớp độ vừa vặn trang phục (Fit Ruler).
  3. Đường vạch chia mép trang rất mờ ở trang giới thiệu (Landing).

---

## 2. BẢNG MÀU CHUẨN (ATELIER PALETTE)

### Chế độ Sáng (Paper & Natural Fibers - Mặc định)
| Token | HEX | Mục đích sử dụng |
|---|---|---|
| `paper` | `#F1ECE2` | Nền chính không gian làm việc (giấy rập mộc ấm) |
| `paper-2` | `#E8E1D3` | Bề mặt thẻ, bảng điều khiển, thanh điều hướng |
| `kraft` | `#D8CBB1` | Viền hairline (độ mờ 60%), thước đo mộc |
| `ink` | `#17150F` | Chữ chính, tiêu đề |
| `ink-2` | `#4A463C` | Chữ phụ, nhãn chỉ dẫn, thông số phụ |
| `indigo` | `#26356B` | Màu thương hiệu, nút chính (Primary CTA) |
| `vermilion` | `#D8452A` | Dấu phấn đỏ: mốc giải phẫu, nút hành động chụp quét (Accent) |
| `moss` | `#3F6B4E` | Đạt chuẩn, trạng thái thành công, khoảng kích cỡ vừa vặn |
| `ochre` | `#C98A1B` | Cảnh báo tư thế, trạng thái hiệu chỉnh |

### Chế độ Tối (Charcoal Wool & Soft Chalk)
| Token | HEX | Mục đích sử dụng |
|---|---|---|
| `paper` | `#14130F` | Nền vải len than sẫm |
| `paper-2` | `#1D1B16` | Bề mặt thẻ ban đêm |
| `kraft` | `#3A362D` | Viền hairline tối |
| `ink` | `#EDE7DA` | Mực sáng, chữ chính |
| `ink-2` | `#A6A092` | Chữ phụ trên nền tối |
| `indigo` | `#7F93E0` | Lam phấn sáng cho nút chính |
| `vermilion` | `#F26B4D` | Phấn đỏ dạ quang cho nút chụp quét |
| `moss` | `#589B6D` | Xanh rêu chỉ báo đạt chuẩn |
| `ochre` | `#E5A83B` | Đất son cảnh báo |

---

## 3. HỆ THỐNG KIỂU CHỮ & CẤP BẬC (TYPOGRAPHY)

1. **Editorial Display Serif**: `"Fraunces", Georgia, serif`
   - **Chỉ sử dụng**: Tiêu đề trang trọng của Landing Page và con số đo lường nổi bật.
   - **Độ đậm**: Chỉ dùng weight 400–500, tuyệt đối không in đậm (bold).
2. **UI & Nội dung**: `"Instrument Sans", system-ui, sans-serif`
   - **Toàn bộ giao diện**: Nút bấm, biểu mẫu, menu, thẻ, hướng dẫn.
   - **Cỡ chữ**:
     - Tiêu đề trang: 32px – 40px (weight 500/600).
     - Đề mục khối: 20px – 24px (weight 600).
     - Tiêu đề thẻ / đề mục phụ: 15px – 16px (weight 600).
     - Văn bản cơ bản: 14px – 15px (line-height 1.6).
     - Nhãn & Chỉ dẫn nhỏ: 12px – 13px (weight 500).
3. **Số liệu & Con số**: `"JetBrains Mono", monospace`
   - Chỉ dùng cho con số kích thước (cm, mm, kg), mã token dossier, và dữ liệu kỹ thuật.
   - Luôn bật `tabular-nums` để số liệu thẳng hàng dọc.

---

## 4. QUY CHUẨN HÌNH HỌC & ĐỘ CONG BÁN KÍNH

- **Bộ điều khiển (Controls)**: Nút bấm, ô nhập liệu, thanh chọn phân đoạn, công tắc switch: `rounded-control` (**10px**).
- **Thẻ thông tin (Cards)**: Thẻ thông số, thẻ hồ sơ, khối nội dung: `rounded-card` (**14px**).
- **Hộp thoại (Modals & Sheets)**: Cửa sổ nổi, ngăn kéo di động: `rounded-modal` (**20px**).
- **Huy hiệu & Nhãn tem (Pill Badges)**: Bán kính tròn hoàn toàn: `rounded-pill` (**9999px**).

---

## 5. THƯ VIỆN THÀNH PHẦN TINH GỌN (ATELIER COMPONENTS)

1. **Button**:
   - `Primary`: Indigo đặc, chữ trắng, đổ bóng `shadow-cta`, chiều cao chuẩn 44px (md), 40px (sm), 52px (lg).
   - `Accent`: Vermilion đặc, chữ trắng, chỉ dành riêng cho hành động chụp / quét.
   - `Secondary`: Nền `paper-2`, viền `kraft/60`, chữ `ink`.
   - `Ghost`: Trong suốt, chữ `ink-2`, hover nhẹ.
   - `Danger`: Nền `vermilion/10`, viền `vermilion/25`, chữ `vermilion`.
   - Đầy đủ trạng thái: hover, active (lún nhẹ), focus ring, disabled (mờ 50%), loading (vòng xoay spinner).
2. **SegmentedControl**: Bộ chọn dạng viên thuốc trượt êm, phân đoạn kích cỡ / đơn vị / ngôn ngữ.
3. **Switch**: Công tắc gạt tròn trơn tru với nhãn và mô tả đi kèm.
4. **Field & Select**: Ô nhập liệu có nhãn sạch 13px và huy hiệu đơn vị gắn đuôi (`cm`, `kg`).
5. **Stepper**: Bộ đếm tăng giảm số lượng (+ / -) cho in ấn hồ sơ.
6. **Tooltip & Popover**: Bảng chỉ dẫn nổi với viền hairline mỏng và bóng mềm.
7. **Badge**: Huy hiệu dạng viên thuốc `rounded-pill` với vệt màu thanh lịch.
8. **Banner**: Khối thông báo / lưu ý / cảnh báo trạng thái với nút đóng.
9. **EmptyState**: Khung viền đứt nét với biểu tượng tối giản, mô tả và nút hành động.
10. **Skeleton**: Khối giả lập đang tải xung nhịp nhẹ nhàng.
11. **TapeMeasureProgress**: Thanh tiến trình thước đo 7 bước tinh tế.
12. **FitRuler**: Thước đo dải kích cỡ và độ vừa vặn với kim chỉ thị rõ ràng.
13. **Modal & Sheet**: Hộp thoại trang trọng và ngăn kéo ngón cái trên thiết bị di động.

---

## 6. QUY TẮC ĐA NGÔN NGỮ (I18N) TRIỆT ĐỂ

- **Tách biệt 100%**: Mọi chuỗi hiển thị đều thông qua `src/i18n/vi.json` và `src/i18n/en.json`.
- **Không trộn lẫn**: Khi ở tiếng Việt, toàn bộ giao diện thuần Việt ("Nút chính", "Bị khóa", "Chuẩn bị", "Chụp chính diện"...). Chỉ giữ tên riêng chuẩn: ISO 8559, BMI, A4, cm, kg, MediaPipe.
- **Tự động kiểm toán**: Script `npm run i18n:check` kiểm tra tính đối xứng của khóa dịch và bảo đảm không lọt từ tiếng Anh không cho phép vào tiếng Việt.
