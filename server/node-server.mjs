#!/usr/bin/env node
// Приёмник заявок на чистом Node.js (>=18, без зависимостей) — для хостинга в РФ (152-ФЗ). Тот же контракт, что worker.js.
// Запуск: BOT_TOKEN=... CHAT_ID=... ALLOWED_ORIGIN=https://site.ru node server/node-server.mjs
// Переменные: PORT (8787), HOST (127.0.0.1), ALLOWED_ORIGIN, BOT_TOKEN, CHAT_ID,
//   LEADS_FILE=/var/lib/leads/leads.jsonl — дописывать каждую заявку (JSON-строка) в файл на этом сервере (права 600),
//   TRUST_PROXY=1 — брать IP из X-Real-IP / X-Forwarded-For (только за своим nginx!), TELEGRAM_API_BASE (для тестов).
import http from 'node:http';
import fs from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { handle, memoryLimiter, MAX_BODY } from './core.mjs';

export function createServer(env = process.env, { log = (o) => console.log(JSON.stringify({ t: new Date().toISOString(), ...o })) } = {}) {
  const allow = memoryLimiter();
  const store = env.LEADS_FILE ? (lead) => fs.appendFile(env.LEADS_FILE, JSON.stringify({ t: new Date().toISOString(), ...lead }) + '\n', { mode: 0o600 }) : undefined;
  return http.createServer(async (req, res) => {
    let ip = req.socket.remoteAddress || 'unknown';
    if (env.TRUST_PROXY === '1') ip = String(req.headers['x-real-ip'] || req.headers['x-forwarded-for'] || ip).split(',')[0].trim();
    const text = () => new Promise((resolve, reject) => {
      // Лишнее не копим; совсем огромное тело (>1 МБ) — рвём соединение
      let size = 0; const chunks = [];
      req.on('data', (c) => { size += c.length; if (size <= MAX_BODY) chunks.push(c); else if (size > 1024 * 1024) req.destroy(); });
      req.on('end', () => (size > MAX_BODY ? reject(new Error('too_large')) : resolve(Buffer.concat(chunks).toString('utf8'))));
      req.on('error', reject);
    });
    try {
      const r = await handle(
        { method: req.method, path: new URL(req.url, 'http://x').pathname, ip, origin: req.headers.origin, contentType: req.headers['content-type'], text },
        { env, allow, log, store },
      );
      if (!res.destroyed) { res.writeHead(r.status, r.headers); res.end(r.body); }
    } catch (e) {
      log({ result: 'server_error', err: e.name });
      if (!res.destroyed) { res.writeHead(500, { 'Content-Type': 'application/json' }); res.end('{"ok":false,"error":"server"}'); }
    }
  });
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  const port = Number(process.env.PORT || 8787), host = process.env.HOST || '127.0.0.1';
  if (!process.env.BOT_TOKEN || !process.env.CHAT_ID) console.warn('ВНИМАНИЕ: не заданы BOT_TOKEN/CHAT_ID — заявки будут отклоняться (502 not_configured)');
  if (!process.env.ALLOWED_ORIGIN) console.warn('ВНИМАНИЕ: не задан ALLOWED_ORIGIN — все запросы получат 403');
  createServer().listen(port, host, () => console.log(`leads server: http://${host}:${port}`));
}
