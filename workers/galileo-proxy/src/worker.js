// galileo-proxy — the dashboard's read path to Galileo OData (G_URL in classic.html).
// Source was only in the Cloudflare dashboard editor until 28/09/2026; the last version from there
// is kept at ../worker.live-2026-09-28.js. Deploy from this folder: `npx.cmd wrangler deploy`.
//
// Rules kept from the old worker: GET only, Origin allow-list, Galileo key only in the GALILEO_KEY
// secret, 90s upstream timeout (= FETCH_TIMEOUT_MS in classic.html — keep them equal).
//
// New (28/09/2026):
//  1. SIGN-IN. The Origin check alone is not protection — any HTTP client can send any Origin, so
//     VietJet's Galileo data was readable by anyone who knew the URL (it is in the public index.html).
//     The dashboard now sends `Authorization: Bearer <Supabase access token>`; the worker checks it
//     against Supabase (/auth/v1/user) and reads the caller's role from public.users with the caller's
//     own token (RLS lets a user read their own row). 'pending' / 'rejected' / no profile = refused,
//     the same gate as the login screen. A result is remembered 5 min per token (never past the
//     token's own expiry), so a page load costs 2 Supabase calls, not 2 per Galileo request.
//     AUTH_MODE (wrangler.jsonc vars): 'soft' = check and log, but still serve (rollout step 1, while
//     browsers still run the old page); 'enforce' = refuse with 401/403.
//  2. STREAMING. The body used to be read whole (`await response.text()`) before the reply started,
//     so the browser got no headers until the last byte — its hedging (fetchHedged, r173-i1) could not
//     tell "server silent" from "big body downloading". The body is now passed through as a stream.
const ALLOWED_ORIGINS = [
  'https://vjc-qa-amo.com',
  'https://www.vjc-qa-amo.com',
  'https://thaibahoa.github.io',
  'http://127.0.0.1:5500',
  'http://localhost:5500',
];
const UPSTREAM = 'https://vietjet.ideagendata.com/odata/';
const TIMEOUT_MS = 90000;
const AUTH_TTL_MS = 5 * 60 * 1000;
const REFUSED_ROLES = ['pending', 'rejected'];

const authCache = new Map();   // token -> { ok, why, role, email, exp }

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
      res = !role ? { ok: false, status: 403, why: 'no profile' }
          : REFUSED_ROLES.includes(role) ? { ok: false, status: 403, why: 'account ' + role }
          : { ok: true, role, email: user.email };
    }
  } catch (e) {
    return { ok: false, status: 503, why: 'sign-in check failed: ' + e.message };   // not cached
  }
  const tokExp = jwtExpMs(tok);
  res.exp = Math.min(now + AUTH_TTL_MS, tokExp || now + AUTH_TTL_MS);
  if (authCache.size > 1000) authCache.clear();
  authCache.set(tok, res);
  return res;
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin');
    if (!origin || !ALLOWED_ORIGINS.includes(origin)) {
      return new Response('Forbidden', { status: 403, headers: { 'Content-Type': 'text/plain' } });
    }

    const corsHeaders = {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
      'Vary': 'Origin',
    };

    if (request.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
    if (request.method !== 'GET') {
      return new Response('Method Not Allowed', { status: 405, headers: corsHeaders });
    }

    const url = new URL(request.url);
    const mode = env.AUTH_MODE === 'enforce' ? 'enforce' : 'soft';
    const auth = await checkAuth(request, env);
    if (!auth.ok) {
      // one line per refused/unauthenticated request: Workers Logs (observability) shows how many
      // calls still come without a session before AUTH_MODE is switched to 'enforce'
      console.log(JSON.stringify({ auth: mode === 'enforce' ? 'refused' : 'soft-allow', why: auth.why, path: url.pathname }));
      if (mode === 'enforce') {
        return new Response(JSON.stringify({ error: auth.why }), {
          status: auth.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const apiKey = env.GALILEO_KEY;
    if (!apiKey) return new Response('API key not configured', { status: 500, headers: corsHeaders });

    const targetUrl = UPSTREAM + url.pathname.replace('/proxy/', '') + url.search;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const response = await fetch(targetUrl, {
        signal: controller.signal,
        headers: { 'X-IdeagenDataAPIKey': apiKey, 'Content-Type': 'application/json' },
      });
      // headers are in: the upstream answered. The body streams through; the browser applies its own
      // body timeout (classic fetchOnce, r173-i1).
      clearTimeout(timeout);
      return new Response(response.body, {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (e) {
      clearTimeout(timeout);
      const isTimeout = e.name === 'AbortError';
      return new Response(isTimeout ? 'Gateway Timeout' : 'Bad Gateway', {
        status: isTimeout ? 504 : 502, headers: corsHeaders,
      });
    }
  },
};
