# Nguồn phim và cách đưa vào hệ thống

Source không cung cấp kho phim bản quyền thương mại. Metadata, poster và video cần do quản trị viên cung cấp; một URL công khai không tự chứng minh quyền tái phát hành.

Các hướng bắt đầu:

1. Phim ngắn/tài liệu do bạn sản xuất hoặc được chủ sở hữu cho phép phát hành trực tuyến.
2. Làm việc với nhà sản xuất/nhà phân phối và nhận file hoặc CDN theo hợp đồng.
3. Phim giấy phép mở. [Blender Studio](https://studio.blender.org/films/) có các phim và [chính sách tái sử dụng](https://studio.blender.org/remixing/). Kiểm tra giấy phép **của từng phim/từng tài nguyên**, tải từ nguồn chính thức và ghi công đầy đủ theo giấy phép. Không suy ra mọi poster, nhạc hoặc nhãn hiệu đều có quyền giống phim.

Để khởi đầu đơn giản, tự lưu MP4 đã có quyền trong `media/` trên VPS. Phim H.264/AAC trong MP4 thường phù hợp trình duyệt; HLS có nhiều chất lượng hữu ích khi cần thích ứng mạng. Nếu dùng CDN bên ngoài, cấu hình CORS cho domain website và các segment/key của HLS. URL nguồn được trả cho trình duyệt nên không nhập URL chứa credential bí mật dài hạn.

Trong quản trị: nhập thông tin → nguồn phát từng tập → bản quyền/ghi công → lưu nháp → kiểm tra → công khai. Trường ghi công được hiển thị trên chi tiết phim. Không thay video của một phim bằng nội dung không liên quan.

Hệ thống hiện phát nội dung công khai; chưa có thu phí, DRM, giới hạn vùng hoặc signed URL. Nếu hợp đồng yêu cầu các biện pháp đó, phải bổ sung trước khi đưa nội dung lên.
