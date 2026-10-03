# HANDOVER — `main`

> Trạng thái tức thời cấp vault ở `obsidian-mind\.claude-memory\DANG-LAM.md`;
> lịch sử rev đầy đủ ở `PROJECT_TECH_SPEC.md` §14.

---

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
1. **Bật `AUTH_MODE: enforce`** cho `galileo-proxy` — trước đó F5 màn LED (`https://vjc-qa-amo.com/?kiosk=1`) + mọi máy đang mở;
   xem log `npx.cmd wrangler tail galileo-proxy` không còn `soft-allow` từ trình duyệt. Lùi: đặt lại `soft`.
2. Worker `galileo-ai` (khoá Anthropic) — chưa xem có kiểm đăng nhập không.
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
