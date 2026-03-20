/**
 * Apply Harare-only cities + USD column renames (matches supabase/manual/apply_harare_and_usd_columns.sql).
 *
 * Option A — paste full URI from Dashboard → Connect:
 *   DATABASE_URL="postgresql://postgres.REF:PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres"
 *
 * Option B — build pooler URL from .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL  (for project ref)
 *   SUPABASE_DB_PASSWORD
 *   SUPABASE_POOLER_REGION=us-east-1   (default)
 *   SUPABASE_POOLER_MODE=transaction   (port 6543) or session (port 5432)
 *
 * "Tenant or user not found" almost always means the wrong *database* password — reset under
 * Project Settings → Database and update your URI.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

function loadEnvLocal() {
  const env = { ...process.env };
  const p = path.join(root, '.env.local');
  if (!fs.existsSync(p)) return env;
  for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq === -1) continue;
    const k = t.slice(0, eq).trim();
    let v = t.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    if (!process.env[k]) env[k] = v;
  }
  return env;
}

function refFromSupabaseUrl(url) {
  if (!url) return null;
  try {
    const host = new URL(url).hostname;
    const m = host.match(/^([a-z0-9]+)\.supabase\.co$/i);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

async function main() {
  const env = loadEnvLocal();
  let connectionString = env.DATABASE_URL;

  if (!connectionString) {
    const ref = refFromSupabaseUrl(env.NEXT_PUBLIC_SUPABASE_URL);
    const password = env.SUPABASE_DB_PASSWORD;
    if (!ref || !password) {
      console.error(`
Missing DATABASE_URL, or NEXT_PUBLIC_SUPABASE_URL + SUPABASE_DB_PASSWORD.

Copy the full URI from Dashboard → Connect → Transaction pooler (or Session pooler):

  DATABASE_URL="postgresql://postgres.${ref || 'YOUR_REF'}:PASSWORD@aws-0-us-east-1.pooler.supabase.com:6543/postgres"
`);
      process.exit(1);
    }
    const poolerHost =
      env.SUPABASE_POOLER_HOST ||
      `aws-0-${env.SUPABASE_POOLER_REGION || 'us-east-1'}.pooler.supabase.com`;
    const mode = (env.SUPABASE_POOLER_MODE || 'transaction').toLowerCase();
    const port =
      env.SUPABASE_POOLER_PORT || (mode === 'session' ? '5432' : '6543');
    connectionString = `postgresql://postgres.${ref}:${encodeURIComponent(password)}@${poolerHost}:${port}/postgres`;
  }

  const ssl =
    /supabase\.(co|com)/i.test(connectionString) || /pooler\.supabase\.com/i.test(connectionString)
      ? { rejectUnauthorized: false }
      : undefined;

  const client = new pg.Client({ connectionString, ssl });
  await client.connect();
  console.log('Connected. Applying updates…');

  await client.query('delete from public.cities where name <> $1', ['Harare']);
  await client.query(
    "insert into public.cities (name) values ('Harare') on conflict (name) do nothing",
  );
  console.log('Cities: Harare only.');

  await client.query(`
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'cars' and column_name = 'daily_rate_zwl'
  ) then
    alter table public.cars rename column daily_rate_zwl to daily_rate_usd;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'bookings' and column_name = 'total_amount_zwl'
  ) then
    alter table public.bookings rename column total_amount_zwl to total_amount_usd;
  end if;
end $$;
`);
  console.log('Columns: daily_rate_usd / total_amount_usd (if rename was needed).');

  await client.end();
  console.log('Done.');
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
