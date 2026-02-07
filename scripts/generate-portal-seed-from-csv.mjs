#!/usr/bin/env node
/**
 * Reads src/siodelhi_data.csv and generates src/db/siodelhi_data_seed.sql
 * for portal_units and portal_users (members only).
 */

import { readFileSync, writeFileSync } from 'fs';
import { randomUUID } from 'crypto';

const CSV_PATH = 'src/siodelhi_data.csv';
const OUT_PATH = 'src/db/siodelhi_data_seed.sql';

const MONTH = { Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06', Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12' };

function parseDob(str) {
  if (!str || !str.trim()) return null;
  const s = str.trim();
  // DD-Mon-YY or DD-Mon-YYYY or malformed
  const m = s.match(/^(\d{1,2})[- ]([A-Za-z]{3})[- ](\d{2,4})$/);
  if (!m) return null;
  const [, day, mon, year] = m;
  const mm = MONTH[mon];
  if (!mm) return null;
  let yy = year.length === 2 ? parseInt(year, 10) : parseInt(year.slice(-2), 10);
  if (yy >= 0 && yy <= 30) yy += 2000;
  else if (yy > 30 && yy <= 99) yy += 1900;
  const yyyy = String(yy);
  return String(day).padStart(2, '0') + mm + yyyy;
}

function splitName(full) {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { first: 'Unknown', middle: null, last: 'Unknown' };
  if (parts.length === 1) return { first: parts[0], middle: null, last: parts[0] };
  return {
    first: parts[0],
    middle: parts.length > 2 ? parts.slice(1, -1).join(' ') : null,
    last: parts[parts.length - 1],
  };
}

function escapeSql(s) {
  if (s == null || s === '') return null;
  return "'" + String(s).replace(/'/g, "''") + "'";
}

const raw = readFileSync(CSV_PATH, 'utf8');
const lines = raw.split(/\r?\n/).map((l) => l.trim());
const header = lines[0];
if (!header || !header.includes('Name')) throw new Error('Expected CSV header with Name');
const rows = [];
for (let i = 1; i < lines.length; i++) {
  const line = lines[i];
  if (!line) continue;
  const parts = line.split(',').map((p) => p.trim());
  const [sl, name, unit, dobStr, mobile] = parts;
  if (!name && !mobile) continue;
  const phone = (mobile || '').replace(/\D/g, '');
  rows.push({ sl, name: name || 'Unknown', unit: (unit || '').trim() || null, dobStr, phone: phone || null });
}

const unitNames = [...new Set(rows.map((r) => r.unit).filter(Boolean))];
const unitIds = {};
unitNames.forEach((u) => { unitIds[u] = randomUUID(); });

const users = [];
const seenUsernames = new Set();
for (const r of rows) {
  const { first, middle, last } = splitName(r.name);
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

  const last4 = r.phone && r.phone.length >= 4 ? r.phone.slice(-4) : '0000';
  let password = (firstClean || 'user') + last4;
  if (password.length < 8) password = password + (r.phone ? r.phone.slice(-2) : '00');

  const unitId = r.unit ? unitIds[r.unit] : null;
  users.push({
    id: randomUUID(),
    first_name: first,
    middle_name: middle,
    last_name: last,
    username,
    phone: r.phone,
    password,
    date_of_birth: dob,
    role: 'member',
    unit_id: unitId,
  });
}

const sql = [];
sql.push('-- Generated from src/siodelhi_data.csv for portal_units and portal_users');
sql.push('-- Run after portal schema (portal_units and portal_users exist).');
sql.push('');

sql.push('-- Units (INSERT IGNORE to avoid duplicate names)');
for (const name of unitNames) {
  sql.push(`INSERT IGNORE INTO portal_units (id, name) VALUES (${escapeSql(unitIds[name])}, ${escapeSql(name)});`);
}
sql.push('');

sql.push('-- Members (INSERT IGNORE to avoid duplicate username/phone; ensure units are inserted first)');
for (const u of users) {
  const dobVal = u.date_of_birth ? escapeSql(u.date_of_birth) : 'NULL';
  const midVal = u.middle_name ? escapeSql(u.middle_name) : 'NULL';
  const uidVal = u.unit_id ? escapeSql(u.unit_id) : 'NULL';
  const phoneVal = u.phone != null && u.phone !== '' ? escapeSql(u.phone) : 'NULL';
  sql.push(
    `INSERT IGNORE INTO portal_users (id, first_name, middle_name, last_name, username, phone, password, date_of_birth, role, unit_id) VALUES (${escapeSql(u.id)}, ${escapeSql(u.first_name)}, ${midVal}, ${escapeSql(u.last_name)}, ${escapeSql(u.username)}, ${phoneVal}, ${escapeSql(u.password)}, ${dobVal}, 'member', ${uidVal});`
  );
}

writeFileSync(OUT_PATH, sql.join('\n'), 'utf8');
console.log(`Wrote ${OUT_PATH}: ${unitNames.length} units, ${users.length} users.`);
