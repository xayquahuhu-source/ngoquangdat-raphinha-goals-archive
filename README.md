# ⚽ Raphinha #11 Goals Hub - Hệ Thống Tổng Hợp Video Bàn Thắng Chính Gốc

Website chuyên biệt tự động tổng hợp **100% video bàn thắng thật chính gốc** của ngôi sao **Raphinha** (FC Barcelona & ĐTQG Brazil) cùng thông số chi tiết và chính xác của từng trận đấu.

---

## 🌟 Tính Năng Nổi Bật

1. **Video Thật Chính Gốc 100%**:
   - Tất cả video và clip phát trên web đều là video chính gốc từ các kênh uy tín: **FC Barcelona Official, UEFA, LaLiga EA Sports, Premier League Official, Leeds United Official**.
   - Không chứa video rỗng, không chứa placeholder hay link hỏng.

2. **Thông Tin Trận Đấu Chính Xác Từng Phút**:
   - Chi tiết đối thủ (Bayern Munich, Real Madrid, PSG, Benfica, Villarreal, Valladolid, Colombia...).
   - Tỷ số chính xác, phút ghi bàn (1', 45', 56', 84'...), giải đấu (Champions League, LaLiga, Vòng loại World Cup, Copa América).
   - Người kiến tạo (Yamal, Pedri, Casadó, Lewandowski, Cubarsí...), sân thi đấu và phân loại bàn thắng (Hat-trick, Volley, Vô-lê, Lốp bóng, Sút xa, Đá phạt).

3. **Cơ Chế "Tự Động Cào & Tổng Hợp" (Auto-Crawler & Aggregator)**:
   - Tích hợp engine cào dữ liệu từ YouTube (`services/youtubeAggregator.js`).
   - Nút **"Tự Động Cào Video Mới"**: Tự động quét các kênh chính thức của Barcelona và giải đấu để phát hiện và nạp các bàn thắng mới nhất của Raphinha.
   - Nút **"Thêm Link YouTube"**: Cho phép dán bất kỳ link YouTube / Shorts nào của Raphinha để hệ thống tự động bóc tách thumbnail, metadata, xác thực nhúng và lưu vào hệ thống.

4. **Giao Diện Đỉnh Cao Hiện Đại (Blaugrana & Brazilian Samba)**:
   - **Hero Spotlight**: Khu vực phát video bàn thắng nổi bật nhất (Hat-trick vào lưới Bayern Munich 4-1).
   - **Cinema Player Modal**: Trình phát video chuẩn 16:9 với độ phân giải cao và liên kết trực tiếp đến kênh YouTube gốc để đối chiếu.
   - **Bộ Lọc Đa Dạng**: Lọc theo Champions League, LaLiga, ĐTQG Brazil, Premier League, Hat-trick.
   - **Tìm Kiếm Tức Thì (Instant Search)**: Tìm theo đối thủ, số phút, giải đấu hoặc mùa giải.

---

## 🚀 Hướng Dẫn Khởi Chạy

### Cách 1: Chạy nhanh bằng file `run.bat` (Khuyên dùng trên Windows)
- Nhấp đúp vào file `run.bat` trong thư mục `e:\raphinha_goal`.
- Trình duyệt sẽ tự động mở trang web tại địa chỉ: `http://localhost:3000`.

### Cách 2: Chạy qua dòng lệnh (Terminal / PowerShell)
```bash
npm start
```
Sau đó truy cập: [http://localhost:3000](http://localhost:3000)

---

## 📁 Cấu Trúc Dự Án

```
e:\raphinha_goal\
├── data\
│   └── goals.json                # Database lưu trữ các bàn thắng, video ID và thông tin kiểm chứng
├── services\
│   └── youtubeAggregator.js      # Bộ máy tự động cào và trích xuất video YouTube chính gốc
├── public\
│   ├── index.html                # Giao diện người dùng chuẩn Responsive
│   ├── css\
│   │   └── style.css             # Giao diện Blaugrana hiện đại, hiệu ứng ánh sáng
│   └── js\
│       └── app.js                # Xử lý tương tác, bộ lọc, phát video và đồng bộ API
├── server.js                     # Máy chủ Express REST API
├── package.json                  # Cấu hình dự án và dependencies
└── run.bat                       # File khởi động nhanh 1-click
```
