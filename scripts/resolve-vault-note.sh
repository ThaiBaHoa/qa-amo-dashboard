#!/bin/sh
# Nguon su that DUY NHAT cho duong dan file home QA_AMO_Dashboard.md.
# In ra duong dan DAY DU toi file, hoac in rong neu khong tim thay.
#
# Tu 20/08/2026 file nay song trong vault "obsidian-mind", KHONG con o
# Vault-CongViec nua. Ly do doi cho:
#   - obsidian-mind/reference/qa-amo-dashboard/ nam trong mcp_exposed_roots cua
#     vault-manifest.json, tuc MOI phien Claude deu doc duoc qua om server.
#   - Ban cu o Vault-CongViec chi phien nao tinh co mo dung thu muc do moi thay.
#   - Hau qua thuc te: ban trong vault ket o r130 (13/08) trong khi ban o
#     Vault-CongViec da len r140 — lech 65 dong, va guard khong he bao vi no
#     dang canh nham ban. Cung ho loi voi vet QA_AMO_CONTEXT.md truoc day.
#
# CO Y tach khoi resolve-workspace.sh: script do van phuc vu viec mirror
# index.html sang Vault-CongViec, viec do KHONG doi. Gop chung se lam hong mirror.
#
# Dung: NOTE="$(sh scripts/resolve-vault-note.sh)"
# Ghi de: dat bien moi truong QA_AMO_VAULT_NOTE (tro thang toi file).

SUB="obsidian-mind/reference/qa-amo-dashboard/QA_AMO_Dashboard.md"

if [ -n "$QA_AMO_VAULT_NOTE" ]; then
  [ -f "$QA_AMO_VAULT_NOTE" ] && printf '%s' "$QA_AMO_VAULT_NOTE"
  exit 0
fi

# OneDrive mount o o dia khac nhau tung may: F: laptop cong ty, G: PC nha.
for ROOT in \
  "F:/Onedrive - Bussiness/OneDrive - VietJet Aviation Joint Stock Company" \
  "G:/OneDrive - VietJet Aviation Joint Stock Company" \
  "$USERPROFILE/OneDrive - VietJet Aviation Joint Stock Company"
do
  if [ -f "$ROOT/$SUB" ]; then
    printf '%s' "$ROOT/$SUB"
    exit 0
  fi
done

# Khong tim thay: in rong. Ben goi PHAI coi day la "bo qua", khong phai loi —
# mot clone tren may khong co vault van phai commit duoc.
exit 0
