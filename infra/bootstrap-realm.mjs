// Create realm khien-nha from the pack template, license it, enable IGA, drain bootstrap CRs.
// Playbook: bootstrap-realm-from-template. Needs .env (licence email + T&C answered by the user).
// Usage: node infra/bootstrap-realm.mjs
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, TC, REALM, APP_CLIENT, BANK_CLIENT, BIG_ROLE, api, drain, sleep } from './lib.mjs';

const email = process.env.TIDE_LICENSE_EMAIL;
if (!email || process.env.TIDE_TERMS_ACCEPTED !== 'yes') {
  console.error('STOP: TIDE_LICENSE_EMAIL and TIDE_TERMS_ACCEPTED=yes must come from the user (.env). Nothing created.');
  process.exit(2);
}
if (REALM === 'myrealm') { console.error('Never name the realm myrealm'); process.exit(1); }

const tpl = fs.readFileSync(path.join(ROOT, '.tide-pack/templates/shared/realm.json.template'), 'utf8')
  .replaceAll('REALM_NAME', REALM).replaceAll('CLIENT_NAME', APP_CLIENT)
  .replaceAll('CLIENT_APP_URL', 'http://localhost:3000');
const realm = JSON.parse(tpl);

// --- Khien Nha additions -------------------------------------------------------------------
// Invite-only: registrationAllowed already false in the template.
realm.roles.client[BANK_CLIENT] = [
  { name: BIG_ROLE, description: 'Cho phep chuyen khoan lon (>= 10 trieu) - chi xuat hien sau khi du nguoi than duyet' },
];
realm.clients.push({
  clientId: BANK_CLIENT,
  name: 'MockBank (resource server)',
  enabled: true,
  publicClient: false,
  bearerOnly: true,            // never logs anyone in; only holds the transfer roles
  standardFlowEnabled: false,
  directAccessGrantsEnabled: false,
  fullScopeAllowed: false,
});
// App tokens carry mock-bank in `aud` (resource_access.mock-bank.roles comes from fullScopeAllowed + the default roles scope).
const app = realm.clients.find((c) => c.clientId === APP_CLIENT);
app.protocolMappers.push({
  name: `audience: ${BANK_CLIENT}`,
  protocol: 'openid-connect',
  protocolMapper: 'oidc-audience-mapper',
  config: { 'included.client.audience': BANK_CLIENT, 'access.token.claim': 'true', 'id.token.claim': 'false' },
});

// --- Create ----------------------------------------------------------------------------------
const exists = await api('GET', `/admin/realms/${REALM}`);
if (exists.status === 200) { console.error(`Realm ${REALM} already exists. Wipe with: bash infra/start-tidecloak.sh --wipe`); process.exit(1); }

console.log(`==> import realm ${REALM}`);
let r = await api('POST', '/admin/realms', realm);
if (r.status >= 300) { console.error('import failed', r.status, r.body); process.exit(1); }

// Disable Keycloak's "Update Account Information" page BEFORE IGA is on.
console.log('==> disable first-broker-login profile page');
{
  const ex = (await api('GET', `/admin/realms/${REALM}/authentication/flows/first%20broker%20login/executions`)).body;
  const rp = ex.find((e) => e.providerId === 'idp-review-profile');
  const body = { alias: 'review profile config', config: { 'update.profile.on.first.login': 'off' } };
  if (rp?.authenticationConfig) await api('PUT', `/admin/realms/${REALM}/authentication/config/${rp.authenticationConfig}`, body);
  else if (rp) await api('POST', `/admin/realms/${REALM}/authentication/executions/${rp.id}/config`, body);
  const ex2 = (await api('GET', `/admin/realms/${REALM}/authentication/flows/first%20broker%20login/executions`)).body;
  const cfgId = ex2.find((e) => e.providerId === 'idp-review-profile')?.authenticationConfig;
  const val = cfgId ? (await api('GET', `/admin/realms/${REALM}/authentication/config/${cfgId}`)).body.config?.['update.profile.on.first.login'] : undefined;
  if (val !== 'off') { console.error('could not disable profile page, got', val); process.exit(1); }
}

console.log('==> setUpTideRealm (licence)');
r = await api('POST', `/admin/realms/${REALM}/vendorResources/setUpTideRealm`, { email, isRagnarokEnabled: 'true' }, { form: true });
const out = typeof r.body === 'string' ? r.body : JSON.stringify(r.body);
console.log('   status', r.status, out.slice(0, 80).replace(email, '<email>'));
if (r.status >= 300 || out.includes('NEED_PAYMENT')) { console.error('licence failed'); process.exit(1); }

console.log('==> iga.attestor=tide');
{
  const rep = (await api('GET', `/admin/realms/${REALM}`)).body;
  rep.attributes = { ...(rep.attributes || {}), 'iga.attestor': 'tide' };
  await api('PUT', `/admin/realms/${REALM}`, rep);
}

console.log('==> enable IGA');
{
  const rep = (await api('GET', `/admin/realms/${REALM}`)).body;
  if (String(rep.attributes?.isIGAEnabled).toLowerCase() === 'true') console.log('   already on');
  else {
    const t = await api('POST', `/admin/realms/${REALM}/tide-admin/toggle-iga`, { isIGAEnabled: 'true' }, { form: true });
    const s = typeof t.body === 'string' ? t.body : JSON.stringify(t.body);
    if (!s.includes('"enabled":true')) { console.error('toggle-iga unexpected:', s); process.exit(1); }
    if (s.includes('warnings') || s.includes('commitFailures')) console.warn('   WARNING', s.slice(0, 400));
  }
}

await sleep(2000);
console.log('==> drain change requests (FirstAdmin mode)');
await drain('after IGA');
const left = await drain('final');
if (Array.isArray(left) && left.length) { console.error('pending CRs remain:', left.map((c) => c.actionType)); process.exit(1); }

// Verify roles exist and tide IdP is there
const idps = (await api('GET', `/admin/realms/${REALM}/identity-provider/instances`)).body;
console.log('   IdPs:', Array.isArray(idps) ? idps.map((i) => i.alias).join(',') : idps);
const bank = (await api('GET', `/admin/realms/${REALM}/clients?clientId=${BANK_CLIENT}`)).body[0];
const roles = (await api('GET', `/admin/realms/${REALM}/clients/${bank.id}/roles`)).body;
console.log(`   ${BANK_CLIENT} roles:`, roles.map((x) => x.name).join(','));
console.log('Realm ready.');
