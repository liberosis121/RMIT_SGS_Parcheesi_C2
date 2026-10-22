// SIMULATED TIDE FABRIC KEY.
//
// This stands in for Tide's threshold key (in real TideCloak no single machine ever holds the signing key;
// it is split across the ORK network). Here it is one ES256 keypair persisted to app/data/sim-fabric-key.json
// so that "sim-tidecloak" can issue tokens and MockBank can verify them with the PUBLIC half only.
//
// RULE: nothing outside this file reads the private key. Everything else calls signSimToken() (the "Fabric")
// or verifySimToken() (the "bank side": public key only).
import fs from "node:fs";
import path from "node:path";
import { exportJWK, generateKeyPair, importJWK, jwtVerify, SignJWT, createLocalJWKSet, type JWTPayload } from "jose";

const FILE = path.join(process.cwd(), "data", "sim-fabric-key.json");
export const SIM_ISSUER = "sim-tidecloak/kinkey";
const KID = "sim-fabric-1";

interface Stored {
  privateJwk: any;
  publicJwk: any;
}

let cached: { priv: CryptoKey; publicJwk: any } | null = null;

async function load() {
  if (cached) return cached;
  let stored: Stored;
  try {
    stored = JSON.parse(fs.readFileSync(FILE, "utf8"));
  } catch {
    const { privateKey, publicKey } = await generateKeyPair("ES256", { extractable: true });
    stored = {
      privateJwk: { ...(await exportJWK(privateKey)), kid: KID, alg: "ES256" },
      publicJwk: { ...(await exportJWK(publicKey)), kid: KID, alg: "ES256", use: "sig" },
    };
    fs.mkdirSync(path.dirname(FILE), { recursive: true });
    fs.writeFileSync(FILE, JSON.stringify(stored, null, 2));
  }
  cached = { priv: (await importJWK(stored.privateJwk, "ES256")) as CryptoKey, publicJwk: stored.publicJwk };
  return cached;
}

/** The "Fabric" signs a token. Only called by the simulated TideCloak token endpoint. */
export async function signSimToken(claims: Record<string, unknown>, ttl = "1h"): Promise<string> {
  const { priv } = await load();
  return new SignJWT(claims as JWTPayload)
    .setProtectedHeader({ alg: "ES256", kid: KID })
    .setIssuer(SIM_ISSUER)
    .setIssuedAt()
    .setExpirationTime(ttl)
    .sign(priv);
}

/** Verify with the PUBLIC key only (what a bank would do with the realm's published key). */
export async function verifySimToken(token: string): Promise<JWTPayload> {
  const { publicJwk } = await load();
  const jwks = createLocalJWKSet({ keys: [publicJwk] });
  const { payload } = await jwtVerify(token, jwks, { issuer: SIM_ISSUER });
  return payload;
}

/** An attacker's own key (NOT the Fabric key): used by the attack demo to forge a token. */
export async function signWithRandomKey(claims: Record<string, unknown>): Promise<string> {
  const { privateKey } = await generateKeyPair("ES256");
  return new SignJWT(claims as JWTPayload)
    .setProtectedHeader({ alg: "ES256", kid: KID })
    .setIssuer(SIM_ISSUER)
    .setIssuedAt()
    .setExpirationTime("10m")
    .sign(privateKey);
}
