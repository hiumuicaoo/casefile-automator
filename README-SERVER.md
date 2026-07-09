# Triển khai Dashboard lên Ubuntu server (Docker Compose + Tailscale)

Phần dashboard (Phần 3) chạy như một dịch vụ web nội bộ trong tailnet, cổng **5000**.
App desktop `.exe` trên các máy Windows sẽ ghi dữ liệu vào Lovable Cloud, dashboard
đồng bộ realtime từ cùng nguồn dữ liệu đó.

## 1. Yêu cầu máy chủ

- Ubuntu 22.04+ (hoặc bản khác có Docker).
- Docker Engine + Docker Compose plugin:
  ```bash
  curl -fsSL https://get.docker.com | sh
  sudo apt install -y docker-compose-plugin
  ```
- Tài khoản Tailscale + auth key (Settings → Keys → *Generate auth key*, bật *Reusable*
  nếu cần).

## 2. Cấu hình

```bash
git clone <repo> giamdinh && cd giamdinh
cp .env.example .env
nano .env    # điền SUPABASE_* và TS_AUTHKEY
```

Các biến bắt buộc trong `.env`:

| Biến                              | Nguồn                          |
| --------------------------------- | ------------------------------ |
| `SUPABASE_URL`                    | Lovable Cloud → Backend        |
| `SUPABASE_PUBLISHABLE_KEY`        | Lovable Cloud → Backend        |
| `VITE_SUPABASE_URL`               | Trùng `SUPABASE_URL`           |
| `VITE_SUPABASE_PUBLISHABLE_KEY`   | Trùng `SUPABASE_PUBLISHABLE_KEY` |
| `TS_AUTHKEY`                      | Tailscale admin console        |
| `TS_HOSTNAME` (tuỳ chọn)          | Mặc định `giamdinh`            |

## 3. Chạy

```bash
docker compose up -d --build
docker compose logs -f app
```

Kiểm tra Tailscale đã join tailnet:

```bash
docker compose exec tailscale tailscale status
```

Truy cập từ bất kỳ máy nào trong tailnet:

```
http://giamdinh:5000
```

(hoặc theo `TS_HOSTNAME` bạn đặt)

## 4. Cập nhật

```bash
git pull
docker compose up -d --build
```

## 5. Kiến trúc mạng

```text
+-----------------+          Tailnet (WireGuard)          +---------------------+
| App .exe        |  <-------------------------------->   | Ubuntu server        |
| (Windows)       |                                        |  tailscale sidecar   |
|                 |                                        |  └─ app (port 5000)  |
+-----------------+                                        +---------------------+
        │                                                            │
        └──────────── Lovable Cloud (Supabase) ──────────────────────┘
                     (đồng bộ dữ liệu realtime)
```

- App desktop ghi/đọc trực tiếp Lovable Cloud → không cần mở API riêng.
- Dashboard chỉ hiển thị (đọc/ghi cùng schema), truy cập nội bộ qua Tailscale.
- Cổng 5000 **không** expose ra Internet — chỉ thấy trong tailnet.
