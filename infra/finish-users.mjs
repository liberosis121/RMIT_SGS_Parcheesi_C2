// Run AFTER the 3 users enrolled via invite links (H1).
// verify tideUserKey -> drain -> point IdP at console + sign -> grant tide-realm-admin (ba-lan first) -> report.
// After the first grant commits the realm is MultiAdmin: later grants need enclave approvals (H2).
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, TC, REALM, api, drain, sleep } from './lib.mjs';

const ORDER = ['ba-lan', 'thao', 'minh'];
const ids = {};
for (const u of ORDER) {
  const l = (await api('GET', `/admin/realms/${REALM}/users?username=${u}&exact=true`)).body;
  const key = l[0]?.attributes?.tideUserKey?.[0];
  console.log(`${u}: tideUserKey ${key ? 'present' : 'MISSING'}`);
  if (!key) process.exitCode = 1;
  ids[u] = l[0]?.id;
}
if (process.exitCode) { console.error('not all users enrolled yet'); process.exit(1); }

await drain('after enrollment');

console.log('==> CustomAdminUIDomain + sign-idp-settings');
{
  const inst = (await api('GET', `/admin/realms/${REALM}/identity-provider/instances/tide`)).body;
  inst.config.CustomAdminUIDomain = `${TC}/realms/${REALM}/tide-console/`;
  const p = await api('PUT', `/admin/realms/${REALM}/identity-provider/instances/tide`, inst);
  const s = await api('POST', `/admin/realms/${REALM}/vendorResources/sign-idp-settings`);
  console.log('   PUT', p.status, 'sign', s.status);
}

const rm = (await api('GET', `/admin/realms/${REALM}/clients?clientId=realm-management`)).body[0];
const role = (await api('GET', `/admin/realms/${REALM}/clients/${rm.id}/roles/tide-realm-admin`)).body;
if (role.error) { console.error('role missing', role); process.exit(1); }

const only = process.argv[2]; // optionally grant just one user, e.g. `node finish-users.mjs thao`
for (const u of ORDER) {
  if (only && only !== u) continue;
  console.log(`==> grant tide-realm-admin to ${u}`);
  const g = await api('POST', `/admin/realms/${REALM}/users/${ids[u]}/role-mappings/clients/${rm.id}`, [role]);
  console.log('   HTTP', g.status);
  await sleep(2000);
  const pend = (await api('GET', `/admin/realms/${REALM}/iga/change-requests?status=PENDING`)).body;
  console.log('   pending:', pend.map((c) => `${c.actionType}(${c.id.slice(0, 8)} ${c.authorizationCount ?? '?'}/${c.threshold ?? '?'} ready=${c.readyToCommit})`).join(', ') || 'none');
  // FirstAdmin mode only: try the server-side lane. In MultiAdmin this returns 409 -> needs enclave approval (H2).
  let stop = false;
  for (const c of pend) {
    const a = await api('POST', `/admin/realms/${REALM}/iga/change-requests/${c.id}/authorize`, {});
    console.log(`   authorize ${c.actionType}: HTTP ${a.status}`, a.status >= 400 ? JSON.stringify(a.body).slice(0, 160) : '');
    if (a.status === 409) stop = true;
  }
  await drain(`after grant ${u}`);
  if (stop) { console.log(`\nSTOP: ${u}'s grant needs an enclave approval by an existing admin (H2).`); break; }
}
