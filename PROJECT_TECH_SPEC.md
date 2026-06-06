# QA AMO Dashboard — Tech Spec toàn dự án

**File:** `index.html` (single-file SPA, không build step)
**Repo:** `ThaiBaHoa/qa-amo-dashboard` · **Domain:** `vjc-qa-amo.com` (GitHub Pages)
**Version hiện tại:** `2026.06.05-r94`
**Cập nhật spec:** 2026-06-05 — phản ánh code thực tế (gồm r81–r94, SPI, KPI2, PAVOI RFI)

> Tài liệu này mô tả TOÀN BỘ kiến trúc, dữ liệu, logic và quy ước của dashboard. Dùng làm nguồn tham chiếu chuẩn khi sửa code. Số dòng (Lxxxx) là tương đối, dùng để định vị nhanh.

---

## 1. Tổng quan

Dashboard nội bộ cho **QA AMO** (Quality Assurance — Approved Maintenance Organization) của VietJet, theo dõi:
- **Findings / CAR reports** (Open / Overdue / Closed) theo nhiều loại form (MCAR, AMO-ECAR, SR, AISC, PAVOI…).
- **Audit Plan** (lịch audit, tiến độ stage, bottleneck).
- **Documents** (thư viện tài liệu + copyholder + workflow).
- **KPI / KPI2 (Early Detection) / SPI (Safety Performance Indicators)**.
- **PAVOI RFI** (Request For Information monitor).
- Công cụ admin: Export (PDF/Excel), Query Builder, My Dashboard, User Management.

**Đặc điểm kiến trúc:** 1 file `index.html` (~8400 dòng) chứa toàn bộ HTML + CSS + JS. Không framework, không bundler. Dữ liệu lấy runtime từ **Galileo OData API** (qua Cloudflare Worker proxy) + **Supabase** (auth & user roles).

---

## 2. Tech stack & dependencies

### 2.1 CDN libraries (`<head>`, L7–16)
| Library | Version | Dùng cho |
|---|---|---|
| Chart.js | 4.4.1 | doughnut / bar / line / pie |
| @supabase/supabase-js | @2 | auth + bảng `users` (roles) |
| DOMPurify | 3.1.6 | sanitize HTML (`safeHTML`) |
| jsPDF | 2.5.1 | export PDF |
| jsPDF-AutoTable | 3.8.2 | bảng trong PDF |
| html2canvas | 1.4.1 | chụp chart vào PDF |
| XLSX (SheetJS) | 0.18.5 | export Excel |
| Google Fonts | — | Manrope (body), IBM Plex Mono (số/badge) |

### 2.2 Backend
- **Galileo OData** `vietjet.ideagendata.com/odata` — KHÔNG gọi trực tiếp.
- **Cloudflare Worker proxy** `G_URL = 'https://galileo-proxy.thaibahoa2308.workers.dev/proxy/'` — giấu API key, kiểm tra `Origin` (chỉ `vjc-qa-amo.com` / `127.0.0.1:5500` / `localhost:5500`).
- **Supabase** `SUPA_URL = 'https://czftzgdcnpnspbbegwjt.supabase.co'`, `SUPA_KEY = 'sb_publishable_eGdEXBCSD_19tu4sOV8NWQ_8mZmUqqq'` (publishable/anon).

### 2.3 Deployment
- Push `main` → GitHub Pages tự deploy (no build). `CNAME` = `vjc-qa-amo.com`.
- `_headers` (Cloudflare/Netlify format): `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, `Permissions-Policy: geolocation=(), camera=(), microphone=(), payment=()`, `X-XSS-Protection: 1; mode=block`.
- **Repo files:** `index.html`, `CNAME`, `_headers`, `CLAUDE.md`, `TECHNICAL_REFERENCE.md`, `KPI2_DECISION_POINTS.md`, `.gitignore`. (Không có package.json/node_modules.)

---

## 3. Config & constants (L2147–2212, 2375, 2623–2624)

| Constant | Giá trị | Ý nghĩa |
|---|---|---|
| `SUPA_URL` | `https://czftzgdcnpnspbbegwjt.supabase.co` | Supabase project |
| `SUPA_KEY` | `sb_publishable_…` | anon key |
| `G_URL` | `https://galileo-proxy.thaibahoa2308.workers.dev/proxy/` | Galileo proxy |
| `ORG_UNIT` | `'QA AMO'` | filter chính cho mọi query report |
| `APP_REV` | `'2026.06.05-r94'` | version (hiển thị footer + PDF) |
| `PS` | `25` | page size pagination |
| `CACHE_KEY` | `'qaAmoV5'` | localStorage cache key |
| `CACHE_TTL` | `4*60*60*1000` (4 giờ) | TTL cache |
| `QA_AMO_AUDITORS` | `Set([~20 tên])` | lọc audit theo lead auditor (Thai Ba Hoa, Le Hong Chuong, Dao Trieu Phu…) |

---

## 4. Auth & phân quyền (Supabase)

### 4.1 Client init (L2356–2363)
```js
sb = createClient(SUPA_URL, SUPA_KEY, {
  auth: { storage: sessionStorage, persistSession: true, autoRefreshToken: true },
  realtime: { params: { eventsPerSecond: 0 } }, global: { headers: {} }
});
```
- Dùng **sessionStorage** (đóng tab → mất phiên). Realtime tắt.

### 4.2 Bảng Supabase `users`
| Cột | Ghi chú |
|---|---|
| `supabase_id` | UUID = `auth.users.id` |
| `email`, `full_name` | |
| `role` | `pending` / `approved` / `admin` / `rejected` |
| `created_at` | |

### 4.3 Luồng
- **doLogin()** (L2403): rate-limit 5 lần sai → khóa 60s; `signInWithPassword`; fetch profile; `pending` → màn chờ duyệt, `rejected` → signOut, còn lại → vào app.
- **doRegister()** (L2433): insert `users{role:'pending'}` + `signUp`, rồi signOut ngay (chờ admin duyệt).
- **Session restore** (L2552 DOMContentLoaded): xử lý recovery hash; `getSession()` timeout cứng 8s; có session → `initApp()`, không → màn login.
- **initApp()** (L2533): hiện app, sidebar (avatar/tên/role), footer APP_REV, hiện admin nav nếu `role==='admin'`; `if(!cacheLoad()) loadData()`.
- **doLogout()** (L2521): `signOut` + clear sessionStorage + clear cache + reset state.
- **Phân quyền:** các trang `reports / admin / querybuilder / mydashboard` chỉ admin. Non-admin = viewer (không export).

---

## 5. Tầng dữ liệu

### 5.1 `fetchAll(url, skipOv)` (L2951–2982)
- Phân trang OData qua `@odata.nextLink`: tách tên bảng + query, **route lại qua `G_URL`** (không gọi thẳng backend).
- Timeout **30s/trang** (AbortController). Safety cap **200 trang**.
- `skipOv=true` → không chiếm overlay chính.

### 5.2 `loadData(forceRefresh)` (L2673–2949) — pipeline 6 bước
Reset đầu hàm (sau `isLoading=true`): `pavoiRfiLoaded=false; pavoiRfiMap={}; pavoiRfiDone=new Set();`

| Bước | Bảng | `$filter` | `$select` (rút gọn) | Dedup |
|---|---|---|---|---|
| [1-2/6] | `dwreporting_report_summary` | `org_unit_name eq 'QA AMO'` | report_id, report_title, report_number, report_status, org_unit_name, raised_date, audit_title, audit_id, modified_date, valid_from, valid_to, owner_id | theo `report_id` giữ `modified_date` mới nhất; bỏ report_number rỗng |
| [3/6] | `dwreporting_users` | (none) | user_id, full_name | `userMap[user_id]=full_name` |
| [4/6] | `dwreporting_report_workflow` | (none) | report_id, stage_type, stage_status, stage_completed_date, stage_target_date | `wfAllMap[report_id]`=tất cả stage; `wfMap`=stage `ReportAcceptReject` tốt nhất (Completed > InProgress, mới nhất) |
| [5/6] | `dwanalytics_report_form_section_field` | 13 field_name (xem dưới) | report_id, field_name, text_value | `fMap[report_id][field_name]`=text_value (first wins) |
| [6/6] | `dwreporting_audit_summary` + (đk) `dwreporting_audit_workflow` | (none) | audit_id, number, title, audit_type, status, scheduled/actual/closed dates, lead_auditor_name, scope, location | theo `audit_id` |

**13 custom field_name (bước 5):** `Target date`, `Issue Date`, `Finding level`, `Repetitive`, `First extension agreed date`, `Second extension agreed date`, `Audit Ref. No`, `Request For Verification`, `Report Reference`, `Verification Result`, `Department`, `Finding description`, `Nature of finding`.

**Audit (bước 6):** giữ audit nếu `audit_id` thuộc report QA AMO HOẶC (`audit_type` ∈ {Internal Audit, Inspection} VÀ `lead_auditor_name` ∈ `QA_AMO_AUDITORS`). Audit workflow chỉ fetch khi `allAudits.length <= 50` (bảng 100K+ rows). Sau đó merge `audit_number` vào `allData`.

### 5.3 `deriveStageDates(stages)` (L3040–3052)
Suy 3 mốc theo `stage_type` (lấy giá trị muộn nhất):
- **Target** = `stage_target_date` của stage `Task`.
- **Completed** = `stage_completed_date` của stage `Task`.
- **Close** = `stage_completed_date` của stage `ReportAcceptReject`.

### 5.4 Schema 1 dòng `allData` (L2767–2810)
Spread `...summary` + các field suy:
`Target_date` (custom `Target date` → stage Task target → wfMap target), `close_date` (stage ReportAcceptReject completed → wfMap), `completed_date` (stage Task completed), `issue_date`, `finding_level`, `repetitive`, `ext1_date`, `ext2_date`, `audit_ref`, **PAVOI:** `rfv`, `report_ref`, `verif_result`, `dept`, `finding_desc`, `nature_raw`; `owner_name` (userMap), `semantic_status` (semCalc), `report_ageing` (ageCalc), `overdue_cat` (catCalc), `raised_ym`, `raised_year`, `is_rep` (`Repetitive`=='yes'), `audit_number`, `wf_stages` (=wfAllMap).

### 5.5 Loaders phụ (lazy, org_unit khác)
- **loadCmr()** (L~4170): `org_unit_name eq 'TQA' and report_title eq 'CMR CAR'` → `cmrData` (aircraft_reg, findingRows, ata_chapter, nc_type, defect_class, cap, final_action, issued_to, verified_by, rca…). Dùng thêm `dwanalytics_report_field` (ghép finding theo section_id).
- **loadEcar()** (L~4528): `org_unit_name eq 'TQA' and report_title eq 'ECAR'` → `ecarData` (aircraft_reg, findings, ata_chapter, issued_by…).
- **loadPavoiRfi()** (xem §8.1), **loadKpi2()**, SPI loader (xem §7).

### 5.6 Caching (L2623–2670)
- **cacheLoad()**: đọc `localStorage[CACHE_KEY]`; hợp lệ khi có `ts` + `a` (allData) + tuổi < 4h → restore `allData/auditData/stageAggregate/docTypeFlat` + `renderAll()` → return true.
- **cacheSave()**: lưu `{ts, a:allData, b:auditData, dtf:docTypeFlat, sa:stageAggregate}`; quota lỗi → lưu bản slim (bỏ `wf_stages`).
- **↻ Refresh** (`btnRefresh` → `loadData(true)`): bỏ cache, fetch lại; reset cả RFI state.
- Cache RFI/CMR/ECAR/KPI2 KHÔNG vào localStorage — chỉ in-memory + flag `*Loaded`.

---

## 6. Logic tính toán & KPI

### 6.1 `dDay(s)` (L2988) + `ageCalc(t)` (L2997)
- `dDay`: parse `YYYY-MM-DD` → **local midnight** (tránh lệch UTC+7). ISO datetime → lấy UTC date.
- `ageCalc`: `round((dDay(t) - today)/86400000)` → số ngày tới target; **âm = quá hạn**; `null` nếu không có target.

### 6.2 `semCalc(status, closeDate, targetDate)` (L3004)
```
status==='Closed':  !t→'Closed'; !c→'Closed'; c<=t?'On-time Closed':'Lately Closed'
chưa Closed, !c:    !t→'Open'; now<=t?'Open':'Overdue'
chưa Closed, có c:  !t→'Closed'; c<=t?'On-time Closed':'Lately Closed'
```
→ 5 giá trị: `Open / Overdue / On-time Closed / Lately Closed / Closed`. Report không có target & chưa close = `Open`; không có target mà đã close = `Closed` (không chấm on-time).

### 6.3 `catCalc(ag, sm)` (L3027)
Chỉ khi `sm==='Overdue'`: `ag>=-30`→CAT I; `ag>=-60`→CAT II; còn lại→CAT III.

### 6.4 Overview (chart-based, r89) — `renderOverview(d)`
Trang Overview là **biểu đồ** (Chart.js), không KPI tile/bảng. Lọc qua `#ovYearFilter` → `filterOverviewYear()` truyền `d` (allData lọc năm) vào `renderOverview(d)`. Helper chung: `ovDonut(id,labels,data,colors)`, `ovStackBar(id,labels,datasets)`, `ovReportDonut(title,d,canvasId,cntId)`; đều `dc(id)` destroy trước khi tạo lại (đăng ký trong `charts{}` → `showPage('overview')` resize).
- **Audit & Inspection Progress · MNT** (nguồn `auditData.filter(a=>a.prefix==='MNT')` — **gồm CẢ audit + inspection** vì MNT prefix chứa cả hai, MPS đã loại; lọc `sched_year`):
  - Donut `ovAuditStatus`: theo `status` (Scheduled/In Progress/Performed/Closed/Cancelled).
  - Stacked bar `ovAuditType`: trục X = Audit / Inspection (`workflow_category`), stack Closed (green) vs In progress (`status` ∉ {Closed,Cancelled}, amber).
- **Report Progress** — 2 donut `ovReportDonut` cho `'MCAR'` & `'AMO ECAR'` (lọc `report_title`): chia theo `semantic_status` (Open/Overdue/On-time/Lately/Closed) + dòng `{total} · {on-time%}`.
- Donut rỗng → 1 lát xám "No data". **Datalabels (r90):** plugin inline `ovArcPct` vẽ **% trên từng lát** (bỏ <6%), `ovDonutCenter` vẽ tổng ở tâm, `ovBarVal` vẽ value trên đoạn bar; legend kèm `count (pct%)`. Màu chữ canvas theme-aware qua `ovInk()`. Layout: `#page-overview .chart-card{min-width:0}` chống tràn grid khi zoom (Chart.js responsive co giãn).
- Dead-code giữ lại (không còn caller): `buildChartsFor`, `renderStatTblsFor`, `buildMonthChart`, `buildFormChart`, `renderOvTypeBlock` (gỡ ở r89).

### 6.4b KPI Charts (trang riêng `page-kpi`) — `buildKPICharts()` (L3281)
- Cards: Total / Open / Overdue / **On-time Rate** `onTime/(onTime+lately)` / CAT III / Audits (distinct `audit_id`). **Repetitive Rate** = `count(is_rep)/total`. **CAT I/II/III** count theo `overdue_cat` (tập Overdue). Year filter (mặc định năm hiện tại).

### 6.5 KPI2 — Early Detection (L3733–3887)
Đo tỉ lệ AMO-ECAR (authority) đã được **MCAR (nội bộ) phát hiện sớm hơn**.
- `isEarlyDetected(ecar, mcarPool)` (L3810): tồn tại MCAR có `raised_date < ecar.raised_date` VÀ (cùng Nature group **HOẶC** `tokenSim(desc) >= K2_SIM_THRESHOLD=0.5`).
- Hiển thị tỉ lệ `MCAR ÷ AMO-ECAR`; nhóm theo Nature / Quarter / Year / Scope. Nguồn: `allData` + field Nature (Galileo), KHÔNG dùng Supabase. (Bản đối sánh kpi2_match Supabase = Phase 2, chưa làm.)

### 6.6 SPI — Safety Performance Indicators (rework r87)
- `SPI_CONFIG = { reportTitle:'AMO - SPI', orgUnit:'QA AMO', direction:{1:'lower',2:'lower',3:'lower',4:'higher',5:'lower'}, defaultDirection:'lower' }`.
- Mỗi SPI: `seq` (1–5), `sptApproved` (ngưỡng CAAV/ALOS), `prevYear`, `yearAchievement`, `raised`/`raised_year` (= `getFullYear(raised_date)`), `months[12]={rate,count,trigger}`.
- `FIELD_MATCHERS`: `monthTrigger: /SPI\s*Trigger\??/i` bắt cả `'Jun - SPI Trigger?'` lẫn `'Mar SPI Trigger?'`; `rate: /^\s*Rate\s*SPI\b/i` (vd `Rate SPI - May`). Tháng suy từ TÊN field qua `spiMonthIndex` (`repeater_section_name` null).
- **`spiEvaluate(spi)`**: mỗi tháng `breach` = ưu tiên cờ `<Month> SPI Trigger?` (Yes→breach, No→ok), fallback so `rate` vs `SPT` theo `direction`. Tháng **chưa có rate = chưa tới kỳ** → KHÔNG tính trigger, KHÔNG đứt chuỗi. Trả `{currentLevel, hist:{l1,l2,l3}, status, ...}`.
  - **`currentLevel`** (r91) = chuỗi breach **liên tiếp tính NGƯỢC từ tháng có data MỚI NHẤT** (cap 3) → phản ánh **hiện trạng tháng current**. Vd SPI-03 breach tháng 3 nhưng tháng 5 (mới nhất) đạt → currentLevel 0 = On target. Đang trong chuỗi breach ở cuối → L1/L2/L3. Dùng cho **badge card** + ô **Current Trigger**. Status: `good` (yearAchievement true | currentLevel 0) / `trigger` / `na`.
  - **`hist`** = số **đợt (episode) breach liền kề** trong năm theo độ dài đỉnh: run 1→l1, =2→l2, ≥3→l3. Dùng cho ô **History**.
- **Render** `renderSPIPage(list)`: KPI row = Total SPIs / Tracking / **Current Trigger** (đếm SPI theo hiện trạng: On target / L1 / L2 / L3) / **History** (tổng đợt L1/L2/L3 cả năm). Badge mỗi card theo `currentLevel`: `On target` / `Trigger Level 1/2/3`. Year filter `#spiYearFilter` (`raised_year`) → `populateSpiYear()`+`renderSPIYear()`. Target line: *"Vietjet AMO's SPI must meet or better than the SPT (ALOS) approved by CAAV"*.
- **Theme (r91):** `Chart.defaults.color='#8B949E'` + `borderColor='rgba(140,148,163,.18)'` (đọc được cả dark/light); `drawSPIChart` grid `rgba(140,148,163,.15)`. Trước đó chart dùng màu mặc định `#666` quá tối trên dark.

---

## 7. Trang & điều hướng

### 7.1 `showPage(name, btn)` (L6405) + `PT` map (L6404)
20 trang. Trang admin-only: `reports, admin, querybuilder, mydashboard` (+ kpi2 thực tế admin). Trigger load:
`overview`→resize charts · `openrfi`→renderOpen · `overdue`→renderOv · `kpi`→filterKpiYear · `kpi2`→loadKpi2/renderKpi2 · `allforms`→renderAF · `pavoi`→`loadPavoiRfi()` nếu chưa, else renderPavoi · `cmrcar`→loadCmr/renderCmr · `ecar`→loadEcar/renderEcar · `amoecar`→renderAmoEcar · `mcar`→renderMcar · `auditplan`→renderAudit · `docs`→tree+renderDocPage · `reports`→generateReport · `admin`→loadUsers · `querybuilder`→qbInit · `mydashboard`→dbInit.

### 7.2 Bảng dữ liệu (cột chính)
- **Open Reports** `renderOpen` (chỉ Open+Overdue): No, Form, Status, Owner, Raised, Target, Days, CAT, Finding Level, **Repetitive**, Audit Title.
- **Overdue** `renderOv`: No, Form, Raised, Target, Days, CAT, Finding Level, Audit Title (+ KPI CAT I/II/III + doughnut).
- **All Forms** `renderAF` (mọi status): No, Form, Status, Owner, Raised, Target, Days, CAT, Finding Level, **Completed, Close Date**, Audit Ref, Audit No, Audit Title. (Repetitive đã thay bằng Completed+Close ở r81.)
- **PAVOI** `renderPavoi`: No, Status, Raised, Target, Days, Report Ref, RFV, Verification Result, Department, **RFI**, Audit No, Audit Title. Row click → modal.
- **CMR-CAR** `renderCmr`: No, Aircraft, Status, Finding Count, Dept, Raised, Target, Days (+ filter aircraft/quarter/ATA).
- **ECAR** `renderEcar`: No, Aircraft, Status, Finding Desc, Raised, Target, Days, Detail (+ quarter multi-select, issued-by).
- **AMO-ECAR / MCAR** `renderAmoEcar/renderMcar` (dùng `renderFormView`): No, Status, Raised, Target, Days, CAT, Finding Level, Audit Title.
- **Audit Plan** `renderAudit`: No, Title, Type, Status, Scheduled, Lead Auditor, Location, Findings, Open, Overdue, Pipeline, Workflow (+ bottleneck panel).
- **Documents** `renderDocPage`: cây doc_type (15 root) + bảng Doc No, Title, Type, Rev, Status, Owner, Review date, Distributed, Actions.

### 7.3 Filtering & sort
- Pills status (`TS[page].sf`), form select (`ff`), year (`yr`), search (debounce 300ms). Mỗi trang có search fields riêng.
- Sort: click header → `xxxSort(col)` toggle `asc`, reset page; `sortD()` null-safe.
- `populateFilters()` (L3069): điền form/year unique.
- Pagination chung: `renderPaged(bodyId, infoId, pgId, cntId, data, ts, rowFn)` (L3926), 25 dòng/trang, `goPg()`.

### 7.4 Modals
- `#pavoiModal` (L2134): RFI Monitor — 4 KPI (Total/Open/Overdue/Completed) + bảng RFI (Owner/Status/Target/Completed/Days). Trigger `showPavoiDetail` (async, fetch tươi).
- `#ecarModal` (L2117): chi tiết finding ECAR.
- `#docModal` (L2014): tab Copyholders + Workflow stages.
- CMR detail: `showCmrDetail`.

---

## 8. Phân hệ đặc thù

### 8.1 PAVOI RFI Monitor (chi tiết: `PAVOI_RFI_Spec.md`)
- Nguồn: `dwreporting_report_task`, lọc `task_title='Request For Information'`, bỏ `Deleted`.
- RFI open = `task_status!=='Completed' && !task_completed_date`; overdue = open & (`ageCalc<0` || `task_delivery_status==='overdue'`).
- **r86:** page chỉ fetch RFI cho **PAVOI `report_status='Open'`** (~65/217, batch 15 GUID/request do **OData giới hạn 100 node/filter**); report đã đóng đánh dấu done-rỗng. Mở modal → `fetchPavoiRfiOne` fetch tươi 1 report (chống stale do replica lag) + `renderPavoi()`. Retry 3× backoff, per-report `pavoiRfiDone`.
- Hàm: `loadPavoiRfi`, `fetchPavoiRfiOne`, `pavoiRfiSummary`, `pavoiRfiCell`, `showPavoiDetail`, `renderPavoiModal`, `closePavoiModal`.

### 8.2 Export Reports (admin)
- **exportPDF()** (L6103): jsPDF + AutoTable; 3 phần (KPI Summary, Form Summary, Detail) + ảnh chart (`chartImg` qua html2canvas).
- **exportExcel()** (L6332): XLSX 3 sheet (KPI Summary, Form Summary, Detail Data 11 cột). File `QA_AMO_{title}_{YYYY-MM-DD}.xlsx`.
- `initReportFilters()` / `generateReport()`: lọc theo month/quarter/form.

### 8.3 Query Builder (admin, L7118–7700)
- `QB_TABLES`: 7 bảng (report_summary, report_workflow, users, form_section_field, audit_summary, audit_workflow, document_summary) + field list.
- `qbRun()` (L7478): build `$select`/`$filter` (op: eq/ne/lt/le/gt/ge/contains/year), join client-side qua `QB_JOINS`, limit 500. Viz table/bar/pie (`qbRenderChart`). Export Excel `qbExportExcel`.

### 8.4 My Dashboard (admin, L7787–7961)
- Widget tùy biến (KPI/Table/Bar/Pie), lưu `localStorage['db_widgets_{email}']`. `dbFetchWidget` query OData; `dbPinWidget`/`dbRefreshAll`/`dbDeleteWidget`.

### 8.5 User Management (admin, L6364)
- `loadUsers()` từ Supabase `users` (id, email, full_name, role, created_at). Actions: `approveUser`→approved, `rejectUser`→rejected, `makeAdmin`→admin. Filter `userFilter`.

### 8.6 Documents (L6788+)
- `showDocDetail(revId,…)`: tab Copyholders (`dwreporting_document_task`: task_owner, target/completed, delivery_status → ontime/late/overdue/inprogress) + Workflow (`dwreporting_document_workflow` group theo stage_id). Cache `docTaskCache`/`docWorkflowCache`.
- Cây doc_type: `buildDocTypeTree`/`countDocsPerType`/`renderDocTree`, 15 root (ROOT_ORDER).

---

## 9. Design system (CSS)

### 9.1 Tokens (`:root` + theme)
- Spacing: `--gap:14px --pad:18px --r:14px --sb-w:248px`. Accent: `--accent:#e8453c` (VietJet red).
- **Dark** (`html[data-theme="dark"]`): `--bg:#0d1014 --surface:#15191f --surface-2:#1b2027 --border:#252b34 --text:#e9edf3 --text-2:#a4afbd`.
- **Light** (`html[data-theme="light"]`): `--bg:#eef1f5 --surface:#fff --border:#e3e8ef --text:#1a2230`.
- Màu: `--c-blue --c-green --c-amber --c-orange --c-red --c-gray` (đổi theo theme).
- **Alias cũ:** `--card=surface, --muted=text-2, --blue=c-blue, --green=c-green, --yellow=c-amber, --orange=c-orange, --red=accent`.
- Fonts: Manrope (body), IBM Plex Mono (số/badge/table).

### 9.2 Badge & ageing classes
- Status: `.b-open`(blue) `.b-over`(red) `.b-on`(green) `.b-late`(amber) `.b-with`(gray). CAT: `.b-c1`(amber) `.b-c2`(orange) `.b-c3`(red). Role: `.b-pend .b-appr .b-reje .b-admin`.
- Ageing: `.a-ok`(green) `.a-warn`(orange) `.a-bad`(#ff6b6b) `.a-crit`(#ff3333, 700).
- KPI tone: `.kpi-tone-{green,blue,orange,yellow,purple,red,muted}`.

### 9.3 Layout & responsive
- Shell: `.layout`(flex) → `.sidebar`(248px fixed) + `.main`(margin-left 248px) → `.topbar`(60px sticky, blur) + `.content`. `.page{display:none}` / `.page.active{display:flex}`.
- Topbar: title, live-badge (cache age + report count + pulse dot), icon-btn (refresh/theme/notif), hamburger mobile.
- Breakpoints: ≥1800px & ≥2400px scale up; 768–1180px tablet (sidebar 190px); ≤767px mobile (sidebar trượt ẩn, hamburger); ≤480px nén thêm.

### 9.4 Theme toggle
- `toggleTheme()`: lật `data-theme` dark↔light, lưu `localStorage['qa_theme']`. `restoreTheme()` đọc lại / theo `prefers-color-scheme`. Nút `#btnTheme`.

---

## 10. State toàn cục (L2369–2401, 2378–2389)

- **Data:** `curUser, allData[], auditData[], docData[], cmrData[], ecarData[], stageAggregate`.
- **Cache/flags:** `cmrLoaded, ecarLoaded, pavoiRfiLoaded, pavoiRfiMap{}, pavoiRfiDone(Set), docTaskCache{}, docWorkflowCache{}, isLoading`.
- **Doc tree:** `docTypeTree/Flat/Index/ByTitle, selectedTypeId, expandedTreeNodes(Set), currentDocRevId`.
- **TS (sort/filter từng bảng):** `TS.open/ov/af/pavoi/audit/docs/cmr/ecar/amoecar/mcar`, mỗi cái `{page, sort, asc, sf, ff, yr, srch, …}` (thêm `cat/ac/qr/qrs[]/issuedBy/typeF/wfCatF/prefixF` tùy bảng).
- **Charts:** `charts{}, rptCharts{}, qbChart, dbCharts{}`.
- **QB/Dashboard:** `qbState, qbInited, qbOrgUnit, qbChart`.
- **Login:** `_loginFails, _loginLockUntil`.

---

## 11. Helpers (L6438–6502)

| Hàm | Mô tả |
|---|---|
| `fd(d)` | format date → `DD/MM/YYYY` (UTC-safe, tránh lệch UTC+7); rỗng→`—` |
| `esc(v)` | escape HTML (XSS) |
| `g(id)` / `s(id,v)` | getElementById / set textContent |
| `toast(msg,type)` | thông báo nổi (info/ok/err), auto ẩn 4.5s |
| `setOv(show,txt,detail,pct)` | overlay loading + progress bar |
| `debounce(fn,ms)` | debounce (search) |
| `sortD(data,col,asc)` | sort null-safe string/number |
| `renderPaged(...)` | pagination chung |
| `sBadge/cBadge/ageDis` | badge status / CAT / hiển thị ageing màu |
| `pct(v)` | `0.x`→`x%` |
| `safeHTML(el,html)` | DOMPurify innerHTML |

---

## 12. Galileo quirks & invariants (BẮT BUỘC tuân thủ khi sửa)

| # | Quy tắc |
|---|---|
| I1 | KHÔNG đổi `ORG_UNIT` / filter `org_unit_name` cho report QA AMO. CMR/ECAR dùng `'TQA'`. |
| I2 | **GUID trong `$filter` KHÔNG bọc nháy:** `report_id eq f937…` |
| I3 | KHÔNG nhồi `report_id` vào `$filter` của bảng EAV `dwanalytics_report_form_section_field` (post-filter client). |
| I4 | **OData giới hạn 100 node/filter** → chuỗi `or` tối đa ~16 `report_id eq`; batch ≤15. |
| I5 | Mọi date hiển thị qua `fd()`; tính ngày qua `ageCalc/dDay` (KHÔNG `toLocaleDateString` trực tiếp). |
| I6 | Proxy yêu cầu `Origin` hợp lệ (chỉ chạy từ domain deploy / localhost). |
| I7 | Bảng lớn (`report_task` ~24k, `audit_workflow` 100k+): KHÔNG fetch global; fetch theo report_id/điều kiện, lazy + cache phiên. |
| I8 | Galileo có **replica lag** (read trả bản cũ vài phút) → số liệu RFI/finding có thể stale; fetch tươi on-demand cho chi tiết. |
| I9 | `dwreporting_report_task.id` KHÔNG unique — dedup bằng `task_id` nếu cần. |
| I10 | Stage `Task` thường trùng lặp trong workflow → lấy giá trị muộn nhất (deriveStageDates). |

---

## 13. Quy ước phát triển

- **Edit surgical:** chỉ chạm điểm cần sửa, không refactor lan man.
- **Versioning:** bump `APP_REV` mỗi thay đổi (`YYYY.MM.DD-rNN`). Hiện r94. (Luôn nối tiếp số thực tế trong file, KHÔNG lùi — vd spec ghi r85 nhưng file đã r86 → bump r87.)
- **Deploy:** sửa `index.html` (bản OneDrive) → copy vào clone repo → `git diff` review → commit + push `main` (commit message dùng `git commit -F` để tránh lỗi shell với ký tự `/`). GitHub Pages tự build ~1–2 phút.
- **Tận dụng helper có sẵn** (fetchAll, g, s, esc, fd, toast, setOv, renderPaged, sortD, ageCalc) — không viết trùng.
- **Tài liệu liên quan:** `PAVOI_RFI_Spec.md` (RFI chi tiết), `CAR report types & KPI2` (MCAR/AMO-ECAR vs CMR-CAR/ECAR; KPI2 Phase-1), `GALILEO_QUIRKS.md`, `GALILEO_DATA_QUALITY.md`.

---

## 14. Lịch sử version gần đây

| Rev | Nội dung |
|---|---|
| r81 | All Forms: thêm cột Completed/Close Date; fix Target date cho SR/AISC qua workflow stage; helper `deriveStageDates`. |
| r82 | PAVOI: cột RFI + Detail modal (khởi tạo RFI monitor). |
| r83 | RFI: ưu tiên hiển thị RFI overdue dài nhất (thay vì badge "N open"). |
| r84 | RFI: fetch theo report_id (batch 15) thay vì kéo 24k record toàn hệ thống. |
| r85 | RFI: retry per-chunk + `pavoiRfiDone` per-report (hết "lúc được lúc không"). |
| r86 | RFI: page chỉ fetch PAVOI Open (~65, nhanh ~3×); modal fetch tươi 1 report (hết stale). |
| r87 | Overview rebuild (MNT + MCAR + AMO ECAR, bỏ donut/month/top-forms); SPI rework (Current Trigger L1/L2/L3 theo chuỗi tháng breach liền kề, year filter theo raised_year, badge Trigger Level). |
| r88 | SPI fix: Trigger Level = chuỗi breach liền kề DÀI NHẤT trong năm (không phải tính ngược từ tháng cuối) → breach lẻ đã phục hồi (vd SPI-03 Mar) vẫn hiện L1. |
| r89 | Overview chuyển sang chart-based: donut status + stacked bar Audit vs Inspection (MNT gồm cả audit+inspection) + 2 donut MCAR/AMO ECAR theo status; bỏ KPI tiles + bảng "MNT đang mở". |
| r90 | Overview charts: hiện % trên từng lát donut + tổng ở tâm + value trên bar (plugin inline); legend kèm count(%); fix `min-width:0` chống tràn/co giãn khi zoom. |
| r91 | Theme fix: `Chart.defaults.color` đọc được trên dark. SPI: badge theo tháng current (`currentLevel` tính ngược từ tháng mới nhất); ô "On target"→"Current Trigger" (On target/L1/L2/L3 hiện trạng); ô "Current Trigger"→"History" (số đợt L1/L2/L3 cả năm). |
| r92 | Theme fix: legend/tick chart Overview dùng `#8B949E` cố định thay vì `ovInk()` bake. |
| r93 | Theme fix màu chữ chart: `ovInk()` = trắng (dark) / đen (light) đọc tại lúc vẽ; áp cho legend (+ `fontColor` từng item donut), tick (Overview + SPI), số tổng tâm. `toggleTheme` re-render cả SPI để cập nhật màu. |
| r94 | Legend chart Overview chuyển sang **HTML** (`.ov-lg`, helper `ovLegend`, Chart.js legend `display:false`) — màu chữ `var(--text)` đổi tức thì theo theme qua CSS, không phụ thuộc re-render. Dứt điểm lỗi legend đen-trên-đen. Canvas text (% lát/value bar trắng, tick/số tổng `ovInk()`) re-render theo toggle. |
