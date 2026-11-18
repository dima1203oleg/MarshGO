import 'dotenv/config';
import { Client } from 'pg';

const targetUrl = new URL(process.env.E2E_DATABASE_URL ?? 'postgres://marshgo:local_only_change_me@127.0.0.1:5434/marshgo_e2e');
const databaseName = targetUrl.pathname.slice(1);
if (!['127.0.0.1', 'localhost', '::1'].includes(targetUrl.hostname) || !/^marshgo_e2e(?:_[a-z0-9_]+)?$/.test(databaseName)) {
  throw new Error('Refusing to reset auth data outside a loopback marshgo_e2e-prefixed database');
}

const client = new Client({ connectionString: targetUrl.toString() });
await client.connect();
try {
  const result = await client.query('DELETE FROM auth_failed_attempts');
  console.log(`Cleared ${result.rowCount ?? 0} failed auth attempt(s) from isolated ${databaseName}.`);
} finally {
  await client.end();
}