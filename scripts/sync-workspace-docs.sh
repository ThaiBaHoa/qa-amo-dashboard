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
# XOA: chi xoa dung nhung ban guong CHINH SCRIPT NAY da tao, va chi khi file NGUON
# da bien mat han. Vault co file rieng khong co ben workspace (form-eis/, cac note do
# om server ghi) — xoa mu la mat that, nen KHONG duoc dung luat "xoa moi thu dich co
# ma nguon khong co".
#   Vi sao can xoa: script chi COPY. Doi ten mot file o workspace thi ban ten cu O LAI
#   TRONG VAULT VINH VIEN. Vet 28/08/2026: doi KE_HOACH_SUA_r145_r148.md ->
#   KE_HOACH_SUA_4_VIEC_TON.md, sau commit vault co CA HAI, va ban cu van mang bon
#   heading r145..r148 dung thu vua bo di vi gay nham so rev. Nguy hiem o cho om server
#   phuc vu thu muc nay cho MOI phien Claude: mot phien khac search ra ban cu se doc
#   dung thong tin da bi bac bo, khong co dau hieu gi.
#   Cung mot lop loi voi CACHE_KEY mo coi (r145): co che ghi theo TEN thi im lang bo roi
#   moi ten cu. Bat ky lop dong bo/cache nao danh dia chi theo ten deu can buoc don ten cu.
#
# MANIFEST: .ws-docs-manifest trong thu muc dich, liet ke nhung REL script da guong.
#   Chay dau tien chua co manifest -> chi tao, KHONG xoa gi.
#   Chot an toan: mot muc chi bi xoa khi "$SRC/$REL" KHONG CON TON TAI. Nho vay file
#   nguon van con nhung bi bo qua (vd tro thanh stub) se KHONG BAO GIO bi xoa — day la
#   ca nguy hiem nhat, vi ban that cua stub nam trong vault.
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
CUR="$TMP/current"
: > "$CUR"
MANIFEST="$DST/.ws-docs-manifest"

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

  # File nay thuoc trach nhiem cua script (du lat nua co doi noi dung hay khong).
  echo "$REL" >> "$CUR"

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

# ── Don ban guong MO COI ─────────────────────────────────────
# Chi xet muc CO TRONG MANIFEST CU (tuc chinh script nay da tao) va co NGUON DA MAT.
if [ -f "$MANIFEST" ]; then
  while IFS= read -r REL; do
    [ -z "$REL" ] && continue
    # Chan cung: file home la stub o nguon, khong bao gio duoc dung toi.
    [ "$REL" = "QA_AMO_Dashboard.md" ] && continue
    [ -f "$SRC/$REL" ] && continue          # nguon con -> khong dung toi, du dang bi bo qua
    [ -f "$DST/$REL" ] || continue          # dich khong co -> khong co gi de don
    if [ -n "$CHECK" ]; then
      echo "ORPHAN $REL" >> "$LOG"
    else
      rm -f "$DST/$REL" && echo "REMOVED $REL" >> "$LOG"
    fi
  done < "$MANIFEST"
fi

# Manifest moi = dung nhung file dang co o nguon. Khong ghi khi --check.
if [ -z "$CHECK" ]; then
  sort -u "$CUR" > "$MANIFEST" 2>/dev/null
fi

if [ -n "$CHECK" ]; then
  NO="$(grep -c '^ORPHAN' "$LOG" 2>/dev/null)"
  [ -z "$NO" ] && NO=0
  if [ "$NO" -gt 0 ]; then
    echo "" >&2
    echo "  X vault con $NO ban guong MO COI (nguon da doi ten hoac bi xoa):" >&2
    sed -n 's/^ORPHAN /      - /p' "$LOG" >&2
    echo "  -> Chay: sh scripts/sync-workspace-docs.sh" >&2
    echo "" >&2
  fi
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

NR_="$(grep -c '^REMOVED' "$LOG" 2>/dev/null)"
[ -z "$NR_" ] && NR_=0
if [ "$NR_" -gt 0 ]; then
  echo "[ws-docs] Da don $NR_ ban guong mo coi (nguon da doi ten/bi xoa):"
  sed -n 's/^REMOVED /    - /p' "$LOG"
fi

N="$(grep -c '^SYNCED' "$LOG" 2>/dev/null)"
[ -z "$N" ] && N=0
if [ "$N" -gt 0 ]; then
  echo "[ws-docs] Da dong bo $N doc -> $DST"
  sed -n 's/^SYNCED /    - /p' "$LOG"
elif [ "$NR_" -eq 0 ]; then
  echo "[ws-docs] Khong co gi doi."
fi
rm -rf "$TMP"
exit 0
