// Мини-сервер статики для замеров (без зависимостей).
// node tools/serve.mjs <dir> <port>
// Отдаёт предсжатые .br/.gz, если они лежат рядом с файлом и клиент их принимает (как nginx gzip_static/brotli_static).
// На лету НЕ сжимает: dev-сборка меряется «как есть», dist — с тем, что реально будет на сервере.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.avif': 'image/avif', '.woff2': 'font/woff2', '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml', '.mp4': 'video/mp4', '.webmanifest': 'application/manifest+json'
};

export function serve(dir, port) {
  const root = path.resolve(dir);
  const server = http.createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (p.endsWith('/')) p += 'index.html';
    const file = path.join(root, p);
    if (!file.startsWith(root) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
      res.writeHead(404, { 'content-type': 'text/plain' }); return res.end('404');
    }
    const ext = path.extname(file);
    const headers = { 'content-type': TYPES[ext] || 'application/octet-stream', 'vary': 'Accept-Encoding' };
    const ae = String(req.headers['accept-encoding'] || '');
    let body = file;
    if (/\bbr\b/.test(ae) && fs.existsSync(file + '.br')) { body = file + '.br'; headers['content-encoding'] = 'br'; }
    else if (/\bgzip\b/.test(ae) && fs.existsSync(file + '.gz')) { body = file + '.gz'; headers['content-encoding'] = 'gzip'; }
    headers['content-length'] = fs.statSync(body).size;
    res.writeHead(200, headers);
    if (req.method === 'HEAD') return res.end();
    fs.createReadStream(body).pipe(res);
  });
  return new Promise(r => server.listen(port, '127.0.0.1', () => r(server)));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [dir = '.', port = '8090'] = process.argv.slice(2);
  serve(dir, Number(port)).then(() => console.log(`serving ${dir} on http://127.0.0.1:${port}`));
}
