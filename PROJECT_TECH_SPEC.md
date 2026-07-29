# QA AMO Dashboard — Tech Spec toàn dự án

**File:** `index.html` (single-file SPA, không build step)
**Repo:** `ThaiBaHoa/qa-amo-dashboard` · **Domain:** `vjc-qa-amo.com` (GitHub Pages)
**Version hiện tại:** `2026.07.29-r120`
**Cập nhật spec:** 2026-07-22 — phản ánh code thực tế (gồm r81–r118-i3; **r113–r118 = phân hệ Export/Login, KHÔNG đổi luồng dữ liệu chính** — xem §14; **delta luồng duy nhất từ r112: bước [5/6] `loadData` thêm field `Issued to (person)` → `issued_person`, tổng 16 field**), **r110: cập nhật roster `QA_AMO_AUDITORS`; r111: nút Feedback / Bug Report (Google Form) ở sidebar; r112: AI Assistant chat — hỏi-đáp dữ liệu qua Worker `galileo-ai` (tool-use client-side) — xem §8.9; r112-i1: AI Assistant fuzzy form matching + alias (SR/EIS/QC)**; r104: User delete qua Edge Function + EIS form-specific schema/roll-up ở All Forms; r105: fix EIS per-CA load — revert về field_name + post-filter Set (I3); r106: EIS đóng/mở theo cấp report (không suy từ CA Date completed); r107: QC Spot Check Report detail ở All Forms (+ hotfix TDZ thứ tự khai báo & timeout report_field — xem §8.8, I11); r108: KPI ATA = (CMR-CAR + QC Spot Check)÷ECAR lệch tháng N−1/N (§6.4c); r109: tử số CMR-CAR chỉ tính report gán cờ "QC MQA Physical Finding" (category_id), MCAR cột Raised by, Target_date lấy từ Report, MCAR deadline check, copyholder on-time so theo ngày, lọc Cancelled/Deleted, auto-refresh kiosk, multi-year filter, admin export, SPI, KPI2, PAVOI RFI)

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

**Đặc điểm kiến trúc:** 1 file `index.html` (~9560 dòng) chứa toàn bộ HTML + CSS + JS. Không framework, không bundler. Dữ liệu lấy runtime từ **Galileo OData API** (qua Cloudflare Worker proxy) + **Supabase** (auth & user roles). AI Assistant (r112) gọi thêm Worker `galileo-ai` (Anthropic API proxy).

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
- **Cloudflare Worker `galileo-ai`** `AI_URL = 'https://galileo-ai.thaibahoa2308.workers.dev'` (r112) — proxy Anthropic API cho AI Assistant, giữ `ANTHROPIC_API_KEY` secret server-side. Nhận `{system, tools, messages}` (POST), trả nguyên response Messages API. Xem §8.9.

### 2.3 Deployment
- Push `main` → GitHub Pages tự deploy (no build). `CNAME` = `vjc-qa-amo.com`.
- `_headers` (Cloudflare/Netlify format): `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, `Permissions-Policy: geolocation=(), camera=(), microphone=(), payment=()`, `X-XSS-Protection: 1; mode=block`.
- **Repo files:** `index.html`, `CNAME`, `_headers`, `CLAUDE.md`, `PROJECT_TECH_SPEC.md`, `TECHNICAL_REFERENCE.md`, `KPI2_DECISION_POINTS.md`, `PAVOI_RFI_Spec.md`, `.gitignore`, `scripts/gen-changelog.sh`, `.claude/skills/` (skill `quy-trinh-chuan`, `cap-nhat-revision`, `probe-spec`). (Không có package.json/node_modules.)

---

## 3. Config & constants (L2147–2212, 2375, 2623–2624)

| Constant | Giá trị | Ý nghĩa |
|---|---|---|
| `SUPA_URL` | `https://czftzgdcnpnspbbegwjt.supabase.co` | Supabase project |
| `SUPA_KEY` | `sb_publishable_…` | anon key |
| `G_URL` | `https://galileo-proxy.thaibahoa2308.workers.dev/proxy/` | Galileo proxy |
| `ORG_UNIT` | `'QA AMO'` | filter chính cho mọi query report |
| `APP_REV` | `'2026.06.10-r106'` | version (hiển thị footer sidebar + User Guide + PDF; nhãn User Guide nạp động từ `APP_REV` qua `#guideVer`/`#guideFooter`) |
| `AUTO_REFRESH_MS` | `12*60*60*1000` (12h) | chu kỳ auto-refresh kiosk (xem §5.6) |
| `AUTO_REFRESH_CHECK_MS` | `5*60*1000` (5 phút) | nhịp heartbeat kiểm tra tới hạn |
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
| [5/6] | `dwanalytics_report_form_section_field` | 16 field_name (xem dưới) | report_id, field_name, text_value | `fMap[report_id][field_name]`=text_value (first wins) |
| [6/6] | `dwreporting_audit_summary` + (đk) `dwreporting_audit_workflow` | (none) | audit_id, number, title, audit_type, status, scheduled/actual/closed dates, lead_auditor_name, scope, location | theo `audit_id` |

**16 custom field_name (bước 5):** `Target date`, `Issue Date`, `Finding level`, `Repetitive`, `First extension agreed date`, `Second extension agreed date`, `Audit Ref. No`, `Request For Verification`, `Report Reference`, `Verification Result`, `Department`, `Finding description`, `Nature of finding`, `Issued to (person)` (→ `issued_person`), `First extension approved?`, `Second extension agreed?` (2 cờ cuối r101 cho MCAR deadline check — 16 term ≈ 31 node, dưới MaxNodeCount 100).

**Audit (bước 6):** giữ audit nếu `audit_id` thuộc report QA AMO HOẶC (`audit_type` ∈ {Internal Audit, Inspection} VÀ `lead_auditor_name` ∈ `QA_AMO_AUDITORS`). Audit workflow chỉ fetch khi `allAudits.length <= 50` (bảng 100K+ rows). Sau đó merge `audit_number` vào `allData`.

### 5.3 `deriveStageDates(stages)` (L3040–3052)
Suy 3 mốc theo `stage_type` (lấy giá trị muộn nhất):
- **Target** = `stage_target_date` của stage `Task`.
- **Completed** = `stage_completed_date` của stage `Task`.
- **Close** = `stage_completed_date` của stage `ReportAcceptReject`.

### 5.4 Schema 1 dòng `allData` (L2767–2810)
Spread `...summary` + các field suy:
`Target_date` (**r102:** custom `Target date` (Report — mốc chính thức theo QA) `f['Target date']` → stage Task target `sd.td` fallback → wfMap target. *Lịch sử: r100 từng đảo sang stage-Task-first vì vài form RP/AMO-ECAR custom bị cũ; r102 revert vì MCAR cho thấy Report mới đúng — vd MCAR-0363 Report 18/06 vs stage 22/06.*), `close_date` (stage ReportAcceptReject completed → wfMap), `completed_date` (stage Task completed), `issue_date`, `finding_level`, `repetitive`, `ext1_date`, `ext2_date`, `audit_ref`, **PAVOI:** `rfv`, `report_ref`, `verif_result`, `dept`, `issued_person`, `finding_desc`, `nature_raw`; `owner_name` (userMap), `semantic_status` (semCalc), `report_ageing` (ageCalc), `overdue_cat` (catCalc), `raised_ym`, `raised_year`, `is_rep` (`Repetitive`=='yes'), `audit_number`, `wf_stages` (=wfAllMap).

### 5.5 Loaders phụ (lazy, org_unit khác)
- **loadCmr()** (L~4170): `org_unit_name eq 'TQA' and report_title eq 'CMR CAR'` → `cmrData` (aircraft_reg, findingRows, ata_chapter, nc_type, defect_class, cap, final_action, issued_to, verified_by, rca…). Dùng thêm `dwanalytics_report_field` (ghép finding theo section_id).
- **loadEcar()** (L~4528): `org_unit_name eq 'TQA' and report_title eq 'ECAR'` → `ecarData` (aircraft_reg, findings, ata_chapter, issued_by…).
- **loadEisDetail()** (r104, fix r105, xem §8.7): lazy-load per-CA cho form *MQA Event Investigation Summary* (chỉ khi mở All Forms với form EIS). 2 nguồn: desc (`dwanalytics_report_form_section_field.text_value`) + Corrective Actions repeater (`dwanalytics_report_field.value_text` + `section_id`). **Fetch theo `field_name`, POST-FILTER bằng `Set` report_id (Invariant I3)** — đúng pattern `loadCmr`/`loadEcar` (`CMR_RF` + `applySecIdOverlay`). Mọi `fetchAll` truyền **`skipOv=true`** (không chiếm overlay toàn cục — vết r41). Ghép CA **theo `section_id`** (KHÔNG theo created_date). Kết quả vào `eisCAMap`/`eisDescMap`, flag `eisLoaded`. KHÔNG mutate `allData`. *(r105: revert cách scope-theo-report_id của patch r104 — 2 view analytics EAV KHÔNG hỗ trợ filter report_id → trả RỖNG, xem §8.7.)*
- **loadPavoiRfi()** (xem §8.1), **loadKpi2()**, SPI loader (xem §7).

### 5.6 Caching (L2623–2670)
- **cacheLoad()**: đọc `localStorage[CACHE_KEY]`; hợp lệ khi có `ts` + `a` (allData) + tuổi < 4h → restore `allData/auditData/stageAggregate/docTypeFlat` + `renderAll()` → return true.
- **cacheSave()**: lưu `{ts, a:allData, b:auditData, dtf:docTypeFlat, sa:stageAggregate}`; quota lỗi → lưu bản slim (bỏ `wf_stages`).
- **↻ Refresh** (`btnRefresh` → `loadData(true)`): bỏ cache, fetch lại; reset cả RFI state.
- **Auto-refresh (r97, màn hình LED/kiosk):** `startAutoRefresh()` gọi ở cuối `initApp()` → heartbeat `setInterval` mỗi **5 phút** theo **wall-clock** (`Date.now()`, chịu được sleep/wake + browser throttle); khi đủ **12h** → `loadData(true)` **TẠI CHỖ** (KHÔNG `location.reload()` → không chạm phiên sessionStorage, không nháy màn). Guard `if(!curUser) return` (logout → tự no-op) + `if(isLoading) return`. Hằng `AUTO_REFRESH_MS`/`AUTO_REFRESH_CHECK_MS`; biến `autoRefreshTimer`/`nextAutoRefresh`. Không xung đột nút ↻ Refresh (cùng `loadData(true)` + guard `isLoading`).
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

### 6.4c KPI QC-Internal-vs-Authority theo ATA, lệch tháng (r108 → r109) — `renderATACompare()` (chart `cATACompare`)
Đo nội bộ (chỉ phần **QC**) phát hiện sớm authority: **`Ratio[ATA] = (CMR-CAR gán cờ QC + QC Spot Check finding tháng N−1) ÷ (ECAR finding tháng N)`**, hiển thị **số thập phân** (`(num/den).toFixed(2)`, KHÔNG phải %). (Thay ratio cũ "ECAR/CMR under-detection".)
- **Cờ QC (r109):** tử số CMR-CAR **chỉ tính report gán Category "QC MQA Physical Finding"** (UUID `QC_CAT_UUID = 7e5ccacc-…-905870d68aca`, **cấp report**). Mô hình: Category cấp report → report gán cờ thì TẤT CẢ finding của report đó là QC (Galileo không có cờ Category cấp finding). `loadCmr` thêm `category_id` vào `$select` (mang qua `cmrData` bằng `...r`); vòng đếm CMR lọc `r.category_id===QC_CAT_UUID`. QC Spot Check = toàn bộ finding (form vốn là QC). ECAR mẫu số KHÔNG lọc.
- **Filter:** `#ataYear` + `#ataMonth` (single-select, default tháng hiện tại — thay year-multi `ataCompareYear` cũ đã bỏ). N = tháng chọn = **mẫu (ECAR)**; N−1 = **tử (QC-CMR + QCS)**. Tháng 1 → tử rollover về tháng 12 năm trước.
- **Đếm finding con per-ATA** (`normalizeATA(ata, level)`, level 2/4/6): CMR/ECAR qua `findingRows[].ata` (fallback `r.ata_chapter`); QCS qua `qcsMap[rid].findings[].ata` + tháng suy từ `allData.raised_date` (helper `qcsFindingList()`). Lazy-load cả 3 (`loadCmr`/`loadEcar`/`loadQcsDetail`) 1 lần rồi tự re-render.
- **Edge cờ QC:** `report_summary` append-only (I6) dedupe theo `report_id` giữ `modified_date` mới nhất — giả định `category_id` ổn định giữa các version của 1 report (cờ cấp report không đổi khi sửa). Nếu sau cần lọc tới TỪNG finding (vd `Defect Classification`) → probe field trên CMR `findingRows` rồi thêm điều kiện ở vòng `findingRows.forEach`.
- **Lazy depend r107:** cần `qcsMap`/`qcsLoaded`/`loadQcsDetail`. **Phụ thuộc QCS detail timeout-fix (I11)** — QCS findings chỉ có khi `loadQcsDetail` chạy xong.
- **Chart:** grouped bar ngang, 2 dataset QC (CMR gán cờ + QCS, xanh) vs ECAR (đỏ), top 15 ATA theo tổng. **Bảng:** dòng **TOTAL** (r108-i1: **chỉ cộng phần CÓ ATA** = `allATAFull.reduce`, khớp đúng tổng các dòng per-ATA — KHÔNG gồm No-ATA để tránh "Internal=70 nhưng rows cộng ~41") → per-ATA → dòng **No-ATA** (finding thiếu ATA, gom `Other`, để riêng, không tính ratio — KHÔNG giấu mẫu số). Ô count rỗng hiển thị `0` (không phải `—`).
- **Guard chia (BẮT BUỘC):** chỉ chia khi `den>0` (tránh `Infinity`/`NaN` vỡ Chart.js). Edge badge: `num≥den`→✅ Effective · `0<num<den`→⚠ Under · `num=0,den>0`→❌ Missed · `den=0,num>0`→∞ Over-detect.
- **Lưu ý data:** ECAR chỉ có ATA thật từ ~2026-04 → KPI chỉ ý nghĩa từ tháng đó (trước đó mẫu per-ATA gần rỗng → nhiều ∞/Over-detect, đúng bản chất data). `exportATAComparePDF` đọc badge từ DOM qua class `.b-on`/`.b-over`.

### 6.5 KPI2 — Early Detection (L3733–3887)
Đo tỉ lệ AMO-ECAR (authority) đã được **MCAR (nội bộ) phát hiện sớm hơn**.
- `isEarlyDetected(ecar, mcarPool)` (L3810): tồn tại MCAR có `raised_date < ecar.raised_date` VÀ (cùng Nature group **HOẶC** `tokenSim(desc) >= K2_SIM_THRESHOLD=0.5`).
- Hiển thị tỉ lệ `MCAR ÷ AMO-ECAR`; nhóm theo Nature / Quarter / Year / Scope. Nguồn: `allData` + field Nature (Galileo), KHÔNG dùng Supabase. (Bản đối sánh kpi2_match Supabase = Phase 2, chưa làm.)

### 6.5b MCAR Deadline Check — Extension Rule (r101)
Chỉ áp cho MCAR. Tính hạn kỳ vọng theo quy trình rồi cảnh báo khi `Target_date` đang lưu lệch (case điển hình: đã duyệt extension nhưng quên sửa Target date).
- `buildMcarDeadlineChk(raisedStr, f, curTarget)` (gắn vào `allData.mcar_chk` trong `loadData`, chỉ khi `report_title==='MCAR'`):
  - **Responded due** = `raised + 14d`; **Target due** = `raised + 45d + 30d × n`.
  - `n` ∈ {0,1,2} = số extension **đã duyệt**, đếm theo cờ duyệt (KHÔNG theo cờ request): ext1 = `First extension approved? === 'Yes'`, ext2 = `Second extension agreed? === 'Yes'` (tên bất đối xứng: lần 1 `approved?`, lần 2 `agreed?`).
  - `target_warn` = `dDay(curTarget) !== expTarget` (so theo NGÀY; không có Target → warn). Kết quả lưu dạng string `YYYY-MM-DD` + boolean ⇒ **cache-safe** (JSON, không giữ Date).
  - Verify với agreed date thực (khớp 100%): MCAR-0234 raised 08/04/2025 +45+30 = 22/06/2025; CAR-0597 raised 30/05/2022 → 13/08 rồi 12/09/2022. **KHÔNG** dùng field `First/Second extension target date` (lệch +1 ngày so với agreed).
- Hiển thị: `mcarWarnCell(r)` render cột ⚠ Deadline (badge `⚠ Target → <date>` khi lệch / `✓ OK` khi khớp, kèm Responded due + số ext, tooltip chi tiết). Cột + filter chỉ render khi `renderFormView` được truyền `ids.warn`/`ids.warnFilter` (chỉ `renderMcar`).
- *Mở rộng (chưa làm):* cảnh báo riêng cho Responded cần field "ngày respond thực" — chạy probe field `contains(field_name,'espond'/'eply'/'nswer'/'eceived')` để xác minh trước.

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
- **All Forms** `renderAF` (mọi status) — **r104: schema-driven** qua registry `AF_SCHEMAS{report_title → {cols[], rowClick?}}`, `_default` fallback = 14 cột cũ; `renderAF` sinh **cả thead (`#afHead`) lẫn body** từ schema. Form chưa khai báo → `_default`, hành vi cũ không đổi.
  - **`_default`** (14 cột): No, Form, Status, Owner, Raised, Target, Days, CAT, Finding Level, **Completed, Close Date**, Audit Ref, Audit No, Audit Title. (Repetitive đã thay bằng Completed+Close ở r81.)
  - **EIS** (`MQA Event Investigation Summary`, xem §8.7): cột riêng No, Status, Owner, **Primary Source**, Raised, **Target (latest)**, Days, **CAs** (badge "n overdue"), **Departments**, **Progress** (done/total). Row click → `showEisDetail`. Dữ liệu = `allData.filter(EIS).map(enrichEis)` (clone roll-up, KHÔNG mutate `allData`); lazy-load per-CA 1 lần (hiện "Loading…" rồi tự re-render).
  - **QCS** (`QC Spot Check Report`, r107, xem §8.8): cột riêng No, **Aircraft**, **A/C Type**, **Spot Check Type**, Status, **Findings** (đếm finding/report), Raised, Target, Days, **Audit Ref**. Row click → `showQcsDetail` (`#qcsModal`). Dữ liệu = `allData.filter(QCS).map(enrichQcs)` (clone, chỉ THÊM field hiển thị — KHÔNG recompute `Target_date`/`semantic_status`, đã đúng trong `allData`); lazy-load finding per-section 1 lần.
- **PAVOI** `renderPavoi`: No, Status, Raised, Target, Days, Report Ref, RFV, Verification Result, Department, **RFI**, Audit No, Audit Title. Row click → modal.
- **CMR-CAR** `renderCmr`: No, Aircraft, Status, Finding Count, Dept, Raised, Target, Days (+ filter aircraft/quarter/ATA).
- **ECAR** `renderEcar`: No, Aircraft, Status, Finding Desc, Raised, Target, Days, Detail (+ quarter multi-select, issued-by).
- **AMO-ECAR / MCAR** `renderAmoEcar/renderMcar` (dùng `renderFormView`): No, Status, Raised, Target, Days, CAT, Finding Level, Audit Title. **MCAR riêng:** (r101) cột **⚠ Deadline** + dropdown lọc `mcarWarnF` (All/Mismatch/OK), gate `ids.warn`/`ids.warnFilter`, tính hạn kỳ vọng theo rule (xem §6.5b) cảnh báo khi `Target_date` lệch; (r103) thêm cột **Raised by** (`owner_name`, gate `ids.raisedBy`) + **bỏ Finding Description** (gate `ids.hideFindingDesc`). MCAR = 9 cột, AMO-ECAR giữ 8 cột.
- **Audit Plan** `renderAudit`: No, Title, Type, Status, Scheduled, Lead Auditor, Location, Findings, Open, Overdue, Pipeline, Workflow (+ bottleneck panel).
- **Documents** `renderDocPage`: cây doc_type (15 root) + bảng Doc No, Title, Type, Rev, Status, Owner, Review date, Distributed, Actions.

### 7.3 Filtering & sort
- Pills status (`TS[page].sf`), form select (`ff`), **year (multi-year widget — xem §7.5)**, search (debounce 300ms). Mỗi trang có search fields riêng.
- Sort: click header → `xxxSort(col)` toggle `asc`, reset page; `sortD()` null-safe.
- `populateFilters()` (L3069): điền form unique + khởi tạo các year-multi (Overview/KPI mặc định năm hiện tại).

### 7.5 Year filter đa năm (r96) — component dùng chung
Thay toàn bộ `<select>` year (17 chỗ) bằng **dropdown checkbox** cho phép chọn 1 năm / 2 năm / tất cả năm. State per element id: `_YM[id] = {years[], sel:Set (rỗng = tất cả), cb, defaulted}`.
- **Khởi tạo:** `initYearMulti(id, years, {onChange, default})` — mount `<div class="ymulti" id=...>`; `default:'current'` chọn sẵn năm hiện tại (chỉ lần đầu). Idempotent: gọi lại với cùng danh sách năm KHÔNG rebuild DOM (giữ popover mở khi tick nhiều năm); danh sách năm đổi (data mới) thì rebuild + giữ selection còn hợp lệ.
- **Đọc trong render/export:** `ymHas(id, value)` → true nếu value qua được filter (true khi "tất cả"); `ymVal(id)` → mảng năm đã chọn (`[]` = tất cả); `ymText(id)` → nhãn (`All` / `2025` / `2025, 2024`); `ymReset(id)` → về "tất cả".
- **QUAN TRỌNG:** các id year giờ là `<div>`, KHÔNG đọc `g(id).value`. Pattern lọc: `data.filter(r => ymHas(id, r.raised_year))`.
- ECAR: quarter-pills bật khi `ymVal('ecarYearF').length>0`; chart tháng dùng `_ecarMonthData(base, sel.length===1 ? sel[0] : '')` (1 năm → đủ 12 tháng; nhiều năm → gộp tháng có data).
- **Dead state:** `TS.*.yr` không còn được đọc (selection nằm ở `_YM`), giữ lại như stub vô hại.
- Pagination chung: `renderPaged(bodyId, infoId, pgId, cntId, data, ts, rowFn)` (L3926), 25 dòng/trang, `goPg()`.

### 7.4 Modals
- `#pavoiModal` (L2134): RFI Monitor — 4 KPI (Total/Open/Overdue/Completed) + bảng RFI (Owner/Status/Target/Completed/Days). Trigger `showPavoiDetail` (async, fetch tươi).
- `#ecarModal` (L2117): chi tiết finding ECAR.
- `#docModal` (L2014): tab Copyholders + Workflow stages.
- `#eisModal` (r104): chi tiết EIS — desc blocks **(rút gọn sau patch: Primary Source · Investigation · Impact and losses · Immediate action(s))** + chip MEDA + card từng Corrective Action (badge status per-CA, Target/Completed/VOI). *(Patch bỏ Main Cause/Error/Violation/Detailed Description khỏi cả fetch lẫn popup.)* Trigger `showEisDetail` / `closeEisModal`. Xem §8.7.
- `#qcsModal` (r107): chi tiết QC Spot Check — header 2 cột (Aircraft/A-C Type/Spot Check Type/Area/Dept/Flight + Raised/Issue/Target/Completed/Verified/Audit Ref), block Issued To / Verified By / Foreman, **card từng Finding** (desc + badge ATA · Defect · POS · AOG), 3 block dài Immediate action(s) / VOI / Reference details. Trigger `showQcsDetail` / `closeQcsModal`. Xem §8.8.
- CMR detail: `showCmrDetail`.

---

## 8. Phân hệ đặc thù

### 8.1 PAVOI RFI Monitor (chi tiết: `PAVOI_RFI_Spec.md`)
- Nguồn: `dwreporting_report_task`, lọc `task_title='Request For Information'`, bỏ `Deleted`.
- RFI open = `task_status!=='Completed' && !task_completed_date`; overdue = open & (`ageCalc<0` || `task_delivery_status==='overdue'`).
- **r86:** page chỉ fetch RFI cho **PAVOI `report_status='Open'`** (~65/217, batch 15 GUID/request do **OData giới hạn 100 node/filter**); report đã đóng đánh dấu done-rỗng. Mở modal → `fetchPavoiRfiOne` fetch tươi 1 report (chống stale do replica lag) + `renderPavoi()`. Retry 3× backoff, per-report `pavoiRfiDone`.
- Hàm: `loadPavoiRfi`, `fetchPavoiRfiOne`, `pavoiRfiSummary`, `pavoiRfiCell`, `showPavoiDetail`, `renderPavoiModal`, `closePavoiModal`.

### 8.2 Export Reports (admin) — gom + siết chặt (r96)
- Nav **Export Reports** nằm trong khối `#adminNav` (cùng nhóm Admin). **Mọi** nút export (Export Reports PDF/Excel, CMR-CAR, ECAR, AMO-ECAR, Audit Plan, ATA-compare, Query Builder) đều có class `.admin-only` (ẩn với viewer) **VÀ** handler tự kiểm `curUser.role==='admin'`. `showPage` cũng chặn điều hướng trực tiếp.
- **Fix r96:** nút Audit Plan ⬇ Excel (`exportAuditExcel`) trước đây thiếu cả `.admin-only` lẫn guard → đã vá cả hai.
- **exportPDF()**: jsPDF + AutoTable; 3 phần (KPI Summary, Form Summary, Detail) + ảnh chart (`chartImg` qua html2canvas).
- **exportExcel()**: XLSX 3 sheet (KPI Summary, Form Summary, Detail Data 11 cột). File `QA_AMO_{title}_{YYYY-MM-DD}.xlsx`.
- `initReportFilters()` / `generateReport()`: lọc theo year (multi-year `rptYear`) + month/quarter/form.

### 8.3 Query Builder (admin, L7118–7700)
- `QB_TABLES`: 7 bảng (report_summary, report_workflow, users, form_section_field, audit_summary, audit_workflow, document_summary) + field list.
- `qbRun()` (L7478): build `$select`/`$filter` (op: eq/ne/lt/le/gt/ge/contains/year), join client-side qua `QB_JOINS`, limit 500. Viz table/bar/pie (`qbRenderChart`). Export Excel `qbExportExcel`.

### 8.4 My Dashboard (admin, L7787–7961)
- Widget tùy biến (KPI/Table/Bar/Pie), lưu `localStorage['db_widgets_{email}']`. `dbFetchWidget` query OData; `dbPinWidget`/`dbRefreshAll`/`dbDeleteWidget`.

### 8.5 User Management (admin, L6364)
- `loadUsers()` từ Supabase `users` (id, email, full_name, role, created_at). Actions: `approveUser`→approved, `rejectUser`→rejected, `makeAdmin`→admin. Filter `userFilter`.
- **r104 — Xóa user hoàn toàn:** nút 🗑 Delete (class `.btn-reject`, ẩn với chính tài khoản đang đăng nhập) → `deleteUser(id,email,role)` gọi **Supabase Edge Function** `delete-user` qua `sb.functions.invoke` (xóa cả `auth.users` lẫn `public.users`). **service_role KHÔNG ở client** — Edge Function tự verify caller là admin bằng JWT, chặn tự xóa mình + xóa admin cuối; CORS whitelist origin. Client cũng chặn tự xóa (double-guard) + confirm. FK `users_supabase_id_fkey ON DELETE CASCADE` dọn profile mồ côi → email xóa xong đăng ký lại được. *(Edge Function `supabase/functions/delete-user/` + FK do Eric deploy phía Supabase, không nằm trong `index.html`. Spec: `USER_DELETE_SPEC.md`.)*

### 8.6 Documents (L6788+)
- `showDocDetail(revId,…)`: tab Copyholders (`dwreporting_document_task` — **`$select` gọn + retry 3× backoff** chống timeout proxy; GUID không nháy) → `_docTasks` list, status ontime/late/overdue/inprogress, KPI Total/OnTime/Late/Overdue. **r98:** `_docTasks` lọc bỏ `task_status ∈ {Cancelled, Deleted}` **trước** `.map` (copyholder đã gỡ khỏi distribution — Galileo ẩn ở tab Copyholders nhưng vẫn giữ dòng task, `delivery_status='overdue'` gây đếm sai). Lọc trước map nên `dtk-total` + mọi KPI tự đúng. ⚠️ Nếu sau này có chỗ khác đếm `dwreporting_document_task` cấp dòng → áp cùng bộ lọc. **Cột sort được** (`docTaskSort`/`renderDocTaskTable`): mặc định Status xếp overdue→in-progress→late→on-time để gom người **chưa acknowledge** lên đầu. + Workflow (`dwreporting_document_workflow` group theo stage_id). Cache `docTaskCache`/`docWorkflowCache`; lỗi → link "Thử lại" (xóa cache + refetch).
- Cây doc_type: `buildDocTypeTree`/`countDocsPerType`/`renderDocTree`, 15 root (ROOT_ORDER).

### 8.7 MQA Event Investigation Summary — form-specific (r104, spec `FORM_EIS_DESIGN.md`)
EIS không khớp khung 14 cột chung (thiếu CAT/Finding Level/Audit Ref/MNT No) và **due tính sai**: 1 report EIS có **nhiều Corrective Action**, mỗi CA có **Target date riêng**. Đúng nghiệp vụ: **due của report = Target date lớn nhất (latest) trong chuỗi CA**.
- **2 nhóm field (2 view khác nhau):**
  - *Mô tả sự kiện — single-instance:* `dwanalytics_report_form_section_field`, cột giá trị **`text_value`** (Primary Source, Investigation, Main Cause, Error/Violation, `Impact and losses: [...]` (field_name dài, match chính xác), Immediate action(s), Detailed Description (lặp → giữ non-empty đầu), `Contributing Factors Checklist MEDA` (multi → mảng)).
  - *Corrective Actions — repeater:* `dwanalytics_report_field`, cột giá trị **`value_text`** + `section_id` (Corrective Action(s), Classification, Department, Target date, Date completed, VOI).
- **KHÓA GHÉP = `section_id`** (KHÔNG dùng created_date — Galileo ghi field xen kẽ giữa các CA, ghép theo thời gian cho sai dept). Cùng pattern `applySecIdOverlay` của CMR/ECAR.
- **Quirks:** loại field rác `VietJet_Air_logo.svg` / `CORRECTIVE ACTIONS` (header rỗng); 2 field `Date` (event vs report, `section_name` null không phân biệt được) → **tạm bỏ**; `text_value` vs `value_text` KHÔNG hoán đổi.
- **Fetch scope (r105 — fix lỗi r104 patch):** **Fetch theo `field_name`, POST-FILTER bằng `Set` report_id** (đúng I3 + đúng pattern `loadCmr`/`loadEcar`) + **`skipOv=true`** cả 2 call.
  - ⚠️ **Vết xe đổ (đừng lặp lại):** patch `EIS_PATCH_r104` từng thử **scope cả 2 view theo `report_id`** (`(field_name…) and (report_id eq <uuid> or …)`, chunk 20) để né "treo". Kết quả: **2 view analytics EAV (`report_form_section_field` + `report_field`) trả VỀ RỖNG khi có `report_id` trong `$filter`** → trên UI mọi EIS hiện `CAs=0 · Departments=— · Progress=0/0`, status/due rớt về `Target_date` gốc (EIS-017 = 30/05 Overdue thay vì 30/06 Open). Đây **chính là lý do tồn tại I3**. r105 revert về field_name-only + post-filter.
  - "Treo load" mà patch lo thực ra là do **thiếu `skipOv`** ở call desc (chiếm overlay toàn cục + text rác "Loading documents…", vết r41), KHÔNG phải do field_name-only. `loadCmr` fetch `report_field` theo `field_name` (`CMR_RF`) + post-filter `cmrIdSet` vẫn chạy ổn → minh chứng field_name-only an toàn. r105 giữ `skipOv=true` cả 2 call.
- **Roll-up (`enrichEis`, clone — KHÔNG mutate `allData`):** `Target_date` = max(target CA) (fallback `r.Target_date` nếu 0 CA); `report_ageing` = `ageCalc(rollup)`. Status từng CA dùng lại `semCalc('Open', completed, target)`. Badge "n overdue CA" vẫn hiện CA lẻ quá hạn trong popup.
- **Đóng/mở quyết định Ở CẤP REPORT (r106 — sửa lỗi r10x):** `reportClosed = !!r.close_date || r.semantic_status ∈ {On-time/Lately/Closed}`. **KHÔNG** suy đóng/mở từ việc CA đã điền `Date completed` hay chưa (vd EIS-2025/005 đã đóng ở report nhưng 1 CA thiếu Date completed → trước r106 bị tính **Overdue** sai). Logic:
  - `reportClosed || allDone` → **đóng**: On-time/Lately so **ngày đóng** (`r.close_date`, fallback max(Date completed của CA)) với **due roll-up** bằng `dDay`. (Giữ `allDone` làm tín hiệu phụ để report đang hiện Closed không đổi hành vi.)
  - còn lại → **mở**: `semCalc('Open', null, rollup)` = Open/Overdue theo `today` vs latest target.
  - *Lưu ý:* report 0 CA & đã đóng → vẫn Closed, `Target (latest)` = `r.Target_date` gốc (không có CA để roll-up). Badge "(n overdue)" vẫn có thể xuất hiện trên report đã đóng nếu CA thiếu Date completed (chất lượng dữ liệu — cố ý phơi bày).
- **⚠ Phạm vi:** roll-up CHỈ ở *All Forms*; **KPI/Overview/Overdue vẫn dùng `Target_date` cũ** của EIS trong `allData` (sửa toàn cục = follow-up r10x kèm giải trình stakeholder). Không tự ý mutate `allData`.
- Hàm: `loadEisDetail`, `enrichEis`, `showEisDetail`/`closeEisModal`; registry `AF_SCHEMAS`; state `eisLoaded`/`eisCAMap`/`eisDescMap` (§10).

### 8.8 QC Spot Check Report — form-specific (r107)
Form `QC Spot Check Report` (org **QA AMO**, đã có sẵn trong `allData`) hiển thị trong *All Forms* với cột riêng kiểu CMR-CAR + modal `#qcsModal`. Mirror cơ chế EIS: schema trong `AF_SCHEMAS`, lazy-load 1 lần khi chọn form filter, modal riêng. **KHÔNG** thêm page sidebar, **KHÔNG** đụng `loadData()` chính, **KHÔNG** recompute `Target_date`/`semantic_status` (đã đúng trong `allData`).
- **Data shape:** mọi field QCS nằm ở `dwanalytics_report_field` → `value_text` + `section_id`. Section có field `Finding description` = 1 finding (gồm Finding description / ATA Chapter / Defect Classification / Position / AOG); section còn lại = header. **Group theo `report_id` → `section_id`** (header section_id dùng chung giữa các report cùng form → bắt buộc group report_id TRƯỚC). Số finding/report đúng theo data probe: SCR-0001=2, 0002=4, 0003=6.
- **Fetch (đúng I3 + I11):** fetch theo `field_name` + post-filter `Set` report_id, `skipOv=true`.
  - ⚠️ **Bẫy đã sập (r107 hotfix):** field `'Finding description'` là tên **generic, ~14k row toàn hệ thống** (nhiều form khác cũng dùng) → query field_name-only **timeout 30s** trong `fetchAll` → `catch` → `[]` → mọi cột "—" + Findings 0. `report_id eq` thì **HTTP 400** (không filter được — I3). **Cách thoát:** thêm vế **`report_raised_date ge <QCS raised sớm nhất − 2 ngày>`** (suy ra động từ `allData`, KHÔNG hard-code) → cắt 14k → ~vài trăm row → nhanh. **Chunk** 22 field thành 8/query (`Promise.all`) giữ node count < MaxNodeCount. (EIS không sập vì field name của nó hiếm hơn — cùng code shape vẫn vỡ với QCS. Xem I11.)
- **Enrich (`enrichQcs`, clone — KHÔNG mutate `allData`):** chỉ THÊM `qcs_aircraft`/`qcs_ac_type`/`qcs_spot_type`/`qcs_finding_count` cho bảng. Mọi ngày qua `fd()`, text qua `esc()`, body modal qua `safeHTML()`.
- **TDZ — vị trí khai báo (r107 hotfix):** `AF_SCHEMAS` dùng computed key `[QCS_TITLE]` + value `AF_QCS_COLS` → 2 hằng này **PHẢI khai báo TRƯỚC `const AF_SCHEMAS`** (giống `EIS_TITLE`/`AF_EIS_COLS`). Lần đầu đặt nhầm ở khối trước `renderAF()` (sau `AF_SCHEMAS`) → `ReferenceError: Cannot access 'QCS_TITLE' before initialization` lúc chạy top-level → **vỡ cả script, dashboard trắng data**. Hằng runtime-only (`qcsLoaded`/`qcsMap`/`loadQcsDetail`/`enrichQcs`) đặt sau thì OK.
- Hàm: `loadQcsDetail`, `enrichQcs`, `showQcsDetail`/`closeQcsModal`; registry `AF_SCHEMAS`; state `qcsLoaded`/`qcsMap` (§10); constants `QCS_TITLE`/`QCS_HEADER_FIELDS`/`QCS_FINDING_FIELDS`/`AF_QCS_COLS` (khai báo ngay trước `AF_SCHEMAS`).

### 8.9 AI Assistant — hỏi-đáp dữ liệu (r112, block `L9199–9561`)

Trợ lý chat nổi (FAB `#aiFab` góc phải-dưới, panel `#aiPanel`, badge **BETA**) cho phép hỏi bằng ngôn ngữ tự nhiên về findings/audit đang có trên dashboard. **Chỉ hiện sau khi đăng nhập** (`aiFab` display `flex` cuối luồng login `L2576`, ẩn khi logout `L2569`).

**Kiến trúc agentic (tool-use client-side) — đây là điểm mấu chốt:**
- Client POST `{system, tools, messages}` tới Worker **`galileo-ai`** (`AI_URL`, §2.2) — Worker chỉ là **proxy Anthropic Messages API**, giữ `ANTHROPIC_API_KEY` server-side. Claude không tự chạy được gì; nó **sinh `tool_use`** → **JS chạy tool ngay trên `allData`/`auditData` tại browser** (`aiRunTool`) → đẩy `tool_result` về → lặp. Vòng lặp `aiSend()` tối đa **6 round** (`stop_reason==='tool_use'` thì chạy tool rồi `continue`).
- **Riêng tư dữ liệu (quan trọng):** KHÔNG upload toàn bộ dữ liệu lên API — chỉ **kết quả truy vấn** (số đếm/nhóm/danh sách rút gọn) được gửi. Dữ liệu thô nằm lại trong browser.

**3 tool (`AI_TOOLS`), thực thi bằng JS thuần trên state có sẵn:**
| Tool | Hàm | Việc |
|---|---|---|
| `get_data_overview` | `aiOverview()` | Tổng quan: tổng finding, các năm, đếm theo form/status, tổng audit. Gọi trước khi chưa chắc dữ liệu. |
| `query_findings` | `aiQF(q)` | Lọc/đếm/nhóm finding theo year, ym, `report_title` (khớp **chuỗi con**, không cần tên đầy đủ), `semantic_status`, `overdue_cat` (CAT I ≤30d / II 30–60 / III >60), `finding_level`, owner, audit, repetitive; `group_by`; `include_ontime_rate`; `return_records`+`sort_by`+`limit`. |
| `query_audits` | `aiQA(q)` | Lọc/nhóm Audit Plan theo year/status/lead/type, trả danh sách + số finding liên quan. |

**System prompt (`aiSystem()`)** nhúng động: ngày hôm nay, tổng finding/audit, **danh sách form THỰC TẾ trong `allData` kèm số lượng** (để Claude tự khớp), định nghĩa `semantic_status`/`overdue_cat`/on-time rate, và bảng viết tắt (SR=Surveillance, EIS=MQA Event Investigation Summary, QC/SCR=QC Spot Check, IA=Internal Audit, CMR=CMR-CAR).
- **r112-i1 (fuzzy matching):** yêu cầu Claude **tự đối chiếu tên gõ tắt/gần đúng với danh sách form thực tế rồi truy vấn ngay**, chỉ hỏi lại khi thật sự không suy được — thay vì hỏi tên form chính xác.

**Hiển thị:** `aiMd()` render markdown rút gọn (bảng/list/inline code/bold) sang HTML; bong bóng user/bot/err. Hội thoại cắt còn ~20 lượt gần nhất (`aiMsgs.slice(-16)`), cắt theo cặp để không lệch `tool_use`/`tool_result`. Lỗi Worker → gợi ý kiểm tra `galileo-ai` đã deploy + có `ANTHROPIC_API_KEY`.
- Hàm chính: `aiToggle`/`aiSend`/`aiAsk`/`aiCallWorker`/`aiRunTool`/`aiQF`/`aiQA`/`aiOverview`/`aiMd`; state `aiMsgs`/`aiBusy`; const `AI_URL`/`AI_TOOLS`.

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
- **Cache/flags:** `cmrLoaded, ecarLoaded, pavoiRfiLoaded, pavoiRfiMap{}, pavoiRfiDone(Set), docTaskCache{}, docWorkflowCache{}, isLoading`. **r104:** `eisLoaded, eisCAMap{}, eisDescMap{}`. **r107:** `qcsLoaded, qcsMap{}` (report_id → `{header:{}, findings:[]}`). Tất cả reset cạnh `pavoiRfi*` đầu `loadData` để ↻ Refresh kéo lại detail mới.
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
| I3 | KHÔNG nhồi `report_id` vào `$filter` của bảng EAV `dwanalytics_report_form_section_field` **và `dwanalytics_report_field`** (post-filter client). Trên `report_field`, `report_id eq '<uuid>'` trả **HTTP 400** (cột không filter được), không phải rỗng. |
| I11 | **`dwanalytics_report_field` fetch theo `field_name`-only có thể TIMEOUT** nếu field name generic (vd `'Finding description'` ~14k row toàn hệ thống) → `fetchAll` quá 30s → rỗng âm thầm. Thu hẹp bằng **`report_raised_date ge <ISO>`** (cột này filter được; literal trần, không nháy: `report_raised_date ge 2026-06-01T00:00:00Z`), suy mốc động từ report sớm nhất trong `allData`. Chunk field list (~8/query, `Promise.all`) giữ node count < 100. Xem §8.8. |
| I4 | **OData giới hạn 100 node/filter** → chuỗi `or` tối đa ~16 `report_id eq`; batch ≤15. |
| I5 | Mọi date hiển thị qua `fd()`; tính ngày qua `ageCalc/dDay` (KHÔNG `toLocaleDateString` trực tiếp). |
| I6 | Proxy yêu cầu `Origin` hợp lệ (chỉ chạy từ domain deploy / localhost). |
| I7 | Bảng lớn (`report_task` ~24k, `audit_workflow` 100k+): KHÔNG fetch global; fetch theo report_id/điều kiện, lazy + cache phiên. |
| I8 | Galileo có **replica lag** (read trả bản cũ vài phút) → số liệu RFI/finding có thể stale; fetch tươi on-demand cho chi tiết. |
| I9 | `dwreporting_report_task.id` KHÔNG unique — dedup bằng `task_id` nếu cần. |
| I10 | Stage `Task` thường trùng lặp trong workflow → lấy giá trị muộn nhất (deriveStageDates). |
| I12 | **Ghép field của repeater (nhiều finding/CA trong 1 report) PHẢI theo `section_id`, KHÔNG theo `created_date`/thời gian.** Galileo ghi các field xen kẽ giữa các instance → ghép theo thứ tự thời gian sẽ trộn nhầm (vd sai Department/finding). Group `report_id → section_id → {field_name: value}` (header section_id có thể dùng chung giữa các report cùng form → group `report_id` TRƯỚC). Áp dụng cho EIS CA (§8.7), QCS findings (§8.8), CMR/ECAR (`applySecIdOverlay`). |

---

## 13. Quy ước phát triển

- **Edit surgical:** chỉ chạm điểm cần sửa, không refactor lan man.
- **Versioning (`APP_REV = YYYY.MM.DD-rNN[-iM]`):** phân biệt **nâng rev** vs **đánh issue** để rev không bị đẩy lên quá cao do mỗi lần vá lỗi.
  - **NÂNG REV (`rNN → r(NN+1)`, reset issue về 0)** khi: **thêm tính năng mới**, **sửa/đổi layout**, hoặc **bỏ bớt chức năng**. Đây là thay đổi hành vi/giao diện có chủ đích.
  - **ĐÁNH ISSUE (giữ `rNN`, tăng `-iM`: `r107-i1`, `r107-i2`…)** khi: **chỉ sửa lỗi** (bug fix) của rev hiện tại — không thêm/bỏ chức năng, không đổi layout. Ghi vào changelog dưới rev đó dạng "Issue 1/2/3". Tính năng kế tiếp lên `r(NN+1)`, đếm lại issue từ đầu.
  - *Ví dụ:* r107 = tính năng QCS detail (nâng rev). 2 hotfix sau (TDZ trắng data; timeout `report_field`) là **bug fix → Issue 1 & Issue 2 của r107** (`r107-i1`, `r107-i2`), KHÔNG nâng lên r108/r109. r108 = tính năng KPI ATA mới (nâng rev); 3 sửa hiển thị/tính TOTAL sau đó = **Issue 1 (`r108-i1`)**, KHÔNG nâng rev; r109 = đổi logic tử số KPI (chỉ QC) = nâng rev. Hiện **r109**.
  - Luôn nối tiếp số thực tế trong file, KHÔNG lùi. Nhãn version ở User Guide nạp động từ `APP_REV` (không hardcode "vN").
- **Deploy:** sửa `index.html` (bản OneDrive) → copy vào clone repo → `git diff` review → commit + push `main` (commit message dùng `git commit -F` để tránh lỗi shell với ký tự `/`). GitHub Pages tự build ~1–2 phút.
- **Tận dụng helper có sẵn** (fetchAll, g, s, esc, fd, toast, setOv, renderPaged, sortD, ageCalc) — không viết trùng.
- **Tài liệu liên quan:** `PAVOI_RFI_Spec.md` (RFI chi tiết), `CAR report types & KPI2` (MCAR/AMO-ECAR vs CMR-CAR/ECAR; KPI2 Phase-1), `GALILEO_QUIRKS.md`, `GALILEO_DATA_QUALITY.md`.

---

## 14. Lịch sử version gần đây

| Rev | Nội dung |
|---|---|
| r120 | **Safety — redesign giao diện (đổi layout = nâng rev):** thay bảng Excel-style bằng UI dashboard-native theme-aware (dùng var CSS): 4 KPI card (Tổng / OSR / MOSR / **Total Open** nổi accent), badge bo tròn cho Open, phân nhóm Line/Base/Workshop bằng section divider chấm màu, cột OSR/MOSR accent xanh/amber. **Chỉ đổi `buildSafetyTable` + container `page-safety`; logic/nguồn dữ liệu giữ nguyên r119.** |
| r119 | **Safety — MSAG Report Status (nâng rev = tính năng):** tab mới ở MAIN + trang bảng OSR/MOSR Closed/Open/Total theo nhóm MSAG (giống bảng Coruson). **Nguồn mới owner-based:** `dwanalytics_user_group` (map `owner_id`→tên nhóm MSAG) + `dwreporting_report_summary` lọc `owner_id ∈ nhóm MSAG` & `valid_to eq null` — **tách khỏi luồng `org_unit='QA AMO'`** (OSR/MOSR nằm rải nhiều org_unit). Đếm theo `report_status` (Closed/Open), không lọc category. MOSR mặc nhiên thuộc MQA; OSR lọc bằng owner. |
| r118 (+i1/i2/i3) | **Export Report redesign (nâng rev = layout):** letterhead VietJet, document sáng, chart sáng. i1: fix treo khi render chart (`requestAnimationFrame`→`setTimeout`); i2: bỏ chart Monthly Trend; i3: hiện số trên donut Status. Consumer của `allData`, không đổi nguồn. |
| r117 | **Export Report — multi-month + status filter (nâng rev = tính năng):** lọc nhiều tháng + trạng thái, detail nhóm, ô KPI đều. |
| r116 (+i1) | **Overdue Report PDF rework:** chuyển sang jsPDF-AutoTable + nhúng font Việt. i1: nới cột Audit No. / report-number. |
| r115 (+i1) | **Login/Auth (nâng rev = hành vi):** phân biệt lỗi server/mạng vs sai mật khẩu. i1: reset password flow — fix màn trắng + bắt sót recovery event. |
| r114 | **Overdue Report PDF trên letterhead VietJet.** |
| r113 (+i1..i4) | **Overdue Report export (nâng rev = tính năng):** xuất `.xlsx` snapshot tuần từ `allData`. i1 fix blank Audit No./Finding Summary cho PAVOI; i2 responsible person vào Department + lọc form-type; i3 PAVOI chỉ hiện owner RFI chưa trả lời + multi-form filter; i4 PAVOI Department blank khi không có RFI open. |
| r112-i1 | **AI Assistant — fuzzy form matching (Issue, KHÔNG nâng rev):** system prompt yêu cầu Claude tự đối chiếu tên form gõ tắt/gần đúng (SR/EIS/QC/SCR/IA/CMR) với danh sách form thực tế trong `allData` rồi truy vấn ngay (filter `report_title` khớp chuỗi con), chỉ hỏi lại khi không suy được. Xem §8.9. |
| r112 | **AI Assistant chat (nâng rev = tính năng mới):** FAB `#aiFab` + panel `#aiPanel` (BETA), hỏi-đáp NL về findings/audit. Kiến trúc **tool-use client-side**: client → Worker `galileo-ai` (proxy Anthropic API, giữ `ANTHROPIC_API_KEY`) → Claude sinh `tool_use` → JS chạy 3 tool (`get_data_overview`/`query_findings`/`query_audits`) trên `allData`/`auditData` tại browser → `tool_result` → lặp ≤6 round. **KHÔNG upload dữ liệu thô — chỉ kết quả truy vấn.** Chỉ hiện sau login. Xem §2.2, §8.9. |
| r111 | **Nút Feedback / Bug Report ở sidebar (additive):** `nav-item` mở Google Form (`docs.google.com/forms/d/e/1FAIpQLSdzEq_…/viewform`) tab mới cho bug report / feature request. (Ban đầu nhãn tiếng Việt, sau đổi sang tiếng Anh "Feedback / Bug Report".) |
| r110 | **Cập nhật roster `QA_AMO_AUDITORS`** (`const … = new Set([...])`, ~L2220) — tập tên lead auditor dùng lọc Audit Plan về đúng phạm vi QA AMO (`QA_AMO_AUDITORS.has(a.lead_auditor_name)`). Chỉ thêm/sửa tên, không đổi logic. |
| r109 | **KPI ATA: tử số chỉ phần QC (nâng rev = đổi logic):** CMR-CAR vào tử **chỉ khi gán Category "QC MQA Physical Finding"** (`QC_CAT_UUID = 7e5ccacc-…-905870d68aca`, cấp report). `loadCmr` thêm `category_id` vào `$select` (mang qua `cmrData` bằng `...r`); vòng đếm CMR lọc `r.category_id===QC_CAT_UUID`. QC Spot Check (toàn bộ finding) + mẫu số ECAR + TOTAL/No-ATA/badge giữ nguyên r108. Title/sub/legend/dataset đổi nhãn "QC". *(Giữ ratio số thập phân theo r108-i1, KHÔNG dùng "×100%" trong spec gốc.)* Forward-looking: data cờ QC mới từ 2026-05/06. Xem §6.4c. |
| r108 | **KPI ATA đổi nghĩa (nâng rev = tính năng):** chart/bảng `cATACompare` rebuild thành internal-vs-authority `Ratio[ATA] = (CMR-CAR + QC Spot Check finding N−1) ÷ (ECAR finding N)` (thay ratio cũ ECAR/CMR). Filter year-multi → Year+Month single (default tháng hiện tại, rollover tháng 1). Đếm finding con per-ATA (CMR/ECAR `findingRows`, QCS `qcsMap.findings` — phụ thuộc r107). Bảng TOTAL/per-ATA/No-ATA, guard `den>0`. PDF cập nhật label/title/head. Xem §6.4c. **Issue 1 (`r108-i1`):** ratio đổi sang **số thập phân** (không phải %); ô count rỗng = `0` (không phải `—`); dòng TOTAL **chỉ cộng phần CÓ ATA** (khớp tổng các dòng per-ATA, No-ATA để riêng). |
| r107 | **QC Spot Check Report detail ở All Forms** (mirror EIS, **nâng rev = thêm tính năng**): schema `AF_QCS_COLS` + `#qcsModal`, lazy-load `loadQcsDetail` group finding theo `report_id→section_id` (I12), `enrichQcs` clone (KHÔNG mutate `allData`). Xem §8.8. **2 bug fix cùng rev (Issue, KHÔNG nâng rev):** **Issue 1 (`r107-i1`) — TDZ:** `QCS_TITLE`/`AF_QCS_COLS` ban đầu khai báo SAU `AF_SCHEMAS` (chỗ dùng chúng làm computed key) → `ReferenceError` lúc top-level → **trắng toàn bộ data**; chuyển 4 hằng lên TRƯỚC `AF_SCHEMAS`. **Issue 2 (`r107-i2`) — Timeout:** query `field_name eq 'Finding description'` (~14k row) timeout 30s → detail rỗng; thêm vế `report_raised_date ge <raised sớm nhất − 2d>` + chunk 8 field/query (I11). `report_id eq` trên `report_field` = HTTP 400 (I3). Verify trên API thật: 13941→213 row, 18 row khớp QCS. |
| r106 | **Fix EIS đóng/mở theo cấp report:** `enrichEis` trước đây suy đóng/mở từ "mọi CA đã có Date completed" → report **đã đóng** nhưng CA thiếu Date completed (vd EIS-2025/004 0 CA, /005 3/4, /009 2/3) bị tính **Overdue** sai. r106: `reportClosed = close_date \|\| semantic_status ∈ {On-time/Lately/Closed}`; `reportClosed \|\| allDone` → đóng (On-time/Lately so ngày đóng vs due roll-up bằng `dDay`), còn lại → Open/Overdue theo latest target. Giữ `allDone` làm fallback (không regress). Report 0 CA → `Target (latest)` = `Target_date` gốc. Xem §8.7. |
| r105 | **Fix EIS per-CA load (lỗi từ delta r104):** patch r104 scope 2 view analytics theo `report_id` → **trả rỗng** (2 view EAV không hỗ trợ filter report_id — đúng I3) → UI mọi EIS hiện `CAs=0/Departments=—/Progress=0/0`, due rớt về `Target_date` gốc. r105 **revert `loadEisDetail` về fetch theo `field_name` + post-filter `Set`** (đúng pattern `loadCmr`/`loadEcar`), giữ `skipOv=true` cả 2 call (fix overlay r41 — thủ phạm "treo" thật sự). Giữ nguyên popup rút gọn + roll-up. Xem §8.7. |
| r104 | **(2 spec chung 1 bump)** (1) **User delete** — nút 🗑 Delete ở User Management → `deleteUser` gọi Edge Function `delete-user` (xóa cả `auth.users`+`public.users`, service_role server-side, verify admin qua JWT, chặn tự xóa/admin cuối, CORS whitelist, FK cascade). Edge Function + FK do Eric deploy phía Supabase. Xem §8.5, `USER_DELETE_SPEC.md`. (2) **EIS form-specific ở All Forms** — `renderAF` schema-driven (`AF_SCHEMAS`, `_default` giữ nguyên 14 cột), EIS có cột riêng + popup per-CA (`#eisModal`), lazy-load `loadEisDetail` ghép CA theo `section_id`, **due roll-up = latest Target date** (`enrichEis`, clone — KHÔNG mutate `allData`; KPI/Overview giữ giá trị cũ). Xem §8.7, `FORM_EIS_DESIGN.md`. **Delta `EIS_PATCH_r104` (cùng rev, không bump):** thêm `skipOv=true` mọi call (hết chiếm overlay/text rác, vết r41) + rút gọn popup (bỏ Main Cause/Error/Violation/Detailed Description khỏi `EIS_DESC_FIELDS` + `showEisDetail`) — **2 phần này giữ lại**. ⚠️ Phần scope `loadEisDetail` theo `report_id` (chunk 20) **GÂY LỖI rỗng CA → đã revert ở r105** (xem r105). |
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
| r95 | Document copyholder: `$select` gọn + retry 3× chống timeout proxy (351KB→109KB); cột Status (và tất cả cột) **sort được**, mặc định gom người chưa acknowledge (overdue→in-progress) lên đầu; lỗi có link "Thử lại". |
| r96 | **Year filter đa năm** (component dùng chung `initYearMulti`/`ymHas`/`ymVal`/`ymText`, 17 chỗ — chọn 1/2/tất cả năm, Overview/KPI/SPI mặc định năm hiện tại — xem §7.5). **Export gom về Admin** (nav vào `#adminNav`; vá lỗ hổng nút Audit Plan Excel thiếu gating). Query Builder: nhãn 4 bước + hint tiếng Việt. My Dashboard: thêm phụ đề mục đích. User Guide: callout bộ lọc năm + đánh dấu Export Admin-only; **fix render** 2 khối Form Types + FAQ (trước in nguyên template-literal); nhãn version nạp động từ `APP_REV`. Dọn dead-code `monthYr`. CLAUDE.md: sửa thông tin sai "plaintext password" (auth = Supabase Auth). |
| r97 | **Auto-refresh kiosk (additive):** `startAutoRefresh()` — heartbeat 5 phút/wall-clock, đủ 12h → `loadData(true)` tại chỗ (không reload, không chạm phiên sessionStorage); guard `!curUser`/`isLoading`. Bật ở cuối `initApp`. User Guide FAQ "When is the data updated?" cập nhật theo (xem §5.6). |
| r98 | **Fix copyholder Cancelled/Deleted:** modal Documents (`showDocDetail` → builder `_docTasks`) lọc bỏ `task_status ∈ {Cancelled, Deleted}` **trước** `.map` (Galileo ẩn người đã gỡ khỏi distribution nhưng vẫn giữ dòng task). VD `VJC-MQA-EIS-2026-017`: Total 426→424, Overdue 5→3. Quirk dữ liệu kho, lọc ở dashboard (xem §8.6). |
| r99 | **Fix copyholder On time/Late:** `showDocDetail` so acknowledged vs due **theo NGÀY** (`dDay(ackDt) <= dDay(dueDt)`) thay vì so cả giờ-phút (`new Date(...)`). Trước đây ack đúng ngày due nhưng có giờ > 00:00 bị tính Late. Quy ước: ack đúng ngày due = On time. |
| r103 | **MCAR cột Raised by + bỏ Finding Description:** `renderFormView` thêm 2 cờ `ids.raisedBy` (render `owner_name` = "Raised by", trùng Owner trên Galileo) và `ids.hideFindingDesc`. `renderMcar` bật cả hai → MCAR: No · Status · Raised · **Raised by** · Target · ⚠ Deadline · Days · CAT · Audit Title (9 cột, bỏ Finding Description). AMO-ECAR không truyền cờ → giữ 8 cột + Finding Description. |
| r102 | **Revert r100 — Target_date lấy từ Report:** đổi lại ưu tiên suy `td` → custom `'Target date'` (Report, mốc QA chính thức) trước, stage Task target thành fallback. MCAR-0363 cho thấy Report (18/06) đúng còn stage Final Action (22/06) lệch (ngược với case RP/AMO-ECAR của r100). Cũng tắt false-positive ⚠ Deadline cho MCAR set target đúng. Đánh đổi: các form r100 (MQA-RP-065…) lại dùng Report — chấp nhận theo quyết định QA. |
| r101 | **MCAR Deadline Check (additive):** cột ⚠ Deadline + filter `mcarWarnF` trên bảng MCAR (chỉ MCAR). `buildMcarDeadlineChk` tính Target due = raised+45+30×n (n = số extension đã duyệt: `First extension approved?`/`Second extension agreed?`), cảnh báo khi `Target_date` đang lưu lệch (so theo ngày). Thêm 2 cờ vào `$filter` bước [5/6] (15 field, 30 node). Cache-safe (string+boolean). Xem §6.5b. |
| r100 | **Target_date chuẩn theo workflow:** đảo ưu tiên suy `td` trong `loadData` → `sd.td` (stage Task target, management) trước; custom field `'Target date'` thành **fallback** (hay nhập sai/cũ). 531 report (MCAR/PAVOI/CAR/AMO-ECAR…) đổi `Target_date` → kéo theo `semantic_status`/overdue/aging/KPI (cả report đã đóng). VD `MQA-RP-065-2026` 22/04→30/06; `AMO-ECAR-027` 22/02→13/01. Report không có stage Task giữ nguyên (vẫn dùng custom). Cũng dứt điểm lỗi custom trùng giá trị trong EAV (first-wins không tất định). |
