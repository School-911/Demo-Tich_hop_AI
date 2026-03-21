import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, X, Minus, Send, Loader2, Sparkles, AlertTriangle } from 'lucide-react';
import clsx from 'clsx';
import { createClient } from '@supabase/supabase-js';

// ============================================
// LÕI KHỞI TẠO DỊCH VỤ (INLINED ĐỂ TRÁNH LỖI IMPORT)
// ============================================
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

const FINNHUB_API_KEY = import.meta.env.VITE_FINNHUB_API_KEY;
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

const delay = ms => new Promise(res => setTimeout(res, ms));

// Helper fetch với Exponential Backoff & Thông báo tùy chỉnh (Sửa lỗi 429)
const fetchWithRetry = async (url, options, onRetryMessage) => {
  let retries = 0;
  const maxRetries = 2;
  const backoffDelay = 2000; // Thử lại sau 2 giây theo yêu cầu

  while (retries <= maxRetries) {
    try {
      const response = await fetch(url, options);
      if (response.status === 429) {
        if (onRetryMessage) onRetryMessage("Dạ thưa Chủ nhân, em đang hơi mệt, Ngài đợi em 1 giây nhé...");
        await delay(backoffDelay);
        retries++;
        continue;
      }
      return response;
    } catch (error) {
      if (retries === maxRetries) throw error;
      await delay(backoffDelay);
      retries++;
    }
  }
};

// ============================================
// LÕI TRÍ TUỆ AI (MODEL DISCOVERY & EXECUTIVE MAID)
// ============================================
const internalAiService = {
  async askMaid(userQuery, portfolioData, marketNews, onStatusChange, isBackground = false) {
    const optimizedNews = marketNews.slice(0, 3);
    
    const maidPersona = `
      BẠN LÀ: "Hầu gái AI" - Trợ lý tài chính trung thành, lễ phép và cực kỳ thông minh của chủ nhân.
      XƯNG HÔ: Tự xưng là "Em", gọi người dùng là "Chủ nhân" hoặc "Ngài".
      PHONG CÁCH: Lễ phép, tận tâm, thông minh. Luôn thể hiện sự kính trọng tuyệt đối.
      NHIỆM VỤ: Phân tích tài chính vĩ mô và quản lý danh mục cho Chủ nhân.
    `;

    const modePrompt = isBackground 
      ? `NHIỆM VỤ NGẦM: Âm thầm soi xét 3 tin tức mới nhất. CHỈ LÊN TIẾNG nếu có biến động cực lớn đe dọa hoặc làm giàu cho Chủ nhân. Nếu bình thường, trả về đúng chữ "PASS".` 
      : `NHIỆM VỤ TRỰC TIẾP: Trình bày Markdown đẹp mắt. Luôn kết thúc bằng: "Đây không phải là lời khuyên đầu tư chuyên nghiệp đâu ạ."`;

    const systemPrompt = `${maidPersona}
      Dữ liệu của Ngài: ${JSON.stringify(portfolioData)}.
      Thị trường hiện tại: ${JSON.stringify(optimizedNews)}.
      ${modePrompt}
    `;

    // 1. ƯU TIÊN GROQ (LLAMA 3.3) SIÊU TỐC
    if (GROQ_API_KEY) {
      if (onStatusChange && !isBackground) onStatusChange("Dạ, em đang chuẩn bị số liệu qua hệ thống Groq cho Ngài ạ...");
      try {
        const res = await fetchWithRetry("https://api.groq.com/openai/v1/chat/completions", {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_API_KEY}` },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userQuery || "Chủ nhân muốn nghe nhận định ạ." }],
            temperature: 0.6
          })
        }, onStatusChange);
        
        if (res && res.ok) {
          const data = await res.json();
          return { text: data.choices[0].message.content, provider: "Groq (Llama 3.3)" };
        }
      } catch (e) {}
    }

    // 2. MODEL DISCOVERY CHO GEMINI (TRÁNH 404)
    if (GEMINI_API_KEY) {
      const modelList = ['gemini-1.5-flash', 'gemini-1.5-flash-latest'];
      
      for (const modelId of modelList) {
        if (onStatusChange && !isBackground) onStatusChange(`Dạ, em đang hỏi ý kiến Google [${modelId}] cho Ngài ạ...`);
        try {
          const res = await fetchWithRetry(`https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: `${systemPrompt}\n\nCâu hỏi: ${userQuery || "Nhận định thị trường ạ."}` }] }] })
          }, onStatusChange);

          if (res && res.ok) {
            const data = await res.json();
            return { text: data.candidates[0].content.parts[0].text, provider: modelId };
          }
        } catch (e) { continue; }
      }
    }

    throw new Error("Dạ thưa Chủ nhân, hình như đường truyền đang gặp sự cố, Ngài cho em nợ câu trả lời này một lát nhé.");
  }
};

const renderMarkdown = (text) => {
  if (!text) return { __html: '' };
  let html = text
    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-secondary">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^(?:-|\*) (.*)$/gm, '<li class="ml-4 list-disc mt-1">$1</li>')
    .replace(/\[TỰ ĐỘNG PHÂN TÍCH\]/g, '<span class="px-2 py-0.5 flex items-center gap-1 w-max rounded-sm bg-purple-500/20 text-purple-400 border border-purple-500/40 text-[10px] font-mono tracking-wide mb-2"><Sparkles class="w-3 h-3"/> PHÂN TÍCH CỦA EM</span>');
  html = html.replace(/\n/g, '<br />');
  return { __html: html };
};

// ============================================
// COMPONENT CHÍNH (EXECUTIVE MAID AGENT)
// ============================================
export default function GlobalAIAdvisor() {
  const navigate = useNavigate();
  const [chatState, setChatState] = useState('closed'); // 'closed', 'minimized', 'expanded'
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [apiStatus, setApiStatus] = useState('ready'); // 'ready', 'busy', 'error'
  
  const [marketNews, setMarketNews] = useState([]);
  const [portfolioData, setPortfolioData] = useState([]);
  const [bgScanning, setBgScanning] = useState(false);
  const lastScanTime = useRef(0);
  const bottomRef = useRef(null);

  // Kéo thả và Vị trí (Persist)
  const [position, setPosition] = useState(() => {
    try {
      const saved = localStorage.getItem('maidPosition');
      return saved ? JSON.parse(saved) : { x: 0, y: 0 };
    } catch { return { x: 0, y: 0 }; }
  });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, initialX: 0, initialY: 0, dragged: false });

  useEffect(() => {
    localStorage.setItem('maidPosition', JSON.stringify(position));
  }, [position]);

  // Logic kéo thả mượt mà qua mousemove
  const handleMouseDown = (e) => {
    if (e.target.closest('.no-drag')) return;
    setIsDragging(true);
    dragRef.current.dragged = false;
    dragRef.current.startX = e.clientX || e.touches?.[0]?.clientX;
    dragRef.current.startY = e.clientY || e.touches?.[0]?.clientY;
    dragRef.current.initialX = position.x;
    dragRef.current.initialY = position.y;
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      const clientX = e.clientX || e.touches?.[0]?.clientX;
      const clientY = e.clientY || e.touches?.[0]?.clientY;
      const dx = clientX - dragRef.current.startX;
      const dy = clientY - dragRef.current.startY;
      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) dragRef.current.dragged = true;
      setPosition({ x: dragRef.current.initialX + dx, y: dragRef.current.initialY + dy });
    };
    const handleMouseUp = () => setIsDragging(false);

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleMouseMove, { passive: false });
      window.addEventListener('touchend', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleMouseMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging]);

  // Sync dữ liệu Global
  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase.from('portfolios').select('*').eq('user_id', user.id);
          if (isMounted) setPortfolioData(data || []);
        }
        if (FINNHUB_API_KEY) {
          const res = await fetch(`https://finnhub.io/api/v1/news?category=general&token=${FINNHUB_API_KEY}`);
          const news = await res.json();
          if (isMounted) setMarketNews(news || []);
        }
      } catch (e) {}
    };
    fetchData();
    const inv = setInterval(fetchData, 60000);
    return () => { isMounted = false; clearInterval(inv); };
  }, []);

  // Tự động rà soát thị trường
  useEffect(() => {
    const now = Date.now();
    if (marketNews.length === 0 || portfolioData.length === 0 || now - lastScanTime.current < 60000) return;
    
    const triggerThinking = async () => {
      lastScanTime.current = now;
      setBgScanning(true);
      try {
        const res = await internalAiService.askMaid("Phân tích biến động cho Chủ nhân ạ.", portfolioData, marketNews, null, true);
        if (res && res.text && !res.text.includes("PASS")) {
          setMessages(prev => [...prev, {
            id: Date.now(),
            sender: 'ai',
            text: `**[TỰ ĐỘNG PHÂN TÍCH]**\n\n${res.text}`,
            provider: res.provider,
            timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
          }]);
          if (chatState === 'closed') setChatState('minimized');
        }
      } catch (e) {} finally { setBgScanning(false); }
    };
    triggerThinking();
  }, [marketNews]);

  // Command Execution (Navigation Mapping)
  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const query = input.trim();
    setMessages(prev => [...prev, { id: Date.now(), sender: 'user', text: query, timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) }]);
    setInput('');
    setIsTyping("Dạ, Ngài đợi em một lát...");
    setApiStatus('busy');

    // NHẬN DIỆN ĐIỀU HƯỚNG CHÍNH XÁC (FIX MAPPING)
    const lower = query.toLowerCase();
    let target = null;
    let targetName = "";

    if (/(thu chi|giao dịch|tiền ra tiền vào|tiền ra vào|lịch sử)/i.test(lower)) {
      target = '/transactions'; targetName = 'Giao dịch';
    } else if (/(ngân sách|kế hoạch chi tiêu)/i.test(lower)) {
      target = '/budget'; targetName = 'Ngân sách';
    } else if (/(tổng quan|trang chủ|dashboard)/i.test(lower)) {
      target = '/'; targetName = 'Tổng quan';
    } else if (/(danh mục|portfolio)/i.test(lower)) {
      target = '/portfolio'; targetName = 'Danh mục';
    } else if (/(đầu tư|investment)/i.test(lower)) {
      target = '/investments'; targetName = 'Đầu tư';
    } else if (/(tin tức|news)/i.test(lower)) {
      target = '/news'; targetName = 'Tin tức';
    } else if (/(trợ lý ai|ai advisor)/i.test(lower)) {
      target = '/ai-advisor'; targetName = 'Trợ lý AI';
    }

    if (target) {
      await delay(800);
      navigate(target);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'ai',
        text: `Dạ thưa Chủ nhân, em đã mở trang **${targetName}** cho Chủ nhân rồi ạ. Ngài xem qua nhé!`,
        provider: "Executive Maid",
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      }]);
      setIsTyping(false);
      setApiStatus('ready');
      return;
    }

    // GỌI AI ENGINE
    try {
      const res = await internalAiService.askMaid(query, portfolioData, marketNews, (s) => setIsTyping(s));
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'ai',
        text: res.text,
        provider: res.provider,
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      }]);
      setApiStatus('ready');
    } catch (error) {
      setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'ai', text: error.message, timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) }]);
      setApiStatus('error');
    } finally { setIsTyping(false); }
  };

  useEffect(() => { if (chatState === 'expanded') bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isTyping]);

  if (chatState === 'closed') {
    return (
      <div 
        onMouseDown={handleMouseDown} onTouchStart={handleMouseDown}
        onClick={() => { if (!dragRef.current.dragged) setChatState('expanded'); }}
        style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
        className={clsx(
          "fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-700 to-purple-800 flex items-center justify-center text-white shadow-2xl cursor-grab active:cursor-grabbing hover:scale-105 transition-all outline-none border-2 border-white/20",
          isDragging && "opacity-80 scale-95"
        )}
      >
        <Bot className="w-8 h-8 pointer-events-none" />
        <div className={clsx("absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-slate-900", apiStatus === 'ready' ? 'bg-green-500' : apiStatus === 'busy' ? 'bg-yellow-500 animate-pulse' : 'bg-red-500')} title={apiStatus.toUpperCase()} />
        {bgScanning && <div className="absolute inset-0 rounded-full border-2 border-purple-400 animate-ping opacity-30" />}
      </div>
    );
  }

  return (
    <div 
      style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
      className={clsx(
        "fixed right-6 z-50 flex flex-col bg-slate-950 border border-slate-800 shadow-[0_0_50px_rgba(0,0,0,0.8)] transition-all duration-300 overflow-hidden",
        chatState === 'expanded' ? "bottom-6 w-[400px] h-[550px] rounded-3xl" : "bottom-6 w-80 h-16 rounded-full",
        isDragging && "opacity-90 blur-[0.5px]"
      )}
    >
      {/* HEADER (Draggable Area) */}
      <div 
        onMouseDown={handleMouseDown} onTouchStart={handleMouseDown}
        onClick={() => { if (!dragRef.current.dragged && chatState === 'minimized') setChatState('expanded'); }}
        className={clsx(
          "flex justify-between items-center px-6 bg-gradient-to-r from-indigo-800 to-purple-900 text-white shrink-0 cursor-move border-b border-white/5",
          chatState === 'expanded' ? "py-5" : "h-full"
        )}
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <Sparkles className="w-6 h-6 text-yellow-400 drop-shadow-lg" />
            <div className={clsx("absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-slate-900", apiStatus === 'ready' ? 'bg-green-400' : apiStatus === 'busy' ? 'bg-yellow-400' : 'bg-red-500')} />
          </div>
          <div className="flex flex-col">
             <span className="font-bold text-sm tracking-tight leading-none">Hầu gái AI</span>
             <span className="text-[10px] text-white/50 mt-1 font-medium italic">Executive Maid Agent</span>
          </div>
        </div>
        <div className="flex items-center gap-2 no-drag">
          {chatState === 'expanded' && <button onClick={(e) => { e.stopPropagation(); setChatState('minimized'); }} className="p-2 hover:bg-white/10 rounded-full transition-colors"><Minus className="w-4 h-4"/></button>}
          <button onClick={(e) => { e.stopPropagation(); setChatState('closed'); }} className="p-2 hover:bg-red-500/80 rounded-full transition-colors"><X className="w-4 h-4"/></button>
        </div>
      </div>

      {chatState === 'expanded' && (
        <>
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-950/80 backdrop-blur-xl">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center opacity-40 space-y-4">
                <div className="p-4 bg-indigo-500/10 rounded-full ring-8 ring-indigo-500/5">
                   <Bot className="w-12 h-12 text-indigo-400" />
                </div>
                <p className="text-sm italic font-medium leading-relaxed">"Dạ thưa Chủ nhân kính mến,<br/>em đã sẵn sàng phục vụ Ngài ạ!"</p>
              </div>
            )}
            
            {messages.map((msg) => {
              const out = msg.sender === 'user';
              return (
                <div key={msg.id} className={clsx('flex flex-col max-w-[90%]', out ? 'ml-auto items-end' : 'mr-auto items-start')}>
                  <div className={clsx('px-4 py-3 text-[14px] shadow-lg leading-relaxed', out ? 'bg-indigo-700 text-white rounded-2xl rounded-tr-none' : 'bg-slate-900 text-slate-100 rounded-2xl rounded-tl-none border border-slate-800')}>
                    <div dangerouslySetInnerHTML={renderMarkdown(msg.text)} />
                  </div>
                  <div className="flex items-center gap-3 mt-2 px-1 opacity-50">
                    {!out && msg.provider && <span className="text-[10px] uppercase font-bold tracking-tiler text-indigo-500">{msg.provider}</span>}
                    <span className="text-[10px] font-medium">{msg.timestamp}</span>
                  </div>
                </div>
              );
            })}
            {isTyping && (
              <div className="flex items-center gap-3 bg-slate-900/50 p-4 rounded-2xl rounded-tl-none mr-auto border border-slate-800">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                <span className="text-xs italic text-indigo-400 font-medium animate-pulse">{isTyping}</span>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="p-5 bg-slate-950 border-t border-slate-800">
            <form onSubmit={handleSend} className="relative flex items-center">
              <input 
                type="text" value={input} onChange={(e) => setInput(e.target.value)}
                placeholder="Ngài muốn em dạ vâng điều gì ạ?" disabled={isTyping}
                className="w-full bg-slate-900 border border-slate-800 rounded-full py-3.5 px-6 pr-14 text-sm focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 text-white placeholder-slate-600 transition-all shadow-inner"
              />
              <button 
                type="submit" disabled={isTyping || !input.trim()}
                className="absolute right-1.5 p-2.5 bg-indigo-700 hover:bg-indigo-600 text-white rounded-full transition-all disabled:opacity-50 shadow-xl"
              >
                <Send className="w-5 h-5 ml-1" />
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
