/**
 * Seed fleet cars for an existing user. Prefer bootstrap-admin-and-fleet.mjs for new setups.
 *
 * Uses SUPABASE_SERVICE_ROLE_KEY from .env.local if set (required to bypass RLS from Node).
 * Otherwise pass service role as second argument (not the anon key).
 *
 * Usage:
 *   node scripts/seed-cars.mjs <SUPABASE_URL> <SERVICE_ROLE_KEY> <OWNER_USER_ID>
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

const env = loadEnvLocal();
let url = process.argv[2];
let key = process.argv[3];
let ownerId = process.argv[4];

if (!url || !key || !ownerId) {
  const u = env.NEXT_PUBLIC_SUPABASE_URL;
  const sr = env.SUPABASE_SERVICE_ROLE_KEY;
  if (u && sr && process.argv[2] && !process.argv[3]) {
    url = u;
    key = sr;
    ownerId = process.argv[2];
  }
}

if (!url || !key || !ownerId) {
  console.error(
    'Usage: node scripts/seed-cars.mjs <SUPABASE_URL> <SERVICE_ROLE_KEY> <OWNER_USER_ID>\n' +
      '   or: node scripts/seed-cars.mjs <OWNER_USER_ID>   (with .env.local: URL + SERVICE_ROLE_KEY)',
  );
  process.exit(1);
}

const img = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=80`;

// USD/day: March 35, Vitz 45, Aqua 50, Axio 55, Hiace 110 — images match body style (stock photos)
const cars = [
  { make: 'Nissan', model: 'March', year: 2022, car_type: 'hatchback', location_city: 'Harare', daily_rate_usd: 35, description: 'Nissan March — $35/day.', image_urls: [img('photo-1549317661-bd32c8ce0db2')] },
  { make: 'Toyota', model: 'Vitz', year: 2022, car_type: 'hatchback', location_city: 'Harare', daily_rate_usd: 45, description: 'Toyota Vitz — $45/day.', image_urls: [img('photo-1580273916550-e323be2ae537')] },
  { make: 'Toyota', model: 'Aqua', year: 2022, car_type: 'hatchback', location_city: 'Harare', daily_rate_usd: 50, description: 'Toyota Aqua — $50/day.', image_urls: [img('photo-1502877338535-766e1452684a')] },
  { make: 'Toyota', model: 'Axio', year: 2022, car_type: 'sedan', location_city: 'Harare', daily_rate_usd: 55, description: 'Toyota Axio — $55/day.', image_urls: [img('photo-1617814076367-b759c7d7e738')] },
  { make: 'Toyota', model: 'Hiace', year: 2021, car_type: 'van', location_city: 'Harare', daily_rate_usd: 110, description: 'Toyota Hiace — $110/day.', image_urls: [img('photo-1566576912321-d58ddd7a6088')] },
];

async function main() {
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  for (const car of cars) {
    const { data: row, error } = await supabase
      .from('cars')
      .insert({ owner_id: ownerId, ...car, is_active: true })
      .select('id')
      .single();
    if (error) {
      console.error('Error inserting car:', car.make, car.model, error.message);
      continue;
    }
    console.log('Inserted:', car.make, car.model);

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
    for (let i = 0; i < dates.length; i += chunkSize) {
      const chunk = dates.slice(i, i + chunkSize);
      const rows = chunk.map((available_date) => ({
        car_id: row.id,
        available_date,
        is_available: true,
      }));
      const { error: avErr } = await supabase.from('car_availability').insert(rows);
      if (avErr) {
        console.error('  availability:', avErr.message);
        break;
      }
    }
  }
  console.log('Done.');
}

main();
