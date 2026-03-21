import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Loader2 } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setErrorMsg(error.message);
    } else {
      // Trigger a force reload or navigate to re-evaluate session in a real app.
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background relative overflow-hidden">
      {/* Background ambient light */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-secondary/20 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="glass-panel w-full max-w-md p-10 animate-slide-up relative z-10">
        <div className="text-center mb-10 flex flex-col items-center">
          <div className="p-3 bg-primary/20 rounded-2xl mb-4 text-primary">
            <LayoutDashboard className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
            Đăng Nhập FinAI
          </h1>
          <p className="text-textMuted mt-2 text-sm">Quản lý tài chính thông minh hơn</p>
        </div>
        
        {errorMsg && (
          <div className="mb-4 p-3 bg-danger/20 border border-danger/50 text-danger rounded-xl text-sm text-center">
            {errorMsg === 'Invalid login credentials' ? 'Email hoặc mật khẩu không chính xác' : errorMsg}
          </div>
        )}

        <form className="space-y-5" onSubmit={handleLogin}>
          <div>
            <label className="block text-sm font-medium text-textMuted mb-2">Email</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-surface border border-slate-700 rounded-xl px-4 py-3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all text-white placeholder-slate-500" placeholder="founder@example.com" />
          </div>
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-textMuted">Mật khẩu</label>
              <a href="#" className="text-xs text-primary hover:underline font-medium">Quên mật khẩu?</a>
            </div>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-surface border border-slate-700 rounded-xl px-4 py-3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all text-white placeholder-slate-500" placeholder="••••••••" />
          </div>
          <button type="submit" disabled={loading} className="flex justify-center items-center w-full py-3.5 bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white rounded-xl font-bold shadow-[0_4px_14px_0_rgba(59,130,246,0.39)] hover:shadow-[0_6px_20px_rgba(59,130,246,0.23)] transition-all mt-6 disabled:opacity-50">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Tiếp tục'}
          </button>
        </form>
        
        <p className="text-center text-sm text-textMuted mt-8">
          Chưa có tài khoản? <Link to="/signup" className="text-primary font-semibold hover:underline">Đăng ký ngay</Link>
        </p>
      </div>
    </div>
  );
}
