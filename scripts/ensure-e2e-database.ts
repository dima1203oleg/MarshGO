import 'dotenv/config';
import { Client } from 'pg';

const targetUrl = new URL(process.env.E2E_DATABASE_URL ?? 'postgres://marshgo:local_only_change_me@127.0.0.1:5434/marshgo_e2e');
const databaseName = targetUrl.pathname.slice(1);
if (!['127.0.0.1', 'localhost', '::1'].includes(targetUrl.hostname) || !/^marshgo_e2e(?:_[a-z0-9_]+)?$/.test(databaseName)) {
  throw new Error('Refusing to create E2E database outside loopback or outside a marshgo_e2e-prefixed database');
}

const maintenanceUrl = new URL(targetUrl);
maintenanceUrl.pathname = '/postgres';
const client = new Client({ connectionString: maintenanceUrl.toString() });
await client.connect();
try {
  const exists = await client.query<{ exists: boolean }>('SELECT EXISTS (SELECT 1 FROM pg_database WHERE datname = $1) AS exists', [databaseName]);
  if (!exists.rows[0].exists) {
    await client.query(`CREATE DATABASE "${databaseName}"`);
    console.log(`Created isolated ${databaseName} database.`);
  } else {
    console.log(`Using existing isolated ${databaseName} database.`);
  }
} finally {
  await client.end();
}
