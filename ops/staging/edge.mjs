import { createReadStream, existsSync, readFileSync, statSync } from 'node:fs';
import { createServer, request as httpRequest } from 'node:http';
import { createConnection } from 'node:net';
import { extname, resolve, sep } from 'node:path';
import { URL } from 'node:url';
import process from 'node:process';
import { createGzip, gzipSync } from 'node:zlib';

const siteRoot = resolve(process.env.STAGING_SITE_DIST || '.release/site/dist');
const apiPort = Number(process.env.STAGING_API_PORT || 3002);
const objectStoragePort = Number(process.env.STAGING_S3_PORT || 19090);
const port = Number(process.env.STAGING_EDGE_PORT || 4173);
const objectBucket = process.env.STAGING_S3_BUCKET || 'marshgo-staging-private';
const contentTypes = new Map([
  ['.css', 'text/css; charset=utf-8'], ['.html', 'text/html; charset=utf-8'], ['.ico', 'image/x-icon'],
  ['.js', 'text/javascript; charset=utf-8'], ['.json', 'application/json; charset=utf-8'], ['.png', 'image/png'],
  ['.svg', 'image/svg+xml'], ['.webp', 'image/webp'], ['.woff2', 'font/woff2'],
]);
const banner = '<div style="position:fixed;z-index:2147483647;top:0;left:0;right:0;background:#9a3412;color:#fff;text-align:center;padding:5px 8px;font:600 12px system-ui;letter-spacing:.02em">MARSHGO STAGING · TEST DATA ONLY · Development OTP is exposed for acceptance tests · No real payments</div>';

function secureHeaders(response) {
  response.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('Referrer-Policy', 'no-referrer');
  response.setHeader('Cache-Control', 'no-store');
}

function proxyApi(request, response) {
  const headers = { ...request.headers, host: `127.0.0.1:${apiPort}`, 'x-forwarded-proto': 'https' };
  const upstream = httpRequest({ hostname: '127.0.0.1', port: apiPort, path: request.url, method: request.method, headers }, (apiResponse) => {
    for (const [name, value] of Object.entries(apiResponse.headers)) {
      if (value !== undefined) response.setHeader(name, value);
    }
    response.writeHead(apiResponse.statusCode || 502);
    apiResponse.pipe(response);
  });
  upstream.on('error', () => { if (!response.headersSent) response.writeHead(502); response.end('Staging API unavailable'); });
  request.on('aborted', () => upstream.destroy());
  request.pipe(upstream);
}

function proxyObjectStorage(request, response) {
  const upstream = httpRequest({
    hostname: '127.0.0.1', port: objectStoragePort, path: request.url, method: request.method,
    headers: { ...request.headers, 'x-forwarded-proto': 'https' },
  }, (storageResponse) => {
    for (const [name, value] of Object.entries(storageResponse.headers)) {
      if (value !== undefined) response.setHeader(name, value);
    }
    response.writeHead(storageResponse.statusCode || 502);
    storageResponse.pipe(response);
  });
  upstream.on('error', () => { if (!response.headersSent) response.writeHead(502); response.end('Staging object storage unavailable'); });
  request.on('aborted', () => upstream.destroy());
  request.pipe(upstream);
}

const server = createServer((request, response) => {
  secureHeaders(response);
  const pathname = new URL(request.url || '/', 'http://staging.local').pathname;
  if (pathname.startsWith('/api/') || pathname === '/readyz' || pathname === '/healthz-api') return proxyApi(request, response);
  if (pathname === `/${objectBucket}` || pathname.startsWith(`/${objectBucket}/`)) return proxyObjectStorage(request, response);
  if (pathname === '/healthz') { response.writeHead(200, { 'Content-Type': 'text/plain' }); return response.end('staging-edge-ok\n'); }

  let relative;
  try { relative = decodeURIComponent(pathname).replace(/^\/+/, ''); } catch { response.writeHead(400); return response.end(); }
  if (!relative || relative.endsWith('/')) relative += 'index.html';
  let target = resolve(siteRoot, relative);
  if (!target.startsWith(`${siteRoot}${sep}`) && target !== siteRoot) { response.writeHead(403); return response.end(); }
  if (!existsSync(target) || !statSync(target).isFile()) target = resolve(siteRoot, 'index.html');
  if (!existsSync(target)) { response.writeHead(503); return response.end('Staging web build is missing'); }
  const type = contentTypes.get(extname(target)) || 'application/octet-stream';
  const compressible = /\.(?:css|html|js|json|svg)$/.test(target);
  const gzip = compressible && /\bgzip\b/.test(request.headers['accept-encoding'] || '');
  response.writeHead(200, { 'Content-Type': type, Vary: 'Accept-Encoding', ...(gzip ? { 'Content-Encoding': 'gzip' } : {}) });
  if (target.endsWith('/index.html')) {
    const html = readFileSync(target, 'utf8').replace(/<body\b[^>]*>/i, (tag) => `${tag}${banner}`);
    return response.end(gzip ? gzipSync(html) : html);
  }
  const stream = createReadStream(target);
  if (gzip) stream.pipe(createGzip()).pipe(response); else stream.pipe(response);
});

server.on('upgrade', (request, client) => {
  const upstream = createConnection(apiPort, '127.0.0.1', () => {
    const lines = [`${request.method} ${request.url} HTTP/${request.httpVersion}`];
    for (const [name, value] of Object.entries(request.headers)) {
      if (Array.isArray(value)) for (const item of value) lines.push(`${name}: ${item}`);
      else if (value !== undefined) lines.push(`${name}: ${value}`);
    }
    upstream.write(`${lines.join('\r\n')}\r\n\r\n`);
    client.pipe(upstream);
    upstream.pipe(client);
  });
  upstream.on('error', () => client.destroy());
  client.on('error', () => upstream.destroy());
});

server.listen(port, '0.0.0.0', () => process.stdout.write(`MARSHGO staging edge listening on 0.0.0.0:${port}\n`));
