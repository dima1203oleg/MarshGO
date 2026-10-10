import http from 'node:http';
import { Buffer } from 'node:buffer';
import process from 'node:process';
import { URL } from 'node:url';
import { deflateSync } from 'node:zlib';

const port = Number(process.env.MAP_TILE_STUB_PORT ?? 3306);
let mode = 'success';
let requests = 0;
let loaded = 0;
let failed = 0;
function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function pngChunk(type, data) {
  const typeBuffer = Buffer.from(type);
  const length = Buffer.alloc(4); length.writeUInt32BE(data.length);
  const checksum = Buffer.alloc(4); checksum.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])));
  return Buffer.concat([length, typeBuffer, data, checksum]);
}
function createTilePng() {
  const width = 256; const height = 256;
  const pixels = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y += 1) {
    const row = y * (width * 4 + 1); pixels[row] = 0;
    for (let x = 0; x < width; x += 1) {
      const major = Math.min(Math.abs(x - 128), Math.abs(y - 128));
      const minor = Math.min(Math.abs(x - 64), Math.abs(x - 192), Math.abs(y - 64), Math.abs(y - 192));
      const color = major <= 2 ? [255, 255, 255] : major <= 4 ? [207, 218, 229] : minor <= 1 ? [255, 255, 255] : minor <= 2 ? [220, 228, 237] : [231, 237, 243];
      const pixel = row + 1 + x * 4;
      pixels[pixel] = color[0]; pixels[pixel + 1] = color[1]; pixels[pixel + 2] = color[2]; pixels[pixel + 3] = 255;
    }
  }
  const header = Buffer.alloc(13); header.writeUInt32BE(width, 0); header.writeUInt32BE(height, 4); header[8] = 8; header[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), pngChunk('IHDR', header), pngChunk('IDAT', deflateSync(pixels)), pngChunk('IEND', Buffer.alloc(0))]);
}
const tilePng = createTilePng();

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
  if (/^\/tiles\/\d+\/\d+\/\d+\.png$/.test(url.pathname)) {
    requests += 1;
    if (mode === 'mixed' && requests % 2 === 0) {
      failed += 1;
      response.writeHead(503, { 'Content-Type': 'text/plain' }).end('isolated E2E tile failure');
      return;
    }
    loaded += 1;
    response.writeHead(200, { 'Content-Type': 'image/png' }).end(tilePng);
    return;
  }
  response.writeHead(404).end('not found');
});

server.listen(port, '127.0.0.1');
