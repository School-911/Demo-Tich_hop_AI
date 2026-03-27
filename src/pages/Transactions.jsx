import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Plus, 
  X, 
  TrendingUp, 
  TrendingDown, 
  Wallet,
  CheckCircle2,
  Clock,
  Loader2,
  Activity,
  ArrowDown,
  ArrowUp,
  History,
  Check,
  AlertCircle
} from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import clsx from 'clsx';

export default function Transactions() {
  const [txs, setTxs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all'); 
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState(null); // { message: string, type: 'success' | 'error' }
  
  // Trading Form State (Matching SQL Schema v4.7)
  const [formData, setFormData] = useState({ 
    ticker: '', 
    shares_quantity: '', 
    price_per_share: '', 
    amount: 0,
    type: 'BUY', 
    status: 'completed', 
    note: ''
  });

  const fetchTransactions = async () => {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error) setTxs(data || []);
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchTransactions();
      setLoading(false);
    };

    init();

    // Real-time Subscription (v4.7)
    const channel = supabase
      .channel('trading-journal-v4-7')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setTxs(prev => [payload.new, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setTxs(prev => prev.map(t => t.id === payload.new.id ? payload.new : t));
        } else if (payload.eventType === 'DELETE') {
          setTxs(prev => prev.filter(t => t.id === payload.old.id));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // Auto-calculation logic for the form
  useEffect(() => {
    const qty = Number(formData.shares_quantity) || 0;
    const price = Number(formData.price_per_share) || 0;
    setFormData(prev => ({ ...prev, amount: qty * price }));
  }, [formData.shares_quantity, formData.price_per_share]);

  // Filtered Trading Data & Stats
  const { filteredTxs, stats } = useMemo(() => {
    const filtered = txs.filter(t => {
      const matchSearch = t.ticker.toLowerCase().includes(search.toLowerCase());
      const matchType = typeFilter === 'all' || t.type === typeFilter;
      return matchSearch && matchType;
    });

    const invested = txs.filter(t => t.type === 'BUY').reduce((sum, t) => sum + Number(t.amount || 0), 0);
    const proceeds = txs.filter(t => t.type === 'SELL').reduce((sum, t) => sum + Number(t.amount || 0), 0);
    
    return { 
      filteredTxs: filtered, 
      stats: { invested, proceeds, count: txs.length } 
    };
  }, [txs, search, typeFilter]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Chưa đăng nhập");

      const payload = { 
        ...formData, 
        user_id: user.id, 
        shares_quantity: Number(formData.shares_quantity), 
        price_per_share: Number(formData.price_per_share), 
        amount: Number(formData.amount) 
      };
      
      const { error } = await supabase.from('transactions').insert([payload]);

      if (!error) {
        showToast("Thêm giao dịch thành công thưa Chủ nhân!");
        setIsModalOpen(false);
        setFormData({ ticker: '', shares_quantity: '', price_per_share: '', amount: 0, type: 'BUY', status: 'completed', note: '' });
        fetchTransactions(); // Backup refresh
      } else {
        showToast("Dạ, có lỗi xảy ra: " + error.message, 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20 animate-fade-in max-w-[1400px] mx-auto relative">
      {/* Toast Notification */}
      {toast && (
        <div className={clsx(
          "fixed top-24 left-1/2 -translate-x-1/2 z-[300] px-8 py-4 rounded-2xl shadow-2xl border flex items-center gap-3 animate-slide-down backdrop-blur-xl",
          toast.type === 'success' ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" : "bg-rose-500/20 border-rose-500/30 text-rose-400"
        )}>
          {toast.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <span className="font-bold text-sm tracking-tight">{toast.message}</span>
        </div>
      )}

      {/* Header Toolbar (LOCALIZED) */}
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-slate-900/40 p-8 rounded-[32px] border border-slate-800 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
             <History className="w-8 h-8 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tighter uppercase">Nhật ký Giao dịch</h1>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mt-1 italic opacity-60">Executive Trading Journal (v4.7)</p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-64 group">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              placeholder="Tìm theo mã..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl focus:outline-none focus:border-primary transition-all text-sm font-medium text-white shadow-inner"
            />
          </div>
          
          <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-2xl shadow-inner">
             {['all', 'BUY', 'SELL'].map((f) => (
                <button 
                  key={f}
                  onClick={() => setTypeFilter(f)}
                  className={clsx(
                    "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                    typeFilter === f ? (f === 'BUY' ? 'bg-emerald-600 text-white' : f === 'SELL' ? 'bg-rose-600 text-white' : 'bg-slate-700 text-white') : "text-slate-500 hover:text-slate-300"
                  )}
                >
                  {f === 'all' ? 'Tất cả' : f === 'BUY' ? 'MUA' : 'BÁN'}
                </button>
             ))}
          </div>

          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-indigo-500 text-white rounded-2xl shadow-xl shadow-primary/20 transition-all font-black text-xs uppercase tracking-widest active:scale-95"
          >
            <Plus size={16} /> Thêm Lệnh Mới
          </button>
        </div>
      </header>

      {/* Header Stats (LOCALIZED) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         {[
           { label: 'Vốn đã giải ngân', val: stats.invested, color: 'text-indigo-400', bg: 'bg-indigo-500/10', icon: Wallet },
           { label: 'Tiền thu hồi', val: stats.proceeds, color: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: TrendingUp },
           { label: 'Số lệnh thực hiện', val: stats.count, color: 'text-white', bg: 'bg-slate-800/20', icon: Activity, isRaw: true }
         ].map((s, i) => (
           <div key={i} className="bg-slate-900/50 p-8 rounded-[32px] border border-slate-800 flex items-center gap-6 group hover:border-slate-700 transition-all backdrop-blur-md">
              <div className={clsx("p-4 rounded-2xl group-hover:scale-110 transition-transform", s.bg)}>
                 <s.icon className={s.color} size={28} />
              </div>
              <div>
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">{s.label}</p>
                 <h3 className={clsx("text-3xl font-black tracking-tight", s.color)}>
                   {s.isRaw ? s.val : `$${s.val.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                 </h3>
              </div>
           </div>
         ))}
      </div>

      {/* Professional Trading Table (LOCALIZED) */}
      <div className="bg-slate-900/50 rounded-[32px] overflow-hidden border border-slate-800 backdrop-blur-xl shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">
                <th className="py-8 px-10">Mã cổ phiếu</th>
                <th className="py-8 px-6">Loại lệnh</th>
                <th className="py-8 px-6 text-right">Số lượng</th>
                <th className="py-8 px-6 text-right">Giá khớp</th>
                <th className="py-8 px-6 text-right">Thành tiền</th>
                <th className="py-8 px-10 text-right">Thời gian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredTxs.length > 0 ? filteredTxs.map((tx) => (
                <tr 
                  key={tx.id} 
                  className="group hover:bg-slate-800/40 transition-all hover:scale-[1.005] origin-center"
                >
                  <td className="py-6 px-10">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center font-black text-indigo-400 shadow-lg group-hover:bg-indigo-500 transition-all group-hover:text-white">
                        {tx.ticker.charAt(0)}
                      </div>
                      <p className="font-black text-white text-base tracking-tighter group-hover:text-primary transition-colors">{tx.ticker}</p>
                    </div>
                  </td>
                  <td className="py-6 px-6">
                    <div className={clsx(
                      "inline-flex items-center gap-2 px-3 py-1 rounded-lg font-black text-[9px] uppercase tracking-widest",
                      tx.type === 'BUY' ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                    )}>
                      {tx.type === 'BUY' ? <ArrowDown size={12}/> : <ArrowUp size={12}/>}
                      {tx.type === 'BUY' ? 'MUA' : 'BÁN'}
                    </div>
                  </td>
                  <td className="py-6 px-6 text-right font-bold text-slate-300">{tx.shares_quantity.toLocaleString()}</td>
                  <td className="py-6 px-6 text-right text-slate-400 font-medium">${tx.price_per_share.toLocaleString()}</td>
                  <td className="py-6 px-6 text-right">
                    <span className="text-white font-black text-base italic tracking-tight">
                      ${Number(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </td>
                  <td className="py-6 px-10 text-right">
                     <p className="text-xs text-slate-400 font-bold">{new Date(tx.created_at).toLocaleDateString('vi-VN')}</p>
                     <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest mt-0.5">{new Date(tx.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</p>
                  </td>
                </tr>
              )) : (
                <tr>
                   <td colSpan="6" className="py-32 text-center text-slate-500 italic font-medium opacity-50">
                      "Dạ, hiện tại chưa có dữ liệu giao dịch nào khớp với điều kiện lọc ạ."
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Thêm Lệnh (LOCALIZED & AUTO-CALC) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 animate-fade-in">
          <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md" onClick={() => setIsModalOpen(false)}></div>
          
          <div className="relative w-full max-w-xl bg-slate-900 border border-white/10 rounded-[32px] overflow-hidden shadow-2xl animate-slide-up">
            <div className="p-10">
              <div className="flex justify-between items-start mb-10">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20">
                    <Activity className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white tracking-tighter uppercase">Thêm Lệnh Mới</h3>
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mt-1 italic">Nhật ký Giao dịch Chứng khoán</p>
                  </div>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/5 text-slate-500 rounded-xl transition-all"><X /></button>
              </div>

              <form onSubmit={handleSave} className="space-y-6">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Mã cổ phiếu</label>
                      <input 
                         type="text" value={formData.ticker} 
                         onChange={(e) => setFormData({...formData, ticker: e.target.value.toUpperCase()})}
                         placeholder="Vd: VNM, FPT, AAPL..." required
                         className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white focus:outline-none focus:border-primary tracking-widest font-black"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Loại lệnh</label>
                      <div className="flex p-1 bg-slate-950 rounded-2xl border border-slate-800">
                         <button type="button" onClick={() => setFormData({...formData, type: 'BUY'})} className={clsx("flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all", formData.type === 'BUY' ? "bg-emerald-600 text-white shadow-lg" : "text-slate-500")}>MUA</button>
                         <button type="button" onClick={() => setFormData({...formData, type: 'SELL'})} className={clsx("flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all", formData.type === 'SELL' ? "bg-rose-600 text-white shadow-lg" : "text-slate-500")}>BÁN</button>
                      </div>
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Số lượng</label>
                      <input 
                         type="number" value={formData.shares_quantity} 
                         onChange={(e) => setFormData({...formData, shares_quantity: e.target.value})}
                         placeholder="0" required
                         className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white focus:outline-none focus:border-primary font-black"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Giá khớp ($)</label>
                      <input 
                         type="number" step="0.01" value={formData.price_per_share} 
                         onChange={(e) => setFormData({...formData, price_per_share: e.target.value})}
                         placeholder="0.00" required
                         className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white focus:outline-none focus:border-primary font-black"
                      />
                    </div>
                 </div>

                 <div className="p-6 bg-slate-950/50 rounded-2xl border border-white/5 flex justify-between items-center group">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Thành tiền (Ước tính)</span>
                    <span className="text-2xl font-black text-primary italic tracking-tighter group-hover:scale-110 transition-transform">
                      ${formData.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Ghi chú chiến lược</label>
                    <textarea 
                       value={formData.note} onChange={(e) => setFormData({...formData, note: e.target.value})}
                       placeholder="Dạ, Chủ nhân muốn lưu lại điều gì cho lệnh này không ạ?" rows="2"
                       className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs text-slate-300 focus:outline-none focus:border-primary resize-none italic"
                    ></textarea>
                 </div>

                 <div className="flex gap-4 pt-4">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 bg-white/5 text-slate-400 rounded-2xl font-black text-[10px] tracking-widest uppercase hover:bg-white/10 transition-all">Hủy bỏ</button>
                    <button type="submit" className="flex-1 py-4 bg-primary text-white rounded-2xl font-black text-[10px] tracking-widest uppercase shadow-xl shadow-primary/20 hover:bg-opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2">
                      <Check size={16} /> Xác nhận thực hiện
                    </button>
                 </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
