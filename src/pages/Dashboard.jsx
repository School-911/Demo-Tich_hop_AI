import { currentUser, transactions, budgetCategories } from '../mockData';
import { ArrowUpRight, ArrowDownRight, Wallet, Activity } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';

const chartData = [
  { name: 'Jan', value: 80000 },
  { name: 'Feb', value: 95000 },
  { name: 'Mar', value: currentUser.netWorth },
];

export default function Dashboard() {
  const [userName, setUserName] = useState('');
  
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserName(user?.user_metadata?.full_name || user?.email || 'Khách');
    });
  }, []);

  return (
    <div className="space-y-8 pb-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
            Tổng Quan
          </h1>
          <p className="text-textMuted mt-1">Xin chào, đây là Cố vấn Tài chính của bạn, {userName}</p>
        </div>
        <button className="px-6 py-2 bg-primary hover:bg-primary/90 text-white rounded-xl shadow-[0_0_15px_rgba(59,130,246,0.5)] transition-all font-medium">
          Generate Report
        </button>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6 flex flex-col gap-4 animate-slide-up" style={{ animationDelay: '0ms' }}>
          <div className="flex items-center gap-3 text-textMuted">
            <Wallet className="w-5 h-5 text-primary" />
            <h3 className="font-medium">Net Worth</h3>
          </div>
          <div className="flex items-end gap-3">
            <h2 className="text-3xl font-bold">${currentUser.netWorth.toLocaleString()}</h2>
            <span className="flex items-center text-success text-sm font-medium mb-1">
              <ArrowUpRight className="w-4 h-4" /> +12.5%
            </span>
          </div>
        </div>

        <div className="glass-panel p-6 flex flex-col gap-4 animate-slide-up" style={{ animationDelay: '100ms' }}>
          <div className="flex items-center gap-3 text-textMuted">
            <ArrowUpRight className="w-5 h-5 text-success" />
            <h3 className="font-medium">Monthly Income</h3>
          </div>
          <h2 className="text-3xl font-bold">${currentUser.monthlyIncome.toLocaleString()}</h2>
        </div>

        <div className="glass-panel p-6 flex flex-col gap-4 animate-slide-up" style={{ animationDelay: '200ms' }}>
          <div className="flex items-center gap-3 text-textMuted">
            <ArrowDownRight className="w-5 h-5 text-danger" />
            <h3 className="font-medium">Monthly Expense</h3>
          </div>
          <h2 className="text-3xl font-bold">${currentUser.monthlyExpense.toLocaleString()}</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="glass-panel p-6 lg:col-span-2 animate-slide-up" style={{ animationDelay: '300ms' }}>
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <Activity className="w-5 h-5 text-secondary" /> Net Worth Growth
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.9)', border: 'none', borderRadius: '8px', color: '#fff' }}
                />
                <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Budget Overview */}
        <div className="glass-panel p-6 animate-slide-up" style={{ animationDelay: '400ms' }}>
          <h3 className="text-lg font-semibold mb-6">Budget Overview</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={budgetCategories}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="spent"
                >
                  {budgetCategories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="rgba(0,0,0,0)" />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-3 mt-4">
            {budgetCategories.slice(0, 3).map(cat => (
              <div key={cat.id} className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }}></div>
                  <span className="text-textMuted">{cat.name}</span>
                </div>
                <span className="font-medium">${cat.spent}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
