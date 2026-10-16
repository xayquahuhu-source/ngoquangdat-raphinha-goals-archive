const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data', 'goals.json');

function loadGoals() {
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Lỗi đọc database:', err);
    return [];
  }
}

function saveGoals(goals) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(goals, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Lỗi lưu database:', err);
    return false;
  }
}

function extractYoutubeId(input) {
  if (!input) return null;
  const match = input.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/|live\/))([a-zA-Z0-9_-]{11})/);
  if (match) return match[1];
  if (/^[a-zA-Z0-9_-]{11}$/.test(input)) return input;
  return null;
}

async function getOEmbedData(youtubeId) {
  try {
    const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${youtubeId}&format=json`;
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    return null;
  }
}

async function searchYoutubeLive(query, maxResults = 5) {
  const url = 'https://www.youtube.com/results?search_query=' + encodeURIComponent(query);
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'vi,en;q=0.9'
    }
  });
  const html = await res.text();
  const matches = [...html.matchAll(/\/watch\?v=([a-zA-Z0-9_-]{11})/g)];
  const ids = [...new Set(matches.map(m => m[1]))];

  const results = [];
  for (const id of ids) {
    if (results.length >= maxResults) break;
    const oembed = await getOEmbedData(id);
    if (oembed) {
      results.push({
        youtubeId: id,
        title: oembed.title,
        author: oembed.author_name,
        authorUrl: oembed.author_url,
        thumbnail: `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`,
        fallbackThumb: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
        embedHtml: oembed.html
      });
    }
  }
  return results;
}

function guessTournament(text) {
  const t = text.toLowerCase();
  if (t.includes('champions league') || t.includes('ucl')) return 'UEFA Champions League';
  if (t.includes('laliga') || t.includes('la liga')) return 'LaLiga EA Sports';
  if (t.includes('premier league') || t.includes('leeds')) return 'Premier League';
  if (t.includes('copa america') || t.includes('copa américa')) return 'Copa América';
  if (t.includes('world cup') || t.includes('selecao') || t.includes('brazil')) return 'ĐTQG Brazil';
  if (t.includes('copa del rey')) return 'Copa del Rey';
  return 'Giao hữu / Khác';
}

function parseVideoIntoGoal(video, customData = {}) {
  const title = customData.title || video.title;
  const tournament = customData.tournament || guessTournament(title);
  
  // Extract opponent
  let opponent = customData.opponent || 'Đối thủ';
  const opponentsList = [
    'Bayern Munich', 'Real Madrid', 'PSG', 'Paris Saint-Germain', 'Valladolid',
    'Villarreal', 'Benfica', 'Red Star Belgrade', 'Osasuna', 'Athletic Club',
    'Sevilla', 'Valencia', 'Mallorca', 'Monaco', 'Young Boys', 'Colombia',
    'Peru', 'Uruguay', 'Bolivia', 'Everton', 'Newcastle', 'Brentford'
  ];
  for (const opp of opponentsList) {
    if (new RegExp(opp, 'i').test(title)) {
      opponent = opp;
      break;
    }
  }

  // Extract score
  let score = customData.score || 'Ghi bàn';
  const scoreMatch = title.match(/(\d+)\s*(?:vs|-)\s*(\d+)/i);
  if (scoreMatch) {
    score = `${scoreMatch[1]} - ${scoreMatch[2]}`;
  }

  const isHatTrick = /hat[\s-]?trick/i.test(title);
  const isBrace = /brace|cú đúp|2 goals/i.test(title);

  return {
    id: `auto-${video.youtubeId}-${Date.now().toString(36)}`,
    title: title,
    match: customData.match || `${opponent} (${tournament})`,
    tournament: tournament,
    season: customData.season || '2024/25',
    date: customData.date || new Date().toLocaleDateString('vi-VN'),
    minute: customData.minute || (isHatTrick ? "Hat-trick" : "Toàn trận"),
    stadium: customData.stadium || "Chính thức",
    opponent: opponent,
    score: score,
    goalType: customData.goalType || (isHatTrick ? "Hat-trick" : (isBrace ? "Cú đúp" : "Bàn thắng đẳng cấp")),
    assist: customData.assist || "Đồng đội kiến tạo",
    youtubeId: video.youtubeId,
    sourceChannel: video.author || "Kênh chính thức",
    sourceUrl: `https://www.youtube.com/watch?v=${video.youtubeId}`,
    thumbnail: video.thumbnail,
    fallbackThumb: video.fallbackThumb,
    description: customData.description || `Video clip chính gốc bàn thắng của Raphinha từ kênh ${video.author}.`,
    isFeatured: false,
    verified: true,
    addedAt: new Date().toISOString()
  };
}

async function autoSync() {
  const queries = [
    'FC Barcelona Raphinha goals 2024 2025',
    'FC Barcelona Raphinha hat-trick',
    'Raphinha Brazil goals highlights'
  ];

  const currentGoals = loadGoals();
  const existingIds = new Set(currentGoals.map(g => g.youtubeId));
  const newDiscovered = [];

  for (const q of queries) {
    const results = await searchYoutubeLive(q, 3);
    for (const item of results) {
      if (!existingIds.has(item.youtubeId)) {
        existingIds.add(item.youtubeId);
        const goalEntry = parseVideoIntoGoal(item);
        newDiscovered.push(goalEntry);
        currentGoals.unshift(goalEntry);
      }
    }
  }

  if (newDiscovered.length > 0) {
    saveGoals(currentGoals);
  }

  return {
    success: true,
    addedCount: newDiscovered.length,
    newItems: newDiscovered,
    totalCount: currentGoals.length
  };
}

async function addCustomUrl(inputUrl, metadata = {}) {
  const ytId = extractYoutubeId(inputUrl);
  if (!ytId) {
    throw new Error('Link YouTube không hợp lệ! Vui lòng nhập link watch?v=, youtu.be hoặc shorts.');
  }

  const oembed = await getOEmbedData(ytId);
  if (!oembed) {
    throw new Error('Không thể tải dữ liệu video từ YouTube. Video có thể ở chế độ riêng tư hoặc bị giới hạn nhúng.');
  }

  const currentGoals = loadGoals();
  const existing = currentGoals.find(g => g.youtubeId === ytId);
  if (existing) {
    return { isExisting: true, goal: existing };
  }

  const video = {
    youtubeId: ytId,
    title: oembed.title,
    author: oembed.author_name,
    authorUrl: oembed.author_url,
    thumbnail: `https://i.ytimg.com/vi/${ytId}/maxresdefault.jpg`,
    fallbackThumb: `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`,
  };

  const newGoal = parseVideoIntoGoal(video, metadata);
  currentGoals.unshift(newGoal);
  saveGoals(currentGoals);

  return { isExisting: false, goal: newGoal };
}

module.exports = {
  loadGoals,
  saveGoals,
  searchYoutubeLive,
  autoSync,
  addCustomUrl,
  extractYoutubeId
};
