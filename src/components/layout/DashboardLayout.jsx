import React from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import GlobalAIAdvisor from '../GlobalAIAdvisor';
import { Bell, Search, User } from 'lucide-react';

// Tạo Header nội bộ đơn giản để tránh lỗi "Module not found" khi file Header.jsx bị thiếu
const FallbackHeader = () => (
  <header className="h-16 border-b border-slate-700/50 bg-background/50 backdrop-blur-xl flex items-center justify-between px-6 sticky top-0 z-20">
    <div className="flex items-center bg-surface border border-slate-700 rounded-full px-4 py-1.5 w-64 md:w-80 transition-all focus-within:ring-1 focus-within:ring-primary focus-within:border-primary">
      <Search className="w-4 h-4 text-textMuted mr-2 shrink-0" />
      <input 
        type="text" 
        placeholder="Tìm kiếm mã cổ phiếu, tin tức..." 
        className="bg-transparent border-none outline-none text-sm text-textMain w-full placeholder:text-slate-500" 
      />
    </div>
    <div className="flex items-center gap-4">
      <button className="relative p-2 text-textMuted hover:text-white transition-colors hover:bg-surface rounded-full">
        <Bell className="w-5 h-5" />
        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse border border-background"></span>
      </button>
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-tr from-secondary to-primary p-0.5 cursor-pointer shadow-lg hover:shadow-[0_0_10px_rgba(168,85,247,0.4)] transition-all">
        <div className="w-full h-full bg-surface rounded-full flex items-center justify-center">
          <User className="w-4 h-4 text-white" />
        </div>
      </div>
    </div>
  </header>
);

export default function DashboardLayout() {
  return (
    <div className="flex min-h-screen bg-background text-textMain relative overflow-hidden font-sans">
      {/* Sidebar Component */}
      <Sidebar />
      
      {/* Main Sandbox Area */}
      <div className="flex-1 flex flex-col pl-64 transition-all duration-300">
        
        {/* Render the fallback header securely without external imports */}
        <FallbackHeader />
        
        <main className="flex-1 p-6 relative overflow-y-auto">
          {/* Lưới Ambient Background Glow rực rỡ */}
          <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-primary/5 rounded-full blur-[120px] pointer-events-none -z-10 mix-blend-screen" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-secondary/5 rounded-full blur-[100px] pointer-events-none -z-10 mix-blend-screen" />
          
          <Outlet />
        </main>
      </div>
      
      {/* Floating Application Context: Global AI Agent Component */}
      <GlobalAIAdvisor />
    </div>
  );
}
