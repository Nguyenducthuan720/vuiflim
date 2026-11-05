# Tích hợp KKPhim

Nguồn mặc định trên giao diện là KKPhim theo [tài liệu do người dùng cung cấp](https://kkphim1.com/api-document). Base URL: `https://phimapi.com`, GET JSON, không cần API key cho các endpoint đang dùng.

## Chạy

Khởi động lại backend và tải lại frontend. Chọn **Xem phim online** → chọn poster → **Xem phim ngay**, hoặc chọn tập. Có tìm kiếm, phân trang, phim lẻ, phim bộ, hoạt hình, TV Shows và chọn máy chủ/ngôn ngữ.

Không cần migration, không cần tài khoản KKPhim và không cần tải/upload file. Danh mục bên ngoài không ghi đè kho phim PostgreSQL.

## API backend

- `GET /api/catalog/kkphim/movies?q=&type=all&page=1`: type = all, phim-le, phim-bo, hoat-hinh, tv-shows.
- `GET /api/catalog/kkphim/movies/:slug`: chi tiết cùng servers[].episodes[], mỗi tập có URL HLS HTTPS.

Upstream sử dụng `/danh-sach/phim-moi-cap-nhat`, `/v1/api/danh-sach/:type`, `/v1/api/tim-kiem?keyword=...&limit=24` và `/phim/:slug`. Dữ liệu được chuẩn hóa; HTML mô tả chuyển thành văn bản. Cache 2 phút, tối đa 100 URL, gộp request trùng, timeout 12 giây, cố định hostname API, validate slug để ngăn traversal. Không nhận URL tùy ý để server fetch.

## Trình phát và giới hạn

- Mặc định dùng `link_embed` chính thức được API trả về, chỉ chấp nhận HTTPS host `player.phimapi.com`, đường dẫn `/player/` và tham số url HTTPS. Iframe sandbox không cho mở popup hoặc chuyển hướng trang cha. Có thể chuyển sang **HLS trực tiếp** bằng HLS.js/native nếu tập có link_m3u8.
- Video phát từ CDN của nhà cung cấp, không proxy video qua Node. Không sửa header để vượt chặn hotlink/CORS, không vô hiệu hóa TLS hoặc cơ chế bảo vệ của nguồn.
- CORS là giới hạn trình duyệt khi HLS.js tải playlist/segment từ domain khác; backend thêm header không thể thay đổi chính sách CDN bên ngoài. Trình phát chính thức tự xử lý nguồn ở origin của dịch vụ, không proxy/lách CORS. Nếu CDN không cho phép origin, nguồn bị gỡ hoặc codec không hỗ trợ, chọn trình phát/máy chủ khác; không đảm bảo mọi URL đều phát được trên mọi thiết bị.
- Bình luận KKPhim hiện lưu trong PostgreSQL theo provider/slug, riêng với review phim nội bộ; xem API.md. Lịch sử/yêu thích hiện vẫn chỉ áp dụng cho kho phim nội bộ.

## Giao diện mới

Trang chủ/phim lẻ/phim bộ/hoạt hình và ô tìm kiếm trên header đều lấy danh mục KKPhim. Bộ lọc thể loại/quốc gia lấy trực tiếp qua `GET /api/catalog/kkphim/options` từ `/the-loai`, `/quoc-gia`. Hỗ trợ category, country, year, sort (modified.time/year/_id), phân trang. Bộ lọc được chuyển tới upstream, không lọc giả trên một trang dữ liệu.

Chi tiết gồm poster, ảnh bìa, tên gốc, điểm tham khảo, nội dung, thể loại/quốc gia/đạo diễn/diễn viên, máy chủ/ngôn ngữ, tìm số tập và nút chọn tập. Nút nguồn phát chọn giữa player chính thức và HLS trực tiếp. Triển khai Docker cần build lại frontend để Nginx áp dụng frame-src `https://player.phimapi.com`.

- API có URL video không đồng nghĩa nội dung có giấy phép mở/public domain. Tài liệu này không xác nhận quyền phân phối từng phim; cần kiểm tra điều kiện sử dụng/quyền nội dung trước khi vận hành công khai.
