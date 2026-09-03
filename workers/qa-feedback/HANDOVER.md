# Bàn giao — kênh báo lỗi Telegram (r151)

**Ngày:** 01/09/2026 · **Máy:** PC nhà (`C:\Users\thaib\Documents\GitHub\qa-amo-dashboard`)
**Trạng thái:** worker ĐÃ CHẠY · code ĐÃ ÁP nhưng **CHƯA COMMIT, CHƯA PUSH**

---

## 1. Đã làm gì

Nút sidebar `💬 Feedback / Bug Report` trước đây mở Google Form ở tab mới. Nay bấm ra
modal ngay trong app; gửi xong là **tin nhắn Telegram tới máy admin**, kèm:

- danh tính **đã xác thực phía server** (không phải người dùng tự khai)
- trang đang xem · `APP_REV` · user agent
- **ảnh chụp màn hình** tự đính (tuỳ chọn, mặc định bật)

```
Dashboard ──POST JSON + Bearer <supabase JWT>──▶ qa-feedback ──▶ Telegram Bot API
(không giữ token)                                (giữ secret)      (chat của admin)
```

## 2. Phần ĐÃ XONG, không phải làm lại

| Hạng mục | Trạng thái |
|---|---|
| Worker `qa-feedback` | **Đã deploy, đang chạy** — `https://qa-feedback.thaibahoa2308.workers.dev` |
| Secret `TG_TOKEN`, `TG_CHAT` | **Đã đặt trên Cloudflare** — không phải đặt lại ở máy khác |
| Vars `SUPA_URL`, `SUPA_KEY` | Trong `wrangler.toml` (vốn đã công khai trong `index.html`) |
| Bot Telegram | Đã tạo, đã nhắn khởi động |

Secret nằm trên Cloudflare chứ không nằm ở máy, nên **máy công ty chỉ cần
`npx wrangler login` một lần** là deploy/tail được, không phải `secret put` lại.

## 3. Phần CÒN LẠI ở máy công ty

```
cd <repo>
git pull                                  # phải sạch cây làm việc
python workers/qa-feedback/apply-r151.py  # áp code + 3 file doc, tự đổi rev theo bản mới
sh scripts/check-doc-sync.sh              # sẽ CÒN KẸT ở QA_AMO_Dashboard.md — xem §5
git add index.html PROJECT_TECH_SPEC.md TECHNICAL_REFERENCE.md CLAUDE.md workers .gitignore
git commit                                # message bắt đầu bằng 'r151: '
git push                                  # = deploy lên vjc-qa-amo.com
```

> ⚠️ **ĐỪNG `git add -A`** — `.ua-src/` phải giữ untracked (ghi chú trong `.gitignore`
> giải thích lý do: scanner của plugin chạy `git ls-files -co --exclude-standard`).

`apply-r151.py` tự đọc `APP_REV` hiện tại rồi bump; mỗi điểm neo phải khớp **đúng một
lần**, sai là dừng và **không ghi gì**. Chạy lại lần hai sẽ báo lỗi ở bước 1 (đã có
`FB_URL`) — đúng như mong đợi.

## 4. PHÉP THỬ THẬT — ✅ ĐÃ CHẠY 03/09/2026

r151 ship ở commit `fd5dfe7`. Chặng **app → worker → Telegram đã chạy thật**: tin nhắn
và ảnh màn hình về tới máy admin, `wrangler tail` in `POST … - Ok` không kèm dòng lỗi.
Giao diện modal cũng đã xem bằng mắt trên production.

Cách chạy lại phép thử:

1. Mở `vjc-qa-amo.com`, đăng nhập
2. `cd "…\workers\qa-feedback"; npx.cmd wrangler tail` — **PowerShell 5.1 không có `&&`**, dùng `;`
3. Bấm nút Feedback, gõ gì đó, gửi
4. Kỳ vọng: toast xanh trong app + tin nhắn Telegram + ảnh màn hình

### Ba lỗi đã gặp khi chạy thử lần đầu — đọc trước khi nghi ngờ code

Lỗi Telegram giờ được `console.error` ra `wrangler tail` chứ không chỉ nằm trong body
response — bản đầu chỉ trả `detail` trong body, mà `tail` không đọc body, nên lúc hỏng
thì tail in `POST - Ok` và không nói gì thêm. Cùng họ lỗi với r146 (catch nuốt lỗi).

| Log | Nghĩa thật | Sửa |
|---|---|---|
| `404 Not Found` | **Token sai**, không phải 401. Ở đây `TG_TOKEN` chỉ có 35 ký tự và **không có dấu `:`** — tức chỉ lưu nửa sau của token, mất phần `<bot_id>:` ở đầu | `wrangler secret put TG_TOKEN`, dán **full** token từ BotFather |
| `400 chat not found` | Chưa ai bấm **Start** với chính bot đó. Telegram trả `chat not found` (không phải `Forbidden`) cho chat riêng chưa tồn tại | Mở Telegram, tìm `@MQA_AMObot`, bấm Start — **không phải đổi secret** |
| — | Bot đang dùng là **`@MQA_AMObot`** | |

Worker tự chẩn đoán khi hỏng: khi gặp 404 nó log **hình dạng** `TG_TOKEN` (độ dài, có
khoảng trắng không, có đúng định dạng không — **không bao giờ log giá trị**); khi gặp
`chat not found` nó gọi `getMe` + `getUpdates` để in ra tên bot và những chat id đã nhắn
cho bot, so với `TG_CHAT` đang đặt.

## 5. Hook pre-commit SẼ CHẶN — và đó là đúng

`check-doc-sync.sh` canh cả `QA_AMO_Dashboard.md` trong vault `obsidian-mind`. Note đó
**không được ghi từ phiên chạy trong repo** (luật `CLAUDE.md` toàn cục). Hai cách:

- **Đúng bài:** mở một phiên Claude **trong thư mục vault**, cập nhật note (header
  `Rev hiện tại:` + `Cập nhật context:` + 1 dòng §8 "Gần đây"), rồi quay lại commit.
- **Tạm:** `git commit --no-verify` rồi cập nhật note sau.

## 6. Quyết định đã chốt (đừng lật lại nếu không có lý do mới)

- **Loại Chatwoot.** Nhu cầu là *thông báo* cho một người nhận, không phải hộp thư hỗ
  trợ nhiều agent. Chatwoot phải nuôi Rails + Postgres + Redis, và ảnh chụp chứa dữ
  liệu QA sẽ nằm trên hạ tầng bên thứ ba.
- **Chấp nhận kênh MỘT CHIỀU.** Không trả lời lại người báo trong dashboard được —
  nhắn Teams/email riêng. Đổi lấy việc không phải dựng và trực một hệ hỗ trợ.
- **Worker riêng, không thêm route vào `galileo-proxy`.** Proxy là đường dữ liệu sống
  của toàn app; sửa nhầm là mất data mọi trang. Kênh báo lỗi hỏng thì chỉ hỏng nút báo lỗi.
- **Token bot chỉ ở Worker secret.** Site là GitHub Pages công khai — nhúng token vào
  `index.html` là ai View Source cũng lấy được; obfuscate vô nghĩa với static file.
- **Bắt buộc Supabase JWT.** Thiếu bước này thì endpoint công khai, ai biết URL cũng
  bơm tin nhắn không giới hạn vào Telegram admin.
- **Bỏ hẳn nút Google Form**, không chạy song song — hai kênh thì phải trực hai chỗ.
- **Chưa làm tự bắt lỗi JS** (`window.onerror` → đính kèm). Cố ý hoãn sang rev sau,
  khi kênh Telegram đã chạy ổn.

## 7. Bẫy đã gặp — ghi lại để khỏi mất thời gian lần nữa

**Repo máy nhà đi sau origin 16 commit.** Bản vá đầu tiên viết trên nền r141 và định
bump lên `r142` — trong khi **r142 đã tồn tại** trên origin (KPI 7 — PAVOI KPI), và
origin đã ở r150. Thứ phát hiện ra là `check-doc-sync.sh`: nó báo note vault ở
`header=r150` trong khi code local r142. **Con số CAO HƠN code nghĩa là repo local cũ,
không phải note cũ.** ⇒ Chạy `git fetch && git status -sb` **TRƯỚC** khi bump `APP_REV`.

**PowerShell 5.1 không có `&&`.** `cd "path" && npx ...` chết ở parser. Dùng `;` hoặc
tách lệnh.

**ExecutionPolicy mặc định là `Restricted`** (CurrentUser + LocalMachine đều
`Undefined`) → mọi `.ps1` bị chặn, kể cả shim `npx.ps1` của Node. **Chữa: gọi `npx.cmd`**
thay vì `npx`, không phải đổi thiết lập hệ thống. Cùng gốc rễ này làm `preview_start`
của Claude Code không chạy được trên máy nhà.

**MCP `om` — `record_work` đang hỏng.** Từ chối mọi lời gọi với thông báo *"the summary
field contains tool-call markup"*, kể cả câu tiếng Anh đơn giản nhất. `health` báo vault
bình thường, `search` thì timeout. Vì vậy phiên này **không ghi được vào vault** — file
bàn giao này thay thế. Đáng kiểm lại server `om` khi rảnh.

## 8. Lỗi CÓ SẴN đã phát hiện — cố ý KHÔNG sửa (ngoài phạm vi)

1. `PROJECT_TECH_SPEC.md`: mục `### 8.10 Report Status` bị chèn **sau** tiêu đề
   `## 9. Design system (CSS)`, nằm chen giữa §9 và §9.1. Có từ r131.
2. `PROJECT_TECH_SPEC.md` §14: bảng không giảm dần đúng thứ tự — dòng `r150` nằm **sau**
   `r149`.
3. `CLAUDE.md` ghi `Rev current: r148` trong khi code đã r150 — doc drift có sẵn, đúng
   cái bẫy mà chính file đó cảnh báo đã xảy ra hai lần. (`apply-r151.py` có sửa dòng này
   lên r151 vì guard đòi, nhưng khoảng trống r149–r150 thì không lấp.)
4. `.gitignore` có sẵn thay đổi chưa commit (khối `.ua/` `.ua-src/`) từ trước phiên này.

---

## Phụ lục — file trong thư mục này

| File | Vai trò |
|---|---|
| `src/index.js` | Code worker. **Bản đang chạy trên Cloudflare = bản này.** |
| `wrangler.toml` | Config + vars. Secret KHÔNG nằm ở đây. |
| `apply-r151.py` | Áp thay đổi vào `index.html` + 3 file doc. Chạy sau `git pull`. |
| `README.md` | Kiến trúc worker, lệnh deploy/debug. |
| `HANDOVER.md` | File này. |
