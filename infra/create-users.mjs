// Create ba-lan, thao, minh (no email, invite-only) and print one Tide invite link each.
// Links are printed to the terminal ONLY and saved under data/ (gitignored). Never commit them.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, REALM, api, drain, sleep } from './lib.mjs';

const USERS = ['ba-lan', 'thao', 'minh'];

// Tide users have no email (AP-85: never invent one), but the realm's user profile marks email as required.
{
  const prof = (await api('GET', `/admin/realms/${REALM}/users/profile`)).body;
  const em = prof.attributes.find((a) => a.name === 'email');
  if (em?.required) {
    delete em.required;
    const r = await api('PUT', `/admin/realms/${REALM}/users/profile`, prof);
    console.log('user profile: email no longer required, HTTP', r.status);
  }
}
const out = {};
for (const username of USERS) {
  let list = (await api('GET', `/admin/realms/${REALM}/users?username=${username}&exact=true`)).body;
  if (!Array.isArray(list) || !list.length) {
    const r = await api('POST', `/admin/realms/${REALM}/users`, {
      username, enabled: true, emailVerified: false, attributes: { tideInvitable: ['true'] },
    });
    console.log(`create ${username}: HTTP ${r.status}`);
    await sleep(1000);
    await drain(`after create ${username}`);
    list = (await api('GET', `/admin/realms/${REALM}/users?username=${username}&exact=true`)).body;
  }
  const u = list[0];
  if (!u) { console.error(`user ${username} not found after creation`); process.exit(1); }
  const linked = u.attributes?.tideUserKey?.[0];
  let link = null;
  if (!linked) {
    const r = await api('POST', `/admin/realms/${REALM}/tideAdminResources/get-required-action-link?userId=${u.id}&lifespan=43200`, ['link-tide-account-action']);
    link = typeof r.body === 'string' ? r.body : JSON.stringify(r.body);
  }
  out[username] = { id: u.id, linked: !!linked, link };
}
fs.mkdirSync(path.join(ROOT, 'data'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'data/users.json'), JSON.stringify(out, null, 2));
console.log('\nUser ids saved in data/users.json (gitignored)');
for (const [k, v] of Object.entries(out)) console.log(`\n${k} (${v.linked ? 'already linked' : 'needs enrollment'}):\n${v.link ?? '-'}`);
