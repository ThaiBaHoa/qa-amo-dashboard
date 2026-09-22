# HANDOVER — `main`

> Trạng thái tức thời cấp vault ở `obsidian-mind\.claude-memory\DANG-LAM.md`;
> lịch sử rev đầy đủ ở `PROJECT_TECH_SPEC.md` §14.

---

## ⏳ r168 — TẢI NHANH KHI GALILEO TREO + CACHE ĐỦ LƯỢT 2 (22/09/2026, ĐÃ COMMIT, CHƯA PUSH)

- Eric: trang tải rất chậm, nghi không phải lỗi Galileo → đo toàn bộ trên live.
- Đo: có cache thì dữ liệu sẵn sau 0,9s; nhưng lượt 2 (CMR-CAR / ECAR / KPI 7) gọi LẠI Galileo mỗi lần mở:
  custom field CMR-CAR 13,7 MB = 94s, ECAR = 189s (504/90s rồi thử lại mới xong). CPU chỉ ~0,2s.
  curl thẳng proxy: cùng query lúc 504/90s lúc 200/1,8s (report_summary QA AMO: 504 · 504 · 200/1,8s).
- Sửa: `classic.html` `fetchHedged` (dự phòng mỗi 15s, tối đa 3 bản, bản về trước thắng) + `fetchAll` gộp
  request trùng đang chạy; `index.html` cache chính thêm khoá `x` (CMR-CAR/ECAR/KPI 7/verification) → mở có
  cache = 0 request Galileo. UI: bảng MSAG canh giữa + không cắt chiều cao; tiêu đề cột `ar` canh phải.
- Kiểm: harness 9/9; local dữ liệu thật: hedge cứu workflow + custom fields; mở lại: 0 request, 7.022 report
  sau 0,7s, KPI 7 2026 = 51/59, `M.consistency()` 0 lệch.
- ⚠️ Lần mở ĐẦU sau deploy vẫn nạp nguội (cache gắn APP_REV) — Galileo tệ thì vẫn vài phút; hedge chỉ rút ngắn.
- ⚠️ `beta.html` trong repo là trang chuyển hướng — đừng chép bản build đè lên để thử; thử qua `/?relay=…&write=1`.
- Chưa làm (đề xuất, cần Eric chốt): cache ở Worker `galileo-proxy` (nguồn Worker không nằm trong repo);
  cho phép hiện cache rev cũ như "stale" rồi nạp ngầm sau deploy.

## ✅ r167-i1 — MỘT NGUỒN ĐỊNH NGHĨA CHỈ SỐ + SỬA SELF-CHECK (22/09/2026, ĐÃ PUSH f9dd939 — live)

- Eric: Overview (65,9%) lệch KPI charts (43%) là lỗi đã nhắc nhiều lần → yêu cầu cơ chế tự đồng bộ mọi chỗ.
- `index.html`: khối **METRICS** (`M.*`, nguồn `beta-src/metrics.js`) là nơi DUY NHẤT định nghĩa phạm vi, luật kỳ,
  nhóm trạng thái, open / in-target / overdue / CAT / on-time / closure time / KPI 2 / KPI 7 / audit. Overview
  (`overviewStats`), Work Queue (`LANES`), KPI charts (`kpiChartStats`), Export (`exportRowsFor`), chi tiết audit,
  7 ô Audit Plan đều gọi `M`. Guard: lint build "metrics-only" + `M.consistency()` sau mỗi lượt nạp (lệch → chip ⚠ admin).
- Kiểm local 2026: Overview/Work Queue/KPI charts/Export cùng số (open 77, in-target 40, overdue 37, on-time
  222/520 = 42,7%, tổng 640), `M.consistency()` 0 lệch; cố ý phá → bắt được `9 ≠ 37` và `43 ≠ 298`.
- `classic.html` r167-i1: self-check 6 (KPI 7 drill-down) sửa theo r155 → hết 3 cảnh báo sai.
- Manual song ngữ Việt–Anh (15 trang) thay bản chỉ tiếng Việt.

## ✅ r167 — GIAO DIỆN MỚI THÀNH BẢN CHÍNH (22/09/2026, ĐÃ PUSH d6f8670 — live)

```
index.html   = giao diện mới (không chứa logic; tải classic.html, trích hàm, tự ghi cache)
classic.html = bản cũ, BACKUP + nơi DUY NHẤT chứa logic dữ liệu và APP_REV (2026.09.22-r167)
beta.html    = chuyển hướng về ./
```
- Sửa giao diện: nguồn ở `Vault-CongViec/.../rebuild UIUX/beta-src/` (`loader.js`, `screens.js`, `screens2.js`, `guide.js`)
  → `node build.mjs` → `node make-index.mjs` (ghi `index.html` vào repo). Sửa logic: sửa `classic.html` (cả 2 trang dùng).
- Hook/guard đã theo dõi cả 2 file; `check-doc-sync.sh` đọc APP_REV từ `classic.html`; `test-r155-kpi7.mjs` + `snapshot.mjs` đọc `classic.html`.
- Đã có trên bản mới: đăng nhập/đăng ký/quên & đổi mật khẩu, ghi cache + delta, 2 lượt nạp, ↻ + tự nạp 12h, LED `?kiosk=`,
  37 form + CMR-CAR + ECAR, OSR/MOSR, Analytics (KPI charts, SPI, Safety, Early detection, Event/IR status), Audit Plan
  (Year×Month, 7 ô KPI, chi tiết audit, Bottleneck), Documents (+copyholders/workflow), chi tiết EIS/QCS, PAVOI RFI/Task
  (+ rfv/report_ref/dept), export PDF/Excel/Overdue bằng hàm của classic, AI Assistant, chip self-check, User guide mới.
- Overview + Work Queue theo phạm vi QA AMO (allData) như classic; CMR-CAR/ECAR (TQA) ở tab riêng.
- Kiểm local (relay dữ liệu thật): 25 màn không lỗi JS, số khớp classic (2026: open 77, overdue 37, on-time 222/520,
  KPI 7 51/59), 4 export ra file đúng, LED 5 bước, 18 màn không tràn 375px. **Chưa kiểm được local:** đăng nhập thật,
  User management, Feedback, AI (worker chỉ nhận origin site) → kiểm ngay sau push.
- ⚠ Self-check "KPI 7 drill-down contamination" (3 cảnh báo) là kiểm tra cũ của classic, lệch công thức r155 — classic cũng báo; chờ Eric quyết.
- Tài liệu: `MQA dashboard website/HuongDan_SuDung_QA_AMO_Dashboard_r167.docx` (13 trang), email nháp song ngữ
  `MQA dashboard website/mail/Email-thong-bao-giao-dien-moi-QA-AMO-Dashboard-2026-09-22.md`.
- Lùi: `git revert <commit r167>` (đưa classic.html về index.html).

---

## ⏳ beta.html — giao diện Open Design trên logic dữ liệu live (22/09/2026, push theo yêu cầu Eric)

`vjc-qa-amo.com/beta.html`. Không đổi `index.html` ⇒ không bump `APP_REV`, bản chính không bị ảnh hưởng.
Mở: đăng nhập ở `/` rồi mở `/beta.html` trong **cùng tab**. Lùi: `git rm beta.html` + push.
- Giao diện = thiết kế OD 15/09 11:51 (`Documents\GitHub\od-imports\qa-amo-ia-redesign\index.html`) + adapter dữ liệu thật.
- Loader: tải `index.html` cùng domain → `extractClosure()` lần theo tên từ `loadData/loadCmr/loadEcar/loadKpi7Tasks/kpi7*`
  → đọc cache `qaAmoCache/blobs/qaAmoV5` (chỉ đọc, cùng rev) hoặc `loadData(true)` → ánh xạ REPORTS/AUDITS → đối chiếu.
- Chạy thử local: `preview beta-local` (Vault-CongViec `.claude/launch.json`, relay `rebuild UIUX/beta-devserver.mjs`).
  Đo 22/09: 4.117 report, KPI 7 2026 = 51/59, mọi phép đối chiếu khớp; có cache thì 15s, không có cache thì 20–137s.
- ✅ **Đã có hành vi r148/r165/r166:** `idbGet` đọc thật `wfRaw`/`cfRaw` (chỉ đọc; `idbSet` rỗng ⇒ mốc delta của bản
  chính giữ nguyên), gọi `loadData(false)`. Cache cùng rev quá `CACHE_TTL` (đọc từ index.html) ⇒ hiện ngay, nạp ngầm trong
  scope riêng, **chỉ thay khi đủ nguồn + đối chiếu sạch** (`betaSwap()` thay nội dung REPORTS/AUDITS/INDEX, không reload).
  Đo local 22/09: cache 5h → UI 6,7s, `[wf] DELTA 126 report 4,1s`, `[cf] DELTA 11 report 4,3s`, nạp ngầm xong 16,5s;
  sau đó `wfRaw`/`cfRaw`/`qaAmoV5` không đổi byte nào về mốc/số dòng.
- ✅ **22/09 tối — đủ màn, đủ dữ liệu** (864b490 + edfb323, ĐÃ PUSH 22/09): mọi loại report của `allData` (37 form, `form:'other'`) +
  CMR-CAR + ECAR = 7.021 report; tab mới Findings › OSR/MOSR; Analytics › KPI charts / SPI / Safety / Early detection /
  Event-IR status; Audit › Bottleneck; Library › Documents / User guide; Admin › Users / Exports (.xlsx) / My dashboard / Feedback.
  Mỗi màn gọi **loader của chính index.html** qua `window.BETA_API` (danh sách hàm cố định, KHÔNG eval — bộ phân loại quyền
  đã chặn phương án eval). Loader tự dò phụ thuộc (`extractClosure`: gốc + mọi tên DRIVER nhắc tới; tự tắt `render*/show*/…Chart`;
  hiểu regex literal; khai báo gộp `let a=…, b=…` không bị khai báo lại). Có cache ⇒ vẽ ngay (lite), CMR-CAR/ECAR/KPI 7 nạp lượt 2.
  Kiểm local: 25 màn không lỗi JS, 18 màn không tràn ngang ở 375px. Chưa thử trên live: Users, Feedback (cần phiên Supabase thật).
- 22/09 (Eric báo): Audit Plan không theo bộ lọc → nay nạp audit MNT **mọi năm** (1.052: 2020–2026), Timeline /
  Schedule list / số audit trên Overview lọc theo Year × tháng bắt đầu dự kiến (2026 = 191, May–Sep = 101). Thanh lọc
  hiện cả trên Analytics; ô Department chỉ hiện ở Overview / Work Queue / Findings (audit, analytics, OSR không có trường này).
- Nguồn dựng: `Vault-CongViec/.../rebuild UIUX/beta-src/` (`loader.js`, `screens.js`, `build.mjs`, README).
- Còn: bước kiểm đăng nhập chưa thử trên live; Export PDF / Overdue weekly vẫn ở bản chính; chi tiết tài liệu (copyholders) và
  modal EIS/QCS chưa port; chờ Eric duyệt mã hoá status không màu.
- Hồ sơ: note `om` `inbox/2026-09-22-qa-amo-dashboard-betahtml-open-design-ui-on-live-data-logic.md`.

---

## ✅ r165 + r166 (tải chậm) ĐÃ PUSH & ĐÃ KIỂM TRÊN LIVE 21/09/2026

```
origin/main = main = de0f565 (r166) · d84a00a (r165) · trước đó e1c4663 (r164)
```
Lùi: `git revert de0f565` / `git revert d84a00a`. Commit r165 dùng `--no-verify` (Eric đồng ý; note vault đã ở r166).

Nguyên nhân tải chậm: Galileo 504 theo đợt + cache 4h hết hạn (5/5 lượt mở gần nhất nạp nguội).
- **r165** stale-while-revalidate (`cacheLoad` → `'stale'`, `loadData(false,{background:true})`, `lov`, `resetLazyStores`).
- **r166** Custom fields delta (`fetchCustomFieldRows`, IndexedDB `cfRaw`).

✅ **Kiểm live r166 (Claude in Chrome, admin Eric):** lần mở đầu sau deploy (cache r164 bị vứt) xong <47s, đủ 6
nguồn — `[cf] DELTA 0 report, 3,5s` · `[wf] DELTA 5 report, 6,7s`. Lùi mốc cache 5h rồi reload: Overview hiện ngay,
không overlay, nhãn `5h ago · refreshing…`, console `[cache] STALE`; nạp ngầm xong ~32s → `Just loaded`, Overdue 39,
`runSelfChecks()` rỗng, stats ghi `S`.

Còn: lần mở đầu sau mỗi deploy vẫn nạp nguội (bình thường); Audit plan vẫn nạp đầy mỗi lượt (chưa delta).

---

## ✅ r163 + r164 ĐÃ PUSH & ĐÃ KIỂM TRÊN LIVE 21/09/2026

```
origin/main = main = e1c4663 (r164) · 691ac25 (r163) · trước đó 94a567a (r162)
```
Lùi: `git revert e1c4663` / `git revert 691ac25`. Commit r163 dùng `--no-verify` (Eric đồng ý) vì note
vault đã ở r164 nên guard so rev từng commit sẽ chặn; r164 chạy đủ guard, OK.

- **r163** All Forms Detail chỉ còn 15 form (`AF_FORMS`/`AF_FORM_SET`), loại PAVOI/MCAR/CAR/CMR CAR/AMO ECAR/1. OSR/MOSR cả ở chế độ All Forms.
- **r164** page `OSR / MOSR` (`page-osrmosr`, `loadOsr`) — 1. OSR + MOSR của **2 nhánh AMO + MQA : QA AMO** (30 UUID từ cây OU, lọc ở client vì `$filter` 30 UUID vượt trần 100 node). Probe 21/09: 1.272 report · Open 57. **Không gộp form cũ `OSR`** (Eric chốt).
- Kiểm: `node --check` 5/5; chạy thật code trên dữ liệu probe 11/11 PASS; `curl` live thấy `APP_REV r164` + `page-osrmosr`.
- ✅ **Kiểm live 21/09 (Claude in Chrome, admin Eric):** All Forms dropdown đúng 15 form, 2.523 records, cả 15 form đều có dữ liệu. OSR / MOSR: 1.272 records (1. OSR 783 · MOSR 489 · Open 57), Org unit = Line Maintenance/QA AMO/Store/Workshop, không toast lỗi.
- ⚠️ Lượt nạp chính lần đó ~6 phút + 1 lần "Could not load data": Galileo 504 theo đợt (Audit plan, Custom fields, Workflow); curl cùng lúc chỉ 2–3s. Không liên quan r163/r164.
- ❓ r163 cũng ẩn các form KHÔNG có page riêng: Battery/Wheel Workshop Inspection, Store Inspection, LMD Inspection, MAINTENANCE STATION INSPECTION, Hangar Check Surveillance Checklist, C Check, MQA-Quality Notice, MQA Self Evaluation, Change Control Form, AMO - HAZARD LOG, AMO - Additional Mitigation, Meeting Minutes - MOM (+2 form Test). Đã hỏi Eric có cần thêm vào AF_FORMS không.

---

## Đang ở đâu (10/09/2026, chiều)

```
origin/main = main = 94a567a (r162) — trước đó r161 (508a3ed), r160 (08c4bbb)   ← ĐÃ PUSH 10/09, ĐANG CHẠY THẬT
hold/r153-kpi7 = c744589 (r153)  ← bản ghi, KHÔNG dùng nữa
```

Lùi từng rev: `git revert 94a567a` / `git revert 508a3ed` / `git revert 08c4bbb`.

### r162 — KPI QC: bỏ chart trùng với bảng, Ratio TOTAL thành headline to (10/09/2026)

Eric nhìn bản live r161 và nói chart với bảng *"gần như giống nhau, chỉ khác cách trình bày"*, và
muốn *"con số Ratio hiển thị to ra"*. Chart chỉ vẽ lại 15 dòng đầu của bảng; ECAR ≈ 0 từ 07/2026 nên
cột đỏ luôn trống. Bỏ canvas + legend + `new Chart`; thêm headline `#ataCmp-val` (30px) + `#ataCmp-frac`
ở góc phải `.chart-head`, đặt từ chính `cell(totNum,totDen)` nên luôn khớp dòng TOTAL. PDF in dòng
*Ratio TOTAL* thay ảnh chart. **Không đổi cách đếm.** Muốn chart lại: `git revert 94a567a`.

✅ **Đã kiểm trên bản live 10/09 (Claude in Chrome, admin):** không còn canvas; headline `∞` màu xanh dương, dòng
dưới `Internal 44 ÷ ECAR 0 · Over-detect · 2026-08 ÷ 2026-09`, khớp dòng TOTAL của bảng; không toast lỗi.

⚠️ **Lượt nạp panel KPI QC trên live lần này mất ~2 phút** (QCS xong ~45s, ECAR ~80s, CMR ~120s) — đúng
bệnh `report_field` treo ngẫu nhiên (xem "Còn tồn" §r161). **Đã đo thử phương án `report_id in (…)` theo
lô 170 UUID cho 2.561 CMR: 16 lô, 4 lô treo 20–69s, tổng 73s** → cũng không thoát. Galileo treo theo
request, không theo hình dạng query. Hướng còn lại: **timeout riêng ~20s cho query `report_field`** (bình
thường 2–5s) rồi rơi về fallback ghép theo index — chờ Eric quyết vì đổi hành vi nạp.

### r160 — KPI QC: tử số đổi QC Spot Check Report → QC PI Report (10/09/2026)

Eric chốt: *Ratio QC = (CMR-CAR gán cờ QC + QC PI report N−1) ÷ (ECAR N) — số thập phân*.
Probe Galileo: form `QC Spot Check Report` dừng ở SCR-0025 (06/08/2026); form `QC PI Report` từ
QCPI-0001 (31/07/2026), cùng bộ field finding, mỗi report một finding. **8 finding QCS tháng 7 đã
được nhập lại thành QCPI-0002…0009** (raised 04/08) ⇒ không cộng cả hai form. Chi tiết
`PROJECT_TECH_SPEC.md` §6.4c + §14 hàng r160.

Sub của panel nay in **số report nguồn từng vế** (`Nguồn: CMR-CAR QC 7 · QC PI 10 · ECAR 0 report
(0 có ATA)`) — vì **ECAR (TQA) raised 09/2026 = 0, 08 = 1, 07 = 1**; form gần như ngừng dùng từ
07/2026, `AMO ECAR` cũng dừng từ 02/07. Panel tháng 09 toàn ∞/Over-detect là đúng data, không phải
lỗi. ❓ **Hỏi TQA/anh Sơn:** CAAV phát hành ECAR theo kênh nào từ 07/2026? Nếu ECAR không quay lại,
KPI này không còn mẫu số — cần Eric quyết đổi mẫu số hay đóng KPI.

### r161 — CMR-CAR & ECAR lấy custom field theo form; ECAR modal hiện ATA (10/09/2026)

Eric nói *"form VJC-ECAR chưa lấy ATA Chapter để tạo bộ lọc như CMR-CAR"*. Đo bằng harness chạy
chính `loadEcar`/`loadCmr` trích từ `index.html`: **ngược lại** — ECAR vốn lấy được ATA (168/864
report, bộ lọc `#ecarAtaF` có 50 giá trị), còn **CMR-CAR mới hỏng**: query custom field quét toàn
hệ thống 15 field ≈ 122.560 dòng → proxy **504 sau đúng 90s** (3 lần liên tiếp), `catch` nuốt ⇒ trang
CMR-CAR mất ATA / finding / target date mà không báo gì. Sửa: view `form_section_field` **có cột
`report_title`** ⇒ lọc `report_title eq 'CMR CAR' and (…)` (66.165 dòng, 3,3s) và tương tự cho ECAR
(7.828 dòng). Hai `catch` nay `toast`. Invariant **I13** trong `CLAUDE.md`.

⚠️ **Còn tồn (chưa xử):** view `dwanalytics_report_field` (ghép finding theo `section_id`) **không có
`report_title`**, vẫn quét theo `field_name`, và **treo ngẫu nhiên tới 504 ở 90s** (đo 10/09: 1/7
lượt, kể cả query ECAR nhỏ hơn; tách 2+2 field không giúp). Có `.catch → []` + fallback ghép theo index
nên không mất dữ liệu, nhưng lượt mở trang CMR-CAR/ECAR/KPI có thể **chờ 90s + 2 retry**. Hướng: hạ
timeout riêng cho query này, hoặc lọc `report_raised_date`, hoặc `report_id in (…)` theo lô (r154 đo
được 171 UUID/request).

✅ **ĐÃ KIỂM BẢN LIVE 10/09 (chiều, tài khoản admin của Eric, đo bằng Claude in Chrome):**
**(1)** KPI Charts → panel *KPI QC*: tiêu đề *QC PI Report*; sub `Nguồn: CMR-CAR QC 7 · QC PI 10 · ECAR 0
report (0 có ATA)` cho 2026·09, TOTAL Internal 08/2026 = **44** finding có ATA (35 CMR + 9 QC PI, khớp
probe); chọn tháng 8: `ECAR 1 report (1 có ATA)`, TOTAL 23 ÷ 1, dòng *32 – Landing Gear* 0 ÷ 1 ❌ Missed.
**(2)** CMR-CAR: 2.561 records, bộ lọc ATA **105 mục**, 2.557 report có ATA, 2.560 có Target date, Aircraft
`Unknown` chỉ 3 (trước r161 rơi về parse từ title). **(3)** ECAR: 864 records, bộ lọc ATA 51 mục; modal
VJC-ECAR-864 có dòng *ATA CHAPTER 32-21-00*. **(4)** Không có toast lỗi nào (đã hook `toast()` suốt lượt
nạp). Lượt nạp 3 loader trên live mất **>25s và <85s** (CMR xong trước 25s; ECAR + QCS xong sau) — khớp
với việc `report_field` đôi lúc treo, xem "Còn tồn" trên.

✅ Note vault `QA_AMO_Dashboard.md` đã lên r161 (Eric chốt sửa ngay 10/09); `check-doc-sync.sh` xanh trở lại.

### r159 — nút ✦ AI Assistant rời góc phải-dưới lên topbar (10/09/2026)

Eric báo: *"nút chức năng che khuất mất 1 góc khiến các thao tác chọn trang bị vướng"*.

**Đây là chuyện bố cục, không phải chuyện cái nút.** `.main{height:100vh;overflow:hidden}` ghim
`.tbl-foot` ở đáy khung nhìn, `justify-content:space-between` đẩy cụm `.pg-btns` dính mép phải
⇒ góc phải-dưới **không bao giờ trống**, ở cả 9 bảng. Nút tròn 52px `#aiFab` đặt ở
`right:22px;bottom:22px` đè vĩnh viễn lên nút `›` và vài số trang cuối (đo 1366×768: chân bảng
y 721–755, phân trang hết x 1337, nút phủ x 1292–1344 / y 694–746).

Đã bỏ `#aiFab`, thêm `#aiTopBtn` (`.icon-btn`) vào `.topbar-right`; `#aiPanel` neo **từ trên**
(`top:80px;bottom:22px`) để mở bảng chat vẫn bấm được phân trang. Sửa kèm: thêm một nút làm
`.topbar-right` tràn 18px khỏi màn 375px ⇒ thu `.icon-btn` 36→32px + gap 5px trong media ≤767px.

⛔ **CHƯA AI MỞ BẢN LIVE NHÌN BẰNG MẮT** — mọi phép đo làm trên bản serve nội bộ với bảng **rỗng**.
Mở `https://vjc-qa-amo.com/` kiểm ba thứ: nút ✦ có trên topbar và bấm ra bảng chat · thanh phân
trang bấm được cả nút `›` · mở bảng chat mà phân trang vẫn bấm được. Lùi: `git revert 6ec9709`.

⚠️ Đừng dựng lại nút nổi ở góc phải-dưới. Cần chỗ nổi thì dùng topbar hoặc neo từ trên xuống.
Ghi chú lý do nằm ngay trong CSS `#aiTopBtn` của `index.html`.

⚠️ Nút chuông "Notifications" trên topbar KHÔNG có `onclick` — thẻ chết, nhưng vẫn chiếm 42px
của hàng nút vốn đã chật trên mobile. Chưa đụng vì ngoài phạm vi.

---

## Trước đó — r155 (08/09/2026)

**r155 — KPI 7 đổi sang lượt Verification Result.** Eric chốt 08/09/2026 sau biên bản họp
07/09 (anh Phan Anh Đức gửi các Trưởng ban QC/Safety/S&C). Chi tiết đầy đủ ở
`PROJECT_TECH_SPEC.md` §14 hàng `r155`. Ba quyết định đã chốt — đừng đảo lại nếu không có
lệnh mới:

1. **KPI 7 = số hồ sơ có ≥1 lượt `Verification Result` ÷ tổng PAVOI còn hiệu lực.**
   Bất kể sớm muộn, áp chung Open lẫn Closed. Đây là **Phương án B** của email 03/09.
2. **Mốc 30 ngày KHÔNG nằm trong công thức** — chỉ là đèn cảnh báo trên trang PAVOI Detail
   (cột `Verified (30d)`). Đưa vào tử số thì hồ sơ xác minh muộn rơi khỏi KPI **vĩnh viễn**,
   các ban bổ sung cũng không cứu được. Lý do đầy đủ nằm trong comment của `kpi7Rate()`.
3. **Cờ overdue so với `Target date` của REPORT**, không phải của Workflow — 12/39 PAVOI
   Open có hai bên lệch nhau, có ca lệch 111 ngày.

**r153 không lên sản xuất.** Nó được cherry-pick lại chỉ để lấy khung (phân hoạch
`assessed/notAssessed/pending`, self-check, modal drill-down), rồi đổi nguồn dữ liệu sang
`dwanalytics_report_field`. Commit r153 gốc vẫn ở `hold/r153-kpi7` làm bản ghi.

### ⚠️ PHÉP THỬ THẬT LÀ LẦN MỞ TRANG ĐẦU TIÊN

r155 **chưa từng được dựng với dữ liệu thật** — proxy Galileo chỉ nhận origin
`vjc-qa-amo.com` nên bản local không gọi được dữ liệu (vết r142-i1). Mở trang lần đầu thì
kiểm bốn thứ:

1. Trang KPI dựng được bảng, `KPI %` **không phải** `—`;
2. Cột `No verification` có số, bấm vào mở đúng danh sách;
3. Trang PAVOI Detail có cột **`Verified (30d)`**, và **PAVOI-381 hiện `13/03/2026` màu
   vàng** (phát hành 22/01, xác minh sau 50 ngày — vẫn vào tử số, chỉ bị tô vàng);
4. Không report nào kẹt ở `…` sau khi nạp xong.

### Số thật, đo bằng harness trên bản live 08/09/2026

```bash
node scripts/test-r155-kpi7.mjs      # trích thẳng hàm từ index.html, chạy trên Galileo live
```

Harness **không viết lại logic** — nó trích `kpi7Withdrawn` / `kpi7Stats` / `kpi7Rate` /
`pavoiVerCell` / `loadKpi7Tasks` thẳng từ `index.html` rồi dựng `allData` đúng như
`loadData()` (cây org unit, dedup `modified_date`, `wf_stages`, `owner_name`, `Target_date`).
**16/16 assert PASS** trên 246 PAVOI.

| | Số |
|---|---|
| **KPI 7 năm 2026** | **76,8%** — 43 đã đánh giá / 56 hồ sơ (loại 7 withdrawn khỏi 63) |
| **KPI 7 toàn lịch sử** | **69,5%** — 162 / 233 |
| Cờ trên PAVOI Detail (246 hồ sơ) | **65 xanh · 104 vàng · 76 đỏ · 1 xám** |
| `loadKpi7Tasks()` | **1 request**, phân loại đủ 246/246, `pending = 0` |

⚠️ **Email 03/09 ghi 72,7% (40/55) và 8 hồ sơ withdrawn — dữ liệu đã thay đổi từ đó.**
Đừng trích lại số cũ; chạy lại harness khi cần số mới.

⚠️ **Đa số hồ sơ lịch sử là vàng/đỏ** (180/246). Đúng theo luật 30 ngày, không phải lỗi —
nhưng ai mở trang lần đầu sẽ thấy một biển màu, nên biết trước.

⚠️ **Bài học từ chính harness này:** lần chạy đầu để `Target_date = null` nên **nhánh đỏ ra 0 ca
mà vẫn PASS**. Assert "không có lỗi" không chứng minh nhánh đó đã chạy — phải assert **số ca > 0**
cho mỗi nhánh.

### Lùi lại nếu r155 hỏng trên sản xuất

```bash
git revert e586ad8 && git push      # cách an toàn, giữ nguyên lịch sử
```

Cache `qaAmoKpi7V3` tự chết khi `APP_REV` đổi, không cần dọn tay.

### Còn dở

- **Chưa làm — nội dung 2 của biên bản:** *số lượng đánh giá REPORT phải khớp WORKFLOW*
  (bám MOPM 4.15.5 c)4)). Phép kiểm này chưa có ở đâu trong app. Rev riêng.
- **Chưa làm:** gán KPI 7 theo tháng — tổng theo *raise date*, đã đánh giá theo tháng của
  *ngày xác minh*; tử/mẫu lệch rổ tháng ⇒ có tháng vượt 100%, phải cảnh báo trên UI.
- **Chưa gửi thư cho anh Đức** — bản nháp ở workspace
  `mail/Email-Hoi-lai-anh-Duc-ve-bien-ban-PAVOI-2026-09-08.md`. Ba câu trong thư Eric đã tự
  trả lời hết, nên thư chỉ còn giá trị lấy **xác nhận bằng văn bản** (nhất là mục 2: điều
  MOPM mà biên bản dẫn không nói tới mốc 30 ngày).

### Lùi lại nếu r154 hỏng trên sản xuất

```bash
git revert 498e4d1 && git push      # cách an toàn, giữ nguyên lịch sử
```

Nhánh `fix/r154-report-status` trên GitHub nay đã nằm trọn trong `main` — xoá được.

---

## r154 — Report Status on Coruson: đếm ô theo `field_id`, bỏ cột Fill Information

### Vì sao

Eric báo trang `Report Status on Coruson — EIS & F-088` đếm thiếu:

| Report | Thực tế trên form | Bảng r153 báo |
|---|---|---|
| MQA-RP-071-2026 | 4 ô `Verification of implementation (VOI)` trống + 4 ô `Date completed` trống + 1 `Target date` trống | `2 missing` |
| MQA-RP-066-2026 | 2 ô VOI trống + 1 `Date completed` trống | `1 missing` |

Gốc lỗi là đúng một dòng có từ r131:

```js
m[n] = m[n] || !!v;      // n = field_name
```

Form F-088 có repeater `CORRECTIVE ACTIONS` — **mỗi hành động khắc phục sinh một bộ ô
mới mang y nguyên tên cũ**. Gom theo tên là gộp 4 ô thành 1, và phép `||` còn coi cả
nhóm là đã điền khi chỉ **một** ô có giá trị.

### Đã sửa gì

- Gom theo **`field_id`** thay vì `field_name`. Đúng cả hai chiều: repeater sinh nhiều
  `field_id` khác nhau, còn checklist nhiều lựa chọn sinh nhiều row **cùng** `field_id`
  (khác `value_id`) nên vẫn tính là một ô.
- **Đổi nguồn cột E** từ `dwanalytics_report_form_section_field` sang
  **`dwanalytics_report_field`**, filter `report_id in (…)`, chunk 120 id/request.
- Nhờ `section_name` của view mới, gate ô `Other (explain here)` đổi từ *"TYPE OF EVENT
  có chọn Other"* (gate chung) sang **"có checklist CÙNG SECTION chọn Other"** → gỡ được
  giới hạn ghi trong code từ 18/08 (`Consequence = Other` mà bỏ trống giải thích nay bắt được).
- Bỏ cột `Report Section / Fill Information` khỏi bảng (Eric yêu cầu — nó lặp lại đúng thứ
  cột `Completion on Coruson` đã nói). **Luật chấm E không đổi**: vẫn là 1 trong 3 điều kiện
  của `rsDone()`, vẫn trong dòng tổng kết, **vẫn xuất ra Excel** (file Excel phải giữ bố cục
  cột D..J của bản làm tay).
- Tên trùng gộp lại khi hiển thị: `VOI ×4` thay vì in bốn lần (`rsMissNames`).

### ⚠️ Đính chính một luật đã ghi SAI trong repo

`TECHNICAL_REFERENCE.md` rule 2 nói `dwanalytics_report_field` trả **HTTP 400** khi filter
`report_id`. **Sai.** Đo qua proxy 04/09/2026: `report_id eq <uuid>` → 200, và
`report_id in (<171 UUID>)` → **200, 4.976 row, 2,5s, không phân trang**.

Invariant I1 (*không filter `report_id`*) chỉ đúng cho view EAV
`dwanalytics_report_form_section_field` (trả **RỖNG**, không báo lỗi). Vì câu sai đó nằm
trong doc như một luật, `section_name` của view kia đã nằm ngoài tầm với suốt nhiều rev.

Hai view khớp nhau **row-for-row** theo `report_field_key` trên các report đã đối chiếu.

### Kiểm chứng

- `node --check` PASS 5/5 khối JS inline — chạy lại **trên chính bản build của nhánh này**,
  không phải chỉ trên bản ở `main`.
- Harness node chạy **chính khối `loadRptStatus` / `rsGaps` cắt ra từ `index.html`**, với
  `fetchAll` thay bằng dữ liệu live tải cùng ngày (4.976 row field · 406 task · 567 link ·
  250 attachment · 512 report key). 7 report trong ảnh Eric gửi ra đúng:
  RP-072 `3/16 · 13` · RP-071 `32/41 · 9` (Date completed ×4, Target date, VOI ×4) ·
  RP-070 `39/41 · 2` · RP-069 `34/35 · 1` · RP-068 `51/52 · 1` · RP-067 `29/29 Satis` ·
  RP-066 `28/32 · 4` (Date completed, Other (explain here), VOI ×2). Không report nào `nreq=0`.
  Kết quả **giống hệt** khi chạy trên bản r153-base ở `main` → việc rebase xuống r152 không
  đổi hành vi.
- Một bản cài lại độc lập bằng Python khớp report-for-report trên cả 127 report F-088.
- `sh scripts/check-doc-sync.sh` exit 0.
- **CHƯA kiểm được:** giao diện dựng thật — proxy chỉ nhận origin `vjc-qa-amo.com` nên bản
  local không gọi được dữ liệu (đúng bẫy r142-i1).

### Việc còn dở

1. **Số liệu sẽ đổi rõ trên mặt báo cáo** — nói trước khi phát hành:
   RP-071 `19/21 · 2` → `32/41 · 9`; RP-066 `22/23 · 1` → `28/32 · 4`;
   RP-068 và RP-069 từ **Satis → Unsatis** (lộ ô thật sự còn trống, không phải hồi quy);
   RP-070 `3 missing` → `2` (gate theo section bỏ được một cảnh báo oan).
   Mẫu số nhảy (21 → 41) là đúng: report có 4 corrective action thì thật sự có thêm ~20 ô.
2. **r153 vẫn nằm local trên `main`, chưa duyệt, chưa push.** Xem
   `mail/Email-Chot-diem-tham-chieu-danh-gia-PAVOI-2026-09-03.md` (đã soạn, chưa gửi).
   §14 của `PROJECT_TECH_SPEC.md` trên nhánh này **không có hàng r153** — đúng, vì r153
   không có trong lịch sử nhánh; hàng đó quay lại khi r153 được merge.
3. **Chưa làm, nhưng cùng dữ liệu là sửa được:** EIS 012/013/014/015/018 vẫn trống cột
   `Report Title` vì hai row `Detailed Description` không phân biệt được.
   `dwanalytics_report_field.section_name` nay phân biệt được (`DESCRIPTION OF THE EVENT`
   vs `ANALYSIS`) → `RS_SUBJ_RANK` có thể làm section-aware ở một rev sau.
4. **Nhánh `ui/restructure` không còn tồn tại** (checkout 14:51, bỏ lại 14:58 ngày 04/09,
   không commit gì, rồi bị xoá). Ghi chú cũ bảo "làm trên nhánh `ui/restructure`" đã lỗi thời.
