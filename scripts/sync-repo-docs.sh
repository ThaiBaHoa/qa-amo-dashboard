#!/bin/sh
# sync-repo-docs.sh — Guong (mirror) doc ky thuat cua repo vao vault obsidian-mind.
#
# Vi sao can: QA_AMO_Dashboard.md (§12) tro toi [[PROJECT_TECH_SPEC]],
# [[TECHNICAL_REFERENCE]], [[PAVOI_RFI_Spec]], [[KPI2_DECISION_POINTS]] va noi
# rang chung "tu dong bo vao repo-docs/ trong vault sau moi commit". Thuc te den
# 20/08/2026 KHONG he co script nao lam viec do: repo-docs/ trong vault chi co
# README.md, 4 wikilink kia GAY, con ban mirror duy nhat nam o Vault-CongViec va
# da rua (PROJECT_TECH_SPEC + TECHNICAL_REFERENCE lech so voi repo). Script nay
# lam that cai co che da duoc viet trong doc.
#
# Dich la VAULT, khong phai Vault-CongViec. Ly do: reference/qa-amo-dashboard/
# nam trong mcp_exposed_roots cua vault-manifest.json, tuc MOI phien Claude deu
# doc duoc qua om server. Mirror o Vault-CongViec khong ai doc va khong ai canh.
# CO Y khong sync ca hai noi: hai ban song song deu trong nhu "that" chinh la cai
# bay da lam file home ket o r130 suot 10 rev.
#
# Duong dan vault giai qua scripts/resolve-vault-note.sh (nguon su that DUY NHAT,
# lo chuyen OneDrive mount o o dia khac nhau tung may). Khong tim thay vault ->
# bo qua im lang: mot clone tren may khong co vault van phai commit duoc.
#
# Dung:  sh scripts/sync-repo-docs.sh
#        sh scripts/sync-repo-docs.sh --check   (chi bao lech, khong ghi; exit 1 neu lech)

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || echo .)"
cd "$ROOT" || exit 0

DOCS="PROJECT_TECH_SPEC.md TECHNICAL_REFERENCE.md PAVOI_RFI_Spec.md KPI2_DECISION_POINTS.md"

NOTE="$(sh "$ROOT/scripts/resolve-vault-note.sh" 2>/dev/null)"
if [ -z "$NOTE" ]; then
  echo "[repo-docs] Khong thay vault obsidian-mind tren may nay - bo qua sync." >&2
  exit 0
fi

DST="$(dirname "$NOTE")/repo-docs"

CHECK=""
[ "$1" = "--check" ] && CHECK=1

if [ -z "$CHECK" ]; then
  mkdir -p "$DST" || { echo "[repo-docs] Khong tao duoc $DST" >&2; exit 0; }
fi

STALE=""
N=0
for DOC in $DOCS; do
  if [ ! -f "$ROOT/$DOC" ]; then
    echo "[repo-docs] Thieu $DOC trong repo - bo qua." >&2
    continue
  fi
  if [ -f "$DST/$DOC" ] && cmp -s "$ROOT/$DOC" "$DST/$DOC"; then
    continue
  fi
  STALE="$STALE $DOC"
  if [ -z "$CHECK" ]; then
    cp "$ROOT/$DOC" "$DST/$DOC" && N=$((N+1))
  fi
done

if [ -n "$CHECK" ]; then
  if [ -n "$STALE" ]; then
    echo "" >&2
    echo "  X repo-docs trong vault LECH so voi repo:" >&2
    for D in $STALE; do echo "      - $D" >&2; done
    echo "  -> Chay: sh scripts/sync-repo-docs.sh" >&2
    echo "" >&2
    exit 1
  fi
  echo "[repo-docs] OK - 4 doc trong vault khop repo." >&2
  exit 0
fi

if [ "$N" -gt 0 ]; then
  echo "[repo-docs] Da dong bo $N doc -> $DST"
else
  echo "[repo-docs] Khong co gi doi."
fi
exit 0
