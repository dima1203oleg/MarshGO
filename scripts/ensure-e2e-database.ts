import 'dotenv/config';
import { Client } from 'pg';

const targetUrl = new URL(process.env.E2E_DATABASE_URL ?? 'postgres://marshgo:local_only_change_me@127.0.0.1:5434/marshgo_e2e');
if (!['127.0.0.1', 'localhost', '::1'].includes(targetUrl.hostname) || targetUrl.pathname !== '/marshgo_e2e') {
  throw new Error('Refusing to create E2E database outside loopback or outside the dedicated marshgo_e2e database');
}

const maintenanceUrl = new URL(targetUrl);
maintenanceUrl.pathname = '/postgres';
const client = new Client({ connectionString: maintenanceUrl.toString() });
await client.connect();
try {
  const exists = await client.query<{ exists: boolean }>('SELECT EXISTS (SELECT 1 FROM pg_database WHERE datname = $1) AS exists', ['marshgo_e2e']);
  if (!exists.rows[0].exists) {
    await client.query('CREATE DATABASE marshgo_e2e');
    console.log('Created isolated marshgo_e2e database.');
  } else {
    console.log('Using existing isolated marshgo_e2e database.');
  }
} finally {
  await client.end();
}
