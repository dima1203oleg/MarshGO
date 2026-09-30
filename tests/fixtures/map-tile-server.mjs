import http from 'node:http';
import process from 'node:process';
import { URL } from 'node:url';

const port = Number(process.env.MAP_TILE_STUB_PORT ?? 3306);
let mode = 'success';
let requests = 0;
let loaded = 0;
let failed = 0;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="256" height="256" fill="#e7edf3"/><path d="M0 128H256M128 0V256" stroke="#d5dde6" stroke-width="2"/></svg>`;

const server = http.createServer((request, response) => {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Cache-Control', 'no-store');
  const url = new URL(request.url ?? '/', `http://127.0.0.1:${port}`);
  if (url.pathname === '/health') {
    response.writeHead(200, { 'Content-Type': 'text/plain' }).end('ok');
    return;
  }
  if (url.pathname === '/__test/mode') {
    const nextMode = url.searchParams.get('value');
    if (nextMode !== 'success' && nextMode !== 'mixed') {
      response.writeHead(400).end('mode must be success or mixed');
      return;
    }
    mode = nextMode;
    requests = 0;
    loaded = 0;
    failed = 0;
    response.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify({ mode }));
    return;
  }
  if (url.pathname === '/__test/stats') {
    response.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify({ mode, requests, loaded, failed }));
    return;
  }
  if (/^\/tiles\/\d+\/\d+\/\d+\.svg$/.test(url.pathname)) {
    requests += 1;
    if (mode === 'mixed' && requests % 2 === 0) {
      failed += 1;
      response.writeHead(503, { 'Content-Type': 'text/plain' }).end('isolated E2E tile failure');
      return;
    }
    loaded += 1;
    response.writeHead(200, { 'Content-Type': 'image/svg+xml' }).end(svg);
    return;
  }
  response.writeHead(404).end('not found');
});

server.listen(port, '127.0.0.1');
