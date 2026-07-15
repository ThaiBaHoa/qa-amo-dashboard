---
name: cap-nhat-revision
description: >-
  Cập nhật số phiên bản APP_REV (r###) trong index.html và commit đúng chuẩn cho
  QA AMO Dashboard. Dùng skill này khi người dùng nói "bump rev", "lên phiên bản",
  "cập nhật revision", "release thay đổi này", "r112 xong rồi commit", "đây là feature
  mới hay bugfix", hoặc khi vừa hoàn tất một spec/thay đổi và cần đóng gói + commit.
  Skill giữ đúng luật versioning và định dạng commit để nhật ký changelog tự sinh
  nhận diện được. Chỉ dùng trong repo qa-amo-dashboard.
---

# Cập nhật revision (APP_REV) + commit

App có một biến `APP_REV = 'YYYY.MM.DD-rNN[-iM]'` trong `index.html` — đây là số
phiên bản hiển thị. Mỗi lần giao một thay đổi, cập nhật nó **đúng luật** rồi commit
với **đúng định dạng message**, vì `scripts/gen-changelog.sh` bóc `r###` từ đầu
commit message để dựng nhật ký cho báo cáo tuần.

## Luật đánh số (quan trọng — sai là lệch changelog)

- **Tính năng mới / đổi layout / bỏ chức năng** → tăng `rNN → r(NN+1)`, reset issue.
  Ví dụ: `r112` → `r113`.
- **Sửa lỗi thuần (không đổi tính năng)** → **giữ nguyên `rNN`**, tăng hậu tố issue:
  `r113` → `r113-i1` → `r113-i2`. Ghi các fix là "Issue 1/2/3" dưới rev đó.
- **Một lần bump `APP_REV` cho một spec** — KHÔNG gộp nhiều spec không liên quan vào
  cùng một rev. Mỗi mối quan tâm độc lập = một rev riêng.
- Phần ngày `YYYY.MM.DD` = ngày phát hành rev đó.

Nếu không chắc thay đổi là feature hay bugfix, hỏi người dùng trước khi bump — ranh
giới này quyết định số tăng thế nào.

## Quy trình

1. **Tìm dòng khai báo** trong `index.html`:
   ```
   grep -n "APP_REV" index.html | head -3
   ```
2. **Cập nhật giá trị** theo luật trên (sửa cả phần ngày). Đây thường là chỗ duy nhất
   cần đổi cho việc bump — đừng đụng code khác.
3. **Commit** với message bắt đầu bằng token phiên bản:
   ```
   git add index.html <file khác nếu có>
   git commit -m "rNN[-iM]: <mô tả ngắn việc đã làm>"
   ```
   - Message **phải bắt đầu** bằng `rNN` hoặc `rNN-iM` (vd `r113: ...`, `r113-i1: ...`)
     để changelog nhận diện. Commit hạ tầng/tài liệu (không phải rev app) thì dùng
     tiền tố khác (`build:`, `docs:`) — chúng sẽ hiện dạng thường trong changelog.
   - Kết message bằng dòng `Co-Authored-By` theo quy ước repo.
4. **Sau commit, hook tự chạy** (`post-commit`): backup `index.html` sang OneDrive +
   sinh lại `NHAT_KY_CAP_NHAT_APP.md`. Không cần làm tay. Xác nhận output hook hiện ra.
5. **Push khi người dùng muốn deploy** — `git push` (deploy = GitHub Pages trên `main`).
   Đừng tự push nếu người dùng chưa yêu cầu.

## Ví dụ message

**Feature mới:**
Input: thêm trang QC Spot Check
Output: `r108: QC Spot Check — trang chi tiết lazy-load + modal`

**Bugfix trên rev đang có:**
Input: sửa lỗi overlay stale "vết r41" ở modal EIS
Output: `r108-i1: fix overlay stale khi mở modal EIS (skipOv=true)`

## Kiểm tra sau cùng

- `git log --oneline -3` — thấy commit mới, message đúng dạng.
- Output hook có dòng `[post-commit] Đã backup index.html` + `[gen-changelog]`.
- Nếu hook không chạy: kiểm tra `.git/hooks/post-commit` còn tồn tại và có quyền chạy.
