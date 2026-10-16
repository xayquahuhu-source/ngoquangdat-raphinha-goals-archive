document.addEventListener('DOMContentLoaded', () => {
  // Application State
  let allGoals = [];
  let currentFilter = 'all';
  let searchQuery = '';
  let currentSort = 'desc';

  // DOM Elements - Main
  const spotlightContainer = document.getElementById('spotlightContainer');
  const goalsGrid = document.getElementById('goalsGrid');
  const resultsCount = document.getElementById('resultsCount');
  const searchInput = document.getElementById('searchInput');
  const sortSelect = document.getElementById('sortSelect');
  const filterBtns = document.querySelectorAll('.filter-btn');

  // DOM Elements - Stats
  const statTotalCareer = document.getElementById('statTotalCareer');
  const statBarcaGoals = document.getElementById('statBarcaGoals');
  const statBrazilGoals = document.getElementById('statBrazilGoals');
  const statOtherClubs = document.getElementById('statOtherClubs');

  // DOM Elements - Modal
  const videoModal = document.getElementById('videoModal');
  const btnCloseModal = document.getElementById('btnCloseModal');
  const btnFloatingClose = document.getElementById('btnFloatingClose');
  const modalHeaderBadge = document.getElementById('modalHeaderBadge');
  const modalHeaderTitle = document.getElementById('modalHeaderTitle');
  const modalVideoContainer = document.getElementById('modalVideoContainer');
  const modalTitle = document.getElementById('modalTitle');
  const modalScoreline = document.getElementById('modalScoreline');
  const modalBadges = document.getElementById('modalBadges');
  const modalMetaGrid = document.getElementById('modalMetaGrid');
  const modalDescription = document.getElementById('modalDescription');
  const modalYoutubeLink = document.getElementById('modalYoutubeLink');
  const modalCopyBtn = document.getElementById('modalCopyBtn');

  // DOM Elements - Auto Sync / Add URL
  const btnAutoSync = document.getElementById('btnAutoSync');
  const btnOpenAddModal = document.getElementById('btnOpenAddModal');
  const addModal = document.getElementById('addModal');
  const btnCloseAddModal = document.getElementById('btnCloseAddModal');
  const btnCancelAdd = document.getElementById('btnCancelAdd');
  const addUrlForm = document.getElementById('addUrlForm');
  const inputYoutubeUrl = document.getElementById('inputYoutubeUrl');

  // Initialize
  fetchGoals();

  // Load Goals from Server
  async function fetchGoals() {
    try {
      resultsCount.textContent = 'Đang đồng bộ video chính gốc...';
      const res = await fetch('/api/goals');
      const data = await res.json();

      if (data.success && data.data) {
        allGoals = data.data;

        // Render Hero Spotlight with featured goal (Feyenoord 5-1 brace)
        const featured = allGoals.find(g => g.isHero) || allGoals.find(g => g.id === 'ucl-2026-feyenoord-brace') || allGoals.find(g => g.isFeatured) || allGoals[0];
        renderHeroSpotlight(featured);

        // Render stats
        if (statTotalCareer) statTotalCareer.textContent = '162';
        if (statBarcaGoals) statBarcaGoals.textContent = '89';
        if (statBrazilGoals) statBrazilGoals.textContent = '12';
        if (statOtherClubs) statOtherClubs.textContent = '61';

        applyFilters();
      }
    } catch (err) {
      console.error('Lỗi nạp goals:', err);
      resultsCount.textContent = 'Lỗi kết nối máy chủ.';
    }
  }

  // Render Hero Spotlight Card
  function renderHeroSpotlight(featuredGoal) {
    if (!featuredGoal) return;

    spotlightContainer.innerHTML = `
      <div class="hero-video-wrapper" onclick="window.playGoal('${featuredGoal.id}')">
        <img src="${featuredGoal.thumbnail}" alt="${featuredGoal.title}" onerror="this.src='https://i.ytimg.com/vi/${featuredGoal.youtubeId}/hqdefault.jpg'">
        <div class="play-overlay">
          <div class="play-btn-circle">
            <svg width="28" height="28" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
          </div>
        </div>
      </div>

      <div class="spotlight-info">
        <div class="badge-row">
          <span class="badge badge-featured">⭐ SIÊU PHẨM TIÊU BIỂU</span>
          <span class="badge badge-tournament">${featuredGoal.tournament}</span>
          <span class="badge badge-source">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
            ${featuredGoal.sourceChannel}
          </span>
        </div>

        <h2>${featuredGoal.title}</h2>

        <div class="match-scoreline">
          <span>⚽ ${featuredGoal.match}</span>
          <span style="color: var(--text-muted); font-size: 0.95rem;">(${featuredGoal.score})</span>
        </div>

        <div class="match-meta-list">
          <div>📅 Ngày: <strong>${featuredGoal.date}</strong></div>
          <div>⏱️ Phút ghi bàn: <strong>${featuredGoal.minute}</strong></div>
          <div>🏟️ Sân: <strong>${featuredGoal.stadium}</strong></div>
          <div>👟 Kiến tạo: <strong>${featuredGoal.assist || 'Tự kiến tạo'}</strong></div>
        </div>

        <p class="spotlight-desc">${featuredGoal.description}</p>

        <div style="display: flex; gap: 12px; margin-top: 4px;">
          <button class="btn btn-sync" onclick="window.playGoal('${featuredGoal.id}')">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
            Phát Video Ngay
          </button>
          <a href="${featuredGoal.sourceUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary">
            Kênh YouTube Gốc ↗
          </a>
        </div>
      </div>
    `;
  }

  // Helper to parse date to ISO string for precise chronological comparison
  function getGoalDateIso(goal) {
    if (goal.dateIso) return goal.dateIso;
    if (goal.date && goal.date.includes('/')) {
      const parts = goal.date.split('/');
      if (parts.length === 3) {
        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
    }
    if (goal.season && goal.season.includes('2026/27')) return '2026-09-01';
    if (goal.season && goal.season.includes('2025/26')) return '2026-05-25';
    if (goal.season && goal.season.includes('2024/25')) return '2024-12-01';
    return '2020-01-01';
  }

  // Filter & Search Logic
  function applyFilters() {
    let list = [...allGoals];

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(g =>
        g.title.toLowerCase().includes(q) ||
        g.match.toLowerCase().includes(q) ||
        g.opponent.toLowerCase().includes(q) ||
        g.tournament.toLowerCase().includes(q) ||
        g.description.toLowerCase().includes(q) ||
        g.minute.toLowerCase().includes(q)
      );
    }

    // Filter
    if (currentFilter !== 'all') {
      if (currentFilter === 'Hat-trick') {
        list = list.filter(g =>
          (g.goalType && g.goalType.toLowerCase().includes('hat-trick')) ||
          g.title.toLowerCase().includes('hat-trick')
        );
      } else if (currentFilter.includes('/')) {
        // Season filter like 2026/27 or 2025/26
        list = list.filter(g => g.season && g.season.includes(currentFilter));
      } else {
        list = list.filter(g =>
          (g.tournament && g.tournament.toLowerCase().includes(currentFilter.toLowerCase())) ||
          (g.club_or_country && g.club_or_country.toLowerCase().includes(currentFilter.toLowerCase())) ||
          (g.title && g.title.toLowerCase().includes(currentFilter.toLowerCase()))
        );
      }
    }

    // Strict chronological sort
    list.sort((a, b) => {
      const dateA = getGoalDateIso(a);
      const dateB = getGoalDateIso(b);
      if (currentSort === 'asc') {
        return dateA.localeCompare(dateB); // Quá khứ -> Hiện tại (2020 -> 2026)
      } else {
        return dateB.localeCompare(dateA); // Hiện tại -> Quá khứ (2026 -> 2020)
      }
    });

    renderGrid(list);
  }

  // Render Grid Cards
  function renderGrid(goals) {
    resultsCount.textContent = `Hiển thị ${goals.length} video thật chính gốc phát được ngay`;

    if (goals.length === 0) {
      goalsGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: var(--text-muted);">
          <div style="font-size: 3rem; margin-bottom: 12px;">🔍</div>
          <h3>Không tìm thấy bàn thắng phù hợp</h3>
          <p>Thử tìm từ khóa khác hoặc nhấn "Tất Cả Video".</p>
        </div>
      `;
      return;
    }

    goalsGrid.innerHTML = goals.map(goal => `
      <div class="goal-card" onclick="window.playGoal('${goal.id}')">
        <div class="card-media">
          <img src="${goal.thumbnail}" alt="${goal.title}" loading="lazy" onerror="this.src='https://i.ytimg.com/vi/${goal.youtubeId}/hqdefault.jpg'">
          <div class="card-play-btn">
            <div class="card-play-btn-circle">
              <svg width="22" height="22" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
            </div>
          </div>
          <span class="card-minute-tag">⏱️ ${goal.minute}</span>
        </div>

        <div class="card-body">
          <div class="card-header-meta">
            <span class="badge badge-tournament">${goal.tournament}</span>
            <span style="font-size: 0.78rem; color: var(--text-muted);">${goal.date}</span>
          </div>

          <h3 title="${goal.title}">${goal.title}</h3>

          <div class="card-match-line">
            <span>⚽ ${goal.match}</span>
          </div>

          <p class="card-desc">${goal.description}</p>

          <div class="card-footer-meta">
            <span class="verified-source">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
              ${goal.sourceChannel}
            </span>
            <span style="color: var(--barca-gold); font-weight: 700;">${goal.goalType}</span>
          </div>
        </div>
      </div>
    `).join('');
  }

  // Open Cinema Modal Video Player (100% Playable)
  window.playGoal = function(goalId) {
    const goal = allGoals.find(g => g.id === goalId);
    if (!goal) return;

    // Load iframe with autoplay immediately
    modalVideoContainer.innerHTML = `
      <iframe 
        src="https://www.youtube.com/embed/${goal.youtubeId}?autoplay=1&rel=0&modestbranding=1" 
        title="${goal.title}" 
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
        allowfullscreen>
      </iframe>
    `;

    if (modalHeaderBadge) modalHeaderBadge.textContent = goal.tournament;
    if (modalHeaderTitle) modalHeaderTitle.textContent = `${goal.match} • ${goal.title}`;

    modalTitle.textContent = goal.title;
    modalScoreline.innerHTML = `<span>⚽ ${goal.match}</span> <span style="color: var(--text-muted); font-size: 1rem;">(${goal.score})</span>`;
    
    modalBadges.innerHTML = `
      <span class="badge badge-tournament">${goal.tournament}</span>
      <span class="badge badge-source">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
        ${goal.sourceChannel}
      </span>
      <span class="badge" style="background: rgba(255,255,255,0.1); color: var(--barca-gold);">${goal.goalType}</span>
    `;

    modalMetaGrid.innerHTML = `
      <div>📅 <strong>Ngày thi đấu:</strong> ${goal.date}</div>
      <div>⏱️ <strong>Phút ghi bàn:</strong> ${goal.minute}</div>
      <div>🏟️ <strong>Sân vận động:</strong> ${goal.stadium}</div>
      <div>👟 <strong>Kiến tạo:</strong> ${goal.assist || 'Tự độc diễn'}</div>
      <div>⚔️ <strong>Đối thủ:</strong> ${goal.opponent}</div>
      <div>🏆 <strong>Mùa giải:</strong> ${goal.season}</div>
    `;

    modalDescription.textContent = goal.description;
    modalYoutubeLink.href = goal.sourceUrl;

    modalCopyBtn.onclick = () => {
      navigator.clipboard.writeText(goal.sourceUrl);
      modalCopyBtn.textContent = '✅ Đã Chép Link!';
      setTimeout(() => { modalCopyBtn.textContent = '📋 Sao Chép Link'; }, 2000);
    };

    // Scroll to top and lock background scroll
    videoModal.scrollTop = 0;
    document.body.style.overflow = 'hidden';
    videoModal.classList.add('active');
  };

  // Close Modal
  function closeModal() {
    videoModal.classList.remove('active');
    modalVideoContainer.innerHTML = ''; // Stop video audio
    document.body.style.overflow = ''; // Unlock background scroll
  }

  btnCloseModal.addEventListener('click', closeModal);
  if (btnFloatingClose) btnFloatingClose.addEventListener('click', closeModal);
  videoModal.addEventListener('click', (e) => {
    if (e.target === videoModal) closeModal();
  });

  // Filter Buttons
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.getAttribute('data-filter');
      applyFilters();
    });
  });

  // Search Input with Debounce
  let searchTimeout = null;
  searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      searchQuery = e.target.value;
      applyFilters();
    }, 200);
  });

  // Sort Selection Listener
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      currentSort = e.target.value;
      applyFilters();
    });
  }

  // Auto-Sync Button
  btnAutoSync.addEventListener('click', async () => {
    try {
      btnAutoSync.classList.add('spinning');
      btnAutoSync.disabled = true;
      btnAutoSync.querySelector('span').textContent = 'Đang tự động tải...';

      const res = await fetch('/api/sync', { method: 'POST' });
      const data = await res.json();

      if (data.success) {
        alert(`Đăng tải hoàn tất! Đã cập nhật ${data.addedCount} video mới (Tổng cộng: ${data.totalCount} video).`);
        await fetchGoals();
      } else {
        alert('Có lỗi khi đăng tải video từ YouTube: ' + (data.error || 'Vui lòng thử lại sau.'));
      }
    } catch (err) {
      alert('Không thể kết nối đến máy chủ tự động đăng tải video.');
    } finally {
      btnAutoSync.classList.remove('spinning');
      btnAutoSync.disabled = false;
      btnAutoSync.querySelector('span').textContent = 'Tự Động Đăng Tải Video';
    }
  });

  // Reset to Default Button
  const btnResetDefault = document.getElementById('btnResetDefault');
  if (btnResetDefault) {
    btnResetDefault.addEventListener('click', async () => {
      // 1. Reset search input
      searchInput.value = '';
      searchQuery = '';

      // 2. Reset filter pills to 'all'
      currentFilter = 'all';
      filterBtns.forEach(b => {
        if (b.getAttribute('data-filter') === 'all') {
          b.classList.add('active');
        } else {
          b.classList.remove('active');
        }
      });

      // 3. Reset sort order to 'desc'
      currentSort = 'desc';
      if (sortSelect) sortSelect.value = 'desc';

      // 4. Reset server database to default package
      try {
        await fetch('/api/reset-default', { method: 'POST' });
      } catch (e) {
        console.warn('Reset default API warning:', e);
      }

      // 5. Reload goals & hero spotlight
      await fetchGoals();

      // 6. Smooth scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // Visual feedback on button
      const span = btnResetDefault.querySelector('span');
      const oldText = span ? span.textContent : '';
      if (span) span.textContent = 'Đã Đặt Lại!';
      setTimeout(() => {
        if (span) span.textContent = oldText;
      }, 1500);
    });
  }

  // Open & Close Add Modal
  btnOpenAddModal.addEventListener('click', () => addModal.classList.add('active'));
  btnCloseAddModal.addEventListener('click', () => addModal.classList.remove('active'));
  btnCancelAdd.addEventListener('click', () => addModal.classList.remove('active'));
  addModal.addEventListener('click', (e) => {
    if (e.target === addModal) addModal.classList.remove('active');
  });

  // Handle Add Form Submit
  addUrlForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const url = inputYoutubeUrl.value.trim();
    if (!url) return;

    try {
      const btnSubmit = document.getElementById('btnSubmitAdd');
      btnSubmit.disabled = true;
      btnSubmit.textContent = 'Đang kiểm tra & nạp...';

      const res = await fetch('/api/add-by-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });

      const data = await res.json();
      if (data.success) {
        addModal.classList.remove('active');
        inputYoutubeUrl.value = '';
        await fetchGoals();
        alert(data.isExisting ? 'Video này đã có trong danh sách!' : 'Đã nạp video bàn thắng chính gốc thành công!');
      } else {
        alert('Lỗi: ' + (data.error || 'Không thể nạp link này.'));
      }
    } catch (err) {
      alert('Lỗi kết nối máy chủ khi nạp video.');
    } finally {
      const btnSubmit = document.getElementById('btnSubmitAdd');
      btnSubmit.disabled = false;
      btnSubmit.textContent = 'Nạp Video';
    }
  });

  // Keyboard Shortcuts: ESC to close modals
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal();
      addModal.classList.remove('active');
    }
  });
});
