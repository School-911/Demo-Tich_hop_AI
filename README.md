
# 🏰 Hệ Thống Quản Lý Tài Chính Thông Minh - Hầu Gái AI Executive

Chào mừng bạn đến với dự án **Quản lý Tài Chính Cá Nhân hiện đại**, tích hợp **Trợ lý Điều hành AI (Executive AI Agent)** với phong cách phục vụ tận tâm.

Hệ thống được thiết kế nhằm giúp người dùng:
- Theo dõi tài sản thực tế.
- Quản lý danh mục đầu tư chuyên sâu.
- Kiểm soát dòng tiền và chi tiêu.
Một cách **trực quan, thông minh và tự động hóa cao**.

---

## 🌟 Tính Năng Nổi Bật

### 🤖 1. Trợ Lý Điều Hành "Hầu Gái AI" (Core Feature)
Đây là **trái tim của hệ thống** — không phải chatbot đơn thuần mà là một **AI Agent điều hành thực thụ**.

#### ⚡ Nói là Làm (Action-Oriented)
- **Nhận diện Intent:** Tự động hiểu ý định người dùng để điều hướng hệ thống.
- **Ví dụ lệnh:**
  - `"Mở mục thu chi"` hoặc `"Xem lịch sử tiền"` → Hệ thống tự chuyển đến `/transactions`.
  - `"Xem danh mục tài sản"` hoặc `"Portfolio"` → Hệ thống tự chuyển đến `/portfolio`.

#### 🧲 Giao diện Di động (Draggable UI)
- **Icon di chuyển:** Bong bóng chat (Chat bubble) có thể kéo thả tự do khắp màn hình.
- **Tối ưu trải nghiệm:** Giúp người dùng không bị che khuất các biểu đồ hay con số quan trọng khi đang phân tích.

#### 🧠 Tự Suy Nghĩ (Auto-Thinking)
- **Chủ động phân tích:** Khi có tin tức tài chính mới, AI sẽ chủ động đưa ra nhận định ngắn gọn.
- **Nhãn hiển thị:** Các tin nhắn tự động được đánh dấu `[AUTO-THINKING]`.

#### 🎭 Phong cách phục vụ
- **Xưng hô:** Sử dụng ngôn ngữ lễ phép: **"Em" - "Chủ nhân"** hoặc **"Ngài"**.

---

### 📊 2. Quản Lý Danh Mục Đầu Tư (Portfolio & Investments)

#### 📁 Portfolio (Danh mục)
- **Tổng quan:** Hiển thị tổng giá trị tài sản ròng.
- **Tỉ trọng:** Biểu đồ phân bổ các loại tài sản (Cổ phiếu, tiền mặt...).

#### 📈 Investments (Đầu tư)
- **Phân tích:** Cung cấp biểu đồ kỹ thuật và theo dõi biến động giá.

---

### 💸 3. Quản Lý Thu Chi & Ngân Sách

#### 💳 Transactions (Giao dịch/Thu chi)
- **Ghi chép:** Lưu trữ toàn bộ dòng tiền vào và ra tại `/transactions`.

#### 📉 Budget (Ngân sách)
- **Hạn mức:** Thiết lập giới hạn chi tiêu hàng tháng tại `/budget`.

---

## 🛠 Công Nghệ Sử Dụng

- **Frontend:** React.js (Vite) + Tailwind CSS.
- **AI Engines:** Groq (Llama 3.3) & Google Gemini (1.5 Flash).
- **Navigation:** React Router DOM.

---

## 🔑 Cấu Hình Biến Môi Trường (.env)

Bạn cần tạo file `.env` hoặc `.env.local` tại thư mục gốc và cấu hình như sau:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_FINNHUB_API_KEY=
VITE_GEMINI_API_KEY=
VITE_GROQ_API_KEY=
VITE_OPENAI_API_KEY=
```

---

## 💻 Hướng Dẫn Cài Đặt

1. **Tải mã nguồn:** `git clone <link-github-cua-ban>`
2. **Cài đặt thư viện:** `npm install`
3. **Chạy ứng dụng:** `npm run dev`

---

---

## 💻 Hướng Dẫn cài cơ sở dữ liệu supabase

1. **Tạo 1 project trên supabase** 
2. **Vào SQL Editor và chạy lệnh sau:** `create table public.portfolios (
  id uuid not null default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  ticker text not null,
  company_name text,
  shares numeric not null default 0,
  average_buy_price numeric not null default 0,
  created_at timestamp with time zone not null default now()
);
-- 1. Kích hoạt Bảo vệ cấp Dữ liệu (Row Level Security - RLS)
alter table public.portfolios enable row level security;
-- 2. Chỉ cho người dùng Xem danh mục cổ phiếu của ĐÚNG TÀI KHOẢN ĐÓ
create policy "Users can view own portfolio"
on public.portfolios for select to authenticated 
using ( auth.uid() = user_id );
-- 3. Chỉ cho người dùng Thêm mã chứng khoán MỚI vào tài khoản của mình
create policy "Users can insert own portfolio"
on public.portfolios for insert to authenticated 
with check ( auth.uid() = user_id );
-- 4. Chỉ cho người dùng Xóa cổ phiếu TỒN TẠI trong tài khoản của họ
create policy "Users can delete own portfolio"
on public.portfolios for delete to authenticated 
using ( auth.uid() = user_id );`
3. **Chạy code trên:** ` run `

---