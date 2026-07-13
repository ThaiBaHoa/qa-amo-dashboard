#!/bin/sh
# Tạo nhật ký cập nhật (changelog) từ git log, nhóm theo TUẦN (ISO week).
# Dùng cho cowork đọc để viết báo cáo tuần QA AMO.
# Cách chạy: sh scripts/gen-changelog.sh "<đường dẫn file .md đầu ra>"
# Nguồn dữ liệu = git commit messages (mỗi phiên bản là 1 commit r###).

OUT="${1:-NHAT_KY_CAP_NHAT_APP.md}"
NOW="$(date '+%Y-%m-%d %H:%M')"
LATEST="$(git log -50 --pretty=format:'%s' | grep -oE '^r[0-9]+[a-z0-9-]*' | head -1)"
LATEST_DATE="$(git log -1 --date=format:'%Y-%m-%d' --pretty=format:'%ad')"

{
  echo "# Nhật ký cập nhật — QA AMO Dashboard"
  echo ""
  echo "> ⚙️ File này **tự động tạo** từ git log sau mỗi commit. **Đừng sửa tay.**"
  echo "> Cowork: đọc file này để viết báo cáo tuần — mỗi mục là một việc đã làm."
  echo ""
  echo "- **Phiên bản mới nhất:** \`${LATEST:-N/A}\` (${LATEST_DATE})"
  echo "- **Cập nhật lúc:** ${NOW}"
  echo ""
  echo "---"
  echo ""

  # Liệt kê commit mới -> cũ, chèn tiêu đề mỗi khi sang tuần mới.
  git log --date=format:'%G-W%V|%Y-%m-%d' --pretty=format:'%ad|%s' \
  | awk -F'|' '
    {
      week=$1; day=$2;
      # ghép lại phần subject (có thể chứa dấu | )
      subject=$3;
      for (i=4; i<=NF; i++) subject=subject "|" $i;
      if (week != cur) {
        if (cur != "") print "";
        print "## Tuần " week;
        print "";
        cur=week;
      }
      # đánh dấu commit phiên bản (r###) cho dễ nhìn
      ver="";
      if (match(subject, /^r[0-9]+[a-z0-9-]*/)) {
        ver=substr(subject, RSTART, RLENGTH);
        rest=substr(subject, RLENGTH+1);
        sub(/^[:\- ]+/, "", rest);
        print "- **" day " · " ver "** — " rest;
      } else {
        print "- " day " · " subject;
      }
    }
  '
} > "$OUT"

echo "[gen-changelog] Đã tạo $OUT (phiên bản mới nhất: ${LATEST:-N/A})"
