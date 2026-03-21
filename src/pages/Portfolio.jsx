import { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { financeService } from '../services/financeService';
import { TrendingUp, TrendingDown, Plus, Trash2, Loader2, AlertCircle } from 'lucide-react';

export default function Portfolio() {
  const [portfolio, setPortfolio] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [newStock, setNewStock] = useState({ ticker: '', name: '', shares: '', average_buy_price: '' });
  const [adding, setAdding] = useState(false);

  const loadPortfolio = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (!user || authError) {
        throw new Error('Vui lòng đăng nhập để xem danh mục đầu tư.');
      }
      
      const { data: records, error } = await supabase
        .from('portfolios')
        .select('*')
        .eq('user_id', user.id);
        
      if (error) {
        if (error.code === '42P01') {
           throw new Error("Bảng 'portfolios' chưa được tạo trên Supabase. Vui lòng thiết lập Database theo hướng dẫn.");
        }
        throw error;
      }
      
      const liveData = await Promise.all((records || []).map(async (row) => {
        try {
          const quote = await financeService.getStockQuote(row.ticker);
          if (!quote || (quote.c === 0 && quote.d === null)) {
            throw new Error(`Dữ liệu mã ${row.ticker} hiện chưa khả dụng (Finnhub Free chỉ hỗ trợ tốt mã chứng khoán Mỹ như AAPL, TSLA)`);
          }
          const currentPrice = quote.c;
          const pl = (currentPrice - row.average_buy_price) * row.shares;
          const plPercent = ((currentPrice - row.average_buy_price) / row.average_buy_price) * 100;
          return { ...row, currentPrice, pl, plPercent };
        } catch (qErr) {
           return { ...row, currentPrice: 0, pl: 0, plPercent: 0, error: true };
        }
      }));
      
      setPortfolio(liveData);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Không thể tải danh mục. Có lỗi kết nối API.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPortfolio();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newStock.ticker || !newStock.shares || !newStock.average_buy_price) return;
    setAdding(true);
    setErrorMsg('');

    try {
      const quote = await financeService.getStockQuote(newStock.ticker);
      if (!quote || (quote.c === 0 && quote.d === null)) {
        throw new Error(`Dữ liệu mã ${newStock.ticker} hiện chưa khả dụng (Finnhub Free chỉ hỗ trợ tốt mã chứng khoán Mỹ như AAPL, TSLA)`);
      }
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Yêu cầu đăng nhập.');

      const { error } = await supabase
        .from('portfolios')
        .insert({
          user_id: user.id,
          ticker: newStock.ticker.toUpperCase(),
          company_name: newStock.name,
          shares: Number(newStock.shares),
          average_buy_price: Number(newStock.average_buy_price)
        });

      if (error) {
        if (error.code === '42P01') throw new Error("Bảng 'portfolios' chưa tồn tại. Phải tạo bảng trước khi thêm.");
        throw error;
      }
      
      setNewStock({ ticker: '', name: '', shares: '', average_buy_price: '' });
      await loadPortfolio(); 
    } catch (err) {
      setErrorMsg(err.message || 'Thêm mã bị từ chối. Vui lòng thử lại.');
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (id) => {
    try {
      const { error } = await supabase.from('portfolios').delete().eq('id', id);
      if (error) throw error;
      setPortfolio(portfolio.filter(s => s.id !== id));
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  return (
    <div className="space-y-8 pb-8 animate-fade-in">
      <header className="mb-4">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
          Danh mục Đầu tư (Portfolio)
        </h1>
        <p className="text-textMuted mt-1">Real-time quotes powered by Finnhub and saved to Supabase</p>
      </header>

      {errorMsg && (
        <div className="p-4 bg-danger/20 border border-danger/50 rounded-xl text-danger flex items-center gap-3 font-medium">
          <AlertCircle className="w-5 h-5 shrink-0" />
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-6">
          <div className="glass-panel overflow-x-auto min-h-[300px] relative">
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="border-b border-slate-700/50 text-textMuted text-sm">
                    <th className="py-4 px-6 font-medium">Mã (Ticker)</th>
                    <th className="py-4 px-6 font-medium text-right">Giá Live (Price)</th>
                    <th className="py-4 px-6 font-medium text-right">Số lượng</th>
                    <th className="py-4 px-6 font-medium text-right">Lãi/Lỗ (P/L)</th>
                    <th className="py-4 px-6 font-medium text-center">Xóa</th>
                  </tr>
                </thead>
                <tbody>
                  {portfolio.map((stock, idx) => (
                    <tr key={stock.id} className="border-b border-slate-700/50 hover:bg-surfaceHover/50 transition-colors animate-slide-up" style={{ animationDelay: `${idx * 100}ms` }}>
                      <td className="py-4 px-6">
                        <p className="font-bold text-white">{stock.ticker}</p>
                        <p className="text-xs text-textMuted">{stock.company_name}</p>
                      </td>
                      <td className="py-4 px-6 text-right font-medium text-primary">
                        {stock.currentPrice ? `$${stock.currentPrice.toFixed(2)}` : 'Market Closed / N/A'}
                      </td>
                      <td className="py-4 px-6 text-right">{stock.shares}</td>
                      <td className="py-4 px-6 text-right">
                        {!stock.error && stock.currentPrice ? (
                          <div className={`flex items-center justify-end gap-1 font-medium ${stock.pl >= 0 ? 'text-success' : 'text-danger'}`}>
                            {stock.pl >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                            ${Math.abs(stock.pl).toFixed(2)} ({stock.plPercent?.toFixed(2)}%)
                          </div>
                        ) : (
                          <span className="text-textMuted text-sm text-center block w-full">-</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <button onClick={() => handleRemove(stock.id)} className="p-2 text-textMuted hover:text-danger hover:bg-danger/10 rounded-xl transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {portfolio.length === 0 && (
                    <tr>
                      <td colSpan="5" className="py-10 text-center text-textMuted font-medium">Chưa có dữ liệu danh mục.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div>
          <div className="glass-panel p-6 sticky top-6">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2"><Plus className="w-5 h-5 text-primary" /> Mua Thêm Khớp Lệnh</h3>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-xs text-textMuted mb-2">Mã cổ phiếu (Ticker)</label>
                <input required type="text" value={newStock.ticker} onChange={e => setNewStock({...newStock, ticker: e.target.value})} className="w-full bg-surface border border-slate-700 rounded-xl px-4 py-2 text-white focus:border-primary focus:outline-none" placeholder="VD: AAPL" />
              </div>
              <div>
                <label className="block text-xs text-textMuted mb-2">Tên công ty (Name)</label>
                <input type="text" value={newStock.name} onChange={e => setNewStock({...newStock, name: e.target.value})} className="w-full bg-surface border border-slate-700 rounded-xl px-4 py-2 text-white focus:border-primary focus:outline-none" placeholder="Apple Inc." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-textMuted mb-2">Số lượng</label>
                  <input required type="number" min="1" value={newStock.shares} onChange={e => setNewStock({...newStock, shares: e.target.value})} className="w-full bg-surface border border-slate-700 rounded-xl px-4 py-2 text-white focus:border-primary focus:outline-none" placeholder="10" />
                </div>
                <div>
                  <label className="block text-xs text-textMuted mb-2">Giá TB ($)</label>
                  <input required type="number" step="0.01" value={newStock.average_buy_price} onChange={e => setNewStock({...newStock, average_buy_price: e.target.value})} className="w-full bg-surface border border-slate-700 rounded-xl px-4 py-2 text-white focus:border-primary focus:outline-none" placeholder="150.00" />
                </div>
              </div>
              <button disabled={adding} type="submit" className="w-full flex justify-center mt-6 py-3 bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white rounded-xl font-medium transition-all shadow-lg disabled:opacity-50">
                {adding ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Lưu Danh Mục'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
