// Shared helpers for the infra scripts (Node 18+, no dependencies). Secrets come from .env, never from code.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function loadEnv() {
  const f = path.join(ROOT, '.env');
  if (fs.existsSync(f)) {
    for (const line of fs.readFileSync(f, 'utf8').split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  }
}
loadEnv();

export const TC = process.env.TIDECLOAK_URL || 'http://localhost:8080';
export const REALM = process.env.REALM || 'khien-nha';
export const APP_CLIENT = 'khien-nha-app';
export const BANK_CLIENT = 'mock-bank';
export const BIG_ROLE = 'chuyen-khoan-lon';

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function getToken() {
  const pw = process.env.KC_BOOTSTRAP_ADMIN_PASSWORD;
  if (!pw) throw new Error('KC_BOOTSTRAP_ADMIN_PASSWORD missing in .env');
  const r = await fetch(`${TC}/realms/master/protocol/openid-connect/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: 'admin-cli', grant_type: 'password',
      username: process.env.KC_BOOTSTRAP_ADMIN_USERNAME || 'admin', password: pw,
    }),
  });
  const j = await r.json();
  if (!j.access_token) throw new Error('admin token failed: ' + JSON.stringify(j).slice(0, 200));
  return j.access_token; // lives ~60 s: always call per operation
}

/** Admin REST call with a fresh master token. Returns {status, headers, body(json|text)}. */
export async function api(method, p, body, { form = false } = {}) {
  const token = await getToken();
  const headers = { Authorization: `Bearer ${token}` };
  let payload;
  if (body !== undefined) {
    if (form) { headers['Content-Type'] = 'application/x-www-form-urlencoded'; payload = new URLSearchParams(body); }
    else { headers['Content-Type'] = 'application/json'; payload = JSON.stringify(body); }
  }
  const r = await fetch(`${TC}${p}`, { method, headers, body: payload });
  const text = await r.text();
  let json; try { json = JSON.parse(text); } catch { json = text; }
  return { status: r.status, headers: r.headers, body: json };
}

const SKIP = new Set(['DISABLE_IGA', 'DELETE_REALM', 'OFFBOARD_REALM']);

/** FirstAdmin-mode drain: authorize every pending CR, commit the ready ones, repeat. */
export async function drain(label = '') {
  for (let pass = 1; pass <= 6; pass++) {
    const list = await api('GET', `/admin/realms/${REALM}/iga/change-requests?status=PENDING`);
    const crs = Array.isArray(list.body) ? list.body.filter((c) => !SKIP.has(c.actionType)) : [];
    if (!crs.length) break;
    for (const c of crs) {
      await api('POST', `/admin/realms/${REALM}/iga/change-requests/${c.id}/authorize`, {});
    }
    const list2 = await api('GET', `/admin/realms/${REALM}/iga/change-requests?status=PENDING`);
    const ready = Array.isArray(list2.body) ? list2.body.filter((c) => !SKIP.has(c.actionType) && c.readyToCommit) : [];
    for (const c of ready) {
      await api('POST', `/admin/realms/${REALM}/iga/change-requests/${c.id}/commit`);
    }
    if (!ready.length) break;
  }
  const left = await api('GET', `/admin/realms/${REALM}/iga/change-requests?status=PENDING`);
  const n = Array.isArray(left.body) ? left.body.length : -1;
  console.log(`   drain${label ? ' ' + label : ''}: pending left = ${n}`);
  return left.body;
}
