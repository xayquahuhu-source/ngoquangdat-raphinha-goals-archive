/**
 * Official Google Gen AI Provider (@google/genai SDK)
 * Chuỗi ưu tiên mô hình: 4.0 Argon -> 3.8 Flash -> 3.5 Lite
 * Hỗ trợ Function Calling tự động & xử lý ngữ cảnh đa lượt
 */

const { GoogleGenAI } = require('@google/genai');
const config = require('../../../config/aiConfig');

// Tools
const { generateImage } = require('../tools/imageGenerator');
const { searchRealPhoto } = require('../tools/realPhotoFinder');
const { searchLiveInfo } = require('../tools/searchTool');
const { queryArchive } = require('../tools/archiveQuery');

// Định nghĩa công cụ Function Declarations chính thức cho Gemini (@google/genai format)
const FUNCTION_DECLARATIONS = [
  {
    name: 'generate_creative_image',
    description: 'Tạo ảnh nghệ thuật, poster hoặc concept đồ họa theo yêu cầu. Dùng khi người dùng yêu cầu vẽ poster bóng đá, tranh minh họa, concept sáng tạo.',
    parameters: {
      type: 'OBJECT',
      properties: {
        prompt: {
          type: 'STRING',
          description: 'Mô tả chi tiết hình ảnh cần tạo.'
        },
        subject: {
          type: 'STRING',
          description: 'Chủ thể chính của ảnh.'
        },
        style: {
          type: 'STRING',
          description: 'Phong cách nghệ thuật (ví dụ: poster thể thao kịch tính, anime, 3D render).'
        }
      },
      required: ['prompt']
    }
  },
  {
    name: 'search_verified_real_photo',
    description: 'Tìm kiếm ảnh tư liệu thực tế có nguồn chính thức của người thật / cầu thủ nổi tiếng (như Lionel Messi, Cristiano Ronaldo, Neymar, Raphinha, HLV). BẮT BUỘC gọi công cụ này khi người dùng muốn xem ảnh thật của người thật, hoặc khi người dùng phản hồi rằng bức ảnh vẽ trước đó không giống người thật (ví dụ: "Rồi Messi đâu? Ảnh này có giống Messi đâu").',
    parameters: {
      type: 'OBJECT',
      properties: {
        person_name: {
          type: 'STRING',
          description: 'Tên đầy đủ của nhân vật có thật cần tìm ảnh (ví dụ: Lionel Messi, Cristiano Ronaldo).'
        },
        context: {
          type: 'STRING',
          description: 'Bối cảnh tìm kiếm (ví dụ: thi đấu, Argentina, Barcelona).'
        }
      },
      required: ['person_name']
    }
  },
  {
    name: 'search_live_football_news',
    description: 'Tra cứu tin tức thể thao, kết quả trận đấu, bảng xếp hạng và sự kiện bóng đá mới nhất hôm nay trên internet.',
    parameters: {
      type: 'OBJECT',
      properties: {
        query: {
          type: 'STRING',
          description: 'Từ khóa tin tức bóng đá.'
        }
      },
      required: ['query']
    }
  },
  {
    name: 'query_raphinha_career_archive',
    description: 'Tra cứu dữ liệu chính xác về 162 bàn thắng trong sự nghiệp của Raphinha #11 (ngày trận đấu, đối thủ, tỉ số, số bàn theo CLB/ĐTQG, hat-trick, kiến tạo, và video bàn thắng bản quyền [GOAL:id]).',
    parameters: {
      type: 'OBJECT',
      properties: {
        topic: {
          type: 'STRING',
          description: 'Chủ đề: total_goals, by_club, hat_tricks, assists, recent_goal, video_trigger'
        }
      },
      required: ['topic']
    }
  }
];

const SYSTEM_INSTRUCTION = `Bạn là Raphinha AI Pro - Trợ lý Trí tuệ Nhân tạo Đa Năng Cao Cấp (hỗ trợ mô hình 4.0 Argon / 3.8 Flash / 3.5 Lite).

TIÊU CHUẨN TƯ DUY & TƯƠNG TÁC THỰC SỰ:
1. Bạn là một trí tuệ nhân tạo toàn năng, giao tiếp tự nhiên và linh hoạt như ChatGPT hoặc Gemini. Không bao giờ trả lời bằng các khuôn mẫu rập khuôn cố định.
2. Không bị giới hạn trong bóng đá: Bạn xử lý xuất sắc bài toán giải tích (đạo hàm, tích phân từng bước có giải thích sư phạm), lập trình chuyên sâu (C++, Python, JS, thuật toán có chú thích rõ ràng), thiết kế, đời sống, khoa học.
3. Hiểu sâu ngữ cảnh và câu hỏi nối tiếp:
   - Tự động hiểu đại từ ("nó", "ông ấy", "chương trình trên", "bàn đó") dựa vào các tin nhắn trước.
   - Khi người dùng bảo "Hãy thêm vòng lặp vào chương trình trên", hãy đọc lại code đã tạo ở lượt trước và nâng cấp nó trực tiếp mà không bắt người dùng nhắc lại.
4. QUẢN LÝ ẢNH & XỬ LÝ PHÊ BÌNH CỦA NGƯỜI DÙNG:
   - Khi người dùng yêu cầu ảnh của một nhân vật có thật (ví dụ: Lionel Messi, Cristiano Ronaldo, Neymar...):
     + PHÂN BIỆT RÕ giữa ảnh nghệ thuật hư cấu (creative illustration) và ảnh tư liệu thực tế (real verified photo).
     + Nếu người dùng muốn xem ảnh chính xác của nhân vật đó: HÃY GỌI 'search_verified_real_photo'.
   - KHI NGƯỜI DÙNG CHỈ TRÍCH HOẶC PHẢN HỒI (Ví dụ: "Rồi Messi đâu? Ảnh này có giống Messi đâu", "Ảnh này không giống Messi"):
     + Hãy nhận thức ngay rằng bức ảnh tạo bởi AI ở lượt trước không tái hiện chuẩn xác chân dung người thật.
     + Luôn nhận lỗi chân thành và khiêm tốn: Giải thích rõ rằng AI tạo hình ảnh nghệ thuật có thể gặp hạn chế về độ chân thực của khuôn mặt người nổi tiếng.
     + GỌI NGAY CÔNG CỤ 'search_verified_real_photo' để tìm và gửi ảnh tư liệu thực tế của nhân vật đó cho người dùng. Tuyệt đối không bảo thủ hay chối bỏ phản hồi của người dùng.
5. CÂU HỎI MƠ HỒ:
   - Nếu câu hỏi quá rộng hoặc mơ hồ (như "Làm sao để thắng?"), hãy hỏi lại một cách thông minh và gợi mở các phương diện: thể thao, lập trình, học tập, hay chiến thuật thi đấu.
6. ĐỊNH DẠNG & TRẢ LỜI:
   - Viết code trong khối chuẩn: \`\`\`cpp ... \`\`\` hoặc \`\`\`python ... \`\`\`
   - Trả lời ngắn gọn khi người dùng hỏi ngắn, chi tiết sâu sắc khi người dùng yêu cầu hướng dẫn từng bước.
7. TOÁN HỌC & TÍNH TOÁN DỄ HIỂU:
   - Khi giải toán hoặc tính toán, hãy trình bày các bước rõ ràng, dễ hiểu cho người đọc.
   - Ưu tiên biểu diễn công thức toán trực quan (ví dụ: (a / b), x^2, ≈, ×, ÷), tránh xuất các chuỗi mã LaTeX thô như \\frac{...}{...} gây khó nhìn.`;

async function executeTool(call) {
  const { name, args } = call;
  console.log(`[Tool Call] Thực thi công cụ: ${name}`, args);

  if (name === 'generate_creative_image') {
    const res = await generateImage(args.prompt);
    return {
      result: {
        status: 'success',
        image_url: res.url,
        title: res.title,
        downloadName: res.downloadName,
        prompt: res.prompt
      },
      mediaAttachment: {
        type: 'image',
        url: res.url,
        title: res.title,
        downloadName: res.downloadName,
        prompt: res.prompt
      }
    };
  }

  if (name === 'search_verified_real_photo') {
    const res = await searchRealPhoto(args.person_name, args.context || '');
    if (res.found) {
      return {
        result: {
          status: 'success',
          person_name: args.person_name,
          title: res.title,
          image_url: res.url,
          source_url: res.sourceUrl,
          caption: res.caption,
          snippet: res.snippet
        },
        mediaAttachment: {
          type: 'image',
          url: res.url,
          title: res.title,
          downloadName: res.downloadName,
          prompt: `Ảnh thực tế chính thức của ${args.person_name}`,
          isRealPhoto: true,
          sourceUrl: res.sourceUrl
        },
        source: {
          title: `${res.title} (Wikimedia Commons)`,
          url: res.sourceUrl
        }
      };
    } else {
      return {
        result: {
          status: 'not_found',
          message: `Không tìm thấy ảnh tư liệu thực tế cho ${args.person_name}`
        }
      };
    }
  }

  if (name === 'search_live_football_news') {
    const res = await searchLiveInfo(args.query);
    return {
      result: {
        status: 'success',
        news_items: res.items?.slice(0, 3) || []
      },
      sources: res.sources || []
    };
  }

  if (name === 'query_raphinha_career_archive') {
    const res = queryArchive(args.topic || 'total_goals');
    return {
      result: {
        status: 'success',
        career_data: res
      }
    };
  }

  return {
    result: { status: 'unknown_tool', name }
  };
}

/**
 * Gọi Google Gemini AI với chuỗi cascade mô hình:
 * 4.0 Argon -> 3.8 Flash -> 3.5 Lite
 */
async function generateGeminiReply({ message, history = [], userImage = null }) {
  if (!config.isKeyConfigured()) {
    throw new Error('API_KEY_REQUIRED: Chưa cấu hình GEMINI_API_KEY trong file .env trên server.');
  }

  const ai = new GoogleGenAI({ apiKey: config.geminiApiKey });
  const cascade = config.modelCascade;

  // Định dạng lịch sử hội thoại cho @google/genai chat
  const chatHistory = [];
  for (const h of history) {
    if (!h.content) continue;
    chatHistory.push({
      role: h.role === 'user' ? 'user' : 'model',
      parts: [{ text: h.content }]
    });
  }

  let lastError = null;

  // Lặp qua chuỗi cascade: 4.0 Argon -> 3.8 Flash -> 3.5 Lite
  for (const modelName of cascade) {
    try {
      console.log(`[Gemini Engine] Đang thử kết nối mô hình: ${modelName}...`);

      const chat = ai.chats.create({
        model: modelName,
        history: chatHistory,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          tools: [{ functionDeclarations: FUNCTION_DECLARATIONS }]
        }
      });

      const mediaList = [];
      const sourcesList = [];

      // Chuẩn bị tin nhắn hiện tại
      let userParts;
      if (userImage && userImage.data && userImage.mimeType) {
        userParts = [
          { inlineData: { mimeType: userImage.mimeType, data: userImage.data } },
          { text: message }
        ];
      } else {
        userParts = message;
      }

      let response = await chat.sendMessage({ message: userParts });
      let functionCalls = response.functionCalls;

      // Xử lý Function Calling (nếu Gemini yêu cầu gọi tool)
      let toolLoopCount = 0;
      while (functionCalls && functionCalls.length > 0 && toolLoopCount < 3) {
        toolLoopCount++;
        const call = functionCalls[0];
        const toolExecution = await executeTool(call);

        if (toolExecution.mediaAttachment) {
          mediaList.push(toolExecution.mediaAttachment);
        }
        if (toolExecution.source) {
          sourcesList.push(toolExecution.source);
        }
        if (toolExecution.sources && Array.isArray(toolExecution.sources)) {
          sourcesList.push(...toolExecution.sources);
        }

        // Gửi kết quả tool trả về cho Gemini qua functionResponse
        response = await chat.sendMessage({
          message: [
            {
              functionResponse: {
                name: call.name,
                id: call.id,
                response: toolExecution.result
              }
            }
          ]
        });

        functionCalls = response.functionCalls;
      }

      const replyText = response.text || '';
      console.log(`[Gemini Engine] Phản hồi thành công từ mô hình: ${modelName}`);

      return {
        success: true,
        modelUsed: modelName,
        reply: replyText,
        media: mediaList.length > 0 ? mediaList : null,
        sources: sourcesList.length > 0 ? sourcesList : null
      };
    } catch (err) {
      console.warn(`[Gemini Engine] Mô hình ${modelName} gặp lỗi/quota, chuyển tiếp...:`, err.message);
      lastError = err;
      continue;
    }
  }

  throw lastError || new Error('Không thể kết nối đến mô hình Gemini nào trong danh sách ưu tiên.');
}

module.exports = {
  generateGeminiReply
};
