import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Loader2 } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

export default function Signup() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg({ type: '', text: '' });
    
    // Attempt standard email signup
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name }
      }
    });

    setLoading(false);

    if (error) {
      setMsg({ type: 'error', text: error.message });
    } else {
      setMsg({ type: 'success', text: 'Đăng ký thành công! Vui lòng kiểm tra email để xác thực.' });
      setTimeout(() => navigate('/login'), 2000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background relative overflow-hidden">
      {/* Background ambient light */}
      <div className="absolute top-[20%] right-[10%] w-96 h-96 bg-primary/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[20%] left-[10%] w-96 h-96 bg-success/20 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="glass-panel w-full max-w-md p-10 animate-slide-up relative z-10">
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="p-3 bg-primary/20 rounded-2xl mb-4 text-primary">
            <LayoutDashboard className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-success">
            Tạo Tài Khoản FinAI
          </h1>
        </div>
        
        {msg.text && (
          <div className={`mb-4 p-3 border rounded-xl text-sm text-center ${msg.type === 'error' ? 'bg-danger/20 border-danger/50 text-danger' : 'bg-success/20 border-success/50 text-success'}`}>
            {msg.text}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSignup}>
          <div>
            <label className="block text-sm font-medium text-textMuted mb-2">Họ & Tên</label>
            <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full bg-surface border border-slate-700 rounded-xl px-4 py-3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all text-white placeholder-slate-500" placeholder="Nguyen Van A" />
          </div>
          <div>
            <label className="block text-sm font-medium text-textMuted mb-2">Email</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-surface border border-slate-700 rounded-xl px-4 py-3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all text-white placeholder-slate-500" placeholder="email@example.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-textMuted mb-2">Mật khẩu</label>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-surface border border-slate-700 rounded-xl px-4 py-3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all text-white placeholder-slate-500" placeholder="Tối thiểu 6 ký tự" />
          </div>
          <button type="submit" disabled={loading} className="flex justify-center items-center w-full py-3.5 bg-gradient-to-r from-primary to-success hover:opacity-90 text-white rounded-xl font-bold shadow-lg transition-all mt-6 disabled:opacity-50">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Đăng Ký'}
          </button>
        </form>
        
        <p className="text-center text-sm text-textMuted mt-8">
          Đã có tài khoản? <Link to="/login" className="text-primary font-semibold hover:underline">Đăng nhập ngay</Link>
        </p>
      </div>
    </div>
  );
}
