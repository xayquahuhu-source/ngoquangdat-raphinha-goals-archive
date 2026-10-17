const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const {
  loadGoals,
  saveGoals,
  searchYoutubeLive,
  autoSync,
  addCustomUrl
} = require('./services/youtubeAggregator');
const { handleChat } = require('./services/aiAssistant');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Helper to load Career Archive
function loadCareerArchive() {
  const archivePath = path.join(__dirname, 'data', 'career_archive.json');
  if (fs.existsSync(archivePath)) {
    return JSON.parse(fs.readFileSync(archivePath, 'utf-8'));
  }
  return null;
}

// API: Lấy toàn bộ tổng quan sự nghiệp (Career totals, Club breakdown, Season stats, Sources & Audit)
app.get('/api/career', (req, res) => {
  try {
    const data = loadCareerArchive();
    if (!data) {
      return res.status(404).json({ success: false, error: 'Chưa tìm thấy career_archive.json' });
    }
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API: Lấy danh mục sự kiện bàn thắng (Events) với bộ lọc linh hoạt
app.get('/api/events', (req, res) => {
  try {
    const archive = loadCareerArchive();
    if (!archive) {
      return res.status(404).json({ success: false, error: 'Chưa tìm thấy career_archive.json' });
    }

    let events = [...archive.events];
    const { club, season, competition, status, is_penalty, q } = req.query;

    if (club && club !== 'all') {
      const c = club.toLowerCase();
      events = events.filter(e => {
        const target = (e.club_or_country + ' ' + (e.team || '')).toLowerCase();
        if ((c === 'rennes' || c === 'rennais') && (target.includes('rennais') || target.includes('rennes'))) return true;
        if ((c === 'vitoria' || c === 'vitória') && (target.includes('vitoria') || target.includes('vitória'))) return true;
        if ((c === 'sporting') && target.includes('sporting')) return true;
        return target.includes(c);
      });
    }

    if (season && season !== 'all') {
      events = events.filter(e => e.season.includes(season));
    }

    if (competition && competition !== 'all') {
      events = events.filter(e => e.competition.toLowerCase().includes(competition.toLowerCase()));
    }

    if (status && status !== 'all') {
      events = events.filter(e => e.status === status);
    }

    if (is_penalty === 'true') {
      events = events.filter(e => e.isPenalty);
    }

    if (q) {
      const query = q.toLowerCase();
      events = events.filter(e =>
        e.opponent.toLowerCase().includes(query) ||
        e.competition.toLowerCase().includes(query) ||
        e.score.toLowerCase().includes(query) ||
        (e.minute && e.minute.toLowerCase().includes(query)) ||
        (e.matchSummary && e.matchSummary.toLowerCase().includes(query)) ||
        (e.sourceName && e.sourceName.toLowerCase().includes(query))
      );
    }

    res.json({
      success: true,
      count: events.length,
      total_in_archive: archive.events.length,
      data: events
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API: Báo cáo kiểm định dữ liệu (Audit Report)
app.get('/api/audit', (req, res) => {
  try {
    const archive = loadCareerArchive();
    res.json({
      success: true,
      data: archive ? archive.data_audit : null
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API: Lấy danh sách bàn thắng (kèm bộ lọc & tìm kiếm) - Tương thích ngược
app.get('/api/goals', (req, res) => {
  try {
    let goals = loadGoals();
    const { tournament, season, goalType, q, sort } = req.query;

    if (tournament && tournament !== 'all') {
      goals = goals.filter(g => g.tournament.toLowerCase().includes(tournament.toLowerCase()));
    }

    if (season && season !== 'all') {
      goals = goals.filter(g => g.season.includes(season));
    }

    if (goalType && goalType !== 'all') {
      goals = goals.filter(g => g.goalType.toLowerCase().includes(goalType.toLowerCase()));
    }

    if (q) {
      const query = q.toLowerCase();
      goals = goals.filter(g =>
        g.title.toLowerCase().includes(query) ||
        g.match.toLowerCase().includes(query) ||
        g.opponent.toLowerCase().includes(query) ||
        g.tournament.toLowerCase().includes(query) ||
        g.description.toLowerCase().includes(query)
      );
    }

    if (sort === 'featured') {
      goals.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
    }

    res.json({ success: true, count: goals.length, data: goals });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API: Thống kê số liệu
app.get('/api/stats', (req, res) => {
  try {
    const archive = loadCareerArchive();
    const goals = loadGoals();

    res.json({
      success: true,
      data: {
        career: archive ? archive.career_totals : null,
        clubBreakdown: archive ? archive.club_goals_by_team : [],
        barcelonaSeasons: archive ? archive.barcelona_goals_by_season : [],
        verifiedVideosCount: archive ? archive.events.filter(e => e.status === 'embeddable_video').length : goals.length,
        officialSourcesCount: archive ? archive.events.filter(e => e.status === 'official_source_link').length : 0,
        researchQueueCount: archive ? archive.events.filter(e => e.status === 'clip_not_found').length : 0,
        totalEventsIndexed: archive ? archive.events.length : goals.length
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API: Tự động đồng bộ và cào video bàn thắng mới từ YouTube
app.post('/api/sync', async (req, res) => {
  try {
    const result = await autoSync();
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API: Tìm kiếm trực tiếp video từ YouTube
app.get('/api/search-youtube', async (req, res) => {
  try {
    const query = req.query.q || 'FC Barcelona Raphinha goal';
    const results = await searchYoutubeLive(query, 6);
    res.json({ success: true, data: results });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API: Thêm bàn thắng bằng link YouTube hoặc mã video
app.post('/api/add-by-url', async (req, res) => {
  try {
    const { url, metadata } = req.body;
    if (!url) {
      return res.status(400).json({ success: false, error: 'Thiếu link YouTube!' });
    }
    const result = await addCustomUrl(url, metadata || {});
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// API: Đặt lại danh sách dữ liệu về mặc định ban đầu
app.post('/api/reset-default', (req, res) => {
  try {
    const defaultPath = path.join(__dirname, 'data', 'goals_default.json');
    const dbPath = path.join(__dirname, 'data', 'goals.json');
    if (fs.existsSync(defaultPath)) {
      fs.copyFileSync(defaultPath, dbPath);
      const goals = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
      return res.json({ success: true, count: goals.length, data: goals });
    }
    res.json({ success: true, message: 'Đã sẵn sàng' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API: Kiểm tra trạng thái AI và danh sách mô hình (4.0 Argon -> 3.8 Flash -> 3.5 Lite)
app.get('/api/ai-status', (req, res) => {
  const aiConfig = require('./config/aiConfig');
  res.json({
    success: true,
    isKeyConfigured: aiConfig.isKeyConfigured(),
    primaryModel: aiConfig.primaryModel,
    modelCascade: aiConfig.modelCascade,
    message: aiConfig.isKeyConfigured()
      ? `Đã kết nối Google Gemini API. Ưu tiên mô hình: ${aiConfig.primaryModel}`
      : 'Chưa cấu hình GEMINI_API_KEY trong file .env trên server.'
  });
});

// API: Trợ Lý Chuyên Gia AI Raphinha Pro (Gemini Pro Engine)
app.post('/api/ai-chat', async (req, res) => {
  try {
    const { message, history, userImage } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, error: 'Tin nhắn không được để trống!' });
    }
    const result = await handleChat({ message, history, userImage });
    res.json(result);
  } catch (err) {
    console.error('Lỗi API /api/ai-chat:', err);
    res.status(500).json({ success: false, error: err.message || 'Lỗi xử lý AI' });
  }
});

// Fallback index
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 Raphinha Career Goals Archive đang chạy tại: http://localhost:${PORT}`);
  console.log(`⚽ Cập nhật dữ liệu chính xác đến 16/10/2026`);
  console.log(`=======================================================`);
});
