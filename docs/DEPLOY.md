# Triển khai VPS

Thiết kế dành cho **một VPS chạy một backend instance**. Cần máy Linux có Docker Engine + Compose v2, dung lượng ổ đĩa phù hợp kho phim, tên miền trỏ A record tới IP VPS. Nếu có AAAA record thì IPv6 cũng phải trỏ đúng. Mở TCP 80/443; UDP 443 là tùy chọn HTTP/3. Không mở cổng 5432 hoặc 3001 ra ngoài.

## Đưa source lên

Sao chép repo lên VPS (Git hoặc SCP), không sao chép `node_modules`, `.env` từ máy khác hay file test vào thư mục public. Tạo `.env` từ mẫu:

```dotenv
POSTGRES_USER=vuiphim
POSTGRES_DB=vuiphim
POSTGRES_PASSWORD=YOUR_RANDOM_ALPHANUMERIC_PASSWORD_32_CHARS_OR_MORE
SITE_ADDRESS=movies.example.com
APP_ORIGIN=https://movies.example.com
COOKIE_SECURE=true
```

Thay tên miền và password thật. `APP_ORIGIN` không có dấu `/` cuối. Đừng commit `.env`.

```sh
docker compose config --quiet
docker compose up -d --build
docker compose ps
docker compose exec backend npm run admin:create -w backend
```

Caddy tự lấy/gia hạn chứng chỉ khi tên miền hợp lệ và 80/443 truy cập được. Xem [Automatic HTTPS](https://caddyserver.com/docs/automatic-https). Không đặt thêm reverse proxy khác phía trước mà giữ nguyên trust proxy/IP config; cần điều chỉnh cấu hình nếu dùng Cloudflare proxy.

## Kiểm tra sau triển khai

```sh
curl --fail https://movies.example.com/api/health
docker compose logs --tail=100 backend caddy
```

Trong trình duyệt: tạo tài khoản người xem, đăng nhập admin, thêm phim dưới dạng bản nháp, kiểm tra không xuất hiện với người xem; công khai phim; phát/tua video; đổi tập; yêu thích; mở lại kiểm tra vị trí; bình luận; đăng xuất. Chỉ coi deploy thành công sau khi kiểm tra các luồng này trên tên miền thật.

## Thêm file video và ảnh trên VPS

Chép file vào `media/`, ví dụ `media/my-film/movie.mp4`, `poster.jpg`, `backdrop.jpg`. Chỉ để tài nguyên công khai trong thư mục này; không chứa khóa, hợp đồng hoặc giấy tờ cá nhân. Cho phép Nginx đọc file/thư mục, không cho ghi công khai. Đường dẫn trong admin:

```text
/media/my-film/movie.mp4
/media/my-film/poster.jpg
/media/my-film/backdrop.jpg
```

Nginx phục vụ byte range cho MP4 và segment HLS, không truyền video qua Node. File HLS cần giữ nguyên cấu trúc đường dẫn giữa master playlist, variant playlist và segment. URL HTTPS bên ngoài cũng dùng được nếu máy chủ nguồn cho phép truy cập từ domain của bạn, CORS và codec được trình duyệt hỗ trợ.

## Cập nhật

Sao lưu trước. Đưa source mới lên và chạy `docker compose up -d --build`. Migration được ghi lại và không tự chạy lại. Thay `POSTGRES_PASSWORD` trong `.env` không tự thay mật khẩu của database đã tạo: cần đổi trong PostgreSQL và cập nhật cấu hình đồng bộ.

## Backup và khôi phục

```sh
sh deploy/backup.sh
```

Script tạo dump SQL nén trong `backups/` với quyền file hạn chế. Lên lịch cron mỗi ngày, sao chép bản mã hóa sang nơi khác, sao lưu `media/` và cấu hình `.env` riêng. Backup cùng ổ đĩa không bảo vệ khi VPS mất dữ liệu. Định kỳ kiểm tra restore vào database trống khác.

Khôi phục vào **database trống trên một stack khác**, không ghi đè database đang chạy:

```sh
gzip -dc backups/YOUR_BACKUP.sql.gz | docker compose exec -T db sh -c 'psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB"'
```

Đảm bảo database đích không chứa schema trước khi chạy. Bản dump gồm bảng migration nên backend không áp dụng lặp lại schema cũ.
