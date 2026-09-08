import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import process from 'node:process';

const [rootArg = 'apps/reference/dist', portArg = '4173'] = process.argv.slice(2);
const root = path.resolve(rootArg);
const port = Number(portArg);

if (!fs.existsSync(root) || !fs.statSync(root).isDirectory()) {
  console.error(`Static web root does not exist: ${root}`);
  process.exit(1);
}
if (!Number.isInteger(port) || port < 0 || port > 65535) {
  console.error(`Invalid port: ${portArg}`);
  process.exit(1);
}

const contentTypes = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.mjs', 'text/javascript; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.svg', 'image/svg+xml'],
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.webp', 'image/webp'],
  ['.ico', 'image/x-icon'],
  ['.woff', 'font/woff'],
  ['.woff2', 'font/woff2'],
]);

function safePath(urlPath) {
  let decoded;
  try {
    decoded = decodeURIComponent(urlPath.split('?')[0] ?? '/');
  } catch {
    return null;
  }
  const normalized = path.posix.normalize(decoded.startsWith('/') ? decoded : `/${decoded}`);
  if (normalized.includes('..')) return null;
  return normalized;
}

function resolveFile(urlPath) {
  const normalized = safePath(urlPath);
  if (!normalized) return null;
  const relative = normalized.replace(/^\/+/, '');
  const candidates = normalized === '/'
    ? ['index.html']
    : [relative, `${relative}.html`, path.join(relative, 'index.html')];
  for (const candidate of candidates) {
    const resolved = path.resolve(root, candidate);
    if (!resolved.startsWith(`${root}${path.sep}`) && resolved !== root) continue;
    if (fs.existsSync(resolved) && fs.statSync(resolved).isFile()) return resolved;
  }
  return null;
}

const server = http.createServer((request, response) => {
  const requestPath = request.url ?? '/';
  const file = resolveFile(requestPath);
  if (!file) {
    const notFound = resolveFile('/+not-found');
    const pathname = safePath(requestPath);
    const acceptsHtml = request.headers.accept?.includes('text/html') || (pathname !== null && path.extname(pathname) === '');
    if (notFound && acceptsHtml) {
      response.writeHead(404, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
      fs.createReadStream(notFound).pipe(response);
      return;
    }
    response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    response.end('Not found');
    return;
  }
  const type = contentTypes.get(path.extname(file).toLowerCase()) ?? 'application/octet-stream';
  response.writeHead(200, {
    'content-type': type,
    'cache-control': 'no-store',
  });
  fs.createReadStream(file).pipe(response);
});

server.on('error', (error) => {
  console.error(`Static web server failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
  process.exit(1);
});

server.listen(port, '127.0.0.1', () => {
  const address = server.address();
  const boundPort = typeof address === 'object' && address !== null ? address.port : port;
  console.log(`Expo Base static web server: http://127.0.0.1:${boundPort}`);
});

let stopping = false;
const shutdown = () => {
  if (stopping) return;
  stopping = true;
  server.close(() => process.exit(0));
};
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, shutdown);
