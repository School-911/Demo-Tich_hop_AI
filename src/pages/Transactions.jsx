import { transactions } from '../mockData';
import { ArrowUpRight, ArrowDownRight, Search, Filter } from 'lucide-react';

export default function Transactions() {
  return (
    <div className="space-y-6 pb-8 animate-fade-in">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
            Transactions
          </h1>
          <p className="text-textMuted mt-1">Track your recent financial activities</p>
        </div>
        <div className="flex gap-4">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" />
            <input 
              type="text" 
              placeholder="Search..." 
              className="pl-10 pr-4 py-2 bg-surface border border-slate-700 rounded-xl focus:outline-none focus:border-primary transition-colors text-sm"
            />
          </div>
          <button className="p-2 bg-surface border border-slate-700 rounded-xl hover:bg-surfaceHover transition-colors">
            <Filter className="w-5 h-5 text-textMuted" />
          </button>
        </div>
      </header>

      <div className="glass-panel overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-700/50 text-textMuted text-sm">
              <th className="py-4 px-6 font-medium">Description</th>
              <th className="py-4 px-6 font-medium">Category</th>
              <th className="py-4 px-6 font-medium">Date</th>
              <th className="py-4 px-6 font-medium text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx, idx) => (
              <tr 
                key={tx.id} 
                className="border-b border-slate-700/50 hover:bg-surfaceHover/50 transition-colors animate-slide-up"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <td className="py-4 px-6 font-medium">{tx.description}</td>
                <td className="py-4 px-6">
                  <span className="px-3 py-1 bg-slate-800 text-slate-300 rounded-full text-xs">
                    {tx.category}
                  </span>
                </td>
                <td className="py-4 px-6 text-textMuted">{tx.date}</td>
                <td className="py-4 px-6 text-right">
                  <div className="flex items-center justify-end gap-2 font-medium">
                    {tx.type === 'income' ? (
                      <span className="text-success flex items-center">
                        <ArrowUpRight className="w-4 h-4 mr-1" />
                        +${Math.abs(tx.amount).toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-danger flex items-center">
                        <ArrowDownRight className="w-4 h-4 mr-1" />
                        -${Math.abs(tx.amount).toLocaleString()}
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
