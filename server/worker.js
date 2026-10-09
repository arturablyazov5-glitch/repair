// Cloudflare Worker: приём заявок с сайта -> Telegram. Деплой и переменные: docs/LEADS.md
// Переменные (vars): ALLOWED_ORIGIN. Секреты (wrangler secret put): BOT_TOKEN, CHAT_ID.
// Необязательно: KV-привязка RATE_KV (общий rate-limit для всех изолятов), TELEGRAM_API_BASE (для тестов).
import { handle, memoryLimiter, RATE } from './core.mjs';

const memAllow = memoryLimiter(); // best-effort: живёт в пределах одного изолята

async function kvAllow(kv, ip) {
  // Окно фиксированное (bucket по времени): ключ rl:<ip>:<номер окна>, TTL = окно
  const key = `rl:${ip}:${Math.floor(Date.now() / 1000 / RATE.windowSec)}`;
  const n = Number((await kv.get(key)) || 0);
  if (n >= RATE.max) return false;
  await kv.put(key, String(n + 1), { expirationTtl: Math.max(60, RATE.windowSec) });
  return true;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    const len = Number(request.headers.get('Content-Length') || 0);
    const res = await handle(
      {
        method: request.method, path: url.pathname, ip,
        origin: request.headers.get('Origin'),
        contentType: request.headers.get('Content-Type'),
        text: async () => { if (len > 64 * 1024) throw new Error('too_large'); return request.text(); },
      },
      {
        env,
        allow: async (addr) => memAllow(addr) && (env.RATE_KV ? kvAllow(env.RATE_KV, addr) : true),
        log: (o) => console.log(JSON.stringify(o)), // без ПДн: телефон и IP маскируются в core.mjs
      },
    );
    return new Response(res.body || null, { status: res.status, headers: res.headers });
  },
};
