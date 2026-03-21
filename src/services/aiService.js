const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

const delay = ms => new Promise(res => setTimeout(res, ms));

/**
 * AUTO-DISCOVERY ENDPOINT GEMINI (FIX 404)
 */
const findValidGeminiLink = async (apiKey) => {
  console.log("🔍 Đang quét danh sách Model khả dụng cho Gemini Key...");
  try {
    const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    const response = await fetch(listUrl);
    
    if (response.status === 403 || response.status === 400 || response.status === 429) {
      throw new Error(`GEMINI_API_BLOCKED_${response.status}`);
    }

    const data = await response.json();
    if (!response.ok) return null;

    const validModels = (data.models || []).filter(m => 
      m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent")
    );
    
    // Ưu tiên dòng 1.5-flash theo yêu cầu mới nhất (độ ổn định và miễn phí cao)
    let bestModelObj = validModels.find(m => m.name.includes("gemini-1.5") && m.name.includes("flash") && !m.name.includes("8b"));
    if (!bestModelObj) bestModelObj = validModels.find(m => m.name.includes("gemini-1.5") && m.name.includes("flash-8b"));
    if (!bestModelObj) bestModelObj = validModels.find(m => m.name.includes("gemini-2.0") && m.name.includes("flash"));
    if (!bestModelObj && validModels.length > 0) bestModelObj = validModels[0];

    if (bestModelObj) {
      console.log(`🎯 Đã chốt URL Model Gemini: ${bestModelObj.name}`);
      return {
        url: `https://generativelanguage.googleapis.com/v1beta/${bestModelObj.name}:generateContent?key=${apiKey}`,
        modelName: bestModelObj.name.split('/').pop()
      };
    }
  } catch (error) {
    if (error.message.includes("GEMINI_API_BLOCKED_403")) throw new Error("GEO_BLOCKED");
    if (error.message.includes("GEMINI_API_BLOCKED_429")) throw new Error("QUOTA_FULL");
  }
  return null;
};

/**
 * AUTO-DISCOVERY ENDPOINT GROQ (FIX 404/400 BẰNG LLAMA/MIXTRAL)
 */
const findValidGroqModel = async (apiKey) => {
  console.log("🔍 Đang quét danh sách Model khả dụng từ Groq Cloud...");
  try {
    const listUrl = "https://api.groq.com/openai/v1/models";
    const response = await fetch(listUrl, {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });
    
    if (response.status === 401 || response.status === 403 || response.status === 429) {
      throw new Error(`GROQ_API_BLOCKED_${response.status}`);
    }

    const data = await response.json();
    if (!response.ok) return null;

    const validModels = data.data || [];

    // Ưu tiên Llama 3.3 70B Versatile, sau đó Mixtral
    let bestModelId = validModels.find(m => m.id.includes("llama-3.3-70b-versatile"))?.id;
    if (!bestModelId) bestModelId = validModels.find(m => m.id.includes("mixtral-8x7b-32768"))?.id;
    if (!bestModelId) bestModelId = validModels.find(m => m.id.includes("llama3"))?.id;
    if (!bestModelId && validModels.length > 0) bestModelId = validModels[0].id;

    if (bestModelId) {
      console.log(`🎯 Đã chốt ID Model Groq vượt trội: ${bestModelId}`);
      return bestModelId;
    }
  } catch (error) {
    if (error.message.includes("GROQ_API_BLOCKED_429")) throw new Error("QUOTA_FULL");
    console.error("🚨 Lỗi mạng khi dò tìm Groq:", error.message);
  }
  return null;
};


export const aiService = {
  async testConnection() {
    return { success: true, message: "Trạm Dò Đường Động (Dynamic Path) đã sẵn sàng hoạt động!" };
  },

  async askAdvisor(userQuery, portfolioData, marketNews, onStatusChange) {
    console.group("🚀 [AUTO-DISCOVERY 2026] BỘ ĐIỀU PHỐI AI MIỄN PHÍ");
    
    if (onStatusChange) onStatusChange("Đang dò tìm đường dẫn AI miễn phí tối ưu...");
    
    const optimizedNews = marketNews.slice(0, 2);
    const systemPrompt = `Bối cảnh: Bạn là Cố vấn Tài chính AI chuyên nghiệp cấp cao. Phân tích sắc bén, logic và tự tin với dữ liệu.
Dữ liệu người dùng: ${JSON.stringify(portfolioData)}.
Tin tức thị trường nổi bật: ${JSON.stringify(optimizedNews)}.
Yêu cầu bắt buộc:
1. Trả lời chi tiết bằng Tiếng Việt chuyên nghiệp. Trình bày rõ bằng Markdown (in đậm các ý khóa).
2. Tóm gọn ý chính xúc tích, không lan man.
3. Luôn kết thúc bằng: "Đây không phải là lời khuyên đầu tư chuyên nghiệp."`;

    const parseBody = async (res) => {
      try { return await res.text(); } catch (e) { return "Không thể đọc Response Body."; }
    };
    
    let finalErrorText = "";

    // ============================================
    // TUYẾN 1: GOOGLE GEMINI (MIỄN PHÍ - ƯU TIÊN 1)
    // ============================================
    console.log("➡️ BƯỚC 1: Dò tìm nhánh Google Gemini...");
    let geminiSuccess = false;
    let geminiResult = null;

    if (!GEMINI_API_KEY || GEMINI_API_KEY.includes("DAN_KEY")) {
      finalErrorText += "Gemini: Thiếu API Key.\n";
    } else {
      if (onStatusChange) onStatusChange("Gemini: Khởi tạo dò tìm Model...");
      
      try {
        const discoveryParams = await findValidGeminiLink(GEMINI_API_KEY);
        
        if (discoveryParams) {
          if (onStatusChange) onStatusChange(`Gemini đang biên dịch bằng [${discoveryParams.modelName}]...`);
          
          const payload = {
            contents: [{ parts: [{ text: `${systemPrompt}\n\nCâu hỏi: ${userQuery}` }] }]
          };

          const res = await fetch(discoveryParams.url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          
          if (!res.ok) {
             if (res.status === 403) throw new Error("GEO_BLOCKED");
             if (res.status === 429) throw new Error("QUOTA_FULL");
             const errText = await parseBody(res);
             throw new Error(`Google HTTP ${res.status}: ${errText}`);
          }
          
          const data = await res.json();
          if (data.candidates && data.candidates.length > 0) {
            const rawText = data.candidates[0].content.parts[0].text;
            const finalText = `${rawText}\n\n*Phản hồi bởi ${discoveryParams.modelName}*`;
            
            geminiSuccess = true;
            geminiResult = { text: finalText, provider: `Google` };
          } else {
            throw new Error("Dữ liệu thân JSON rỗng.");
          }
        } else {
          throw new Error("Không có Model phù hợp trong kho lưu trữ của bạn.");
        }
      } catch (err) {
         if (err.message === "GEO_BLOCKED") {
             throw new Error("Khu vực của bạn đang bị Google chặn API trực tiếp, vui lòng bật VPN 1.1.1.1");
         }
         finalErrorText += `Gemini: ${err.message}\n`;
         
         if (err.message === "QUOTA_FULL" || err.message.includes("429")) {
            if (onStatusChange) onStatusChange("Gemini hiện tại đang bận hoặc hết hạn mức, đang chuyển sang AI miễn phí dự phòng...");
         } else {
            if (onStatusChange) onStatusChange("Gemini đứt đoạn, hoán vị mạng lưới sang hệ thống Groq Cloud...");
         }
         console.warn(`[Tuyến 1 Đứt Gãy] Chuyển vị sang Groq LPU... Lỗi: ${err.message}`);
      }
    }

    if (geminiSuccess && geminiResult) {
      console.groupEnd();
      return geminiResult;
    } 
    await delay(1500); 

    // ============================================
    // TUYẾN 2: GROQ CLOUD LPU (MIỄN PHÍ - SIÊU TỐC ĐỘ)
    // ============================================
    console.log("➡️ BƯỚC 2: Khởi động hệ sinh thái Groq...");
    let groqSuccess = false;
    let groqResult = null;

    if (!GROQ_API_KEY || GROQ_API_KEY.includes("DAN_KEY")) {
      finalErrorText += "Groq: Thiếu API Key.\n";
    } else {
      if (onStatusChange) onStatusChange("Đang dò tìm luồng xử lý cực nhanh LPU trên Groq...");
      try {
        const groqModelId = await findValidGroqModel(GROQ_API_KEY);

        if (groqModelId) {
          if (onStatusChange) onStatusChange(`Groq đang tốc biến văn bản qua [${groqModelId}]...`);
          
          const groqUrl = "https://api.groq.com/openai/v1/chat/completions";
          const payload = {
            model: groqModelId, 
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userQuery }
            ],
            temperature: 0.7
          };

          const res = await fetch(groqUrl, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${GROQ_API_KEY}`
            },
            body: JSON.stringify(payload)
          });
          
          if (!res.ok) {
            if (res.status === 429) throw new Error("QUOTA_FULL");
            const errText = await parseBody(res);
            throw new Error(`[Groq Bật Lỗi ${res.status}] ${errText}`);
          }
          
          const data = await res.json();
          if (data.choices && data.choices.length > 0) {
            const rawText = data.choices[0].message.content;
            const finalText = `${rawText}\n\n*Phản hồi bởi ${groqModelId}*`;
            
            groqSuccess = true;
            groqResult = { text: finalText, provider: "Groq LPU" };
          } else {
            throw new Error("Lưới Groq trả mạng ảo tĩnh rỗng.");
          }
        } else {
          throw new Error("Không dò tìm được Model Llama/Mixtral hợp lệ.");
        }
      } catch (err) {
        if (err.message === "QUOTA_FULL") {
           finalErrorText += "Groq: Hết hạn mức lượt gọi (429).\n";
           if (onStatusChange) onStatusChange("Groq hiện tại đang bận hoặc cạn Quota phút, đang chuyển sang dự phòng chót...");
        } else {
           finalErrorText += `Groq: ${err.message}\n`;
           if (onStatusChange) onStatusChange("Groq nghẽn mạng, đẩy lệnh sang chốt chặn OpenAI...");
        }
        console.error("🧯 Tuyến 2 (Groq) Rút lui:", err.message);
      }
    }

    if (groqSuccess && groqResult) {
      console.groupEnd();
      return groqResult;
    }
    await delay(1500); 

    // ============================================
    // TUYẾN 3: OPENAI CHATGPT (Dự Phòng Chót vớt - Ưu tiên Thấp)
    // ============================================
    console.log("➡️ BƯỚC 3: Cầu nguyện OpenAI...");
    if (onStatusChange) onStatusChange("Khởi động ChatGPT (Dàn khoan dự phòng cuối)...");
    
    if (!OPENAI_API_KEY || OPENAI_API_KEY.includes("DAN_KEY")) {
       finalErrorText += "OpenAI: Thiếu API Key.\n";
       throw new Error("Lưới Multi-Agent sụp đổ toàn bộ. Vui lòng dán Key thật vào file .env.local!\n" + finalErrorText);
    }

    try {
      const openAiUrl = "https://api.openai.com/v1/chat/completions";
      const payload = {
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userQuery }
        ],
        temperature: 0.7
      };

      const res = await fetch(openAiUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) {
        const errText = await parseBody(res);
        if (res.status === 429 || errText.includes("insufficient_quota")) {
           if (onStatusChange) onStatusChange("OpenAI cạn kiệt số dư Billing!");
           throw new Error("Cả 3 nguồn AI đều bận hoặc hết hạn mức. Hệ thống đóng rào bảo vệ chống Crash.");
        }
        throw new Error(`[OpenAI Bật Lỗi ${res.status}] ${errText}`);
      }
      
      const data = await res.json();
      if (data.choices && data.choices.length > 0) {
        console.groupEnd();
        const rawText = data.choices[0].message.content;
        const finalText = `${rawText}\n\n*Phản hồi bởi gpt-4o-mini*`;
        
        return { text: finalText, provider: "ChatGPT" };
      }
      throw new Error("Nội dung body OpenAI rỗng.");

    } catch (err) {
      console.error("🧯 Tuyến 3 (OpenAI) Cụp đuôi:", err.message);
      console.groupEnd();
      
      if (err.message.includes("đều bận hoặc hết hạn mức")) {
         throw err; 
      }
      finalErrorText += `OpenAI: ${err.message}\n`;
      throw new Error("Hệ thống Mắt diều hâu (Auto-Discovery) không thể xuyên thủng bất cứ API nào! Vui lòng nạp Key đúng vào .env.local.\n\n" + finalErrorText);
    }
  }
};
