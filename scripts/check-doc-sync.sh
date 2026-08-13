#!/bin/sh
# check-doc-sync.sh — Chặn "lệch data": doc phải phản ánh rev code.
# So MAJOR rev (rNN, bỏ -iM) trong index.html với các tài liệu mang version.
#   - CLAUDE.md            → phải chứa rNN (dòng "Rev current")
#   - PROJECT_TECH_SPEC.md → phải chứa rNN (header "Version hiện tại" + §14 lịch sử)
#   - QA_AMO_CONTEXT.md    → file home VAULT-NATIVE (ngoài repo). Check RIÊNG dòng header
#       "Rev hiện tại:" (không grep cả file — §8 chứa rev cũ sẽ lọt). Vết r129/r130:
#       header kẹt r128 vì file này không nằm trong repo nên hook cũ không bắt.
#   - TECHNICAL_REFERENCE.md → KHÔNG grep được nội dung (field/flow) → chỉ nhắc rà tay.
# Exit 0 = khớp; exit 1 = có doc tụt rev (in ra danh sách).
# Dùng: sh scripts/check-doc-sync.sh   (chạy tại gốc repo)

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || echo .)"
cd "$ROOT" || exit 0

# Đường dẫn vault (giữ khớp với .git/hooks/post-commit — WORKSPACE)
WORKSPACE="F:/Onedrive - Bussiness/OneDrive - VietJet Aviation Joint Stock Company/Vault-CongViec/03-Du-An/build app cho cong ty/MQA dashboard website"

REV_FULL="$(grep -oE "APP_REV[^;]*" index.html | head -1 | grep -oE "r[0-9]+(-i[0-9]+)?")"
REV_MAJOR="$(printf '%s' "$REV_FULL" | grep -oE 'r[0-9]+')"

if [ -z "$REV_MAJOR" ]; then
  echo "[doc-sync] Không đọc được APP_REV trong index.html — bỏ qua." >&2
  exit 0
fi

STALE=""

# 1) Doc trong repo: chỉ cần chứa rNN đâu đó (header + §lịch sử).
for DOC in CLAUDE.md PROJECT_TECH_SPEC.md; do
  if [ -f "$DOC" ] && ! grep -q "$REV_MAJOR" "$DOC"; then
    STALE="$STALE $DOC"
  fi
done

# 2) QA_AMO_CONTEXT.md (vault): check ĐÚNG dòng header, không phải cả file.
#    Vắng file (clone máy không có vault) → bỏ qua, không chặn.
CTX="$WORKSPACE/QA_AMO_CONTEXT.md"
if [ -f "$CTX" ]; then
  CTX_REV="$(grep -m1 'Rev hi' "$CTX" | grep -oE 'r[0-9]+' | head -1)"
  if [ "$CTX_REV" != "$REV_MAJOR" ]; then
    STALE="$STALE QA_AMO_CONTEXT.md(header=${CTX_REV:-none})"
  fi
fi

if [ -n "$STALE" ]; then
  echo "" >&2
  echo "  ✗ LỆCH DOC ↔ CODE — code đang ở $REV_FULL nhưng chưa nhắc $REV_MAJOR trong:" >&2
  for D in $STALE; do echo "      · $D" >&2; done
  echo "" >&2
  echo "  → Cập nhật: CLAUDE.md 'Rev current' + PROJECT_TECH_SPEC 'Version hiện tại' & §14," >&2
  echo "    QA_AMO_CONTEXT.md header 'Rev hiện tại:' + 'Cập nhật context:' + 1 dòng §8 'Gần đây'," >&2
  echo "    và RÀ TECHNICAL_REFERENCE.md nếu luồng/field dữ liệu đổi (grep không bắt được)." >&2
  echo "" >&2
  exit 1
fi

echo "[doc-sync] OK — CLAUDE.md, PROJECT_TECH_SPEC.md & QA_AMO_CONTEXT.md (header) đã nhắc $REV_MAJOR." >&2
echo "[doc-sync] Nhắc: rà TECHNICAL_REFERENCE.md nếu nguồn/field/công thức có đổi (không auto-check được)." >&2
exit 0
