/**
 * Google Gemini Cloud API Client (Gemini 1.5 Pro / Gemini 2.0)
 * Hỗ trợ giao tiếp trực tiếp với Google Generative AI API khi có API key.
 */

const https = require('https');

async function queryGeminiPro(apiKey, message, history = [], userImage = null) {
  const modelsToTry = ['gemini-1.5-pro', 'gemini-2.0-flash', 'gemini-1.5-flash'];
  let lastError = null;

  for (const modelName of modelsToTry) {
    try {
      return await makeGeminiRequest(apiKey, modelName, message, history, userImage);
    } catch (err) {
      lastError = err;
      console.warn(`Model ${modelName} thất bại, thử model tiếp theo... (${err.message})`);
    }
  }

  throw lastError || new Error('Không thể kết nối đến Google Gemini API');
}

function makeGeminiRequest(apiKey, modelName, message, history = [], userImage = null) {
  return new Promise((resolve, reject) => {
    const contents = [];

    // System instruction
    const systemText = `Bạn là "Raphinha AI Pro", một trợ lý trí tuệ nhân tạo toàn năng, thông minh và đa lĩnh vực với đẳng cấp của Gemini Pro.
1. LĨNH VỰC BÓNG ĐÁ: Bạn sở hữu dữ liệu chính xác về Raphinha #11 (162 bàn thắng sự nghiệp, 89 bàn Barcelona, 12 bàn Brazil). Khi nhắc đến bàn thắng có video sẵn, hãy kèm mã [GOAL:id] (ví dụ: [GOAL:ucl-2026-feyenoord-brace]).
2. CÁC LĨNH VỰC KHÁC: Bạn thành thạo lập trình (C++, Python, JS, cấu trúc dữ liệu), toán học (đạo hàm, tích phân, xác suất), công nghệ, thiết kế và đời sống. Trả lời đúng trọng tâm chuyên môn, giải thích mạch lạc, tự nhiên.
3. PHONG CÁCH: Linh hoạt, tự nhiên. Không rập khuôn máy móc, không ép mọi câu hỏi vào bóng đá nếu người dùng đang hỏi về lập trình hay toán. Nếu câu hỏi quá mơ hồ, hãy lịch sự hỏi lại để làm rõ.`;

    // Lịch sử hội thoại
    if (Array.isArray(history) && history.length > 0) {
      history.slice(-8).forEach(msg => {
        contents.push({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }]
        });
      });
    }

    // Tin nhắn hiện tại
    const currentParts = [];
    if (userImage && userImage.data && userImage.mimeType) {
      currentParts.push({
        inlineData: {
          mimeType: userImage.mimeType,
          data: userImage.data
        }
      });
    }
    currentParts.push({ text: message });

    contents.push({
      role: 'user',
      parts: currentParts
    });

    const payload = JSON.stringify({
      systemInstruction: {
        parts: [{ text: systemText }]
      },
      contents: contents,
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        maxOutputTokens: 2048
      }
    });

    const options = {
      hostname: 'generativelanguage.googleapis.com',
      port: 443,
      path: `/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      },
      timeout: 25000
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.error) {
            reject(new Error(json.error.message || 'Gemini API Error'));
          } else if (
            json.candidates &&
            json.candidates[0] &&
            json.candidates[0].content &&
            json.candidates[0].content.parts[0]
          ) {
            resolve(json.candidates[0].content.parts[0].text);
          } else {
            reject(new Error('Phản hồi từ Gemini không có dữ liệu hợp lệ.'));
          }
        } catch (err) {
          reject(err);
        }
      });
    });

    req.on('error', err => reject(err));
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Hết thời gian chờ phản hồi từ Google Gemini (timeout).'));
    });

    req.write(payload);
    req.end();
  });
}

module.exports = {
  queryGeminiPro
};
