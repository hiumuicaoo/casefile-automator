# App desktop (.exe) — hướng dẫn build

Phần mềm gồm 2 phần:
- **App desktop** (Phần 1 + Phần 2): form nhập liệu, tự động tạo thư mục `D:\GIAMDINH\{LINH_VUC}\{VU_SO}` và sinh 8 file Word từ mẫu tại `D:\GIAMDINH\BIEUMAU`.
- **Dashboard tình trạng** (Phần 3): bảng theo dõi hồ sơ, đẩy lên server Ubuntu (Docker Compose + Tailscale, cổng 3090).

## 1. Chuẩn bị máy Windows

- Có sẵn Node.js 20+.
- Đặt các file biểu mẫu vào `D:\GIAMDINH\BIEUMAU\` với tên đúng như yêu cầu:
  - `1_B3-THONG KE TAI LIEU CO TRONG HO SO.docx`
  - `2_B4-DANH SACH NGUOI NGHIEN CUU HO SO.docx`
  - `3_B1-QUYET DINH LAP HO SO.docx`
  - `4_QUYET DINH PHAN CONG.docx`
  - `5_B1-QUYET DINH KET THUC HO SO.docx`
  - `6_B15-BAN DINH THOI HAN BAO QUAN HO SO.docx`
  - `7_PHIEU CHAM DIEM.docx`
  - `X_B11-THONG BAO THONG TIN VE HO SO GDTP.doc`

Trong các file mẫu, đặt placeholder theo mô tả, ví dụ: `[Vụ số]`, `[Số đăng ký]`, `[Trích yếu]`, `[Họ và tên GĐV]`, `[dd]`, `[mm]`, `[yyyy]`, `[Cấp bậc GĐV 1]`, `[Họ và tên GĐV 2]`, `[Trợ lý 1]`, `[Trợ lý 2]`, ...

## 2. Build & chạy thử (dev)

```bash
# Cài dependencies
npm install
npm install --save-dev electron @electron/packager

# Build web
npx vite build

# Chạy Electron
npx electron .
```

## 3. Đóng gói .exe cho Windows

Chạy trên máy Windows (hoặc dùng Wine/CI):

```bash
npx vite build
npx @electron/packager . "QuanLyHoSoGiamDinh" \
  --platform=win32 --arch=x64 \
  --out=electron-release --overwrite \
  --ignore='^/src' --ignore='^/public' --ignore='^/electron-release'
```

Kết quả: `electron-release/QuanLyHoSoGiamDinh-win32-x64/QuanLyHoSoGiamDinh.exe`

## 4. Cấu hình endpoint dashboard

Dashboard (Phần 3) mặc định đọc/ghi Lovable Cloud. Nếu bạn muốn tự host trên Ubuntu server (Tailscale cổng 3090):

- Deploy code này lên server Ubuntu (dùng Node adapter hoặc Docker).
- Ví dụ `docker-compose.yml`:

```yaml
services:
  giamdinh:
    build: .
    ports:
      - "3090:3000"
    environment:
      - PORT=3000
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_PUBLISHABLE_KEY=${SUPABASE_PUBLISHABLE_KEY}
    restart: unless-stopped
```

- Cài Tailscale, chia sẻ port 3090 với các máy trong tailnet.
- App desktop khi ghi vào Lovable Cloud → dashboard trên server sẽ tự đồng bộ (realtime).

## Tuỳ chỉnh đường dẫn

Trong `electron/main.cjs`, sửa `BASE_DIR` / `TEMPLATE_DIR` nếu muốn dùng đường dẫn khác `D:\GIAMDINH`.

## Ghi chú

- Khi mở form trên web preview (Lovable): chỉ lưu DB, KHÔNG tự sinh file Word (vì trình duyệt không được ghi vào `D:\`). Chức năng sinh file chạy khi bấm "Lưu" trong app `.exe`.
- Việc thay thế placeholder trong `.docx` được thực hiện ở tầng XML, giữ nguyên định dạng font gốc của file mẫu.
