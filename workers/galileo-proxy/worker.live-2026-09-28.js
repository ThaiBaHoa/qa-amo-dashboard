// Bản chạy trên Cloudflare tới 28/09/2026 (wrangler init --from-dash galileo-proxy). Mốc đối chiếu / lùi lại — KHÔNG deploy file này.
const ALLOWED_ORIGINS = [
  'https://vjc-qa-amo.com',
  'https://www.vjc-qa-amo.com',
  'https://thaibahoa.github.io',
  'http://127.0.0.1:5500',
  'http://localhost:5500',
];

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin');

    // Block nếu không có Origin hoặc không trong whitelist
    if (!origin || !ALLOWED_ORIGINS.includes(origin)) {
      return new Response('Forbidden', {
        status: 403,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    const corsHeaders = {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-IdeagenDataAPIKey',
      'Vary': 'Origin',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== 'GET') {
      return new Response('Method Not Allowed', {
        status: 405,
        headers: corsHeaders,
      });
    }

    const url = new URL(request.url);
    const targetPath = url.pathname.replace('/proxy/', '') + url.search;
    const targetUrl = 'https://vietjet.ideagendata.com/odata/' + targetPath;

    const apiKey = env.GALILEO_KEY;
    if (!apiKey) {
      return new Response('API key not configured', {
        status: 500,
        headers: corsHeaders,
      });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 90000);

    try {
      const response = await fetch(targetUrl, {
        signal: controller.signal,
        headers: {
          'X-IdeagenDataAPIKey': apiKey,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.text();

      return new Response(data, {
        status: response.status,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      });
    } catch (e) {
      const isTimeout = e.name === 'AbortError';
      return new Response(isTimeout ? 'Gateway Timeout' : 'Bad Gateway', {
        status: isTimeout ? 504 : 502,
        headers: corsHeaders,
      });
    } finally {
      clearTimeout(timeout);
    }
  },
};