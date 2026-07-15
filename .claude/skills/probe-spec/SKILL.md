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

## Khi nào DỪNG và hỏi (trước khi code)

- Field/shape chưa được xác minh qua probe.
- Thay đổi phải đụng `loadData()`, `ORG_UNIT`, hay filter dùng chung.
- Nhiều cách làm hợp lệ nhưng tradeoff khác nhau rõ rệt.
- Cần UUID Category/Type nhưng chưa xác nhận trong dữ liệu sống.
- Task gộp nhiều mối quan tâm độc lập vào một rev.

**Nếu dữ liệu trông sai sau khi sửa code** → giả định là lỗi nhập liệu Galileo, không
phải bug code. Đừng bù bằng thêm code; báo lại developer xác nhận.
