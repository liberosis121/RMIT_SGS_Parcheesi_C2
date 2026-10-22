// Demo scene 4 (command line): someone with root on the app server forges an approval.
// 1) edits the app's JSON "database" so the transaction looks approved
// 2) sends a token signed with their OWN key to MockBank
// MockBank only trusts keys from the TideCloak adapter, so it answers 401 INVALID_SIGNATURE.
// Usage: node scripts/attack-forge.mjs   (MockBank must be running on :4000)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateKeyPair, SignJWT, exportJWK } from '../bank/node_modules/jose/dist/webapi/index.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BANK = process.env.BANK_URL || 'http://localhost:4000';
const personas = JSON.parse(fs.readFileSync(path.join(root, 'bank/data/personas.json'), 'utf8'));
const tc = JSON.parse(fs.readFileSync(path.join(root, 'bank/data/tidecloak.json'), 'utf8'));
const ownerSub = Object.entries(personas).find(([, p]) => p.role === 'parent')[0];

// 1. "Edit the database": mark every pending transaction approved in the app store.
const store = path.join(root, 'app/data/tx-store.json');
if (fs.existsSync(store)) {
  const all = JSON.parse(fs.readFileSync(store, 'utf8'));
  for (const t of all) if (t.status === 'PENDING') t.status = 'APPROVED';
  fs.writeFileSync(store, JSON.stringify(all, null, 2));
  console.log('[dev] app DB edited: pending transactions now say APPROVED');
} else console.log('[dev] (no app DB yet; skipping the DB edit)');

// 2. Forge a token with a self-made key that claims the big-transfer role.
const { privateKey, publicKey } = await generateKeyPair('EdDSA');
const jwk = await exportJWK(publicKey);
const kid = tc.jwk?.keys?.[0]?.kid;
const forged = await new SignJWT({
  azp: tc.resource,
  aud: ['mock-bank'],
  resource_access: { 'mock-bank': { roles: ['chuyen-khoan-lon'] } },
})
  .setProtectedHeader({ alg: 'EdDSA', kid })
  .setIssuer(`${tc['auth-server-url'].replace(/\/+$/, '')}/realms/${tc.realm}`)
  .setSubject(ownerSub)
  .setIssuedAt()
  .setExpirationTime('10m')
  .sign(privateKey);

const body = { txId: 'forged-' + Date.now(), from: '0071000123456', to: '9704999888777', amount: 200000000, nonce: 'x' };
const r = await fetch(`${BANK}/transfer`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${forged}` },
  body: JSON.stringify(body),
});
console.log(`[dev] forged token, 200.000.000 d to "Dai uy Hung" -> MockBank answered HTTP ${r.status}`, await r.text());
console.log(r.status === 401 ? 'OK: forged approval rejected.' : 'UNEXPECTED: check MockBank!');
void jwk;
