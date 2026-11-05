# Danh mục mặc định: TVmaze

Nguồn mặc định hiện đã đổi sang [KKPhim](KKPHIM.md). Phần dưới mô tả API TVmaze tùy chọn được giữ lại; giao diện không tự gọi nguồn này.

TVmaze public API không cần đăng ký API key. Backend gọi `https://api.tvmaze.com`; frontend không cần token. Không cần sửa DNS hoặc `.env` để bật nguồn này. TMDB được giữ ở API tùy chọn cũ, không được giao diện mặc định gọi, và không tự fallback qua TMDB.

## Chạy

1. Dừng backend bằng Ctrl+C và chạy `npm run dev` trong thư mục `backend`.
2. Nếu frontend đang chạy, tải lại website; nếu chưa chạy, chạy `npm run dev` trong thư mục `frontend`.
3. Chọn **Danh mục phim bộ**. Gõ tên gốc, ví dụ `Dark`, rồi nhấn tìm kiếm.

Danh mục mặc định duyệt theo lô chỉ mục ID của TVmaze, tối đa 250 mục/lô. Mỗi lô hiển thị trước 24 mục; **Hiển thị thêm phim** mở thêm 24 mục, **Lô tiếp theo** chuyển sang nhóm ID tiếp theo. Tổng số lô không được provider cung cấp; một lô có thể có ít hơn 250 mục do dữ liệu bị xóa. Lô cuối được nhận biết khi provider trả 404. Tìm kiếm trả tập kết quả theo độ liên quan và không giả lập phân trang. Chọn **Điểm cao trong lô** chỉ sắp xếp kết quả đang tải, không phải bảng xếp hạng toàn TVmaze.

## Giới hạn

- Nguồn chuyên phim bộ/chương trình truyền hình, không thay thế kho phim lẻ của TMDB.
- Tên và mô tả theo dữ liệu provider, thường bằng tiếng Anh, không tự dịch hoặc bịa nội dung tiếng Việt.
- Đây là metadata, không có phim đầy đủ và không có nút phát giả. Phim có nguồn xem được thêm riêng qua admin/PostgreSQL.
- Không tự nhập vào database, không thay đổi phim, tài khoản, yêu thích và lịch sử đang có.
- Cần Internet tới TVmaze và CDN ảnh. Backend cache 5 phút, tối đa 100 URL, gộp request đồng thời, timeout 10 giây, trả thông báo riêng cho lỗi mạng, giới hạn tần suất và không tìm thấy.

## API backend

- `GET /api/catalog/tvmaze/shows?page=1&q=&sort=default` (sort có thể là `rating`).
- `GET /api/catalog/tvmaze/shows/:id`.

Danh sách trả `{page, results, hasNext, batchSize, search}`. `hasNext` cho phép thử lô tiếp theo; khi provider trả 404 thì results rỗng và hasNext=false. ID TVmaze là số, khác với UUID của kho phim nội bộ.

Nguồn: [TVmaze API chính thức](https://www.tvmaze.com/api). Dữ liệu TVmaze theo [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/); giao diện ghi công/link nguồn và giấy phép, ghi rõ chuẩn hóa trường và chuyển HTML thành văn bản. Phần dữ liệu biến đổi giữ điều kiện ShareAlike; điều này không tự xác định giấy phép cho toàn bộ mã nguồn ứng dụng. Hình ảnh vẫn cần tuân thủ quyền của chủ sở hữu.
