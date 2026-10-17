/**
 * Raphinha AI Pro - Advanced Multi-Domain Frontend Controller
 * Kết nối Google Gemini thật với chuỗi ưu tiên mô hình: 4.0 Argon -> 3.8 Flash -> 3.5 Lite.
 * Bảo mật API Key tuyệt đối ở Server (.env), lưu lịch sử phiên, hỗ trợ tạo ảnh & tìm ảnh thực tế.
 */

(function() {
  const STORAGE_KEY = 'raphinha_ai_chat_session_v3';
  let isOpen = false;
  let chatHistory = [];
  let isSending = false;
  let pendingUserImage = null; // { name, mimeType, data, dataUrl }

  // Khởi tạo giao diện
  function init() {
    createAiElements();
    loadSessionHistory();
  }

  function createAiElements() {
    // 1. Floating Circular Button với Logo FC Barcelona chính thức
    const btn = document.createElement('button');
    btn.id = 'aiFloatingBtn';
    btn.className = 'ai-floating-btn';
    btn.title = 'Trợ lý AI Đa Năng Raphinha Pro (Gemini 4.0 Argon / 3.8 / 3.5) ✨';
    btn.setAttribute('aria-label', 'Mở trợ lý AI');
    btn.innerHTML = `
      <div class="ai-btn-inner">
        <img src="/images/barcelona-crest.svg" alt="FC Barcelona AI" class="ai-btn-crest">
        <span class="ai-btn-badge">AI</span>
      </div>
      <span class="ai-pulse-ring"></span>
    `;

    // 2. Khung Chat Popup
    const chatModal = document.createElement('div');
    chatModal.id = 'aiChatContainer';
    chatModal.className = 'ai-chat-container';
    chatModal.innerHTML = `
      <!-- Header -->
      <div class="ai-chat-header">
        <div class="ai-header-left">
          <div class="ai-avatar-wrap">
            <img src="/images/barcelona-crest.svg" alt="Barça" class="ai-avatar-crest">
            <span class="ai-avatar-dot"></span>
          </div>
          <div>
            <div class="ai-header-title">
              <span>Raphinha AI Pro</span>
              <span class="badge-gemini" id="aiModelBadge" title="Mô hình hoạt động thực tế: Gemini 3.8 Flash">GEMINI 3.8 FLASH</span>
            </div>
            <div class="ai-header-sub">Trợ lý trí tuệ nhân tạo đa năng thực thụ</div>
          </div>
        </div>
        
        <div class="ai-header-actions">
          <button id="btnAiSettings" class="ai-action-btn" title="Thông tin mô hình & chẩn đoán kết nối">ℹ️</button>
          <button id="btnAiClear" class="ai-action-btn" title="Xóa toàn bộ cuộc trò chuyện">🗑️</button>
          <button id="btnAiClose" class="ai-action-btn" title="Đóng chat">✕</button>
        </div>
      </div>

      <!-- Quick Suggestion Pills -->
      <div class="ai-suggestions-row" id="aiSuggestionsRow">
        <button class="ai-sug-pill" data-prompt="Tổng số bàn thắng sự nghiệp của Raphinha?">⚽ 162 bàn sự nghiệp</button>
        <button class="ai-sug-pill" data-prompt="Chỉ tôi cách giải bài toán đạo hàm từng bước">📐 Giải toán đạo hàm</button>
        <button class="ai-sug-pill" data-prompt="Viết một chương trình C++ cho người mới bắt đầu">💻 Viết code C++</button>
        <button class="ai-sug-pill" data-prompt="Tạo một poster bóng đá Raphinha phong cách Barcelona ấn tượng">🎨 Tạo poster bóng đá</button>
        <button class="ai-sug-pill" data-prompt="Tìm ảnh Lionel Messi">📸 Tìm ảnh Messi thật</button>
        <button class="ai-sug-pill" data-prompt="Thông tin bóng đá mới nhất hôm nay">🌐 Tin bóng đá mới nhất</button>
      </div>

      <!-- Messages Body -->
      <div class="ai-chat-body" id="aiChatBody">
        <div class="ai-msg ai-msg-bot" id="aiWelcomeMsg">
          <div class="ai-bubble">
            <p>👋 Xin chào! Tôi là <strong>Raphinha AI Pro ✨</strong>, trợ lý AI thực thụ kết nối trực tiếp mô hình <strong>Google Gemini 3.8 Flash</strong> chính thức.</p>
            <p style="margin-top: 6px;">Tôi có thể trao đổi tự nhiên với bạn về mọi chủ đề:</p>
            <ul>
              <li>⚽ <strong>Bóng đá:</strong> Chi tiết 162 bàn thắng chính thức của Raphinha, video bàn thắng và tin tức thời gian thực.</li>
              <li>📐 <strong>Toán học:</strong> Hướng dẫn giải đạo hàm, tính toán công thức trực quan, dễ hiểu.</li>
              <li>💻 <strong>Lập trình:</strong> Viết code C++, Python, JavaScript giải thích chi tiết, kèm nút sao chép code.</li>
              <li>🎨 <strong>Tạo ảnh & Tìm ảnh thật:</strong> Phân biệt ảnh nghệ thuật sáng tạo và ảnh tư liệu thực tế của các cầu thủ nổi tiếng.</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Image Upload Preview Chip (khi người dùng đính kèm ảnh) -->
      <div id="aiUploadPreviewRow" class="ai-upload-preview-row" style="display: none;">
        <div class="ai-upload-chip">
          <img id="aiUploadThumb" src="" alt="preview">
          <span id="aiUploadName">image.jpg</span>
          <button type="button" id="btnRemoveUpload" class="btn-remove-upload" title="Bỏ ảnh">&times;</button>
        </div>
      </div>

      <!-- Input Footer -->
      <form class="ai-chat-footer" id="aiChatForm">
        <label for="aiImageInput" class="ai-btn-attach" title="Đính kèm hình ảnh để phân tích">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
        </label>
        <input type="file" id="aiImageInput" accept="image/*" style="display: none;">

        <input 
          type="text" 
          id="aiChatInput" 
          class="ai-input" 
          placeholder="Hỏi bất kỳ điều gì (bóng đá, toán, code, tạo ảnh...)" 
          autocomplete="off"
          required
        >
        <button type="submit" id="btnAiSend" class="ai-btn-send" title="Gửi tin nhắn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </form>
    `;

    document.body.appendChild(btn);
    document.body.appendChild(chatModal);

    // Modals
    createStatusModal();
    createLightboxModal();

    // Event Listeners
    btn.addEventListener('click', toggleChat);
    document.getElementById('btnAiClose').addEventListener('click', closeChat);
    document.getElementById('btnAiClear').addEventListener('click', clearChat);
    document.getElementById('btnAiSettings').addEventListener('click', openStatusModal);

    const form = document.getElementById('aiChatForm');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      handleUserSubmit();
    });

    // Image upload
    const fileInput = document.getElementById('aiImageInput');
    fileInput.addEventListener('change', handleFileSelect);
    document.getElementById('btnRemoveUpload').addEventListener('click', clearUploadedImage);

    // Suggestion pills
    const pills = document.querySelectorAll('.ai-sug-pill');
    pills.forEach(pill => {
      pill.addEventListener('click', () => {
        const prompt = pill.getAttribute('data-prompt');
        if (prompt) {
          document.getElementById('aiChatInput').value = prompt;
          handleUserSubmit();
        }
      });
    });

    if (window.location.search.includes('ai=open')) {
      openChat();
    }
  }

  function handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chỉ chọn tệp hình ảnh!');
      return;
    }

    const reader = new FileReader();
    reader.onload = function(event) {
      const base64Data = event.target.result.split(',')[1];
      pendingUserImage = {
        name: file.name,
        mimeType: file.type,
        data: base64Data,
        dataUrl: event.target.result
      };

      const previewRow = document.getElementById('aiUploadPreviewRow');
      const thumb = document.getElementById('aiUploadThumb');
      const nameEl = document.getElementById('aiUploadName');

      thumb.src = event.target.result;
      nameEl.textContent = file.name.length > 20 ? file.name.substring(0, 17) + '...' : file.name;
      previewRow.style.display = 'flex';
    };
    reader.readAsDataURL(file);
  }

  function clearUploadedImage() {
    pendingUserImage = null;
    document.getElementById('aiImageInput').value = '';
    document.getElementById('aiUploadPreviewRow').style.display = 'none';
  }

  function createStatusModal() {
    const modal = document.createElement('div');
    modal.id = 'aiStatusModal';
    modal.className = 'ai-settings-modal';
    modal.innerHTML = `
      <div class="ai-settings-card">
        <h3>ℹ️ Thông Tin Trợ Lý AI & Mô Hình</h3>
        <div id="aiStatusContent" style="font-size: 0.85rem; color: #cbd5e1; margin: 12px 0 16px; line-height: 1.6;">
          <p>Đang kiểm tra kết nối với server...</p>
        </div>
        <div class="ai-settings-btns">
          <button type="button" id="btnCloseStatus" class="btn btn-secondary">Đóng</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('btnCloseStatus').addEventListener('click', () => {
      modal.classList.remove('active');
    });
  }

  async function openStatusModal() {
    const modal = document.getElementById('aiStatusModal');
    const content = document.getElementById('aiStatusContent');
    modal.classList.add('active');

    try {
      const res = await fetch('/api/ai-status');
      const data = await res.json();

      let cascadeListHtml = '';
      if (data.modelCascade && Array.isArray(data.modelCascade)) {
        cascadeListHtml = data.modelCascade.map((m, idx) => `<li><strong>Ưu tiên ${idx + 1}:</strong> <code>${m}</code></li>`).join('');
      }

      content.innerHTML = `
        <div style="background: rgba(255,255,255,0.04); padding: 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); margin-bottom: 12px;">
          <div style="margin-bottom: 6px;">
            <strong>Trạng thái kết nối Server:</strong> 
            ${data.isKeyConfigured 
              ? '<span style="color: #10b981; font-weight: 700;">🟢 Đã cấu hình GEMINI_API_KEY</span>' 
              : '<span style="color: #ef4444; font-weight: 700;">🔴 Chưa cấu hình GEMINI_API_KEY trong .env</span>'}
          </div>
          <div><strong>Mô hình kích hoạt chính:</strong> <span style="color: #edbb00; font-weight: 700;">${data.primaryModel || 'gemini-4.0-argon'}</span></div>
        </div>

        <div style="margin-bottom: 12px;">
          <strong>Chuỗi ưu tiên tự động (Cascade):</strong>
          <ul style="padding-left: 20px; margin: 6px 0;">
            ${cascadeListHtml || '<li>4.0 Argon -> 3.8 Flash -> 3.5 Lite</li>'}
          </ul>
        </div>

        <p style="font-size: 0.8rem; color: #94a3b8;">
          🔒 <strong>Bảo mật:</strong> API Key được quản lý an toàn tuyệt đối ở server trong biến môi trường <code>GEMINI_API_KEY</code>, không bao giờ lộ ra trình duyệt.
        </p>
      `;
    } catch (e) {
      content.innerHTML = `<p style="color: #ef4444;">Không thể lấy trạng thái server: ${e.message}</p>`;
    }
  }

  function createLightboxModal() {
    const lb = document.createElement('div');
    lb.id = 'aiLightboxModal';
    lb.className = 'ai-lightbox-modal';
    lb.innerHTML = `
      <div class="ai-lightbox-content">
        <button id="btnAiLightboxClose" class="ai-lightbox-close" title="Đóng (ESC)">&times;</button>
        <img id="aiLightboxImg" src="" alt="AI preview">
        <div class="ai-lightbox-footer">
          <div>
            <div id="aiLightboxTitle" style="font-weight: 700; color: #fff;"></div>
            <div id="aiLightboxCaption" style="font-size: 0.78rem; color: #94a3b8; margin-top: 2px;"></div>
          </div>
          <a id="aiLightboxDownload" href="#" download="ai_image.jpg" class="btn btn-sync">⬇️ Tải Ảnh Về Máy</a>
        </div>
      </div>
    `;
    document.body.appendChild(lb);

    document.getElementById('btnAiLightboxClose').addEventListener('click', () => {
      lb.classList.remove('active');
    });
    lb.addEventListener('click', (e) => {
      if (e.target === lb) lb.classList.remove('active');
    });
  }

  window.openAiLightbox = function(imgUrl, title, downloadName, caption = '') {
    const lb = document.getElementById('aiLightboxModal');
    const img = document.getElementById('aiLightboxImg');
    const titleEl = document.getElementById('aiLightboxTitle');
    const captionEl = document.getElementById('aiLightboxCaption');
    const downloadBtn = document.getElementById('aiLightboxDownload');

    img.src = imgUrl;
    titleEl.textContent = title || 'Bản xem trước hình ảnh';
    captionEl.textContent = caption || '';
    downloadBtn.href = imgUrl;
    downloadBtn.download = downloadName || 'image.jpg';
    lb.classList.add('active');
  };

  window.copyCodeToClipboard = function(btn) {
    const codeBlock = btn.closest('.ai-code-wrapper').querySelector('code');
    if (!codeBlock) return;
    navigator.clipboard.writeText(codeBlock.innerText).then(() => {
      const originalText = btn.innerHTML;
      btn.innerHTML = '✅ Đã sao chép!';
      btn.style.color = '#10b981';
      setTimeout(() => {
        btn.innerHTML = originalText;
        btn.style.color = '';
      }, 2000);
    });
  };

  function toggleChat() {
    isOpen = !isOpen;
    const btn = document.getElementById('aiFloatingBtn');
    const modal = document.getElementById('aiChatContainer');

    if (isOpen) {
      modal.classList.add('active');
      btn.classList.add('active');
      document.getElementById('aiChatInput').focus();
    } else {
      modal.classList.remove('active');
      btn.classList.remove('active');
    }
  }

  function openChat() {
    isOpen = true;
    document.getElementById('aiChatContainer').classList.add('active');
    document.getElementById('aiFloatingBtn').classList.add('active');
  }

  function closeChat() {
    isOpen = false;
    document.getElementById('aiChatContainer').classList.remove('active');
    document.getElementById('aiFloatingBtn').classList.remove('active');
  }

  function clearChat() {
    if (confirm('Bạn có chắc muốn xóa toàn bộ lịch sử trò chuyện phiên này?')) {
      chatHistory = [];
      sessionStorage.removeItem(STORAGE_KEY);
      const chatBody = document.getElementById('aiChatBody');
      chatBody.innerHTML = `
        <div class="ai-msg ai-msg-bot">
          <div class="ai-bubble">
            <p>🔄 Cuộc trò chuyện đã được làm mới. Hãy hỏi tôi bất kỳ điều gì!</p>
          </div>
        </div>
      `;
    }
  }

  // Quản lý lưu trữ phiên (Session Persistence)
  function saveSessionHistory() {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(chatHistory));
    } catch (e) {
      console.warn('Lỗi lưu session history:', e);
    }
  }

  function loadSessionHistory() {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const history = JSON.parse(raw);
      if (Array.isArray(history) && history.length > 0) {
        chatHistory = history;
        const chatBody = document.getElementById('aiChatBody');
        chatBody.innerHTML = ''; // Xóa welcome message nếu đã có lịch sử

        chatHistory.forEach(item => {
          appendMessage(item.role === 'user' ? 'user' : 'bot', item.content, {
            userImage: item.userImage,
            media: item.media,
            sources: item.sources
          }, false); // false = không push lại vào chatHistory
        });
      }
    } catch (e) {
      console.warn('Lỗi đọc session history:', e);
    }
  }

  function cleanLatexMath(str) {
    if (!str) return '';
    let s = str;
    // Xử lý phân số \frac{A}{B} lồng nhau
    while (/\\frac\{([^{}]+)\}\{([^{}]+)\}/.test(s)) {
      s = s.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '($1 / $2)');
    }
    s = s.replace(/\\mathbf\{([^{}]+)\}/g, '<strong>$1</strong>');
    s = s.replace(/\\text\{([^{}]+)\}/g, '$1');
    s = s.replace(/\\left\(/g, '(').replace(/\\right\)/g, ')');
    s = s.replace(/\\left\[/g, '[').replace(/\\right\]/g, ']');
    s = s.replace(/\\approx/g, '≈');
    s = s.replace(/\\times/g, '×');
    s = s.replace(/\\cdot/g, '·');
    s = s.replace(/\\div/g, '÷');
    s = s.replace(/\\le/g, '≤');
    s = s.replace(/\\ge/g, '≥');
    s = s.replace(/\\ne/g, '≠');
    s = s.replace(/\\pm/g, '±');
    s = s.replace(/\\sqrt\{([^{}]+)\}/g, '√($1)');
    s = s.replace(/\$\$/g, '');
    s = s.replace(/\$/g, '');
    return s.trim();
  }

  function renderMathFormula(mathStr, isBlock = false) {
    const cleanFormula = mathStr.trim();
    if (typeof window !== 'undefined' && window.katex && typeof window.katex.renderToString === 'function') {
      try {
        return window.katex.renderToString(cleanFormula, {
          displayMode: isBlock,
          throwOnError: false
        });
      } catch (e) {
        // Fallback sang định dạng text dễ đọc nếu KaTeX lỗi
      }
    }
    const readable = cleanLatexMath(cleanFormula);
    return isBlock ? `<div class="ai-math-block">${readable}</div>` : `<span class="ai-math-inline">${readable}</span>`;
  }

  function formatMarkdown(text) {
    if (!text) return '';
    let out = text;
    const codeBlocks = [];

    // 1. Lưu và bảo vệ các khối Code đa dòng
    out = out.replace(/```([a-zA-Z0-9_+-]*)\n([\s\S]*?)```/g, (match, lang, code) => {
      const idx = codeBlocks.length;
      const displayLang = (lang || 'code').toUpperCase();
      const escapedCode = code
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      codeBlocks.push(`
        <div class="ai-code-wrapper">
          <div class="ai-code-header">
            <span class="ai-code-lang">${displayLang}</span>
            <button type="button" class="ai-code-copy-btn" onclick="window.copyCodeToClipboard(this)">
              📋 Sao chép
            </button>
          </div>
          <pre class="ai-code-pre"><code>${escapedCode.trim()}</code></pre>
        </div>
      `);
      return `__CODE_BLOCK_${idx}__`;
    });

    // 2. Lưu và bảo vệ Inline Code `...`
    const inlineCodes = [];
    out = out.replace(/`([^`]+)`/g, (match, code) => {
      const idx = inlineCodes.length;
      inlineCodes.push(`<code class="ai-inline-code">${code}</code>`);
      return `__INLINE_CODE_${idx}__`;
    });

    // 3. Xử lý công thức Toán học KaTeX / LaTeX ($$...$$ và $...$)
    // Khối toán độc lập $$...$$
    out = out.replace(/\$\$([\s\S]*?)\$\$/g, (match, formula) => {
      return renderMathFormula(formula, true);
    });

    // Toán nội dòng $...$ (loại trừ trường hợp số tiền tệ $100)
    out = out.replace(/\$([^\$\n]+?)\$/g, (match, formula) => {
      if (/^\s*\d+([.,]\d+)?\s*$/.test(formula)) return match;
      return renderMathFormula(formula, false);
    });

    // Làm sạch các thẻ LaTeX rời rạc nếu còn sót
    out = cleanLatexMath(out);

    // 4. Đậm và Nghiêng
    out = out.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    out = out.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // 5. Headings
    out = out.replace(/^### (.*$)/gim, '<h4 class="ai-h4">$1</h4>');
    out = out.replace(/^## (.*$)/gim, '<h3 class="ai-h3">$1</h3>');

    // 6. Bullet Lists
    out = out.replace(/^\* (.*$)/gim, '<li>$1</li>');
    out = out.replace(/(<li>[\s\S]*?<\/li>)/g, '<ul>$1</ul>');

    // 7. Nút video [GOAL:id]
    out = out.replace(/\[GOAL:(.*?)\]/g, (match, goalId) => {
      const id = goalId.trim();
      return `<button class="ai-goal-play-btn" onclick="window.playGoal('${id}')">▶️ Xem Video Bàn Thắng #${id}</button>`;
    });

    // 8. Xuống dòng
    out = out.replace(/\n\n/g, '<br><br>').replace(/\n/g, '<br>');

    // 9. Khôi phục lại Inline Code và Code Blocks
    inlineCodes.forEach((code, idx) => {
      out = out.replace(`__INLINE_CODE_${idx}__`, code);
    });
    codeBlocks.forEach((block, idx) => {
      out = out.replace(`__CODE_BLOCK_${idx}__`, block);
    });

    return out;
  }

  function getThinkingStatusText(query) {
    const q = query.toLowerCase();
    if (/(tạo ảnh|vẽ|poster|thiết kế)/i.test(q)) return '🎨 Đang phác thảo và tạo ảnh AI...';
    if (/(messi|ronaldo|tìm ảnh|ảnh thật|cầu thủ)/i.test(q)) return '🔍 Đang tìm kiếm ảnh tư liệu thực tế...';
    if (/(tin tức|mới nhất|thông tin bóng đá)/i.test(q)) return '🌐 Đang tra cứu thông tin trực tuyến...';
    if (/(đạo hàm|toán|tích phân|giải)/i.test(q)) return '📐 Đang suy luận và giải toán từng bước...';
    if (/(c\+\+|code|viết chương trình|lập trình)/i.test(q)) return '💻 Đang biên soạn mã nguồn...';
    return '💭 Gemini đang suy nghĩ...';
  }

  async function handleUserSubmit() {
    const input = document.getElementById('aiChatInput');
    const message = input.value.trim();
    if ((!message && !pendingUserImage) || isSending) return;

    input.value = '';
    isSending = true;

    const userImgPayload = pendingUserImage ? { mimeType: pendingUserImage.mimeType, data: pendingUserImage.data } : null;
    const userImgDataUrl = pendingUserImage ? pendingUserImage.dataUrl : null;
    clearUploadedImage();

    // 1. Render tin nhắn người dùng
    appendMessage('user', message, { userImage: userImgDataUrl }, true);

    // 2. Typing indicator
    const statusText = getThinkingStatusText(message);
    const typingId = appendTypingIndicator(statusText);

    try {
      // Gửi toàn bộ lịch sử ngữ cảnh
      const res = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: message,
          history: chatHistory.map(h => ({ role: h.role, content: h.content })),
          userImage: userImgPayload
        })
      });

      const data = await res.json();
      removeTypingIndicator(typingId);

      if (data.success && data.reply) {
        // Cập nhật nhãn model nếu có
        if (data.modelUsed) {
          const badge = document.getElementById('aiModelBadge');
          if (badge) badge.textContent = data.modelUsed.toUpperCase().replace('GEMINI-', '');
        }

        appendMessage('bot', data.reply, { media: data.media, sources: data.sources }, true);
      } else if (data.errorCode === 'API_KEY_REQUIRED') {
        // Thông báo cấu hình API Key trung thực (Không giả lập)
        const errorHtml = `
          <div style="background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.4); padding: 12px; border-radius: 8px;">
            <div style="font-weight: 700; color: #f87171; margin-bottom: 6px;">⚠️ Chưa cấu hình GEMINI_API_KEY tại Server (.env)</div>
            <p style="font-size: 0.83rem; margin: 0 0 8px 0; color: #cbd5e1;">
              Hệ thống không sử dụng kịch bản giả lập mà kết nối trực tiếp mô hình Google Gemini thật (<strong>4.0 Argon → 3.8 Flash → 3.5 Lite</strong>).
            </p>
            <div style="font-size: 0.8rem; background: rgba(0,0,0,0.3); padding: 8px; border-radius: 6px; font-family: monospace; color: #fef08a;">
              1. Mở file .env trên server<br>
              2. Điền: GEMINI_API_KEY=AIzaSy...<br>
              3. Khởi động lại: node server.js
            </div>
            <div style="margin-top: 8px; font-size: 0.8rem;">
              👉 Lấy API key miễn phí tại: <a href="https://aistudio.google.com/app/apikey" target="_blank" style="color: #38bdf8; text-decoration: underline;">Google AI Studio</a>
            </div>
          </div>
        `;
        appendRawBotMessage(errorHtml);
      } else {
        appendMessage('bot', `⚠️ Lỗi xử lý từ mô hình AI: ${data.error || 'Vui lòng kiểm tra lại kết nối mạng.'}`, {}, true);
      }
    } catch (err) {
      removeTypingIndicator(typingId);
      appendMessage('bot', '⚠️ Không thể kết nối với server AI. Vui lòng kiểm tra server đang chạy tại cổng 3000.', {}, true);
    } finally {
      isSending = false;
      const chatBody = document.getElementById('aiChatBody');
      chatBody.scrollTop = chatBody.scrollHeight;
    }
  }

  function appendMessage(sender, text, extra = {}, shouldSave = true) {
    const chatBody = document.getElementById('aiChatBody');
    const msgDiv = document.createElement('div');
    msgDiv.className = `ai-msg ${sender === 'user' ? 'ai-msg-user' : 'ai-msg-bot'}`;

    const bubble = document.createElement('div');
    bubble.className = 'ai-bubble';

    // Ảnh người dùng gửi
    if (extra.userImage) {
      const userImgWrap = document.createElement('div');
      userImgWrap.className = 'ai-user-img-attachment';
      userImgWrap.innerHTML = `<img src="${extra.userImage}" alt="User upload" onclick="window.openAiLightbox('${extra.userImage}', 'Ảnh bạn đã tải lên')">`;
      bubble.appendChild(userImgWrap);
    }

    // Nội dung văn bản Markdown
    if (text) {
      const textDiv = document.createElement('div');
      textDiv.innerHTML = formatMarkdown(text);
      bubble.appendChild(textDiv);
    }

    // Media do AI cung cấp (Ảnh sáng tạo AI hoặc Ảnh tư liệu thực tế)
    if (extra.media && Array.isArray(extra.media)) {
      extra.media.forEach(m => {
        if (m.type === 'image') {
          const mediaCard = document.createElement('div');
          mediaCard.className = 'ai-media-card';
          const isReal = Boolean(m.isRealPhoto);
          const badgeHtml = isReal 
            ? `<span style="position: absolute; top: 8px; left: 8px; background: rgba(0, 77, 152, 0.85); color: #fff; font-size: 0.68rem; font-weight: 700; padding: 2px 8px; border-radius: 12px; border: 1px solid rgba(56, 189, 248, 0.5); z-index: 2;">📸 Ảnh Tư Liệu Thực Tế</span>`
            : `<span style="position: absolute; top: 8px; left: 8px; background: rgba(165, 0, 68, 0.85); color: #fff; font-size: 0.68rem; font-weight: 700; padding: 2px 8px; border-radius: 12px; border: 1px solid rgba(244, 63, 94, 0.5); z-index: 2;">🎨 Ảnh Sáng Tạo AI</span>`;

          mediaCard.innerHTML = `
            <div class="ai-media-img-wrap" onclick="window.openAiLightbox('${m.url}', '${m.title}', '${m.downloadName}', '${m.sourceUrl ? `Nguồn: ${m.sourceUrl}` : ''}')">
              ${badgeHtml}
              <img src="${m.url}" alt="${m.title}" loading="lazy">
              <div class="ai-media-overlay">
                <span>🔍 Phóng to ảnh</span>
              </div>
            </div>
            <div class="ai-media-actions">
              <span class="ai-media-title" title="${m.title}">${m.title}</span>
              <a href="${m.url}" download="${m.downloadName}" target="_blank" class="btn-download-ai-img" title="Tải ảnh về máy">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Tải Về
              </a>
            </div>
          `;
          bubble.appendChild(mediaCard);
        }
      });
    }

    // Nguồn tin tham khảo (Citations)
    if (extra.sources && Array.isArray(extra.sources) && extra.sources.length > 0) {
      const sourcesDiv = document.createElement('div');
      sourcesDiv.className = 'ai-sources-card';
      let sourcesHtml = `<div class="ai-sources-header">🔗 Nguồn tin tham khảo:</div><ul class="ai-sources-list">`;
      extra.sources.slice(0, 3).forEach(s => {
        sourcesHtml += `<li><a href="${s.url}" target="_blank" rel="noopener noreferrer">${s.title} ↗</a></li>`;
      });
      sourcesHtml += `</ul>`;
      sourcesDiv.innerHTML = sourcesHtml;
      bubble.appendChild(sourcesDiv);
    }

    msgDiv.appendChild(bubble);
    chatBody.appendChild(msgDiv);
    chatBody.scrollTop = chatBody.scrollHeight;

    if (shouldSave) {
      chatHistory.push({
        role: sender === 'user' ? 'user' : 'assistant',
        content: text,
        userImage: extra.userImage,
        media: extra.media,
        sources: extra.sources
      });
      saveSessionHistory();
    }
  }

  function appendRawBotMessage(html) {
    const chatBody = document.getElementById('aiChatBody');
    const msgDiv = document.createElement('div');
    msgDiv.className = 'ai-msg ai-msg-bot';
    const bubble = document.createElement('div');
    bubble.className = 'ai-bubble';
    bubble.innerHTML = html;
    msgDiv.appendChild(bubble);
    chatBody.appendChild(msgDiv);
    chatBody.scrollTop = chatBody.scrollHeight;
  }

  function appendTypingIndicator(statusText = '💭 Đang suy nghĩ...') {
    const id = 'typing_' + Date.now();
    const chatBody = document.getElementById('aiChatBody');
    const typingDiv = document.createElement('div');
    typingDiv.id = id;
    typingDiv.className = 'ai-msg ai-msg-bot';
    typingDiv.innerHTML = `
      <div class="ai-bubble ai-typing-bubble">
        <span class="ai-status-text">${statusText}</span>
        <div class="ai-typing-dots">
          <span></span><span></span><span></span>
        </div>
      </div>
    `;
    chatBody.appendChild(typingDiv);
    chatBody.scrollTop = chatBody.scrollHeight;
    return id;
  }

  function removeTypingIndicator(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
  }

  // Khởi động khi DOM sẵn sàng
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
