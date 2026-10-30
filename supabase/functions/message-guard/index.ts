// Message guard Edge Function
// - Verifies Cloudflare Turnstile token
// - Rate limits by hashed IP using public.check_message_rate RPC
// - Inserts with the service role, so direct anon inserts can be revoked
//
// Required secret: TURNSTILE_SECRET_KEY (set via Supabase dashboard/CLI).
// Supabase runtime injects SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.

const ALLOWED_ORIGINS = new Set([
  'https://nosferatuxada.github.io',
  'http://localhost:4000',
  'http://127.0.0.1:4000',
]);

const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const RATE_LIMIT = 5;
const RATE_WINDOW_SECONDS = 600;

function corsHeaders(origin: string | null): HeadersInit {
  const allowedOrigin = origin && ALLOWED_ORIGINS.has(origin)
    ? origin
    : 'https://nosferatuxada.github.io';

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Vary': 'Origin',
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
  };
}

function jsonResponse(
  payload: unknown,
  status = 200,
  origin: string | null = null,
): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders(origin),
      'Content-Type': 'application/json; charset=utf-8',
    },
  });
}

async function sha256Hex(value: string): Promise<string> {
  const hash = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(value),
  );
  return Array.from(new Uint8Array(hash))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get('origin');

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ message: 'Method not allowed.' }, 405, origin);
  }

  if (origin && !ALLOWED_ORIGINS.has(origin)) {
    return jsonResponse({ message: 'Origin not allowed.' }, 403, origin);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const turnstileSecret = Deno.env.get('TURNSTILE_SECRET_KEY');

  if (!supabaseUrl || !serviceKey || !turnstileSecret) {
    console.error('message-guard: missing required environment variables');
    return jsonResponse({ message: '服务未配置，请稍后再试。' }, 500, origin);
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ message: '请求格式错误。' }, 400, origin);
  }

  const content = typeof body.content === 'string' ? body.content.trim() : '';
  const anonymous = body.anonymous === true;
  const name = anonymous ? null : String(body.name ?? '').trim();
  const turnstileToken = typeof body.turnstileToken === 'string'
    ? body.turnstileToken.trim()
    : '';

  if (!content) {
    return jsonResponse({ message: '留言内容不能为空。' }, 400, origin);
  }
  if (content.length > 500) {
    return jsonResponse({ message: '留言不能超过 500 个字符。' }, 400, origin);
  }
  if (!anonymous && (!name || name.length > 20)) {
    return jsonResponse({ message: '留名时请填写 1–20 个字符的名字。' }, 400, origin);
  }
  if (!turnstileToken) {
    return jsonResponse({ message: '请先完成人机验证。' }, 400, origin);
  }

  // Forwarded client IP (do not store it raw; only a salted hash is persisted).
  const forwarded = req.headers.get('x-forwarded-for') ?? '';
  const ip = req.headers.get('cf-connecting-ip')
    ?? forwarded.split(',')[0].trim()
    ?? 'unknown';
  const salt = Deno.env.get('RATE_LIMIT_SALT') ?? 'surreal-message-board';
  const ipHash = await sha256Hex(`${ip}|${salt}`);

  // 1) Cloudflare Turnstile verification.
  const turnstileBody = new URLSearchParams();
  turnstileBody.set('secret', turnstileSecret);
  turnstileBody.set('response', turnstileToken);
  if (ip && ip !== 'unknown') turnstileBody.set('remoteip', ip);

  let turnstileOk = false;
  try {
    const verifyRes = await fetch(TURNSTILE_VERIFY_URL, {
      method: 'POST',
      body: turnstileBody,
    });
    const verifyJson = await verifyRes.json();
    turnstileOk = verifyJson?.success === true;
  } catch (err) {
    console.error('message-guard: turnstile request failed', err);
    return jsonResponse({ message: '人机验证服务不可用，请稍后再试。' }, 503, origin);
  }

  if (!turnstileOk) {
    return jsonResponse({ message: '人机验证失败，请刷新后重试。' }, 400, origin);
  }

  // 2) IP rate limit (5 messages / 10 minutes).
  let rateAllowed = false;
  try {
    const rateRes = await fetch(`${supabaseUrl}/rest/v1/rpc/check_message_rate`, {
      method: 'POST',
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        p_ip_hash: ipHash,
        p_limit: RATE_LIMIT,
        p_window_seconds: RATE_WINDOW_SECONDS,
      }),
    });

    if (!rateRes.ok) {
      console.error('message-guard: rate rpc failed', rateRes.status, await rateRes.text());
      return jsonResponse({ message: '服务暂时不可用，请稍后再试。' }, 503, origin);
    }

    rateAllowed = (await rateRes.json()) === true;
  } catch (err) {
    console.error('message-guard: rate rpc request failed', err);
    return jsonResponse({ message: '服务暂时不可用，请稍后再试。' }, 503, origin);
  }

  if (!rateAllowed) {
    return jsonResponse({ message: '操作太频繁，请 10 分钟后再试。' }, 429, origin);
  }

  // 3) Insert with service role (bypasses RLS; anon inserts are revoked).
  try {
    const insertRes = await fetch(`${supabaseUrl}/rest/v1/messages`, {
      method: 'POST',
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify([{ name, content, anonymous }]),
    });

    if (!insertRes.ok) {
      console.error('message-guard: insert failed', insertRes.status, await insertRes.text());
      return jsonResponse({ message: '留言保存失败，请稍后再试。' }, 500, origin);
    }

    const rows = await insertRes.json();
    const inserted = Array.isArray(rows) ? rows[0] : rows;
    return jsonResponse({ ok: true, message: inserted ?? null }, 201, origin);
  } catch (err) {
    console.error('message-guard: insert request failed', err);
    return jsonResponse({ message: '留言保存失败，请稍后再试。' }, 500, origin);
  }
});
