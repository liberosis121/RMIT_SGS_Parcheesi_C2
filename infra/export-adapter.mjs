// Export the Tide adapter (jwk, vendorId, homeOrkUrl) for khien-nha-app via vendorResources, copy to app/ and bank/.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, REALM, APP_CLIENT, api } from './lib.mjs';

const c = (await api('GET', `/admin/realms/${REALM}/clients?clientId=${APP_CLIENT}`)).body[0];
if (!c) { console.error('client not found'); process.exit(1); }
const r = await api('GET', `/admin/realms/${REALM}/vendorResources/get-installations-provider?clientId=${c.id}&providerId=keycloak-oidc-keycloak-json`);
const adapter = typeof r.body === 'string' ? JSON.parse(r.body) : r.body;
const ok = ['jwk', 'vendorId', 'homeOrkUrl'].every((k) => k in adapter);
console.log('adapter keys ok (jwk, vendorId, homeOrkUrl):', ok);
if (!ok) { console.error('missing Tide fields; keys =', Object.keys(adapter)); process.exit(1); }
for (const d of ['app/data', 'bank/data']) {
  fs.mkdirSync(path.join(ROOT, d), { recursive: true });
  fs.writeFileSync(path.join(ROOT, d, 'tidecloak.json'), JSON.stringify(adapter, null, 2));
  console.log('wrote', d + '/tidecloak.json (gitignored)');
}
