# VuiPhim

React + Express + PostgreSQL. Giao diện mặc định lấy danh mục và nguồn phát từ KKPhim; kho phim nội bộ, tài khoản, yêu thích, lịch sử và bình luận lưu trong PostgreSQL.

## Cấu trúc và quy tắc

```text
frontend/src/
  main.jsx                         React entry
  app/                             App điều phối, header/footer, CSS bố cục
  features/
    catalog/                       Trang danh mục, toolbar, bộ lọc, card, useCatalog, API
    movie/                         Chi tiết phim, nội dung, tập, useMovieDetails, API
    player/                        HLS player và player nguồn
    auth/                          Đăng nhập/đăng ký, useSession
    account/                       Tài khoản và đổi mật khẩu
    library/                       Kho nội bộ, card, chi tiết, useLibrary
    admin/                         Quản trị nội dung
  shared/                          HTTP client, Modal, MovieImage và CSS chung
backend/src/
  index.js                         Khởi động/tắt server
  app.js                           Middleware và ghép router
  modules/
    auth/                          Route → controller → repository; middleware/session helpers
    catalog/                       Route → controller → schema → integration
    movies/                        Route → controller → service/repository
    library/                       Yêu thích và tiến độ xem
    reviews/                       Bình luận và quyền xóa
    admin/                         Phim và kiểm duyệt bình luận
  integrations/                    KKPhim client/mapper; TMDB/TVmaze tùy chọn
  database/                        Pool PostgreSQL và migration runner
  shared/                          Kiểm tra dữ liệu và HTTP provider client
  scripts/                         Tạo admin bằng terminal
backend/migrations/                SQL có phiên bản
backend/tests/                     API/SQL, HTTP provider fixtures, chuẩn hóa URL ảnh
scripts/                           Tạo .env an toàn và kiểm tra cú pháp source
deploy/                            Nginx, Caddy, backup
docs/                              API, kiến trúc, nguồn nội dung, vận hành
```

Component hiển thị không tự ghép URL upstream. Hook quản lý trạng thái/tải dữ liệu qua API module; backend kiểm tra đầu vào trước khi gọi integration hoặc persistence. Không thêm SQL vào router. Xem [luồng chi tiết](docs/ARCHITECTURE.md).

## Chạy phát triển

Cần Node.js >=22.13 và PostgreSQL >=16. Từ thư mục gốc:

```powershell
npm ci
npm run setup
```

Lệnh setup chỉ tạo `.env` và `backend/.env` **nếu chưa tồn tại**, không in mật khẩu và không ghi đè cấu hình đang dùng. Không còn file `.env.example`. Mở `backend/.env` để đặt thông tin PostgreSQL thật nếu bạn dùng database cài trên máy:

```dotenv
PORT=3001
HOST=127.0.0.1
DATABASE_URL=postgresql://TEN_USER:MAT_KHAU_DA_MA_HOA_URL@localhost:5432/vuiphim
APP_ORIGIN=http://localhost:5173
COOKIE_SECURE=false
TRUST_PROXY_HOPS=0
```

Đây là nội dung file, không phải lệnh PowerShell. Database và user PostgreSQL phải được tạo trước. Nếu dùng Docker cho database local, sau khi setup có thể chạy `docker compose -f compose.yaml -f compose.dev.yaml up -d db`; backend/.env được tạo mới sẽ dùng thông tin của `.env` gốc.

```powershell
npm run db:migrate
npm run admin:create
npm run dev
```

Frontend: **http://localhost:5173**. Health API: **http://127.0.0.1:3001/api/health**. Nếu terminal đang trong `backend`, dùng `npm run migrate`, `npm run admin:create`, `npm run dev`; frontend chạy bằng terminal riêng tại `frontend` với `npm run dev`.

Không cần API key để dùng KKPhim. Các tab/phần tìm kiếm KKPhim không phụ thuộc database phim nội bộ. Không xóa `.env` đang dùng khi đổi phiên bản source. Sau khi thay đổi cấu trúc thư mục, dừng tiến trình cũ và chạy lại `npm run dev` từ thư mục gốc.

Chi tiết phim online hiện là trang riêng `/phim/:slug`, hỗ trợ tải lại/chia sẻ URL và Back/Forward. Chọn phim từ poster/hero/gợi ý tìm kiếm đều mở trang này. Bình luận lưu PostgreSQL theo từng slug: cần đăng nhập để gửi; chủ bình luận hoặc admin được xóa. Bản nâng cấp cần chạy `npm run db:migrate` để áp dụng migration 002 (không xóa dữ liệu cũ).

## Docker và VPS

```powershell
npm run setup
docker compose up -d --build
docker compose exec backend npm run admin:create -w backend
```

Mặc định local mở **http://localhost**. PostgreSQL dùng volume, không mở cổng ra ngoài trừ override phát triển. Migration chạy trước API. Không có admin mặc định. Với VPS, sửa SITE_ADDRESS/APP_ORIGIN và COOKIE_SECURE trong `.env`; xem [triển khai](docs/DEPLOY.md). Không chạy `docker compose down -v` nếu muốn giữ database.

## Ảnh và trình phát

Mapper KKPhim xử lý URL tuyệt đối, `//host/...`, tên file, `uploads/movies/...` và `upload/vod/...`. Không ghép lặp thư mục. Component MovieImage thử lần lượt poster/ảnh thay thế; nếu nguồn không có ảnh hoạt động, hiển thị placeholder có tên phim thay vì biểu tượng ảnh vỡ. Không dùng ảnh của phim khác để thay thế.

Player nguồn chính thức là mặc định; HLS trực tiếp là tùy chọn. CORS/nguồn CDN phụ thuộc nhà cung cấp. Xem [KKPhim](docs/KKPHIM.md). Video không đi qua image proxy hoặc backend relay.

## Kiểm tra

```powershell
npm run check
npm test
npm run format:check
```

`check` kiểm tra cú pháp toàn bộ backend và build frontend. Test mặc định dùng PGlite; CI dùng PostgreSQL 17 với TEST_DATABASE_URL trỏ database trống có tên kết thúc `_test`, kiểm tra migration lặp và Docker build. Kiểm thử provider dùng HTTP fixture; kiểm tra nguồn thật được thực hiện riêng, không đưa token vào test.

Tham khảo: [API](docs/API.md), [kiến trúc và flow](docs/ARCHITECTURE.md), [vận hành](docs/OPERATIONS.md), [nội dung](docs/CONTENT.md).
