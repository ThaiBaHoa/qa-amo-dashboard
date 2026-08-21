#!/bin/sh
# sync-workspace-docs.sh — Guong tai lieu workspace (Vault-CongViec) sang vault
# obsidian-mind, MOT CHIEU, CO BIEN DOI.
#
# Vi sao can: toan bo cay doc trong "MQA dashboard website/" ton tai hai ban —
# mot o Vault-CongViec (noi nguoi dung va cac skill thuc su ghi), mot trong vault
# obsidian-mind (ban ma om server phuc vu cho MOI phien Claude). Khong co gi dong
# bo chung. Den 20/08/2026: GHI_NHAN_TUAN.md, VIEC_TUONG_LAI.md,
# NHAT_KY_CAP_NHAT_APP.md va BaoCao_Tuan/THEO_DOI_BAO_CAO_TUAN.md da lech — ban
# trong vault ket tu 17/08. Cung ho benh voi vet file home ket r130.
#
# TAI SAO KHONG PHAI `cp`: hai cay CO Y khac nhau o lop trinh bay. Ban trong vault
# co frontmatter Obsidian (date/description/tags) ma ban workspace khong co, va
# dung wikilink [[QA_AMO_Dashboard]] trong khi ban workspace dung link obsidian://
# (vi Vault-CongViec la vault KHAC, wikilink khong bac cau sang duoc). Chep thang
# se xoa frontmatter cua 27 file va thay wikilink native bang URI — pha graph va
# backlink ngay trong vault. Nen script nay dong bo PHAN THAN, giu nguyen lop
# trinh bay cua ban dich.
#
# HUONG: workspace -> vault, khong bao gio nguoc lai. Bang chung: 19/22 file trung
# khop phan than va 3 file lech deu la workspace moi hon, tuc khong ai sua ban
# trong vault. Ban trong vault la GUONG CHI DOC.
#
# KHONG BAO GIO XOA gi ben vault. Vault co file rieng khong co ben workspace
# (form-eis/, cac note do om server ghi) — xoa la mat that.
#
# BO QUA:
#   - file co "status: stub" trong frontmatter. Then chot: QA_AMO_Dashboard.md va
#     repo-docs/*.md ben workspace da la stub tro sang vault; sync mu thi chinh
#     cai stub se ghi de len ban that trong vault.
#   - CLAUDE.md — cau hinh cua workspace, khong phai tai lieu du an. Dua vao vault
#     se thanh file CLAUDE.md thu tu, lam wikilink [[CLAUDE]] cang nhap nhang.
#   - *.bak-* — ban nhap tay.
#
# Dung:  sh scripts/sync-workspace-docs.sh
#        sh scripts/sync-workspace-docs.sh --check   (chi bao lech, exit 1 neu lech)

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || echo .)"

SRC="$(sh "$ROOT/scripts/resolve-workspace.sh" 2>/dev/null)"
NOTE="$(sh "$ROOT/scripts/resolve-vault-note.sh" 2>/dev/null)"

if [ -z "$SRC" ] || [ -z "$NOTE" ]; then
  echo "[ws-docs] Thieu workspace hoac vault tren may nay - bo qua sync." >&2
  exit 0
fi

DST="$(dirname "$NOTE")"

CHECK=""
[ "$1" = "--check" ] && CHECK=1

TMP="${TMPDIR:-/tmp}/ws-docs-$$"
mkdir -p "$TMP" || exit 0
LOG="$TMP/log"
: > "$LOG"

# Bo frontmatter cua mot file, in ra phan than.
strip_fm() {
  awk 'NR==1 && /^---$/ { fm=1; next }
       fm && /^---$/     { fm=0; next }
       fm                { next }
                         { print }' "$1"
}

# In frontmatter cua mot file (rong neu khong co).
take_fm() {
  [ -f "$1" ] || return 0
  awk 'NR==1 && /^---$/ { fm=1; print; next }
       fm && /^---$/     { print; exit }
       fm                { print }' "$1"
}

# Dua link obsidian:// (dang dung o Vault-CongViec) ve wikilink native cua vault.
# Day la phep NGHICH cua viec doi link hom 20/08 — xem ghi chu dau file.
to_wikilink() {
  sed -e 's|\[QA_AMO_Dashboard\](obsidian://open?vault=obsidian-mind&file=reference%2Fqa-amo-dashboard%2FQA_AMO_Dashboard)|[[QA_AMO_Dashboard]]|g' \
      -e 's| (trong vault `obsidian-mind`)||g' \
      -e 's|\[`QA_AMO_Dashboard.md` trong vault `obsidian-mind`\](obsidian://open?vault=obsidian-mind&file=reference%2Fqa-amo-dashboard%2FQA_AMO_Dashboard)|[[QA_AMO_Dashboard]]|g'
}

find "$SRC" -name "*.md" \
     -not -path "*/.claude/*" \
     -not -name "*.bak-*" \
     -not -name "CLAUDE.md" 2>/dev/null |
while IFS= read -r F; do
  REL="${F#$SRC/}"
  head -8 "$F" | grep -q '^status: stub' && continue

  D="$DST/$REL"
  NEW="$TMP/new"

  # Frontmatter: giu nguyen cua ban dich. Chua co thi sinh tu tieu de H1.
  if [ -f "$D" ] && head -1 "$D" | grep -q '^---$'; then
    take_fm "$D" > "$NEW"
  else
    H1="$(grep -m1 '^# ' "$F" | sed 's/^# //; s/"/'"'"'/g')"
    [ -z "$H1" ] && H1="$(basename "$REL" .md)"
    {
      echo "---"
      echo "description: \"$H1\""
      echo "tags:"
      echo "  - reference"
      echo "---"
    } > "$NEW"
  fi

  strip_fm "$F" | to_wikilink >> "$NEW"

  if [ -f "$D" ] && cmp -s "$NEW" "$D"; then
    continue
  fi

  if [ -n "$CHECK" ]; then
    echo "STALE $REL" >> "$LOG"
  else
    mkdir -p "$(dirname "$D")" 2>/dev/null
    cp "$NEW" "$D" && echo "SYNCED $REL" >> "$LOG"
  fi
done

if [ -n "$CHECK" ]; then
  N="$(grep -c '^STALE' "$LOG" 2>/dev/null)"
  [ -z "$N" ] && N=0
  if [ "$N" -gt 0 ]; then
    echo "" >&2
    echo "  X than doc trong vault LECH so voi workspace ($N file):" >&2
    sed -n 's/^STALE /      - /p' "$LOG" >&2
    echo "  -> Chay: sh scripts/sync-workspace-docs.sh" >&2
    echo "" >&2
    rm -rf "$TMP"; exit 1
  fi
  echo "[ws-docs] OK - than doc trong vault khop workspace." >&2
  rm -rf "$TMP"; exit 0
fi

N="$(grep -c '^SYNCED' "$LOG" 2>/dev/null)"
[ -z "$N" ] && N=0
if [ "$N" -gt 0 ]; then
  echo "[ws-docs] Da dong bo $N doc -> $DST"
  sed -n 's/^SYNCED /    - /p' "$LOG"
else
  echo "[ws-docs] Khong co gi doi."
fi
rm -rf "$TMP"
exit 0
