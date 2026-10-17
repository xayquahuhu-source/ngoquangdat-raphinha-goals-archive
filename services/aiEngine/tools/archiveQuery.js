/**
 * Verified Career Archive Query Tool
 * Tra cứu kho lưu trữ 162 bàn thắng chính thức và 23 video bàn thắng có bản quyền.
 */

const fs = require('fs');
const path = require('path');

function getArchiveData() {
  const archivePath = path.join(__dirname, '..', '..', '..', 'data', 'career_archive.json');
  const goalsPath = path.join(__dirname, '..', '..', '..', 'data', 'goals.json');

  let archive = null;
  let goals = [];

  try {
    if (fs.existsSync(archivePath)) {
      archive = JSON.parse(fs.readFileSync(archivePath, 'utf8'));
    }
    if (fs.existsSync(goalsPath)) {
      goals = JSON.parse(fs.readFileSync(goalsPath, 'utf8'));
    }
  } catch (e) {
    console.error('Lỗi đọc archive data:', e);
  }

  return { archive, goals };
}

function queryArchive(query, history = []) {
  const q = query.toLowerCase().trim();
  const { archive, goals } = getArchiveData();

  const totals = archive ? archive.career_totals : {
    combined_club_and_brazil_goal_events_including_reserve_team: 162,
    barcelona_all_competitions_goals_through_2026_09_19: 89,
    brazil_senior_international_goals: 12
  };

  // 1. Kiểm tra câu hỏi nối tiếp về người kiến tạo hoặc chi tiết trận đấu
  const isAssistQuery = /(ai kiến tạo|kiến tạo|assist|người chuyền)/i.test(q);
  if (isAssistQuery && history.length > 0) {
    const lastContext = history[history.length - 1].content.toLowerCase();
    if (lastContext.includes('feyenoord')) {
      return `Trong chiến thắng 5–1 trước **Feyenoord** tại Champions League 2026/27, hai bàn thắng của Raphinha được kiến tạo bởi:\n\n* ⚽ **Bàn thứ nhất (phút 3'):** Đường chọc khe thông minh của **Pedri**.\n* ⚽ **Bàn thứ hai (phút 57'):** Pha tỉa bóng tinh tế từ **Dani Olmo**.\n\n👉 Bạn có thể phát lại video bàn thắng: [GOAL:ucl-2026-feyenoord-brace]`;
    }
    if (lastContext.includes('bayern')) {
      return `Trong cú hat-trick hủy diệt **Bayern Munich 4–1**, các bàn thắng của Raphinha được kiến tạo bởi **Fermín López** (phút 1'), **Marc Casadó** (phút 45') và **Lamine Yamal** (phút 56') với đường chuyền dài tuyệt đỉnh!\n\n👉 [GOAL:ucl-2024-bayern-hattrick]`;
    }
  }

  // 2. Hỏi tổng số bàn thắng sự nghiệp
  if (/tổng|sự nghiệp|bao nhiêu bàn|tất cả|career/i.test(q)) {
    return `📊 **Tổng Kết 162 Bàn Thắng Sự Nghiệp Của Raphinha #11 (Cập nhật 16/10/2026):**

* 🏆 **Tổng cộng sự nghiệp:** **162 bàn thắng chính thức**
  * **150 bàn cấp CLB**
  * **12 bàn cấp ĐTQG Brazil**

🏛️ **Phân bố chi tiết theo từng màu áo:**
1. 🔵🔴 **FC Barcelona:** **89 bàn** (Giai đoạn 2022/23 – 2026/27)
2. 🇵🇹 **Vitória Guimarães:** **27 bàn** (22 bàn đội một + 5 bàn đội B)
3. 🏴󠁧󠁢󠁥󠁮󠁧󠁿 **Leeds United:** **17 bàn** (Trụ cột tại Ngoại Hạng Anh 2020 – 2022)
4. 🇵🇹 **Sporting CP:** **9 bàn** (Mùa 2018/19 – 2019/20)
5. 🇫🇷 **Stade Rennais (Rennes):** **8 bàn** (Mùa 2019/20 – 2020/21)
6. 🇧🇷 **ĐTQG Brazil:** **12 bàn** (Từ năm 2021 đến nay)

✨ Bạn muốn xem video hoặc tìm hiểu giai đoạn thi đấu nào của anh ấy?`;
  }

  // 3. Hat-trick
  if (/hat-trick|hattrick|3 bàn|ba bàn/i.test(q)) {
    const hattricks = goals.filter(g => (g.goalType && g.goalType.toLowerCase().includes('hat-trick')) || g.title.toLowerCase().includes('hat-trick'));
    let res = `🎩 **Các Cú Hat-Trick Rực Sáng Trong Sự Nghiệp Của Raphinha #11:**\n\n`;
    hattricks.forEach(h => {
      res += `* **${h.title}** (${h.date})\n`;
      res += `  - Giải đấu: **${h.tournament}** | Trận: **${h.match}** (${h.score})\n`;
      res += `  - Số phút: **${h.minute}** | Sân: **${h.stadium}**\n`;
      res += `  - [GOAL:${h.id}]\n\n`;
    });
    return res;
  }

  // 4. Barcelona
  if (/barca|barcelona/i.test(q)) {
    return `🔵🔴 **Thống Kê Toàn Diện Của Raphinha Tại FC Barcelona:**

* **Tổng số bàn thắng:** **${totals.barcelona_all_competitions_goals_through_2026_09_19} bàn thắng** trên mọi đấu trường (tính đến 19/09/2026).
* **Mùa giải 2026/27:** Đang có phong độ thăng hoa với **${totals.barcelona_2026_27_goals_through_2026_09_19 || 14} bàn thắng**, dẫn đầu danh sách ghi bàn của Barça.
* **Mùa giải 2025/26:** Ghi **21 bàn thắng**, là đầu tàu đưa Barcelona đăng quang và tiến sâu tại Champions League.

👉 Bạn có thể xem ngay video tiêu biểu mở màn Champions League 2026/27: [GOAL:ucl-2026-feyenoord-brace]`;
  }

  // 5. Tìm theo đối thủ
  const foundGoal = goals.find(g => {
    const opp = g.opponent ? g.opponent.toLowerCase() : '';
    const match = g.match ? g.match.toLowerCase() : '';
    return q.includes(opp) || q.includes(match);
  });

  if (foundGoal) {
    return `⚽ **Chi Tiết Bàn Thắng Của Raphinha vào lưới ${foundGoal.opponent}:**

* **Tiêu đề:** **${foundGoal.title}**
* **Trận đấu:** **${foundGoal.match}** (Tỷ số chung cuộc: **${foundGoal.score}**)
* **Giải đấu:** ${foundGoal.tournament} (${foundGoal.season})
* **Thời gian & Địa điểm:** Phút **${foundGoal.minute}** ngày **${foundGoal.date}** tại sân **${foundGoal.stadium}**
* **Người kiến tạo:** ${foundGoal.assist || 'Tự tạo cơ hội'}
* **Diễn biến:** ${foundGoal.description}

👉 **Xem trực tiếp video ngay tại đây:**
[GOAL:${foundGoal.id}]`;
  }

  return `Raphinha hiện có **162 bàn thắng chính thức** trong sự nghiệp (89 bàn cho FC Barcelona, 12 bàn cho ĐTQG Brazil và 61 bàn cho các CLB châu Âu trước đây). Bạn có thể hỏi cụ thể về từng đối thủ, trận đấu hoặc mùa giải!`;
}

module.exports = {
  queryArchive
};
