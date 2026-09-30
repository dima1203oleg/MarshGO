import { createServer, request as proxyRequest } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import process from 'node:process';
import { URL } from 'node:url';

const root = normalize(join(process.cwd(), 'dist'));
const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
};

const server = createServer(async (incoming, outgoing) => {
  const pathname = new URL(incoming.url ?? '/', 'http://localhost').pathname;
  if (pathname.startsWith('/api/') || ['/healthz', '/readyz'].includes(pathname)) {
    const upstream = proxyRequest({
      hostname: '127.0.0.1',
      port: Number(process.env.E2E_API_PORT ?? 3302),
      path: incoming.url,
      method: incoming.method,
      headers: { ...incoming.headers, host: `127.0.0.1:${process.env.E2E_API_PORT ?? 3302}` },
    }, (response) => {
      outgoing.writeHead(response.statusCode ?? 502, response.headers);
      response.pipe(outgoing);
    });
    upstream.on('error', () => {
      if (!outgoing.headersSent) outgoing.writeHead(502, { 'content-type': 'text/plain' });
      outgoing.end('E2E API unavailable');
    });
    incoming.pipe(upstream);
    return;
  }

  const requestedPath = decodeURIComponent(pathname === '/' ? '/index.html' : pathname);
  const filePath = normalize(join(root, requestedPath));
  if (!filePath.startsWith(`${root}/`) && filePath !== root) {
    outgoing.writeHead(400).end();
    return;
  }
  try {
    const body = await readFile(filePath);
    outgoing.writeHead(200, { 'content-type': contentTypes[extname(filePath)] ?? 'application/octet-stream' });
    outgoing.end(body);
  } catch {
    try {
      outgoing.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      outgoing.end(await readFile(join(root, 'index.html')));
    } catch {
      outgoing.writeHead(503, { 'content-type': 'text/plain' }).end('Build the web app before running E2E tests');
    }
  }
});

server.on('upgrade', (incoming, clientSocket, head) => {
  const pathname = new URL(incoming.url ?? '/', 'http://localhost').pathname;
  if (!pathname.startsWith('/api/')) { clientSocket.end('HTTP/1.1 404 Not Found\r\nConnection: close\r\n\r\n'); return; }
  const upstream = proxyRequest({
    hostname: '127.0.0.1',
    port: Number(process.env.E2E_API_PORT ?? 3302),
    path: incoming.url,
    headers: { ...incoming.headers, host: `127.0.0.1:${process.env.E2E_API_PORT ?? 3302}` },
  });
  upstream.on('upgrade', (response, upstreamSocket, upstreamHead) => {
    clientSocket.write(`HTTP/1.1 ${response.statusCode ?? 502} ${response.statusMessage ?? 'Switching Protocols'}\r\n`);
    for (const [name, rawValue] of Object.entries(response.headers)) {
      if (rawValue === undefined) continue;
      for (const value of Array.isArray(rawValue) ? rawValue : [rawValue]) clientSocket.write(`${name}: ${value}\r\n`);
    }
    clientSocket.write('\r\n');
    if (upstreamHead.length) clientSocket.write(upstreamHead);
    if (head.length) upstreamSocket.write(head);
    clientSocket.pipe(upstreamSocket);
    upstreamSocket.pipe(clientSocket);
  });
  upstream.on('response', (response) => {
    clientSocket.write(`HTTP/1.1 ${response.statusCode ?? 502} ${response.statusMessage ?? 'Bad Gateway'}\r\n`);
    for (const [name, rawValue] of Object.entries(response.headers)) {
      if (rawValue === undefined) continue;
      for (const value of Array.isArray(rawValue) ? rawValue : [rawValue]) clientSocket.write(`${name}: ${value}\r\n`);
    }
    clientSocket.write('\r\n');
    response.pipe(clientSocket);
  });
  upstream.on('error', () => clientSocket.destroy());
  upstream.end();
});

server.listen(3300, '127.0.0.1');
