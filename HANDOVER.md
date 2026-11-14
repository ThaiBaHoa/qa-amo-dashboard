# HANDOVER — `main`

> Trạng thái tức thời cấp vault ở `obsidian-mind\.claude-memory\DANG-LAM.md`;
> lịch sử rev đầy đủ ở `PROJECT_TECH_SPEC.md` §14.

---

## ✅ r228 — Safety › HIRA sửa theo `page safety revise.docx` (14/11/2026, EricThai) — commit + push 14/11 theo lệnh Eric

- **Yêu cầu:** file Word của Eric trong workspace (`MQA dashboard website/page safety revise.docx`), 7 điểm bảng ngoài + 4 điểm popup.
- **Đã làm:** tab `HIRA register` → **HIRA**. Effectiveness rating = **Category của report** (`dwreporting_report_summary.category_title`, `loadHiraCls` → `.effect` + `.catId`, lỗi ở `hiraCatErr`); bỏ `EFFECTIVENESS RATING` khỏi `HIRA_CLS`. Bỏ Hazard source (bảng ngoài, popup, file xuất). Status một ô cho mỗi HIRA = trạng thái report. Ô thống kê: HIRA (closed · open), Hazards (specific components), mỗi Category một ô (`M.hiraByCategory`, nhóm theo `category_id`). Popup bỏ Raised date, Date completed. Trang chi tiết report HIRA có bảng **RFI and tasks of the workflow** (`wfTasks`/`wfTasksBlock` ở `screens2.js`, `dwreporting_report_task` theo `report_id`).
- **Eric bổ sung cùng ngày (đã làm):** ma trận rủi ro bỏ số đầu dòng Probability (dễ nhầm với số lượng); thêm ô **NOT EFFECTIVE** luôn hiện kể cả 0 (đếm Category NOT YET EFFECTIVE hoặc INEFFECTIVE, cả hai có trong danh mục gốc `dwanalytics_report_category`, chưa HIRA nào dùng); cột **Additional mitigation? gộp một ô cho mỗi HIRA**; **ô thống kê là bộ lọc** của bảng register (`BS.hiraF`, `M.hiraFilter`): ô HIRA → các HIRA đang open, ô Category → HIRA của Category đó, bấm lại hoặc **Show all** để bỏ lọc. Ma trận và file xuất không theo bộ lọc ô này.
- **Tự chốt, chờ Eric xem:** (1) Category trên Coruson hiện là FULLY EFFECTIVE / MVOI 3MT / MVOI 6MT, không còn PARTIAL / NOT YET; ô Effectiveness hiện đúng chữ Category, chỉ FULLY EFFECTIVE có màu. (2) "3 phần còn lại đếm theo Category" hiểu là 3 ô Intolerable / Tolerable / Compliance checks nhường chỗ cho các ô Category; Compliance checks thành nút trên thẻ register, không mất. (3) "Hazard = specific component": số đếm giữ luật HOW MANY (r221-i3), chỉ đổi chú thích.
- **Kiểm local dữ liệu thật 14/11** (preview `beta-local`, Eric đăng nhập): 2025+2026 = 24 HIRA (24 closed, 0 open), 39 hazards, FULLY EFFECTIVE 18 · MVOI 3MT 3 · MVOI 6MT 3, khớp đếm tay trên phản hồi Galileo (24 dòng). HIRA-01: 8 RFI, owner / section / ngày khớp ảnh Coruson trong file yêu cầu. Bấm ô MVOI 3MT (2026): bảng còn HIRA-23, HIRA-25 (2 of 5); ô HIRA: 0 open → bảng trống; Show all trả lại 5. Không có dòng `Consistency` nào trên console. Build `lint metrics-only: OK`, `BODY + UI SYNTAX OK`.
- **Chưa làm:** sổ tay rời (`manual.js`) và ảnh chụp còn tên tab cũ, 10 cột cũ; chưa kiểm điện thoại, chế độ tối, file xuất Excel/PDF sau khi bỏ Hazard source; bản classic chỉ kiểm cú pháp qua build.

## ✅ r227-i1 — HTTP 408 từ Galileo được thử lại (13/11/2026, EricThai)

- **Yêu cầu:** Eric báo trang SPI và nhiều trang khác hay lỗi 408.
- **Đo trên live** (ghi mọi request qua proxy, đi qua 14 trang): 2/24 request trả 408 sau 2,4 s, thân `Timeout performing EVAL, inst: 1, queue: 4…` = lỗi hết giờ Redis phía Galileo, ngẫu nhiên; lần đo trúng trang MOSR (`dwanalytics_report_classification_field`), SPI lần đó tải được.
- **Đã làm:** thêm `HTTP 408` vào `RETRIABLE_RE` trong `classic.html` (trước chỉ timeout / 5xx / 429 / lỗi mạng).
- **Kiểm:** harness Node trích `fetchWithRetry` từ `classic.html`. Kiểm live r227-i1 (13/11, đi qua 13 trang, 81 request): 3 request bị 408 (report_field ×1, report_classification_field ×2), cả 3 được thử lại, 0 trang báo lỗi.
- **Còn:** nếu 408 đến theo đợt dài hơn 7 s (2 lần thử lại) thì trang vẫn báo lỗi; khi đó báo Ideagen. `loadSPI` vẫn lọc bảng custom field theo `report_id` (trái I1) — chưa đo, chưa sửa. Các `gFetch` trực tiếp (Query Builder, công cụ probe ở classic) không có thử lại.

## ✅ r227 — Màn LED tự làm mới dữ liệu mỗi giờ (13/11/2026, EricThai)

- **Yêu cầu:** Eric thấy trang trình chiếu trên màn LED hình như không tự refresh data.
- **Nguyên nhân tìm được trong code:** chỉ refresh 12 giờ một lần + reload khi sang ngày; ở `body.kiosk` nhãn "refresh failed" và nút ↻ bị ẩn nên lượt refresh hỏng cũng không ai thấy. **Chưa xác nhận trên máy LED** là chạy đúng chu kỳ hay refresh lỗi.
- **Đã làm** (vault `beta-src/screens2.js`): `AUTO_REFRESH` 12 giờ / LED 1 giờ, lượt hỏng thử lại sau 15 phút; thanh trên cùng của màn LED ghi `Data as of HH:MM · DD/MM` và `· last refresh failed`. `guide.js`, `manual.js` (VERSION r227, chưa build docx).
- **Kiểm:** build `BODY + UI SYNTAX OK`; logic trích từ `index.html` chạy với đồng hồ giả đúng cả 4 trường hợp. **Chưa kiểm dữ liệu thật / máy LED thật** — preview local bị galileo-proxy trả 401 (cần đăng nhập thật).
- **Còn:** tải lại tab trên máy LED để nhận r227, rồi xem dòng `Data as of`: nếu hiện `last refresh failed` thì đọc console (`[beta] refresh failed: …`) để biết nguồn nào hỏng.

## ✅ r226 — Cảnh báo audit MNT bị đổi lịch (11/11/2026, EricThai)

- **Yêu cầu:** MNT-1045 được dời từ tháng 10 sang tháng 11 trên Coruson nên thoát khỏi Delayed; cần cảnh báo cho MNT bị reschedule. Cảnh báo riêng cho RSP / SSP quá tháng: Eric nói KHÔNG cần.
- **Nguồn:** `dwreporting_audit_summary.has_been_rescheduled`, `reschedule_reason`. Galileo không giữ ngày gốc.
- **Đã làm:** ô Rescheduled + danh sách, viền vàng trên Timeline, nhãn trong Schedule list; guide.js, manual.js (VERSION r226, chưa build docx).
- **Kiểm preview dữ liệu thật 2026:** Rescheduled 14, chưa thực hiện 1 (MNT-1045), cả 14 không có reschedule reason; Delayed 4 → 3 (MNT-1048, 1064, 1065); 14 chấm có viền; không lỗi console.
- **Hạn chế / ý tiếp:** muốn hiện "dời từ tháng nào" thì dashboard phải tự lưu tháng kế hoạch lần đầu thấy (bảng Supabase), hoặc người đổi lịch ghi Reschedule reason trên Coruson. Dòng History trên Coruson ("original date … new date …") KHÔNG có trong Galileo (đã dò 123 bảng; `dwanalytics_audit` chỉ có dòng hiện hành, `is_current eq false` rỗng). Hai hướng: (1) dashboard tự lưu tháng lần đầu thấy; (2) đọc tab History trên Coruson qua Edge cho các audit có cờ. **Eric 11/11: để tính sau.**

## ✅ r225 — Audit Plan tách Scheduled (MNT) / Unscheduled (RSP + SSP) (11/11/2026, EricThai)

- **Yêu cầu (Eric 11/11):** RSP và SSP là hai chương trình không nằm trong schedule mà phát sinh; MNT = schedule, RSP + SSP = un-schedule.
- **Đã làm:** `M.auditProg` theo tiền tố số audit; `M.auditProgress` chỉ tính Scheduled (Overview *Audits completed vs plan*, *Delayed*); Audit Plan có ô Scheduled / Unscheduled, hai lưới Timeline, bộ lọc và cột Programme; guide.js, manual.js (VERSION r225, chưa build docx).
- **Kiểm trên dữ liệu thật 2026 (preview, 11/11):** 255 audit = Scheduled 236 (chỉ tiền tố MNT: Inspection 179, Audit 48, Other 9) + Unscheduled 19 (RSP 17, SSP 2). Delayed 9 → 4 (MNT-1045, 1048, 1064, 1065); 5 audit không còn tính Delayed: RSP-0010, 0011, 0014, 0017, SSP-0001. Completed vs plan 199 / 221. Không lỗi console.
- **Chưa làm:** Workflow stages vẫn gộp cả hai; classic UI không đổi.

## ✅ r224-i2 — Sửa Reports › All forms không hiển thị (11/11/2026, EricThai)

- **Triệu chứng (Eric):** bấm Reports thì thanh trên và menu đổi sang Reports nhưng nội dung vẫn là Work Queue; tưởng là load chậm.
- **Nguyên nhân:** `scrAllForms(forced)` trong `beta-src/screens.js` có `const form = forced || form` (thay hàng loạt `BS.afForm` → `form` ở r224 ăn luôn dòng khai báo) → `ReferenceError`, `render()` dừng trước khi ghi `#screen`. Safety › Additional mitigation không lỗi vì có `forced`.
- **Sửa:** `forced || BS.afForm`; `render()` bắt lỗi dựng màn hình và hiện "This page could not be displayed" thay vì giữ trang cũ.
- **Bài học:** kiểm r224 đã đi 11 route nhưng chỉ đo tràn ngang, không kiểm nội dung trang đổi theo. Sau mỗi lần build, đi hết các route và so `h1` + số phần tử, bắt `window.onerror`.

## ✅ r224-i1 — User guide và sổ tay theo r224 (11/11/2026, EricThai)
- Chỉ sửa chữ ở `beta-src/guide.js` (Library › User guide) và `beta-src/manual.js`. Không đổi logic, không đổi số liệu.
- Manual rời: `HuongDan_SuDung_QA_AMO_Dashboard_r224.docx` (workspace `MQA dashboard website/`), 34 trang; mục **4.5 Safety** mới, Audit Plan / Library / Admin lùi thành 4.6–4.8.
- **Còn mở:** ảnh trong `manual-shots-r220/` chưa chụp lại (thanh điều hướng cũ chưa có mục Safety; chưa có hình HIRA register, Compliance checks). `callouts.json` mới đổi tiêu đề 3 hình sang Safety › …

## 🟡 r224 — Trang Safety, HIRA register theo VJC-MQA-F-118 (09/11/2026, EricThai) — đã commit + push 11/11/2026 theo lệnh Eric
- Eric: gom report Safety về 1 trang; HIRA bảng ngoài + popup chi tiết theo file Excel F-118; màu theo AMO SMS Risk Rating.
- Mục điều hướng mới **Safety**: HIRA register (mới), Additional mitigation (`scrAllForms(CAPA_TITLE)`, vẫn có ở Reports › All forms), OSR/MOSR status (từ Analytics), MOSR register (từ Reports › MOSR), MOSR charts, SPI (từ Analytics). Route cũ tự chuyển (`MOVED_ROUTES`); KIOSK_STEPS và User guide theo đường dẫn mới.
- Bảng ngoài = sheet "Trang ngoài" đúng như Eric thấy (cột ẩn trong Excel chỉ ở popup): NO. · HIRA NUMBER · GENERIC HAZARD (gộp ô theo HIRA) · SPECIFIC COMPONENTS (+ HAZARD SOURCE in nghiêng đậm trong ngoặc) · INITIAL RISK · PREVENTIVE CONTROL/RECOVERY MEASURES · CURRENT RISK · EFFECTIVENESS · ADDITIONAL MITIGATION? · STATUS. Ô rating/effectiveness tô kín. Bảng không phân trang, không sort để giữ nhóm.
- Màu một chỗ trong METRICS: `M.RISK` (§9.4.3 #F65616/#FFA725/#46C284, chữ #1a1a1a) và `M.EFFECT` (F-118: INEFFECTIVE/NOT YET đỏ #FF0000, PARTIAL vàng #FFFF00, FULLY xanh #00B050, chữ đen). Fill giữ nguyên ở chế độ tối.
- Popup = sheet "Trang trong" (Eric 09/11): 1 bảng lưới cho HIRA được bấm, 1 dòng/mối nguy, 20 cột đúng thứ tự Excel; NO./HIRA NUMBER/GENERIC HAZARD gộp ô; HIRA METHOD, HAZARD TYPE, ADDITIONAL MITIGATION?, Report Summary gộp ô (cấp report trên Coruson, có chú thích). SEVERITY hiện chữ cái, LIKELIHOOD hiện số (`M.sevCode`/`M.probCode` từ `M.RISK`, chữ đầy đủ ở tooltip). RESPONSIBLE DEPARTMENT đánh số khớp action. Ngày theo định dạng chuẩn dashboard (`fdx`, vd 30 Mar 2026), không dùng 30.Mar.26. Dải trên bảng: Status, Raised, Target, Date completed (action muộn nhất), Date verified, Verified by, VOI (`buildHiraReg` đọc section VERIFICATION). Popup rộng `min(96vw, 2000px)`, bảng cuộn ngang trong popup, tiêu đề dính.
- STATUS theo mối nguy: classic `h.sem` = `semCalc` cùng luật report (DATE VERIFIED chỉ tính khi report Closed) trên DUE DATE của mối nguy. Excel → dashboard: Closed on time = On-time Closed; Lately Closed = Lately Closed; Open/Overdue = Open hoặc Overdue; thiếu ngày = Closed (không chấm).
- Field (probe main session 09/11): section SPECIFIC COMPONENTS cho mọi ô mối nguy; INITIAL RISK = `INITIAL RISK RATING (ACCEPTABLE?)`; HAZARD SOURCE. Section PREVENTIVE ACTION (MITIGATION ACTION · RESPONSIBLE DEPARTMENT · DATE COMPLETED) KHÔNG có link tới mối nguy → `buildHiraActions`: mối nguy theo số thứ tự đầu SPECIFIC COMPONENTS (dự phòng: bản sao HIRA HEADER "SPECIFIC COMPONENTS N", rồi thời điểm tạo); action theo thời điểm tạo, tách nhóm ở mỗi action bắt đầu "1."; nhóm i → mối nguy i CHỈ KHI mọi action có số, action đầu là "1." và số nhóm = số mối nguy (1 mối nguy: nhận hết). Còn lại gộp ô cả HIRA, đánh dấu "Not linked to a hazard" kèm lý do. KHÔNG gán theo thời điểm tạo: lần kiểm dữ liệu thật đầu (09/11) luật thời gian dồn action vào mối nguy cuối vì section mối nguy đầu là section mẫu của form, `section_id` dùng chung giữa các report, tạo từ 27/12/2025. Kỳ vọng thật: byHazard HIRA-01, 07, 12, 13 (+ HIRA 1 mối nguy); merged 09, 14, 15, 17, 21, 22, 23; none 25. ADDITIONAL MITIGATION? là classification cấp report (Excel ghi theo từng dòng).
- `M.consistency` thêm: số mối nguy, ma trận, band, mọi preventive action hiện đúng 1 lần, status mối nguy có due muộn nhất = status report.
- Kiểm: build `lint metrics-only: OK`, `BODY + UI SYNTAX OK`; test offline `all checks passed` (25 ô band, effectiveness, field name thật, 12 ca HIRA thật 01…25 + thứ tự mối nguy theo số). Ảnh chụp: harness dữ liệu GIẢ (ví dụ HIRA-01 3 mối nguy của Excel), sáng/tối, ở scratchpad phiên. CHƯA kiểm trên dữ liệu thật — main session kiểm lại ở tab đã đăng nhập.
- MOSR hai màn lệch số (main session đo 09/11): OSR/MOSR status đếm MOSR do nhóm MSAG sở hữu, mọi thời gian, bỏ Confidential → 327 / 3 Open; MOSR register đếm mọi form MOSR → 546 / 17 Open. KHÔNG đổi phạm vi (r120-i1/r164/r168-i1), chỉ nói rõ và đối chiếu: một luật chung `isMsagGroup` + `safetyFormKind` (classic) cho `loadSafety` và `loadMosr` (`.msag`, giữ `owner_id`, thêm `form_name`, `is_archived`); `M.msagTotals`, `M.mosrSplit`. OSR/MOSR status: phụ đề "Reports owned by MSAG groups on Coruson · all time · Confidential excluded", nhãn "MOSR (MSAG-owned)", ẩn thanh Year×Month ở tab này. MOSR register: nhãn "MOSR (all owners)", dòng đối chiếu MOSR = MSAG-owned + chủ khác (cả Open), danh sách chủ khác mở rộng, theo bộ lọc kỳ. `M.consistency` thêm 2 dòng register MSAG-owned (mọi thời gian) = bảng status (kỳ vọng 327/327, 3/3).
- ❓ Chờ Eric: "AMO - Safety Section" (35 MOSR, 5 Open) có tính vào bảng MSAG không — chưa quyết, chưa đổi.
- Còn mở: số HIRA bị gộp ô action trên dữ liệu thật; `QA_AMO_Dashboard.md` (obsidian-mind) header vẫn r223 — hook pre-commit sẽ chặn; manual rời chưa dựng lại; chưa kiểm điện thoại.

## ✅ r223-i1 — User guide, manual, tài liệu theo r222 và r223 (05/11/2026, EricThai)

**Bổ sung 11/11/2026 (EricThai):**
- Tab `OSR/MOSR status` đổi tên thành **MSAG status** (cách đếm giữ nguyên). Nhóm Coruson `AMO - Safety Section` nay là `MQA - Safety Section`: `KPI7_SECTIONS`, `#pavoiSectF` dùng tên mới, `sectName()` nhận cả tên cũ.
- HIRA: Preventive action gắn mối nguy qua `parent_section_id` của `dwanalytics_report_field` (`buildHiraActions`, quy tắc đánh số chỉ còn là dự phòng). Effectiveness chỉ lấy Classification, một ô cho mỗi HIRA.
- `M.hiraChecks`: Initial risk lệch Severity × Likelihood (AMO SMS §9.4.3) và thiếu dữ liệu. Thẻ **Data checks** mở danh sách (`showHiraChecks`); dấu lệch chỉ hiện trong popup. Có dòng `M.consistency` riêng.
- Màu `M.RISK`: #FF0000 / #FF9900 / #00B050 (Eric chốt). Bảng `hx`, `rmx` cuộn trong thẻ ở màn hẹp.
- Trạng thái audit mới **ScheduleConfirmed**: trạng thái riêng (classic `AUDIT_STATUS`, `AUDIT_ACTIVE`; UI mới `M.AUDIT_PLANNED`, `k-confirmed`).
- Trigger theo AMO SMS (11/11, `M.SMS`, `M.hiraChecks`, `M.mosrOrcLate`): Tolerable quá 30 ngày từ Date assessed (§9.5 d), Intolerable còn action mở, Effectiveness sớm hơn kỳ theo dõi 3/6 tháng (§9.7), MOSR Open quá hạn theo ORC 30/7/1 ngày (§9.3.8.3), hành động bắt buộc theo mức SPI (§10.6). Thẻ HIRA đổi tên **Compliance checks**; thẻ MOSR **Past ORC time limit**. Eric chốt 11/11 (sửa lại nếu Ban Safety trả lời khác): "identified day" = Date assessed và mốc 30 ngày áp cho Initial risk; ORC Very low/Low 30 ngày, Medium 7, High/Very high 1, chưa có ORC báo sau 30 ngày; MOSR còn Open = chưa đánh giá xong.
- Xuất HIRA register (11/11): nút **Export Excel / Export PDF** trên thẻ HIRA register (admin, moderator), 20 cột như popup "Trang trong", theo bộ lọc đang chọn; `hiraExportModel` → `hiraExportXlsx` (xlsx-js-style, gộp ô theo HIRA, tô màu risk/effectiveness) và `hiraExportPdf` (jsPDF autotable, A3 ngang, font Roboto).
- Còn mở: L4, L6, L8, L9 (đã làm L1, L2, L3, L5, L7) trong `Vault-CongViec/02-Bao-Cao/2026-11-11_Ra-soat-trigger-Safety-vs-AMO-SMS-MOPM.md`; TECHNICAL_REFERENCE, guide.js, sổ tay chưa ghi các thay đổi 11/11; bản classic mới kiểm cú pháp.

- Chỉ sửa chữ ở `beta-src/guide.js`. Manual rời: `HuongDan_SuDung_QA_AMO_Dashboard_r223.docx` từ `beta-src/manual.js`; ảnh `manual-shots-r220/` chụp lại 11-exports, 11b-mcar-export, thêm 03c-capa. `TECHNICAL_REFERENCE.md` thêm `loadCapaDue`, `exportSrq`.
- Còn mở: bảng Additional Mitigation ở màn 1280 px phải cuộn ngang mới thấy Target và Days to due, chưa sửa. Chưa mở manual bằng Word để xem bố cục.

## ✅ r223 — Export SR / QCSC (05/11/2026, EricThai)
- Thẻ SR / QCSC report ở Admin › Export reports, 11 cột theo danh sách Eric, Excel và PDF letterhead. Eric bỏ attachment, picture sau khi biết Galileo chỉ có tên tệp và Coruson chặn tải chéo trang.
- Tự chốt, chờ Eric xác nhận: QCSC = `QC Spot Check Report`, chưa gộp QC PI Report và AISC; Issue date của SR lấy ô Date; MNT No = số audit, không có thì tìm MNT-xxxx trong ô tham chiếu.
- Kiểm local Edge dữ liệu 2026: 345 dòng (285 SR, 60 QCSC), PDF 62 trang. File chặn lại trong trình duyệt để đọc, chưa tải thật. Chưa kiểm quyền moderator. Manual rời chưa cập nhật.

## ✅ r222 — AMO - Additional Mitigation làm như HIRA (05/11/2026, EricThai)
- Eric chọn cả luật chấm lẫn bảng. Mỗi action là 1 section MITIGATION ACTION có Target date riêng, Target của report là ngày lớn nhất, chấm theo Date verified. Bỏ `scrCapa`; 4 ô thống kê giữ lại trên bảng.
- Kiểm local Edge dữ liệu thật 05/11: 8 report = 2 Overdue (07, 08), 3 On-time (01, 02, 04), 1 Lately (03), 2 Closed thiếu Target (05, 06); `consistency OK` năm 2026.
- ⚠ CAPA-05, CAPA-06 không có section action, nội dung ghi ở Additional details nên báo Missing target date. CAPA-07 còn Open có Date verified 14/10 nên vẫn Overdue; có 7 action, một dòng trùng nội dung. Chờ Eric xem trên Coruson.
- Chưa kiểm: điện thoại, chế độ tối.

## ✅ r221-i3 — HIRA chỉ tính mối nguy theo ô HOW MANY (04/11/2026, EricThai)
- Eric phát hiện HIRA-05 có due nhưng báo `1 hazard no due date`. Form khai 1 mối nguy; mục thứ 2 bị ẩn vẫn còn trong `dwanalytics_report_field`. Bảng không có cờ ẩn nên giữ các mục tạo sớm nhất theo HOW MANY.
- Chưa xử lý: HIRA-09 khai 4 có 3, HIRA-17 khai 3 có 2. Giữ nguyên, không báo đỏ, chờ Eric quyết.

## ✅ r221-i2 — hai câu trong User guide (04/11/2026, EricThai)
- Chỉ sửa chữ ở `beta-src/guide.js`. Câu Work Queue 'Select a row' đã đúng: bấm thử trên live mở được chi tiết. Manual rời dựng lại theo bản live: `HuongDan_SuDung_QA_AMO_Dashboard_r221.docx`, ảnh `manual-shots-r220/` chụp lại Overview và Export reports.

## ✅ r221-i1 — thanh lọc ở Export reports (04/11/2026, EricThai)
- Thanh lọc hiện ở riêng tab Export reports, User management và My dashboard vẫn không có. Weekly overdue và MCAR & Surveillance vẫn không theo bộ lọc.

## ✅ r221 — AMO - HIRA chấm theo DUE DATE và DATE VERIFIED (04/11/2026, EricThai)
- Eric chốt: mỗi Specific component là 1 mối nguy có DUE DATE riêng; Target = due lớn nhất; đúng hạn hay trễ so với DATE VERIFIED; thiếu dữ liệu báo đỏ, không suy từ nguồn khác.
- ⚠ Phần đầu code HIRA (`loadHiraHazards`, `hiraHazardMap`) lọt vào commit r220-i3 (409056d) vì hai phiên cùng sửa một repo; Eric chọn commit nối tiếp, không viết lại lịch sử.
- Kiểm local dữ liệu thật 04/11: 24 report = 17 On-time, 4 Lately (02, 06, 14, 15), 2 Closed thiếu ngày verify (18, 25), 1 Overdue (23). HIRA-05 có 1 mối nguy thiếu due. Dữ liệu HIRA đang được sửa trên Coruson nên số có thể đổi.
- Coruson có 48 bản ghi form này: 24 Closed có số đang hiện, HIRA-24 đã xóa, 14 đã xóa không số, 9 Draft không số; các bản không số bị bộ lọc `report_number` loại như mọi form.
- Days to due đổi cho mọi form. Chưa kiểm: điện thoại, chế độ tối. Còn tồn: `Cannot set properties of undefined (setting 'err')` trong `lazy` thỉnh thoảng hiện khi mở thẳng All forms lúc đang nạp, chưa rõ nguyên nhân.

## ✅ r220-i3 — đường xu hướng Overdue (04/11/2026, EricThai)
- Tháng chưa hết thì so target với hôm nay, không với cuối tháng. Điểm cuối 59 → 25 trên dữ liệu live, 11 tháng trước không đổi. Đường xu hướng vẫn tính mọi năm nên có thể khác số trên ô khi lọc một năm.

## ✅ r220-i2 — Glossary classic có MVOI (04/11/2026, EricThai)
- Eric yêu cầu làm luôn việc r200 để lại. Chỉ thêm một mục chữ trong `classic.html`, tên lấy từ tiêu đề form MVOI Rev 7 trên Coruson. Chọn -i2 vì không đổi tính năng.

## ✅ r220-i1 — User guide khớp r220 (04/11/2026, EricThai)
- Chỉ sửa chữ ở Library › User guide, nguồn vault `beta-src/guide.js`. Không đổi số liệu, tính năng, bố cục. Chọn -i1 vì không đổi tính năng, theo checklist `cap-nhat-revision`.
- Manual rời dựng lại: `HuongDan_SuDung_QA_AMO_Dashboard_r220.docx` từ `beta-src/manual.js`, ảnh `manual-shots-r220/`.
- Eric cần xem: mũi tên ô Overdue trên Overview hiện +30 khi Overdue là 18 (`seriesFor` tính điểm tháng hiện tại tới cuối tháng); Admin › Export reports ghi lấy kỳ từ filter bar nhưng màn này không có thanh lọc.

## ✅ r220 — MCCF mọi đơn vị trong All forms (03/11/2026, EricThai)
- Eric hỏi vì sao thiếu MCCF: 46/61 report ở đơn vị ngoài QA AMO bị `orgUnitFilter` loại. Eric chọn nạp thêm, chỉ MCCF.
- Kiểm local: 46 dòng, 2026 hiện 26; `allData` trước và sau đều 3676, Open 83, Overdue 24. Chưa bấm thử mở chi tiết report ngoài QA AMO, chưa chạy lại `M.consistency`.
- ⚠ Export Excel của All forms chưa gồm 46 report này. INTERNAL MOR, MOR, Confidential MOSR, Spot Check thiếu cùng nguyên nhân: danh sách cho các ban ở vault `02-Bao-Cao/Coruson/Danh-sach-form-theo-bo-phan-AOC-AMO-2026-11-03.xlsx`.

## ✅ r219 — màn LED (03/11/2026, EricThai)
- Eric: tỷ lệ chưa cân đối, trang không hiện đủ thông tin, search vô ích trên màn trình chiếu. Nguồn: vault `beta-src/screens2.js` (`kioskFit`), `screens.js` (`plainTable`), `beta-template.html` (CSS `body.kiosk`).
- Kiểm local cửa sổ 1912×867: đủ 6 trang; EIS hiện đủ 7 report; Timeline 0 bộ lọc; Esc thoát đúng; console sạch.
- Chưa kiểm: máy LED thật, chế độ tối. Trang dài làm vòng xoay dài hơn số giây đặt trong `?kiosk=`.

## ✅ r218 — MOSR charts trong Analytics (03/11/2026, EricThai)
- Eric yêu cầu đưa biểu đồ của file Excel vào, không kèm bảng, lọc theo tháng / quý / năm.
- ⚠ 2026: 193 MOSR = 88 trong Technical + 94 ngoài Technical + 11 chưa phân loại. Dòng chú thích trên tab ghi rõ.
- Kiểm local: Q4 = 35 report khớp đếm độc lập; màu giữ theo bộ phận khi đổi kỳ. Chỉ kiểm ở bản đủ r220.

## ✅ r217 — tab MOSR trong Reports (03/11/2026, EricThai)
- Eric gửi file `MOSR Database - Dashboard.xlsx`: thay tab OSR / MOSR bằng bảng theo file, bỏ 4 cột vàng. Eric chốt Occurrence Category chỉ lấy nhóm dưới Technical.
- ⚠ Chỉ form MOSR: probe 03/11 không report OSR nào có Classifications. Phân loại MOSR mới có từ 2026 (2025: 1/348).
- Kiểm local dữ liệu thật 2026: 193 report; 6/6 dòng Excel khớp Base, ORC, Hazard, Hazard type, Occurrence, Status; 0529 lệch Report Owner và Department vì Coruson khác file. Chỉ kiểm ở bản đủ r220, bản r217 riêng chỉ qua build.
- Report Summary trên 30.000 ký tự (thường nhúng ảnh) hiện —. Chưa đo thời gian nạp trên live.

## ✅ r216 — AI gửi phiên đăng nhập, Worker vào repo (02/11/2026, EricThai)
- Worker `galileo-ai` đang `AUTH_MODE: enforce`, chạy ở `aws:ap-northeast-1`. Chat thật của Eric chạy được ở soft; kiểm trên live: không phiên và phiên sai đều 401. Logic role thử offline 13/13.
- ⚠ Giữ `placement` trong `wrangler.jsonc`: từ VN Worker rơi vào colo HKG, Anthropic trả 403 `Request not allowed`. Lần deploy wrangler đầu đã làm chat hỏng tới khi thêm dòng này.
- Lùi: đặt lại `soft` trong `workers/galileo-ai/wrangler.jsonc` rồi deploy, hoặc phiên bản `226d55c0` trên Cloudflare.
- `galileo-proxy` đang `enforce` từ 03/11/2026 (`3ab84f2d`): không phiên hoặc phiên sai 401, không Origin 403. Trước khi bật: sáng 03/11 không có request thật nào thiếu phiên; log 7 ngày có 1.504 request không phiên, chủ yếu đoán là trang xem thử local, không xác nhận được vì log không lưu trình duyệt.
- ⚠ Từ đây trang xem thử local chỉ tải được dữ liệu khi dùng `&auth=1` và đăng nhập; `?relay` không đăng nhập sẽ bị 401. Trong log, trường `auth` bị Cloudflare che: lọc bằng `exists(why)`. Lùi: đặt lại `soft` rồi deploy.

## ✅ r215 — sidebar thu gọn (02/11/2026, EricThai)
- Kiểm local ở 975 và 1500 px, thu gọn và mở rộng: 72 và 248 px, không thanh cuộn ngang.

## ✅ r214 — khung chat AI (02/11/2026, EricThai)
- Kiểm local bằng câu trả lời giả (chặn fetch tới Worker): 0 tin bị cắt, không cuộn ngang. Chưa thử với AI thật.

## ✅ r213 — ba cấp quyền (02/11/2026, EricThai)
- Supabase đã chạy migration trước khi push; file `MIGRATION_r213_phan_quyen.sql` trong workspace có lệnh hoàn tác. Dry-run có rollback: tự nâng quyền bị chặn, admin đổi được.
- Kiểm local bằng `?role=approved|moderator`. Chưa thử: màn hình User management mới (cần đăng nhập thật), `classic.html` ngoài kiểm cú pháp.
- Eric sẽ đổi admin thứ hai thành moderator bằng nút Make moderator.
- Còn mở: Worker `galileo-ai` có vẻ chưa kiểm đăng nhập, CORS chỉ cho `Content-Type`, mã chỉ trên Cloudflare.

## ✅ r212 — KPI 2 và KPI 7 bấm được (02/11/2026, EricThai)
- Sửa ở vault `beta-src/screens.js` (`drillSrc`, `DRILL_X`), `metrics.js` và `kpi7Stats` trong `classic.html`.
- Kiểm local năm 2026: 39/39 ô khớp số dòng. `M.consistency` chỉ chạy với admin: giả lập quyền ở local cho kết quả `consistency OK`, cho năm 2026. Muốn kiểm phép này ở trang xem thử Viewer phải giả lập admin.
- Chưa kiểm: điện thoại; Export Excel riêng cho KPI 2, KPI 7. ATA comparison chưa bấm được.

## ✅ r211 — bấm số trên KPI charts mở danh sách report (02/11/2026, EricThai)
- Sửa ở vault `beta-src/metrics.js` (`M.DRILL`, kiểm trong `M.consistency`), `screens.js`, `screens2.js` (`dismissModal`), `beta-template.html`.
- Kiểm local năm 2026: 30/30 ô bấm được khớp số dòng; Excel Q1 Late closed 131 dòng (chặn tải file, đọc nội dung); đóng chi tiết về đúng trang và cuộn.
- Chưa kiểm: điện thoại; nút Export với tài khoản admin thật (chỉ giả lập quyền ở local). Tên file Excel theo mẫu chung.
- KPI 2 và KPI 7: xong ở r212.

## ✅ r210 — ngày đóng lấy từ Closed date của Coruson (02/11/2026, EricThai)
- Eric: dashboard lấy sai ngày đóng (MVOI-001, AISC -0520 đã qua bước phê duyệt nhưng chưa đóng). `close_date` của report QA AMO nay = `report_summary.closed_date` trong `classic.html`.
- ⚠ Tỷ lệ đúng hạn đổi: 2026 42,9% → 41,0%, 2025 40,4% → 36,2% (tính đúng hạn / (đúng hạn + trễ hạn) trên toàn QA AMO). Checklist verify gửi các ban 03/10 có thể theo số cũ.
- Kiểm local sau khi nạp lại: 0 report Closed thiếu ngày, 0 report chưa đóng có ngày, selfChecks rỗng. Chưa so từng ô KPI trước và sau.
- Để sau (VIEC_TUONG_LAI): CMR-CAR / ECAR dùng `Date completed`; audit MPS.

## ✅ r209 — loại form Test (02/11/2026, EricThai)
- Bỏ `report_title` bắt đầu bằng "Test " lúc nạp Report summary trong `classic.html`: Test SPI -02/-04/-05, Test-CAPA-01. Kiểm local: 3676 report, All forms 2026 còn 1274, 38 form, selfChecks rỗng. Chưa so từng ô KPI Overview trước và sau.

## ✅ r208 — quay lại danh sách không mất trang (02/11/2026, EricThai)
- Eric: All forms lọc PAVOI, trang 4, mở chi tiết rồi quay lại thì về trang 1. Sửa ở vault `beta-src/beta-template.html` + `screens.js`: giữ trang khi bấm dòng/tab, thêm link "← Back to …", khôi phục lọc, tìm kiếm, cuộn và đánh dấu dòng vừa xem.
- Kiểm local: PAVOI-365 trang 4, cả link Back, Back trình duyệt và tab All forms đều về trang 4, đúng cuộn. Chưa thử thực tế: quay lại từ Work Queue, khôi phục tìm kiếm, reset trang khi đổi năm/tháng và link từ Overview.

## ✅ r207 — cột RFI / Task khớp Galileo (02/11/2026, EricThai) — ✅ ĐÃ PUSH `9a2cb7b`, live (curl APP_REV r207)
- Eric báo cột RFI không khớp (MVOI-002 hiện "—" dù có 2 task). Sửa ở vault `beta-src/screens2.js`, `metrics.js`, `loader.js`, `beta-template.html` và `isPavoiItem` trong `classic.html`.
- Kiểm local trên dữ liệu thật, năm 2026: 1278 dòng All forms khớp từng report; số dòng các tab AMO-ECAR 21, CMR-CAR 474, ECAR 69, MCAR 83, PAVOI/MVOI 75 khớp; 3680 report khớp Galileo theo form và trạng thái.
- Eric chốt 02/11: 106 CAR org TQA link với 22 audit MNT KHÔNG tính vào cột Findings (OU TQA không liên quan).
- Eric chốt 02/11: tab OSR/MOSR giữ nguyên phạm vi (609 khác All forms 52 vì tính theo đơn vị người báo cáo); form Test loại ở r209.
- AISC -0520, MVOI-001, VJC-MOSR-0518: Eric xác nhận chưa đóng, sửa ở r210. 10 report link với audit MPS: để sau, xem VIEC_TUONG_LAI.

## ✅ r206-i3 — chữ Form không bị ô chọn đè (02/11/2026, EricThai)
- r206-i2 chưa hết lỗi: Eric gửi ảnh chữ "Form" bị cắt. Nhãn trong `.beta-sel` co còn 24 px trong khi chữ cần 32 px. Sửa CSS chung ở vault `beta-src/beta-template.html`.
- Đo local dữ liệu thật ở 1525 / 1366 / 375: nhãn không chồng select, chọn All / PAVOI / MVOI vẫn đủ chữ; các ô Level, Year, Month (Analytics KPI) và Form (Work Queue) không chồng; console sạch.

## ✅ r206-i2 — đầu thẻ PAVOI / MVOI register (02/11/2026, EricThai)
- Eric gửi ảnh: dòng "56 of 70 assessed · 5 withdrawn excluded" bị bóp thành 4 dòng cạnh ô Form. Nay xuống hàng riêng. Nguồn: vault `beta-src/beta-template.html` `renderPavoi`.
- Kiểm local dữ liệu thật: 1920 và 1525-ish tiêu đề + ô Form cùng hàng; 1366 và 375 ô Form xuống hàng riêng (panel 355 px, thiếu 16 px); caption luôn 1 dòng; không tràn ngang; console sạch.

## ✅ r206-i1 — Raised by đứng trước Owner (02/11/2026, EricThai)
- Eric yêu cầu đổi chỗ 2 cột trong All forms khi chọn PAVOI / MVOI. Nguồn: vault `beta-src/screens.js` `scrAllForms`.

## ✅ r206 — All forms: cột riêng cho PAVOI / MVOI (02/11/2026, EricThai) — ✅ ĐÃ PUSH `325555c`, live (curl APP_REV r206)
- Eric gửi ảnh: chọn MVOI / PAVOI trong Reports › All forms → Summary đổi thành Request For Verification, thêm Raised by, bỏ CAT và Issued to. Form khác và "All forms" giữ nguyên.
- Summary cũ lấy từ Coruson `summary` nên có MVOI hiện hashtag (`[nightshift] [event]`); nay là field `Request For Verification`.
- Raised by = `reported_by_id` (`dwreporting_report_summary`) tra `userMap`. Probe 02/11: đủ 479 PAVOI + 12 MVOI. MVOI/PAVOI form không có field "Raised by" riêng.
- Nguồn: `classic.html` (select + `reported_by_name`, APP_REV); vault `beta-src` `loader.js` (`o.raisedBy`), `screens.js` (`scrAllForms`, cột `rfv`/`pvOwner`/`raisedBy`). Bản sao nguồn trước khi sửa: `rebuild UIUX/beta-src-bak-20261102/`.
- Kiểm local dữ liệu thật: 12 MVOI, PAVOI 2026; không dòng nào trống RFV/Raised by; sort 2 cột mới OK; `M.consistency()` rỗng; console sạch. Tab PAVOI / MVOI (danh sách + chi tiết) không đổi.

## ✅ r205 — rà giao diện bảng: sort mọi header, cột co theo nội dung, panel trái (01/11/2026, THAIBAHOA-HOME) — ✅ ĐÃ PUSH, LIVE (`a7205bd`, kiểm APP_REV trên vjc-qa-amo.com 01/11)
- Eric gửi 3 ảnh: CMR-CAR có khe trống (Aircraft–Status, trước Days to due) · panel trái Additional Mitigation hẹp, cắt chip/số ngày · header bảng Event/IR report status không sort.
- Nguồn: vault `beta-src` — `screens.js` (`plainTable` sort mặc định + `cellKey`, `opt.nosort/head/tail`, `col.fit`; `bsort` vẽ lại hộp thoại), `beta-template.html` (COL `fit`, `.tbl-fit` khi ≤ 7 cột, `.split` 340–440px/34%, `.rec` tag xuống dòng + tiêu đề 2 dòng, header sort trong `.card-pad`). Bản sao nguồn trước khi sửa: `rebuild UIUX/beta-src-bak-20261101/`.
- **Khôi phục r200-i1** (giữ cuộn `.rec-list`): sửa cũ nằm ở `beta-src/beta.html` (file build, bị chép đè) nên r201–r204 đã mất. Từ nay chỉ sửa `beta-template.html`.
- Kiểm local dữ liệu thật: 1920 / 1366 / 375; sort Event/IR (tên, Satis/Unsatis, trạng thái), Workflow stages + hộp thoại (theo ngày), KPI 7 giữ TOTAL cuối; bảng nhiều cột (All forms, MCAR, Overdue) độ rộng cột y hệt r204; console sạch.
- Còn: push (deploy) chờ Eric.

## ✅ r204 — RSP / SSP vào Audit Plan (31/10/2026, EricThai) — TD-17 (phần Surveillance)
- Eric chốt: RSP (Random Surveillance) + SSP (Specified Surveillance) **gộp vào Audit Plan** như MNT.
- `classic.html`: `QA_AMO_PREFIXES = ['MNT','RSP','SSP']`; `deriveWorkflowCategory` → `Surveillance`; self-check + Overview classic theo `is_qa_amo_scope`. UI: vault `beta-src` (beta-template.html nút Type, screens2.js nhãn, metrics.js chú thích) → build → make-index. Bản sao nguồn trước khi sửa: `rebuild UIUX/beta-src-bak-20261031/`.
- Kiểm local: 17 RSP + 2 SSP = Galileo; Audit Plan 2026 = 255; `M.consistency()` rỗng; console sạch. RSP-0010 vào Delayed (lịch 26/09, còn Scheduled).
- Còn: PRJ / EXT / MPS / CAAV ngoài MNT (TD-17 phần còn lại) chưa vào — chờ quyết định. ⚠ Proxy trả dữ liệu cho curl chỉ với header Origin → AUTH_MODE có vẻ còn `soft`.

## ✅ r203-i2 — ngày theo giờ máy chủ (30/10/2026, EricThai)
- Màn LED hiện "14 Sep 2026" vì PC khởi động với đồng hồ lùi (pin CMOS). Loader lấy giờ từ header `Date` của máy chủ; PC lệch > 2 phút thì `window.Date` được bù. Kiosk tự reload khi sang ngày. Nguồn: vault `beta-src/loader.js` + `screens2.js`. Bugfix → `-i2`.
- Còn: thay pin CMOS máy LED (phần cứng).

## ✅ r203-i1 — tiêu đề thẻ MCAR & Surveillance + nhãn ngày (28/10/2026, EricThai)
- Tiêu đề hiện `&amp;` → `&`; nhãn "Submitted from" không còn bị cắt. Nguồn: vault `beta-src/screens2.js`. Bugfix → `-i1`.
- Hướng dẫn sử dụng: workspace `HuongDan_Xuat_MCAR_Surveillance_r203.docx` (9 trang, hình từ file xuất 01/01–28/06/2026).

## ✅ r203 — sheet biểu đồ trong file MCAR & Surveillance (28/10/2026, EricThai) — ĐÃ PUSH `f3de82c`, live (curl APP_REV r203)
- "Both sheets" thêm 3 sheet: Findings in Auditee · kiểu loại Lỗi · Số lượng (công thức COUNTIF/COUNTIFS + biểu đồ Excel thật chèn bằng JSZip). Nguồn: `classic.html` (`sncChartSheets`, `sncAddChartParts`, `sncCategoryList`) + vault `beta-src/screens2.js` (mô tả thẻ).
- Kiểm bằng Excel thật (COM): mở được, 6 biểu đồ, số khớp; điền tay UNIT/CATEGORY → cập nhật.
- Auditee + Kiểu loại lỗi = 0 tới khi có UNIT / TYPE OF FINDING. Ô Nhận xét để trống.

## ✅ r202 — xuất sheet Surveillance cùng MCAR (28/10/2026, EricThai) — ĐÃ PUSH `0f7f5a4`, live (curl APP_REV r202)
- Thẻ "MCAR & Surveillance report" (Admin › Export reports): Both sheets / MCAR only / Surveillance only, cùng khoảng Submitted Date. Nguồn: `classic.html` (`exportSncReport`, `survReportSheet`…) + vault `beta-src` loader.js / screens2.js.
- Kiểm local 01/01–31/07/2026: 180 SR / 219 finding, khớp số finding mỗi SR với file mẫu; SR không có finding bị bỏ (13).
- CATEGORY = TYPE OF FINDINGS từng finding — trống ở SR thật tới khi người dùng điền.

## ✅ r201 — xuất MCAR report theo khoảng Submitted Date (28/10/2026, EricThai) — ĐÃ PUSH `46a94f7`, live (curl APP_REV r201)
- Admin › Export reports › thẻ "MCAR report": chọn From / To (Submitted Date), xuất .xlsx theo mẫu sheet MCAR của S&C. Nguồn: `classic.html` `exportMcarReport` + vault `beta-src` loader.js (SCREEN_API) / screens2.js (thẻ + `mcarRange`/`dateBox`).
- Kiểm local dữ liệu thật (beta-local): 01/01–31/07 → 57 MCAR, 7 tháng; đơn vị ngoài hiện ở Department (MCAR-0348 Lao Airlines, 0374/0375 Vietsky, 0357 LJATS).
- MCAR VOID (vd MCAR-0334/0336) vẫn xuất như Galileo — Eric 28/10: giữ, cần thì người dùng tự xoá trong file. Freeze pane không ghi được bằng xlsx-js-style.

## ✅ r200-i1 — danh sách PAVOI / MVOI giữ vị trí cuộn (24/10/2026, THAIBAHOA-HOME) — ĐÃ PUSH `c15a0b6`, live (curl APP_REV r200-i1)
- Lỗi: bấm một PAVOI/MVOI thì danh sách bên trái nhảy về đầu (`.rec-list` cuộn riêng, `render()` vẽ lại bằng innerHTML).
- Sửa: vault `beta-src/beta.html` `render()` giữ `scrollTop` mỗi `.rec-list` khi cùng route → build → `index.html` (chỉ khác 4 dòng).
- Kiểm local dữ liệu thật: cuộn 600 px, bấm PAVOI-439 → vẫn 600 px, chọn đúng, không lỗi console.
- Bugfix thuần → `-i1` trên r200 (không bump major, doc rev giữ r200).

## ✅ r200 — classic + hướng dẫn sử dụng có MVOI (19/10/2026, THAIBAHOA-HOME) — ĐÃ PUSH `e84c1c0`, live (curl APP_REV r200)

- classic: trang PAVOI / MVOI Detail + lọc Form, nhãn KPI 7. Nguồn manual: vault `beta-src/manual.js` → `HuongDan_SuDung_QA_AMO_Dashboard_r200.docx` (cài `docx@9` tạm ngoài vault; ảnh r186 cũ, tab vẫn ghi "PAVOI").
- Chưa làm: `deck.js` (slide), chụp lại ảnh hướng dẫn, dòng MVOI trong bảng thuật ngữ classic (chờ tên đầy đủ).

## ✅ r199 — MVOI tính chung KPI 7 (19/10/2026, THAIBAHOA-HOME) — ĐÃ PUSH `76b14c0`, live (curl APP_REV r199)

- Eric chốt 19/10: MVOI vào KPI 7 + Withdrawn + cờ 30 ngày + ô Overview + Awaiting verification. Nguồn: `classic.html` (`isPvReport`), vault `beta-src` loader.js / metrics.js / screens.js / beta-template.html / guide.js.
- Chia ban theo owner_name như PAVOI → MVOI-001/002 (owner cá nhân) ở Unassigned, MVOI-003 ở QC Section.
- Local dữ liệu thật: KPI 7 2026 54/62 (87,1 %), PAVOI / MVOI open 21; loadWarnings rỗng, self-check sạch, không lỗi console.

## ✅ r198 — Form MVOI vào chung tab PAVOI (19/10/2026, THAIBAHOA-HOME) — ĐÃ PUSH `cb3723c`, live (curl APP_REV r198)

- Nguồn: `classic.html` (CF_FIELDS + delta `in`, loadPavoiFinal, loadPavoiRfi, APP_REV) + vault `beta-src`: loader.js (FORM_OF/CODE `mvoi`, PV_TITLES), beta-template.html (tab "PAVOI / MVOI", `formTab`/`isPvForm`, renderPavoi lọc Form), screens2.js (hộp chi tiết), guide.js.
- Kiểm local dữ liệu thật (beta-local 19/10): 3 MVOI, số vòng khớp probe (001: 4 · 002: 1 · 003: 2), MVOI Type / Responsible Department hiện đúng; KPI 7 giữ 51/59 · 4 withdrawn; loadWarnings rỗng, self-check sạch.
- KPI 7 / cờ 30 ngày / ô PAVOI open / Awaiting verification vẫn chỉ PAVOI — chờ Eric chốt có tính MVOI không.

## ✅ r197 — Analytics: tab "Safety (MSAG)" → "OSR/MOSR Status" (10/10/2026, ERICTHAI) — ĐÃ PUSH `c68e0ca`, live (curl APP_REV r197)

- Nguồn: `beta-src/beta-template.html` (nhãn tab + bảng what-moved), `screens2.js` (bước kiosk), `guide.js`; `manual.js` / `deck.js` đã đổi chữ nhưng CHƯA dựng lại .docx / deck.
- Chỉ đổi nhãn: id tab vẫn `safety`, thẻ "MSAG report status" và tên nhóm MSAG giữ nguyên. Classic (`classic.html`) vẫn ghi "Safety — MSAG Report Status".

## ✅ r196 — Audit Plan › Schedule list: lọc Audit / Inspection / Other + sort cột (07/10/2026, ERICTHAI) — ĐÃ PUSH `7e44505`, live (curl APP_REV r196)

- Nguồn: `beta-src/beta-template.html` `renderAuditList` + `AUD_COLS`. Nút Type dùng chung `state.aud.type` với Timeline; sort qua `data-act="sort"` sẵn có (`state.sort.auditlist`), chưa chọn thì theo tháng.
- Chỉ giao diện, không đổi METRICS. Kiểm local dữ liệu thật: 236 = Audit 48 + Inspection 179 + Other 9; sort Findings/Window 2 chiều, console sạch. Eric chưa nhìn live.

## ✅ r195 — cờ Verified Satisfactory của PAVOI chỉ theo Final Conclusion (03/10/2026, THAIBAHOA-HOME) — ĐÃ PUSH `818d5c3`, live (curl APP_REV r195)

- `loadPavoiFinal()` (classic, gọi trong `loadKpi7Tasks`) → `r.verif_final` = section Final Conclusion level 0; cache phần 2 có `fin`.
- r193 dùng `verif_result` (không phân biệt section) → sai (PAVOI-437). W40 cờ đúng: PAVOI-099, 363, 365, 384, 430, 450, 451, 465.

## ✅ r194 — Owner đúng owner, tách cột Issued to (03/10/2026, THAIBAHOA-HOME) — ĐÃ PUSH `d140f38`, live (curl APP_REV r194)

- Gốc lỗi (từ r167): loader `o.owner = issued_person || owner_name`, PAVOI `o.dept = owner_name`. Nay mỗi cột = đúng 1 trường Galileo; trống → "—".
- Kiểm tự động mọi trang 7 register (1.917 dòng) đối chiếu ô với trường Galileo: 0 lệch. Chạy lại sau mỗi lần sửa mapping trong loader.js (om memory).
- Nhãn "Target ≠ rule" → ghi chú mờ (Target MCAR do auditor nhập, 31–48 ngày sau raise).

## ✅ r193 — Overdue report: Department thật + Pending with + cờ Verified Satisfactory (03/10/2026, THAIBAHOA-HOME)

- Từ r113-i2 cột Department của PAVOI chứa owner RFI đang mở → nay Department = phòng ban, cột Pending with = RFI/Task mở + hạn (mọi form, `ovrFetchPending`).
- Status + "Verified Satisfactory, not closed"; dashboard `M.verifiedOpen` → note ở panel PAVOI + popup. W40: PAVOI-384/437/450/451.
- Kiểm local dữ liệu thật (PDF chặn save). Excel cùng logic, chưa xuất thử (UI mới chỉ có nút Overdue PDF).

## ✅ r192 — Overdue report thêm cột Owner (03/10/2026, THAIBAHOA-HOME) — ĐÃ PUSH `bc71f18`, live (curl APP_REV r192)

- `exportOverdueReport` / `exportOverduePDF`: cột Owner = `owner_name` nguyên văn (người hoặc nhóm), sau Department. Kiểm local W40.
- Gợi ý chờ Eric: Finding Summary trống với form không có finding (OSR, MOM, MCCF, F-088) — có thể lùi về Coruson summary như r191.

## ✅ r191 — Summary + RFI, lọc form Work Queue, sort OSR/MOSR (03/10/2026, THAIBAHOA-HOME) — ĐÃ PUSH `6459af3`, live (curl APP_REV r191)

- Cột Summary (Coruson summary, lùi về finding mờ) + RFI ở Work Queue Open/Overdue, Reports All forms/MCAR/AMO-ECAR — `loadRfiSum` (screens2.js),
  `M.rfiSummary`, `API.orgUnitIds`; tải theo năm đang lọc (RFI ~0,9 MB, summary 55 KB nhờ `length(summary) lt 30000`). TECHNICAL_REFERENCE §9.
- Work Queue Open/Overdue: ô Form (`BS.wqForm_<tab>`). `plainTable` + `opt.sortVals` (action `bsort`), bật cho OSR/MOSR.
- Kiểm local dữ liệu thật. Chưa xem live đã đăng nhập. Summary hầu như trống trên Coruson → nên đưa vào phụ lục SOP-009 App.3.

## ✅ r190 — lý do gia hạn MCAR (03/10/2026, THAIBAHOA-HOME) — ĐÃ PUSH `7cb1091`, live (curl APP_REV r190)

- `CF_FIELDS` + `Reason for extension`, `Extension denied reason` → `ext_reason` / `ext_denied`; `cfRaw` lưu chữ ký `fields`, khác thì nạp đầy.
- Reports › MCAR thêm cột Extension (số lần + lý do); popup thêm 2 khối. Không cần sửa form (Eric: Extension chỉ MCAR).
- Kiểm local dữ liệu thật từ cache r189 cũ: MCAR-0326/0328/0331. Chưa xem live đã đăng nhập.
- Phụ lục SOP-009 Appendix 3 (nhập liệu Coruson) đang soạn ở phiên riêng.

## ✅ r189 — khôi phục 3 tính năng classic bị sót ở UI r167 (03/10/2026, THAIBAHOA-HOME) — ĐÃ PUSH `f9a5425`, live (curl APP_REV r189)

- Việc 3 họp anh Ngọc 24/09: rà r188 so với họp 07/08 → vault `02-Bao-Cao/RS-2026-10-03-Ra-soat-dashboard-r188-vs-yeu-cau-hop-07-08.md`.
- Khôi phục: cột **Response due** (MCAR, luật r101 `mcar_chk`, nhãn `Target ≠ rule`) + 2 dòng trong popup · ô **Repetitive rate** (KPI charts,
  `M.summary().repetitiveRate` + 1 dòng `M.consistency()`; MCAR không có trường Repetitive → 0%) · **Instructions · Response** RFI/Task PAVOI.
- Nguồn vault `beta-src`: loader.js, metrics.js, screens.js, screens2.js, beta-template.html (đã build lại từ nguồn = r188 trước khi sửa).
- Kiểm local dữ liệu thật: MCAR-0385, PAVOI-446. Chưa xem live đã đăng nhập / màn LED.
- Eric chốt: KPI QC · ATA comparison = KPI 3; Extension chỉ MCAR.
- **HOLD:** danh sách auditor tự quản + màn Auditor performance (vault `Auditor_Performance_Spec.md`) — chờ ICT phân công; không Databricks;
  hạ tầng công ty sẽ dùng SSO Microsoft ⇒ chưa tạo bảng Supabase. `QA_AMO_AUDITORS` vẫn viết cứng.
- Còn từ rà soát 07/08: Report Summary, ngày trả lời RFI, cờ `has_been_rescheduled` + `reschedule_reason` cho Audit Plan, xuất BC quý Audit Plan;
  Overview: SPI chưa đạt + level, KPI chưa đạt; RFI PAVOI đã đóng chưa xem được (bản cũ xem được).

## ✅ r188 — Audit Plan 6 ô một hàng + LED thêm Audit Plan › Timeline (02/10/2026, EricThai)

- Bỏ ô CAR follow-up; 6 ô còn lại 1 hàng (khung ≥ 948 px), 3 + 3 khi hẹp. `KIOSK_STEPS` bước 6 = Audit Plan · Timeline.
- Nguồn: vault `rebuild UIUX/beta-src` (screens2.js, beta-template.html, guide.js, manual.js) → build → make-index.
- Kiểm beta-local dữ liệu thật 1536 / 1920 / 1024 + `?kiosk=5` đủ 6 bước, console sạch. Chưa xem trên màn LED thật.

## ⏳ r187 — bố cục màn LED / Overview (02/10/2026, EricThai) — ĐÃ PUSH `cb0c9e2`, live r187

- Eric gửi ảnh màn trình chiếu: bố cục không đều. Sửa trong `beta-src/beta-template.html`: biểu đồ ghim đáy ô KPI; 12 ô Overview
  chỉ 2/3/4/6 cột (container query `.kpi-box`); `body.kiosk .wrap{max-width:none}`.
- Kiểm trên trang thử cùng CSS (1920 LED 6 cột, đáy biểu đồ thẳng, 0 nhãn donut bị cắt). **Chưa kiểm dữ liệu thật / màn chiếu thật.**
- Còn mở: bảng Event/IR report status cuộn bên trong card → trên LED không thấy dòng dưới; chờ Eric quyết có cho bảng hiện hết ở kiosk không.

## ⏳ Overview: Extension · MCAR + Mitigation · HIRA / CAPA (30/09/2026, laptop — CHƯA COMMIT, chờ Eric duyệt push)

- Nguồn: email anh Ngọc 30/09 (sửa Overview) + Eric: "trước mắt làm extension cho MCAR, mitigation lấy HIRA và CAPA".
- `index.html` (nguồn vault `beta-src`: loader.js `o.ext = mcar_chk.n` · metrics.js `M.extension` / `M.mitigation` + 2 dòng
  `M.consistency()` · beta-template.html `renderOverview` 2 ô mới, `kpiTile` nhận `act` · screens2.js action `bovform` · guide.js,
  manual.js). Không đổi `classic.html`, không bump rev.
- Kiểm local dữ liệu thật (beta-local, 2026): Extension · MCAR = 0 đang mở · 22 được gia hạn (3 lần 2) — khớp probe Galileo;
  Mitigation overdue = 2 task · 13 mở / 76 · 1 HIRA cần mitigation — khớp màn AMO - Additional Mitigation; `M.consistency()` 0 lệch;
  2 theme đạt; lint metrics-only OK.
- Vì sao chỉ MCAR: Coruson chỉ có trường gia hạn ở MCAR / CAR / CMR CAR / VJGS-CAR (probe 30/09); rà quy trình ở vault
  `02-Bao-Cao/Coruson/RS-2026-09-30-Gia-han-extension-theo-loai-report.md`.
- Thêm (cùng lượt, chưa commit): ô **Audits completed vs plan** (`M.auditProgress`; Eric 30/09: audit chậm = hết tháng
  kế hoạch mà chưa Performed/Closed; Cancelled/Deleted không tính) + ô **Delayed** trên Audit Plan cùng số; ô **PAVOI open**
  (open / overdue qua `M.summary`). 2 dòng `M.consistency()` mới. Kiểm 30/09: 160/160 đến hạn đã xong, 0 chậm; nếu hôm nay
  là 01/10 → 17 chậm (11 Scheduled + 6 In Progress tháng 9) — khớp probe Galileo. PAVOI 21 mở · 8 overdue.
- ✅ ĐÃ PUSH `0d9d4b2` (live). Lượt 2 (30/09 tối): ô **Late closed** (`summary.late`, = KPI charts = tổng quý = 300) và
  **Corrective actions overdue · F-088 / IR** (`M.caRisk`: CA của F-088 / EIS / Event Investigation Report, nạp `loadEis` khi
  mở Overview; AMO ECAR không tính; MQA Investigation Report không có nhóm CA). 2026: 0 quá hạn · 6 mở / 55 CA / 14 report ·
  9 hoàn thành trễ — khớp đếm thẳng eisCAMap. consistency 0 lệch.
- Sửa ô CA (Eric 30/09, xem ảnh register F-088): đếm THEO REPORT — report F-088/EIS/IR tính quá hạn khi chính report Overdue
  HOẶC có ≥1 CA Overdue (bản đầu chỉ đếm CA nên ra 0, sót RP-072/074). Ô đổi tên "F-088 / IR overdue". 2026: 3 report
  (MQA-RP-072-2026, MQA-RP-074-2026, MQA-EIS-019 — cả 3 Overdue mà chưa nhập CA nào) = đúng danh sách Overdue của register.
- Rà lại ảnh Overview (Eric 30/09 "có vẻ sai"): (1) ô Audit trước ghi 160 / 160 chỉ tính tháng đã hết → giấu 17 audit tháng 9
  chưa làm và 163 > 160; nay = hoàn thành / kế hoạch TÍNH ĐẾN THÁNG NÀY = 163 / 180 + "17 of 20 this month not yet performed"
  (khớp Galileo: T9 có 20 audit, 3 xong). Tổng 237 đúng: MNT-1089 là 2 audit khác audit_id, tạo 2 lần trên Coruson 24/09 cách
  2 giây (DAD, T12) — lỗi dữ liệu Coruson, cần xoá 1 bản. (2) KPI 7 "−100pt": tháng không có PAVOI bị tính 0% → `M.kpi7In`
  trả null, `spark` bỏ điểm trống, `trendTag` bỏ khi tháng này null.
- Donut trong 6 ô (Eric 30/09: "phải là donut, số tổng của năm, số hoàn thành… vẽ được thì vẽ"): `mixBlock` (donut 76px +
  chú thích kèm số, khe 2px, tổng ở giữa). Màu = token trạng thái của chip (ok/info/warn/accent/text-3); validator dataviz báo
  warn↔accent khó phân biệt (protan) → không bao giờ đặt cạnh nhau + luôn có nhãn số. Kiểm 2026: Audit 163+17+0+57=237 ·
  PAVOI 42+13+8=63 · MCAR 52+19+3=74 · task 46+17+0+11+2=76 · F-088/IR 14+2+3=19 · Late 228+45+300=573; consistency 0.
- Bỏ 2 khối cuối Overview (Eric 30/09: không có trong email anh Ngọc thì bỏ): "Reports raised vs closed" (mọi report QA AMO,
  12 tháng) và "Recent report events" + hàm `linePair` (chỉ khối đó dùng). Giữ "Overdue reports by CAT" và "Open reports by form".
- Popup report/audit › Workflow stages: stage Accept/Reject ("Approve for report closure") không có Stage Owner (owner_id = 0)
  → hiện người duyệt từ `dwanalytics_task` (valid_to null, nối stage_id): owner + report_acceptance_status nguyên văn
  (AISC -0714: "Ton That Thien · Accepted", khớp Coruson "Assigned To / Response: Accepted").
- Eric 30/09: khôi phục "Recent report events" (cuối Overview, 1 cột). Người duyệt stage Accept/Reject: quét 39 report 2026 →
  23 có task; bổ sung `stageOwnerCell`: stage Completed không còn task → `completed_by` (PAVOI-397 "Nguyen Son Hai · completed by");
  stage InProgress không có task nào → "no acceptor assigned" (MOSR-0476, HAZARD LOG-27: Galileo chưa có acceptor); NotStarted → "—".
  Popup ECAR (TQA) không có bảng stage — có từ trước, chưa đụng.
- Link sang Coruson (Eric 30/09 "gắn link cho các report hết"): `extLink` (↗ cạnh số) + `extBtn` ("Open in Coruson" đầu popup).
  Mẫu kiểm trên Chrome đăng nhập: report `/Reporting/Report/Index/<report_id>` (AISC -0714), audit `/Audits/AuditRecord/Index/<audit_id>`
  (MNT-1050). Gắn ở: cột Report mọi register (Work Queue, Findings theo form, All forms), EIS/QC Spot Check, OSR/MOSR, Report status
  F-088/EIS (tra report_id theo số, cả linked report), Audit list, popup report/EIS/QCS/audit, report trong popup audit, audit trong popup
  Workflow stages, đầu khung PAVOI/CAPA. Ô Overview là <button> nên không lồng link — mở popup rồi bấm nút. Bấm ↗ không mở popup dòng.
  Sửa kèm: manual.js lỗi cú pháp do "month's" (chỉ ảnh hưởng file .docx).
- Còn lại của email anh Ngọc: SPI chưa đạt + level, KPI chưa đạt.

## 📌 TỔNG KẾT PHIÊN 28–29/09/2026 (máy nhà) — đọc cái này trước

**Live cuối phiên (29/09 23:41):** `APP_REV = 2026.09.29-r178` + màu trạng thái Audit Plan (`02c9cb4`). `main` = `origin/main`.
Worker `galileo-proxy` = bản trong `workers/galileo-proxy/`, version `fc20ebb6`, **AUTH_MODE soft**.

| Đã lên live | Nội dung |
|---|---|
| r173-i1 / i2 / UI (28/09 22:00) | fetch không treo khi thân đứng · mở cache chấm lại Overdue/CAT · giữ cuộn + focus |
| r174 · first-paint · r175 · r176 (28/09 22:53) | rev mới không vứt cache (`CACHE_DATA_VER`) · lần đầu hiện màn sớm · CMR/ECAR chung lượt quét + RFI song song · app gửi token Supabase, Worker vào repo |
| Worker fc20ebb6 (29/09 21:53) | sửa sự cố treo '[4/6]' do truyền dần — gom đủ như cũ |
| Đợt 3 UI `f16a55c` (29/09 22:47) | sparkline 12 tháng · phân trang modal · tìm khi gõ · bộ lọc trong URL · AI · bàn phím modal |
| `d4d7365` (22:59) | Audit Plan địa điểm × tháng (Eric chọn A) · thương hiệu "Safety & Quality Assurance" |
| r177 (23:32) | bước workflow audit/report đúng nguồn (đủ + đúng thứ tự) · ô CAR follow-up / Top stage có số thật · Galileo nguyên văn |
| r178 (23:36) · `02c9cb4` (23:41) | "Workflow stages" thay "Bottleneck analysis" · màu trạng thái 2 theme |

**Luật mới (Eric 29/09):** giá trị Galileo hiện **nguyên văn** — không tự đổi tên, không gộp trạng thái, không mở rộng định nghĩa
chỉ số (CLAUDE.md, mục Galileo values). **Worker:** thử bằng dữ liệu cỡ thật + so A/B với bản cũ trước khi deploy (sự cố 29/09).

**Còn mở (theo thứ tự):**
1. ~~Bật `AUTH_MODE: enforce` cho `galileo-proxy`~~ — xong 03/11/2026, xem mục r216.
2. Worker `galileo-ai` (khoá Anthropic) — đã có kiểm đăng nhập từ r216, xem mục r216: còn phải chuyển `enforce`.
3. Modal audit của `classic.html` (r177) chưa xem bằng mắt.
4. **VIỆC KẾ TIẾP (Eric, 30/09 trên laptop): áp bộ màu trạng thái cho các page còn lại.** Mẫu đã làm: Audit Plan (commit `02c9cb4`) —
   token có sẵn 2 theme `--ok` (xanh lá, đạt/Closed) · `--info` (xanh dương) · `--warn` (vàng, đang làm) · `--accent` (đỏ, overdue) ·
   `--text-2` (nét đứt, chưa bắt đầu); định nghĩa ở `beta-template.html` (khối `:root` dark + light). Tên trạng thái vẫn NGUYÊN VĂN Galileo.
   Laptop: `git pull` repo `F:/App Build/GitHub/qa-amo-dashboard`; nguồn sửa ở vault `rebuild UIUX/beta-src`, build `node build.mjs` (mặc định đọc F:)
   → chỉ chạy `node make-index.mjs` khi log có `BODY + UI SYNTAX OK`; xem thử preview `beta-local` ở cả 2 theme trước khi push.
   ✅ **30/09 (laptop): chip trạng thái mọi bảng đã tô màu, ĐÃ PUSH `e6bdd55`, live (curl), không bump rev.** Eric chọn "theo CA":
   Open/In Progress `--info` · On-time Closed `--ok` · Lately Closed `--warn` nét đứt · Overdue `--accent`. Kiểm preview dữ liệu thật
   2 theme, console sạch. ⚠️ Bẫy: `build.mjs` đọc `beta.html` — phải `cp beta-template.html beta.html` trước khi build.
5. Nhánh local `local-agent-tools` (máy nhà) giữ `325d3a4` — **không merge vào main** (lộ cách vượt proxy + số liệu thật).

Chi tiết từng rev: PROJECT_TECH_SPEC §14. Việc ngoài git (quyết định, sự cố): workspace `GHI_NHAN_TUAN.md` tuần 2026-W40.

## ✅ r178 — Audit Plan › Workflow stages (29/09/2026 — ĐÃ PUSH 5ae2e49, live 23:36, curl APP_REV = r178) — thay 'Bottleneck analysis', xem §14

## ✅ r177 — Bước workflow đúng nguồn (29/09/2026 — ĐÃ PUSH, live 23:32)

- Eric: modal MNT-1030 thiếu bước + sai thứ tự so với Coruson. Gốc: `dwreporting_*_workflow` trải phẳng theo task. Chi tiết + số probe: PROJECT_TECH_SPEC §14 r177, TECHNICAL_REFERENCE 'Bước workflow — dùng view nào'.
- Kèm: ô CAR follow-up / Bottleneck trên Audit Plan xưa nay luôn 0 / '—' trên live (bước chỉ nạp khi ≤ 50 audit) — nay có số, định nghĩa giữ như cũ (chỉ `InProgress`), `PendingSignOff` ghi riêng. 2026: CAR follow-up 0 InProgress · 3 PendingSignOff; Bottleneck Perform 6.
- **Luật Eric 29/09:** trạng thái / tên từ Galileo hiện NGUYÊN VĂN, không tự đổi tên hay gộp (vd không gộp PendingSignOff vào InProgress).
- Còn: modal audit của classic.html chưa xem bằng mắt. 'Bottleneck analysis' → r178 (Eric chọn hướng A).

## ✅ Audit Plan địa điểm × tháng + thương hiệu 'Safety & Quality Assurance' (29/09/2026 — ĐÃ PUSH d4d7365, live 22:59)

- Eric chọn phương án A (trong 3 bản nháp dựng trên dữ liệu thật): mỗi audit một chấm ở tháng dự kiến, hàng = địa điểm (+ năm khi chọn nhiều năm), lọc Loại / Hiển thị (`state.aud`, act `audf`). 237 audit 2026: 22.000 px → ~1 màn. Schedule list giữ nguyên. Guide + manual cập nhật.
- Thương hiệu: sidebar + thẻ đăng nhập (sửa ở `loader.js` — bản 26/09 chỉ sửa bản chép trong template nên đăng nhập vẫn 'Quality Assurance').

## ✅ Đợt 3 rà hiệu năng/UX — giao diện (29/09/2026 — ĐÃ PUSH f16a55c, live 22:47, curl index có writeUrlFilters/MODAL_REDRAW)

- Chỉ `index.html` (nguồn `beta-src`: beta-template.html, screens.js, screens2.js), không bump rev. Backup nguồn: `rebuild UIUX/beta-src-bak-20260928/` (trước đợt 1).
- Sửa: sparkline 12 tháng Overview không còn bị bộ lọc Năm/Tháng cắt (`overviewStats(rows, trend)`); phân trang TRONG modal (`MODAL_REDRAW`/`redrawModal`); danh sách Năm dựng lại ở `betaSwap`; AI: cắt lịch sử bắt đầu ở câu hỏi (không mồ côi tool_result), timeout 90s/vòng, tool lỗi vẫn có tool_result; ô tìm trong màn lọc khi gõ (250 ms), giữ focus + con trỏ; Năm/Tháng/ô tìm lưu trong URL (`?y=…&m=…&q=…`, replaceState, so route bằng `hashPath()`); modal trả focus khi đóng + Tab không thoát ra; link 'Most overdue' form other → tab all; `scrAta` đổi biến M→Mo (che METRICS); Admin › Export có khoá riêng `exForm`.
- KHÔNG làm (đo trước): 'bảng chỉ dựng trang đang xem' + memo — mọi màn vẽ ≤ 48 ms trên dữ liệu thật (Overview 48, Audit timeline mọi năm 37, KPI2 16, All forms 7.068 dòng 3 ms).
- Kiểm local dữ liệu thật: xem commit message. Live: curl 22:47 thấy đủ 3 dấu mốc code mới; APP_REV vẫn r176 (chỉ giao diện).

## ⏳ Đợt 2 + proxy đòi đăng nhập: r174 · r175 · r176 (28/09/2026 — BƯỚC 1+2 XONG: Worker soft deploy fc09a341 · push 4615f6b live r176; CHỜ BƯỚC 3 enforce)

- **r174** lên rev không vứt cache (`CACHE_DATA_VER`) · **index.html** lần mở đầu hiện màn hình trước lượt 2 · **r175** CMR/ECAR chung lượt quét report_field + RFI song song · **r176** app gửi token Supabase (`gFetch`), mã `galileo-proxy` vào repo, Worker kiểm đăng nhập + stream. Mục 8 (tách font/letterhead) **bỏ**: Pages trả 304, gzip classic 367 KB.
- Kiểm local dữ liệu thật: xem §14 từng rev. Worker mới chạy `wrangler dev --remote --var AUTH_MODE:enforce`: không token / token rác / cách vượt cũ → 401; Eric đăng nhập → mọi request 200, 7.063 report.
- **Lên live — 3 bước, mỗi bước Eric duyệt:** (1) `cd workers/galileo-proxy && npx.cmd wrangler deploy` với `AUTH_MODE: soft` (tương thích trang cũ, thêm stream + CORS Authorization) → curl live vẫn 200; (2) `git push` r174–r176 → curl APP_REV = r176; (3) xem Workers Logs (`"auth":"soft-allow"`) tới khi không còn request thiếu token từ trình duyệt (trang cũ còn mở / kiosk) → đổi `AUTH_MODE` thành `enforce`, deploy lại.
- 28/09 22:50 bước 1: `wrangler deploy` AUTH_MODE soft, version `fc09a341-530b-4ba7-8e85-edb840e192c1`; curl live: không token 200 (trang cũ không gãy), sai Origin 403, preflight cho `Authorization`, workflow 18,5 MB byte đầu 3,15s / xong 5,36s (stream). 22:53 bước 2: live APP_REV = r176, classic có `gFetch`, index có stub `gAuth`. CMR-CAR-2361: Eric sửa OU trên Coruson → Galileo `org_unit_name: TQA`.
- ⚠️ 29/09 21:40 SỰ CỐ: live treo '[4/6] Audit plan' — do Worker **truyền dần** thân response (bước 1). Đo song song: users 711 KB gom-đủ 1,8s / truyền-dần 47,6s; audit, workflow >120s. 21:53 deploy bản gom đủ (`fc20ebb6`, vẫn kiểm đăng nhập soft) → users 2,8s, audit 14s ≈ Worker cũ. Commit `94785da`. Bài học: thử Worker bằng curl cỡ dữ liệu thật + so A/B với bản cũ TRƯỚC khi deploy, không chỉ thử tính đúng.
- **Bước 3 (chờ Eric):** `npx.cmd wrangler tail galileo-proxy --format pretty` hoặc Workers Logs, lọc `soft-allow` — còn dòng từ trình duyệt (kiosk/tab cũ chưa tải lại) thì chờ; hết thì đổi `AUTH_MODE` → `enforce` trong `wrangler.jsonc`, deploy, commit.
- Sẽ ngừng chạy khi enforce: script ở nhánh local `local-agent-tools` (galileo.py, pavoi-snapshot.py), `rebuild UIUX/snapshot.mjs` / relay local không đăng nhập, Power BI nếu có dùng proxy. Lùi: deploy `worker.live-2026-09-28.js` hoặc đặt `AUTH_MODE: soft`.
- Còn mở: `galileo-ai` (khóa Anthropic) có thể cũng không kiểm đăng nhập — chưa xem mã. CMR-CAR-2361 thuộc org QA AMO nên hiện riêng là 'CMR CAR' trong All forms — chờ Eric chọn sửa Coruson hay gộp làn.

## ✅ Đợt 1 rà hiệu năng: r173-i1 · r173-i2 · giữ cuộn (28/09/2026, máy nhà — ĐÃ PUSH 998fa0e, live, curl APP_REV = r173-i2)

- Nguồn: bản rà hiệu năng/UX 28/09 (18 mục, chia 3 đợt). Đợt 1 = 5 mục ưu tiên; mục 1+2+4 gộp r173-i1, mục 9 = r173-i2, mục 12 = commit giao diện.
- **r173-i1** (classic): timeout 90s phủ cả thân response (trước: thân đứng giữa chừng → `loadData` treo mãi); dự phòng ngừng khi đã có header 200 (trước: thân lớn bị tải 2–3 bản song song); chỉ Report summary chờ cây org unit.
- **r173-i2** (classic + loader.js): mở cache chấm lại `semantic_status`/`report_ageing`/`overdue_cat` + đếm audit theo hôm nay (`regradeRows`/`regradeAudits`).
- **Giao diện** (beta-template.html `render()`): chỉ về đầu trang khi đổi màn/tab; sort/pager/chọn record/nạp xong giữ vị trí cuộn và trả focus về đúng nút (pager "Next page" khớp theo aria-label).
- Kiểm: test Node (fetch giả) trên hàm trích nguyên — cũ treo / mới reject đúng hạn; local dữ liệu thật 7.063 report · 1.098 audit, cache giả lập cũ MCAR-0381 → Overdue CAT I, audit 4/0 → 3/1, `M.consistency()` rỗng; Next page ×3 → trang 2/3/4, focus giữ, cuộn giữ; đổi màn → về đầu; console sạch.
- Đo Worker thật (curl, mạng nhà): workflow 18,5 MB byte đầu 3,8–8,3s, thân +0,6s → lợi ích dự phòng chỉ rõ trên mạng chậm (công ty?). Mã nguồn Worker `galileo-proxy` không nằm trong repo.
- Hạ tầng: `beta-src/build.mjs` đọc `QA_AMO_REPO` (mặc định F:), `beta-devserver.mjs` tự tìm repo F: hoặc `%USERPROFILE%/Documents/GitHub`. Backup nguồn: `rebuild UIUX/beta-src-bak-20260928/`.
- Push 28/09 22:00 (Eric chọn cách 1): chỉ 3 commit đợt 1 lên `main`. Commit `325d3a4` (bộ công cụ agent, AGENT_FACTS.md lộ cách vượt proxy + số liệu thật) **KHÔNG push** — giữ ở nhánh local `local-agent-tools` trên máy nhà. Live: curl classic APP_REV = r173-i2, index có `lastRoute` + `regradeRows(HOOK.cache.a)`; chưa mở live đã đăng nhập (cần Eric). Đợt 2 (tải nhanh khi lên rev mới, lần đầu không cache, gộp quét report_field, RFI song song, tách font/letterhead) và đợt 3 (UX) chưa làm.

## ✅ r173 — Nối HIRA ↔ CAPA (28/09/2026, ĐÃ PUSH 352a4df — live, curl APP_REV = r173)

- Qua số HIRA trong Report Reference của CAPA; HIRA-16 Yes nhưng không có CAPA; CAPA-01/03/08 không nối (CAPA-03 ghi mã AMO-ENV-025 sai — cần Safety sửa trên Coruson).

## ✅ r172 — AMO - Additional Mitigation theo dõi như PAVOI (28/09/2026, ĐÃ PUSH 6f781db — live, curl APP_REV = r172)

- All forms chọn `AMO - Additional Mitigation`: màn kiểu PAVOI (danh sách + chi tiết, Tasks graded bằng `semCalc`, overdue lên đầu). `loadCapa` + `capaTaskStats` trong classic.
- Kiểm local: 76 task · 44 on time · 17 late · 4 overdue · 11 open khớp đếm lại từ Galileo thô. Galileo `task_delivery_status` nói 28 late (so theo giờ) — **Eric chốt 28/09: giữ so theo ngày**.

## ✅ r171 — AMO - HIRA: 3 cột Classifications (28/09/2026, ĐÃ PUSH a714673 — live cùng r172)

- All forms chọn `AMO - HIRA`: bỏ Form + CAT, thêm HIRA method · Hazard type · Additional mitigation (nguồn `dwanalytics_report_classification_field`, `loadHiraCls`).
- Kiểm local dữ liệu thật: 24/24 khớp probe Galileo, vừa 1440px, self-check/consistency sạch. Còn: push + kiểm live; phần mitigation actions (số lượng + trạng thái) của họp 24/09 mục 8 chưa làm; nguồn beta-src sửa ở vault (`screens.js`, `loader.js`, `beta-template.html`).

## ✅ r170 — Closure by quarter + chữ popup audit (26/09/2026, ĐÃ PUSH 77617d1 — live, curl APP_REV = r170)

- Việc 2 họp 24/09. KPI charts: bảng Closure by quarter (`M.byQuarter` + consistency); popup audit ô Closed ghi số on time/late/no target.
- Extension chưa tách (Eric: chờ form có ngày cấp gia hạn) — số probe ở PROJECT_TECH_SPEC §14 r170.
- Đề xuất sửa form (việc 2b): `Vault-CongViec/02-Bao-Cao/RS-2026-09-26-De-xuat-sua-form-Coruson-ly-do-tre-gia-han.md`.

## ✅ r169-i1 — Tô màu CA trong popup (26/09/2026, ĐÃ PUSH 40da83d — live, curl APP_REV = r169-i1)

- Eric: dòng Target / Completed / VOI cần màu để dễ nhìn. Thêm token `--ok/--warn/--info` (+ `-bg`, sáng + tối) trong beta-template;
  thẻ CA viền trái theo trạng thái (xanh lá đúng hạn · vàng trễ · đỏ overdue · xanh dương đang mở), Target/Completed thành
  pill màu kèm `Nd late` / `on time` / `Nd overdue` / `Nd left`; VOI thành ô riêng nền xanh lá (xanh dương nếu CA chưa xong).
- screens2.js `caTone`/`caMeta`, trạng thái qua `M.is*` (lint OK). Kiểm local RP-070 (sáng) + EIS-018 (tối).

## ✅ r169 — Corrective actions trong popup report (26/09/2026, ĐÃ PUSH 948e883 — live, kiểm 26/09: RP-070 4 CA, RP-072 (0), menu Reports, brand mới)

- Kèm (Eric 26/09, KHÔNG bump rev): menu/tiêu đề `Findings` → `Reports` (id vẫn `findings`, URL `#findings/…` giữ nguyên);
  brand `Quality Assurance` → `Safety - Quality Assurance` (sidebar + màn đăng nhập); guide.js `Findings ›` → `Reports ›`.
- Việc 1 họp anh Ngọc 24/09: khuyến nghị F-088 + báo cáo điều tra theo dõi như finding, mọi report.
- `classic.html` `loadEisDetail`: CA của mọi report (section có `Corrective Action(s)`); CA của report đã đóng thiếu
  Date completed → `Closed`. Chi tiết + số probe: TECHNICAL_REFERENCE bẫy 13, PROJECT_TECH_SPEC §14 r169.
- Giao diện (`beta-src`: metrics.js `M.caSummary`/`M.caReports` + consistency · screens2.js `caList` + `caForms`
  trong showEis + showReport) → build (lint OK) → make-index. Eric 26/09: KHÔNG làm tab/trang riêng — đã gỡ tab `ca`.
- Kiểm local (preview beta-local, dữ liệu thật): 263 CA / 80 report mọi năm, khớp probe; popup RP-070 4 CA (3 late),
  RP-072 '(0) No corrective actions entered', EIS-016 8 closed / 0 overdue; console 0 lỗi. Backup template: `rebuild UIUX/beta-template.bak-20260926.html`.
- Còn: Eric duyệt → push → kiểm live; Extension theo CA KHÔNG có trường trên Coruson (cần sửa form nếu anh Ngọc muốn);
  RP-072/RP-074 overdue cấp report nhưng chưa nhập CA trên Coruson.

## ⏳ UI 23/09 — Send feedback cho mọi người · Library bỏ cột type · bỏ Department (ĐÃ PUSH 26eb069 — live phục vụ bản mới, curl 23/09)

- Eric review live r168-i1: (1) Feedback nằm trong Admin → viewer không dùng được; (2) Library mã tài liệu canh giữa,
  cột Document types cắt chữ; (3) Department lọc lung tung; (4) tab Findings bấm vào trống.
- Sửa ở `beta-src` (vault) → build → `index.html` repo (working tree, chưa commit):
  Feedback = dialog `bfbopen` (sidebar dưới tên + drawer More), bỏ tab Admin › Feedback; Library register full width +
  dropdown loại (đủ tên, drill + breadcrumb); bỏ hẳn bộ lọc Department; mã tài liệu canh trái; drawer More phone hết mất chữ.
- Kiểm local dữ liệu thật: build + lint OK, console 0 lỗi. Mục 4 không tái hiện ở local (nghi do Department đang chọn).
- Tiếp (Eric 23/09): bấm dòng Findings chỉ lọc bảng về 1 dòng, không có nội dung report → thêm `showReport` (screens2.js):
  dialog chi tiết cho CMR-CAR (như showCmrDetail), ECAR (như showEcarDetail), allData (MCAR/AMO-ECAR/OSR… + workflow stages);
  EIS/QCS dùng showEis/showQcs; PAVOI giữ màn list+detail. Dòng Work Queue, Ctrl K, Overview cũng mở dialog. Kiểm local 6 bảng OK.
- Còn: gửi 1 feedback thật trên live (cần đăng nhập — Eric tự làm); mục 4 nếu còn trống thì hỏi tab nào. Backup nguồn: `rebuild UIUX/beta-src-bak-20260923/`.

## ✅ r168-i1 — OSR / MOSR ĐỦ 6 FORM (22/09/2026, ĐÃ PUSH 37e1902 — live, khớp Galileo 1.491 / 2026: 509)

- Galileo ($count + distinct): 1.491 report (2026: 509) trong 5 + 25 đơn vị; trước chỉ 1.277 (thiếu 4 form: OSR cũ,
  4. Confidential OSR, Confidential OSR, Confidential MOSR = 214). Eric chốt tính Confidential ở page này; Safety MSAG không đụng.
- Galileo có 32 dòng trùng `valid_to eq null` cùng report_id → app dedup theo modified_date (đúng).
- Luật mới (Eric 22/09): verify số từ Galileo TRƯỚC, web chỉ để so.

## ✅ r168 — TẢI NHANH KHI GALILEO TREO + CACHE ĐỦ LƯỢT 2 (22/09/2026, ĐÃ PUSH a0581bc — live)

- Kiểm live 22/09: lần nguội đầu sau deploy xong 7.022 report / 0 cảnh báo ở 253s (~33s là màn đăng nhập của tab mới;
  `dwreporting_users` treo cả 3 bản 90s, lượt thử lại bản 3 về 6,3s; custom field CMR-CAR bản 3 thắng).
  Tải lại có cache: 1,2s, 0 request Galileo, KPI 7 51/59, `M.consistency()` 0 lệch.
- Tách chặng (Eric hỏi Supabase / Cloudflare): Worker tự trả (403) 0,2s 6/6 · cổng Galileo gọi thẳng (401) 0,8s 6/6 ·
  Worker→Galileo truy vấn thật 1–1,8s nhưng có lần 27s dù `$top=1`. Supabase log 24h: 45 request đều 2xx, token TB 0,5s
  (max 1,0s), `users` TB 0,3s (max 0,7s). ⇒ chậm nằm ở Galileo CHẠY TRUY VẤN (kẹt từng query vài phút), không ở Cloudflare/Supabase.
- Ứng viên tiếp: cache `dwreporting_users` riêng (ít đổi, không gắn rev) như wfRaw — lần nguội vừa rồi chờ nó 2,5 phút.

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
  → 01/10/2026: thay bằng `HuongDan_SuDung_QA_AMO_Dashboard_r186.docx` (hình đánh số + bảng giải thích), slide `TrinhBay_QA_AMO_Dashboard_r186.pptx`,
  email `mail/Email-thong-bao-giao-dien-moi-QA-AMO-Dashboard-2026-10-01.md`; bản r167 / r128 / email 22-09 đã xoá. Nguồn dựng: `rebuild UIUX/beta-src/manual.js`, `deck.js`, ảnh `rebuild UIUX/manual-shots-r186/`.
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
