/**
 * Raphinha AI Pro - Central AI Brain Orchestrator
 * Điều phối gọi mô hình Gemini thực thụ qua SDK chính thức
 * Chuỗi ưu tiên mô hình: 4.0 Argon -> 3.8 Flash -> 3.5 Lite
 */

const config = require('../config/aiConfig');
const { generateGeminiReply } = require('./aiEngine/providers/geminiProvider');

async function handleChat({ message, history = [], userImage = null }) {
  // 1. Kiểm tra cấu hình GEMINI_API_KEY ở server
  if (!config.isKeyConfigured()) {
    return {
      success: false,
      errorCode: 'API_KEY_REQUIRED',
      error: 'Chưa cấu hình GEMINI_API_KEY tại Server (.env).',
      instruction: 'Vui lòng mở file .env trên server và cấu hình: GEMINI_API_KEY=AIzaSy... để kích hoạt trợ lý AI thực thụ (Ưu tiên: 4.0 Argon -> 3.8 Flash -> 3.5 Lite). Lấy API key miễn phí tại https://aistudio.google.com/app/apikey.',
      configuredCascade: config.modelCascade
    };
  }

  // 2. Gọi mô hình Gemini thực thụ với chuỗi cascade và function calling
  try {
    const result = await generateGeminiReply({ message, history, userImage });
    return result;
  } catch (err) {
    console.error('[aiAssistant] Lỗi thực thi Gemini Provider:', err.message);
    return {
      success: false,
      errorCode: 'GEMINI_API_ERROR',
      error: `Lỗi từ mô hình AI: ${err.message}`,
      details: err.message,
      configuredCascade: config.modelCascade
    };
  }
}

module.exports = {
  handleChat
};
