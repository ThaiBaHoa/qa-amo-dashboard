# HANDOVER — nhánh `fix/r154-report-status`

> Nhánh này **tách khỏi `origin/main` (r152)**, chỉ chứa **r154**. **KHÔNG có r153.**
> Trạng thái tức thời cấp vault ở `obsidian-mind\.claude-memory\DANG-LAM.md`;
> lịch sử rev đầy đủ ở `PROJECT_TECH_SPEC.md` §14.

---

## Vì sao có nhánh này

`main` ở máy làm việc đang giữ **r153** (KPI 7 đổi điểm tham chiếu, commit `c744589`)
**chưa được duyệt và cố ý chưa push**. Deploy là push `main` → GitHub Pages, nên đẩy
`main` lên là r153 lên sản xuất luôn. r154 không liên quan gì tới KPI 7, nên tách ra
nhánh riêng để đi trước.

Kiểm chứng việc tách sạch: `git diff origin/main -- index.html` trên nhánh này ra **đúng
11 hunk** giống hệt diff r154-only trên `main` (`c744589..afeb8bf`), chỉ lệch số dòng do
r153 không có mặt. Không một dòng KPI 7 nào lọt sang.

⚠️ **Nhánh này KHÔNG deploy.** Site `vjc-qa-amo.com` chỉ đổi khi `main` được push.
Muốn r154 lên sản xuất mà vẫn giữ r153 lại thì merge nhánh này vào `main` **phía
GitHub**, rồi ở máy `git fetch && git reset --hard origin/main` và commit lại r153 lên
trên — hoặc chờ r153 được duyệt rồi push cả hai.

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
