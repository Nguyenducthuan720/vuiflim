# VuiPhim API v1

## Các phần của cùng một phim

`GET /api/catalog/kkphim/movies/:slug/seasons` trả `{results,partial}`; mỗi mục có id (slug), title, original, seasonNumber, label, year và current. Ưu tiên nhóm theo TMDB TV ID chung; nếu không có ID, yêu cầu tên gốc cơ sở trùng chính xác sau khi bỏ hậu tố Phần/Mùa/Season/Part và nhận diện được số phần. ID khác nhau không được ghép chỉ vì tên giống nhau. Tìm tối đa 3 trang × 64 mục cho mỗi từ khóa tên gốc/tên Việt; đánh dấu partial nếu chưa quét hết hoặc nguồn lỗi. Luôn giữ phần hiện tại trong kết quả. Không gộp/chỉnh sửa bản ghi upstream hoặc chuyển số tập giữa các phần.

## Bình luận phim KKPhim

- `GET /api/catalog/kkphim/movies/:slug/comments?page=1` → `{results,total,page,pageSize:20}`. Bình luận sắp xếp mới nhất trước, gắn với slug/provider, tách khỏi review phim nội bộ.
- `POST /api/catalog/kkphim/movies/:slug/comments` → `{body}` từ 1–1000 ký tự sau trim, cần đăng nhập và đúng Origin; 201 khi thành công. Backend kiểm tra phim tồn tại qua provider, không nhận tên người dùng từ client. Giới hạn 10 lần/phút/IP.
- `DELETE /api/catalog-comments/:id` → cần chủ bình luận hoặc admin; 404 nếu không có quyền hoặc ID không tồn tại.

Migration `002_catalog_comments.sql` tạo bảng/index riêng. Bình luận được lưu dạng văn bản và React render escaped, không chạy HTML từ người dùng. Không tự gửi bình luận đến KKPhim.

Nguồn mặc định: `GET /api/catalog/kkphim/movies?q=&type=all&page=1` và `GET /api/catalog/kkphim/movies/:slug`, gồm nguồn HLS theo máy chủ/tập. Xem [KKPhim](KKPHIM.md). TVmaze/TMDB bên dưới là API tùy chọn cũ, không được giao diện mặc định gọi.

KKPhim bổ sung `GET /api/catalog/kkphim/options` → `{genres,countries}`. Danh sách nhận category/country (slug), year (chuỗi 4 số hoặc rỗng), sort=modified.time/year/_id. Chi tiết mỗi tập trả `url` HLS HTTPS và/hoặc `embedUrl` chính thức. Embed chỉ cho phép `https://player.phimapi.com/player/` với tham số `url` HTTPS; link nhúng domain khác bị loại bỏ. Phim chỉ có embed hợp lệ vẫn phát được bằng player nguồn.

Danh mục mặc định không cần API key: `GET /api/catalog/tvmaze/shows?page=1&q=&sort=default` và `GET /api/catalog/tvmaze/shows/:id`. Xem [TVmaze](TVMAZE.md) cho hợp đồng phân lô và giới hạn dữ liệu. API TMDB phía dưới vẫn là tùy chọn cũ.

Danh mục ngoài: xem [TMDB](TMDB.md) cho `/api/catalog/tmdb/status`, `/api/catalog/tmdb/movies` (type, q, page, sort) và `/api/catalog/tmdb/movies/:type/:id`. Danh mục TMDB chỉ trả metadata, không ghi vào PostgreSQL, không có nguồn video và không dùng ID UUID của kho phim nội bộ.

Base URL: `/api`. JSON responses; errors `{ "error": "message" }`. Session uses HttpOnly, SameSite=Lax cookie, expires after 7 days. Mutations require same origin. 401 for unauthenticated access, 403 for unauthorized admin access, 404 for unknown resources, 400 for invalid inputs, 409 for duplicate email. No external API required.

| Method | Path                          | Contract                                                          |
| ------ | ----------------------------- | ----------------------------------------------------------------- |
| GET    | /health                       | Health status                                                     |
| GET    | /movies                       | Catalog, supports q, genre, type, country, year, sort=rating/year |
| GET    | /movies/:id                   | Movie details                                                     |
| POST   | /auth/register                | name, email, password (min 8); returns user, creates session      |
| POST   | /auth/login                   | email, password; returns user and session                         |
| POST   | /auth/logout                  | Revokes current session                                           |
| PATCH  | /auth/password                | Auth required, currentPassword, newPassword; revokes all sessions |
| GET    | /me                           | Current user or null                                              |
| GET    | /library                      | Auth required, favorites and watch history                        |
| PUT    | /favorites/:id                | Auth required, saves favorite (idempotent)                        |
| DELETE | /favorites/:id                | Auth required, removes favorite (idempotent)                      |
| PUT    | /history/:id                  | Auth required, position seconds and episode                       |
| DELETE | /history                      | Auth required, clears own watch history                           |
| GET    | /movies/:id/playback/:episode | Published movie playback URL for a single episode                 |
| GET    | /movies/:id/reviews           | Public comments                                                   |
| POST   | /movies/:id/reviews           | Auth required, body (1–1000), rating (1–10)                       |
| DELETE | /reviews/:id                  | Owner or admin may delete review                                  |
| GET    | /admin/movies                 | Admin catalog, includes drafts and episode URLs                   |
| POST   | /admin/movies                 | Admin required, complete movie object below                       |
| PUT    | /admin/movies/:id             | Admin required, replaces metadata and episode list atomically     |
| DELETE | /admin/movies/:id             | Admin required, deletes catalog entry                             |
| GET    | /admin/reviews                | Admin required, latest 200 comments                               |

Authentication rate limit: 15 attempts per 15 minutes per IP; process-local. Replace with shared rate limiter before horizontal scaling.

All mutations require an `Origin` header equal to `APP_ORIGIN`. API-wide rate limit: 300 requests/minute/IP. GET /health checks PostgreSQL. Only published movies are public; admins can preview drafts by ID. Review responses are limited to the latest 200 records. Movie IDs are UUIDs.

Movie create/update body (illustrative URL paths, not a seeded record):

```json
{
  "title": "Tên phim của bạn",
  "original": "Original title",
  "year": 2026,
  "genre": "Tài liệu",
  "country": "Việt Nam",
  "rating": 0,
  "duration": 12,
  "type": "movie",
  "description": "Nội dung phim",
  "director": "Tên đạo diễn",
  "cast": "",
  "poster": "/media/my-film/poster.jpg",
  "backdrop": "/media/my-film/backdrop.jpg",
  "license": "Chủ sở hữu, nguồn và giấy phép sử dụng",
  "featured": false,
  "published": false,
  "episodeList": [{ "number": 1, "title": "Phim đầy đủ", "videoUrl": "/media/my-film/movie.mp4" }]
}
```

Media paths must start with `/media/` and have no traversal, or be HTTPS URLs without embedded username/password. Episode numbers must be unique, consecutive from 1. Movies have exactly one episode; series have 1–500. `rating` is editorial metadata entered by an admin; user review scores are stored separately and do not overwrite it. Public catalog includes episode number/title but not playback URL; playback endpoint returns `{number,title,url}`. This is public streaming, not DRM or private media protection.
