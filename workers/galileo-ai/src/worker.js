// galileo-ai — AI Assistant's path to the Anthropic Messages API (AI_URL in classic.html).
// Source was only in the Cloudflare dashboard editor until 02/11/2026; the last version from there is
// kept at ../worker.live-2026-11-02.js. Deploy from this folder: `npx.cmd wrangler deploy`.
//
// Rules kept from the old worker: POST only, the key only in the ANTHROPIC_API_KEY secret, conversation
// size limit, model and max_tokens fixed here so a caller cannot choose a costlier call.
//
// New (02/11/2026): the old worker checked nothing, so anyone who knew the URL (it is in the public
// index.html) could spend the key.
//  1. ORIGIN allow-list. Stops other sites' pages only: any HTTP client can send any Origin.
//  2. SIGN-IN and ROLE, the same check as galileo-proxy: the Supabase token is verified at /auth/v1/user
//     and the role read from public.users with the caller's own token (RLS lets a user read their own row).
//     Only admin and moderator may chat (roles r213). A result is remembered 5 min per token, never past
//     the token's own expiry, so a changed role takes effect within 5 minutes.
//     AUTH_MODE (wrangler.jsonc vars): 'soft' = check and log, still serve (while browsers run the old
//     page, which sends no token); 'enforce' = refuse with 401/403.
const MODEL = 'claude-haiku-4-5';
const MAX_TOKENS = 2048;
const MAX_MESSAGES_SIZE = 400000;

const ALLOWED_ORIGINS = [
  'https://vjc-qa-amo.com',
  'https://www.vjc-qa-amo.com',
  'http://127.0.0.1:5520',   // local preview (rebuild UIUX/beta-devserver.mjs)
];
const ALLOWED_ROLES = ['admin', 'moderator'];
const AUTH_TTL_MS = 5 * 60 * 1000;

const authCache = new Map();   // token -> { ok, status, why, role, exp }

function jwtExpMs(tok) {
  try {
    const p = tok.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const exp = JSON.parse(atob(p + '='.repeat((4 - p.length % 4) % 4))).exp;
    return typeof exp === 'number' ? exp * 1000 : 0;
  } catch { return 0; }
}

async function checkAuth(request, env) {
  const tok = (request.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '').trim();
  if (!tok) return { ok: false, status: 401, why: 'no session' };
  const now = Date.now();
  const hit = authCache.get(tok);
  if (hit && hit.exp > now) return hit;

  const sb = { Authorization: 'Bearer ' + tok, apikey: env.SUPA_KEY };
  let res;
  try {
    const u = await fetch(env.SUPA_URL + '/auth/v1/user', { headers: sb });
    if (u.status >= 500) return { ok: false, status: 503, why: 'sign-in server unavailable' };   // not cached
    if (!u.ok) {
      res = { ok: false, status: 401, why: 'invalid or expired session' };
    } else {
      const user = await u.json();
      const p = await fetch(env.SUPA_URL + '/rest/v1/users?select=role&supabase_id=eq.' + encodeURIComponent(user.id), { headers: sb });
      if (!p.ok) return { ok: false, status: 503, why: 'profile lookup failed (' + p.status + ')' };   // not cached
      const role = ((await p.json())[0] || {}).role;
      res = ALLOWED_ROLES.includes(role) ? { ok: true, role }
          : { ok: false, status: 403, why: 'role ' + (role || 'none') + ' cannot use the AI Assistant' };
    }
  } catch (e) {
    return { ok: false, status: 503, why: 'sign-in check failed: ' + e.message };   // not cached
  }
  res.exp = Math.min(now + AUTH_TTL_MS, jwtExpMs(tok) || now + AUTH_TTL_MS);
  if (authCache.size > 1000) authCache.clear();
  authCache.set(tok, res);
  return res;
}

function json(obj, status, cors) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type': 'application/json', ...cors },
  });
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin');
    if (!origin || !ALLOWED_ORIGINS.includes(origin)) {
      return new Response('Forbidden', { status: 403, headers: { 'Content-Type': 'text/plain' } });
    }
    const cors = {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
      'Vary': 'Origin',
    };

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (request.method !== 'POST') return json({ error: 'POST only' }, 405, cors);
    if (!env.ANTHROPIC_API_KEY) return json({ error: 'ANTHROPIC_API_KEY is not configured' }, 500, cors);

    const mode = env.AUTH_MODE === 'enforce' ? 'enforce' : 'soft';
    const auth = await checkAuth(request, env);
    if (!auth.ok) {
      // one line per refused call: Workers Logs shows who still calls without a session before 'enforce'
      console.log(JSON.stringify({ auth: mode === 'enforce' ? 'refused' : 'soft-allow', why: auth.why }));
      if (mode === 'enforce') return json({ error: { message: auth.why } }, auth.status, cors);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: 'Invalid JSON' }, 400, cors);
    }

    const { messages, system, tools } = body || {};
    if (!Array.isArray(messages) || messages.length === 0) return json({ error: 'messages required' }, 400, cors);
    if (JSON.stringify(messages).length > MAX_MESSAGES_SIZE) return json({ error: 'Conversation too large' }, 413, cors);

    const apiBody = { model: MODEL, max_tokens: MAX_TOKENS, messages };
    if (system) apiBody.system = system;
    if (Array.isArray(tools) && tools.length) apiBody.tools = tools;

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(apiBody),
      });
      const data = await res.text();
      return new Response(data, {
        status: res.status,
        headers: { 'content-type': 'application/json', ...cors },
      });
    } catch (e) {
      return json({ error: 'Upstream error: ' + e.message }, 502, cors);
    }
  },
};
