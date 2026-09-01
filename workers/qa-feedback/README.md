# qa-feedback

Cloudflare Worker nhận bug report từ QA AMO Dashboard và đẩy vào Telegram.

Tách riêng khỏi `galileo-proxy` **có chủ đích**: galileo-proxy là đường dữ liệu sống
của toàn dashboard, hỏng nó là mất data mọi trang. Kênh báo lỗi hỏng thì chỉ hỏng
nút báo lỗi.

## Luồng

    Dashboard ──POST JSON + Bearer <supabase JWT>──▶ qa-feedback ──▶ Telegram Bot API
    (không giữ token)                                (giữ secret)      (chat của admin)

Worker **bắt buộc** kèm Supabase session token hợp lệ. Không có bước này thì endpoint
là công khai — ai tìm ra URL cũng bơm được tin nhắn vào Telegram không giới hạn.
Đổi lại, email trong tin nhắn là email đã xác thực, không phải người dùng tự khai.

## Deploy

    npx wrangler login              # một lần, mở trình duyệt
    npx wrangler secret put TG_TOKEN   # token bot từ @BotFather
    npx wrangler secret put TG_CHAT    # chat_id từ @userinfobot
    npx wrangler deploy

## Debug

    npx wrangler tail               # log realtime khi bấm nút báo lỗi trên dashboard

## Payload

```json
{ "message": "…", "name": "…", "role": "…", "page": "…", "rev": "…",
  "ua": "…", "shot": "data:image/jpeg;base64,…" }
```

`shot` tuỳ chọn. Ảnh gửi bằng `sendPhoto` rời khỏi tin nhắn text để không đụng
giới hạn caption 1024 ký tự của Telegram.
