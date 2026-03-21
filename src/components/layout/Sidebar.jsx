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
    <div className="w-64 h-screen fixed left-0 top-0 glass-panel border-l-0 border-y-0 rounded-none rounded-r-2xl flex flex-col p-6 z-50 overflow-hidden">
      <div className="flex items-center gap-3 mb-10 text-primary">
        <div className="p-2 bg-primary/20 rounded-xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-primary opacity-0 group-hover:opacity-20 transition-opacity"></div>
          <LayoutDashboard className="w-8 h-8 relative z-10" />
        </div>
        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
          FinAI
        </h1>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto pr-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.name}
              to={item.path}
              className={clsx(
                'flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden',
                isActive
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-textMuted hover:bg-surfaceHover hover:text-textMain'
              )}
            >
              {isActive && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-md"></div>
              )}
              <item.icon className={clsx('w-5 h-5 transition-transform group-hover:scale-110 shrink-0', isActive ? 'text-primary' : '')} />
              <span className="text-sm">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-8 pt-6 border-t border-slate-700/50 -mx-2 px-2 pb-2">
        {user ? (
          <div className="flex justify-between items-center bg-surfaceHover/50 p-2 rounded-xl border border-slate-700/30">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-secondary text-white flex items-center justify-center font-bold shadow-md shrink-0">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col truncate">
                <span className="text-[13px] font-semibold text-white truncate w-[90px]" title={displayName}>
                  {displayName}
                </span>
                <span className="text-[10px] text-success font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-success"></span> Online
                </span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-textMuted hover:text-danger hover:bg-danger/20 rounded-lg transition-colors shrink-0 ml-1"
              title="Đăng xuất"
            >
              <LogOut className="w-[18px] h-[18px]" />
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <Link to="/login" className="flex items-center justify-center gap-2 px-4 py-2 bg-surface hover:bg-surfaceHover border border-slate-600 rounded-xl transition-colors text-sm font-medium text-white shadow-sm">
              <LogIn className="w-4 h-4" /> Đăng nhập
            </Link>
            <Link to="/signup" className="flex items-center justify-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-xl transition-colors text-sm font-medium shadow-md shadow-primary/20">
              <UserPlus className="w-4 h-4" /> Đăng ký
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
