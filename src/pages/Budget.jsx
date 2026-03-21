import { budgetCategories, savingGoals } from '../mockData';
import { Target, AlertCircle, TrendingUp, Calendar } from 'lucide-react';

export default function Budget() {
  return (
    <div className="space-y-8 pb-8 animate-fade-in">
      <header className="mb-4">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
          Ngân sách & Tiết kiệm (Budget & Savings)
        </h1>
        <p className="text-textMuted mt-1">Manage your monthly allocations and long-term goals</p>
      </header>

      <section>
        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2"><Target className="w-5 h-5 text-primary" /> Monthly Budget</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {budgetCategories.map((category, idx) => {
            const percent = Math.min((category.spent / category.allocated) * 100, 100);
            const isWarning = percent >= 80;
            const isDanger = percent >= 100;

            return (
              <div 
                key={category.id} 
                className="glass-panel p-6 animate-slide-up"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center p-2" style={{ backgroundColor: `${category.color}20` }}>
                      <Target className="w-full h-full" style={{ color: category.color }} />
                    </div>
                    <h3 className="font-semibold text-lg">{category.name}</h3>
                  </div>
                  {(isWarning || isDanger) && (
                    <AlertCircle className={`w-5 h-5 ${isDanger ? 'text-danger' : 'text-warning'} animate-pulse-slow`} />
                  )}
                </div>

                <div className="flex justify-between text-sm mb-2">
                  <span className="text-textMuted">Spent: <span className="text-textMain font-medium">${category.spent}</span></span>
                  <span className="text-textMuted">Limit: ${category.allocated}</span>
                </div>

                <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000`}
                    style={{ 
                      width: `${percent}%`, 
                      backgroundColor: isDanger ? 'var(--color-danger)' : isWarning ? 'var(--color-warning)' : category.color 
                    }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="pt-4">
        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-success" /> Saving Goals</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {savingGoals.map((goal, idx) => {
            const percent = Math.min((goal.current / goal.target) * 100, 100);
            
            return (
              <div 
                key={goal.id} 
                className="glass-panel p-6 animate-slide-up group"
                style={{ animationDelay: `${idx * 150}ms` }}
              >
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="font-bold text-lg">{goal.title}</h3>
                    <p className="text-textMuted text-sm mt-1 flex items-center gap-1">
                      <Calendar className="w-4 h-4" /> Target: {goal.deadline}
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-surfaceHover rounded-full text-xs font-semibold" style={{ color: goal.color }}>
                    {percent.toFixed(0)}%
                  </span>
                </div>

                <div className="flex justify-between items-end mb-2">
                  <span className="text-2xl font-bold">${goal.current.toLocaleString()}</span>
                  <span className="text-textMuted text-sm">of ${goal.target.toLocaleString()}</span>
                </div>

                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden mb-4">
                  <div 
                    className="h-full rounded-full transition-all duration-1000 group-hover:scale-x-105 origin-left"
                    style={{ width: `${percent}%`, backgroundColor: goal.color }}
                  ></div>
                </div>
                
                <button className="w-full py-2 bg-surfaceHover hover:bg-slate-700 transition-colors rounded-xl text-sm font-medium">
                  Add Funds
                </button>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
