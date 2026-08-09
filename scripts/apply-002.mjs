import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function loadEnv() {
  const file = join(root, '.env');
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/i);
    if (!m) continue;
    let v = m[2].trim().replace(/^["']|["']$/g, '');
    if (!(m[1] in process.env)) process.env[m[1]] = v;
  }
}
loadEnv();

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

const sql = readFileSync(join(root, 'migrations/002_fixes.sql'), 'utf8');
await client.query(sql);

await client.end();
console.log('Migration 002 applied successfully');
