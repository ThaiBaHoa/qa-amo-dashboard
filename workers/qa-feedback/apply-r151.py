# -*- coding: utf-8 -*-
"""
apply-r151.py — Áp tính năng "Bug Report → Telegram" vào dashboard.

VÌ SAO CÓ FILE NÀY: bản vá gốc được viết ở máy nhà trên nền r141, nhưng repo thật
đã ở r150 (16 commit). Thay vì commit code dựng trên nền cũ, toàn bộ thay đổi được
đóng lại thành script này để áp lên bản MỚI NHẤT ở bất kỳ máy nào.

DÙNG:
    git pull                      # phải ở r150 trở lên, cây làm việc sạch
    python workers/qa-feedback/apply-r151.py
    sh scripts/check-doc-sync.sh  # phải PASS

Script tự kiểm: mỗi điểm neo phải khớp ĐÚNG MỘT LẦN, sai là dừng và không ghi gì.
Chạy hai lần sẽ báo lỗi ở bước 1 (đã có FB_URL) — đúng như mong đợi.

Worker phía server ĐÃ DEPLOY và đang chạy từ 01/09/2026, không phải làm lại.
"""
import io, os, re, sys

REV = '2026.09.01-r151'
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.chdir(ROOT)


def patch(path, pairs):
    src = io.open(path, encoding='utf-8').read()
    out = src
    for old, new, label in pairs:
        n = out.count(old)
        if n != 1:
            sys.exit('DUNG [%s @ %s]: diem neo khop %d lan, can dung 1.\n'
                     '   -> File da doi. Doc lai anchor roi sua script.' % (label, path, n))
        out = out.replace(old, new)
        print('  ok  %s' % label)
    io.open(path, 'w', encoding='utf-8', newline='').write(out)


# ══════════════════════════ 1. index.html ══════════════════════════
MODAL = u'''<div class="overlay" id="bugModal" onclick="closeBugReport(event)" style="z-index:240;display:none">
  <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;width:95%;max-width:540px;display:flex;flex-direction:column" onclick="event.stopPropagation()">
    <div style="padding:14px 18px;border-bottom:1px solid var(--border);display:flex;align-items:flex-start;justify-content:space-between">
      <div>
        <div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.08em">Feedback</div>
        <div style="font-size:15px;font-weight:700;color:var(--text);margin-top:2px">Report a problem</div>
        <div style="font-size:11px;color:var(--muted);margin-top:3px" id="bugCtx">\u2014</div>
      </div>
      <button onclick="closeBugReport()" style="background:rgba(255,255,255,.06);border:1px solid var(--border);color:var(--muted);font-size:16px;cursor:pointer;padding:3px 10px;border-radius:6px;flex-shrink:0;margin-left:12px">\u2715</button>
    </div>
    <div style="padding:16px 18px">
      <textarea id="bugMsg" rows="5" maxlength="1500" placeholder="What went wrong? What did you expect to see instead?" style="width:100%;box-sizing:border-box;background:rgba(255,255,255,.02);border:1px solid var(--border);border-radius:8px;color:var(--text);font-family:inherit;font-size:13px;line-height:1.6;padding:10px 12px;resize:vertical"></textarea>
      <label style="display:flex;align-items:center;gap:8px;margin-top:12px;font-size:12px;color:var(--text-2);cursor:pointer">
        <input type="checkbox" id="bugShot" checked style="cursor:pointer">
        Attach a screenshot of this page
      </label>
      <button class="btn-primary" id="bugSend" onclick="sendBugReport()">Send report</button>
    </div>
  </div>
</div>

'''

FUNCS = u'''
// \u2500\u2500 BUG REPORT \u2192 Telegram qua worker qa-feedback (r151) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function openBugReport(){
  if(!curUser){ toast('Please sign in first','err'); return; }
  g('bugMsg').value=''; g('bugShot').checked=true;
  s('bugCtx',(g('pageTitle')?.textContent||'\\u2014')+' \\u00b7 Rev '+APP_REV);
  g('bugModal').style.display='flex';
  setTimeout(()=>g('bugMsg').focus(),50);
}
function closeBugReport(e){
  if(e&&e.target!==e.currentTarget)return;
  g('bugModal').style.display='none';
}
async function sendBugReport(){
  const msg=g('bugMsg').value.trim();
  if(!msg){ toast('Please describe the problem','err'); return; }
  const btn=g('bugSend'); btn.disabled=true; btn.textContent='Sending\\u2026';
  try{
    const {data}=await sb.auth.getSession();
    const tok=data?.session?.access_token;
    if(!tok) throw new Error('session expired, please sign in again');

    let shot=null;
    if(g('bugShot').checked){
      g('bugModal').style.display='none';          // dung chup ca cai modal vao anh
      try{
        const c=await html2canvas(document.body,{
          scale:.6, logging:false,
          backgroundColor:getComputedStyle(document.body).backgroundColor,
          x:window.scrollX, y:window.scrollY,
          width:window.innerWidth, height:window.innerHeight
        });
        shot=c.toDataURL('image/jpeg',.6);
      }catch(err){ console.warn('[bug] screenshot failed:',err.message); }
      g('bugModal').style.display='flex';
    }

    const r=await fetch(FB_URL,{
      method:'POST',
      headers:{'content-type':'application/json','Authorization':'Bearer '+tok},
      body:JSON.stringify({
        message:msg, name:curUser.full_name||curUser.email, role:curUser.role,
        page:g('pageTitle')?.textContent||'\\u2014', rev:APP_REV,
        ua:navigator.userAgent, shot
      })
    });
    if(!r.ok){ const j=await r.json().catch(()=>({})); throw new Error(j.error||('HTTP '+r.status)); }
    closeBugReport();
    toast('Thanks \\u2014 your report has been sent','ok');
  }catch(err){
    toast('Could not send report: '+err.message,'err');
  }finally{
    btn.disabled=false; btn.textContent='Send report';
  }
}

function toggleSidebar(){'''

print('index.html')
src = io.open('index.html', encoding='utf-8').read()
m = re.search(r"const APP_REV = '([^']+)';", src)
if not m:
    sys.exit('DUNG: khong tim thay APP_REV trong index.html')
cur = m.group(1)
print('  rev hien tai: %s  ->  %s' % (cur, REV))

patch('index.html', [
    (u"const G_URL     = 'https://galileo-proxy.thaibahoa2308.workers.dev/proxy/';",
     u"const G_URL     = 'https://galileo-proxy.thaibahoa2308.workers.dev/proxy/';\n"
     u"const FB_URL    = 'https://qa-feedback.thaibahoa2308.workers.dev';  // bug report -> Telegram (r151)",
     '1/5 FB_URL'),
    (u"""onclick="window.open('https://docs.google.com/forms/d/e/1FAIpQLSdzEq_BPTZ1ZCkLtpf3gG4NhnZ8kfojbrgIWeye56wYOmqo-A/viewform','_blank','noopener')\"""",
     u'onclick="openBugReport()"', '2/5 nut sidebar'),
    (u'<div class="overlay" id="overlay">', MODAL + u'<div class="overlay" id="overlay">', '3/5 markup modal'),
    (u'\nfunction toggleSidebar(){', FUNCS, '4/5 cac ham'),
    (u"const APP_REV = '%s';" % cur, u"const APP_REV = '%s';" % REV, '5/5 bump APP_REV'),
])


# ══════════════════════════ 2. TECHNICAL_REFERENCE.md ══════════════════════════
TR_TAIL_NEW = u"""### 3. `qa-feedback` (Bug report → Telegram — `FB_URL`, r151)

- Nhận **POST** JSON `{message, name, role, page, rev, ua, shot?}` từ modal Bug Report.
- **Bắt buộc `Authorization: Bearer <supabase access_token>`** — worker gọi
  `SUPA_URL/auth/v1/user` xác thực trước khi bắn Telegram. Không có bước này thì endpoint là
  công khai: ai biết URL cũng bơm tin nhắn vào Telegram admin không giới hạn. Email trong
  tin nhắn là email **đã xác thực phía server**, không phải người dùng tự khai.
- Origin ≠ `https://vjc-qa-amo.com` → 403. GET → 405.
- Secret: `TG_TOKEN` (bot @BotFather), `TG_CHAT` (chat_id admin). Vars: `SUPA_URL`, `SUPA_KEY`.
- `shot` (dataURL JPEG) gửi bằng `sendPhoto` **rời** khỏi tin nhắn text — caption Telegram
  giới hạn 1024 ký tự, nhét chung sẽ bị cắt. Ảnh hỏng thì bỏ qua, tin text đã gửi xong.
- **Source nằm TRONG repo:** `workers/qa-feedback/` (wrangler). Deploy `npx.cmd wrangler deploy`,
  xem log `npx.cmd wrangler tail`. Khác `galileo-proxy` và `galileo-ai` — hai worker đó chỉ
  tồn tại trong editor trên Cloudflare dashboard, không có bản nào trong git.
- Tách riêng khỏi `galileo-proxy` **có chủ đích**: proxy là đường dữ liệu sống của toàn app,
  hỏng nó là mất data mọi trang; kênh báo lỗi hỏng thì chỉ hỏng nút báo lỗi.

---

## Quy tắc khi sửa code"""

print('\nTECHNICAL_REFERENCE.md')
patch('TECHNICAL_REFERENCE.md', [
    (u"const AI_URL    = 'https://galileo-ai.thaibahoa2308.workers.dev';  // AI Assistant (r112)",
     u"const AI_URL    = 'https://galileo-ai.thaibahoa2308.workers.dev';  // AI Assistant (r112)\n"
     u"const FB_URL    = 'https://qa-feedback.thaibahoa2308.workers.dev'; // Bug report → Telegram (r151)",
     '1/3 config FB_URL'),
    (u'App có **2 Worker riêng** — đừng nhầm:',
     u'App có **3 Worker riêng** — đừng nhầm:', '2/3 dem worker 2->3'),
    (u"---\n\n## Quy tắc khi sửa code", TR_TAIL_NEW, '3/3 muc worker qa-feedback'),
])


# ══════════════════════════ 3. PROJECT_TECH_SPEC.md ══════════════════════════
S811 = u"""### 8.11 Bug Report → Telegram (r151, worker `qa-feedback`)

Thay nút Google Form (r111) bằng modal ngay trong app. Người dùng gõ mô tả, tuỳ chọn đính
ảnh màn hình, bấm gửi → tin nhắn Telegram tới máy admin kèm danh tính đã xác thực và bối
cảnh (trang đang xem, rev, trình duyệt). Google Form không biết ai gửi và gửi từ đâu.

**Đã cân nhắc và loại Chatwoot/Intercom:** nhu cầu là *thông báo*, không phải hộp thư hỗ trợ
nhiều agent. Chatwoot phải nuôi Rails + Postgres + Redis, và ảnh chụp màn hình chứa dữ liệu
QA sẽ nằm trên hạ tầng bên thứ ba.

**Đánh đổi đã chấp nhận:** kênh **MỘT CHIỀU**. Admin nhận được nhưng không trả lời lại
người báo ngay trong dashboard — phải nhắn Teams/email riêng. Đổi lấy việc không phải
dựng và trực một hệ hỗ trợ.

- Markup `#bugModal` (`.overlay`, z-index 240) đặt ngay trước overlay loading. Hàm
  `openBugReport` / `closeBugReport` / `sendBugReport`; const `FB_URL`.
- **Ảnh chụp chỉ vùng nhìn thấy** (`x/y/width/height` theo scroll + viewport), `scale .6`,
  JPEG .6 — không chụp toàn bộ chiều cao cuộn, trang bảng dài sẽ ra ảnh khổng lồ.
- Modal bị `display:none` trong lúc chụp rồi bật lại — không thì ảnh nào cũng có chính cái
  modal che giữa màn hình.
- **Nền ảnh lấy từ `getComputedStyle(document.body).backgroundColor`, KHÔNG hardcode.** App
  có cả theme sáng (`--bg:#eef1f5`) lẫn tối (`--bg:#0d1014`); hardcode màu tối thì người
  dùng theme sáng gửi đi ảnh nền đen.
- Chụp lỗi thì `console.warn` rồi **vẫn gửi tiếp không ảnh** — mất ảnh còn hơn mất cả báo cáo.
- Xác thực: kèm `Authorization: Bearer <supabase access_token>`; worker kiểm qua
  `/auth/v1/user` rồi mới bắn Telegram. Chi tiết: `TECHNICAL_REFERENCE.md` §Cloudflare
  Workers – 3; source `workers/qa-feedback/`.

**Đã kiểm chứng 01/09/2026:** worker deploy thành công; 3 cổng chặn trả đúng — `GET → 405
POST only`, `POST đúng origin nhưng thiếu token → 401 no session`, `POST sai origin → 403
forbidden origin`; JS inline qua `node --check` sạch trên cả 3 khối.
**CHƯA kiểm chứng:** chặng worker → Telegram và giao diện modal dựng thực tế — cần token
Supabase thật, mà worker chỉ nhận origin `vjc-qa-amo.com` nên localhost không test được.
**Phép thử thật là lần bấm nút đầu tiên trên site sau khi deploy**, soi bằng
`npx.cmd wrangler tail`.

"""

R151 = (
    u"| r151 | **Kênh báo lỗi chuyển từ Google Form sang Telegram.** "
    u"Nút `Feedback / Bug Report` (r111) trước đây mở Google Form ở tab mới — người dùng phải "
    u"rời dashboard, tự khai mình là ai, tự tả đang ở trang nào, và admin không biết lúc nào có "
    u"form mới. Nay bấm ra modal `#bugModal` ngay tại chỗ; gửi xong là tin nhắn Telegram tới máy "
    u"admin, kèm **danh tính đã xác thực phía server** (không phải tự khai), trang đang xem, rev, "
    u"trình duyệt, và **ảnh chụp màn hình** tự đính. "
    u"**Hạ tầng:** worker thứ 3 `qa-feedback`, **tách riêng khỏi `galileo-proxy` có chủ đích** — "
    u"proxy là đường dữ liệu sống của toàn app, sửa nhầm nó là mất data mọi trang, còn kênh báo "
    u"lỗi hỏng thì chỉ hỏng đúng nút báo lỗi. **Đây cũng là worker ĐẦU TIÊN có source trong git** "
    u"(`workers/qa-feedback/`, qua wrangler); `galileo-proxy` và `galileo-ai` vẫn chỉ sống trong "
    u"editor trên Cloudflare dashboard — không ai biết chúng từng là gì khi chúng hỏng. "
    u"**Bảo mật:** token bot nằm trong Worker secret, **không bao giờ trong `index.html`** — site "
    u"là GitHub Pages công khai, nhúng token vào đó là ai View Source cũng lấy được, obfuscate "
    u"không cứu được. Worker **bắt buộc** `Authorization: Bearer <supabase access_token>` hợp lệ — "
    u"thiếu bước này thì endpoint công khai, ai biết URL cũng bơm tin nhắn không giới hạn. "
    u"**Đã cân nhắc và loại Chatwoot:** nhu cầu là *thông báo* chứ không phải hộp thư hỗ trợ nhiều "
    u"agent — Chatwoot phải nuôi Rails + Postgres + Redis và đẩy ảnh chụp dữ liệu QA sang hạ tầng "
    u"bên thứ ba. **Đánh đổi đã chấp nhận: kênh MỘT CHIỀU** — không trả lời lại người báo trong "
    u"dashboard được, phải nhắn Teams/email riêng. "
    u"**Kiểm chứng 01/09/2026:** 3 cổng chặn của worker trả đúng (`GET→405`, `POST thiếu "
    u"token→401`, `POST sai origin→403`), `node --check` sạch trên cả 3 khối JS inline. "
    u"**Chưa kiểm được** chặng worker→Telegram và giao diện modal dựng thực tế: cần token Supabase "
    u"thật, mà worker chỉ nhận origin `vjc-qa-amo.com` nên localhost không test được — phép thử "
    u"thật là lần bấm đầu tiên trên site, soi bằng `wrangler tail`. |\n"
)

print('\nPROJECT_TECH_SPEC.md')
pts = io.open('PROJECT_TECH_SPEC.md', encoding='utf-8').read()
mv = re.search(r"\*\*Version hiện tại:\*\* `([^`]+)`", pts)
if not mv:
    sys.exit('DUNG: khong tim thay "Version hiện tại" trong PROJECT_TECH_SPEC.md')
mr = re.search(r"^\| (r\d+[^ |]*) \|", pts, re.M)
if not mr:
    sys.exit('DUNG: khong tim thay dong dau tien cua bang §14')
print('  §14 dong dau hien tai: %s' % mr.group(1))

patch('PROJECT_TECH_SPEC.md', [
    (u"**Version hiện tại:** `%s`" % mv.group(1),
     u"**Version hiện tại:** `%s`" % REV, '1/3 header version'),
    (u'### 9.1 Tokens', S811 + u'### 9.1 Tokens', '2/3 muc 8.11'),
    (u'| %s |' % mr.group(1), R151 + u'| %s |' % mr.group(1), '3/3 dong r151 vao §14'),
])


# ══════════════════════════ 4. CLAUDE.md (guard doc-sync doi) ══════════════════════════
print('\nCLAUDE.md')
cm = io.open('CLAUDE.md', encoding='utf-8').read()
mc = re.search(r"^Rev current: (\S+)", cm, re.M)
if not mc:
    sys.exit('DUNG: khong tim thay "Rev current:" trong CLAUDE.md')
print('  Rev current: %s  ->  %s' % (mc.group(1), REV))
patch('CLAUDE.md', [
    (u"Rev current: %s" % mc.group(1), u"Rev current: %s" % REV, '1/1 Rev current'),
])

print(u"""
XONG. Buoc tiep theo:
  sh scripts/check-doc-sync.sh          # phai PASS
  sh scripts/extract-inline-js.sh; for f in .ua-src/*.js; do node --check "$f"; done
  git add index.html PROJECT_TECH_SPEC.md TECHNICAL_REFERENCE.md CLAUDE.md workers .gitignore
  git commit                            # message bat dau bang 'r151: '
  # DUNG 'git add -A' — .ua-src/ phai giu untracked (xem ghi chu trong .gitignore)
""")
