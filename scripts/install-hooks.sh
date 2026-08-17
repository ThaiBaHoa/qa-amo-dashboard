#!/bin/sh
# Cai git hook tu scripts/hooks/ vao .git/hooks/.
#
# Vi sao can script nay: .git/hooks/ KHONG duoc git theo doi, nen clone ve may
# moi la mat sach hook — guard doc<->code va backup index.html deu bien mat ma
# khong bao gi. Ban that cua hook nam trong scripts/hooks/ (co version hoa),
# script nay chi copy sang.
#
# Chay sau moi lan clone:
#   sh scripts/install-hooks.sh

set -e
ROOT="$(git rev-parse --show-toplevel)"
SRC="$ROOT/scripts/hooks"
DST="$ROOT/.git/hooks"

[ -d "$SRC" ] || { echo "Khong thay $SRC" >&2; exit 1; }
mkdir -p "$DST"

for h in pre-commit post-commit; do
  if [ -f "$SRC/$h" ]; then
    cp "$SRC/$h" "$DST/$h"
    chmod +x "$DST/$h"
    echo "  cai: $h"
  fi
done

echo ""
echo "Xong. Kiem tra:"
echo "  workspace  -> $(sh "$ROOT/scripts/resolve-workspace.sh" 2>/dev/null || echo '(khong thay - backup se bi bo qua)')"
echo "  doc-sync   -> chay 'sh scripts/check-doc-sync.sh' de thu"
