import { useState, useEffect } from 'react';
import { financeService } from '../services/financeService';
import { news as mockNews } from '../mockData';
import { Newspaper, ExternalLink, Loader2 } from 'lucide-react';

export default function News() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadNews() {
      const data = await financeService.getMarketNews();
      if (data && data.length > 0) {
        setArticles(data.slice(0, 12).map(item => ({
          id: item.id,
          title: item.headline,
          source: item.source,
          date: new Date(item.datetime * 1000).toLocaleString('vi-VN'),
          category: item.category,
          url: item.url,
        })));
      } else {
        // Fallback to mock data if API fails or rate limits
        setArticles(mockNews);
      }
      setLoading(false);
    }
    loadNews();
  }, []);

  return (
    <div className="space-y-8 pb-8 animate-fade-in">
      <header className="mb-8">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
          Tin Tức Thị Trường (Market News)
        </h1>
        <p className="text-textMuted mt-1">Cập nhật tin tức tài chính theo thời gian thực (Live JSON APIs)</p>
      </header>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {articles.map((item, idx) => (
            <a 
              key={item.id} 
              href={item.url || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="glass-panel p-6 flex flex-col hover:-translate-y-1 transition-transform animate-slide-up group" 
              style={{ animationDelay: `${(idx % 6) * 100}ms` }}
            >
              <div className="flex justify-between items-start mb-6">
                <span className="px-3 py-1 bg-surfaceHover border border-slate-700 rounded-full text-xs font-medium text-primary">
                  {item.category}
                </span>
                <span className="text-xs text-textMuted font-medium">
                  {item.date}
                </span>
              </div>
              
              <h3 className="text-xl font-bold mb-4 flex-1 group-hover:text-primary transition-colors leading-snug">
                {item.title}
              </h3>
              
              <div className="flex justify-between items-center mt-auto pt-4 border-t border-slate-700/50">
                <span className="text-sm font-medium text-textMuted flex items-center gap-2 truncate pr-2">
                  <Newspaper className="w-4 h-4 shrink-0" /> <span className="truncate">{item.source}</span>
                </span>
                <span className="text-secondary hover:text-white transition-colors flex items-center gap-1 text-sm font-medium shrink-0">
                  Đọc tiếp <ExternalLink className="w-4 h-4 ml-1" />
                </span>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
