# Telegram setup

## 1. Tạo bot

1. Mở BotFather trên Telegram.
2. Tạo bot mới và lấy `TELEGRAM_BOT_TOKEN`.
3. Không dán token vào code, không commit token lên Git.

## 2. Tạo group và bật Topics

1. Tạo một group Telegram riêng cho Hưng Phát.
2. Vào phần quản trị group và bật `Topics`.
3. Tạo 2 topic:
   - `Báo giá website`
   - `Chatbot website`

## 3. Thêm bot vào group

1. Thêm bot vừa tạo vào group.
2. Cấp quyền gửi tin nhắn cho bot.

## 4. Lấy `TELEGRAM_CHAT_ID`

1. Gửi một tin nhắn bất kỳ vào group.
2. Dùng bot hoặc công cụ đọc cập nhật `chat_id` của group.
3. Điền giá trị đó vào `TELEGRAM_CHAT_ID`.

## 5. Lấy `message_thread_id`

1. Mở từng topic đã tạo.
2. Lấy `message_thread_id` của topic `Báo giá website`.
3. Lấy `message_thread_id` của topic `Chatbot website`.
4. Điền lần lượt vào:
   - `TELEGRAM_QUOTE_TOPIC_ID`
   - `TELEGRAM_CHAT_TOPIC_ID`

## 6. Tạo file `.env.local`

Sao chép nội dung từ `.env.example` sang `.env.local` rồi điền giá trị thật.

## 7. Test form

1. Chạy website local ở `http://localhost:3100`.
2. Mở form báo giá hoặc chatbot.
3. Gửi một yêu cầu thử.
4. Kiểm tra tin nhắn đã vào đúng topic.

