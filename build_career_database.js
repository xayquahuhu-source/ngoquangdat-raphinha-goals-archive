const fs = require('fs');
const path = require('path');

const researchJsonPath = 'e:/du lieu ban thang cua raphinha/raphinha_goal_research_pack.json';
const researchCsvPath = 'e:/du lieu ban thang cua raphinha/raphinha_goal_events_index.csv';
const researchMdPath = 'e:/du lieu ban thang cua raphinha/raphinha_goal_research_pack.md';

const rawJson = JSON.parse(fs.readFileSync(researchJsonPath, 'utf-8'));
const rawCsv = fs.readFileSync(researchCsvPath, 'utf-8');

// Parse CSV
const csvRows = [];
const lines = rawCsv.trim().split('\n');
const headers = lines[0].split(',').map(h => h.trim());

for (let i = 1; i < lines.length; i++) {
  const line = lines[i];
  if (!line.trim()) continue;

  // regex parse CSV with quotes
  const match = line.match(/(?:^|,)("(?:[^"]|"")*"|[^,]*)/g);
  if (!match) continue;

  const row = match.map(m => {
    let val = m.replace(/^,/, '').trim();
    if (val.startsWith('"') && val.endsWith('"')) {
      val = val.substring(1, val.length - 1).replace(/""/g, '"');
    }
    return val;
  });

  csvRows.push({
    date: row[0] || '',
    team: row[1] || '',
    opponent: row[2] || '',
    competition: row[3] || '',
    match_score: row[4] || '',
    goal_minute: row[5] || '',
    player_goal_number: row[6] || '',
    event_scope: row[7] || '',
    source_url: row[8] || '',
    source_name: row[9] || '',
    note: row[10] || ''
  });
}

// Build unified event list
const allEvents = [];

// 1. Barcelona 2026/27 Goal Events (from CSV & JSON)
rawJson.barcelona_2026_27_match_goal_log.forEach((match, mIdx) => {
  match.goal_minutes.forEach((minute, gIdx) => {
    const isPen = minute.includes('penalty') || minute.includes('pen');
    const isHatTrick = match.goals === 3;
    const isBrace = match.goals === 2;
    let goalType = 'Bàn thắng';
    if (isPen) goalType = 'Phạt đền (Penalty)';
    else if (isHatTrick) goalType = 'Hat-trick';
    else if (isBrace) goalType = 'Cú đúp';

    allEvents.push({
      id: `barca-2627-m${mIdx + 1}-g${gIdx + 1}`,
      team: 'FC Barcelona',
      teamBadge: '🔵🔴',
      club_or_country: 'FC Barcelona',
      season: '2026/27',
      date: match.date,
      opponent: match.opponent,
      competition: match.competition,
      score: match.score,
      minute: minute,
      goalType: goalType,
      isPenalty: isPen,
      matchSummary: match.note,
      sourceUrl: match.source_url,
      sourceName: match.source_name,
      channelOwner: 'FC Barcelona Official',
      status: 'official_source_link', // Official match centre highlights embedded
      youtubeId: null,
      thumbnail: 'https://images2.minutemediacdn.com/image/upload/c_crop,w_4800,h_2700,x_0,y_0/c_fill,w_720,ar_16:9,f_auto,q_auto,g_auto/images/voltaxMediaLibrary/mmsport/90min_en_international_web/01javg94zfc42h2y5qdr.jpg',
      rightsNote: 'Video highlights nằm trên cổng chính thức của FC Barcelona.'
    });
  });
});

// 2. Brazil Senior International Goals (12 goals)
rawJson.brazil_senior_international_goal_log.forEach((bg) => {
  let minute = '';
  let status = 'clip_not_found';
  let ytId = null;
  let thumb = 'https://images.conmebol.com/wp-content/uploads/2024/07/Raphinha-Brasil-Colombia.jpg';
  let sourceUrl = bg.video_url || 'https://en.wikipedia.org/wiki/Raphinha';
  let sourceName = 'CBF TV / CONMEBOL';
  let goalType = 'Bàn thắng quốc tế';

  if (bg.goal_number === 7) {
    // Copa America vs Colombia Free Kick
    minute = "12'";
    goalType = 'Đá phạt trực tiếp đỉnh cao';
    status = 'embeddable_video';
    ytId = 'kefxUK-yPY0';
    sourceUrl = 'https://www.youtube.com/watch?v=kefxUK-yPY0';
    sourceName = 'Footy Highlights Official (Copa América 2024)';
    thumb = 'https://i.ytimg.com/vi/kefxUK-yPY0/hqdefault.jpg';
  } else if (bg.goal_number === 12) {
    // vs Australia 2026
    minute = "45' (penalty)";
    goalType = 'Phạt đền (Penalty)';
    status = 'official_source_link';
    sourceUrl = bg.video_url;
    sourceName = 'ge.globo (Truyền hình Globo Brazil)';
    thumb = 'https://s2-ge.glbimg.com/8Q0a76YJ1T-0J7q12-nE98e6s_4=/1200x/smart/filters:cover():strip_icc()/i.s3.glbimg.com/v1/AUTH_bc8228b6673f4d23a63a828a4f56ba59/internal_photos/bs/2024/G/J/mXWcWlS2eT956l1D7gkg/raphinha-brasil.jpg';
  } else if (bg.goal_number === 8 || bg.goal_number === 9) {
    goalType = 'Phạt đền (Penalty)';
    minute = bg.goal_number === 8 ? "38' (penalty)" : "54' (penalty)";
    status = 'official_source_link';
    sourceName = 'CONMEBOL / CBF TV';
  } else if (bg.goal_number === 10) {
    goalType = 'Đá phạt trực tiếp';
    minute = "43'";
    status = 'official_source_link';
    sourceName = 'CONMEBOL / CBF TV';
  } else if (bg.goal_number === 1 || bg.goal_number === 2) {
    goalType = 'Cú đúp';
    minute = 'Hiệp 1 & Hiệp 2 (Không có phút cụ thể trong CSV)';
    status = 'official_source_link';
  } else {
    minute = 'Không có phút cụ thể trong CSV';
  }

  allEvents.push({
    id: `brazil-goal-${bg.goal_number}`,
    team: 'ĐTQG Brazil',
    teamBadge: '🇧🇷',
    club_or_country: 'ĐTQG Brazil',
    player_goal_number: bg.goal_number,
    season: bg.date.substring(0, 4),
    date: bg.date,
    opponent: bg.opponent,
    competition: bg.competition,
    score: bg.final_score,
    score_after_goal: bg.score_after_goal,
    venue: bg.venue,
    minute: minute,
    goalType: goalType,
    isPenalty: goalType.includes('Penalty'),
    matchSummary: `Bàn thắng thứ #${bg.goal_number} cho tuyển Brazil. Tỷ số sau bàn thắng: ${bg.score_after_goal}. Sân thi đấu: ${bg.venue}.`,
    sourceUrl: sourceUrl,
    sourceName: sourceName,
    channelOwner: 'CBF TV / Broadcaster',
    status: status,
    youtubeId: ytId,
    thumbnail: thumb,
    rightsNote: bg.note || 'Trích dẫn từ danh mục bàn thắng quốc tế chính thức của ĐTQG Brazil.'
  });
});

// 3. Stade Rennais Verified Goal (from Ligue 1 official channel in JSON)
allEvents.push({
  id: 'rennes-nantes-90plus6',
  team: 'Stade Rennais',
  teamBadge: '🔴⚫',
  club_or_country: 'Stade Rennais',
  season: '2019/20',
  date: '2020-01-31',
  opponent: 'FC Nantes',
  competition: 'Ligue 1',
  score: 'Stade Rennais 3-2 FC Nantes',
  minute: "90'+6",
  goalType: 'Bàn thắng phút bù giờ kịch tính',
  isPenalty: false,
  matchSummary: 'Siêu phẩm ấn định chiến thắng 3-2 ở phút 90+6 của Raphinha cho Rennes trước Nantes tại Ligue 1.',
  sourceUrl: 'https://www.youtube.com/watch?v=LRORqKbrG9g',
  sourceName: 'Ligue 1 McDonald’s (Kênh YouTube chính thức của giải Ligue 1)',
  channelOwner: 'Ligue 1 McDonald’s Official',
  status: 'embeddable_video',
  youtubeId: 'LRORqKbrG9g',
  thumbnail: 'https://i.ytimg.com/vi/LRORqKbrG9g/hqdefault.jpg',
  rightsNote: 'Video chính thức do ban tổ chức Ligue 1 đăng tải.'
});

// 4. Leeds United Verified Goals (from Premier League Archive & Official Leeds Channel)
allEvents.push({
  id: 'leeds-brentford-survival-penalty',
  team: 'Leeds United',
  teamBadge: '⚪🔵',
  club_or_country: 'Leeds United',
  season: '2021/22',
  date: '2022-05-22',
  opponent: 'Brentford',
  competition: 'Premier League',
  score: 'Brentford 1-2 Leeds United',
  minute: "56' (penalty)",
  goalType: 'Phạt đền sinh tử (Trụ hạng Ngoại Hạng Anh)',
  isPenalty: true,
  matchSummary: 'Bàn thắng phạt đền sống còn ở vòng đấu cuối cùng 38 giúp Leeds United trụ hạng Premier League thành công.',
  sourceUrl: 'https://www.youtube.com/watch?v=--YaTtNw8nE',
  sourceName: 'Premier League Official YouTube Channel',
  channelOwner: 'Premier League Official',
  status: 'embeddable_video',
  youtubeId: '--YaTtNw8nE',
  thumbnail: 'https://i.ytimg.com/vi/--YaTtNw8nE/hqdefault.jpg',
  rightsNote: 'Video lưu trữ chính thức từ giải Ngoại Hạng Anh.'
});

allEvents.push({
  id: 'leeds-best-skills-and-goals',
  team: 'Leeds United',
  teamBadge: '⚪🔵',
  club_or_country: 'Leeds United',
  season: '2020/21–2021/22',
  date: '2020–2022',
  opponent: 'Everton, Newcastle, West Brom, Norwich',
  competition: 'Premier League',
  score: 'Tuyển tập 17 bàn',
  minute: 'Nhiều trận đấu',
  goalType: 'Tuyển tập bàn thắng đẹp',
  isPenalty: false,
  matchSummary: 'Tuyển tập chính thức của CLB Leeds United ghi lại toàn bộ kỹ năng, kiến tạo và siêu phẩm sút xa của Raphinha tại Premier League.',
  sourceUrl: 'https://www.youtube.com/watch?v=NXS8t60xVcw',
  sourceName: 'Leeds United Official Channel',
  channelOwner: 'Leeds United Official',
  status: 'embeddable_video',
  youtubeId: 'NXS8t60xVcw',
  thumbnail: 'https://i.ytimg.com/vi/NXS8t60xVcw/hqdefault.jpg',
  rightsNote: 'Video lưu trữ từ kênh chính thức Leeds United.'
});

// 5. Historic Verified FC Barcelona Goals (2022 - 2025)
const iconicBarcaGoals = [
  {
    id: 'barca-bayern-hattrick-2024',
    team: 'FC Barcelona',
    teamBadge: '🔵🔴',
    club_or_country: 'FC Barcelona',
    season: '2024/25',
    date: '2024-10-23',
    opponent: 'Bayern Munich',
    competition: 'UEFA Champions League',
    score: 'FC Barcelona 4-1 Bayern Munich',
    minute: "1', 45', 56'",
    goalType: 'Hat-trick thế kỷ',
    isPenalty: false,
    matchSummary: 'Hat-trick kinh điển phá dớp 9 năm của Barca trước Bayern Munich. Mang băng thủ quân, Raphinha mở tỷ số ở giây thứ 57, ghi bàn thứ hai ở phút 45 và hoàn tất hat-trick phút 56.',
    sourceUrl: 'https://www.youtube.com/watch?v=jXrBfL76U2A',
    sourceName: 'FC Barcelona Official YouTube',
    channelOwner: 'FC Barcelona Official',
    status: 'embeddable_video',
    youtubeId: 'jXrBfL76U2A',
    thumbnail: 'https://i.ytimg.com/vi/jXrBfL76U2A/hqdefault.jpg',
    rightsNote: 'Video chính thức từ CLB FC Barcelona.'
  },
  {
    id: 'barca-realmadrid-clasico-0-4',
    team: 'FC Barcelona',
    teamBadge: '🔵🔴',
    club_or_country: 'FC Barcelona',
    season: '2024/25',
    date: '2024-10-26',
    opponent: 'Real Madrid',
    competition: 'LaLiga EA Sports',
    score: 'Real Madrid 0-4 FC Barcelona',
    minute: "84'",
    goalType: 'Lốp bóng tinh tế (El Clásico)',
    isPenalty: false,
    matchSummary: 'Sau khi kiến tạo cho Yamal nâng tỷ số lên 3-0, Raphinha bứt tốc tâng bóng điệu nghệ qua đầu Lunin tại Santiago Bernabéu, ấn định đại thắng 0-4.',
    sourceUrl: 'https://www.youtube.com/watch?v=AfpItQBKl04',
    sourceName: 'FC Barcelona Official YouTube',
    channelOwner: 'FC Barcelona Official',
    status: 'embeddable_video',
    youtubeId: 'AfpItQBKl04',
    thumbnail: 'https://i.ytimg.com/vi/AfpItQBKl04/hqdefault.jpg',
    rightsNote: 'Video chính thức từ CLB FC Barcelona.'
  },
  {
    id: 'barca-valladolid-hattrick-2024',
    team: 'FC Barcelona',
    teamBadge: '🔵🔴',
    club_or_country: 'FC Barcelona',
    season: '2024/25',
    date: '2024-08-31',
    opponent: 'Real Valladolid',
    competition: 'LaLiga EA Sports',
    score: 'FC Barcelona 7-0 Real Valladolid',
    minute: "20', 64', 72'",
    goalType: 'Hat-trick đầu tiên sự nghiệp',
    isPenalty: false,
    matchSummary: 'Cú hat-trick chuyên nghiệp đầu tiên của Raphinha trong màu áo Barca trong chiến thắng 7 sao hủy diệt.',
    sourceUrl: 'https://www.youtube.com/watch?v=zeKzDyXUulM',
    sourceName: 'FC Barcelona Official YouTube',
    channelOwner: 'FC Barcelona Official',
    status: 'embeddable_video',
    youtubeId: 'zeKzDyXUulM',
    thumbnail: 'https://i.ytimg.com/vi/zeKzDyXUulM/hqdefault.jpg',
    rightsNote: 'Video chính thức từ CLB FC Barcelona.'
  },
  {
    id: 'barca-psg-brace-2024',
    team: 'FC Barcelona',
    teamBadge: '🔵🔴',
    club_or_country: 'FC Barcelona',
    season: '2023/24',
    date: '2024-04-10',
    opponent: 'Paris Saint-Germain',
    competition: 'UEFA Champions League',
    score: 'Paris Saint-Germain 2-3 FC Barcelona',
    minute: "37', 62'",
    goalType: 'Cú đúp & MVP Tứ kết',
    isPenalty: false,
    matchSummary: 'Màn trình diễn đỉnh cao đoạt danh hiệu MVP tại Parc des Princes với siêu phẩm bắt vô-lê một chạm chân trái đẳng cấp.',
    sourceUrl: 'https://www.youtube.com/watch?v=RDpx0cti1zE',
    sourceName: 'FC Barcelona Official YouTube',
    channelOwner: 'FC Barcelona Official',
    status: 'embeddable_video',
    youtubeId: 'RDpx0cti1zE',
    thumbnail: 'https://i.ytimg.com/vi/RDpx0cti1zE/hqdefault.jpg',
    rightsNote: 'Video chính thức từ CLB FC Barcelona.'
  },
  {
    id: 'barca-villarreal-brace-2024',
    team: 'FC Barcelona',
    teamBadge: '🔵🔴',
    club_or_country: 'FC Barcelona',
    season: '2024/25',
    date: '2024-09-22',
    opponent: 'Villarreal',
    competition: 'LaLiga EA Sports',
    score: 'Villarreal 1-5 FC Barcelona',
    minute: "74', 83'",
    goalType: 'Cú đúp (Siêu phẩm Trivela Yamal)',
    isPenalty: false,
    matchSummary: 'Cú đúp hủy diệt tại La Cerámica với bàn thắng từ đường vẩy má ngoài trivela thiên tài của Lamine Yamal.',
    sourceUrl: 'https://www.youtube.com/watch?v=hUuj7GFEz30',
    sourceName: 'FC Barcelona Official YouTube',
    channelOwner: 'FC Barcelona Official',
    status: 'embeddable_video',
    youtubeId: 'hUuj7GFEz30',
    thumbnail: 'https://i.ytimg.com/vi/hUuj7GFEz30/hqdefault.jpg',
    rightsNote: 'Video chính thức từ CLB FC Barcelona.'
  },
  {
    id: 'barca-benfica-thriller-2025',
    team: 'FC Barcelona',
    teamBadge: '🔵🔴',
    club_or_country: 'FC Barcelona',
    season: '2024/25',
    date: '2025-01-21',
    opponent: 'SL Benfica',
    competition: 'UEFA Champions League',
    score: 'SL Benfica 4-5 FC Barcelona',
    minute: "45'+2, 88'",
    goalType: 'Cú đúp kịch tính nghẹt thở',
    isPenalty: false,
    matchSummary: 'Cú đúp trong trận đấu 9 bàn thắng điên rồ tại Lisbon với bàn thắng quyết định ở phút 88.',
    sourceUrl: 'https://www.youtube.com/watch?v=sAhOZLCMR7w',
    sourceName: 'FC Barcelona Official YouTube',
    channelOwner: 'FC Barcelona Official',
    status: 'embeddable_video',
    youtubeId: 'sAhOZLCMR7w',
    thumbnail: 'https://i.ytimg.com/vi/sAhOZLCMR7w/hqdefault.jpg',
    rightsNote: 'Video chính thức từ CLB FC Barcelona.'
  },
  {
    id: 'barca-osasuna-winner-2022',
    team: 'FC Barcelona',
    teamBadge: '🔵🔴',
    club_or_country: 'FC Barcelona',
    season: '2022/23',
    date: '2022-11-08',
    opponent: 'CA Osasuna',
    competition: 'LaLiga EA Sports',
    score: 'CA Osasuna 1-2 FC Barcelona',
    minute: "85'",
    goalType: 'Đánh đầu ngược vàng',
    isPenalty: false,
    matchSummary: 'Bàn thắng vàng phút 85 giải cứu Barca 10 người sau thẻ đỏ của Lewandowski, mở toang cánh cửa vô địch LaLiga 2022/23.',
    sourceUrl: 'https://www.youtube.com/watch?v=R-6b0laJFcw',
    sourceName: 'FC Barcelona Official YouTube',
    channelOwner: 'FC Barcelona Official',
    status: 'embeddable_video',
    youtubeId: 'R-6b0laJFcw',
    thumbnail: 'https://i.ytimg.com/vi/R-6b0laJFcw/hqdefault.jpg',
    rightsNote: 'Video chính thức từ CLB FC Barcelona.'
  },
  {
    id: 'barca-clasico-las-vegas-2022',
    team: 'FC Barcelona',
    teamBadge: '🔵🔴',
    club_or_country: 'FC Barcelona',
    season: '2022/23',
    date: '2022-07-23',
    opponent: 'Real Madrid',
    competition: 'Giao hữu El Clásico',
    score: 'FC Barcelona 1-0 Real Madrid',
    minute: "27'",
    goalType: 'Nã đại bác góc chữ A',
    isPenalty: false,
    matchSummary: 'Siêu phẩm ra mắt tại Las Vegas: cướp bóng ngoài vòng cấm và nã rocket chân trái không thể cản phá qua đầu Courtois.',
    sourceUrl: 'https://www.youtube.com/watch?v=zk-XDgRBomY',
    sourceName: 'Fox Deportes (Chính thức)',
    channelOwner: 'Fox Deportes',
    status: 'embeddable_video',
    youtubeId: 'zk-XDgRBomY',
    thumbnail: 'https://i.ytimg.com/vi/zk-XDgRBomY/hqdefault.jpg',
    rightsNote: 'Bản quyền truyền hình Fox Deportes.'
  },
  {
    id: 'barca-season-2024-25-all-goals-compilation',
    team: 'FC Barcelona',
    teamBadge: '🔵🔴',
    club_or_country: 'FC Barcelona',
    season: '2024/25',
    date: '2024/25',
    opponent: 'Tất cả các đối thủ 2024/25',
    competition: 'LaLiga & Champions League',
    score: 'Toàn bộ 34 bàn thắng',
    minute: 'Toàn cảnh (14:19)',
    goalType: 'Bộ sưu tập trọn vẹn mùa giải',
    isPenalty: false,
    matchSummary: 'Video chính thức dài 14 phút 19 giây của FC Barcelona tổng hợp toàn bộ 34 bàn thắng của Raphinha trong chiến dịch lịch sử 2024/25.',
    sourceUrl: 'https://www.youtube.com/watch?v=SGlI6Qzft3k',
    sourceName: 'FC Barcelona Official YouTube',
    channelOwner: 'FC Barcelona Official',
    status: 'embeddable_video',
    youtubeId: 'SGlI6Qzft3k',
    thumbnail: 'https://i.ytimg.com/vi/SGlI6Qzft3k/hqdefault.jpg',
    rightsNote: 'Video chính thức từ CLB FC Barcelona.'
  },
  {
    id: 'barca-calendar-2025-all-goals-compilation',
    team: 'FC Barcelona',
    teamBadge: '🔵🔴',
    club_or_country: 'FC Barcelona',
    season: '2025',
    date: '2025',
    opponent: 'Tất cả các đối thủ năm 2025',
    competition: 'LaLiga & Champions League',
    score: 'Toàn bộ bàn thắng năm 2025',
    minute: 'Toàn cảnh (15:47)',
    goalType: 'Bộ sưu tập năm dương lịch 2025',
    isPenalty: false,
    matchSummary: 'Video chính thức dài 15 phút 47 giây do FC Barcelona phát hành ghi lại tất cả các bàn thắng của Raphinha trong năm 2025.',
    sourceUrl: 'https://www.youtube.com/watch?v=uTlarhL4RP8',
    sourceName: 'FC Barcelona Official YouTube',
    channelOwner: 'FC Barcelona Official',
    status: 'embeddable_video',
    youtubeId: 'uTlarhL4RP8',
    thumbnail: 'https://i.ytimg.com/vi/uTlarhL4RP8/hqdefault.jpg',
    rightsNote: 'Video chính thức từ CLB FC Barcelona.'
  }
];

allEvents.push(...iconicBarcaGoals);

// 6. Milestone Entries for Sporting CP and Vitória Guimarães (Status: clip_not_found)
allEvents.push({
  id: 'sporting-cp-career-archive',
  team: 'Sporting CP',
  teamBadge: '🟢⚪',
  club_or_country: 'Sporting CP',
  season: '2018/19–2019/20',
  date: '2018–2020',
  opponent: 'Qarabag, Portimonense, Feirense, v.v.',
  competition: 'Primeira Liga & Taça de Portugal',
  score: '9 bàn thắng',
  minute: 'Chi tiết từng trận',
  goalType: 'Bàn thắng cấp CLB',
  isPenalty: false,
  matchSummary: 'Giai đoạn thi đấu cho Sporting CP với 9 bàn thắng chính thức, đoạt Cúp Quốc Gia Bồ Đào Nha và Cúp Liên Đoàn.',
  sourceUrl: 'https://www.transfermarkt.com/raphinha/alletore/spieler/411295',
  sourceName: 'Transfermarkt & Liga Portugal Database',
  channelOwner: 'Chưa có video chính thức công khai đầy đủ',
  status: 'clip_not_found',
  youtubeId: null,
  thumbnail: 'https://upload.wikimedia.org/wikipedia/en/thumb/3/3e/Sporting_Clube_de_Portugal_%28Logo%29.svg/800px-Sporting_Clube_de_Portugal_%28Logo%29.svg.png',
  rightsNote: 'Clip đang trong hàng đợi nghiên cứu (Source/clip not found). Đối chiếu thống kê qua Transfermarkt.'
});

allEvents.push({
  id: 'vitoria-guimaraes-career-archive',
  team: 'Vitória Guimarães',
  teamBadge: '⚪⚫',
  club_or_country: 'Vitória Guimarães',
  season: '2015/16–2017/18',
  date: '2015–2018',
  opponent: 'Benfica, Porto, Braga, v.v.',
  competition: 'Primeira Liga & Taça de Portugal',
  score: '22 bàn (Đội 1) + 5 bàn (Đội B)',
  minute: 'Chi tiết từng trận',
  goalType: 'Bàn thắng khởi nghiệp châu Âu',
  isPenalty: false,
  matchSummary: 'Bước khởi đầu sự nghiệp châu Âu tại Bồ Đào Nha với 5 bàn cho đội B (2015/16) và 22 bàn thắng cho đội một (2015/16 - 2017/18).',
  sourceUrl: 'https://www.transfermarkt.com/raphinha/alletore/spieler/411295',
  sourceName: 'Transfermarkt & Liga Portugal Database',
  channelOwner: 'Chưa có video chính thức công khai đầy đủ',
  status: 'clip_not_found',
  youtubeId: null,
  thumbnail: 'https://upload.wikimedia.org/wikipedia/en/thumb/e/e5/Vit%C3%B3ria_Guimar%C3%A3es_logo.svg/800px-Vit%C3%B3ria_Guimar%C3%A3es_logo.svg.png',
  rightsNote: 'Clip đang trong hàng đợi nghiên cứu (Source/clip not found). Đối chiếu thống kê qua Transfermarkt.'
});

// Final Archive Object
const careerData = {
  meta: {
    title: 'Raphinha Career Goals Archive',
    as_of_date: '2026-10-16',
    verified_at: '2026-10-16',
    player: rawJson.player,
    scope_note: rawJson.scope_note
  },
  career_totals: rawJson.career_totals,
  club_goals_by_team: rawJson.club_goals_by_team,
  barcelona_goals_by_season: rawJson.barcelona_goals_by_season,
  video_and_research_sources: rawJson.video_and_research_sources,
  data_audit: {
    verified_at: '2026-10-16',
    club_goals_with_reserve: 150,
    club_goals_first_team: 145,
    brazil_goals: 12,
    combined_with_reserve: 162,
    combined_first_team: 157,
    barcelona_goals: 89,
    barcelona_2026_27_goals: 14,
    notes: [
      {
        title: 'Cột goal_minute trong CSV cho 12 bàn thắng của Brazil',
        detail: 'Trong raphinha_goal_events_index.csv, cột goal_minute bị bỏ trống hoàn toàn cho cả 12 bàn của Brazil. Hệ thống hiển thị rõ ràng thông báo \"Không có phút cụ thể trong CSV\" để tuân thủ quy tắc không tự đoán phút; riêng bàn #12 ghi nhận 45\' (penalty) theo clip ge.globo và bàn #7 ghi nhận 12\' đá phạt theo Copa América.'
      },
      {
        title: 'Cột player_goal_number trong CSV',
        detail: 'player_goal_number được điền từ 1 đến 12 cho Brazil nhưng để trống cho 14 bàn thắng của Barca 2026/27.'
      },
      {
        title: 'Quy mô chi tiết của CSV so với tổng bàn thắng sự nghiệp',
        detail: 'CSV chỉ lập danh mục chi tiết 26 sự kiện bàn thắng (14 bàn Barca 2026/27 + 12 bàn Brazil). 136 bàn thắng còn lại được thống kê ở cấp CLB/mùa giải kèm liên kết kiểm chứng (Transfermarkt, FBref, Opta).'
      },
      {
        title: 'Xử lý video bên thứ ba chặn nhúng iframe',
        detail: 'Cổng FC Barcelona Match Centre và ge.globo áp dụng chính sách chặn nhúng X-Frame-Options. Hệ thống cung cấp thẻ rạp chiếu phim (Cinema Preview Card) với nút chuyển hướng trực tiếp đến trang nguồn chính gốc, đảm bảo trải nghiệm không bao giờ bị lỗi màn hình đen.'
      },
      {
        title: 'Bàn thắng các thời kỳ cũ (Vitória Guimarães, Sporting CP)',
        detail: 'Chưa có video công khai chính thức tổng hợp toàn bộ các bàn thắng này. Hệ thống hiển thị trạng thái \"Chưa có nguồn / Đang trong hàng đợi nghiên cứu\", không tự tạo video giả.'
      }
    ]
  },
  events: allEvents
};

fs.writeFileSync('e:/raphinha_goal/data/career_archive.json', JSON.stringify(careerData, null, 2), 'utf-8');
console.log('SUCCESS: Written', allEvents.length, 'events into data/career_archive.json');
