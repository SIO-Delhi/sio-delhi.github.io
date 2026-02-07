#!/usr/bin/env node
/**
 * Pushes users from src/siodelhi_data.csv to Clerk (same usernames/passwords as portal seed).
 * Requires CLERK_SECRET_KEY (sk_live_... or sk_test_...) from env. Never commit the key.
 *
 * Usage: CLERK_SECRET_KEY=sk_live_xxx node scripts/push-users-to-clerk.mjs
 * Or: add CLERK_SECRET_KEY to .env and run with dotenv.
 */

import { readFileSync } from 'fs';

const CSV_PATH = 'src/siodelhi_data.csv';
const CLERK_API = 'https://api.clerk.com/v1/users';
const DELAY_MS = 150; // stay under rate limit (~100/10s)

const MONTH = { Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06', Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12' };

function parseDob(str) {
  if (!str || !str.trim()) return null;
  const s = str.trim();
  const m = s.match(/^(\d{1,2})[- ]([A-Za-z]{3})[- ](\d{2,4})$/);
  if (!m) return null;
  const [, day, mon, year] = m;
  const mm = MONTH[mon];
  if (!mm) return null;
  let yy = year.length === 2 ? parseInt(year, 10) : parseInt(year.slice(-2), 10);
  if (yy >= 0 && yy <= 30) yy += 2000;
  else if (yy > 30 && yy <= 99) yy += 1900;
  return String(day).padStart(2, '0') + mm + String(yy);
}

function splitName(full) {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { first: 'Unknown', last: 'Unknown' };
  if (parts.length === 1) return { first: parts[0], last: parts[0] };
  return { first: parts[0], last: parts[parts.length - 1] };
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

const secret = process.env.CLERK_SECRET_KEY;
if (!secret || !secret.startsWith('sk_')) {
  console.error('Set CLERK_SECRET_KEY (sk_live_... or sk_test_...) in the environment.');
  console.error('Example: CLERK_SECRET_KEY=sk_live_xxx node scripts/push-users-to-clerk.mjs');
  process.exit(1);
}

const raw = readFileSync(CSV_PATH, 'utf8');
const lines = raw.split(/\r?\n/).map((l) => l.trim());
const rows = [];
for (let i = 1; i < lines.length; i++) {
  const line = lines[i];
  if (!line) continue;
  const parts = line.split(',').map((p) => p.trim());
  const [sl, name, unit, dobStr, mobile] = parts;
  if (!name && !mobile) continue;
  const phone = (mobile || '').replace(/\D/g, '');
  if (!phone) continue;
  rows.push({ name: name || 'Unknown', dobStr, phone });
}

const users = [];
const seenUsernames = new Set();
for (const r of rows) {
  const { first, last } = splitName(r.name);
  const dob = parseDob(r.dobStr);
  const year = dob && dob.length >= 8 ? dob.slice(4, 8) : '1990';
  const firstClean = first.toLowerCase().replace(/[^a-z0-9]/g, '');
  const baseUsername = (firstClean || 'user') + year;
  let username = baseUsername;
  let n = 2;
  while (seenUsernames.has(username)) {
    username = baseUsername + '_' + n;
    n++;
  }
  seenUsernames.add(username);
  const last4 = r.phone.length >= 4 ? r.phone.slice(-4) : r.phone.padStart(4, '0');
  let password = (firstClean || 'user') + last4;
  if (password.length < 8) password = password + (r.phone.slice(-2) || '12');
  users.push({ username, password, first_name: first, last_name: last });
}

console.log(`Pushing ${users.length} users to Clerk...`);

let ok = 0;
let skip = 0;
let err = 0;

for (let i = 0; i < users.length; i++) {
  const u = users[i];
  try {
    const res = await fetch(CLERK_API, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secret}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: u.username,
        password: u.password,
        first_name: u.first_name,
        last_name: u.last_name,
        skip_password_checks: true, // migration: allow simple firstname+last4 passwords
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      ok++;
      if ((i + 1) % 50 === 0) console.log(`  ${i + 1}/${users.length}`);
    } else if (res.status === 422 && (data.errors?.[0]?.code === 'form_identifier_exists' || String(data).includes('exists'))) {
      skip++;
    } else {
      err++;
      console.error(`  [${u.username}] ${res.status}:`, data.errors?.[0]?.message || JSON.stringify(data));
    }
  } catch (e) {
    err++;
    console.error(`  [${u.username}]`, e.message);
  }
  await sleep(DELAY_MS);
}

console.log(`Done. Created: ${ok}, Skipped (already exist): ${skip}, Errors: ${err}`);
