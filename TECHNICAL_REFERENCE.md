# QA AMO Dashboard — Tài liệu kỹ thuật

## Cấu hình cố định (KHÔNG được thay đổi nếu không có confirm)

```javascript
const G_URL     = 'https://galileo-proxy.thaibahoa2308.workers.dev/proxy/';
const AI_URL    = 'https://galileo-ai.thaibahoa2308.workers.dev';  // AI Assistant (r112)
const SUPA_URL  = 'https://czftzgdcnpnspbbegwjt.supabase.co';
const ORG_UNIT  = 'QA AMO';   // Dùng cho loadData() chính
```

---

## Bảng mapping: Page → Data source → Filter

| Page | Function | API Table | org_unit_name | Filter bổ sung |
|---|---|---|---|---|
| Overview, Open Reports, Overdue, KPI Charts, All Forms, PAVOI, Audit Plan | `loadData()` | `dwreporting_report_summary` | `'QA AMO'` (ORG_UNIT) | không |
| CMR-CAR | `loadCmr()` | `dwreporting_report_summary` | **`'TQA'`** | `report_title eq 'CMR CAR'` |
| ECAR | `loadEcar()` | `dwreporting_report_summary` | **`'TQA'`** | `report_title eq 'ECAR'` |
| Documents | `loadDocuments()` | `dwreporting_document_summary` | không filter | filter `Active` client-side |
| Documents (detail) | on-demand | `dwreporting_document_task` | — | `document_revision_id eq '{id}'` |

> ⚠️ **QUAN TRỌNG:** CMR-CAR và ECAR dùng `org_unit_name = 'TQA'` — KHÔNG phải `ORG_UNIT`. Đây là đặc thù của hệ thống Galileo, không phải bug. Không được đổi sang `ORG_UNIT`.

---

## Chi tiết từng data load

### 1. `loadData()` — Data chính cho phần lớn các page

Gọi khi: login, refresh, hết cache (TTL 4h).

**Bước 1 — Report Summary**
```
GET dwreporting_report_summary
  $select: report_id, report_title, report_number, report_status,
           org_unit_name, raised_date, audit_title, audit_id,
           modified_date, valid_from, valid_to, owner_id
  $filter: org_unit_name eq 'QA AMO'
```
→ Dedup: giữ 1 record/report_id có `modified_date` mới nhất, bỏ record không có `report_number`.

**Bước 2 — Users**
```
GET dwreporting_users
  $select: user_id, full_name
```
→ Build `userMap[user_id] = full_name` để lookup `owner_id`.

**Bước 3 — Report Workflow**
```
GET dwreporting_report_workflow
  $select: report_id, stage_type, stage_status,
           stage_completed_date, stage_target_date
```
→ Build `wfMap[report_id]`: chỉ lấy stage `ReportAcceptReject` (Completed/InProgress) để lấy `close_date`.
→ Build `wfAllMap[report_id]`: tất cả stages để render workflow steps.

**Bước 4 — Custom Fields**
```
GET dwanalytics_report_form_section_field
  $select: report_id, field_name, text_value
  $filter: field_name eq 'Target date'
        or field_name eq 'Issue Date'
        or field_name eq 'Finding level'
        or field_name eq 'Repetitive'
        or field_name eq 'First extension agreed date'
        or field_name eq 'Second extension agreed date'
        or field_name eq 'Audit Ref. No'
        or field_name eq 'Request For Verification'
        or field_name eq 'Report Reference'
        or field_name eq 'Verification Result'
        or field_name eq 'Department'
        or field_name eq 'Finding description'
        or field_name eq 'Nature of finding'
```
→ Build `fMap[report_id][field_name] = text_value`. Giữ giá trị đầu tiên (không ghi đè).
→ `Finding description` → `r.finding_desc`, `Nature of finding` → `r.nature_raw` (dùng cho KPI 2 và cột mô tả ở 2 trang AMO-ECAR/MCAR). Xem [§7 KPI 2](#7-kpi-2--early-detection-tự-động).

**Bước 5 — Audit Summary**
```
GET dwreporting_audit_summary
  $select: audit_id, number, title, audit_type, status,
           scheduled_start_date, actual_start_date, closed_date,
           lead_auditor_name, primary_scope_item_name, location_name
  (không filter — chỉ 86 records, lấy hết)
```
→ Filter client-side: giữ audit có `audit_id` trong QA AMO reports, HOẶC là `Internal Audit`/`Inspection` do `QA_AMO_AUDITORS` dẫn.

**Bước 6 — Audit Workflow**
```
GET dwreporting_audit_workflow
  $select: audit_id, stage_id, stage_title, stage_status, stage_owner,
           stage_target_date, stage_started_date, stage_completed_date
```
→ Dedup theo `stage_id` trong mỗi audit.

---

### 2. `loadCmr()` — CMR-CAR page

**Bước 1 — Summary**
```
GET dwreporting_report_summary
  $select: report_id, report_number, report_status,
           audit_title, raised_date, modified_date
  $filter: org_unit_name eq 'TQA' and report_title eq 'CMR CAR'
```

**Bước 2 — Custom Fields**
```
GET dwanalytics_report_form_section_field
  $select: report_id, field_name, text_value
  $filter: field_name eq 'Aircraft Registration'
        or field_name eq 'Finding description'
        or field_name eq 'Finding level'
        or field_name eq 'NC Type'
        or field_name eq 'Target date'
        or field_name eq 'Audit Ref. No'
        or field_name eq 'ATA Chapter'
        or field_name eq 'Defect Classification'
        or field_name eq 'Department'
        or field_name eq 'Corrective action plan'
        or field_name eq 'Final action taken'
        or field_name eq 'Issued to (person)'
        or field_name eq 'Verified by (auditor)'
        or field_name eq 'Date completed'
        or field_name eq 'RCA analysis'
```
→ Fetch toàn bộ theo field_name (không filter report_id), sau đó post-filter bằng `cmrIdSet`.
→ `Finding description` được gom thành array `findings[]`, sort theo số đầu dòng.

---

### 3. `loadEcar()` — ECAR page

**Bước 1 — Summary**
```
GET dwreporting_report_summary
  $select: report_id, report_number, report_status,
           audit_title, raised_date, modified_date
  $filter: org_unit_name eq 'TQA' and report_title eq 'ECAR'
```

**Bước 2 — Custom Fields**
```
GET dwanalytics_report_form_section_field
  $select: report_id, field_name, text_value
  $filter: field_name eq 'Target date'
        or field_name eq 'Aircraft Registration'
        or field_name eq 'Finding description'
        or field_name eq 'Date completed'
        or field_name eq 'Issued by'
```
→ Cùng pattern với CMR: fetch toàn bộ theo field_name, post-filter bằng `ecarIdSet`.

---

### 4. `loadDocuments()` — Documents page

**Bước 1 — Document Summary**
```
GET dwreporting_document_summary
  (không filter, lấy hết)
```
→ Filter client-side: `document_revision_status === 'Active'`.
→ Dedup theo `document_revision_id`, giữ `modified_date` mới nhất.

**Bước 2 — Document Tasks (on-demand khi click detail)**
```
GET dwreporting_document_task
  $filter: document_revision_id eq '{revId}'
```
→ Thử với string UUID trước, fallback sang numeric nếu lỗi.
→ Cache vào `docTaskCache[revId]` để không fetch lại.

---

### 5. Supabase — Auth & User Management

| Operation | Query |
|---|---|
| Login | `sb.auth.signInWithPassword({ email, password })` |
| Register | `sb.auth.signUp({ email, password })` → `sb.from('users').insert(...)` |
| Logout | `sb.auth.signOut()` |
| Session restore | `sb.auth.getSession()` → `sb.from('users').select(...).eq('supabase_id', uid)` |
| Load users (admin) | `sb.from('users').select('*').order('created_at')` |
| Approve/Reject/Admin | `sb.from('users').update({ role }).eq('id', id)` |
| Change password | `sb.auth.updateUser({ password })` |
| Forgot password | `sb.auth.resetPasswordForEmail(email, { redirectTo })` |

**Bảng `public.users`:**
```
id          uuid  PRIMARY KEY
supabase_id uuid  UNIQUE — link với auth.users
email       text  UNIQUE
full_name   text
role        text  CHECK IN ('pending','approved','rejected','admin')
created_at  timestamptz
```

**RLS Policies:**
- `select_all`: `auth.uid() = supabase_id OR get_my_role() = 'admin'`
- `insert_own`: `auth.uid() = supabase_id`
- `update_all`: `auth.uid() = supabase_id OR get_my_role() = 'admin'`
- Function `get_my_role()`: `SECURITY DEFINER` — tránh infinite recursion

---

### 7. KPI 2 — Early Detection (TỰ ĐỘNG)

**Định nghĩa KPI (trang Early Detection — `renderKpi2()`):**
```
KPI 2 = (số AMO-ECAR đã được MCAR phát hiện SỚM hơn, trùng nội dung/Nature)
        ÷ (tổng số AMO-ECAR trong kỳ) × 100%
```
> Tính **TỰ ĐỘNG**, không dùng Supabase, không cần người xác nhận. Tử số KHÔNG phải
> tổng MCAR. (Bản cũ chia `MCAR ÷ AMO-ECAR` cho tỷ lệ thường >100%, vô nghĩa — đã bỏ.)

**Nguồn dữ liệu:** `report_title eq 'AMO ECAR'` (mẫu số) và `'MCAR'` (phát hiện nội bộ),
từ `allData` (org `'QA AMO'`). KHÔNG liên quan report `'ECAR'` của TQA.

**Lấy `Nature of finding` — bảng KHÁC với loadData:**
```
GET dwanalytics_report_field          ← KHÁC dwanalytics_report_form_section_field
  $select: report_id, field_name, value_text   ← cột value_text (không phải text_value)
  $filter: field_name eq 'Nature of finding'
```
→ Đa giá trị (xuyên section, cả nhãn cha lẫn con) → gom `Set` mỗi report → quy **nhóm
cha** qua `NATURE_PARENT` / `natureGroups()` (cây cha–con từ `dwreporting_general_lists`).
`loadKpi2()` build `kpi2Rows`: mỗi record có `natureGroups[]`, `finding_desc`, `descTokens`.

**Quy tắc khớp tự động** — `isEarlyDetected(ecar, mcarPool)`: 1 AMO-ECAR = "phát hiện
sớm" nếu tồn tại ≥1 MCAR thỏa **cả hai**:
1. `MCAR.raised_date < AMO-ECAR.raised_date` (MCAR sớm hơn), VÀ
2. cùng ≥1 nhóm cha Nature **HOẶC** `tokenSim(finding_desc) ≥ K2_SIM_THRESHOLD`.

- `normDesc()` chuẩn hóa mô tả; `descTokens()` tách token (>3 ký tự); `tokenSim(A,B)` =
  overlap ÷ min(size) ∈ 0..1.
- **`K2_SIM_THRESHOLD`** (mặc định `0.5`) = ngưỡng "giống nội dung", chỉnh 1 chỗ.
- **MCAR pool = TẤT CẢ MCAR mọi năm** (cặp sớm hơn có thể ở năm trước); bộ lọc Năm/Quý
  chỉ áp lên AMO-ECAR (mẫu số).

**Bảng group:** mỗi nhóm cha Nature (hoặc quarter/year/scope) hiển thị
(AMO-ECAR phát hiện sớm) ÷ (tổng AMO-ECAR nhóm).

**`buildKPI2()` (KPI Charts) — độc lập:** cột MCAR vs AMO-ECAR theo nhóm cha Nature
(top 12) + đường Rate% — bức tranh **khối lượng**, không liên quan phép tính phát hiện sớm.

> ⚠️ Bản trước (rev r76) dùng engine **bán tự động** + bảng Supabase `kpi2_match`
> (admin xác nhận từng cặp). ĐÃ BỎ theo quyết định dùng tự động (rev r77). Bảng
> `kpi2_match` nếu đã tạo thì **không còn được dùng** — có thể drop. Việc tự động vs có
> người duyệt vẫn là điểm chờ Lãnh đạo chốt (xem `KPI2_DECISION_POINTS.md`, Quyết định 4).

---

## Giới hạn OData (KHÔNG được vượt qua)

| Giới hạn | Giá trị | Lý do |
|---|---|---|
| MaxNodeCount | 100 nodes | Mỗi `or` trong `$filter` tốn 2 nodes |
| Cách tính | n terms `or` nhau = `2n-1` nodes | 50 `report_id` = 99 nodes ❌ |
| Pattern an toàn | Chỉ filter `field_name` (≤15 terms = 29 nodes) | Fetch hết rồi post-filter JS |
| ⚠ Timeout (r107) | `field_name`-only mà tên field generic (vd `'Finding description'` ~14k row) | Quá 30s → rỗng âm thầm. Thêm `report_raised_date ge <ISO>` để thu hẹp + chunk ~8 field/query. |
| ⚠ `report_id` 400 | `report_id eq '<uuid>'` trên `report_field`/`report_form_section_field` | Trả **HTTP 400** (cột không filter được) — bắt buộc post-filter JS. |

---

## Cache

```javascript
// Cache key
sessionStorage.setItem('qaCache', JSON.stringify({ ts: Date.now(), data: allData, ... }))

// TTL: 4 giờ (14400000ms)
// Hiển thị: "Cache: Xh Ym ago"
// Force refresh: loadData(true)
```

---

## Cloudflare Workers

App có **2 Worker riêng** — đừng nhầm:

### 1. `galileo-proxy` (dữ liệu — `G_URL`)

```javascript
const ALLOWED_ORIGINS = [
  'https://vjc-qa-amo.com',
  'https://www.vjc-qa-amo.com',
  'https://thaibahoa.github.io',
];
// Block nếu không có Origin hoặc Origin không trong whitelist → 403
// Chỉ cho phép GET, không POST/PUT/DELETE
// API Key Galileo lưu trong Worker secret GALILEO_KEY
// Timeout: 30s
```

### 2. `galileo-ai` (AI Assistant — `AI_URL`, r112)

- Proxy **Anthropic Messages API** cho AI Assistant. Giữ secret **`ANTHROPIC_API_KEY`** server-side (client không bao giờ thấy key).
- Nhận **POST** `{ system, tools, messages }`, trả nguyên response Messages API (`content[]`, `stop_reason`).
- Client chạy **tool-use tại browser**: Claude sinh `tool_use` → JS truy vấn `allData`/`auditData` → `tool_result` → lặp ≤6 round. **Chỉ kết quả truy vấn được gửi lên API, KHÔNG upload dữ liệu thô.**
- Chi tiết kiến trúc: `PROJECT_TECH_SPEC.md` §8.9.

---

## Quy tắc khi sửa code

1. **Không đổi `org_unit_name` của CMR-CAR và ECAR** — luôn là `'TQA'`, không phải `ORG_UNIT`
2. **Không thêm `report_id` vào `$filter`** của `dwanalytics_report_form_section_field` **và `dwanalytics_report_field`** — trên `report_field` trả **HTTP 400** (cột không filter được), không chỉ là chuyện MaxNodeCount. Luôn fetch theo `field_name` + post-filter JS bằng `Set` report_id.
   - ⚠ **Field name generic timeout (r107):** `'Finding description'` ~14k row toàn hệ thống → query `field_name`-only quá 30s → rỗng. Thu hẹp bằng `report_raised_date ge <raised sớm nhất − 2d>` (suy động từ `allData`) + chunk ~8 field/query. Xem `loadQcsDetail`, PROJECT_TECH_SPEC §8.8 / I11.
3. **Không đổi `ORG_UNIT`** — ảnh hưởng tất cả pages chính
4. **Không bật `ALLOWED_ORIGINS = '*'`** trong Worker
5. **Không xóa `SECURITY DEFINER`** khỏi `get_my_role()` — sẽ gây infinite recursion RLS
6. **KPI 2 — Nature dùng bảng `dwanalytics_report_field` (cột `value_text`)**, KHÁC
   `dwanalytics_report_form_section_field` (cột `text_value`) của `loadData()`. Đừng gộp nhầm.
7. **KPI 2 tính TỰ ĐỘNG** qua `isEarlyDetected()`; tử số = AMO-ECAR có MCAR phát hiện sớm
   (raised_date sớm hơn) trùng nội dung/Nature, KHÔNG phải tổng MCAR. Ngưỡng giống mô tả =
   `K2_SIM_THRESHOLD`. Các phương án còn chờ Lãnh đạo chốt: xem `KPI2_DECISION_POINTS.md`.
