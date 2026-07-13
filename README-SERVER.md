# Triển khai Dashboard lên Ubuntu server (Docker Compose + Tailscale + Postgres local)

Toàn bộ dữ liệu **và** biểu mẫu Word đều lưu trực tiếp trên máy chủ Ubuntu,
không dùng dịch vụ ngoài. Truy cập dashboard qua Tailscale ở cổng **5000**.
App `.exe` trên Windows kết nối tới cùng database qua Tailscale.

---

## 1. Yêu cầu

- Ubuntu 22.04+ với Docker Engine + Docker Compose plugin
  ```bash
  curl -fsSL https://get.docker.com | sh
  sudo apt install -y docker-compose-plugin
  ```
- Tài khoản Tailscale + auth key (Settings → Keys → *Generate auth key*)

---

## 2. Chuẩn bị các thư mục trên host (chạy **một lần**)

```bash
# a) Thư mục lưu database (Postgres data)
sudo mkdir -p /var/lib/casefile-db

# b) Hai thư mục biểu mẫu Word
sudo mkdir -p /var/lib/casefile-templates/BIEUMAU_TRUONGPHONG
sudo mkdir -p /var/lib/casefile-templates/BIEUMAU_PHOTRUONGPHONG
```

### 📁 Upload biểu mẫu vào đúng vị trí

| Khi "Lãnh đạo ký" là...     | Đường dẫn trên server Ubuntu                                   |
| --------------------------- | -------------------------------------------------------------- |
| **Trưởng phòng**            | `/var/lib/casefile-templates/BIEUMAU_TRUONGPHONG/`             |
| **Phó Trưởng phòng**        | `/var/lib/casefile-templates/BIEUMAU_PHOTRUONGPHONG/`          |

Mỗi thư mục chứa **đúng 8 file .docx** với tên trùng khớp:

```
1_B3-THONG KE TAI LIEU CO TRONG HO SO.docx
2_B4-DANH SACH NGUOI NGHIEN CUU HO SO.docx
3_B1-QUYET DINH LAP HO SO.docx
4_QUYET DINH PHAN CONG.docx
5_B1-QUYET DINH KET THUC HO SO.docx
6_B15-BAN DINH THOI HAN BAO QUAN HO SO.docx
7_PHIEU CHAM DIEM.docx
X_B11-THONG BAO THONG TIN VE HO SO GDTP.docx
```

Upload bằng `scp` từ máy trạm ví dụ:

```bash
scp *.docx user@giamdinh:/var/lib/casefile-templates/BIEUMAU_TRUONGPHONG/
scp *.docx user@giamdinh:/var/lib/casefile-templates/BIEUMAU_PHOTRUONGPHONG/
```

> Không cần rebuild container khi thay biểu mẫu — chỉ cần thay file rồi
> tạo hồ sơ mới. App đọc trực tiếp từ thư mục mount.

### 📁 Database

- Toàn bộ dữ liệu hồ sơ dashboard tạo ra lưu tại:
  `/var/lib/casefile-db` (Postgres data directory)
- Backup định kỳ:
  ```bash
  docker compose exec postgres pg_dump -U postgres casefile_db \
    > backup-$(date +%F).sql
  ```

---

## 3. Cấu hình `.env`

```bash
git clone <repo> giamdinh && cd giamdinh
cp .env.example .env
nano .env
```

Chỉ còn 2 biến bắt buộc:

| Biến              | Nguồn                                              |
| ----------------- | -------------------------------------------------- |
| `TS_AUTHKEY`      | Tailscale admin console                            |
| `TS_HOSTNAME`     | Mặc định `giamdinh`                                |

---

## 4. Chạy

```bash
docker compose up -d --build
docker compose logs -f app
```

Truy cập từ bất kỳ máy nào trong tailnet:

```
http://giamdinh:5000
```

Kiểm tra database có nhận dữ liệu không:

```bash
docker compose exec postgres \
  psql -U postgres -d casefile_db \
  -c "SELECT id, vu_so_full, ho_ten_lanh_dao, chuc_vu_lanh_dao, created_at
      FROM public.cases ORDER BY created_at DESC LIMIT 10;"
```

---

## 5. Cập nhật code

```bash
git pull
docker compose up -d --build
```

Dữ liệu và biểu mẫu **không** bị mất vì đều nằm ngoài container
(`/var/lib/casefile-db` và `/var/lib/casefile-templates`).

---

## 6. App `.exe` (Windows) kết nối database

Cấu hình chuỗi kết nối Postgres qua Tailscale:

```
postgresql://postgres@giamdinh:5432/casefile_db
```

Và 2 thư mục biểu mẫu **trên máy Windows** đặt tại:

```
D:\GIAMDINH\BIEUMAU_TRUONGPHONG\
D:\GIAMDINH\BIEUMAU_PHOTRUONGPHONG\
```

---

## 7. Kiến trúc

```text
+-----------------+          Tailnet (WireGuard)          +-------------------------+
| App .exe        |  <-------------------------------->   | Ubuntu server            |
| (Windows)       |                                       |  tailscale sidecar       |
|                 |                                       |  postgres (5432)         |
|                 |                                       |   └─ /var/lib/casefile-db|
|                 |                                       |  app dashboard (5000)    |
|                 |                                       |   └─ /var/lib/casefile-  |
+-----------------+                                       |         templates        |
                                                          +-------------------------+
```
