/**
 * Intent Classifier & Context Analyzer
 * Phân tích ý định người dùng và ngữ cảnh hội thoại đa lĩnh vực.
 */

function classifyIntent(message, history = []) {
  const text = (message || '').trim().toLowerCase();
  const lastBotMsg = history.length > 0 ? history[history.length - 1] : null;
  const lastUserMsg = history.length > 1 ? history[history.length - 2] : null;

  // 1. Kiểm tra câu hỏi nối tiếp (Follow-up query)
  const isFollowUpIndicator = /(thế còn|nếu như|vậy nếu|thêm|sửa lại|chỉnh lại|giải thích thêm|còn cái này|cho ví dụ|tiếp tục|dòng trên|bước trên|đoạn code trên|chương trình trên|chương trình đó|bài toán trên|bài toán đó|kết quả trên|bàn thắng đó|bàn đó|trận đó|trận đấu đó|ai kiến tạo|tại sao lại thế|ở trên|như trên|trước đó)/i.test(text);

  if (isFollowUpIndicator && lastBotMsg) {
    const prevContent = lastBotMsg.content.toLowerCase();
    if (prevContent.includes('c++') || prevContent.includes('chương trình') || prevContent.includes('code') || prevContent.includes('lập trình')) {
      return { type: 'FOLLOW_UP_CODE', context: lastBotMsg.content, originalQuery: message };
    }
    if (prevContent.includes('đạo hàm') || prevContent.includes('toán') || prevContent.includes('tích phân') || prevContent.includes('f\'(x)')) {
      return { type: 'FOLLOW_UP_MATH', context: lastBotMsg.content, originalQuery: message };
    }
    if (prevContent.includes('bàn thắng') || prevContent.includes('raphinha') || prevContent.includes('barcelona') || prevContent.includes('feyenoord')) {
      return { type: 'FOLLOW_UP_FOOTBALL', context: lastBotMsg.content, originalQuery: message };
    }
    return { type: 'FOLLOW_UP_GENERAL', context: lastBotMsg.content, originalQuery: message };
  }

  // 2. Yêu cầu tạo ảnh / Poster / Thiết kế
  const isImageRequest = /(tạo ảnh|vẽ|thiết kế poster|tạo một poster|tạo poster|tạo hình ảnh|vẽ tranh|generate image|draw|create image|tạo ảnh minh họa)/i.test(text);
  if (isImageRequest) {
    let cleanPrompt = message
      .replace(/(hãy |hãy giúp tôi |giúp tôi |mày hãy |bạn hãy |tạo ảnh |vẽ |thiết kế poster |tạo một poster |tạo poster |tạo hình ảnh |vẽ tranh )/gi, '')
      .trim();
    if (!cleanPrompt || cleanPrompt.length < 3) cleanPrompt = 'epic football poster of Raphinha Barcelona number 11';
    return { type: 'IMAGE_GENERATION', prompt: cleanPrompt, originalQuery: message };
  }

  // 3. Câu hỏi mơ hồ (Ambiguous query) cần hỏi lại để làm rõ
  const isAmbiguous = /^(làm sao để thắng|cái đó dùng thế nào|nó có tốt không|chỉ tôi với|làm thế nào đây|giúp tôi cái này|sao lại thế|làm sao|thế nào\?|giúp với)$/i.test(text) ||
    (text.length < 18 && /(làm sao để thắng|chỉ tôi với|cái đó ra sao)/i.test(text));
  if (isAmbiguous) {
    return { type: 'AMBIGUOUS_QUERY', originalQuery: message };
  }

  // 4. Bài toán Đạo hàm & Toán học (Math & Calculus)
  const isMath = /(đạo hàm|tích phân|giải phương trình|toán học|tính đạo hàm|cách giải một bài toán đạo hàm|bài toán đạo hàm|calculus|derivative|nguyên hàm|giới hạn lim)/i.test(text);
  if (isMath) {
    return { type: 'MATH_PROBLEM', originalQuery: message };
  }

  // 5. Viết code & Lập trình (Programming / Code)
  const isCode = /(viết chương trình|viết code|c\+\+|cpp|python|javascript|java|lập trình|chương trình cho người mới|code c\+\+|hàm tính|thuật toán)/i.test(text);
  if (isCode) {
    let lang = 'cpp';
    if (/python/i.test(text)) lang = 'python';
    else if (/javascript|js/i.test(text)) lang = 'javascript';
    else if (/c\+\+|cpp/i.test(text)) lang = 'cpp';
    return { type: 'PROGRAMMING_CODE', language: lang, originalQuery: message };
  }

  // 6. Thông tin bóng đá mới nhất & Tra cứu trực tiếp (Live Search / News)
  const isLiveNews = /(tin tức bóng đá mới nhất|thông tin bóng đá mới nhất|tin chuyển nhượng|tin tức mới|bảng xếp hạng mới nhất|kết quả trận đấu gần đây|tin nóng|tin tức rạng sáng)/i.test(text);
  if (isLiveNews) {
    return { type: 'LIVE_SEARCH_INFO', originalQuery: message };
  }

  // 7. Thống kê & Bàn thắng Raphinha (Raphinha / Barcelona / Brazil Archive)
  const isRaphinha = /(raphinha|bàn thắng|barca|barcelona|brazil|hat-trick|feyenoord|bayern|leeds|sporting|rennes|vitoria|kiến tạo|sự nghiệp|162 bàn|89 bàn|el clasico)/i.test(text);
  if (isRaphinha) {
    return { type: 'RAPHINHA_FOOTBALL', originalQuery: message };
  }

  // 8. Trò chuyện & Kiến thức chung (General Conversation / Other Domains)
  return { type: 'GENERAL_CONVERSATION', originalQuery: message };
}

module.exports = {
  classifyIntent
};
