/**
 * QA AMO Dashboard - AI Proxy Worker (galileo-ai)
 * Key luu trong Secret ANTHROPIC_API_KEY - khong nam trong code.
 */

// Copied by hand from the Cloudflare dashboard editor, version 226d55c0, 02/11/2026 (read from the screen,
// so spacing in the header comment may differ). Kept as the rollback: paste it back in the editor.
const MODEL = 'claude-haiku-4-5';
const MAX_TOKENS = 2048;

// Cac origin duoc phep goi worker nay. De trong mang = cho phep tat ca.
const ALLOWED_ORIGINS = [
  // 'https://vjc-qa-amo.com',
  // 'http://localhost:8000',
];

function corsHeaders(origin) {
  const allow =
    ALLOWED_ORIGINS.length === 0 || ALLOWED_ORIGINS.includes(origin)
      ? origin || '*'
      : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const cors = corsHeaders(origin);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }
    if (request.method !== 'POST') {
      return json({ error: 'POST only' }, 405, cors);
    }
    if (!env.ANTHROPIC_API_KEY) {
      return json(
        { error: 'ANTHROPIC_API_KEY chua duoc cau hinh trong Worker env' },
        500, cors
      );
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: 'Invalid JSON' }, 400, cors);
    }

    const { messages, system, tools } = body || {};
    if (!Array.isArray(messages) || messages.length === 0) {
      return json({ error: 'messages required' }, 400, cors);
    }
    const payloadSize = JSON.stringify(messages).length;
    if (payloadSize > 400000) {
      return json({ error: 'Conversation too large' }, 413, cors);
    }

    const apiBody = {
      model: MODEL,
      max_tokens: MAX_TOKENS,
      messages,
    };
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

function json(obj, status, cors) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type': 'application/json', ...cors },
  });
}
