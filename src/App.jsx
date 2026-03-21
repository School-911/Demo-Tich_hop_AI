import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from './services/supabaseClient';
import { Loader2 } from 'lucide-react';

import DashboardLayout from './components/layout/DashboardLayout';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Budget from './pages/Budget';
import AIAdvisor from './pages/AIAdvisor';
import Investments from './pages/Investments';
import Portfolio from './pages/Portfolio';
import News from './pages/News';
import Login from './pages/Login';
import Signup from './pages/Signup';

// Protected Route Component to guard all internal pages
const ProtectedRoute = () => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    let mounted = true;
    
    // 1. Check current session immediately
    async function checkSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (mounted) {
          setSession(session);
        }
      } catch (error) {
        console.error("Lỗi khi kiểm tra phiên đăng nhập:", error);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    
    checkSession();

    let authListener = null;
    try {
      // 2. Listen to real-time auth events (e.g., token refresh, logout from another tab)
      const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
        if (mounted) {
          setSession(session);
          setLoading(false);
        }
      });
      authListener = listener;
    } catch (err) {
      console.error("Auth listener error:", err);
      if (mounted) setLoading(false);
    }

    return () => {
      mounted = false;
      if (authListener) authListener.subscription.unsubscribe();
    };
  }, []);

  // Show a full-screen loading spinner while the session is being evaluated
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  // Redirect to Login if unauthenticated, preserving the intended destination
  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Proceed to render child routes if authenticated
  return <Outlet />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        
        {/* Protected Routes Block */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<DashboardLayout />}>
            {/* Child routes injected into DashboardLayout's <Outlet /> */}
            <Route index element={<Dashboard />} />
            <Route path="transactions" element={<Transactions />} />
            <Route path="budget" element={<Budget />} />
            <Route path="portfolio" element={<Portfolio />} />
            <Route path="investments" element={<Investments />} />
            <Route path="news" element={<News />} />
            <Route path="ai-advisor" element={<AIAdvisor />} />
          </Route>
        </Route>

        {/* Fallback route for unknown URLs */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
