/**
 * Create an admin user (or promote existing) and seed the Harare fleet with availability.
 *
 * Requires in .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY   (Dashboard → Settings → API → service_role — never expose in client code)
 *
 * Usage:
 *   node scripts/bootstrap-admin-and-fleet.mjs <email> <password>
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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
    env[k] = v;
  }
  return env;
}

const FLEET = [
  { make: 'Nissan', model: 'March', year: 2022, car_type: 'hatchback', location_city: 'Harare', daily_rate_usd: 35, description: 'Compact and economical.', is_active: true },
  { make: 'Toyota', model: 'Vitz', year: 2022, car_type: 'hatchback', location_city: 'Harare', daily_rate_usd: 45, description: 'City-friendly hatchback.', is_active: true },
  { make: 'Toyota', model: 'Aqua', year: 2022, car_type: 'hatchback', location_city: 'Harare', daily_rate_usd: 50, description: 'Hybrid hatchback.', is_active: true },
  { make: 'Toyota', model: 'Axio', year: 2022, car_type: 'sedan', location_city: 'Harare', daily_rate_usd: 55, description: 'Comfortable sedan.', is_active: true },
  { make: 'Toyota', model: 'Hiace', year: 2021, car_type: 'van', location_city: 'Harare', daily_rate_usd: 110, description: 'Spacious van for groups.', is_active: true },
];

async function main() {
  const env = loadEnvLocal();
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = env.SUPABASE_SERVICE_ROLE_KEY;
  const [, , email, password] = process.argv;

  if (!url || !serviceRole) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
    process.exit(1);
  }
  if (!email || !password) {
    console.error('Usage: node scripts/bootstrap-admin-and-fleet.mjs <email> <password>');
    process.exit(1);
  }

  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(url, serviceRole, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  let userId;
  const { data: created, error: createErr } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (createErr) {
    const exists =
      /already|registered|exists/i.test(createErr.message ?? '') || createErr.code === 'email_exists';
    if (!exists) {
      console.error('createUser:', createErr.message);
      process.exit(1);
    }
    const { data: list, error: listErr } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    if (listErr) {
      console.error('listUsers:', listErr.message);
      process.exit(1);
    }
    const existing = list.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (!existing) {
      console.error('User exists but could not be found in listUsers. Try a smaller project or create via Dashboard.');
      process.exit(1);
    }
    userId = existing.id;
    console.log('Using existing user:', email, userId);
  } else {
    userId = created.user.id;
    console.log('Created user:', email, userId);
  }

  const { error: roleErr } = await supabase.from('profiles').update({ role: 'admin' }).eq('id', userId);
  if (roleErr) {
    console.error('Set admin role:', roleErr.message);
    process.exit(1);
  }
  console.log('Profile role set to admin.');

  const { data: existingMarch } = await supabase
    .from('cars')
    .select('id')
    .eq('owner_id', userId)
    .eq('make', 'Nissan')
    .eq('model', 'March')
    .maybeSingle();

  if (existingMarch) {
    console.log('Fleet already seeded (Nissan March for this owner). Skipping inserts.');
    console.log('\nAdmin: http://localhost:3000/admin (production: your domain + /admin)');
    console.log('Log in with:', email);
    return;
  }

  const insertedIds = [];
  for (const car of FLEET) {
    const { data: row, error: insErr } = await supabase
      .from('cars')
      .insert({ ...car, owner_id: userId })
      .select('id')
      .single();
    if (insErr) {
      console.error('Insert car:', car.make, car.model, insErr.message);
      process.exit(1);
    }
    insertedIds.push(row.id);
    console.log('Inserted:', car.make, car.model, `(${formatDaily(car.daily_rate_usd)}/day)`);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const horizon = 365;
  const dates = [];
  for (let i = 0; i < horizon; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    dates.push(d.toISOString().slice(0, 10));
  }

  const chunkSize = 80;
  for (const carId of insertedIds) {
    for (let i = 0; i < dates.length; i += chunkSize) {
      const chunk = dates.slice(i, i + chunkSize);
      const rows = chunk.map((available_date) => ({
        car_id: carId,
        available_date,
        is_available: true,
      }));
      const { error: avErr } = await supabase.from('car_availability').insert(rows);
      if (avErr) {
        console.error('car_availability:', avErr.message);
        process.exit(1);
      }
    }
    console.log('Availability:', horizon, 'days for', carId);
  }

  console.log('\nDone.');
  console.log('Admin URL (local dev): http://localhost:3000/admin');
  console.log('Log in with:', email, '(password you provided)');
}

function formatDaily(n) {
  return `$${Number(n).toLocaleString('en-US')}`;
}

main();
