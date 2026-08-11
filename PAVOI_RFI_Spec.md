# Tech Spec — PAVOI RFI Monitor (cột RFI + Detail modal)

**Target file:** `index.html` (single-file SPA, repo `ThaiBaHoa/qa-amo-dashboard`)
**Trạng thái:** ĐÃ TRIỂN KHAI — version hiện tại `2026.08.11-r127`
**Lịch sử:** r82 (khởi tạo) → r83 (ưu tiên overdue) → r84 (fetch theo report_id) → r85 (retry + per-report) → r86 (load theo PAVOI Open + modal fetch tươi) → **r127 (popup con: Instructions + Response mỗi RFI)**
**Phạm vi:** trang `page-pavoi`, `renderPavoi()`, loader + modal RFI. KHÔNG chạm phần khác.

---

## 0 — Mục tiêu nghiệp vụ

Một báo cáo **PAVOI** (Post Audit Verification of Implementation) gửi nhiều **RFI (Request For Information)** cho nhiều người; mỗi RFI có **target date + owner** riêng. QA AMO cần:

1. Nhìn ngay trên bảng PAVOI report nào đang có RFI **quá hạn** (overdue lâu nhất) và **ai** chịu trách nhiệm.
2. Mở chi tiết 1 PAVOI để xem **toàn bộ RFI** của từng người (status / target / completed / số ngày).

---

## 1 — Data model (đã verify trên Galileo)

### 1.1 Bảng nguồn: `dwreporting_report_task`
RFI nằm ở đây (KHÔNG phải `dwreporting_report_workflow`). Quan hệ: 1 report → nhiều stage → nhiều task. RFI là task có `task_title = 'Request For Information'`.

**Field dùng trong dashboard:**

| Field | Ý nghĩa |
|---|---|
| `report_id` | GUID liên kết tới `dwreporting_report_summary` |
| `task_title` | Loại task; RFI khi = `'Request For Information'` |
| `task_owner` | Người được giao RFI (hiển thị tên) |
| `task_status` | `Available` / `InProgress` / `NotStarted` / `PendingSignOff` / `Completed` / `Deleted` … |
| `task_delivery_status` | Cờ Galileo tự tính: `overdue` / `in progress` / `completed early` / `completed late` / `no target set` |
| `task_target_date` | Deadline của RFI |
| `task_completed_date` | Ngày RFI hoàn tất (null nếu chưa) |
| `task_id` | GUID duy nhất mỗi RFI — khoá tra popup Instructions/Response (r127) |
| `task_instructions` | **Nội dung yêu cầu** auditor gửi (text thuần, không phải HTML — probe r127) — hiện trong popup con |
| `task_response` | **Phản hồi** của owner (null nếu chưa trả lời) — hiện trong popup con |
| `task_related_section_name` | Section nguồn của RFI (vd `Verification Result`, `PAVOI Correction`) — hiện ở sub-header popup |

**Field KHÔNG dùng** (đã bỏ khỏi `$select` để giảm payload): `stage_*`, `modified_date`, `id`, `workflow_*`, `report_created_date`, `task_acceptable_response_time`.

> **Probe r127 (data thật):** trên PAVOI, `task_instructions` populate **40/40**, `task_response` **31/40** (RFI chưa hoàn tất thì `task_response = null` — hợp lệ). Cả hai là **cột trực tiếp** của `dwreporting_report_task`, KHÔNG phải EAV → không cần fetch `report_field`/`report_form_section_field`.

### 1.2 Quy tắc phân loại RFI (đã xác minh bằng data thật)

| Khái niệm | Quy tắc |
|---|---|
| **RFI hợp lệ** | `task_title === 'Request For Information'` **và** `task_status !== 'Deleted'` |
| **RFI open** | `task_status !== 'Completed'` **và** `!task_completed_date` |
| **RFI overdue** | open **và** (`ageCalc(task_target_date) < 0` **HOẶC** `task_delivery_status === 'overdue'`) |
| **Owner** | `task_owner` |
| **Worst (đại diện cột)** | RFI overdue có `ageing` âm nhất; nếu thiếu target → `ageing = 0` để vẫn vào diện worst |

> **Lý do dùng `!== 'Completed'` thay vì `=== 'InProgress'`:** RFI đang mở thực tế có nhiều status (`Available`, `InProgress`, `NotStarted`, `PendingSignOff`). Hardcode `InProgress` sẽ bỏ sót.
>
> **Lý do bổ sung cờ `task_delivery_status === 'overdue'`:** một số RFI overdue thiếu `task_target_date` → `ageCalc` trả `null`; dùng cờ Galileo để không bỏ sót khỏi `overdueCount`/`worst`.

---

## 2 — Galileo / proxy quirks (phát hiện khi debug — QUAN TRỌNG)

| # | Quirk | Hệ quả thiết kế |
|---|---|---|
| Q1 | **Proxy yêu cầu `Origin` hợp lệ** (`https://vjc-qa-amo.com` hoặc `127.0.0.1:5500`). Sai Origin → `Forbidden`. | Chỉ chạy được từ site đã deploy / localhost; không gọi tùy tiện ngoài app. |
| Q2 | **OData giới hạn 100 node/filter.** Chuỗi `report_id eq A or B or …` quá dài → HTTP 400 `node count limit '100' exceeded`. Tối đa **~16** `report_id eq` kèm clause `task_title`. | Batch **15 GUID/request** (margin 1 node). |
| Q3 | **`task_title eq 'Request For Information'` toàn hệ thống = ~24,374 record (~11MB).** API trả 1 page, không nextLink. Trên mạng chậm → vượt timeout 30s. | KHÔNG fetch global. Fetch theo report_id của PAVOI. |
| Q4 | **GUID trong `$filter` KHÔNG bọc nháy:** `report_id eq f93794a5-...` (đúng). Bọc nháy → lỗi. | Build filter không quote GUID. |
| Q5 | **Proxy/Galileo chập chờn:** thỉnh thoảng `Gateway Timeout` / 429 / 500 trên 1 request bất kỳ trong chuỗi. | Retry từng chunk 3× backoff; 1 chunk lỗi không phá các chunk khác. |
| Q6 | **Replica lag / eventual consistency:** sau khi 1 RFI được completed, một số read còn trả bản cũ (open) trong vài phút. | Modal fetch **tươi** đúng report khi click → luôn đúng hiện trạng. |
| Q7 | **`id` của report_task KHÔNG unique** (2 task khác nhau cùng `id`). | Không dùng `id` để dedup; dùng `task_id` nếu cần. Hiện không cần dedup (đã verify 22 row = 22 `task_id` distinct). |

---

## 3 — Kiến trúc load (r86)

### 3.1 Nguyên tắc "chọn đối tượng load"
- **Chỉ 65/217 PAVOI đang `report_status='Open'`** mới có thể còn RFI open. Report đã đóng → RFI hoàn tất hết.
- **Page load:** chỉ fetch RFI cho PAVOI **Open** (~65 → ~5 chunk × 15). PAVOI đã đóng → đánh dấu done-rỗng (cell hiện `—`), KHÔNG fetch.
- **Modal click:** fetch **tươi** đúng 1 report (1 query nhỏ) → cập nhật cả modal lẫn cell. Phủ luôn report đã đóng (xem lịch sử RFI on-demand) và chống stale (Q6).

### 3.2 Lazy + cache phiên + retry
- Lazy: chỉ chạy khi user mở trang PAVOI lần đầu (`showPage('pavoi')`).
- Cache trong phiên qua `pavoiRfiLoaded` + `pavoiRfiDone`.
- Retry per-chunk 3 lần (backoff `400ms × attempt`); còn chunk lỗi → `pavoiRfiLoaded=false` để lần mở trang sau **chỉ fetch phần còn thiếu** (`todo = chưa done`), không kéo lại từ đầu.
- `↻ Refresh` (`loadData(true)`) reset `pavoiRfiLoaded / pavoiRfiMap / pavoiRfiDone` → kéo mới hoàn toàn.

### 3.3 Bất biến
- GUID KHÔNG bọc nháy trong `$filter`.
- Mọi date hiển thị qua `fd()`; tính số ngày qua `ageCalc()`/`dDay()` (đã xử lý UTC+7).
- Dùng `fetchAll(url, true)` (skipOv) để không chiếm overlay chính.
- Tận dụng hàm có sẵn: `fetchAll, g, s, esc, fd, toast, setOv, renderPaged, sortD, ageCalc`.

---

## 4 — State (gần khai báo `cmrLoaded`)

```js
let pavoiRfiLoaded = false;
let pavoiRfiMap = {};            // report_id -> [rfi,...]
let pavoiRfiDone = new Set();    // report_id đã fetch xong (cell hiện data đã có dù còn chunk lỗi)
```

**Reset trong `loadData()`** (ngay sau `isLoading=true;`):
```js
pavoiRfiLoaded = false; pavoiRfiMap = {}; pavoiRfiDone = new Set();
```

---

## 5 — Hàm (đặt cạnh `renderPavoi()`)

### 5.1 `loadPavoiRfi(force=false)` — loader chính (chỉ PAVOI Open)
- `if(pavoiRfiLoaded && !force)` → `renderPavoi()` rồi return.
- Đánh dấu mọi PAVOI `report_status!=='Open'` vào `pavoiRfiDone` (done-rỗng).
- `openIds` = PAVOI `report_status==='Open'`; `todo = openIds` chưa done.
- Loop chunk 15: build `(report_id eq … or …) and task_title eq 'Request For Information'`, retry 3× backoff; mỗi chunk thành công → push vào `pavoiRfiMap` (bỏ `Deleted`) + add ids vào `pavoiRfiDone`.
- Kết thúc: có chunk lỗi → `pavoiRfiLoaded=false` + `toast` cảnh báo; không lỗi → `true`. Luôn `setOv(false)` + `renderPavoi()`.

### 5.2 `fetchPavoiRfiOne(report_id)` — fetch tươi 1 report (modal)
```js
const url = G_URL + 'dwreporting_report_task' +
  '?$select=report_id,task_title,task_owner,task_status,task_delivery_status,task_target_date,task_completed_date' +
  '&$filter=' + encodeURIComponent('report_id eq '+report_id+" and task_title eq 'Request For Information'");
const raw = await fetchAll(url, true);
pavoiRfiMap[report_id] = raw.filter(t => t.task_status !== 'Deleted');   // THAY THẾ, không cộng dồn
pavoiRfiDone.add(report_id);
```

### 5.3 `pavoiRfiSummary(report_id)` → `{total, open, overdueCount, worst}`
- `open` = list lọc theo RFI open.
- Duyệt open: `isOverdue = (ag!==null && ag<0) || task_delivery_status==='overdue'`; nếu overdue → `overdueCount++`, `eff = ag ?? 0`, chọn `worst` có `eff` âm nhất → `{owner, target, ageing:eff}`.

### 5.4 `pavoiRfiCell(report_id)` → HTML cell
- `if(!pavoiRfiDone.has(report_id))` → `…` (report chưa fetch).
- `total===0` → `—`.
- có `worst` → `Overdue <Nd>` + `+<overdueCount-1>` (nếu >1) + tooltip + dòng owner.
- else `open>0` → `<N> open`; else → `All done`.

### 5.5 `showPavoiDetail(report_id)` — async, fetch tươi
```js
async function showPavoiDetail(report_id){
  const r = allData.find(x=>x.report_id===report_id && x.report_title==='PAVOI');
  if(!r) return;
  s('pavoiMTitle', r.report_number||'—');
  s('pavoiMSub', [r.report_ref?('Ref: '+r.report_ref):null, r.dept, fd(r.raised_date)].filter(Boolean).join(' · '));
  g('pavoiModal').style.display='flex';
  s('pvk-total','…'); s('pvk-open','…'); s('pvk-over','…'); s('pvk-done','…');
  g('pavoiRfiBody').innerHTML='<tr><td colspan="5" …>Loading RFI…</td></tr>';
  try{ await fetchPavoiRfiOne(report_id); renderPavoi(); }   // cập nhật cell ngoài bảng cho khớp
  catch(e){ console.warn('[PAVOI RFI one] '+report_id, e.message); }
  renderPavoiModal(report_id);
}
```

### 5.6 `renderPavoiModal(report_id)` — vẽ KPI + bảng RFI
- KPI: `total / open / over / done` từ `pavoiRfiMap[report_id]`.
- Sort: open (overdue nặng nhất) lên đầu → completed.
- Mỗi dòng: owner / badge status (Overdue/Open/Late/Completed) / target / completed / days.

### 5.7 `closePavoiModal(e)`
```js
if(e&&e.target!==g('pavoiModal'))return; g('pavoiModal').style.display='none';
```

### 5.8 `showRfiDetail(report_id, task_id)` + `closeRfiModal(e)` — popup con (r127)
- Không fetch thêm: tra `pavoiRfiMap[report_id]` theo `task_id` (data đã có từ `fetchPavoiRfiOne` khi mở modal cha).
- Đổ `task_owner` → `#rfiMOwner`; sub-header = `Section · status · Completed/Target date`; `task_instructions` → `#rfiMInstr`; `task_response` → `#rfiMResp` (rỗng → "No response yet").
- Text qua `esc()` + `white-space:pre-wrap` để giữ xuống dòng. `closeRfiModal` cùng pattern `closePavoiModal`.

---

## 6 — UI

### 6.1 Cột RFI (giữa Department ↔ Audit Ref) trong `<thead>` `#page-pavoi`
```html
<th>Department</th>
<th>RFI</th>
<th>Audit Ref (MNT)</th>
```

### 6.2 Row click + cell trong `renderPavoi()`
```js
<tr style="cursor:pointer" onclick="showPavoiDetail('${r.report_id}')">
...
<td style="font-size:11px">${pavoiRfiCell(r.report_id)}</td>
```

### 6.3 Modal `#pavoiModal` (sau ECAR modal)
- Header: tiêu đề + sub (Ref / dept / raised date) + nút ✕.
- 4 KPI card: Total RFI / Open / Overdue / Completed (`pvk-total/open/over/done`).
- Bảng `#pavoiRfiBody`: Owner / Status / Target / Completed / Days. Class badge: `b-over / b-open / b-on / b-late`, ngày: `a-crit / a-ok`.
- **Row click (r127):** mỗi `<tr>` có `cursor:pointer` + `onclick="showRfiDetail('${report_id}','${t.task_id}')"` (owner kèm chevron ›).

### 6.3b Modal con `#rfiModal` (sau `#pavoiModal`, r127)
- Overlay riêng `z-index:225` (trên `#pavoiModal` 215) → đóng nó chỉ quay lại modal cha, không mất context.
- Header: `RFI Detail · Request For Information` / owner (`#rfiMOwner`) / sub `#rfiMSub`.
- 2 khối: **📋 Instructions** (`#rfiMInstr`) + **💬 Response** (`#rfiMResp`), nền nhạt, `white-space:pre-wrap`.

### 6.4 Trigger trong `showPage()`
```js
if(name==='pavoi'){ if(!pavoiRfiLoaded) loadPavoiRfi(); else renderPavoi(); }
```

---

## 7 — Acceptance

- [ ] Cột **RFI** xuất hiện giữa Department và Audit Ref.
- [ ] Có RFI overdue → `Overdue <Nd> · <owner>` (+`+N` nếu nhiều overdue), KHÔNG hiện `N open`. N = ngày của RFI quá hạn lâu nhất.
- [ ] Có RFI open chưa quá hạn → `N open`. Không RFI / report đã đóng → `—`. Toàn Completed → `All done`.
- [ ] Click PAVOI → modal "Loading RFI…" rồi ra 4 KPI đúng + bảng RFI từng người; open/overdue lên đầu.
- [ ] **PAVOI-414** (Open) → modal Open = **2** (đúng hiện trạng, không stale 3); cell ngoài bảng cũng cập nhật về 2 sau khi click.
- [ ] Report đã đóng → cell `—`; click vẫn xem được lịch sử RFI đầy đủ (on-demand).
- [ ] Loại đúng rác: `task_title` null/khác, `Deleted` không xuất hiện.
- [ ] Load page PAVOI chỉ ~5 nhóm (65 Open) — nhanh hơn ~3× so với 217.
- [ ] `↻ Refresh` → RFI cập nhật theo Galileo mới nhất. Console không lỗi. APP_REV = r86.

---

## 8 — Test checklist

1. Local `127.0.0.1:5500` (hoặc `vjc-qa-amo.com`), đăng nhập, `↻ Refresh`.
2. Vào trang PAVOI → load nhanh, cột RFI từ `…` → giá trị (chỉ report Open được fetch).
3. **PAVOI-414** → click → modal Open = 2; cell về 2.
4. PAVOI đang Open có RFI overdue → cell `Overdue Nd · owner`; mở modal khớp dòng đầu.
5. PAVOI đã đóng → cell `—`; click → vẫn thấy danh sách RFI completed.
6. Sửa 1 RFI trên Galileo → mở lại modal report đó → số đổi ngay (không cần Refresh); muốn cell toàn bảng đổi → `↻ Refresh`.
7. Mạng chập chờn: report lỗi tạm để `…`, rời/vào lại trang → tự fetch nốt.

---

## 9 — Giới hạn đã biết & hướng mở rộng

- **Cell tổng quan = ảnh chụp lúc load trang** (cache phiên). Số ở **modal luôn tươi** mỗi lần click. Muốn cell auto-tươi: refetch RFI của các report Open mỗi lần quay lại trang, hoặc polling định kỳ (chưa làm — cân nhắc chi phí proxy).
- **Replica lag (Q6)** là phía Galileo; modal fetch tươi giảm thiểu nhưng không loại bỏ 100% nếu lag kéo dài.
- **PAVOI Open nhưng RFI thật đã xong** vẫn được fetch (đúng, vì cần biết "All done"). Không tối ưu thêm theo semantic_status để tránh bỏ sót.
- Nếu sau này muốn tính RFI vào KPI/on-time rate: cần guard riêng (RFI là task con, khác vòng đời report — KHÔNG trộn vào `semCalc()` của report).

---

## 10 — Tham chiếu nhanh (debug API)

```bash
BASE="https://galileo-proxy.thaibahoa2308.workers.dev/proxy"
ORIGIN="https://vjc-qa-amo.com"

# Tìm report_id 1 PAVOI
curl -s -G "$BASE/dwreporting_report_summary" -H "Origin: $ORIGIN" \
  --data-urlencode '$select=report_id,report_number,report_status' \
  --data-urlencode "\$filter=org_unit_name eq 'QA AMO' and report_title eq 'PAVOI' and contains(report_number,'414')"

# RFI của 1 report (GUID KHÔNG bọc nháy)
curl -s -G "$BASE/dwreporting_report_task" -H "Origin: $ORIGIN" \
  --data-urlencode '$select=task_owner,task_status,task_delivery_status,task_target_date,task_completed_date' \
  --data-urlencode "\$filter=report_id eq <GUID> and task_title eq 'Request For Information'"

# Đếm RFI open (completed null)
curl -s -G "$BASE/dwreporting_report_task/\$count" -H "Origin: $ORIGIN" \
  --data-urlencode "\$filter=report_id eq <GUID> and task_title eq 'Request For Information' and task_completed_date eq null"
```
