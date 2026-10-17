/**
 * Multi-Language Programming & Code Generator Tool
 * Soạn thảo mã nguồn chuẩn mực, kèm chú thích chi tiết và hướng dẫn biên dịch/thực thi.
 */

function generateCode(query, history = []) {
  const text = query.toLowerCase();

  // 1. Kiểm tra câu hỏi nối tiếp (Ví dụ: "thêm vòng lặp vào chương trình trên", "thêm hàm")
  const isFollowUpLoop = /(thêm vòng lặp|vòng lặp|loop|while|for)/i.test(text);
  if (isFollowUpLoop && history.length > 0) {
    return `Dưới đây là phiên bản nâng cấp của chương trình C++ trước đó, **đã bổ sung vòng lặp \`while\`** để người dùng có thể thực hiện nhiều phép tính liên tục mà không cần chạy lại chương trình:

\`\`\`cpp
#include <iostream>

using namespace std;

int main() {
    char tiepTuc = 'c'; // 'c' = có, 'k' = không

    cout << "=== CHƯƠNG TRÌNH TÍNH TOÁN C++ (BẢN NÂNG CẤP CÓ VÒNG LẶP) ===" << endl;

    // Vòng lặp while tiếp tục chạy chừng nào người dùng còn muốn tính
    while (tiepTuc == 'c' || tiepTuc == 'C') {
        double so1, so2;
        char phepTinh;

        cout << "\\nNhập số thứ nhất: ";
        cin >> so1;

        cout << "Nhập phép tính (+, -, *, /): ";
        cin >> phepTinh;

        cout << "Nhập số thứ hai: ";
        cin >> so2;

        cout << "-> Kết quả: ";
        switch (phepTinh) {
            case '+':
                cout << so1 << " + " << so2 << " = " << (so1 + so2) << endl;
                break;
            case '-':
                cout << so1 << " - " << so2 << " = " << (so1 - so2) << endl;
                break;
            case '*':
                cout << so1 << " * " << so2 << " = " << (so1 * so2) << endl;
                break;
            case '/':
                if (so2 != 0) {
                    cout << so1 << " / " << so2 << " = " << (so1 / so2) << endl;
                } else {
                    cout << "Lỗi: Không thể chia cho số 0!" << endl;
                }
                break;
            default:
                cout << "Phép tính không hợp lệ!" << endl;
        }

        cout << "\\nBạn có muốn tính tiếp không? (Nhập 'c' để tiếp tục, 'k' để dừng): ";
        cin >> tiepTuc;
    }

    cout << "\\nCảm ơn bạn đã sử dụng chương trình! Tạm biệt!" << endl;
    return 0;
}
\`\`\`

### 💡 Điểm cải tiến chính:
1. **\`while (tiepTuc == 'c')\`**: Kiểm tra điều kiện lặp lại sau mỗi lần tính.
2. **Kiểm tra chia cho 0**: Đảm bảo an toàn không bị lỗi sụp chương trình (*crash*).
3. Người dùng nhập phím \`k\` để thoát chương trình sạch sẽ.`;
  }

  // 2. Chương trình C++ cơ bản cho người mới bắt đầu
  return `Dưới đây là một chương trình **C++ hoàn chỉnh, dễ hiểu và thực tế** dành cho người mới bắt đầu: Chương trình nhập thông tin và thực hiện các phép tính số học cơ bản.

\`\`\`cpp
#include <iostream> // Thư viện nhập xuất chuẩn (cin, cout)
#include <string>   // Thư viện xử lý chuỗi ký tự

using namespace std; // Giúp viết cout, cin ngắn gọn thay vì std::cout

int main() {
    // 1. Khai báo biến
    string ten;
    int namSinh;
    int namHienTai = 2026;

    // 2. Xuất thông báo và nhận dữ liệu từ bàn phím
    cout << "=== CHÀO MỪNG BẠN ĐẾN VỚI LẬP TRÌNH C++ ===" << endl;
    cout << "Vui lòng nhập tên của bạn: ";
    getline(cin, ten); // Đọc cả dòng bao gồm dấu cách

    cout << "Nhập năm sinh của bạn: ";
    cin >> namSinh;

    // 3. Xử lý logic và tính toán
    int tuoi = namHienTai - namSinh;

    // 4. In kết quả ra màn hình
    cout << "\\n--- THÔNG TIN CỦA BẠN ---" << endl;
    cout << "Xin chào: " << ten << "!" << endl;
    cout << "Năm nay bạn khoảng: " << tuoi << " tuổi." << endl;

    if (tuoi >= 18) {
        cout << "Trạng thái: Bạn đã đủ tuổi công dân." << endl;
    } else {
        cout << "Trạng thái: Bạn đang ở lứa tuổi thanh thiếu niên." << endl;
    }

    cout << "========================================" << endl;

    return 0; // Trả về 0 báo hiệu chương trình kết thúc thành công
}
\`\`\`

---

### 🔍 Giải Thích Từng Thành Phần Cốt Lõi:
1. **\`#include <iostream>\`**: Khai báo thư viện vào/ra (*Input/Output Stream*). Mọi chương trình C++ cần in ra màn hình hoặc nhận phím bấm đều cần dòng này.
2. **\`int main()\`**: Hàm khởi đầu của mọi ứng dụng C++. Khi chạy, hệ điều hành luôn bắt đầu thực thi từ đây.
3. **\`cout << ...\`**: Viết tắt của *Character Output* — in văn bản ra màn hình. Ký tự \`endl\` dùng để xuống dòng.
4. **\`cin >> ...\`**: Viết tắt của *Character Input* — nhận dữ liệu người dùng gõ vào.
5. **\`return 0;\`**: Báo cho hệ điều hành biết chương trình đã hoàn thành tốt đẹp không bị lỗi.

---

### 🛠️ Cách Biên Dịch & Chạy Chương Trình:
* **Trên Windows / Linux / macOS (Dùng GCC/G++):**
  \`\`\`bash
  g++ main.cpp -o main
  ./main
  \`\`\`
* Bạn có thể chạy thử trực tiếp trên VS Code, CLion, Dev-C++ hoặc các trang web online như *OnlineGDB*!`;
}

module.exports = {
  generateCode
};
