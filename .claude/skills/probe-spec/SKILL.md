---
name: probe-spec
description: >-
  Quy trình Probe→Spec→Implement cho mọi thay đổi liên quan dữ liệu Galileo OData
  trong QA AMO Dashboard. Dùng skill này khi người dùng muốn thêm/sửa tính năng đọc
  dữ liệu Galileo, viết spec, đụng tới report/finding/audit/KPI/EAV field, hoặc trước
  khi sửa logic dữ liệu trong index.html. Kích hoạt khi nghe "thêm trang/cột từ
  Galileo", "field này lấy ở đâu", "viết spec", "làm KPI mới", "query OData". Mục tiêu:
  không đoán mò shape dữ liệu, tránh HTTP 400 và mất dữ liệu âm thầm. Chỉ dùng trong
  repo qa-amo-dashboard.
---

# Probe → Spec → Implement (Galileo OData)

Galileo là OData API nhiều cạm bẫy: filter sai một chỗ là HTTP 400 hoặc mất dữ liệu
mà không báo lỗi. Vì vậy **không bao giờ dựa vào trí nhớ/tài liệu** cho tên field hay
hành vi query — luôn dò dữ liệu sống trước, rồi mới viết spec, rồi mới code.

```
(1) PROBE  →  (2) SPEC  →  (3) IMPLEMENT
```

## 1. PROBE — dò dữ liệu sống trước

- Xác minh shape dữ liệu thật qua **DevTools Console** (OData query trực tiếp) trước
  khi viết bất kỳ dòng spec nào: tên field, kiểu, có null không, quan hệ join.
- **Nếu chưa có kết quả probe, dừng lại và nhờ developer chạy query trước.** Đừng
  đoán rồi chạy.

### 1.0 BẮT BUỘC — chốt phạm vi org unit TRƯỚC khi đếm bất cứ thứ gì

Mọi con số đếm được (tổng report, mẫu số KPI, số dòng một bảng) đều **vô nghĩa nếu
phạm vi org unit sai**. Org unit trên Galileo là **CÂY**, không phải danh sách phẳng:
lọc đúng cấp cha sẽ rụng sạch report gắn vào cấp con mà **không có một dấu hiệu lỗi
nào** — trong app mọi thứ vẫn cộng khớp.

Vết r143 (25/08/2026): `org_unit_name eq 'QA AMO'` làm mất **69 report**
(20 PAVOI, 26 AMO-HAZARD LOG, 22 AMO-HIRA, 1 Aircraft Inspection). Bug sống nhiều
tháng vì tổng trong app luôn tự khớp; chỉ khi Eric mở Coruson đếm tay (39 PAVOI Open
so với 35 trên app) mới lộ ra.

**Chạy hai query này trước mỗi lần probe liên quan tới đếm/KPI:**

```js
// (a) Cây org unit — hậu duệ của QA AMO gồm những ai?
const QA_AMO_ID = '25eb6426-1bcf-49b7-947e-4b39ac82859e';   // 'QA AMO', code MQA
const h = await fetchAll(G_URL + 'dwreporting_organisational_unit_hierarchy' +
  '?$select=organisational_unit_id,name,parent_id,is_archived,org_type_hierarchy', true);
const byParent = {}; h.forEach(r => (byParent[r.parent_id] ||= []).push(r));
const desc = []; (function walk(id){ (byParent[id]||[]).forEach(c => {
  if(!c.is_archived){ desc.push(c); walk(c.organisational_unit_id); } }); })(QA_AMO_ID);
console.table(desc.map(d => ({ ten: d.name, duong: d.org_type_hierarchy })));

// (b) Report của mình đang nằm ở org unit nào? (đổi report_title cho phù hợp)
const rows = await fetchAll(G_URL + 'dwreporting_report_summary' +
  '?$select=report_id,report_number,report_status,org_unit_name,modified_date' +
  '&$filter=' + encodeURIComponent("report_title eq 'PAVOI'"), true);
console.table(rows.reduce((o,r)=>{ const k=r.org_unit_name||'(rỗng)'; o[k]=(o[k]||0)+1; return o; },{}));
```

Kết quả (b) phải giải thích được **từng** org unit: cái nào là của MQA (cha hoặc hậu
duệ), cái nào là phòng khác. `TQA` và `OQA` nằm ở nhánh
`VietjetAir | SQA | Quality Assurance` → **khác phòng, loại đúng**. Nếu thấy một org
unit lạ mà không giải thích được, **dừng và hỏi** — đừng lẳng lặng gộp hay bỏ.

### 1.1 BẮT BUỘC — đối chiếu tổng với Coruson ít nhất MỘT lần

Một mẫu số chưa từng được đếm ngoài hệ thống là một mẫu số **chưa được kiểm chứng**.
Trước khi chốt bất kỳ KPI nào: mở Coruson, lọc đúng phạm vi, đọc số `n of n items`,
so với app. Lệch dù chỉ 1 record → truy tới nơi, đừng làm tròn cho qua.

Khi lệch, kiểm theo thứ tự này (từ hay gặp nhất):
1. **Phạm vi org unit** — thiếu ban con? (mục 1.0)
2. **Phạm vi năm** — bộ lọc năm chạy trên `raised_date`, nên report **mở từ năm cũ mà
   chưa đóng** vẫn thuộc năm cũ. Vết 25/08/2026: app hiện 38 PAVOI Open cho 2025+2026
   còn Coruson liệt kê 39 — cái thứ 39 là `PAVOI-099` raised 2023, vẫn đang mở. Đây là
   **đúng**, không phải thiếu dữ liệu. Danh sách Coruson thường **không lọc năm**.
3. **Dedup** — `report_summary` append-only, xem I6.
4. Sau cùng mới tới giả thuyết lỗi nhập liệu.

## 2. SPEC — viết spec find-replace phẫu thuật

- Spec là Markdown mô tả **anchor text chính xác** cần tìm và đoạn thay thế, kèm
  **safety gate**: "abort nếu không tìm thấy anchor".
- **Một lần bump `APP_REV` cho một spec** (xem skill `cap-nhat-revision`). Không gộp
  nhiều mối quan tâm độc lập.
- Thay đổi phải phẫu thuật: chỉ đụng đúng chỗ task yêu cầu. `index.html` ~8.700 dòng —
  không "cải thiện" code lân cận.

## 3. IMPLEMENT

- Áp spec vào `index.html`. (Claude chat không tự sửa `index.html` trực tiếp; áp qua
  spec để có anchor + gate kiểm soát.)
- Sau khi xong: bump rev + commit qua skill `cap-nhat-revision`.

## 11 INVARIANT bất khả xâm phạm (vi phạm = 400 hoặc mất dữ liệu)

Đây là bản rút gọn để nhớ nhanh — chi tiết đầy đủ ở `CLAUDE.md` mục "Galileo OData —
invariants". Đọc lại `CLAUDE.md` khi cần ngữ cảnh.

| # | Rule |
|---|------|
| I1 | KHÔNG filter EAV theo `report_id` trong `$filter` (→ 400). Fetch theo `field_name`, lọc lại bằng JS `Set`. |
| I2 | Query `field_name` chung phải hẹp lại: thêm `report_raised_date ge <ISO>` + chunk danh sách `field_name` (~8/request), tránh 14k dòng timeout. |
| I3 | Tên cột EAV khác nhau: `report_form_section_field` dùng `text_value`; `report_field` dùng `value_text`. Đừng đảo. |
| I4 | UUID trong `$filter` KHÔNG bọc nháy; field chuỗi thì phải có nháy đơn. |
| I5 | MaxNodeCount = 100; mỗi OR = 2 node → chunk ≤8 `field_name` mỗi request. |
| I6 | `report_summary` là append-only: dedup client-side theo `modified_date` mới nhất/`report_id`; bỏ record trống `report_number`. |
| I7 | KHÔNG fetch `audit_workflow` toàn cục (100k+ dòng). Lazy theo `audit_id` hoặc `$apply`. |
| I8 | Lọc loại document theo `type_id` UUID, KHÔNG theo tiêu đề `document_type`. |
| I9 | `section_id` là khoá repeater tin cậy duy nhất (không dùng thời gian tạo). |
| I10 | Lọc/gộp Category theo `category_id` UUID, đọc master từ `dwanalytics_report_category`. |
| I11 | Mọi `fetchAll` phụ (modal/lazy/detail) phải truyền `skipOv=true` để không cướp overlay. |
| I12 | Org unit là **CÂY**. Lọc theo `org_unit_id` của cha **và mọi hậu duệ** (giải từ `dwreporting_organisational_unit_hierarchy`), KHÔNG lọc theo `org_unit_name` — lọc tên cấp cha rụng sạch report của ban con, và tên ban không duy nhất toàn cây. Xem mục 1.0. |

## Khi nào DỪNG và hỏi (trước khi code)

- Field/shape chưa được xác minh qua probe.
- Thay đổi phải đụng `loadData()`, `ORG_UNIT`, hay filter dùng chung.
- Nhiều cách làm hợp lệ nhưng tradeoff khác nhau rõ rệt.
- Cần UUID Category/Type nhưng chưa xác nhận trong dữ liệu sống.
- Task gộp nhiều mối quan tâm độc lập vào một rev.

- Một con số đếm/KPI chưa từng được đối chiếu với Coruson (mục 1.1).
- Probe trả về một `org_unit_name` không giải thích được là của phòng nào (mục 1.0).

**Nếu dữ liệu trông sai sau khi sửa code** → giả định là lỗi nhập liệu Galileo, không
phải bug code. Đừng bù bằng thêm code; báo lại developer xác nhận.

⚠️ **Ngoại lệ quan trọng của câu trên (vết r143):** nếu cái sai là **TỔNG bị THIẾU**
so với Coruson, đừng vội đổ cho nhập liệu — kiểm **phạm vi query** trước (org unit,
năm, dedup). Dữ liệu thiếu vì lọc sai phạm vi trông y hệt dữ liệu chưa được nhập, mà
lần này nguyên nhân nằm ở code.
