const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';
const API_KEY = import.meta.env.VITE_FINNHUB_API_KEY;

export const financeService = {
  // Lấy tin tức thị trường
  async getMarketNews(category = 'general') {
    if (!API_KEY) {
      throw new Error("Thiếu Finnhub API Key trong file .env");
    }
    try {
      const url = `${FINNHUB_BASE_URL}/news?category=${category}&token=${API_KEY}`;
      console.log('Fetching News URL:', url);
      const response = await fetch(url);
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      console.log('News Response Data (first 2 items):', data.slice(0, 2));
      return data;
    } catch (error) {
      console.error("Error fetching news:", error);
      throw error;
    }
  },

  // Lấy giá cổ phiếu thời gian thực
  async getStockQuote(symbol) {
    if (!API_KEY) {
      throw new Error("Thiếu Finnhub API Key trong file .env");
    }
    try {
      const url = `${FINNHUB_BASE_URL}/quote?symbol=${symbol}&token=${API_KEY}`;
      console.log(`Fetching Quote URL for ${symbol}:`, url);
      const response = await fetch(url);
      const data = await response.json();
      console.log(`Quote Response Data for ${symbol}:`, data);
      return data;
    } catch (error) {
      console.error(`Error fetching quote for ${symbol}:`, error);
      throw error;
    }
  }
};
