# Kiến trúc và luồng xử lý

## Frontend

`main.jsx → app/App.jsx → app/layout` và page của feature. App điều phối màn hình/modal; không chứa JSX của header/footer/danh mục/tập phim. Mỗi feature giữ `components`, `hooks`, `api`, `pages`, `styles` khi có nhu cầu thực tế, không tạo thư mục rỗng chỉ để đủ lớp.

| Chức năng         | Điểm bắt đầu                                  | Dữ liệu và hiển thị                                                                                                                     |
| ----------------- | --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Danh mục/tìm kiếm | features/catalog/pages/CatalogPage.jsx        | useCatalog → catalogApi → shared/api/httpClient → API backend; component DiscoverHero, CatalogToolbar, CatalogFilters, CatalogMovieCard |
| Chi tiết phim     | features/movie/pages/MovieDetailsPage.jsx     | useMovieDetails → movieApi; MovieDescription và EpisodeSelector nhận dữ liệu qua props                                                  |
| Phát phim         | features/player/components/ProviderPlayer.jsx | Chọn embed đã kiểm tra domain hoặc HlsPlayer; không đưa token vào URL video                                                             |
| Đăng nhập         | features/auth/components/AuthModal.jsx        | Session cookie HttpOnly; useSession bootstrap /api/me                                                                                   |
| Thư viện nội bộ   | features/library/pages/LibraryPage.jsx        | useLibrary tải phim nội bộ/yêu thích/lịch sử và xử lý lưu phim                                                                          |
| Ảnh               | shared/components/MovieImage.jsx              | Thử danh sách URL của cùng phim, rồi placeholder; không tải vô hạn khi lỗi                                                              |

CSS: base dùng chung; app/styles cho bố cục; catalog, movie và player có stylesheet riêng. HTTP client chỉ xử lý transport/lỗi JSON; endpoint được đặt trong feature API module.

## Backend

`index.js → database/pool.js → app.js → modules/*/*.routes.js`.

Router gắn HTTP method/path và middleware. Controller nhận request, gọi validate, điều phối nghiệp vụ và trả response. Repository chứa SQL tham số hóa. `movies.service.js` chứa transaction cập nhật phim/tập; không chia transaction thành các lệnh query độc lập qua pool.

### Danh mục ngoài

```text
GET /api/catalog/kkphim/movies
  → catalog.routes.js
  → catalog.controller.js + catalog.schemas.js
  → integrations/kkphim/kkphim.client.js
  → shared/http/createProviderClient.js (cache, timeout, dedup)
  → phimapi.com
  → kkphim.mapper.js (URL, text, nguồn tập, embed allowlist)
  → JSON chuẩn hóa
  → useCatalog → component hiển thị
```

Không ghi đè PostgreSQL bằng metadata provider. TMDB/TVmaze ở integrations riêng với router tùy chọn, không trộn ID số/slug với UUID phim nội bộ.

### Tài khoản và dữ liệu cá nhân

```text
Request cookie
  → auth.middleware.js (hash token, kiểm tra session/disabled)
  → requireAuth / requireAdmin
  → auth/library/reviews/admin controller
  → feature repository hoặc movies service
  → PostgreSQL pool
  → response JSON
```

Các query dùng tham số `$1...`; SQL không ghép từ đầu vào người dùng. Tài khoản tự đăng ký luôn là user. Tạo admin bằng `backend/src/scripts/createAdmin.js`; password nhập ẩn. Session và xác thực không phụ thuộc provider danh mục.

### Vòng đời database

`npm run db:migrate → backend/src/database/migrate.js → backend/migrations/*.sql`. Dùng transaction và advisory lock; lịch sử trong schema_migrations. App không tự chạy lại DDL ở mỗi request. `.env` dùng cấu hình thật và bị Git/Docker ignore; `npm run setup` tạo mới nếu thiếu, không ghi đè.

## Khi thêm chức năng mới

`SeasonSelector → useMovieSeasons → movieApi → catalog controller → kkphim.seasons.js` tải các phần cùng bộ. Chọn phần gọi openMovie để điều hướng tới slug khác, remount trang chi tiết theo slug nên reset tập/máy chủ và bình luận về đúng phần. Dữ liệu phần là liên kết từ upstream, không nhập hoặc gộp bản ghi PostgreSQL.

Hero chọn tối đa 5 phim có ảnh từ trang danh mục đầu tiên. `useHeroCarousel` quản lý chỉ số, chuyển mỗi 6 giây, dừng khi hover/focus, tab ẩn, mở chi tiết hoặc người dùng bấm tạm dừng. Thiết lập reduced-motion tắt tự chuyển. Nút trước/sau/chấm điều hướng và hành động Xem ngay/Chi tiết luôn gắn với slide đang chọn.

Hai ô tìm kiếm dùng component `MovieSearch` và hook `useSearchSuggestions`: sau 300ms dừng gõ, tải tối đa 6 gợi ý ngay dưới ô nhập (poster, tên, năm). Việc gõ không thay đổi danh mục hoặc hero. Chọn gợi ý mở chi tiết phim trực tiếp; nhấn Enter khi chưa chọn gợi ý hoặc bấm Xem tất cả mới chuyển danh mục sang kết quả tìm kiếm. Có phím lên/xuống/Enter/Escape, đóng khi click ngoài và loại phản hồi từ khóa cũ. Backend gửi keyword tới KKPhim, không so sánh tên phim bằng phép bằng tuyệt đối.

1. Định nghĩa request/response trong docs/API.md và schema.
2. Đặt route/controller/repository trong module tương ứng; provider mới đặt ở integrations.
3. Frontend thêm API module, hook quản lý dữ liệu rồi component nhận props.
4. Kiểm thử hành vi phân quyền/SQL/provider khi có thay đổi; chạy build và format check.
5. Không để file thử nghiệm, script refactor hoặc file example không có nơi dùng trong source cuối.
