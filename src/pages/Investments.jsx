import { investmentPortfolios } from '../mockData';
import { Shield, Activity, Zap } from 'lucide-react';

const icons = {
  'Low': <Shield className="w-6 h-6 text-primary" />,
  'Medium': <Activity className="w-6 h-6 text-secondary" />,
  'High': <Zap className="w-6 h-6 text-danger" />
};

export default function Investments() {
  return (
    <div className="space-y-6 pb-8 animate-fade-in">
      <header className="mb-8 overflow-hidden relative rounded-2xl p-8 glass-panel border-primary/30">
        {/* Decorative background flare */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[80px] pointer-events-none"></div>
        <div className="relative z-10">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-success">
            Investment Portfolio Suggestions
          </h1>
          <p className="text-textMuted mt-2 max-w-2xl text-sm leading-relaxed">
            Based on different risk tolerance levels, here are some standard asset allocation strategies. 
            Choose one that aligns with your long-term goals.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {investmentPortfolios.map((portfolio, idx) => (
          <div 
            key={portfolio.id} 
            className="glass-panel p-6 flex flex-col animate-slide-up group relative overflow-hidden transition-all hover:-translate-y-2"
            style={{ animationDelay: `${idx * 150}ms` }}
          >
            {/* Hover overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-surfaceHover/80 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-6">
                <div className="p-3 bg-slate-800 rounded-2xl border border-slate-700 group-hover:border-primary/50 transition-colors">
                  {icons[portfolio.riskLevel]}
                </div>
                <div className="text-right">
                  <span className="text-xs text-textMuted uppercase tracking-wider font-semibold">Risk</span>
                  <p className="font-bold">{portfolio.riskLevel}</p>
                </div>
              </div>

              <h3 className="text-xl font-bold mb-1">{portfolio.name}</h3>
              <p className="text-textMuted text-sm mb-6">Expected Return: <span className="text-success font-semibold">{portfolio.expectedReturn}</span></p>

              <div className="space-y-4 flex-1">
                {portfolio.allocation.map((alloc, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-textMain font-medium">{alloc.asset}</span>
                      <span className="font-bold">{alloc.percentage}%</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="h-full rounded-full group-hover:scale-x-105 origin-left transition-transform duration-500"
                        style={{ width: `${alloc.percentage}%`, backgroundColor: alloc.color }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>

              <button className="w-full mt-8 py-3 bg-surface border border-slate-600 rounded-xl font-medium text-sm group-hover:bg-primary group-hover:border-primary transition-colors duration-300 shadow-[0_4px_14px_0_rgba(0,0,0,0.1)] group-hover:shadow-[0_4px_14px_0_rgba(59,130,246,0.39)]">
                Select Strategy
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
