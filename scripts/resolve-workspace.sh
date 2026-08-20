#!/bin/sh
# Nguon su that DUY NHAT cho duong dan "workspace" — thu muc chua ban sao
# index.html + NHAT_KY_CAP_NHAT_APP.md. In ra duong dan, hoac in rong neu khong thay.
#
# LUU Y: file home QA_AMO_Dashboard.md KHONG con o day. Tu 20/08/2026 no song
# trong vault obsidian-mind — dung scripts/resolve-vault-note.sh cho file do.
#
# Vi sao can: OneDrive mount o o dia KHAC NHAU tren tung may.
#   - laptop cong ty : F:/Onedrive - Bussiness/OneDrive - VietJet .../
#   - PC nha         : G:/OneDrive - VietJet .../
# Truoc day duong dan F: bi hardcode trong check-doc-sync.sh, nen tren PC nha
# guard doc<->code IM LANG bo qua — dung cai kieu that bai kho phat hien nhat.
#
# Dung: WORKSPACE="$(sh scripts/resolve-workspace.sh)"
# Ghi de: dat bien moi truong QA_AMO_WORKSPACE.

SUB="Vault-CongViec/03-Du-An/build app cho cong ty/MQA dashboard website"

if [ -n "$QA_AMO_WORKSPACE" ]; then
  [ -d "$QA_AMO_WORKSPACE" ] && printf '%s' "$QA_AMO_WORKSPACE"
  exit 0
fi

for ROOT in \
  "F:/Onedrive - Bussiness/OneDrive - VietJet Aviation Joint Stock Company" \
  "G:/OneDrive - VietJet Aviation Joint Stock Company" \
  "$USERPROFILE/OneDrive - VietJet Aviation Joint Stock Company"
do
  if [ -d "$ROOT/$SUB" ]; then
    printf '%s' "$ROOT/$SUB"
    exit 0
  fi
done

# Khong tim thay: in rong. Ben goi PHAI coi day la "bo qua", khong phai loi —
# mot clone tren may khong co vault van phai commit duoc.
exit 0
