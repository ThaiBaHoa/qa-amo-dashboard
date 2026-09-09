// Harness r155 — chạy CHÍNH khối code trích từ index.html trên dữ liệu Galileo LIVE.
// Không viết lại logic. Chỉ dựng đúng những gì trang web cung cấp cho các hàm đó.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const BODY = path.join(HERE, '.test-r155-body.mjs');   // file tam, .gitignore bo qua

const SRC = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

function grab(name) {
  let i = SRC.indexOf('async function ' + name + '(');
  if (i < 0) i = SRC.indexOf('function ' + name + '(');
  if (i < 0) throw new Error('KHONG TIM THAY: ' + name);
  let j = SRC.indexOf('{', i), d = 0, k = j;
  for (; k < SRC.length; k++) {
    if (SRC[k] === '{') d++;
    else if (SRC[k] === '}') { d--; if (d === 0) { k++; break; } }
  }
  return SRC.slice(i, k);
}
function grabConst(re, label) {
  const m = SRC.match(re);
  if (!m) throw new Error('KHONG TIM THAY hang so: ' + label);
  return m[0];
}

const EXTRACTED = [
  grabConst(/const KPI7_SECTIONS = \[[\s\S]*?\];/, 'KPI7_SECTIONS'),
  grabConst(/const KPI7_UNASSIGNED = '[^']*';/, 'KPI7_UNASSIGNED'),
  grabConst(/const KPI7_WARN_DAYS  = 30;/, 'KPI7_WARN_DAYS'),
  grabConst(/const G_URL     = '[^']*';/, 'G_URL'),
  grabConst(/const ORG_UNIT_ID = '[^']*';/, 'ORG_UNIT_ID'),
  grab('kpi7Withdrawn'),
  grab('kpi7Stats'),
  grab('kpi7Rate'),
  grab('kpi7Fmt'),
  grab('pavoiVerCell'),
  grab('loadKpi7Tasks'),
].join('\n\n');

console.log('[extract] da trich %d ky tu tu index.html', EXTRACTED.length);
console.log('[extract] cac ham: kpi7Withdrawn, kpi7Stats, kpi7Rate, kpi7Fmt, pavoiVerCell, loadKpi7Tasks');

// ── Kiem TINH tren index.html (khong can du lieu live) ──────────────────
// [r156] Bang PAVOI Detail: so <th> phai bang so <td> cua mau hang. Lech cot la loi
// IM LANG — bang van render binh thuong, chi la du lieu nam sai cot. Rat de gay ra khi
// them/bo cot, va khong bao gio lo ra qua test logic nghiep vu.
let SFAIL = 0;
const sok = (c, m) => { console.log((c ? '  PASS  ' : '  FAIL  ') + m); if (!c) SFAIL++; };

const thead  = SRC.match(/<div class="tbl-title">PAVOI Detail<\/div>[\s\S]*?<thead><tr>([\s\S]*?)<\/tr><\/thead>/);
const rowTpl = SRC.match(/renderPaged\('pavoiBody'[\s\S]*?<tr [\s\S]*?>([\s\S]*?)<\/tr>`\)/);
const nTh = thead  ? (thead[1].match(/<th[\s>]/g)  || []).length : -1;
const nTd = rowTpl ? (rowTpl[1].match(/<td[\s>]/g) || []).length : -1;

console.log('\nBang PAVOI Detail: ' + nTh + ' cot header / ' + nTd + ' o moi hang');
sok(nTh > 0 && nTh === nTd, 'so cot header === so o moi hang');
sok(!/<th>Report Ref<\/th>/.test(SRC), 'cot Report Ref da duoc bo (r156)');
sok(!!rowTpl && !/font-size:11px/.test(rowTpl[1]),
    'hang PAVOI khong con ghi de font-size:11px (chu theo co cua bang)');
// [r158] Bo loc cua trang PAVOI phai KHOP dung cot Status. Tu r157 cot Status hien
// `report_status` (Open/Closed) nen bo loc cu theo `semantic_status` (Overdue/On-time/Lately)
// se loc ra thu khong con nhin thay tren bang — bam Overdue ma cot Status ghi "Open" thi
// nguoi dung tuong bang hong. Day la loai lech CHI lo ra khi doi chieu hai cho voi nhau.
const pills = [...SRC.matchAll(/onclick="setPAV\('([^']*)'/g)].map(m => m[1]);
console.log('\nBo loc PAVOI Detail: ' + JSON.stringify(pills));
sok(JSON.stringify(pills) === JSON.stringify(['all', 'Open', 'Closed']),
    'bo loc chi con All / Open / Closed');
sok(/if\(ts\.sf!=='all' && r\.report_status!==ts\.sf\) return false;/.test(SRC),
    'renderPavoi loc theo report_status (khop cot Status)');

// [r158] Chart "Monthly" cua KPI 7 tren Overview da bo — khong duoc con manh nao sot lai,
// vi mot canvas mo coi hay mot charts['ovKpi7Mon'] treo lai la loi im lang.
const mon = (SRC.match(/ovKpi7Mon|ov-kpi7-mon-cnt|mSum/g) || []).length;
sok(mon === 0, 'khong con manh nao cua chart Monthly (tim thay ' + mon + ')');
sok(!/\(Open &amp; assessed \+ Closed\)/.test(SRC),
    'khong con tooltip ghi cong thuc KPI cu cua r152');

if (SFAIL) { console.log('\nKIEM TINH FAIL — dung lai, khong chay phan live.'); process.exit(1); }

// ── Stub tối thiểu: chỉ thay phần DOM/overlay, KHÔNG thay logic ──────────
const PRELUDE = `
let allData = [], kpi7Cnt = {}, kpi7Ver = {}, kpi7Done = new Set();
let kpi7Loaded = false, kpi7Busy = false;
const APP_REV = 'harness', CACHE_TTL = 0;
const localStorage = { getItem(){return null;}, setItem(){}, removeItem(){} };
function setOv(){} function toast(m){ console.log('[toast]', m); }
function kpi7RenderAll(){} function renderPavoi(){} function runSelfChecks(){}
function kpi7CacheSave(){} function kpi7CacheLoad(){ return false; }
function ymHas(){ return true; }                       // harness: KHÔNG lọc năm/tháng
function fd(d){ return d ? String(d).slice(0,10) : '—'; }
`;

// fetchAll thật: gọi Galileo qua proxy, đi hết @odata.nextLink — cùng hợp đồng với bản trong app.
const FETCH = `
let REQ = 0;
async function fetchAll(url){
  let out = [];
  while(url){
    REQ++;
    const r = await fetch(url, { headers: { Origin: 'https://vjc-qa-amo.com' } });
    if(!r.ok) throw new Error('HTTP ' + r.status + ' cho ' + url.slice(0,120));
    const j = await r.json();
    out = out.concat(j.value || []);
    url = j['@odata.nextLink'] || null;
  }
  return out;
}
`;

const DRIVER = `
const F = s => '\\u001b[1m' + s + '\\u001b[0m';
let FAIL = 0;
function ok(cond, msg){ console.log((cond ? '  PASS  ' : '  FAIL  ') + msg); if(!cond) FAIL++; }

// 1) Cây org unit — copy đúng cách loadOrgUnitIds() đi cây
const h = await fetchAll(G_URL + 'dwreporting_organisational_unit_hierarchy' +
  '?$select=organisational_unit_id,name,parent_id,is_archived');
const byParent = {};
h.forEach(r => (byParent[r.parent_id] ||= []).push(r));
const ORG_UNIT_IDS = [ORG_UNIT_ID]; const seen = new Set(ORG_UNIT_IDS);
const walk = id => (byParent[id]||[]).forEach(c => {
  const cid = c.organisational_unit_id;
  if(c.is_archived || !cid || seen.has(cid)) return;
  seen.add(cid); ORG_UNIT_IDS.push(cid); walk(cid);
});
walk(ORG_UNIT_ID);
console.log('\\n[org-unit] QA AMO + ' + (ORG_UNIT_IDS.length-1) + ' ban con');

// 2) report_summary + dedup theo modified_date (đúng luật của loadData)
const orgFilter = '(' + ORG_UNIT_IDS.map(i => 'org_unit_id eq ' + i).join(' or ') + ')';
const rows = await fetchAll(G_URL + 'dwreporting_report_summary' +
  '?$select=report_id,report_title,report_number,report_status,org_unit_name,raised_date,modified_date,owner_id' +
  '&$filter=' + encodeURIComponent(orgFilter));
const sumMap = {};
rows.forEach(r => {
  if(!r.report_number || !r.report_number.trim()) return;
  const p = sumMap[r.report_id];
  if(!p || String(r.modified_date||'') > String(p.modified_date||'')) sumMap[r.report_id] = r;
});
const summary = Object.values(sumMap);
const pavoi = summary.filter(r => r.report_title === 'PAVOI');
console.log('[summary] ' + summary.length + ' report, trong do ' + pavoi.length + ' PAVOI');

// 3) owner_name
const users = await fetchAll(G_URL + 'dwreporting_users?$select=user_id,full_name');
const grps  = await fetchAll(G_URL + 'dwanalytics_user_group?$select=group_id,name');
const userMap = {};
users.forEach(u => { if(u.user_id) userMap[u.user_id] = u.full_name || null; });
grps.forEach(g => { if(g.group_id && !userMap[g.group_id]) userMap[g.group_id] = g.name || null; });

// 4) wf_stages cho PAVOI (kpi7Withdrawn cần) — chunk 15 GUID
const ids = pavoi.map(r => r.report_id);
const wfAllMap = {};
for(let i=0;i<ids.length;i+=15){
  const ch = ids.slice(i,i+15);
  const w = await fetchAll(G_URL + 'dwreporting_report_workflow' +
    '?$select=report_id,stage_type,stage_status,stage_completed_date,stage_target_date' +
    '&$filter=' + encodeURIComponent('(' + ch.map(id=>'report_id eq '+id).join(' or ') + ')'));
  w.forEach(x => (wfAllMap[x.report_id] ||= []).push(x));
}
console.log('[workflow] ' + Object.keys(wfAllMap).length + '/' + ids.length + ' PAVOI co stage');

// 4b) Target date CUA REPORT — cung nguon va cung luat first-wins nhu loadData():
//     custom field 'Target date' trong dwanalytics_report_form_section_field (cot text_value).
//     Fallback stage_target_date cua stage Task, dung thu tu uu tien cua app.
const tdRows = await fetchAll(G_URL + 'dwanalytics_report_form_section_field' +
  '?$select=report_id,field_name,text_value' +
  '&$filter=' + encodeURIComponent("field_name eq 'Target date'"));
const tdMap = {};
tdRows.forEach(f => { if(f.text_value && !tdMap[f.report_id]) tdMap[f.report_id] = f.text_value; });
const stageTd = {};
Object.entries(wfAllMap).forEach(([rid, ws]) => {
  const s = ws.find(w => w.stage_type === 'Task' && w.stage_target_date);
  if(s) stageTd[rid] = s.stage_target_date;
});
console.log('[target-date] ' + Object.keys(tdMap).length + ' PAVOI co custom field, ' +
            Object.keys(stageTd).length + ' co stage target');

// 5) Dựng allData ĐÚNG shape mà kpi7Stats/pavoiVerCell đọc
allData = pavoi.map(r => ({
  ...r,
  owner_name:  userMap[r.owner_id] || null,
  raised_ym:   r.raised_date ? r.raised_date.substring(0,7) : null,
  raised_year: r.raised_date ? new Date(r.raised_date).getFullYear() : null,
  wf_stages:   wfAllMap[r.report_id] || [],
  Target_date: tdMap[r.report_id] || stageTd[r.report_id] || null,
}));
console.log('[target-date] allData co Target_date: ' +
            allData.filter(r => r.Target_date).length + '/' + allData.length);
console.log('[allData] ' + allData.length + ' PAVOI');

// ── CHAY CHINH HAM CUA APP ──────────────────────────────────────────────
const reqBefore = REQ;
await loadKpi7Tasks();
console.log('\\n' + F('loadKpi7Tasks() that: ') + (REQ - reqBefore) + ' request, kpi7Loaded=' + kpi7Loaded +
            ', da phan loai ' + kpi7Done.size + '/' + allData.length + ' PAVOI');

const st = kpi7Stats();
console.log('\\n' + F('kpi7Stats() — MOI NAM'));
console.log('  ' + 'Section'.padEnd(46) + 'Asses  NoVer  Pend   Open  Closed  Total  Wdrawn   KPI%');
for(const k of st.order){
  const r = st.rows[k]; if(!r.total && !r.withdrawn) continue;
  console.log('  ' + String(k).padEnd(46) +
    String(r.assessed).padStart(5) + String(r.notAssessed).padStart(7) + String(r.pending).padStart(7) +
    String(r.open).padStart(7) + String(r.closed).padStart(7) + String(r.total).padStart(7) +
    String(r.withdrawn).padStart(8) + kpi7Fmt(kpi7Rate(r)).padStart(8));
}
const t = st.tot;
console.log('  ' + 'TOTAL — MQA'.padEnd(46) +
  String(t.assessed).padStart(5) + String(t.notAssessed).padStart(7) + String(t.pending).padStart(7) +
  String(t.open).padStart(7) + String(t.closed).padStart(7) + String(t.total).padStart(7) +
  String(t.withdrawn).padStart(8) + kpi7Fmt(kpi7Rate(t)).padStart(8));

// Rieng 2026 — dung chinh kpi7Stats() voi predicate nam
const st26 = kpi7Stats(r => r.raised_year === 2026);
const t26 = st26.tot;
console.log('\\n' + F('kpi7Stats() — CHI 2026: ') +
  'total ' + t26.total + ' (loai ' + t26.withdrawn + ' withdrawn khoi ' + (t26.total + t26.withdrawn) + ') · ' +
  'assessed ' + t26.assessed + ' · no verification ' + t26.notAssessed + ' · pending ' + t26.pending +
  ' → ' + F('KPI ' + kpi7Fmt(kpi7Rate(t26))));

// ── BAT BIEN + CA CHOT ──────────────────────────────────────────────────
console.log('\\n' + F('Bat bien tung dong (dung self-check cua app)'));
let inv1 = true, inv2 = true, inv3 = true;
for(const k of st.order){
  const r = st.rows[k];
  if(r.assessed + r.notAssessed + r.pending !== r.total) inv1 = false;
  if(r.open + r.closed !== r.total) inv2 = false;
  if(r.notList.length !== r.notAssessed) inv3 = false;
}
ok(inv1, 'assessed + notAssessed + pending === total (moi dong)');
ok(inv2, 'open + closed === total (moi dong)');
ok(inv3, 'notList.length === notAssessed (modal drill-down khop o dem)');
ok(t.pending === 0, 'khong PAVOI nao ket o pending (pending=' + t.pending + ')');

console.log('\\n' + F('7 ho so email 03/09 neu dich danh'));
const byNum = {}; allData.forEach(r => byNum[r.report_number] = r);
for(const n of ['PAVOI-422','PAVOI-418','PAVOI-411','PAVOI-407','PAVOI-397','PAVOI-388']){
  const r = byNum[n];
  ok(r && (kpi7Cnt[r.report_id]||0) === 0, n + ' = 0 luot xac minh' + (r ? '' : ' (KHONG THAY HO SO)'));
}
const p381 = byNum['PAVOI-381'];
ok(p381 && (kpi7Cnt[p381.report_id]||0) >= 1, 'PAVOI-381 co >=1 luot');
ok(p381 && kpi7Ver[p381.report_id] === '2026-03-13', 'PAVOI-381 Date verified som nhat = 2026-03-13 (thuc te: ' + (p381 ? kpi7Ver[p381.report_id] : '?') + ')');

console.log('\\n' + F('pavoiVerCell() — co 30 ngay, chay ham that'));
const strip = s => String(s).replace(/<[^>]*>/g,'').trim();
const kind  = s => /ff6b6b/.test(s) ? 'DO' : /--yellow/.test(s) ? 'VANG' : /--green/.test(s) ? 'XANH' : 'XAM';
for(const n of ['PAVOI-381','PAVOI-422']){
  const r = byNum[n]; if(!r) continue;
  const c = pavoiVerCell(r);
  console.log('  ' + n.padEnd(12) + 'raised ' + String(r.raised_date).slice(0,10) +
              '  →  ' + kind(c).padEnd(5) + ' "' + strip(c) + '"');
}
ok(p381 && kind(pavoiVerCell(p381)) === 'VANG', 'PAVOI-381 ra mau VANG (xac minh sau 50 ngay)');
const p422 = byNum['PAVOI-422'];
ok(p422 && ['DO','VANG'].includes(kind(pavoiVerCell(p422))), 'PAVOI-422 (chua xac minh, da qua han) ra DO hoac VANG');

// Nhanh DO phai duoc chay that: tim ho so chua xac minh + da qua Target date
const reds = allData.filter(r => kind(pavoiVerCell(r)) === 'DO');
ok(reds.length > 0, 'nhanh DO (overdue) co duoc chay: ' + reds.length + ' ho so');
reds.slice(0,3).forEach(r => console.log('  DO  ' + String(r.report_number).padEnd(12) +
  'raised ' + String(r.raised_date).slice(0,10) + '  target ' + String(r.Target_date).slice(0,10) +
  '  status ' + r.report_status));
// Ho so con TRONG han phai ra XAM, khong duoc tinh la loi
const today = new Date();
const fresh = allData.filter(r => r.raised_date && !kpi7Ver[r.report_id] &&
  (today - new Date(String(r.raised_date).slice(0,10))) < 30*86400000);
ok(fresh.every(r => kind(pavoiVerCell(r)) === 'XAM'),
   'ho so con trong 30 ngay chua xac minh ra XAM (chua toi han): ' + fresh.length + ' ho so');

// Phan bo mau tren toan bo PAVOI — dung ham that
const dist = {XANH:0, VANG:0, DO:0, XAM:0};
allData.forEach(r => dist[kind(pavoiVerCell(r))]++);
console.log('\\n' + F('Phan bo co tren ' + allData.length + ' PAVOI (moi nam): ') + JSON.stringify(dist));

console.log('\\n' + (FAIL === 0 ? F('KET QUA: TAT CA ASSERT PASS') : F('KET QUA: ' + FAIL + ' ASSERT FAIL')));
process.exit(FAIL === 0 ? 0 : 1);
`;

const CODE = PRELUDE + FETCH + EXTRACTED + '\n' + DRIVER;
fs.writeFileSync(BODY, CODE, 'utf8');
try { await import(pathToFileURL(BODY).href); } finally { try { fs.unlinkSync(BODY); } catch {} }
