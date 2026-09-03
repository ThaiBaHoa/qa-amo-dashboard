// qa-feedback — nhận bug report từ QA AMO Dashboard, đẩy vào Telegram.
// Secrets/vars cần đặt trong Cloudflare (Settings → Variables):
//   TG_TOKEN  (secret)  token bot từ @BotFather
//   TG_CHAT   (secret)  chat_id của bạn từ @userinfobot
//   SUPA_URL  (var)     https://xxxx.supabase.co   — giống SUPA_URL trong index.html
//   SUPA_KEY  (var)     anon key                   — giống SUPA_KEY trong index.html

const ALLOW = 'https://vjc-qa-amo.com';

export default {
  async fetch(req, env) {
    if (req.method === 'OPTIONS') return cors(new Response(null, { status: 204 }));
    if (req.method !== 'POST')    return cors(json({ error: 'POST only' }, 405));

    // 1 — chỉ nhận từ dashboard
    if (req.headers.get('Origin') !== ALLOW)
      return cors(json({ error: 'forbidden origin' }, 403));

    // 2 — người gửi phải đang đăng nhập (Supabase JWT), chống spam endpoint công khai
    const tok = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
    if (!tok) return cors(json({ error: 'no session' }, 401));
    const who = await fetch(env.SUPA_URL + '/auth/v1/user', {
      headers: { Authorization: 'Bearer ' + tok, apikey: env.SUPA_KEY }
    });
    if (!who.ok) return cors(json({ error: 'invalid session' }, 401));
    const email = (await who.json()).email || 'unknown';

    // 3 — payload
    let b;
    try { b = await req.json() } catch { return cors(json({ error: 'bad json' }, 400)) }
    const msg = String(b.message || '').trim().slice(0, 1500);
    if (!msg) return cors(json({ error: 'empty message' }, 400));

    const text =
      '🐛 <b>Bug Report — QA AMO Dashboard</b>\n\n' +
      '👤 ' + h(b.name) + '  <code>' + h(email) + '</code>  · ' + h(b.role) + '\n' +
      '📄 ' + h(b.page) + '  ·  Rev ' + h(b.rev) + '\n' +
      '🖥 ' + h(String(b.ua || '').slice(0, 130)) + '\n\n' +
      '<blockquote>' + h(msg) + '</blockquote>';

    const api = 'https://api.telegram.org/bot' + env.TG_TOKEN;
    const r = await fetch(api + '/sendMessage', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ chat_id: env.TG_CHAT, text, parse_mode: 'HTML' })
    });
    if (!r.ok) {
      // Nguyen van loi Telegram phai ra CA HAI cho. Truoc day no chi nam trong body,
      // ma `wrangler tail` khong doc body -> luc hong thi tail in "POST - Ok" va khong
      // noi gi them, dung cho can biet thi mu. Cung ho loi voi r146 (catch nuot loi).
      const detail = await r.text();
      console.error('telegram sendMessage ' + r.status + ': ' + detail);
      // 404 tu Telegram = token khong khop bot nao (KHONG phai 401). Nguyen nhan hay gap
      // nhat la ky tu thua dinh vao secret luc `wrangler secret put` tren Windows (CRLF).
      // Chi log HINH DANG, tuyet doi khong log gia tri.
      if (r.status === 404) {
        const t = String(env.TG_TOKEN == null ? '' : env.TG_TOKEN);
        const c = String(env.TG_CHAT  == null ? '' : env.TG_CHAT);
        console.error('shape TG_TOKEN: len=' + t.length
          + ' trimmedLen=' + t.trim().length
          + ' hasWhitespace=' + /\s/.test(t)
          + ' hasBotPrefix=' + /^bot/i.test(t)
          + ' canonical=' + /^\d{6,}:[A-Za-z0-9_-]{30,}$/.test(t)
          + ' idPartLen=' + (t.indexOf(':') >= 0 ? t.indexOf(':') : -1)
          + ' | TG_CHAT: len=' + c.length
          + ' trimmedLen=' + c.trim().length
          + ' numeric=' + /^-?\d+$/.test(c.trim()));
      }
      // 'chat not found' = TG_CHAT chua co cuoc tro chuyen voi CHINH bot nay. Hai nguyen
      // nhan khac han cach sua: chua bam Start voi bot nay, hay TG_CHAT la id tai khoan
      // khac. Hoi thang Telegram: bot nay ten gi, va ai da nhan cho no.
      if (/chat not found/i.test(detail)) {
        try {
          const me = await (await fetch(api + '/getMe')).json();
          console.error('bot dang dung: @' + (me.result && me.result.username));
          const up = await (await fetch(api + '/getUpdates')).json();
          const seen = (up.result || []).map(u => {
            const c = (u.message || u.my_chat_member || {}).chat || {};
            return c.id + '(' + (c.type || '?') + ')';
          });
          console.error('chat da nhan cho bot: ' + (seen.length ? [...new Set(seen)].join(', ')
                        : 'KHONG CO AI - chua ai bam Start voi bot nay')
                        + ' | TG_CHAT dang dat: ' + String(env.TG_CHAT));
        } catch (e) { console.error('chan doan chat that bai: ' + e); }
      }
      return cors(json({ error: 'telegram failed', detail }, 502));
    }

    // 4 — ảnh màn hình (tuỳ chọn, gửi rời để không đụng giới hạn caption 1024 ký tự)
    if (typeof b.shot === 'string' && b.shot.startsWith('data:image/')) {
      try {
        const bin = Uint8Array.from(atob(b.shot.split(',')[1]), c => c.charCodeAt(0));
        if (bin.length && bin.length < 9_000_000) {
          const fd = new FormData();
          fd.append('chat_id', env.TG_CHAT);
          fd.append('photo', new Blob([bin], { type: 'image/jpeg' }), 'screen.jpg');
          const p = await fetch(api + '/sendPhoto', { method: 'POST', body: fd });
          if (!p.ok) console.error('telegram sendPhoto ' + p.status + ': ' + await p.text());
        }
      } catch (e) {
        // Anh hong thi van bo qua — tin nhan text da gui duoc roi — nhung PHAI log,
        // khong thi anh mat im lang va khong ai biet.
        console.error('telegram sendPhoto threw: ' + e);
      }
    }

    return cors(json({ ok: true }));
  }
};

const h    = s => String(s == null || s === '' ? '—' : s)
                    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const json = (o, s = 200) => new Response(JSON.stringify(o),
                    { status: s, headers: { 'content-type': 'application/json' } });
const cors = r => {
  r.headers.set('Access-Control-Allow-Origin', ALLOW);
  r.headers.set('Access-Control-Allow-Headers', 'content-type,authorization');
  r.headers.set('Access-Control-Allow-Methods', 'POST,OPTIONS');
  return r;
};
