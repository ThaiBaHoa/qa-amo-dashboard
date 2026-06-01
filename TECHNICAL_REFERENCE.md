# QA AMO Dashboard — Tài liệu kỹ thuật

## Cấu hình cố định (KHÔNG được thay đổi nếu không có confirm)

```javascript
const G_URL     = 'https://galileo-proxy.thaibahoa2308.workers.dev/proxy/';
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
→ `Finding description` → `r.finding_desc`, `Nature of finding` → `r.nature_raw` (dùng cho KPI 2 và cột mô tả ở 2 trang AMO-ECAR/MCAR). Xem [§7 KPI 2](#7-kpi-2--early-detection-ghép-cặp-mcaramo-ecar).

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

### 7. KPI 2 — Early Detection (ghép cặp MCAR↔AMO-ECAR)

**Định nghĩa KPI (con số chính thức ở trang Early Detection — `renderKpi2()`):**
```
KPI 2 = (số finding AMO-ECAR đã được xác nhận ghép cặp với 1 MCAR
         phát hiện SỚM hơn & TRÙNG NỘI DUNG)
        ÷ (tổng số finding AMO-ECAR trong kỳ) × 100%
```
> ⚠️ Tử số KHÔNG phải là tổng MCAR. Chỉ những AMO-ECAR có cặp `status='confirmed'`
> trong bảng `kpi2_match` mới tính vào tử số. (Bản cũ chia `MCAR ÷ AMO-ECAR` cho ra
> tỷ lệ thường >100%, vô nghĩa về nghiệp vụ — đã bỏ.)

**Nguồn dữ liệu:** chỉ `report_title eq 'AMO ECAR'` (mẫu số) và `'MCAR'` (nguồn phát
hiện sớm), cả hai từ `allData` (org `'QA AMO'`). KHÔNG liên quan report `'ECAR'` của TQA.

**Lấy `Nature of finding` (gom nhóm) — bảng KHÁC với loadData:**
```
GET dwanalytics_report_field          ← KHÁC dwanalytics_report_form_section_field
  $select: report_id, field_name, value_text   ← cột value_text (không phải text_value)
  $filter: field_name eq 'Nature of finding'
```
→ Một report có thể có **nhiều** dòng Nature (đa giá trị, xuyên section, gồm cả nhãn
cha lẫn con) → gom vào `Set` mỗi report, KHÔNG chỉ lấy giá trị đầu.

**Chuẩn hóa về nhóm cha** (hằng `NATURE_PARENT` + `natureParent()` / `natureGroups()`):
- `NATURE_PARENT[child] = parent` — cây cha–con lấy từ danh mục gốc Galileo
  `dwreporting_general_lists` (list "Nature of finding").
- Nhãn cấp 1 không có trong map (vd `Not comply with Procedure`, `RII`, `Safety`)
  tự giữ nguyên làm nhóm cha. `Other` và rỗng → loại.
- `loadKpi2()` build `kpi2Rows`: mỗi record có `natureGroups[]` (mảng nhóm cha) +
  `finding_desc` để hiển thị/so khớp.

**Engine ghép cặp bán tự động:**
- `kpi2Candidates()` gợi ý cặp khi: cùng ≥1 nhóm cha Nature **và** `MCAR.raised_date
  < AMO-ECAR.raised_date`. Xếp hạng bằng `descSim()` (overlap từ khóa của
  `Finding description`, 0..1) — chỉ để **gợi ý**, không tự xác nhận.
- `kpi2Confirm(ecarId, mcarId, group)` / `kpi2Reject(...)` → ghi `kpi2_match` (upsert
  theo `onConflict: ecar_report_id,mcar_report_id`). Cặp đã confirmed/rejected bị loại
  khỏi danh sách gợi ý lần sau.
- UI khu "Cặp gợi ý cần xác nhận" chỉ hiện cho `curUser.role === 'admin'` (class
  `admin-only`). Người role `approved` chỉ xem được tỷ lệ.

**Bảng Supabase `public.kpi2_match`:**
```sql
id                 uuid PRIMARY KEY default gen_random_uuid()
ecar_report_id     uuid NOT NULL      -- report_id của AMO-ECAR ("ecar" = AMO-ECAR)
ecar_report_number text
ecar_raised_date   timestamptz
mcar_report_id     uuid NOT NULL
mcar_report_number text
mcar_raised_date   timestamptz
nature_group       text               -- nhóm cha Nature đã khớp
status             text NOT NULL default 'confirmed'   -- confirmed | rejected
matched_by         text               -- curUser.email
matched_at         timestamptz default now()
note               text
UNIQUE (ecar_report_id, mcar_report_id)
```

**RLS policies (`kpi2_match`):**
- `kpi2_match_read` (`for select to authenticated`): cho phép khi
  `exists(users u where u.supabase_id = auth.uid() and u.role in ('admin','approved'))`.
- `kpi2_match_admin_write` (`for all to authenticated`, cả `using` + `with check`):
  chỉ khi `u.role = 'admin'`.
- RLS ghép permissive policy bằng **OR** → admin đọc+ghi, approved chỉ đọc.

**Hai chỉ số khác nhau — đừng nhầm:**
| | `renderKpi2()` (trang Early Detection) | `buildKPI2()` (biểu đồ trang KPI Charts) |
|---|---|---|
| Ý nghĩa | **% phát hiện sớm chính thức** | Khối lượng MCAR vs AMO-ECAR theo Nature |
| Tử số | AMO-ECAR đã ghép `confirmed` | (không có — vẽ số lượng MCAR & AMO-ECAR mỗi nhóm) |
| Trục/nhóm | bảng group theo nhóm cha Nature | cột theo nhóm cha Nature (top 12) + đường Rate% |
| Phụ thuộc | `kpi2_match` | chỉ `kpi2Rows` (Nature), không cần ghép cặp |

---

## Giới hạn OData (KHÔNG được vượt qua)

| Giới hạn | Giá trị | Lý do |
|---|---|---|
| MaxNodeCount | 100 nodes | Mỗi `or` trong `$filter` tốn 2 nodes |
| Cách tính | n terms `or` nhau = `2n-1` nodes | 50 `report_id` = 99 nodes ❌ |
| Pattern an toàn | Chỉ filter `field_name` (≤15 terms = 29 nodes) | Fetch hết rồi post-filter JS |

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

## Cloudflare Worker (galileo-proxy)

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

---

## Quy tắc khi sửa code

1. **Không đổi `org_unit_name` của CMR-CAR và ECAR** — luôn là `'TQA'`, không phải `ORG_UNIT`
2. **Không thêm `report_id` vào `$filter`** của `dwanalytics_report_form_section_field` — sẽ vượt MaxNodeCount 100 nodes
3. **Không đổi `ORG_UNIT`** — ảnh hưởng tất cả pages chính
4. **Không bật `ALLOWED_ORIGINS = '*'`** trong Worker
5. **Không xóa `SECURITY DEFINER`** khỏi `get_my_role()` — sẽ gây infinite recursion RLS
6. **KPI 2 — Nature dùng bảng `dwanalytics_report_field` (cột `value_text`)**, KHÁC
   `dwanalytics_report_form_section_field` (cột `text_value`) của `loadData()`. Đừng gộp nhầm.
7. **KPI 2 — không dùng `localStorage`** cho cặp xác nhận: phải ghi Supabase `kpi2_match`.
   Tử số KPI 2 = AMO-ECAR có cặp `status='confirmed'`, KHÔNG phải tổng MCAR.
