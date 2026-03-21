export const currentUser = {
  name: 'Founder',
  avatar: 'https://i.pravatar.cc/150?img=11',
  netWorth: 125000,
  monthlyIncome: 8500,
  monthlyExpense: 4200,
};

export const transactions = [
  { id: 1, date: '2026-03-20', description: 'Grocery Market', category: 'Food', amount: -120.5, type: 'expense' },
  { id: 2, date: '2026-03-19', description: 'Monthly Salary', category: 'Salary', amount: 8500, type: 'income' },
  { id: 3, date: '2026-03-18', description: 'Electric Bill', category: 'Utilities', amount: -85.2, type: 'expense' },
  { id: 4, date: '2026-03-15', description: 'Tech Subscription', category: 'Software', amount: -45, type: 'expense' },
  { id: 5, date: '2026-03-10', description: 'Freelance Design', category: 'Side Hustle', amount: 1200, type: 'income' },
];

export const budgetCategories = [
  { id: 1, name: 'Housing', allocated: 2000, spent: 2000, color: '#3b82f6' },
  { id: 2, name: 'Food & Dining', allocated: 800, spent: 650, color: '#10b981' },
  { id: 3, name: 'Transportation', allocated: 400, spent: 150, color: '#f59e0b' },
  { id: 4, name: 'Entertainment', allocated: 300, spent: 280, color: '#ef4444' },
];

export const savingGoals = [
  { id: 1, title: 'Mua nhà (Buy a House)', target: 50000, current: 15000, deadline: '2028-12-31', color: '#8b5cf6' },
  { id: 2, title: 'Quỹ khẩn cấp (Emergency Fund)', target: 10000, current: 8500, deadline: '2026-06-30', color: '#10b981' },
];

export const aiChatHistory = [
  { id: 1, sender: 'ai', text: 'Xin chào! Tôi là Trợ lý Ảo Tài chính của bạn. Hôm nay tôi có thể giúp gì cho bạn?', timestamp: '10:00 AM' },
  { id: 2, sender: 'user', text: 'Tháng này tôi dư 50 triệu, tôi nên làm gì?', timestamp: '10:05 AM' },
  { id: 3, sender: 'ai', text: 'Tuyệt vời! Theo thiết lập rủi ro của bạn, tôi đề xuất chia 30 triệu vào quỹ ETFs S&P 500 dài hạn, 15 triệu để gửi tiết kiệm linh hoạt, và 5 triệu thử sức với Crypto.', timestamp: '10:06 AM' },
];

export const investmentPortfolios = [
  {
    id: 'conservative',
    name: 'Conservative (An Toàn)',
    riskLevel: 'Low',
    expectedReturn: '4-6%',
    allocation: [
      { asset: 'Bonds', percentage: 60, color: '#3b82f6' },
      { asset: 'Large Cap Stocks', percentage: 30, color: '#10b981' },
      { asset: 'Cash', percentage: 10, color: '#f59e0b' },
    ],
  },
  {
    id: 'balanced',
    name: 'Balanced (Cân Bằng)',
    riskLevel: 'Medium',
    expectedReturn: '7-9%',
    allocation: [
      { asset: 'US Equities', percentage: 50, color: '#8b5cf6' },
      { asset: 'International Stocks', percentage: 20, color: '#ec4899' },
      { asset: 'Bonds', percentage: 25, color: '#3b82f6' },
      { asset: 'Real Estate', percentage: 5, color: '#14b8a6' },
    ],
  },
  {
    id: 'aggressive',
    name: 'Aggressive (Rủi Ro Cao)',
    riskLevel: 'High',
    expectedReturn: '10-15%',
    allocation: [
      { asset: 'Tech Stocks / Growth', percentage: 50, color: '#ef4444' },
      { asset: 'Small Cap Stocks', percentage: 25, color: '#f97316' },
      { asset: 'Emerging Markets', percentage: 15, color: '#eab308' },
      { asset: 'Crypto / Alt Assets', percentage: 10, color: '#a855f7' },
    ],
  }
];

export const stocks = [
  { id: 'AAPL', name: 'Apple Inc.', price: 175.5, shares: 10, pl: 120.5, plPercent: 8.5 },
  { id: 'TSLA', name: 'Tesla, Inc.', price: 200.2, shares: 15, pl: -45.2, plPercent: -2.1 },
];

export const news = [
  { id: 1, title: 'Fed Signals Potential Rate Cuts', source: 'MarketWatch', date: '2 hrs ago', category: 'Macro' },
  { id: 2, title: 'Tech Stocks Rally on AI Boom', source: 'Bloomberg', date: '5 hrs ago', category: 'Tech' },
  { id: 3, title: 'S&P 500 Hits New Record High', source: 'Reuters', date: '1 day ago', category: 'Markets' },
];
