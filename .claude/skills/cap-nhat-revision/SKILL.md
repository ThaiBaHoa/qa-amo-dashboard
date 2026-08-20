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

## ✅ Checklist BẮT BUỘC trước khi đổi APP_REV (sai 1 câu → dừng)

1. **1 rev = 1 mối quan tâm?** Nếu thay đổi gồm ≥2 việc độc lập (vd "thêm cột" + "sửa
   filter" + "đổi loader") → **tách thành nhiều rev/commit**, KHÔNG gộp. Gộp = vi phạm.
2. **Feature hay bugfix thuần?** Bugfix thuần (không đổi tính năng/layout) → `-iM` trên
   rev cũ, KHÔNG bump major. Không chắc → **hỏi user**.
3. **Đây có phải sửa lỗi của rev vừa ship?** → `-iM` của **chính rev đó**, không phải
   rev major mới. (Đừng "chữa" bằng cách bump lên số mới.)
4. **Đã đi qua skill này chưa?** Bump tay rất dễ trượt luật — luôn dùng `/cap-nhat-revision`.

> Đồng bộ với repo `CLAUDE.md`: §Versioning ("One APP_REV bump per combined spec") +
> "When to stop and ask" #5 ("task bundles multiple independent concerns into one revision").

## ⚠️ Anti-pattern có thật — vết r129–r130 (2026-08-13, ĐỪNG LẶP LẠI)

- **r129 gộp 3 mối quan tâm** (RFI→Task monitor + cột Owner + filter Section) vào 1 rev →
  sai câu 1. Đáng lẽ tách ≥2 rev (RFI/Task là 1 việc; Owner+filter là việc khác).
- **r130 thực chất là sửa lỗi filter của r129** (lọc nhầm trường Department thay vì Owner)
  → theo câu 3 đáng lẽ là `r129-i1`, nhưng lại bump major + trộn thêm feature (resolve
  User Group). Trộn fix + feature làm nhòe ranh giới.
- **Nguyên nhân gốc:** bump tay, bỏ qua skill + bỏ qua "stop and ask". Luật đã có sẵn —
  lỗi là ở khâu thực thi. → Từ nay chạy checklist trên trước mọi lần bump.

## ⚠️ Anti-pattern có thật — vết r131→r132 (2026-08-18, ĐỪNG LẶP LẠI)

- **Bối cảnh:** r131 = spec "thêm trang Report Status". Ngay sau đó user yêu cầu đổi
  cách tính cột D **của chính trang đó**. Đã bump thành **r132** — SAI.
- **Lập luận sai:** "đổi ngữ nghĩa một cột = đổi tính năng → theo luật phải tăng rNN".
- **Đúng phải là `r131-i1`.** Đơn vị của một rev là **một spec**, không phải mỗi lần
  hành vi thay đổi. Còn đang gọt chính cái spec vừa làm → `-iM`, bất kể lần gọt đó là
  sửa lỗi hay tinh chỉnh yêu cầu mới.

### Câu hỏi phân định (hỏi TRƯỚC khi chọn số)

> **Đây là spec MỚI ĐỘC LẬP, hay vẫn đang làm tiếp spec của rev hiện tại?**

- Vẫn là spec đó (thêm/sửa/bỏ chi tiết bên trong tính năng vừa giao) → **`rNN-iM`**.
- Spec khác hẳn, đứng một mình được, mô tả trong 1 câu không cần nhắc tính năng cũ
  → **`r(NN+1)`**.

Đừng dùng "feature hay bugfix" làm câu hỏi đầu tiên — nó dẫn tới bump nhầm như trên.
Hỏi "cùng spec hay khác spec" trước, rồi mới tới feature/bugfix.

## Quy trình

1. **Tìm dòng khai báo** trong `index.html`:
   ```
   grep -n "APP_REV" index.html | head -3
   ```
2. **Cập nhật giá trị** theo luật trên (sửa cả phần ngày). Đây thường là chỗ duy nhất
   cần đổi cho việc bump — đừng đụng code khác.
3. **Đồng bộ tài liệu (BẮT BUỘC khi lên rev MAJOR `rNN`)** — tránh lệch doc↔code:
   - `CLAUDE.md`: cập nhật dòng `Rev current: …`.
   - `PROJECT_TECH_SPEC.md`: cập nhật `Version hiện tại` + thêm 1 dòng ở **§14 Lịch sử version**.
   - `TECHNICAL_REFERENCE.md`: rà lại **nếu nguồn/field/công thức đổi** (vd thêm `field_name`
     ở bước [5/6] `loadData`, đổi org_unit, đổi cách tính). Grep không bắt được nội dung này
     → phải đọc tay. Xem `SO_DO_CAU_TRUC.html` (sơ đồ luồng) để đối chiếu.
   - ⚠️ **`QA_AMO_Dashboard.md`** — file home, sống trong **vault `obsidian-mind`** tại
     `reference/qa-amo-dashboard/`, KHÔNG nằm trong repo và KHÔNG còn ở Vault-CongViec.
     Cập nhật **header `Rev hiện tại:`** + **`Cập nhật context:`** + thêm 1 gạch đầu dòng ở
     **§8 "Gần đây"**. `check-doc-sync.sh` CÓ bắt dòng header (qua
     `scripts/resolve-vault-note.sh`), nhưng KHÔNG bắt được §8 — phần đó vẫn trôi lặng lẽ.
     ⚠️ **Ghi vào vault phải làm từ phiên mở NGAY TRONG `obsidian-mind`** — luật ở CLAUDE.md
     toàn cục. Phiên mở trong repo/workspace thì chỉ chuẩn bị nội dung, không ghi thẳng.
     (Hai vết cùng họ, đều là "guard canh nhầm chỗ": r129–r130 header kẹt r128 vì file đổi
     tên từ `QA_AMO_CONTEXT.md` 13/08 mà guard giữ tên cũ, im lặng tới 18/08. Rồi 20/08 phát
     hiện guard đang canh bản ở Vault-CongViec trong khi bản `om` server phục vụ cho MỌI
     phiên Claude nằm ở `obsidian-mind` và đã kẹt ở r130 suốt 10 rev.)
   - Bump `-iM` thuần bugfix: doc thường không cần đổi (rNN đã có sẵn trong doc).
4. **Chốt trước commit — chạy check tự động:**
   ```
   sh scripts/check-doc-sync.sh
   ```
   Exit 1 = còn doc tụt rev → sửa cho xong rồi mới commit. (Pre-commit hook cũng tự chặn
   nếu bạn quên — nhưng chạy tay trước cho chủ động.)
5. **Commit** với message bắt đầu bằng token phiên bản:
   ```
   git add index.html <file khác nếu có>
   git commit -m "rNN[-iM]: <mô tả ngắn việc đã làm>"
   ```
   - Message **phải bắt đầu** bằng `rNN` hoặc `rNN-iM` (vd `r113: ...`, `r113-i1: ...`)
     để changelog nhận diện. Commit hạ tầng/tài liệu (không phải rev app) thì dùng
     tiền tố khác (`build:`, `docs:`) — chúng sẽ hiện dạng thường trong changelog.
   - Kết message bằng dòng `Co-Authored-By` theo quy ước repo.
6. **Sau commit, hook tự chạy** (`post-commit`): backup `index.html` sang OneDrive +
   sinh lại `NHAT_KY_CAP_NHAT_APP.md`. Không cần làm tay. Xác nhận output hook hiện ra.
7. **Push khi người dùng muốn deploy** — `git push` (deploy = GitHub Pages trên `main`).
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
