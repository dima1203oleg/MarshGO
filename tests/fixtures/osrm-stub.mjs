// Test-only OSRM contract fixture. Never configure this endpoint outside isolated tests.
import http from 'node:http';
import process from 'node:process';
import { URL } from 'node:url';

const server = http.createServer((request, response) => {
  const routePath = new URL(request.url ?? '/', 'http://localhost').pathname.split('/').at(-1) ?? '';
  const [originText, destinationText] = routePath.split(';');
  const parsePoint = (value) => value?.split(',').map(Number);
  const origin = parsePoint(originText);
  const destination = parsePoint(destinationText);
  if (!origin || !destination || [...origin, ...destination].some((value) => !Number.isFinite(value))) {
    response.writeHead(400).end(JSON.stringify({ code: 'InvalidQuery' }));
    return;
  }
  response.writeHead(200, { 'content-type': 'application/json' });
  response.end(JSON.stringify({
    code: 'Ok',
    routes: [{ distance: 12_345, duration: 900, geometry: { coordinates: [origin, [(origin[0] + destination[0]) / 2, (origin[1] + destination[1]) / 2], destination] } }],
  }));
});
server.listen(Number(process.env.OSRM_STUB_PORT ?? 3004), '127.0.0.1');
