import React from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import GlobalAIAdvisor from '../GlobalAIAdvisor';
import { Bell, Search, User } from 'lucide-react';

// Tạo Header nội bộ đơn giản để tránh lỗi "Module not found" khi file Header.jsx bị thiếu
const ExecutiveHeader = () => (
  <header className="h-20 border-b border-white/5 bg-navy-dark/80 backdrop-blur-2xl flex items-center justify-between px-8 sticky top-0 z-40 transition-all duration-500">
    <div className="flex items-center bg-white/5 border border-white/5 rounded-2xl px-5 py-2.5 w-72 md:w-96 transition-all focus-within:ring-2 focus-within:ring-primary/40 focus-within:border-primary/40 focus-within:bg-white/10 group shadow-inner">
      <Search className="w-4 h-4 text-textMuted mr-3 shrink-0 group-focus-within:text-primary transition-colors" />
      <input 
        type="text" 
        placeholder="Tìm kiếm tài sản, mã cổ phiếu..." 
        className="bg-transparent border-none outline-none text-sm text-white w-full placeholder:text-slate-500 font-medium" 
      />
    </div>
    
    <div className="flex items-center gap-6">
      <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-success/10 border border-success/20 rounded-full">
        <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
        <span className="text-[10px] font-bold text-success uppercase tracking-wider">Market Live</span>
      </div>

      <button className="relative p-2.5 text-textMuted hover:text-white transition-all hover:bg-white/10 rounded-2xl border border-transparent hover:border-white/10 group">
        <Bell className="w-5 h-5 group-hover:rotate-12 transition-transform" />
        <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-primary rounded-full ring-4 ring-navy-dark animate-pulse"></span>
      </button>

      <div className="flex items-center gap-3 pl-2 border-l border-white/10">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 p-0.5 cursor-pointer shadow-xl hover:scale-105 transition-all ring-1 ring-white/10">
          <div className="w-full h-full bg-navy-dark rounded-2xl flex items-center justify-center overflow-hidden">
            <User className="w-5 h-5 text-indigo-400" />
          </div>
        </div>
      </div>
    </div>
  </header>
);

export default function DashboardLayout() {
  return (
    <div className="flex min-h-screen bg-navy-dark text-textMain relative overflow-hidden font-sans selection:bg-primary/30">
      <Sidebar />
      
      <div className="flex-1 flex flex-col pl-64 transition-all duration-500">
        <ExecutiveHeader />
        
        <main className="flex-1 p-8 relative overflow-y-auto">
          {/* Executive Ambient Background */}
          <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-indigo-600/10 rounded-full blur-[150px] pointer-events-none -z-10 mix-blend-soft-light animate-pulse-slow" />
          <div className="absolute bottom-[-15%] right-[-10%] w-[50vw] h-[50vw] bg-purple-600/10 rounded-full blur-[130px] pointer-events-none -z-10 mix-blend-soft-light animate-pulse-slow" />
          
          <div className="relative z-10 max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      <GlobalAIAdvisor />
    </div>
  );
}
