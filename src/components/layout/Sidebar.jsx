import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, PieChart, MessageSquare, CreditCard, LayoutDashboard, Briefcase, Newspaper, LogOut, LogIn, UserPlus } from 'lucide-react';
import clsx from 'clsx';
import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';

const navItems = [
  { name: 'Tổng quan', path: '/', icon: LayoutDashboard },
  { name: 'Giao dịch', path: '/transactions', icon: CreditCard },
  { name: 'Ngân sách', path: '/budget', icon: Home },
  { name: 'Danh mục', path: '/portfolio', icon: Briefcase },
  { name: 'Đầu tư', path: '/investments', icon: PieChart },
  { name: 'Tin tức', path: '/news', icon: Newspaper },
  { name: 'Trợ lý AI', path: '/ai-advisor', icon: MessageSquare },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    // 1. Initial Check on Mount
    supabase.auth.getUser().then(({ data }) => {
      setUser(data?.user || null);
    });

    // 2. Real-time Auth Subscription Sync
    let authListener = null;
    try {
      const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
        setUser(session?.user || null);
      });
      authListener = listener;
    } catch (err) {
      console.error("Sidebar auth listener error:", err);
    }

    return () => {
      if (authListener) authListener.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  // Resolve user display name gracefully. Metadata 'full_name' handles Signup names.
  const displayName = user?.user_metadata?.full_name || user?.email || 'N/A';

  return (
    <div className="w-64 h-screen fixed left-0 top-0 bg-navy-dark/95 backdrop-blur-xl border-r border-white/5 flex flex-col p-6 z-50 overflow-hidden shadow-2xl">
      <div className="flex items-center gap-3 mb-10 group cursor-pointer">
        <div className="p-2.5 bg-primary/10 rounded-2xl border border-primary/20 shadow-lg shadow-primary/10 transition-all group-hover:bg-primary/20">
          <LayoutDashboard className="w-7 h-7 text-primary" />
        </div>
        <div className="flex flex-col">
          <h1 className="text-xl font-bold tracking-tight text-white leading-none">
            FinAI <span className="text-primary text-[10px] ml-0.5 uppercase tracking-widest">Exec</span>
          </h1>
          <span className="text-[10px] text-textMuted font-medium mt-1">Asset Management</span>
        </div>
      </div>

      <nav className="flex-1 space-y-2 overflow-y-auto pr-2 custom-scrollbar">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.name}
              to={item.path}
              className={clsx(
                'flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 group relative',
                isActive
                  ? 'bg-primary/10 text-primary font-semibold shadow-inner shadow-primary/5'
                  : 'text-textMuted hover:bg-white/5 hover:text-white'
              )}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-primary rounded-r-full shadow-[0_0_12px_rgba(99,102,241,0.5)]"></div>
              )}
              <item.icon className={clsx('w-5 h-5 transition-transform group-hover:scale-110', isActive ? 'text-primary' : 'text-textMuted group-hover:text-white')} />
              <span className="text-[13px] tracking-wide">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-8 pt-6 border-t border-white/5 px-2">
        {user ? (
          <div className="flex justify-between items-center bg-white/5 p-3 rounded-2xl border border-white/5 shadow-lg">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-secondary text-white flex items-center justify-center font-bold shadow-xl shrink-0 border border-white/10 uppercase">
                {displayName.charAt(0)}
              </div>
              <div className="flex flex-col truncate">
                <span className="text-[13px] font-bold text-white truncate w-[85px] tracking-tight">{displayName}</span>
                <span className="text-[10px] text-success font-bold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-success shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span> Online
                </span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-2.5 text-textMuted hover:text-danger hover:bg-danger/10 rounded-xl transition-all shadow-sm"
              title="Đăng xuất"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <Link to="/login" className="flex items-center justify-center gap-2 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all text-xs font-bold text-white shadow-lg">
              <LogIn className="w-4 h-4 text-primary" /> Đăng nhập
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
