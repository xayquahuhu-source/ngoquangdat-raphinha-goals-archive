require('dotenv').config();

const MODEL_CASCADE = [
  process.env.GEMINI_MODEL ? process.env.GEMINI_MODEL.trim() : 'gemini-3.8-flash',
  'gemini-3.8-flash',
  'gemini-3.5-flash-lite',
  'gemini-3.5-flash',
  'gemini-4-argon' // Chỉ kích hoạt khi tài khoản được cấp quota Argon
];

const UNIQUE_CASCADE = [...new Set(MODEL_CASCADE.filter(Boolean))];

const config = {
  geminiApiKey: process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.trim() : '',
  primaryModel: UNIQUE_CASCADE[0],
  modelCascade: UNIQUE_CASCADE,
  port: process.env.PORT || 3000,
  isKeyConfigured() {
    return Boolean(this.geminiApiKey && this.geminiApiKey.length > 10);
  }
};

module.exports = config;
