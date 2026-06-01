# KPI 2 – Phát hiện sớm (Early Detection): Các điểm cần Lãnh đạo quyết định

> **Mục đích file này:** brief nội bộ liệt kê toàn bộ các điểm thiết kế của chỉ số **KPI 2** hiện đang xây dựng theo đề xuất kỹ thuật/cá nhân. Dùng làm nguồn để soạn tài liệu trình họp Lãnh đạo (Cowork sẽ viết thành bản hoàn chỉnh).
>
> **Quy ước:** `(đang áp dụng)` = cấu hình hiện tại của bản build; `(khuyến nghị)` = đề xuất của nhóm kỹ thuật. Mỗi mục đề nghị Lãnh đạo chọn **một** phương án.

---

## Bối cảnh chung

- **MCAR** = phát hiện của kiểm tra/đánh giá **nội bộ**.
- **AMO-ECAR** = phát hiện do **nhà chức trách (authority)** nêu cho AMO.
- **"Phát hiện sớm"** = vấn đề mà nhà chức trách nêu (AMO-ECAR) thì nội bộ (MCAR) đã phát hiện **trước** đó.
- **KPI 2** đo tỷ lệ này — càng cao càng tốt (nội bộ chủ động phát hiện trước nhà chức trách).

> ⚠️ **Lưu ý thuật ngữ:** "AMO-ECAR" và "AMO ECAR" là **cùng một** loại report của đơn vị QA AMO — **khác** với report "ECAR" của đơn vị TQA. KPI 2 chỉ dùng "AMO ECAR" (mẫu số) và "MCAR" (nguồn phát hiện nội bộ).

---

## Các điểm cần quyết định

### Quyết định 1 — Định nghĩa & ý nghĩa của KPI 2
**Bối cảnh:** Chọn công thức và ý nghĩa nghiệp vụ của KPI 2.

| Chọn | Phương án | Mô tả / Ưu – Nhược |
|:--:|---|---|
| ☐ | **PA1** *(đang áp dụng, khuyến nghị)* | Tỷ lệ = (Số AMO-ECAR mà nội bộ đã phát hiện trước qua MCAR) ÷ (Tổng AMO-ECAR) × 100%. Ý nghĩa rõ, giá trị 0–100%. |
| ☐ | **PA2** *(bản cũ)* | Tỷ lệ = Tổng MCAR ÷ Tổng AMO-ECAR × 100% (so sánh khối lượng). Thường >100%, khó diễn giải. |

**Ghi chú của Lãnh đạo:** ______________________________________________

---

### Quyết định 2 — Tiêu chí coi là "đã phát hiện sớm / trùng"
**Bối cảnh:** Khi nào một AMO-ECAR được tính là đã được MCAR phát hiện sớm.

| Chọn | Phương án | Mô tả / Ưu – Nhược |
|:--:|---|---|
| ☐ | **PA1** | Chỉ cần **cùng nhóm Nature of finding**. Đơn giản, xác định, nhưng khớp rộng. |
| ☐ | **PA2** *(đang áp dụng)* | **Cùng Nature HOẶC** mô tả Finding description giống nhau ≥ ngưỡng. Cân bằng. |
| ☐ | **PA3** | **Cùng Nature VÀ** mô tả giống. Chặt nhất, ít cặp, tỷ lệ thấp hơn. |

**Ghi chú của Lãnh đạo:** ______________________________________________

---

### Quyết định 3 — Điều kiện thời gian
**Bối cảnh:** Có yêu cầu MCAR phát hiện trước AMO-ECAR hay không.

| Chọn | Phương án | Mô tả / Ưu – Nhược |
|:--:|---|---|
| ☐ | **PA1** *(đang áp dụng, khuyến nghị)* | MCAR phải có ngày phát hiện (raised_date) **sớm hơn** AMO-ECAR — đúng bản chất "phát hiện sớm". |
| ☐ | **PA2** | Không yêu cầu thứ tự thời gian — chỉ cần trùng nội dung/Nature là tính. |

**Ghi chú của Lãnh đạo:** ______________________________________________

---

### Quyết định 4 — Cơ chế xác nhận *(quan trọng cho tính tin cậy kiểm toán)*
**Bối cảnh:** Hệ thống tự tính, hay cần người duyệt xác nhận từng cặp.

| Chọn | Phương án | Mô tả / Ưu – Nhược |
|:--:|---|---|
| ☐ | **PA1** *(đang áp dụng)* | **Tự động hoàn toàn** — hệ thống tự đối chiếu và tính. Nhanh, không tốn công, nhưng có rủi ro khớp nhầm và **không có dấu vết người xác nhận**. |
| ☐ | **PA2** *(bản đề xuất ban đầu)* | **Bán tự động** — hệ thống gợi ý, QA/admin xác nhận từng cặp; lưu lịch sử (audit trail). Chính xác, có trách nhiệm giải trình, nhưng tốn công + cần lưu trữ riêng. |
| ☐ | **PA3** | **Hybrid** — tự động tính, admin có quyền loại trừ/điều chỉnh ngoại lệ. |

**Ghi chú của Lãnh đạo:** ______________________________________________

---

### Quyết định 5 — Ngưỡng "giống nội dung" *(chỉ áp dụng nếu QĐ2 = PA2 hoặc PA3)*
**Bối cảnh:** Mức tương đồng mô tả Finding description để coi là cùng nội dung.

| Chọn | Phương án | Mô tả |
|:--:|---|---|
| ☐ | **40%** | Khớp rộng — bắt nhiều cặp, dễ khớp nhầm. |
| ☐ | **50%** *(đang áp dụng)* | Mức cân bằng đề xuất. |
| ☐ | **60%** | Chặt hơn. |
| ☐ | **70%** | Rất chặt — ít khớp nhầm nhưng dễ bỏ sót cặp thật. |

**Ghi chú của Lãnh đạo:** ______________________________________________

---

### Quyết định 6 — Mức gom nhóm Nature of finding
**Bối cảnh:** Quy nhãn Nature về nhóm cha hay giữ nhãn chi tiết.

| Chọn | Phương án | Mô tả / Ưu – Nhược |
|:--:|---|---|
| ☐ | **PA1** *(đang áp dụng, khuyến nghị)* | Quy về **nhóm cha (parent)**. Ổn định khi người nhập chọn cha hoặc con khác nhau. |
| ☐ | **PA2** | Dùng **nhãn chi tiết** đúng như nhập. Chính xác theo nhãn nhưng dễ lệch nếu nhập ở mức khác nhau. |

**Ghi chú của Lãnh đạo:** ______________________________________________

---

### Quyết định 7 — Biểu đồ KPI 2 trên trang KPI Charts
**Bối cảnh:** Cách trình bày biểu đồ kèm chỉ số.

| Chọn | Phương án | Mô tả |
|:--:|---|---|
| ☐ | **PA1** *(đang áp dụng)* | Cột MCAR vs AMO-ECAR theo từng nhóm Nature + đường tỷ lệ % — bức tranh khối lượng theo lĩnh vực. |
| ☐ | **PA2** | Bỏ biểu đồ, chỉ giữ con số % phát hiện sớm cho gọn. |
| ☐ | **PA3** | Vẽ theo Quý (như bản đầu). |

**Ghi chú của Lãnh đạo:** ______________________________________________

---

### Quyết định 8 — Cột Finding Description ở trang AMO-ECAR & MCAR
**Bối cảnh:** Có thêm cột mô tả finding để người dùng đọc nhanh không.

| Chọn | Phương án | Mô tả |
|:--:|---|---|
| ☐ | **PA1** *(đang áp dụng)* | Thêm cột Mô tả finding (bỏ cột Finding Level ít dùng) để vừa màn hình. |
| ☐ | **PA2** | Giữ như cũ (có Finding Level, không có mô tả). |
| ☐ | **PA3** | Giữ cả hai cột (có thể tràn ngang trên màn nhỏ). |

**Ghi chú của Lãnh đạo:** ______________________________________________

---

### Quyết định 9 — Ngôn ngữ giao diện Dashboard
**Bối cảnh:** Ngôn ngữ hiển thị toàn bộ dashboard.

| Chọn | Phương án | Mô tả |
|:--:|---|---|
| ☐ | **PA1** *(chỉ đạo mới)* | **Tiếng Anh** toàn bộ giao diện. |
| ☐ | **PA2** *(hiện tại)* | **Tiếng Việt** như hiện tại. |
| ☐ | **PA3** | Song ngữ (nhãn Anh + chú thích Việt). |

**Ghi chú của Lãnh đạo:** ______________________________________________

---

### Quyết định 10 — Kỳ báo cáo chuẩn cho con số KPI 2 chính thức
**Bối cảnh:** Bộ lọc Năm/Quý vẫn có sẵn; câu hỏi là con số "chính thức" báo cáo theo kỳ nào.

| Chọn | Phương án | Mô tả |
|:--:|---|---|
| ☐ | **PA1** | Theo **Năm**. |
| ☐ | **PA2** | Theo **Quý**. |
| ☐ | **PA3** | **Lũy kế** từ đầu (toàn bộ dữ liệu). |

**Ghi chú của Lãnh đạo:** ______________________________________________

---

## Bảng tổng hợp lựa chọn

| Mục | Nội dung quyết định | Phương án chọn | Ghi chú |
|:--:|---|:--:|---|
| 1 | Định nghĩa & ý nghĩa KPI 2 | | |
| 2 | Tiêu chí "đã phát hiện sớm / trùng" | | |
| 3 | Điều kiện thời gian (MCAR sớm hơn?) | | |
| 4 | Cơ chế xác nhận (tự động / có người duyệt) | | |
| 5 | Ngưỡng "giống nội dung" | | |
| 6 | Mức gom nhóm Nature | | |
| 7 | Biểu đồ KPI 2 | | |
| 8 | Cột Finding Description | | |
| 9 | Ngôn ngữ giao diện | | |
| 10 | Kỳ báo cáo chuẩn | | |

**Người chủ trì cuộc họp:** ............................................

**Chữ ký / Ngày:** ............................................

---

## Ghi chú cho Cowork (người soạn tài liệu)

- Chuyển brief này thành tài liệu trình họp hoàn chỉnh (Word/PDF), **tiếng Việt**.
- Giữ nguyên 10 mục quyết định, mỗi mục có ô tick để Lãnh đạo chọn + chỗ ghi chú.
- Có thể bổ sung phần mở đầu (mục tiêu KPI 2, ảnh hưởng tới báo cáo) và phần kết (cam kết cập nhật theo phương án được chốt).
- Nhấn mạnh **Quyết định 4** (tự động vs có người duyệt) vì ảnh hưởng tính tin cậy kiểm toán.
- Bản build hiện tại đã triển khai theo các phương án `(đang áp dụng)`; nếu Lãnh đạo chọn khác, nhóm kỹ thuật sẽ điều chỉnh.
