# 🏰 FinAI Executive Platform - Trợ Lý Tài Chính Đặc Quyền (v4.17)

![FinAI Executive Banner](https://img.shields.io/badge/Version-4.17-blueviolet?style=for-the-badge)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![AI-Powered](https://img.shields.io/badge/AI-Groq_Llama3.3-orange?style=for-the-badge)

**FinAI Executive** là hệ thống quản lý tài sản và nhật ký giao dịch chứng khoán chuyên nghiệp, được thiết kế theo tiêu chuẩn "Executive Slate" tinh tế, tích hợp trợ lý AI điều hành (Executive Controller) giúp tối ưu hóa mọi quyết định đầu tư của Ngài.

---

## 🌟 Tính Năng Đỉnh Cao (Vượt Trội v4.x)

### 🤖 1. Executive AI Controller (Trái tim của hệ thống)
Không chỉ là Chatbot, đây là một **Hành động viên (Action-Oriented Agent)** với các năng lực:
- **Xác thực Mã (Ticker Validation)**: Tự động kiểm tra tính hợp lệ của mã cổ phiếu trên sàn Nasdaq/NYSE thông qua Finnhub API trước khi cho phép đặt lệnh.
- **Cố vấn Tăng trưởng (Growth Advisory)**: Chủ động gợi ý các mã có hiệu suất tốt nhất phiên (Top Gainers) khi Ngài hỏi *"Nên mua gì?"*.
- **Giao thức Giao dịch Không chạm (Seamless Trade)**: 
  - Ngài chỉ cần chat **"Xác nhận mua"** để thực thi lệnh đang chờ.
  - Tích hợp nút **"Hủy lệnh"** ngay trên thẻ xác nhận để rút lệnh tức thì.
- **Điều hướng Ý định (Intent Routing)**: Chuyển trang thông minh dựa trên ngôn ngữ tự nhiên (Dashboard, Giao dịch, Danh mục, Trợ lý AI...).
- **Xưng hô Đặc quyền**: Phong cách phục vụ cẩn trọng, lễ phép với xưng hô **"Tôi - Ngài/Trường"**.

### 📊 2. Dashboard Thực tế (30s Real-time Sync)
- **Live Market Data**: Tự động cập nhật giá thị trường từ Finnhub mỗi 30 giây.
- **Cơ chế Fallback Thông minh**: Nếu API bị giới hạn, hệ thống tự động chuyển sang tính toán dựa trên giá vốn (Cost-basis) để đảm bảo Ngài không bao giờ bị gián đoạn dữ liệu.
- **Chỉ báo Market Live**: Chấm xanh nhấp nháy hiển thị trạng thái kết nối thời gian thực tại Header.

### 💼 3. Portfolio & Sync Tự động
- **Database Triggers**: Tích hợp PostgreSQL Function tự động cập nhật bảng `portfolios` ngay khi có lệnh `MUA/BÁN` được chèn vào bảng `transactions`.
- **Tự động hóa 100%**: Ngài không cần nhập liệu thủ công tại trang Danh mục, mọi thứ đều được đồng bộ từ Nhật ký Giao dịch.

---

## 🛠 Công Nghệ Sử Dụng

- **Frontend**: React 18 (Vite) + Tailwind CSS + Lucide Icons.
- **Backend & Real-time**: Supabase (PostgreSQL, RLS, Real-time Engine).
- **AI Brain**: Groq LPU (Llama 3.3 70B - Tốc độ siêu nhanh) & Gemini 1.5 Flash (Dự phòng).
- **Data Source**: Finnhub.io Market Data API.

---

## 🔑 Cấu Hình Biến Môi Trường (.env.local)

Để hệ thống hoạt động chính xác, Ngài vui lòng cấu hình đầy đủ các tham số sau:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_FINNHUB_API_KEY=your_finnhub_key
VITE_GROQ_API_KEY=your_groq_key
VITE_GEMINI_API_KEY=your_google_ai_key
```

---

## 💻 Hướng Dẫn Cài Đặt Cơ Sở Dữ Liệu (Supabase SQL)

Vui lòng chạy lệnh SQL sau tại **SQL Editor** của Supabase để khởi tạo bộ khung đồng bộ tự động:

```sql
-- 1. Bảng Transactions (Nhật ký)
CREATE TABLE public.transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    ticker TEXT NOT NULL,
    type TEXT CHECK (type IN ('BUY', 'SELL')) NOT NULL,
    shares_quantity NUMERIC NOT NULL,
    price_per_share NUMERIC NOT NULL,
    amount NUMERIC,
    status TEXT DEFAULT 'completed',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Bảng Portfolios (Danh mục)
CREATE TABLE public.portfolios (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    ticker TEXT NOT NULL,
    company_name TEXT,
    shares NUMERIC DEFAULT 0,
    average_buy_price NUMERIC DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, ticker)
);

-- 3. Logic Đồng bộ Tự động (Triggers)
CREATE OR REPLACE FUNCTION sync_portfolio_from_transaction()
RETURNS TRIGGER AS $$
BEGIN
    IF (NEW.type = 'BUY') THEN
        INSERT INTO public.portfolios (user_id, ticker, shares, average_buy_price)
        VALUES (NEW.user_id, NEW.ticker, NEW.shares_quantity, NEW.price_per_share)
        ON CONFLICT (user_id, ticker) DO UPDATE SET
            average_buy_price = (portfolios.shares * portfolios.average_buy_price + NEW.shares_quantity * NEW.price_per_share) / (portfolios.shares + NEW.shares_quantity),
            shares = portfolios.shares + NEW.shares_quantity,
            updated_at = now();
    ELSIF (NEW.type = 'SELL') THEN
        UPDATE public.portfolios SET
            shares = shares - NEW.shares_quantity,
            updated_at = now()
        WHERE user_id = NEW.user_id AND ticker = NEW.ticker;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_transaction_insert
AFTER INSERT ON public.transactions
FOR EACH ROW EXECUTE FUNCTION sync_portfolio_from_transaction();
```

---

## 🎨 Thiết Kế Executive Slate
- **Layout**: Bento Grid 4.0 tối ưu không gian.
- **Màu sắc**: Slate-900 (Nền chính), Indigo-500 (Điểm nhấn), Emerald (Thành công), Rose (Cảnh báo).
- **Bo góc**: Đồng nhất 32px cho cảm giác sang trọng và mềm mại.

---

**FinAI Executive** - *Hơn cả một hệ thống, đó là người trợ lý tận tâm bên cạnh Ngài trên mọi hành trình tài chính.* 🏰💹