---
name: quy-trinh-chuan
description: >-
  Quy trình chuẩn end-to-end cho QA AMO Dashboard: từ lúc sửa code → bump version →
  cập nhật tài liệu kèm theo → commit → hook backup → push/deploy → ghi nhận. Dùng
  skill này khi người dùng hỏi "quy trình", "flow chuẩn", "sửa xong thì làm gì",
  "commit thế nào", "ghi nhận vào đâu", "cần sửa file nào kèm theo", "push/backup ra
  sao", hoặc bất cứ khi nào vừa sửa xong code và cần biết các bước tiếp theo. Skill này
  là ĐIỀU PHỐI — nó gọi tới các skill con (probe-spec, cap-nhat-revision, bao-cao-tuan,
  kiem-tra-dong-bo) đúng lúc. Dùng trong repo qa-amo-dashboard.
---

# Quy trình chuẩn — từ sửa code đến deploy

Đây là checklist xâu chuỗi toàn bộ. Mục tiêu: mỗi thay đổi được **ghi nhận đúng chỗ**,
tài liệu không bao giờ lệch code, và backup/deploy diễn ra nhất quán. Các bước tô đậm
là skill con — mở skill đó khi tới bước tương ứng.

```
 ┌─ dữ liệu Galileo? ─► [probe-spec]  probe live → spec → implement
 │
 ▼
① SỬA CODE            chỉ trong repo/index.html (surgical). KHÔNG sửa bản OneDrive.
② BUMP VERSION        [cap-nhat-revision]  feature→r+1 · bugfix→+iN · 1 bump/spec
③ CẬP NHẬT TÀI LIỆU   theo MA TRẬN bên dưới (đây là bước hay bị quên nhất)
④ COMMIT              rNN: … (bản rev)  |  docs:/chore:/build: (hạ tầng)
⑤ HOOK TỰ CHẠY        backup index.html→OneDrive + regen NHAT_KY  (đừng làm tay)
⑥ PUSH / DEPLOY       git push → GitHub Pages (vjc-qa-amo.com) — khi user muốn deploy
⑦ GHI NHẬN NGOÀI GIT  email/họp/quyết định → GHI_NHAN_TUAN.md (workspace)
```

## ① Sửa code

- **Chỉ sửa `index.html` trong repo chính** `F:\App Build\GitHub\qa-amo-dashboard`.
  KHÔNG sửa bản backup OneDrive (bị hook ghi đè). Sửa phẫu thuật — chỉ đụng đúng chỗ.
- Nếu thay đổi liên quan **dữ liệu Galileo/OData** → theo skill **`probe-spec`** trước
  (probe dữ liệu sống → viết spec có anchor → implement). Đừng đoán tên field.
- Xác định ngay: đây là **tính năng mới** hay **sửa lỗi thuần**? → quyết định bump ở ②.

## ② Bump version — skill `cap-nhat-revision`

Sửa `APP_REV` trong `index.html`:
- Tính năng / đổi layout / bỏ chức năng → `rNN → r(NN+1)`, reset issue.
- Sửa lỗi thuần → **giữ `rNN`**, tăng hậu tố `-i1/-i2`.
- Một lần bump cho một spec — không gộp nhiều mối quan tâm độc lập.

## ③ Cập nhật tài liệu kèm theo — MA TRẬN (bước quan trọng nhất)

Đây là câu trả lời cho "sửa xong ghi nhận vào đâu / sửa file nào kèm theo":

| Loại thay đổi | File PHẢI cập nhật |
|---|---|
| **Mọi rev đáng kể** (feature / đổi logic) | `PROJECT_TECH_SPEC.md`: ① bump `Version hiện tại` + ngày ở header · ② thêm 1 dòng vào **§14 Lịch sử version** · ③ sửa/thêm § nội dung tương ứng |
| Đổi **config / endpoint / worker / `ORG_UNIT` / giới hạn OData / mapping page→data** | `TECHNICAL_REFERENCE.md` |
| Đụng **subsystem có spec riêng** | Spec đó: `PAVOI_RFI_Spec.md` · `KPI2_DECISION_POINTS.md` · (workspace) `FORM_EIS_DESIGN.md` · `USER_DELETE_SPEC.md` |
| Phát hiện **invariant / gotcha / quy ước mới** | `CLAUDE.md` (repo) — mục Conventions / Invariants / Known issues |
| Bugfix nhỏ, cosmetic, không đổi kiến trúc | Thường không cần — chỉ thêm dòng §14 nếu đáng ghi |

Nguyên tắc: **spec phản ánh code THỰC TẾ**, không phải ý định. Probe lại code khi mô tả
(vd đọc đúng số dòng, tên hàm) — đừng chép từ trí nhớ. Một tính năng lớn (subsystem
mới) nên có **§ riêng** trong `PROJECT_TECH_SPEC.md`, không nhét vào mục cũ.

## ④ Commit

- **Commit bản rev** (có đổi `APP_REV`): message **bắt đầu bằng `rNN`**:
  `rNN[-iM]: <mô tả>` — bắt buộc để `gen-changelog.sh` nhận diện đưa vào nhật ký.
- **Commit hạ tầng/tài liệu độc lập**: tiền tố khác — `docs:` / `chore:` / `build:`.
  Chúng KHÔNG được bắt đầu bằng `rNN` (tránh lẫn vào changelog phiên bản app).
- **Gộp hay tách code + doc?**
  - Doc update **đi kèm ngay một rev** → gộp vào commit `rNN` đó (một thay đổi trọn vẹn).
  - Đợt cập nhật doc **lớn/độc lập** (vd bổ sung spec cho nhiều rev cũ) → commit `docs:` riêng.
- Kết message bằng dòng `Co-Authored-By` theo quy ước.

## ⑤ Hook tự chạy — ĐỪNG làm tay

Sau `git commit`, `post-commit` hook tự động:
1. `cp index.html → OneDrive/…/index.html` (backup app — chỉ file này được mirror).
2. Regen `NHAT_KY_CAP_NHAT_APP.md` (nhật ký cho báo cáo tuần).

**Xác nhận** thấy 2 dòng `[post-commit] Đã backup…` và `[gen-changelog] Đã tạo…`.
Nếu không thấy → hook có thể bị xoá; kiểm tra `.git/hooks/post-commit`.

## ⑥ Push / deploy

- `git push` → GitHub Pages tự deploy lên `vjc-qa-amo.com` (deploy = push `main`).
- **Chỉ push khi thay đổi đã sẵn sàng lên production / khi người dùng yêu cầu.** Push
  cũng là lớp **backup đám mây** (remote `origin` trên GitHub) cho toàn bộ repo, không
  chỉ index.html.

## ⑦ Ghi nhận việc ngoài git

Email liên quan, họp, phân tích dữ liệu, quyết định nghiệp vụ → ghi tay vào
`GHI_NHAN_TUAN.md` (workspace), theo tuần ISO. Skill `bao-cao-tuan` đọc file này cùng
nhật ký khi viết báo cáo.

## 3 lớp save/backup (tóm tắt)

1. `git commit` — lịch sử phiên bản (local).
2. **Hook** — mirror `index.html` sang OneDrive + regen nhật ký (tự động).
3. `git push` — backup toàn repo lên GitHub (`origin`) + deploy. OneDrive cũng tự
   sync workspace lên cloud.

> Lưu ý nguồn chân lý: `index.html` được mirror sang OneDrive; **các file spec khác chỉ
> "backup" qua git/GitHub** (bản stale trong workspace đã bỏ). Muốn kiểm tra lệch bất kỳ
> lúc nào → skill `kiem-tra-dong-bo`.
