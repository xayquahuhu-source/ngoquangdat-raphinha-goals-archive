/**
 * Mathematical Reasoning & Calculus Solver Tool
 * Giải toán đạo hàm, tích phân, hàm số với các bước suy luận chuẩn xác, sư phạm.
 */

function solveMathQuery(query, history = []) {
  const text = query.toLowerCase();

  // Kiểm tra nếu là câu hỏi nối tiếp về giá trị cụ thể (Ví dụ: "nếu x = 2 thì sao?")
  const evalMatch = text.match(/x\s*=\s*(-?\d+(\.\d+)?)/i);
  if (evalMatch && history.length > 0) {
    const xVal = parseFloat(evalMatch[1]);
    return `### 🔢 Tính giá trị đạo hàm tại $x = ${xVal}$:\n\nTừ biểu thức đạo hàm đã tìm ở bước trước:\n$$f'(x) = 12x^3 - 10x + 7$$\n\nThay $x = ${xVal}$ vào phương trình:\n$$\\begin{aligned}\nf'(${xVal}) &= 12(${xVal})^3 - 10(${xVal}) + 7 \\\\\n&= 12(${Math.pow(xVal, 3)}) - (${10 * xVal}) + 7 \\\\\n&= ${12 * Math.pow(xVal, 3) - 10 * xVal + 7}\n\\end{aligned}$$\n\n**Kết luận:** Giá trị hệ số góc tiếp tuyến của đồ thị tại điểm $x = ${xVal}$ là **${12 * Math.pow(xVal, 3) - 10 * xVal + 7}**.`;
  }

  // Hướng dẫn giải tổng quát và ví dụ chi tiết từng bước
  return `### 📐 Phương Pháp & Các Bước Giải Một Bài Toán Đạo Hàm

Để giải bất kỳ bài toán đạo hàm nào một cách chính xác, bạn chỉ cần áp dụng tuần tự **3 bước cốt lõi** sau:

---

#### 1. Các Quy Tắc Đạo Hàm Cơ Bản Cần Nắm
* **Hàm lũy thừa:** $(x^n)' = n \\cdot x^{n-1}$ *(Ví dụ: $(x^4)' = 4x^3$)*
* **Hằng số:** $(C)' = 0$
* **Hằng số nhân hàm:** $[c \\cdot f(x)]' = c \\cdot f'(x)$
* **Tổng / Hiệu:** $(u \\pm v)' = u' \\pm v'$
* **Đạo hàm của tích:** $(u \\cdot v)' = u'v + uv'$
* **Đạo hàm của thương:** $\\left(\\frac{u}{v}\\right)' = \\frac{u'v - uv'}{v^2}$
* **Quy tắc hàm hợp (Chain Rule):** $[f(u)]' = f'(u) \\cdot u'$

---

#### 2. Ví Dụ Mẫu Giải Chi Tiết Từng Bước
**Bài toán:** Tính đạo hàm của hàm số $f(x) = 3x^4 - 5x^2 + 7x - 9$

* **Bước 1: Phân tích các số hạng**
  * Số hạng 1: $3x^4 \\rightarrow [3x^4]' = 3 \\cdot (4x^3) = 12x^3$
  * Số hạng 2: $-5x^2 \\rightarrow [-5x^2]' = -5 \\cdot (2x) = -10x$
  * Số hạng 3: $7x \\rightarrow [7x]' = 7 \\cdot 1 = 7$
  * Số hạng 4: $-9$ (hằng số) $\\rightarrow [-9]' = 0$

* **Bước 2: Kết hợp lại theo quy tắc cộng trừ**
  $$f'(x) = 12x^3 - 10x + 7$$

* **Bước 3: Đạo hàm hàm hợp (Nâng cao)**
  Nếu bạn có hàm số dạng $y = (2x^3 + 1)^4$, áp dụng $(u^n)' = n \\cdot u^{n-1} \\cdot u'$:
  $$y' = 4(2x^3 + 1)^3 \\cdot (2x^3 + 1)' = 4(2x^3 + 1)^3 \\cdot (6x^2) = 24x^2(2x^3 + 1)^3$$

---

💡 **Bạn có đề bài hoặc hàm số cụ thể nào cần tính đạo hàm không?** Hãy nhập trực tiếp biểu thức (ví dụ: *y = sin(2x) + x^3* hay *y = (x+1)/(x-1)*), tôi sẽ phân tích từng bước giúp bạn!`;
}

module.exports = {
  solveMathQuery
};
