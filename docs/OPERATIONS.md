# Vận hành và giới hạn hiện tại

- PostgreSQL là nguồn dữ liệu duy nhất. Session lưu hash token, cookie HttpOnly + SameSite=Lax, Secure khi chạy HTTPS. Tài khoản tự đăng ký luôn có role user; admin chỉ được tạo qua terminal. Mật khẩu Argon2id.
- Mutation yêu cầu header Origin trùng APP_ORIGIN, kể cả đăng nhập/đăng ký. Client ngoài trình duyệt cần gửi Origin hợp lệ. API không bật CORS đa domain; frontend và API được Nginx phục vụ cùng origin.
- Đổi mật khẩu trong trang tài khoản gọi `PATCH /api/auth/password` và thu hồi các phiên. Chưa tích hợp xác minh email, email quên mật khẩu hay nhà cung cấp SMTP; không hiển thị nút giả. Có thể bổ sung sau khi có domain và email provider.
- Rate limit giữ trong bộ nhớ của một backend. Nếu mở rộng nhiều instance cần Redis/shared store. Các process restart sẽ làm mới bộ đếm; session vẫn ở PostgreSQL.
- Danh sách phim hiện trả toàn bộ metadata cho frontend để lọc. Khi kho lớn cần phân trang phía server và PostgreSQL full-text search; không dùng thiết kế này cho hàng trăm nghìn phim mà chưa tối ưu.
- Website chưa có payment, subscription, DRM, transcoding/upload giao diện web, kiểm duyệt tự động, thông báo email hoặc signed CDN URL. Media hiện được đưa lên qua SCP/object storage và nhập URL trong admin.
- Nginx chỉ mở media để đọc. File và URL nội dung đều công khai; không phải kho bảo mật. Backend không tải URL do admin nhập nên không có chức năng proxy/fetch nguồn phim.
- Hiện có quản trị phim/tập và bình luận, chưa có giao diện quản lý người dùng. DB có trường disabled để vô hiệu hóa tài khoản và chặn phiên hiện tại ở request kế tiếp.
- Health endpoint chạy SELECT 1 để kiểm tra DB. Theo dõi Docker logs, dung lượng ổ đĩa, backup, chứng chỉ và nguồn CDN. Log không chủ động in password/session token.
- Chứng chỉ CA PostgreSQL tùy chỉnh qua DATABASE_CA; không tắt kiểm tra TLS. Docker local dùng mạng riêng tới PostgreSQL. Database không publish cổng trừ override phát triển.
- HLS hoạt động qua hls.js trên MediaSource hoặc HLS native; chất lượng phụ thuộc master playlist. Cần kiểm tra codec, CORS và mạng trên Safari/Chrome của thiết bị thực tế. Xem [HLS.js API](https://hlsjs.video-dev.org/api-docs/hls.js.hls).
