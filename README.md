# Lá Lành — Website rau sạch 🌱

Bộ giao diện bán rau củ bằng **HTML + CSS + JavaScript thuần**, phát triển từ ba file `index.html`, `style.css`, `script.js` đã cung cấp. Không cần cài thư viện, không cần API để tải sản phẩm và ảnh.

## Cấu trúc

```text
rau-sach-website/
├── index.html          Trang chủ
├── san-pham.html       Danh sách sản phẩm, tìm kiếm, lọc, sắp xếp, phân trang
├── gio-hang.html       Giỏ hàng, số lượng, mã giảm giá, phí vận chuyển
├── thanh-toan.html     Nhập địa chỉ, thanh toán mô phỏng, xác nhận đơn
├── style.css           CSS giao diện & responsive
├── script.js           Sản phẩm mẫu & toàn bộ chức năng
├── assets/             Bộ hình minh hoạ SVG tự tạo (hoạt động offline)
└── README.md
```

## Cách chạy

**Khuyến nghị:** Mở thư mục bằng Visual Studio Code, cài extension **Live Server**, rồi chọn **Open with Live Server** trên `index.html`. Hoặc nếu có Python:

```bash
cd rau-sach-website
python -m http.server 5500
```

Sau đó mở **http://localhost:5500**. Cách chạy bằng local server bảo đảm `localStorage` chia sẻ giỏ hàng giữa các trang (khả năng chia sẻ khi mở `file://` tuỳ từng trình duyệt).

## Các chức năng

- Trang chủ có header / footer, banner, danh mục, sản phẩm nổi bật, giới thiệu.
- Trang sản phẩm có **20 mặt hàng mẫu**, lọc danh mục, tìm tên không dấu, lọc khoảng giá, sắp xếp và **8 sản phẩm/trang**.
- Thêm vào giỏ, tăng/giảm số lượng, xoá, tự lưu `localStorage`.
- Mã giảm giá: `GIAM10` (10% tiền sản phẩm), `GIAM50` (giảm 50.000đ cho đơn từ 500.000đ), `FREESHIP` (miễn phí vận chuyển).
- Giao tiêu chuẩn 30.000đ, **miễn phí từ 399.000đ**; giao nhanh 60.000đ (trừ khi dùng `FREESHIP`).
- Trang thanh toán có kiểm tra trường bắt buộc, chọn COD / chuyển khoản mô phỏng và thông báo xác nhận đơn mẫu.
- Responsive trên màn hình máy tính, tablet và điện thoại.

## Tuỳ chỉnh

Sửa mảng `PRODUCTS` và `CATEGORIES` ở đầu `script.js` để đổi tên, danh mục, giá, đơn vị, ảnh. Hình SVG nằm trong `assets/`. Màu sắc chính và font trong đầu `style.css`.

> **Lưu ý:** Đây là **frontend mẫu để học tập/trình diễn**. Dữ liệu sản phẩm và giá chỉ minh hoạ; không có cơ sở dữ liệu, máy chủ nhận đơn hay cổng thanh toán thực. Bấm **Xác nhận đặt hàng** chỉ hiện thông báo thành công trong trình duyệt, không gửi thông tin đi đâu. `localStorage` chỉ lưu ID và số lượng sản phẩm cùng tuỳ chọn giao hàng/mã ưu đãi; thông tin địa chỉ điền vào form không được lưu lại.
