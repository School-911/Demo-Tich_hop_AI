import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Trash2, 
  Loader2, 
  AlertCircle,
  Briefcase,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  PieChart as PieIcon,
  Search,
  RefreshCcw,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip 
} from 'recharts';
import { supabase } from '../services/supabaseClient';
import clsx from 'clsx';

const FINNHUB_API_KEY = import.meta.env.VITE_FINNHUB_API_KEY;

export default function Portfolio() {
  const [portfolios, setPortfolios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [liveQuotes, setLiveQuotes] = useState({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [search, setSearch] = useState('');

  const fetchPortfolioData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('portfolios')
      .select('*')
      .eq('user_id', user.id);
    
    if (!error) setPortfolios(data || []);
  };

  const fetchLiveQuotes = async (symbols) => {
    if (!FINNHUB_API_KEY || symbols.length === 0) {
      if (!FINNHUB_API_KEY) console.error("Vui lòng kiểm tra lại API Key Finnhub.");
      setIsLive(false);
      return;
    }
    
    setIsRefreshing(true);
    try {
      const quotes = { ...liveQuotes };
      let successCount = 0;
      let totalTickers = symbols.length;
      
      await Promise.all(symbols.map(async (s) => {
        try {
          const r = await fetch(`https://finnhub.io/api/v1/quote?symbol=${s}&token=${FINNHUB_API_KEY}`);
          if (r.status === 429) throw new Error("Rate limited");
          const d = await r.json();
          if (d.c && d.c > 0) {
            quotes[s] = d.c;
            successCount++;
          }
        } catch (e) {
          console.error(`Quote error for ${s}:`, e);
        }
      }));
      
      setLiveQuotes(quotes);
      // v4.13: Only go offline if NO tickers worked
      const fullyOffline = totalTickers > 0 && successCount === 0;
      setIsLive(!fullyOffline);
    } catch (err) {
      console.error("Portfolio market data fetch error:", err);
      setIsLive(false);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchPortfolioData();
      setLoading(false);
    };
    init();

    // Listen to real-time additions (Sync from Transactions trigger)
    const channel = supabase
      .channel('portfolio-sync-v4-8')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'portfolios' }, () => {
        fetchPortfolioData();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    if (portfolios.length > 0) {
      const symbols = portfolios.map(p => p.ticker);
      fetchLiveQuotes(symbols);

      const interval = setInterval(() => {
        fetchLiveQuotes(symbols);
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [portfolios.length]);

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
    }).filter(p => p.ticker.toLowerCase().includes(search.toLowerCase()));

    const totalProfit = totalValue - totalCost;
    const totalProfitPercent = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0;

    return { totalValue, totalProfit, totalProfitPercent, performers, totalCost };
  }, [portfolios, liveQuotes, search]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-32 animate-fade-in max-w-[1400px] mx-auto relative px-4">
      {/* Executive Header */}
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-slate-900/40 p-8 rounded-[32px] border border-slate-800 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.2)] animate-pulse">
             <Briefcase className="w-8 h-8 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tighter uppercase">Danh mục Đầu tư</h1>
            <div className="flex items-center gap-3">
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mt-1 italic opacity-60 flex items-center gap-2">
                <ShieldCheck size={12} className="text-success" /> Tự động đồng bộ
              </p>
              <div 
                onClick={() => fetchLiveQuotes(portfolios.map(p => p.ticker))}
                className={clsx(
                  "flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border cursor-pointer",
                  isLive ? "bg-success/10 text-success border-success/20" : "bg-warning/10 text-warning border-warning/20"
                )}
              >
                <div className={clsx("w-1.5 h-1.5 rounded-full", isLive ? "bg-success animate-pulse" : "bg-warning", isRefreshing && "animate-spin")} />
                {isRefreshing ? "REFRESHING" : (isLive ? "MARKET LIVE" : "OFFLINE DATA")}
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-64 group">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary" />
            <input 
              type="text" 
              placeholder="Tìm mã cổ phiếu..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl focus:outline-none focus:border-primary text-sm font-medium text-white shadow-inner"
            />
          </div>
          <button 
            onClick={() => fetchLiveQuotes(portfolios.map(p => p.ticker))}
            className={clsx(
              "p-3.5 bg-slate-950 border border-slate-800 rounded-2xl text-slate-400 hover:text-white transition-all",
              isRefreshing && "animate-spin text-primary border-primary/50"
            )}
            title="Làm mới giá Live"
          >
            <RefreshCcw size={18} />
          </button>
        </div>
      </header>

      {/* Main Stats Cards (Executive Standard) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         <div className="bg-slate-900/50 p-10 rounded-[40px] border border-slate-800 relative overflow-hidden group backdrop-blur-3xl">
            <div className="absolute top-0 right-0 p-8 opacity-5">
               <Activity size={120} className="text-primary" />
            </div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4">Tổng giá trị thị trường</p>
            <h2 className="text-7xl font-black text-white tracking-tighter mb-8 group-hover:scale-105 transition-transform origin-left">
              ${stats.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </h2>
            <div className="flex items-center gap-10 border-t border-white/5 pt-8">
               <div className="flex flex-col gap-2">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Lợi nhuận ròng</span>
                  <div className={clsx("flex items-center gap-1.5 font-black text-2xl", stats.totalProfit >= 0 ? "text-emerald-400" : "text-rose-400")}>
                    {stats.totalProfit >= 0 ? <TrendingUp size={24}/> : <TrendingDown size={24}/>}
                    ${Math.abs(stats.totalProfit).toLocaleString()}
                  </div>
               </div>
               <div className="w-px h-12 bg-white/10"></div>
               <div className="flex flex-col gap-2">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Hiệu suất ròng</span>
                  <div className={clsx("font-black text-2xl", stats.totalProfit >= 0 ? "text-emerald-400" : "text-rose-400")}>
                    {stats.totalProfit >= 0 ? '+' : '-'}{Math.abs(stats.totalProfitPercent).toFixed(2)}%
                  </div>
               </div>
            </div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-panel p-8 rounded-[32px] flex flex-col justify-between group">
               <div className="flex justify-between items-start">
                  <div className="p-4 bg-indigo-500/10 rounded-2xl group-hover:scale-110 transition-transform">
                     <Zap className="w-6 h-6 text-indigo-400" />
                  </div>
                  <span className="text-[8px] font-black text-indigo-400 uppercase bg-indigo-500/10 px-3 py-1.5 rounded-full border border-indigo-500/20 tracking-tighter">Real-time Data</span>
               </div>
               <div className="mt-8">
                  <p className="text-slate-500 text-[9px] font-black uppercase tracking-widest mb-1 italic">Tổng vốn đầu tư</p>
                  <h4 className="text-3xl font-black text-white tracking-tight">${stats.totalCost.toLocaleString()}</h4>
               </div>
            </div>

            <div className="glass-panel p-8 rounded-[32px] flex flex-col justify-between group overflow-hidden relative">
               <div className="absolute -bottom-4 -right-4 opacity-5 group-hover:scale-125 transition-transform">
                  <PieIcon size={120} className="text-primary" />
               </div>
               <div className="flex items-center gap-3">
                  <div className="p-4 bg-primary/10 rounded-2xl">
                     <PieIcon className="w-6 h-6 text-primary" />
                  </div>
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Phân bổ mã</span>
               </div>
               <div className="h-32 w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.performers}
                        cx="50%" cy="50%"
                        innerRadius={35} outerRadius={50}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {stats.performers.map((_, i) => (
                          <Cell key={i} fill={[ '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899' ][i % 5]} stroke="none" />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
               </div>
            </div>
         </div>
      </div>

      {/* Holder Table (Executive Style) */}
      <div className="bg-slate-900/50 rounded-[40px] overflow-hidden border border-slate-800 backdrop-blur-xl shadow-2xl">
        <div className="p-8 border-b border-white/5 flex items-center gap-3">
           <Zap className="w-5 h-5 text-indigo-400 fill-indigo-400/20" />
           <h3 className="text-lg font-black text-white tracking-widest uppercase italic">Chi tiết nắm giữ</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5 text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">
                <th className="py-8 px-10 italic">Mã cổ phiếu</th>
                <th className="py-8 px-6 text-right">Số lượng</th>
                <th className="py-8 px-6 text-right">Giá vốn TB ($)</th>
                <th className="py-8 px-6 text-right">Giá Live ($)</th>
                <th className="py-8 px-6 text-right">Giá trị thị trường</th>
                <th className="py-8 px-10 text-right">Lãi / Lỗ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {stats.performers.length > 0 ? stats.performers.map((p) => (
                <tr 
                  key={p.id} 
                  className="group hover:bg-slate-800/40 transition-all hover:scale-[1.005] origin-center"
                >
                  <td className="py-6 px-10">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-slate-950 flex items-center justify-center font-black text-base text-primary border border-slate-800 shadow-inner group-hover:scale-110 transition-transform">
                        {p.ticker.charAt(0)}
                      </div>
                      <div>
                        <p className="font-black text-white text-base tracking-tighter group-hover:text-primary transition-colors">{p.ticker}</p>
                        <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest leading-none mt-1">{p.company_name || 'Asset Holdings'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-6 px-6 text-right font-bold text-slate-300">{p.shares.toLocaleString()} CP</td>
                  <td className="py-6 px-6 text-right font-medium text-slate-500">${p.average_buy_price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td className="py-6 px-6 text-right">
                    <div className="flex flex-col items-end">
                       <span className={clsx("font-black text-base underline underline-offset-4 decoration-indigo-400/20", p.isLive ? "text-indigo-400" : "text-rose-500 animate-pulse")}>
                         ${p.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                       </span>
                       {!p.isLive && <span className="text-[7px] font-black text-rose-500 uppercase tracking-widest mt-0.5 animate-pulse">Không hỗ trợ Live / Giá vốn</span>}
                    </div>
                  </td>
                  <td className="py-6 px-6 text-right">
                    <span className="text-white font-black text-base tracking-tighter">
                      ${p.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </td>
                  <td className="py-6 px-10 text-right">
                     <div className={clsx(
                        "inline-flex items-center gap-2 px-4 py-2 rounded-2xl font-black text-xs transition-colors",
                        p.profit >= 0 ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-lg shadow-rose-900/10"
                     )}>
                        {p.profit >= 0 ? <ArrowUpRight size={14}/> : <ArrowDownRight size={14}/>}
                        {p.profitPercent.toFixed(2)}%
                     </div>
                     <p className={clsx(
                        "text-[9px] font-black uppercase tracking-widest mt-2",
                        p.profit >= 0 ? "text-emerald-600" : "text-rose-600"
                     )}>
                       {p.profit >= 0 ? '+' : ''}${Math.abs(p.profit).toLocaleString()}
                     </p>
                  </td>
                </tr>
              )) : (
                <tr>
                   <td colSpan="6" className="py-32 text-center text-slate-500 italic font-medium opacity-50">
                      "Dạ thưa Chủ nhân, danh mục của Ngài hiện đang rỗng ạ. Hãy thực hiện lệnh MUA trong Nhật ký Giao dịch để em ghi nhận tại đây ạ."
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
