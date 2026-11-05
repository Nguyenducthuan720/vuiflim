# Danh mục TMDB

**Nguồn mặc định đã đổi sang [TVmaze](TVMAZE.md), không cần API key.** Phần dưới lưu lại hướng dẫn cho API TMDB tùy chọn; giao diện hiện không gọi TMDB. Không cần làm các bước này để xem danh mục mặc định.

Danh mục lấy tên phim, ảnh, điểm và mô tả; không có video đầy đủ. Hiển thị riêng với kho phim có nguồn xem trong PostgreSQL. Không cần migration mới và không ghi đè phim nội bộ.

## Bật tích hợp

1. Đăng ký/đăng nhập tại https://www.themoviedb.org/.
2. Mở https://www.themoviedb.org/settings/api và đăng ký API theo yêu cầu của TMDB.
3. Sao chép **API Read Access Token**, không phải API Key v3, vào `backend/.env`:

```dotenv
TMDB_READ_ACCESS_TOKEN=TOKEN_CUA_BAN
```

Đây là nội dung file, không phải lệnh PowerShell. Không gửi token lên chat/Git hoặc thêm vào frontend. Với Docker, đặt biến trong `.env` gốc.

4. Dừng backend bằng Ctrl+C, chạy lại `npm run dev` trong thư mục `backend`.
5. Mở website, chọn **Danh mục TMDB**. Có phim lẻ/phim bộ, tìm kiếm, phổ biến/điểm cao và phân trang. Bấm poster để xem mô tả. Dữ liệu ưu tiên tiếng Việt nhưng có thể chưa có bản dịch. Không có nút phát video cho phim chưa có nguồn xem.

## API

- `GET /api/catalog/tmdb/status` → `{configured: true|false}`, không trả token.
- `GET /api/catalog/tmdb/movies?type=movie&page=1&sort=popular&q=` → `{page,totalPages,totalResults,results}`.
- `GET /api/catalog/tmdb/movies/movie/ID` hoặc `/series/ID` → chi tiết phim.

Backend cache tối đa 100 yêu cầu trong 5 phút, gộp yêu cầu đồng thời cùng URL và timeout 8 giây. Trang tối đa 500; không cho client chọn hostname upstream. Token chỉ truyền qua Authorization header tới TMDB. Lỗi TMDB không làm mất kho phim nội bộ. Danh mục không được tự lưu vào PostgreSQL; yêu cầu Internet và token hợp lệ.

## Tài liệu và ghi công

- [Bearer authentication](https://developer.themoviedb.org/docs/authentication-application).
- [Popular movies](https://developer.themoviedb.org/reference/movie-popular-list).
- [Ảnh TMDB](https://developer.themoviedb.org/docs/image-basics).
- [FAQ và điều kiện sử dụng](https://developer.themoviedb.org/docs/faq).

TMDB yêu cầu ghi công và logo chính thức. Developer API dành cho mục đích phi thương mại; kiểm tra điều kiện với TMDB trước khi dùng thương mại. Nội dung TMDB không cấp quyền phát phim. Muốn phát, hãy thêm nguồn video có quyền sử dụng qua kho phim nội bộ.
