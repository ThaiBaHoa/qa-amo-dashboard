#!/bin/sh
# todo-status.sh — Kiểm TỰ ĐỘNG các TODO có "định nghĩa done" đo được từ data Galileo.
# Trạng thái ngữ nghĩa ("đã build chưa") máy không đoán được; nhưng các blocker còn lại
# đều là ĐIỀU KIỆN DATA đếm được → script query proxy, so với baseline, HÚ khi gate đổi.
#   Gate 1: Backfill cờ QC cho CMR-CAR  → đếm CMR-CAR gán category "QC MQA Physical Finding".
#   Gate 2: SCR có category_id (gate "Bộ lọc Category QC Spot Check") → đếm SCR có category_id.
# Nguồn sự thật backlog: VIEC_TUONG_LAI.md (nhóm 4) trong vault; §8 QA_AMO_Dashboard.md tóm tắt.
# Khi gate đổi → cập nhật VIEC_TUONG_LAI.md + rollup §8 + baseline BASE_* dưới đây.
#
# KHÔNG đặt trong git hook (có network, chậm/offline sẽ chặn commit oan). Chạy tay hoặc
# trong flow báo cáo tuần (skill bao-cao-tuan gọi nó). Đếm là raw (report_summary append-only,
# chưa dedup) → chỉ dùng làm TÍN HIỆU xu hướng, không phải số report chính xác.
# Dùng: sh scripts/todo-status.sh

BASE="https://galileo-proxy.thaibahoa2308.workers.dev/proxy"
ORIGIN="https://vjc-qa-amo.com"
QC_UUID="7e5ccacc-563d-4fde-bef7-905870d68aca"   # Category "QC MQA Physical Finding"

# --- BASELINE (ghi 2026-08-13; CẬP NHẬT khi TODO §8 đổi) ---
BASE_CMR_QC=28      # CMR-CAR đã gán cờ QC
BASE_SCR_POP=1      # SCR có category_id

cnt() {  # $1 = giá trị $filter ; in số, hoặc "?" nếu lỗi
  v="$(curl -s -G "$BASE/dwreporting_report_summary/\$count" -H "Origin: $ORIGIN" \
        --data-urlencode "\$filter=$1" 2>/dev/null)"
  if printf '%s' "$v" | grep -qE '^[0-9]+$'; then printf '%s' "$v"; else printf '?'; fi
}

echo "== TODO gate status =="

CMR_TOT="$(cnt "report_title eq 'CMR CAR'")"
CMR_QC="$(cnt "report_title eq 'CMR CAR' and category_id eq $QC_UUID")"   # UUID KHÔNG bọc nháy
SCR_TOT="$(cnt "report_title eq 'QC Spot Check Report'")"
SCR_POP="$(cnt "report_title eq 'QC Spot Check Report' and category_id ne null")"

FLAG=0

echo ""
echo "[1] Backfill cờ QC cho CMR-CAR  (mục ⏳ 'chờ nhập liệu')"
echo "    QC-tagged: $CMR_QC / $CMR_TOT    (baseline $BASE_CMR_QC)"
if [ "$CMR_QC" != "?" ] && [ "$CMR_QC" -gt "$((BASE_CMR_QC + 20))" ]; then
  echo "    ⚠️  TĂNG ĐÁNG KỂ → backfill đang chạy. RÀ §8 + kiểm lại KPI QC còn thiếu số không."
  FLAG=1
else
  echo "    → chưa đổi đáng kể (blocker còn)."
fi

echo ""
echo "[2] SCR có category_id  (gate mục 🔲 'Bộ lọc Category QC Spot Check')"
echo "    populated: $SCR_POP / $SCR_TOT    (baseline $BASE_SCR_POP)"
if [ "$SCR_POP" != "?" ] && [ "$SCR_POP" -gt 5 ]; then
  echo "    ⚠️  GATE MỞ → SCR đã có category_id, CÓ THỂ build filter. Cập nhật §8."
  FLAG=1
else
  echo "    → gate chưa đạt (blocker còn)."
fi

echo ""
if [ "$CMR_QC" = "?" ] || [ "$SCR_POP" = "?" ]; then
  echo ">> Có query lỗi (network/proxy?). Chạy lại; script không chặn gì."
elif [ "$FLAG" = 1 ]; then
  echo ">> CÓ GATE ĐỔI → cập nhật §8 QA_AMO_Dashboard.md + baseline trong script này."
else
  echo ">> Tất cả gate giữ nguyên — TODO §8 còn đúng."
fi
exit 0
