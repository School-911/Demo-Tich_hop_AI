import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Info } from 'lucide-react';
import clsx from 'clsx';
import { supabase } from '../services/supabaseClient';
import { financeService } from '../services/financeService';
import { aiService } from '../services/aiService';

const renderMarkdown = (text) => {
  if (!text) return { __html: '' };
  let html = text
    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-primary-100">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^(?:-|\*) (.*)$/gm, '<li class="ml-4 list-disc mt-1">$1</li>');
  html = html.replace(/\n/g, '<br />');
  return { __html: html };
};

export default function AIAdvisor() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: 'Chào sếp! Hệ thống Failover Đa Lõi (Gemini -> OpenAI -> Grok) đã được bọc lót kích hoạt. Bất cứ khi nào 1 AI sập, hệ thống sẽ tự động hoán đổi AI khác cứu viện. Bạn muốn phân tích chuyên sâu về mã cổ phiếu nào?',
      provider: 'Hệ thống Cốt lõi',
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [contextData, setContextData] = useState({ portfolio: [], news: [] });
  const [loadingContext, setLoadingContext] = useState(true);
  const [isTyping, setIsTyping] = useState(false); // Lưu Text Trạng Thái (VD: Đang liên kết OpenAI...)
  const bottomRef = useRef(null);

  useEffect(() => {
    async function fetchContext() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        let portfolioData = [];
        if (user) {
          const { data } = await supabase
            .from('portfolios')
            .select('ticker, shares, average_buy_price')
            .eq('user_id', user.id);
          portfolioData = data || [];
        }
        const newsData = await financeService.getMarketNews();
        setContextData({ portfolio: portfolioData, news: newsData });
      } catch (err) {
        console.error("Error loading AI context:", err);
      } finally {
        setLoadingContext(false);
      }
    }
    fetchContext();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isTyping || loadingContext) return;
    
    const userText = input;
    const newUserMsg = {
      id: Date.now(),
      sender: 'user',
      text: userText,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    };
    
    setMessages(prev => [...prev, newUserMsg]);
    setInput('');
    setIsTyping("Đang khởi động Trí tuệ...");

    try {
      const { text: aiResponseText, provider } = await aiService.askAdvisor(
        userText, 
        contextData.portfolio, 
        contextData.news,
        // Callback lắng nghe trạng thái đổi Models thời gian thực
        (status) => setIsTyping(status)
      );
      
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'ai',
        text: aiResponseText,
        provider: provider,
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
        id: Date.now() + 2,
        sender: 'ai',
        text: `**Cảnh báo Đỏ:** ${error.message}`,
        provider: 'System',
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] animate-fade-in relative">
      <header className="mb-6 flex justify-between items-end border-b border-slate-700/50 pb-4">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-secondary to-primary flex items-center gap-3">
            <Bot className="w-8 h-8 text-secondary" /> Cố Vấn Tối Thượng
          </h1>
          <p className="text-textMuted mt-1">Hỗ trợ Failover: Gemini x ChatGPT x Grok</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          {loadingContext ? (
            <span className="text-xs text-textMuted flex items-center gap-2 bg-surface p-2 rounded-lg">
              <Loader2 className="w-4 h-4 animate-spin text-primary" /> Đang cập nhật dữ liệu...
            </span>
          ) : (
            <span className="text-xs text-success flex items-center gap-1 bg-success/10 border border-success/20 p-2 rounded-lg font-medium">
              <Info className="w-4 h-4" /> Băng thông Dữ liệu Ổn định
            </span>
          )}
        </div>
      </header>

      <div className="flex-1 glass-panel flex flex-col overflow-hidden relative z-10">
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div key={msg.id} className={clsx('flex gap-4 max-w-[85%]', isUser ? 'ml-auto flex-row-reverse' : 'mr-auto')}>
                <div className={clsx('w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-md border', isUser ? 'bg-primary/20 text-primary border-primary/30' : 'bg-secondary/20 text-secondary border-secondary/30')}>
                  {isUser ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                </div>
                <div className={clsx('p-4 rounded-2xl shadow-sm text-[15px] leading-relaxed relative', isUser ? 'bg-primary/90 text-white rounded-tr-sm' : 'bg-surface border border-slate-700 rounded-tl-sm text-slate-200')}>
                  {isUser ? (
                    <span className="whitespace-pre-wrap">{msg.text}</span>
                  ) : (
                    <div dangerouslySetInnerHTML={renderMarkdown(msg.text)} />
                  )}
                  
                  <div className="flex items-center justify-between mt-3">
                    {msg.provider && !isUser && (
                       <span className="text-[10px] text-secondary/90 font-mono tracking-wide px-1.5 py-0.5 bg-secondary/10 rounded border border-secondary/20">
                         Nguồn: {msg.provider}
                       </span>
                    )}
                    <span className={clsx('text-[10px] font-medium ml-auto', isUser ? 'text-blue-200 opacity-80' : 'text-slate-500')}>
                      {msg.timestamp}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
          
          {isTyping && (
            <div className="flex gap-4 max-w-[80%] mr-auto animate-fade-in">
              <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-md border bg-secondary/20 text-secondary border-secondary/30">
                <Bot className="w-5 h-5" />
              </div>
              <div className="p-4 rounded-2xl bg-surface border border-slate-700 rounded-tl-sm flex items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-secondary" />
                <span className="text-sm font-medium text-secondary animate-pulse">
                  {typeof isTyping === 'string' ? `Đang trả lời bởi ${isTyping}...` : "AI đang suy nghĩ..."}
                </span>
              </div>
            </div>
          )}
          <div ref={bottomRef} className="h-4" />
        </div>

        <div className="p-4 bg-slate-900/60 border-t border-slate-700/50">
          <form onSubmit={handleSend} className="relative flex items-center">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={loadingContext ? "Chờ khôi phục Database..." : "Gửi câu hỏi tới liên minh AI..."}
              disabled={loadingContext || !!isTyping}
              className="w-full bg-surface hover:bg-surfaceHover border border-slate-600 rounded-full py-4 pl-6 pr-14 focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-all disabled:opacity-50 text-white"
            />
            <button 
              type="submit" 
              disabled={loadingContext || !!isTyping || !input.trim()}
              className="absolute right-2 p-3 bg-secondary hover:bg-secondary/90 text-white rounded-full transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 shadow-[0_0_15px_rgba(168,85,247,0.4)]"
            >
              <Send className="w-5 h-5 -ml-1 mt-0.5" /> 
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
