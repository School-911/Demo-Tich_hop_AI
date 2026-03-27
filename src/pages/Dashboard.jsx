import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Wallet, 
  Activity, 
  TrendingUp, 
  CreditCard, 
  PieChart as PieIcon,
  CircleDot,
  AlertCircle,
  FileText,
  Loader2,
  TrendingDown
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from 'recharts';
import { supabase } from '../services/supabaseClient';
import clsx from 'clsx';

const FINNHUB_API_KEY = import.meta.env.VITE_FINNHUB_API_KEY;

export default function Dashboard() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState('');
  const [portfolios, setPortfolios] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [liveQuotes, setLiveQuotes] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [apiStatus, setApiStatus] = useState('connecting'); // 'connecting', 'live', 'rate-limited'
  const [isLive, setIsLive] = useState(false);

  const fetchMarketData = async (portfolioData) => {
    if (!FINNHUB_API_KEY) {
      console.error("Vui lòng kiểm tra lại API Key Finnhub trong file .env.local");
      setApiStatus('rate-limited');
      return;
    }

    if (portfolioData.length === 0) {
      setApiStatus('live');
      setIsLive(true);
      return;
    }

    setIsRefreshing(true);
    try {
      const symbols = [...new Set(portfolioData.map(p => p.ticker))];
      const quotes = { ...liveQuotes };
      let hasError = false;

      let successCount = 0;
      let totalTickers = symbols.length;

      await Promise.all(symbols.map(async (s) => {
        try {
          const r = await fetch(`https://finnhub.io/api/v1/quote?symbol=${s}&token=${FINNHUB_API_KEY}`);
          if (r.status === 429) {
            setApiStatus('rate-limited');
            throw new Error("Rate limited by Finnhub");
          }
          const d = await r.json();
          if (d.c && d.c > 0) {
            quotes[s] = d.c;
            successCount++;
          } else {
            console.warn(`Dữ liệu mã ${s} không khả dụng trên Finnhub Free Tier, Ngài vui lòng kiểm tra lại.`);
          }
        } catch (e) { 
          console.error(`Finnhub error for ${s}:`, e);
        }
      }));

      setLiveQuotes(quotes);
      // v4.13: Only go offline if NO tickers worked OR we got a 429
      const fullyOffline = totalTickers > 0 && successCount === 0;
      setApiStatus(fullyOffline ? 'rate-limited' : 'live');
      setIsLive(!fullyOffline);
    } catch (err) {
      console.error("Dashboard market data fetch error:", err);
      setApiStatus('rate-limited');
      setIsLive(false);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    const initDashboard = async () => {
      setIsLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserName(user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Chủ nhân');
          
          const [pRet, tRet] = await Promise.all([
            supabase.from('portfolios').select('id, ticker, company_name, shares, average_buy_price'),
            supabase.from('transactions').select('*').order('created_at', { ascending: false }).limit(20)
          ]);

          const portfolioData = pRet.data || [];
          setPortfolios(portfolioData);
          setTransactions(tRet.data || []);

          await fetchMarketData(portfolioData);
        }
      } catch (err) {
        console.error("Dashboard init error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    initDashboard();
  }, []);

  // Set interval for every 30 seconds
  useEffect(() => {
    if (portfolios.length > 0) {
      const interval = setInterval(() => {
        fetchMarketData(portfolios);
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [portfolios]);

  const reconnectFinnhub = () => {
    fetchMarketData(portfolios);
  };

  // Net Worth & P/L Calculation
  const stats = useMemo(() => {
    let totalValue = 0;
    let totalCost = 0;
    
    const performers = portfolios.map(p => {
      const isLive = !!liveQuotes[p.ticker];
      const currentPrice = isLive ? liveQuotes[p.ticker] : p.average_buy_price; 
      const value = p.shares * currentPrice;
      const cost = p.shares * p.average_buy_price;
      const profit = value - cost;
      const profitPercent = cost > 0 ? (profit / cost) * 100 : 0;
      
      totalValue += value;
      totalCost += cost;
      
      return { ...p, currentPrice, value, profit, profitPercent, isLive };
    });

    const totalProfit = totalValue - totalCost;
    const totalProfitPercent = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0;

    const sortedPerformers = [...performers].sort((a, b) => b.profitPercent - a.profitPercent);
    const topGainer = sortedPerformers[0];
    const topLoser = sortedPerformers[sortedPerformers.length - 1];

    return { totalValue, totalProfit, totalProfitPercent, topGainer, topLoser, performers };
  }, [portfolios, liveQuotes]);

  const handleGenerateReport = () => {
    const event = new CustomEvent('generateAiReport', { 
      detail: { 
        stats,
        message: "Chủ nhân yêu cầu xuất bản tin chiến lược dựa trên dữ liệu thật." 
      } 
    });
    window.dispatchEvent(event);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <p className="text-textMuted animate-pulse font-medium italic">Đang tải dữ liệu từ Supabase...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12 animate-fade-in">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-black text-white tracking-tighter">FinAI Executive</h1>
            <div 
              onClick={reconnectFinnhub}
              className={clsx(
                "flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border cursor-pointer hover:bg-white/5 transition-all",
                isLive ? "bg-success/10 text-success border-success/20" : "bg-warning/10 text-warning border-warning/20"
              )}
            >
              <div className={clsx(
                "w-2 h-2 rounded-full", 
                isLive ? "bg-success animate-pulse" : "bg-warning",
                isRefreshing && "animate-spin"
              )} />
              {isRefreshing ? "REFRESHING..." : (apiStatus === 'rate-limited' ? "OFFLINE DATA" : "MARKET LIVE")}
            </div>
          </div>
          <p className="text-textMuted mt-2 font-medium italic">Kính chào Chủ nhân {userName}, em đã sẵn sàng phục vụ.</p>
        </div>
        <button 
          onClick={handleGenerateReport}
          className="flex items-center gap-3 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[2rem] shadow-2xl shadow-indigo-600/20 transition-all font-black text-sm active:scale-95"
        >
          <FileText className="w-5 h-5" /> 
          generating report
        </button>
      </header>

      {/* Bento Grid Stats */}
      <div className="bento-grid">
        {/* Main Asset Card */}
        <div className="glass-panel p-10 bento-item-large flex flex-col justify-between group relative overflow-hidden rounded-[2.5rem]">
           <div className="absolute -top-10 -right-10 w-64 h-64 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all"></div>
           <div>
              <div className="flex items-center gap-3 text-textMuted mb-3">
                <Wallet className="w-6 h-6 text-primary" />
                <h3 className="font-black text-xs tracking-widest uppercase">Tổng Giá Trị Tài Sản</h3>
              </div>
              <h2 className="text-6xl font-black text-white tracking-tighter">
                ${stats.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </h2>
           </div>
           <div className="flex items-center gap-8 mt-10">
              <div className="flex flex-col gap-1">
                 <span className="text-[10px] text-textMuted font-black uppercase tracking-widest">Lợi Nhuận (P/L)</span>
                 <div className={clsx("flex items-center gap-1.5 font-black text-2xl", stats.totalProfit >= 0 ? "text-success" : "text-danger")}>
                    {stats.totalProfit >= 0 ? <ArrowUpRight className="w-6 h-6"/> : <ArrowDownRight className="w-6 h-6"/>}
                    ${Math.abs(stats.totalProfit).toLocaleString()}
                 </div>
              </div>
              <div className="w-px h-12 bg-white/10"></div>
              <div className="flex flex-col gap-1">
                 <span className="text-[10px] text-textMuted font-black uppercase tracking-widest">Tỉ suất lợi nhuận</span>
                 <div className={clsx("font-black text-2xl", stats.totalProfit >= 0 ? "text-success" : "text-danger")}>
                    {stats.totalProfit >= 0 ? '+' : '-'}{Math.abs(stats.totalProfitPercent).toFixed(2)}%
                 </div>
              </div>
           </div>
        </div>

        {/* Growth Card */}
        <div className="glass-panel p-8 flex flex-col justify-between rounded-[2rem] border-success/10 bg-success/[0.03] group">
            <div className="flex justify-between items-start">
               <div className="p-3 bg-success/10 rounded-2xl group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-6 h-6 text-success" />
               </div>
               <span className="text-[9px] font-black text-success uppercase bg-success/10 px-3 py-1 rounded-full">Top Gainer</span>
            </div>
            <div className="mt-6">
                <p className="text-textMuted text-xs font-bold uppercase tracking-widest mb-1">{stats.topGainer?.ticker || 'N/A'}</p>
                <h4 className="text-3xl font-black text-white">+{stats.topGainer?.profitPercent.toFixed(1) || 0}%</h4>
            </div>
            <p className="text-[10px] text-textMuted font-bold mt-4 italic">Xu hướng tăng trưởng tích cực</p>
        </div>

        {/* Risk Card */}
        <div className="glass-panel p-8 flex flex-col justify-between rounded-[2rem] border-danger/10 bg-danger/[0.03] group">
            <div className="flex justify-between items-start">
               <div className="p-3 bg-danger/10 rounded-2xl group-hover:scale-110 transition-transform">
                  <TrendingDown className="w-6 h-6 text-danger" />
               </div>
               <span className="text-[9px] font-black text-danger uppercase bg-danger/10 px-3 py-1 rounded-full">Top Loser</span>
            </div>
            <div className="mt-6">
                <p className="text-textMuted text-xs font-bold uppercase tracking-widest mb-1">{stats.topLoser?.ticker || 'N/A'}</p>
                <h4 className="text-3xl font-black text-white">{stats.topLoser?.profitPercent.toFixed(1) || 0}%</h4>
            </div>
            <p className="text-[10px] text-textMuted font-bold mt-4 italic">Cần phân tích nguyên nhân sụt giảm</p>
        </div>

        {/* Chart Area with Fix: min-height */}
        <div className="glass-panel p-10 lg:col-span-2 rounded-[2.5rem]">
           <div className="flex justify-between items-center mb-10">
              <h3 className="text-xl font-black text-white flex items-center gap-3 uppercase tracking-tighter">
                <Activity className="w-6 h-6 text-primary" /> Hiệu suất đầu tư ròng
              </h3>
           </div>
           {/* Fix for Recharts: min-height on container */}
           <div className="h-[350px] min-h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={[
                  { name: 'Jan', value: stats.totalValue * 0.88 },
                  { name: 'Feb', value: stats.totalValue * 0.95 },
                  { name: 'Tháng này', value: stats.totalValue }
                ]}>
                  <defs>
                    <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="#475569" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis hide />
                  <Tooltip contentStyle={{ backgroundColor: '#0b0f1a', border: 'none', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }} />
                  <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={5} fill="url(#colorVal)" />
                </AreaChart>
              </ResponsiveContainer>
           </div>
        </div>

        {/* Asset Allocation with Fix: min-height */}
        <div className="glass-panel p-10 rounded-[2.5rem]">
           <h3 className="text-xl font-black text-white mb-10 uppercase tracking-tighter flex items-center gap-3">
              <PieIcon className="w-6 h-6 text-secondary" /> Phân bổ tài sản
           </h3>
           <div className="h-[250px] min-h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.performers}
                    cx="50%" cy="50%"
                    innerRadius={70} outerRadius={100}
                    paddingAngle={8}
                    dataKey="value"
                    nameKey="ticker"
                  >
                    {stats.performers.map((_, i) => (
                      <Cell key={i} fill={[ '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899' ][i % 5]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#0b0f1a', border: 'none', borderRadius: '16px' }} />
                </PieChart>
              </ResponsiveContainer>
           </div>
           <div className="space-y-4 mt-10">
              {stats.performers.slice(0, 3).map((p, i) => (
                <div key={p.id} className="flex justify-between items-center text-sm font-bold">
                   <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: [ '#6366f1', '#8b5cf6', '#a855f7' ][i] }}></div>
                      <span className="text-white">{p.ticker}</span>
                   </div>
                   <span className="text-textMuted">{((p.value/stats.totalValue)*100).toFixed(1)}%</span>
                </div>
              ))}
           </div>
        </div>
      </div>

      {/* Portfolio Table */}
      <section className="glass-panel p-10 rounded-[2.5rem] overflow-hidden">
         <h3 className="text-xl font-black text-white mb-10 flex items-center gap-4 uppercase tracking-tighter">
            <TrendingUp className="w-7 h-7 text-primary" /> Chi tiết danh mục nắm giữ
         </h3>
         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead>
                  <tr className="text-textMuted text-[10px] font-black uppercase tracking-[0.2em] border-b border-white/5">
                     <th className="pb-6 px-4">Tài sản (Ticker)</th>
                     <th className="pb-6 px-4 text-right">Số lượng (Shares)</th>
                     <th className="pb-6 px-4 text-right">Giá vốn (Avg)</th>
                     <th className="pb-6 px-4 text-right">Giá hiện tại</th>
                     <th className="pb-6 px-4 text-right">Thị giá (Market Val)</th>
                     <th className="pb-6 px-4 text-right">Lời / Lỗ (%)</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-white/5">
                  {stats.performers.map((p) => (
                    <tr key={p.id} className="group hover:bg-white/[0.02] transition-colors">
                       <td className="py-6 px-4">
                          <div className="flex items-center gap-4">
                             <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center font-black text-sm text-primary border border-white/5">
                                {p.ticker.charAt(0)}
                             </div>
                             <div>
                                <p className="font-bold text-base text-white">{p.ticker}</p>
                                <p className="text-[10px] text-textMuted font-bold uppercase tracking-widest">{p.company_name || 'N/A'}</p>
                             </div>
                          </div>
                       </td>
                       <td className="py-6 px-4 text-right font-bold text-white">{p.shares.toLocaleString()}</td>
                       <td className="py-6 px-4 text-right font-bold text-slate-300">${p.average_buy_price.toLocaleString()}</td>
                       <td className="py-6 px-4">
                        <div className="flex flex-col items-end">
                           <span className={clsx("font-black tracking-tighter text-base", p.isLive ? "text-white" : "text-rose-500 animate-pulse")}>
                             ${p.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                           </span>
                           {!p.isLive && <span className="text-[7px] font-black text-rose-500 uppercase tracking-widest mt-0.5 animate-pulse">Invalid / Fallback</span>}
                        </div>
                      </td>
                       <td className="py-6 px-4 text-right font-black text-indigo-400">${p.value.toLocaleString()}</td>
                       <td className="py-6 px-4 text-right">
                          <div className={clsx("inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-black text-xs", p.profit >= 0 ? "bg-success/10 text-success" : "bg-danger/10 text-danger")}>
                             {p.profit >= 0 ? '+' : ''}{p.profitPercent.toFixed(2)}%
                          </div>
                       </td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </section>

      {/* Error Fallback Indicator removed for cleaner Executive UI */}
    </div>
  );
}
