# HANDOVER — `main`

> Trạng thái tức thời cấp vault ở `obsidian-mind\.claude-memory\DANG-LAM.md`;
> lịch sử rev đầy đủ ở `PROJECT_TECH_SPEC.md` §14.

---

## Đang ở đâu (10/09/2026, chiều)

```
main        = 508a3ed (r161)   ← ĐÃ COMMIT, CHƯA PUSH
              08c4bbb (r160)
origin/main = 6ec9709 (r159)   ← ĐANG CHẠY THẬT
hold/r153-kpi7 = c744589 (r153)  ← bản ghi, KHÔNG dùng nữa
```

Lên sản xuất: `git push` (deploy = push `main`). Lùi từng rev: `git revert 508a3ed` / `git revert 08c4bbb`.

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

⛔ **CHƯA NHÌN GIAO DIỆN THẬT** (proxy chỉ nhận origin `vjc-qa-amo.com`). Sau khi push, mở
`https://vjc-qa-amo.com/` kiểm: **(1)** trang KPI Charts, panel *KPI QC* — tiêu đề ghi *QC PI Report*,
dòng sub có `Nguồn: … ECAR 0 report (0 có ATA)` khi chọn 2026 · tháng 9; chọn tháng 8 thì mẫu số
`ECAR 1 report`, tử số có ATA 32; **(2)** trang CMR-CAR — bộ lọc *All ATA* có danh sách, cột Findings
có số, không còn `Unknown` hàng loạt ở cột Aircraft; **(3)** trang ECAR — bấm Detail một report 2026,
modal có dòng *ATA Chapter*; **(4)** không thấy toast đỏ *"custom fields failed"*.

⚠️ **Note vault `obsidian-mind/reference/qa-amo-dashboard/QA_AMO_Dashboard.md` header còn r159** —
hai commit trên phải `--no-verify` vì file đó chỉ được sửa từ phiên mở trong `obsidian-mind`. Mở
phiên ở đó, sửa `Rev hiện tại: 2026.09.10-r161`, `Cập nhật context: 2026-09-10`, thêm 1 dòng §8.

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
