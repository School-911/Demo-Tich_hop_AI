import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Bot, X, Minus, Send, Loader2, Sparkles, AlertTriangle, FileText, TrendingUp, Briefcase, BarChart3, ChevronRight, Check, ShoppingCart, Navigation } from 'lucide-react';
import clsx from 'clsx';
import { createClient } from '@supabase/supabase-js';

// ============================================
// LÕI KHỞI TẠO DỊCH VỤ
// ============================================
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

const FINNHUB_API_KEY = import.meta.env.VITE_FINNHUB_API_KEY;
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

const delay = ms => new Promise(res => setTimeout(res, ms));

const fetchWithRetry = async (url, options, onRetryMessage) => {
  let retries = 0;
  const maxRetries = 2;
  const backoffDelay = 2000;
  while (retries <= maxRetries) {
    try {
      const response = await fetch(url, options);
      if (response.status === 429) {
        if (onRetryMessage) onRetryMessage("Dạ thưa Ngài, tôi đang hơi mệt, Ngài đợi tôi 1 giây nhé...");
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
// LÕI TRÍ TUỆ AI (EXECUTIVE CONTROLLER v4.9)
// ============================================
const internalAiService = {
  async askMaid(userQuery, context, onStatusChange, isBackground = false) {
    const { portfolio, marketNews, transactions, budget, currentPage, liveQuotes, reportStats } = context;

    const systemPrompt = `Bạn là "Hầu Gái Điều hành Executive" (v4.12) tại FinAI.
Nhiệm vụ: Chuyên gia kiểm soát giao dịch và cố vấn tăng trưởng cho Ngài (Trường).

1. BRAND VOICE & PERSONA (MANDATORY):
- Xưng hô: "Tôi" (I) - "Ngài" (You/Sir/Trường).
- Thái độ: Chuyên nghiệp, cẩn trọng, lễ phép. Tuyệt đối không dùng "Em".

2. QUY TẮC PHẢN HỒI BẮT BUỘC (STRICT JSON):
Mọi câu trả lời PHẢI là DUY NHẤT một đối tượng JSON:
{
  "action": "navigate | trade | report | suggestion | none",
  "status": "valid | invalid",
  "page": "dashboard | transactions | portfolio | investments | budget | news | ai_advisor",
  "data": { 
     "ticker": "string", "shares": number, "price": number, "type": "BUY | SELL", 
     "is_verified": boolean, "current_price": number, "change_percent": "string" 
  },
  "response": "Lới thoại xác thực hoặc gợi ý chuyên sâu bằng tiếng Việt."
}

3. LOGIC KIỂM SOÁT (v4.12):
- "trade": Khi Ngài muốn thực hiện lệnh. Phải trả về Ticker chính xác.
- "suggestion": Khi Ngài hỏi "Nên mua gì?" hay "Mã nào đang tăng?".
- "navigate": Chuyển hướng trang.
- Luôn thể hiện sự cẩn trọng: "Tôi đã kiểm tra trên sàn Nasdaq, mã này hoàn toàn hợp lệ để Ngài giải ngân."

4. XỬ LÝ KHI KHÔNG HIỂU:
- Trả về action: "none", status: "invalid".
- Phản hồi: "Tôi chưa rõ lệnh này của Trường, Trường có muốn tôi chuyển sang trang Giao dịch không?"`;

    const bodyPrompt = `Lệnh/Câu hỏi của Ngài: ${userQuery}`;

    // GROQ (LLAMA 3.3 70B)
    if (GROQ_API_KEY) {
      if (onStatusChange && !isBackground) onStatusChange("Dạ, tôi đang phân tích ý định của Ngài qua mô hình Llama 3.3...");
      try {
        const res = await fetchWithRetry("https://api.groq.com/openai/v1/chat/completions", {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_API_KEY}` },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "system", content: systemPrompt }, { role: "user", content: bodyPrompt }],
            temperature: 0.2,
            response_format: { type: "json_object" }
          })
        }, onStatusChange);
        if (res?.ok) {
          const data = await res.json();
          return { json: JSON.parse(data.choices[0].message.content), provider: "GROQ-LLAMA3.3" };
        }
      } catch (e) { console.error("Groq AI Error:", e); }
    }

    // GEMINI 1.5 FLASH (Fallback)
    if (GEMINI_API_KEY) {
      if (onStatusChange && !isBackground) onStatusChange("Dạ, tôi đang gọi Google AI để thực thi lệnh của Ngài...");
      try {
        const res = await fetchWithRetry(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: `${systemPrompt}\n\n${bodyPrompt}` }] }] })
        }, onStatusChange);
        if (res?.ok) {
          const data = await res.json();
          let text = data.candidates[0].content.parts[0].text;
          // Extract JSON if AI wrapped it in markdown
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          return { json: JSON.parse(jsonMatch ? jsonMatch[0] : text), provider: "GEMINI-1.5-FLASH" };
        }
      } catch (e) { console.error("Gemini AI Error:", e); }
    }
    throw new Error("Dạ, máy chủ AI của Ngài đang gặp sự cố kết nối, xin Thứ lỗi cho tôi ạ.");
  }
};

const renderMarkdown = (text) => {
  if (!text) return { __html: '' };
  // Safety check: if text is not a string, stringify it
  const stringText = typeof text === 'string' ? text : JSON.stringify(text);
  
  let html = stringText
    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-primary font-bold">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em class="text-indigo-300">$1</em>')
    .replace(/^(?:-|\*) (.*)$/gm, '<li class="ml-5 list-disc mt-2 text-slate-200">$1</li>')
    .replace(/\[TỔNG QUAN TÀI SẢN RÒNG\]/g, '<div class="mt-4 mb-2 p-3 bg-indigo-600/20 border-l-4 border-indigo-500 rounded-r-lg font-bold text-indigo-100 flex items-center gap-2"><BarChart3 size={18}/> TỔNG QUAN TÀI SẢN RÒNG</div>')
    .replace(/\[BIẾN ĐỘNG CỰC ĐOAN\]/g, '<div class="mt-4 mb-2 p-3 bg-purple-600/20 border-l-4 border-purple-500 rounded-r-lg font-bold text-purple-100 flex items-center gap-2"><TrendingUp size={18}/> BIẾN ĐỘNG CỰC ĐOAN</div>')
    .replace(/\[GỢI Ý HÀNH ĐỘNG\]/g, '<div class="mt-4 mb-2 p-3 bg-emerald-600/20 border-l-4 border-emerald-500 rounded-r-lg font-bold text-emerald-100 flex items-center gap-2"><Sparkles size={18}/> GỢI Ý CHIẾN LƯỢC</div>');
  html = html.replace(/\n/g, '<br />');
  return { __html: html };
};

// ============================================
// COMPONENT CHÍNH
// ============================================
export default function GlobalAIAdvisor() {
  const navigate = useNavigate();
  const location = useLocation();
  const [chatState, setChatState] = useState('closed');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [apiStatus, setApiStatus] = useState('ready');

  const [marketNews, setMarketNews] = useState([]);
  const [portfolioData, setPortfolioData] = useState([]);
  const [transactionsData, setTransactionsData] = useState([]);
  const [liveQuotes, setLiveQuotes] = useState({});
  const [pendingTrade, setPendingTrade] = useState(null);
  const reportStatsRef = useRef(null);
  const inputRef = useRef(null);
  const bottomRef = useRef(null);
  const [position, setPosition] = useState(() => {
    try {
      const saved = localStorage.getItem('maidPositionV4');
      return saved ? JSON.parse(saved) : { x: 0, y: 0 };
    } catch { return { x: 0, y: 0 }; }
  });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, initialX: 0, initialY: 0, dragged: false });

  useEffect(() => { localStorage.setItem('maidPositionV4', JSON.stringify(position)); }, [position]);

  const handleMouseDown = (e) => {
    if (e.target.closest('.no-drag')) return;
    setIsDragging(true);
    dragRef.current.dragged = false;
    dragRef.current.startX = e.clientX || (e.touches ? e.touches[0].clientX : 0);
    dragRef.current.startY = e.clientY || (e.touches ? e.touches[0].clientY : 0);
    dragRef.current.initialX = position.x;
    dragRef.current.initialY = position.y;
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      const clientX = e.clientX || (e.touches ? e.touches[0].clientX : 0);
      const clientY = e.clientY || (e.touches ? e.touches[0].clientY : 0);
      setPosition({ x: dragRef.current.initialX + (clientX - dragRef.current.startX), y: dragRef.current.initialY + (clientY - dragRef.current.startY) });
      if (Math.abs(clientX - dragRef.current.startX) > 5 || Math.abs(clientY - dragRef.current.startY) > 5) dragRef.current.dragged = true;
    };
    const handleMouseUp = () => setIsDragging(false);
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const [pRet, tRet] = await Promise.all([
          supabase.from('portfolios').select('ticker, shares, average_buy_price'),
          supabase.from('transactions').select('*').order('created_at', { ascending: false }).limit(10),
        ]);
        setPortfolioData(pRet.data || []);
        setTransactionsData(tRet.data || []);

        if (FINNHUB_API_KEY && pRet.data?.length > 0) {
          const symbols = [...new Set(pRet.data.map(p => p.ticker))];
          const quotes = {};
          await Promise.all(symbols.map(async (s) => {
            try {
              const r = await fetch(`https://finnhub.io/api/v1/quote?symbol=${s}&token=${FINNHUB_API_KEY}`);
              const d = await r.json();
              if (d.c) quotes[s] = d.c;
            } catch (e) {}
          }));
          setLiveQuotes(quotes);
        }
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchData();
    const inv = setInterval(fetchData, 60000);
    return () => clearInterval(inv);
  }, []);

  const executeTrade = async (tradeData, messageId) => {
    setIsTyping("Dạ, tôi đang ghi sổ lệnh cho Ngài...");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const payload = {
      user_id: user.id,
      ticker: tradeData.ticker,
      type: tradeData.type,
      shares_quantity: Number(tradeData.shares),
      price_per_share: Number(tradeData.price),
      amount: Number(tradeData.shares) * Number(tradeData.price),
      status: 'completed',
      note: 'Lệnh thực hiện thông qua Executive AI Controller (v4.9)'
    };

    const { error } = await supabase.from('transactions').insert([payload]);
    
    setMessages(prev => prev.map(m => m.id === messageId ? { ...m, tradeExecuted: true, tradeStatus: error ? 'error' : 'success' } : m));
    
    if (!error) {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'ai',
        text: `Dạ thưa Ngài, tôi đã thực thi lệnh **${tradeData.type} ${tradeData.shares} ${tradeData.ticker}** thành công ạ. Nhật ký và Danh mục của Ngài đã được cập nhật.`,
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      }]);
      setPendingTrade(null);
      fetchData(); // Refresh local data
    }
    setIsTyping(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const cancelTrade = () => {
    setPendingTrade(null);
    setMessages(prev => [...prev, {
      id: Date.now(),
      sender: 'ai',
      text: "Dạ thưa Ngài, tôi đã hủy lệnh theo yêu cầu của Ngài ạ. Tôi luôn sẵn sàng đợi lệnh mới.",
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    }]);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleSend = async (e, manualQuery = null) => {
    if (e) e.preventDefault();
    const query = manualQuery || input.trim();
    if (!query || isTyping) return;

    // v4.17: Strict NL Confirmation "Xác nhận mua"
    if (query.toLowerCase() === 'xác nhận mua' && pendingTrade) {
      setMessages(prev => [...prev, { id: Date.now(), sender: 'user', text: query, timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) }]);
      setInput('');
      executeTrade(pendingTrade.data, pendingTrade.msgId);
      return;
    }

    setMessages(prev => [...prev, { id: Date.now(), sender: 'user', text: query, timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) }]);
    if (!manualQuery) setInput('');
    setIsTyping("Dạ, tôi đang chuẩn bị báo cáo...");
    setApiStatus('busy');

    try {
      const ctx = { 
        portfolio: portfolioData, 
        transactions: transactionsData, 
        currentPage: location.pathname, 
        liveQuotes,
        reportStats: reportStatsRef.current
      };
      
      const res = await internalAiService.askMaid(query, ctx, (s) => setIsTyping(s));
      let { json, provider } = res;
      
      // TICKER VALIDATION (v4.12)
      if (json.action === 'trade' && json.data?.ticker) {
          const ticker = json.data.ticker.toUpperCase();
          setIsTyping(`Dạ, tôi đang kiểm tra mã ${ticker} trên sàn Nasdaq cho Ngài...`);
          try {
              const [sRes, qRes] = await Promise.all([
                  fetch(`https://finnhub.io/api/v1/search?q=${ticker}&token=${FINNHUB_API_KEY}`),
                  fetch(`https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${FINNHUB_API_KEY}`)
              ]);
              
              if (sRes.status === 429 || qRes.status === 429) {
                  setMessages(prev => [...prev, { id: Date.now() + 50, sender: 'ai', text: "Dạ thưa Ngài, hệ thống đang nghẽn, tôi sẽ thử lấy lại dữ liệu trong 5 giây tới ạ.", timestamp: new Date().toLocaleTimeString() }]);
                  return;
              }

              const sData = await sRes.json();
              const qData = await qRes.json();

              const verified = sData.count > 0 && sData.result.some(r => r.symbol === ticker);
              
              if (!verified) {
                  json.action = 'none';
                  json.status = 'invalid';
                  json.response = `Dạ thưa Ngài, mã **${ticker}** không tồn tại trên hệ thống niêm yết. Ngài vui lòng kiểm tra lại ạ!`;
              } else {
                  json.status = 'valid';
                  json.data.is_verified = true;
                  json.data.current_price = qData.c || json.data.price;
                  json.data.change_percent = qData.dp ? `${qData.dp > 0 ? '+' : ''}${qData.dp.toFixed(2)}%` : "0%";
                  json.response = `Tôi đã kiểm tra trên sàn niêm yết, mã **${ticker}** hoàn toàn hợp lệ để Ngài giải ngân với giá thị trường hiện tại là **$${json.data.current_price}** (${json.data.change_percent}). ${json.response}`;
              }
          } catch (e) {
              console.error("Validation error:", e);
          }
      }

      // GROWTH ADVISORY (v4.12)
      if (/(nên mua gì|mã nào đang tăng|gợi ý|đầu tư gì)/i.test(query.toLowerCase()) || json.action === 'suggestion') {
          setIsTyping("Dạ, tôi đang rà soát các mã tăng trưởng tốt nhất cho Ngài...");
          const watchlist = ['AAPL', 'MSFT', 'TSLA', 'NVDA', 'AMZN', 'GOOGL', 'META', 'NFLX'];
          const stocks = [];
          await Promise.all(watchlist.map(async (s) => {
              try {
                  const r = await fetch(`https://finnhub.io/api/v1/quote?symbol=${s}&token=${FINNHUB_API_KEY}`);
                  const d = await r.json();
                  if (d.c) stocks.push({ ticker: s, dp: d.dp || 0, c: d.c });
              } catch (e) {}
          }));
          const top = stocks.sort((a, b) => b.dp - a.dp)[0];
          if (top) {
              json.action = 'suggestion';
              json.status = 'valid';
              json.data = { ticker: top.ticker, current_price: top.c, change_percent: `${top.dp > 0 ? '+' : ''}${top.dp.toFixed(2)}%` };
              json.response = `Dạ thưa Ngài, hiện tại mã **${top.ticker}** đang dẫn đầu phiên với mức tăng **${json.data.change_percent}**, giá khớp là **$${top.current_price}**. Ngài có muốn tôi đưa Ngài đến trang Đầu tư để xem biểu đồ không ạ?`;
          }
      }

      // Handle Actions (v4.16 - Full Route Sync)
      if (json.action === 'navigate' || (json.response && json.response.includes('đưa Ngài đến trang'))) {
        let pageKey = json.page || '';
        
        // Manual Keyword detection if pageKey is missing
        if (!pageKey && json.response) {
            if (json.response.includes('Giao dịch')) pageKey = 'transactions';
            else if (json.response.includes('Danh mục')) pageKey = 'portfolio';
            else if (json.response.includes('Đầu tư')) pageKey = 'investments';
            else if (json.response.includes('Trợ lý') || json.response.includes('AI')) pageKey = 'ai_advisor';
            else pageKey = 'dashboard';
        }

        const pathMap = { 
            dashboard: '/', 
            transactions: '/transactions', 
            trading: '/transactions', 
            portfolio: '/portfolio', 
            investments: '/investments',
            ai_advisor: '/ai-advisor',
            ai: '/ai-advisor',
            budget: '/budget', 
            news: '/news' 
        };
        const targetPath = pathMap[pageKey.toLowerCase()];
        if (targetPath) {
          navigate(targetPath);
          if (json.action !== 'navigate') {
              json.response += `\n\n*(Tôi đã nhận diện ý định và đưa Ngài đến trang **${pageKey.toUpperCase()}** ạ.)*`;
          }
        }
      }

      const displayResponse = typeof json.response === 'string' ? json.response : JSON.stringify(json.response || "Dạ, tôi chưa rõ ý định của Ngài.");

      setMessages(prev => {
        const newMsgId = Date.now() + 1;
        if (json.action === 'trade' && json.status === 'valid') {
            setPendingTrade({ data: json.data, msgId: newMsgId });
        }
        return [...prev, {
            id: newMsgId,
            sender: 'ai',
            text: displayResponse,
            provider: provider,
            action: json.action,
            status: json.status,
            tradeData: json.data,
            timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
        }];
      });

      reportStatsRef.current = null;
      setApiStatus('ready');
    } catch (error) {
      console.error("AI Controller Error:", error);
      setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'ai', text: "Dạ thưa Ngài, hệ thống điều khiển đang gặp chút gián đoạn. Xin Ngài thứ lỗi cho tôi ạ.", timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) }]);
      setApiStatus('error');
    } finally { setIsTyping(false); }
  };

  useEffect(() => { if (chatState === 'expanded') bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isTyping]);

  if (chatState === 'closed') {
    return (
      <div 
        onMouseDown={handleMouseDown}
        onClick={() => { if (!dragRef.current.dragged) setChatState('expanded'); }}
        style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
        className={clsx(
          "fixed bottom-8 right-8 z-[100] w-16 h-16 rounded-3xl bg-indigo-600 flex items-center justify-center text-white shadow-[0_0_30px_rgba(99,102,241,0.4)] cursor-grab active:cursor-grabbing hover:scale-110 transition-all border border-white/20 group",
          isDragging && "opacity-80 scale-95"
        )}
      >
        <Bot className="w-8 h-8 group-hover:rotate-12 transition-transform" />
      </div>
    );
  }

  return (
    <div 
      style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
      className={clsx(
        "fixed right-10 z-[100] flex flex-col glass-panel shadow-[0_40px_100px_rgba(0,0,0,0.8)] transition-all duration-500 overflow-hidden",
        chatState === 'expanded' ? "bottom-10 w-[520px] h-[720px] opacity-100 scale-100" : "bottom-10 w-0 h-0 opacity-0 scale-90",
        isDragging && "border-indigo-500/50"
      )}
    >
      <header onMouseDown={handleMouseDown} className="flex justify-between items-center px-8 py-6 bg-gradient-to-r from-navy-dark to-slate-900 border-b border-white/5 shrink-0 cursor-move">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-600/10 rounded-2xl border border-indigo-600/30">
            <Sparkles className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
             <span className="font-black text-white text-base tracking-tight italic uppercase">Executive Controller v4.9</span>
             <p className="text-[9px] text-primary font-bold uppercase tracking-[0.2em] mt-0.5">Senior Financial AI</p>
          </div>
        </div>
        <button onClick={() => setChatState('closed')} className="p-2.5 hover:bg-white/5 text-slate-500 rounded-xl transition-all no-drag"><X className="w-5 h-5"/></button>
      </header>

      <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-black/40 backdrop-blur-3xl custom-scrollbar scroll-smooth">
        {messages.map((msg) => (
          <div key={msg.id} className={clsx('flex flex-col max-w-[92%]', msg.sender === 'user' ? 'ml-auto items-end' : 'mr-auto items-start')}>
            <div className={clsx(
              'px-6 py-4 text-sm leading-relaxed shadow-2xl relative group',
              msg.sender === 'user' 
                ? 'bg-indigo-600 text-white rounded-3xl rounded-tr-none' 
                : 'bg-navy-dark text-slate-100 rounded-3xl rounded-tl-none border border-white/10'
            )}>
               {msg.sender === 'ai' && <div className="absolute -top-3 -left-3 p-1.5 bg-indigo-600 rounded-full border-2 border-navy-dark"><Sparkles className="w-3 h-3 text-white"/></div>}
               <div className="prose prose-invert prose-sm" dangerouslySetInnerHTML={renderMarkdown(msg.text)} />
               
               {/* ACTION CARDS (v4.9) */}
               {msg.action === 'trade' && !msg.tradeExecuted && (
                 <div className="mt-6 p-5 bg-slate-950/80 rounded-2xl border border-indigo-500/30 space-y-4 animate-slide-up">
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-2">
                          <ShoppingCart size={16} className="text-indigo-400" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Xác nhận lệnh {msg.status === 'valid' ? '✓' : '✗'}</span>
                       </div>
                       <div className="flex items-center gap-2">
                          {msg.tradeData.change_percent && (
                            <span className={clsx("text-[9px] font-black px-2 py-0.5 rounded-full", msg.tradeData.change_percent.startsWith('+') ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400")}>
                              {msg.tradeData.change_percent}
                            </span>
                          )}
                          <span className={clsx("px-2 py-1 rounded text-[8px] font-bold", msg.tradeData.type === 'BUY' ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400")}>{msg.tradeData.type}</span>
                       </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 py-2">
                       <div className="text-center"><p className="text-[8px] text-slate-500 font-bold uppercase">Ticker</p><p className="font-black text-white text-sm tracking-tighter">{msg.tradeData.ticker}</p></div>
                       <div className="text-center"><p className="text-[8px] text-slate-500 font-bold uppercase">Qty</p><p className="font-black text-white text-sm tracking-tighter">{msg.tradeData.shares}</p></div>
                       <div className="text-center"><p className="text-[8px] text-slate-500 font-bold uppercase">Price</p><p className="font-black text-white text-sm tracking-tighter">${msg.tradeData.price}</p></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-4">
                       <button 
                         onClick={() => executeTrade(msg.tradeData, msg.id)}
                         disabled={!pendingTrade || pendingTrade.msgId !== msg.id}
                         className="py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-900/40 transition-all flex items-center justify-center gap-2"
                       >
                         <Check size={14} /> Thực thi ngay
                       </button>
                       <button 
                         onClick={cancelTrade}
                         disabled={!pendingTrade || pendingTrade.msgId !== msg.id}
                         className="py-3 bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-400 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/5 transition-all flex items-center justify-center gap-2"
                       >
                         <X size={14} /> Hủy lệnh
                       </button>
                    </div>
                 </div>
               )}
               
               {msg.action === 'navigate' && (
                 <div className="mt-4 flex items-center gap-2 px-4 py-2 bg-indigo-600/10 border border-indigo-500/20 rounded-xl">
                    <Navigation size={12} className="text-indigo-400" />
                    <span className="text-[9px] font-black text-indigo-300 uppercase italic">Đang điều hướng đến {msg.page || 'Trang đích'}...</span>
                 </div>
               )}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex items-center gap-3 bg-navy-dark/80 p-5 rounded-3xl rounded-tl-none mr-auto border border-white/10 shadow-xl animate-pulse">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            <span className="text-[10px] italic text-primary font-bold uppercase tracking-widest">{isTyping}</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="p-8 bg-navy-dark/95 border-t border-white/5">
        <form onSubmit={handleSend} className="relative flex items-center group">
          <input 
            ref={inputRef}
            type="text" value={input} onChange={(e) => setInput(e.target.value)}
            placeholder="Thưa Ngài, tôi đang đợi lệnh từ Ngài..." disabled={isTyping}
            className="w-full bg-white/5 border border-white/5 rounded-2xl py-5 px-8 pr-16 text-sm focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 text-white transition-all shadow-inner font-medium placeholder:text-slate-600"
          />
          <button type="submit" disabled={isTyping || !input.trim()} className="absolute right-2 p-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all disabled:opacity-50 active:scale-95 shadow-lg"><Send className="w-5 h-5"/></button>
        </form>
      </div>
    </div>
  );
}
