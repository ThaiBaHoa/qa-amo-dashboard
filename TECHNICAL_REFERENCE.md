# QA AMO Dashboard — Tài liệu kỹ thuật

## Cấu hình cố định (KHÔNG được thay đổi nếu không có confirm)

```javascript
const G_URL     = 'https://galileo-proxy.thaibahoa2308.workers.dev/proxy/';
const AI_URL    = 'https://galileo-ai.thaibahoa2308.workers.dev';  // AI Assistant (r112)
const SUPA_URL  = 'https://czftzgdcnpnspbbegwjt.supabase.co';
const ORG_UNIT  = 'QA AMO';   // Dùng cho loadData() chính
```

> ⚠️ **Ngoại lệ nguồn — trang Safety (r119):** KHÔNG dùng `ORG_UNIT='QA AMO'`. OSR/MOSR nằm
> rải nhiều org_unit (Flight Crew Dept…) và chỉ nhận diện qua **owner (nhóm MSAG)**. Luồng riêng:
> `dwanalytics_user_group?$filter=contains(name,'MSAG')` (loại role/archived) → map `group_id`→tên →
> `dwreporting_report_summary?$filter=(owner_id eq …) and valid_to eq null`. **Phân OSR/MOSR theo
> `form_name`** (KHÔNG theo report_number): MOSR = form `MOSR`; OSR = form `1. OSR`/`OSR`; **LOẠI
> form `Confidential OSR`/`4. Confidential OSR`** (Coruson không tính — r120-i1). Đếm theo
> `report_status` (Closed/Open); Total=Closed+Open. Không lọc category.

> 🗺️ **Sơ đồ trực quan luồng dữ liệu** (nguồn → trường → biến → công thức, 6 tầng):
> workspace `build app cho cong ty/MQA dashboard website/SO_DO_CAU_TRUC.html` · artifact `https://claude.ai/code/artifact/2f1b2666-7235-410d-be92-ec5058094ccb` (đồng bộ r119).

---

## 🗺️ Bản đồ truy vết (Traceability) — "sửa chỗ này thì kiểm chỗ nào"

> Mục đích: app là **1 file `index.html` ~9.000 dòng**, một khái niệm dùng ở nhiều nơi.
> Trước khi sửa, tra bảng dưới để biết **đụng cái gì thì ảnh hưởng đâu**. Từ r124 các
> khái niệm dùng chung đã gom vào block **`CFG`** đầu file (grep `// CFG —`).

### A. Nguồn sự thật dùng chung (CFG) — sửa 1 nơi, ăn mọi nơi

| Khái niệm (CFG) | Định nghĩa tại | Dùng ở (gọi lại) | Ghi chú |
|---|---|---|---|
| `AUDIT_STATUS` + `AUDIT_STATUS_ORDER` (màu/nhãn/thứ tự status audit) | block CFG | `renderOverview` (donut By-status **và** ô bar Audit-vs-Inspection) | Đổi màu/nhãn status audit → chỉ sửa CFG |
| `SEM` + `SEM_ORDER` + `semColorMap()` (palette semantic-status màn hình) | block CFG | `ovReportDonut`, `buildChartsFor`, `renderReportCharts` | Đổi màu semantic → sửa CFG; **nhớ 2 biến thể IN** ở mục C |
| `isClosed` / `isActive` / `isCancelled` (record audit `.status`) | block CFG | `renderOverview` (bar), `renderMiniStagePipeline` | Đổi định nghĩa "đóng/mở" audit → sửa predicate, mọi nơi theo |
| `DEADLINE_DAYS` (rfi 14 / target 45 / ext1 30) | block CFG | (đang wire dần) `buildMcarDeadlineChk`, hiển thị RFI/Target | Đổi quy trình ngày → sửa CFG; xem mục C nếu còn +14/+45 viết tay |

### B. Chuỗi phụ thuộc dữ liệu: Coruson/Galileo field → suy ra → hiển thị

| Khái niệm | Field OData nguồn | Suy ra ở hàm | Hiển thị / dùng ở |
|---|---|---|---|
| Trạng thái report | `report_status` + ngày close/target | `semCalc` → `semantic_status` | mọi donut/badge/bảng report |
| Trạng thái audit | `dwreporting_audit_summary.status` | (trực tiếp) + `isClosed/isActive` | Overview, Audit Plan, pipeline |
| Loại audit | `audit_type`, `number` | `deriveWorkflowCategory` → `workflow_category` | Overview bar, Audit Plan |
| Mốc deadline | `raised_date` (+ custom `Target date`) | `deriveStageDates`, `ageCalc`, `DEADLINE_DAYS` | Overdue, EIS/MCAR detail |
| Prefix (MNT/MCAR…) | `number` | `extractAuditPrefix` / `report_number` | lọc theo nhóm form |

→ **Quy tắc:** đổi cách đọc/suy 1 field ở cột "suy ra" thì rà mọi "hiển thị" của cùng dòng.

### C. Ràng buộc KHÔNG tự-dedup được → phải sửa TAY cho khớp (grep `SYNC:`)

| Khi sửa… | Nhớ kiểm/sửa luôn… |
|---|---|
| Màu trong `CFG.SEM` | biến thể **RGB cho PDF** (`buildReportPdf`, grep `SYNC:`) + biến thể **màu sáng in** (`renderReportCharts`, grep `SYNC:`) |
| Công thức deadline (14/45/30) | định nghĩa "đóng trễ/đúng hạn" trong **SOP/ISO** (ngoài code) + `DEADLINE_DAYS` |
| Bump `APP_REV` (r###) | `CLAUDE.md` (Rev current) + `PROJECT_TECH_SPEC.md` (Version + §14) — **hook pre-commit bắt buộc**; rà file này nếu field/luồng đổi |
| Nguồn/field dữ liệu | bảng "Page → Data source" (dưới) + `SO_DO_CAU_TRUC.html` (sơ đồ) |

### D. Công cụ "tìm liên kết" trong 1 file

- **Grep là trình dò phụ thuộc.** Tìm mọi nơi dùng 1 khái niệm: `grep -n "workflow_category" index.html`.
- Đặt tên hằng/hàm **unique** để grep ra sạch (vd `AUDIT_STATUS`, `semColorMap`).
- Chỗ buộc phải trùng thủ công → đánh dấu comment **`// SYNC: …`** để `grep "SYNC:"` liệt kê hết.
- Số liệu lệch giữa các ô → `runSelfChecks()` cảnh báo console (xem bước ③).

---

## Bảng mapping: Page → Data source → Filter

| Page | Function | API Table | org_unit_name | Filter bổ sung |
|---|---|---|---|---|
| Overview, Open Reports, Overdue, KPI Charts, All Forms, PAVOI, Audit Plan | `loadData()` | `dwreporting_report_summary` | `'QA AMO'` (ORG_UNIT) | không |
| CMR-CAR | `loadCmr()` | `dwreporting_report_summary` | **`'TQA'`** | `report_title eq 'CMR CAR'` |
| ECAR | `loadEcar()` | `dwreporting_report_summary` | **`'TQA'`** | `report_title eq 'ECAR'` |
| Documents | `loadDocuments()` | `dwreporting_document_summary` | không filter | filter `Active` client-side |
| Report Status (r131) | `loadRptStatus()` | base từ `allData`; phụ: `dwanalytics_report_form_section_field`, `dwreporting_report_task`, `dwanalytics_report_fact_other_reports`, `dwanalytics_report`, `dwanalytics_attachment` | `'QA AMO'` (qua `allData`) | `report_title in ('MQA Event Report F-088','MQA Event Investigation Summary')` |
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
        or field_name eq 'Issued to (person)'
        or field_name eq 'First extension approved?'
        or field_name eq 'Second extension agreed?'
```
→ 16 field (2 cờ `…approved?`/`…agreed?` thêm r101 cho MCAR deadline check; `Issued to (person)` → `issued_person`).
→ Build `fMap[report_id][field_name] = text_value`. Giữ giá trị đầu tiên (không ghi đè).
→ `Finding description` → `r.finding_desc`, `Nature of finding` → `r.nature_raw` (dùng cho KPI 2 và cột mô tả ở 2 trang AMO-ECAR/MCAR). Xem [§7 KPI 2](#7-kpi-2--early-detection-tự-động).

**Bước 5 — Audit Summary**
```
GET dwreporting_audit_summary
  $select: audit_id, number, title, audit_type, status,
           scheduled_start_date, actual_start_date, closed_date,
           lead_auditor_name, primary_scope_item_name, location_name
  (không filter — lấy hết, dedup theo audit_id)
```
→ Filter client-side (3 nhánh OR): giữ audit khi **(1)** `audit_id` có trong QA AMO reports, **HOẶC (2)** số hiệu có prefix QA AMO (`QA_AMO_PREFIXES`=`MNT`) — bất kể `audit_type`/lead, **HOẶC (3)** là `Internal Audit`/`Inspection` do `QA_AMO_AUDITORS` dẫn. Nhánh (2) thêm ở **r126** để bắt trọn audit **kế hoạch tương lai** (chưa có report) có type khác (`MQA Internal Cross Audit`, `VJC AMO`…) hoặc lead còn `"Assign Lead Auditor"` — trước đó bị whitelist type + danh sách lead làm rớt (vd Q4/2026 mất MNT-1045..1048).

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

### 8. `loadRptStatus()` — Report Status on Coruson (EIS & F-088, r131)

Thay bảng Excel "Thống kê tình trạng report EIS & F-088 trên Coruson" trước đây làm tay hàng tháng.
Luật chấm lấy từ `F088 GUIDEDANCE.docx` (Eric, 18/08/2026), đã đối chiếu **từng ô** với bản Excel JUL-2026.

| Cột (theo Excel gốc) | Nguồn Galileo | Luật | Khớp Excel |
|---|---|---|---|
| D · Tình trạng hoàn thiện | suy ra từ E + F + H | `Completed` chỉ khi **cả E, F, H đều đạt** (G không tính). Thiếu → liệt kê chi tiết từng chỗ trong ô. | cố ý KHÔNG khớp — xem bẫy 8 |
| E · Report Section / Fill Information | `dwanalytics_report_form_section_field` | mọi field có giá trị; report `Open` miễn trừ `Verification of implementation (VOI)` | 13/68 |
| F · Workflow / Add task | `dwreporting_report_task` | stage quản lý có RFI/Task **HOẶC** `stage_status='Completed'` | **68/68** |
| G · Evaluation / Link initial Report | `dwanalytics_report_fact_other_reports` → `dwanalytics_report` | mã report được link (bản `valid_to eq null`) | đúng mã ở mọi dòng Excel có ghi mã |
| H · Attachment / Final report | `dwanalytics_attachment` | `context_type eq 'Report'` và có ≥1 file | 66/68 |
| I · Status on Coruson | `report_status` | nguyên trạng | 68/68 |
| J · PAVOI (chỉ tab EIS) | lọc cột G theo tiền tố `PAVOI` | — | 3/3 dòng Excel có ghi |

**Bẫy đã xác minh — đọc trước khi sửa:**

1. **Cột D không phải `report_status`** (từ r131-i1) — xem bẫy 8 bên dưới trước khi động vào.

2. **Row EAV VẪN tồn tại khi field bỏ trống** (`text_value` rỗng, `field_type` null). Nhờ đó đếm được field *thiếu*, không chỉ field đã điền. Nhưng phải loại 4 row **không bao giờ điền được** (0% fill trên toàn bộ dataset — chúng là cấu trúc, không phải ô nhập): `VietJet_Air_logo.svg`, `Add number of involved persons`, `Team`, `Add info of person performing read&sign/error briefing (as many as required)`; cộng mọi row có `repeater_section_name` khác null (header repeater, vd `CORRECTIVE ACTIONS`). Quên loại → mọi report đều Unsatis.
3. **Luật cột F chữ nghĩa là chưa đủ.** "Có RFI hoặc Task = Satis" chỉ khớp 53/68. MQA-RP-055-2025 và MQA-RP-069-2026 không có RFI/Task nào nhưng stage đã `Completed` (bản Excel chấm Satis); MQA-RP-072-2026 cũng không có nhưng stage còn `PendingSignOff` (chấm "Chưa có thông tin"). Thêm vế `stage_status='Completed'` → khớp 68/68.
4. **Cột G KHÔNG lấy từ field gõ tay** (`Detail of Initial Source` / `Reference of Related Event`). Lấy quan hệ thật rồi resolve `report_key` → `number`, chỉ giữ bản hiện hành `valid_to eq null` — 1 report được link có nhiều version key (vd MQA-RP-065-2026 có 7 key, tất cả đều là `VJC-ECAR-830`).
5. **Không tách được "evidence đính ở Add task" khỏi "final report đính ở tab Report".** `dwanalytics_attachment.context_type` chỉ có 5 giá trị (Report / Audit / AuditChecklistItem / Document / Change Request) — không có 'Task' — và `task_instance_id` rỗng trên toàn bộ dataset QA AMO. Đừng hứa tách 2 loại này.
6. **Tiêu đề report nằm ở field khác nhau tuỳ revision** — rank: `SUBJECT` (F-088) → `Investigation` (EIS 015 trở đi) → `BRIEF DETAILS` (EIS cũ). Lấy sai thì cột Report Title rỗng ở đúng các report mới nhất. **KHÔNG thêm `Detailed Description` làm fallback:** form EIS có ĐÚNG HAI row mang tên đó (một ở section DESCRIPTION OF THE EVENT, một ở ANALYSIS) và không có gì phân biệt nổi — `field_id` khác nhau theo từng report (không dùng chung), `repeater_section_name` đều null, thứ tự row không ổn định (EIS-2025/014 row đầu là mô tả sự kiện, EIS-2025/012 row đầu lại là phần phân tích). Lấy bừa = in nhầm đoạn MEDA lên bảng trình chiếu. `dwanalytics_report.summary` cũng không cứu được (rỗng ở 73/84 report). Hệ quả chấp nhận: EIS 012/013/014/015/018 để trống Report Title. Muốn lấp thì phải join `dwanalytics_report_section_field` qua `report_field_key` để đọc `section_template_id` — chưa làm vì chỉ được thêm 2 dòng.
7. **Số liệu cột E khắt khe hơn bản làm tay rất nhiều** (12/68 đạt, so với 67/68 trong Excel). Đây là lựa chọn có chủ ý của Eric (18/08/2026), KHÔNG phải bug. Field bị bỏ trống nhiều nhất: `Contributing Factors Checklist MEDA` 32/68 (chỉ điền khi MEDA = Yes), `AIRCRAFT TYPE & SERIES` 23/68 (nhiều F-088 không gắn tàu bay), `Other (explain here)` 14/68, `Consequence` 13/68. Nếu sau này muốn nới, loại nhóm điều kiện + nhóm gắn tàu bay khỏi mẫu số → 54/68 đạt.
8. **Cột D cố ý lệch bản Excel (r131-i1).** Trong file Excel gốc, cột D và cột I trùng khít nhau (đều là `Closed`/`Open`) nên cột D vô nghĩa. Từ r131-i1, D = kết luận hoàn thiện hồ sơ (E ∧ F ∧ H), I vẫn là `report_status` → **hai cột giờ lệch nhau là đúng thiết kế**, không phải bug: report đã Closed trên Coruson nhưng thiếu field/attachment vẫn hiện `Not Completed`. Đúng nghĩa tiêu đề gốc "Tình trạng hoàn thiện report trên Coruson / Cần bổ sung, đánh giá lại". Con số: F-088 **11/68** Completed (theo `report_status` là 65/68), EIS **6/16**; 54/68 report tụt hạng chỉ vì cột E. Nếu ai đó thấy "sai" vì lệch Excel, đọc lại mục này trước khi sửa.
9. **Galileo là nguồn đủ hơn Excel.** Excel JUL-2026 thiếu MQA-EIS-013/015/018; ngược lại Galileo không có MQA-EIS-001/002 (số cũ, trước khi lên Coruson). MQA-EIS-015 rỗng hoàn toàn, stage `Withdrawn`.

---

## Giới hạn OData (KHÔNG được vượt qua)

| Giới hạn | Giá trị | Lý do |
|---|---|---|
| MaxNodeCount | 100 nodes | Mỗi `or` trong `$filter` tốn 2 nodes |
| Cách tính | n terms `or` nhau = `2n-1` nodes | 50 `report_id` = 99 nodes ❌ |
| Pattern an toàn | Chỉ filter `field_name` (≤15 terms = 29 nodes) | Fetch hết rồi post-filter JS |
| ⚠ Timeout (r107) | `field_name`-only mà tên field generic (vd `'Finding description'` ~14k row) | Quá 30s → rỗng âm thầm. Thêm `report_raised_date ge <ISO>` để thu hẹp + chunk ~8 field/query. |
| ⚠ `report_id` 400 | `report_id eq '<uuid>'` trên `report_field`/`report_form_section_field` | Trả **HTTP 400** (cột không filter được) — bắt buộc post-filter JS. |
| ✅ **Lối thoát: `in (…)`** (r131) | `report_key in (k1,…,k448)` · `context_id in (uuid1,…,uuid84)` | **KHÔNG bị tính như chuỗi `or`.** Đã đo trên chính proxy này: `or` hỏng ở 25 giá trị (đúng lỗi "node count limit of '100'"), còn `in()` nuốt gọn **448 số** và **84 UUID** trong 1 request. UUID trong `in()` viết trần, KHÔNG bọc nháy; chuỗi thì vẫn phải có nháy đơn. Nhờ đó `loadRptStatus()` chỉ tốn ~8 request thay vì ~40. **Lưu ý:** `in()` KHÔNG cứu được giới hạn `report_id` ở dòng trên — đó là hạn chế của view EAV, không phải node count. |

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
