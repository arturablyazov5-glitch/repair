// Общая логика приёма заявок (Cloudflare Worker и node-server). Без зависимостей.
// Контракт: POST JSON {name, phone, device?, brand?, problem?, consent, source?, page?, website?(honeypot)}
// Ответ: {ok:true} | {ok:false, error:'<код>'}

export const LIMITS = { name: 60, phone: 30, device: 100, brand: 60, problem: 1000, source: 40, page: 500 };
export const MAX_BODY = 8 * 1024; // байт
export const RATE = { max: 5, windowSec: 600 }; // не больше 5 заявок с одного IP за 10 минут

export const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// +7 (928) 884-77-90 / 89288847790 / 9288847790 -> 79288847790 | null
export function normalizePhone(v) {
  let d = String(v ?? '').replace(/\D/g, '');
  if (d.length === 10 && d[0] === '9') d = '7' + d;
  if (d.length === 11 && d[0] === '8') d = '7' + d.slice(1);
  return /^7\d{10}$/.test(d) ? d : null;
}
const fmtPhone = (d) => `+7 (${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7, 9)}-${d.slice(9, 11)}`;
// Для логов: только последние 2 цифры
export const maskPhone = (v) => { const d = String(v ?? '').replace(/\D/g, ''); return d ? `+7 *** ***-**-${d.slice(-2).padStart(2, '*')}` : '-'; };
// Для логов: IPv4 без последнего октета, IPv6 — первые 3 группы
export const maskIp = (ip) => { ip = String(ip || ''); if (ip.includes('.')) return ip.split('.').slice(0, 3).join('.') + '.x'; if (ip.includes(':')) return ip.split(':').slice(0, 3).join(':') + ':…'; return '-'; };

const clean = (v) => String(v ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim();

/** Валидация. Возвращает {ok:true, lead} | {ok:false, error} | {ok:true, spam:true} */
export function validate(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { ok: false, error: 'bad_json' };
  if (clean(body.website)) return { ok: true, spam: true }; // honeypot: боту отвечаем «успех», но никуда не шлём
  for (const k of Object.keys(LIMITS)) {
    if (body[k] != null && typeof body[k] !== 'string' && typeof body[k] !== 'number') return { ok: false, error: 'bad_field_' + k };
    if (k !== 'page' && clean(body[k]).length > LIMITS[k]) return { ok: false, error: 'too_long_' + k }; // page (URL c UTM) не отклоняем, а обрезаем
  }
  const name = clean(body.name);
  if (name.length < 2 || !/\p{L}/u.test(name)) return { ok: false, error: 'name' };
  const phone = normalizePhone(body.phone);
  if (!phone) return { ok: false, error: 'phone' };
  if (!(body.consent === true || body.consent === 'on' || body.consent === 'true')) return { ok: false, error: 'consent' };
  return {
    ok: true,
    lead: { name, phone, device: clean(body.device), brand: clean(body.brand), problem: clean(body.problem), source: clean(body.source) || 'site', page: clean(body.page).slice(0, LIMITS.page) },
  };
}

export function formatMessage(l, now = new Date()) {
  const when = now.toLocaleString('ru-RU', { timeZone: 'Europe/Moscow', dateStyle: 'short', timeStyle: 'short' });
  const row = (label, v) => (v ? `\n<b>${label}:</b> ${escapeHtml(v)}` : '');
  return `🛠 <b>Новая заявка с сайта</b>` +
    row('Имя', l.name) +
    `\n<b>Телефон:</b> <a href="tel:+${l.phone}">${fmtPhone(l.phone)}</a>` +
    row('Техника', l.device) + row('Бренд', l.brand) + row('Проблема', l.problem) +
    `\n\n<i>Форма: ${escapeHtml(l.source)} · ${escapeHtml(when)} МСК</i>` +
    (l.page ? `\n<i>${escapeHtml(l.page)}</i>` : '') +
    `\n<i>Согласие на обработку ПДн: получено</i>`;
}

export async function sendTelegram(env, text, fetchImpl = fetch) {
  if (!env.BOT_TOKEN || !env.CHAT_ID) return { ok: false, error: 'not_configured' };
  const base = (env.TELEGRAM_API_BASE || 'https://api.telegram.org').replace(/\/$/, '');
  try {
    const r = await fetchImpl(`${base}/bot${env.BOT_TOKEN}/sendMessage`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: env.CHAT_ID, text, parse_mode: 'HTML', disable_web_page_preview: true }),
      signal: AbortSignal.timeout(8000),
    });
    const j = await r.json().catch(() => ({}));
    return r.ok && j.ok ? { ok: true } : { ok: false, error: 'delivery', status: r.status, desc: j.description };
  } catch (e) {
    return { ok: false, error: 'delivery', desc: e.name };
  }
}

// ALLOWED_ORIGIN: "https://site.ru" или через запятую "https://site.ru,https://www.site.ru"
export function corsHeaders(env, origin) {
  const allowed = String(env.ALLOWED_ORIGIN || '').split(',').map((s) => s.trim().replace(/\/$/, '')).filter(Boolean);
  const ok = !!origin && allowed.includes(origin);
  return {
    ok,
    headers: ok ? { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '86400', Vary: 'Origin' } : { Vary: 'Origin' },
  };
}

// Простой rate-limit в памяти процесса/изолята: Map ip -> [timestamps]
export function memoryLimiter(max = RATE.max, windowSec = RATE.windowSec) {
  const hits = new Map();
  return (ip, now = Date.now()) => {
    const from = now - windowSec * 1000;
    const arr = (hits.get(ip) || []).filter((t) => t > from);
    if (arr.length >= max) { hits.set(ip, arr); return false; }
    arr.push(now); hits.set(ip, arr);
    if (hits.size > 5000) for (const [k, v] of hits) if (!v.some((t) => t > from)) hits.delete(k);
    return true;
  };
}

/**
 * Общий обработчик. req = {method, origin, ip, contentType, text: () => Promise<string>}
 * deps = {env, allow(ip) => Promise<bool>|bool, log(obj), fetch}
 * Возвращает {status, headers, body}
 */
export async function handle(req, deps) {
  const { env, log = () => {} } = deps;
  const cors = corsHeaders(env, req.origin);
  const json = (status, body) => ({ status, headers: { ...cors.headers, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }, body: JSON.stringify(body) });
  const base = { ip: maskIp(req.ip) };

  if (req.method === 'OPTIONS') return cors.ok ? { status: 204, headers: cors.headers, body: '' } : json(403, { ok: false, error: 'origin' });
  if (req.method === 'GET' && req.path === '/health') return json(200, { ok: true });
  if (req.method !== 'POST') return json(405, { ok: false, error: 'method' });
  if (!cors.ok) { log({ ...base, result: 'origin_denied', origin: String(req.origin || '-').slice(0, 80) }); return json(403, { ok: false, error: 'origin' }); }
  if (!/^application\/json\b/i.test(req.contentType || '')) return json(415, { ok: false, error: 'content_type' });

  let raw;
  try { raw = await req.text(); } catch { return json(413, { ok: false, error: 'too_large' }); }
  if (raw.length > MAX_BODY) return json(413, { ok: false, error: 'too_large' });
  let body; try { body = JSON.parse(raw); } catch { return json(400, { ok: false, error: 'bad_json' }); }

  const v = validate(body);
  if (!v.ok) { log({ ...base, result: 'invalid', error: v.error }); return json(400, { ok: false, error: v.error }); }
  if (v.spam) { log({ ...base, result: 'honeypot' }); return json(200, { ok: true }); }

  if (!(await deps.allow(req.ip || 'unknown'))) { log({ ...base, result: 'rate_limited' }); return json(429, { ok: false, error: 'rate_limit' }); }

  const sent = await sendTelegram(env, formatMessage(v.lead), deps.fetch);
  log({ ...base, result: sent.ok ? 'sent' : sent.error, phone: maskPhone(v.lead.phone), source: v.lead.source, tg: sent.ok ? undefined : sent.status || sent.desc });
  return sent.ok ? json(200, { ok: true }) : json(502, { ok: false, error: sent.error });
}
