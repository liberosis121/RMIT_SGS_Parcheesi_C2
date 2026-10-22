// MockBank: a SEPARATE service that trusts only the Tide-signed token, never the Khien Nha app.
//  - JWT signature checked locally with createLocalJWKSet(adapter.jwk): no network JWKS fetch.
//  - DPoP proof checked (sender-constrained token).
//  - Large transfers need a role that only appears in the token after the family approved it in TideCloak.
//  - No token is stored. The ledger is in memory and seeded from app/seed/seed.json.
import express from "express";
import cors from "cors";
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { createLocalJWKSet, jwtVerify, errors, type JWTPayload } from "jose";
import { verifyDpop } from "./verifyDpop.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const readJson = (p: string) => JSON.parse(fs.readFileSync(p, "utf8"));

const tc = readJson(path.join(here, "../data/tidecloak.json"));
const personas: Record<string, { username: string; role: string }> = (() => {
  try {
    return readJson(path.join(here, "../data/personas.json"));
  } catch {
    return {};
  }
})();
const seed = readJson(path.join(here, "../../app/seed/seed.json"));

const PORT = Number(process.env.PORT || 4000);
const APP_ORIGIN = process.env.APP_ORIGIN || "http://localhost:3000";
// "shared": role chuyen-khoan-lon (one use per grant, see consumedGrant). "per-tx": role tx-<hash12> bound to the transfer.
const BIND_MODE = (process.env.BIND_MODE || "shared") as "shared" | "per-tx";
const BANK_CLIENT = "mock-bank";
const BIG_ROLE = "chuyen-khoan-lon";
const THRESHOLD: number = seed.threshold_vnd;
const OWNER_ACCOUNT: string = seed.owner.account;
const OWNER_SUB = Object.entries(personas).find(([, p]) => p.role === "parent")?.[0];

const JWKS = createLocalJWKSet(tc.jwk);
const ISSUER = `${String(tc["auth-server-url"]).replace(/\/+$/, "")}/realms/${tc.realm}`;

// ---- ledger --------------------------------------------------------------------------------------
interface Entry {
  txId: string;
  from: string;
  to: string;
  amount: number;
  at: string;
  note?: string;
  viaRole?: string; // which Tide-signed role allowed it (large transfers only)
}
let balance = seed.owner.balance as number;
let executed: Entry[] = [];
const usedTx = new Set<string>();
// Shared-role mode: after one large transfer, the grant counts as used until a later owner token no longer carries the role
// (i.e. the revoke change request was approved).
let consumedGrant = false;

function reset() {
  balance = seed.owner.balance;
  executed = (seed.history as any[]).map((h) => ({
    txId: h.id,
    from: OWNER_ACCOUNT,
    to: seed.recipients.find((r: any) => r.id === h.to)?.account ?? h.to,
    amount: h.amount,
    at: h.at,
    note: h.note,
  }));
  usedTx.clear();
  consumedGrant = false;
}
reset();

// ---- auth ----------------------------------------------------------------------------------------
class AuthError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}

async function authenticate(req: express.Request): Promise<JWTPayload> {
  const h = req.headers.authorization ?? "";
  const m = /^(Bearer|DPoP) (.+)$/i.exec(h);
  if (!m) throw new AuthError(401, "MISSING_TOKEN", "Missing Authorization header");
  const token = m[2];
  let payload: JWTPayload;
  try {
    ({ payload } = await jwtVerify(token, JWKS, { issuer: ISSUER }));
  } catch (e) {
    const code = e instanceof errors.JWTExpired ? "TOKEN_EXPIRED" : "INVALID_SIGNATURE";
    throw new AuthError(401, code, e instanceof Error ? e.message : "invalid token");
  }
  if (payload.azp !== tc.resource) throw new AuthError(401, "INVALID_TOKEN", "azp does not match the app client");
  const aud = ([] as string[]).concat((payload.aud as any) ?? []);
  if (!aud.includes(BANK_CLIENT)) throw new AuthError(401, "INVALID_TOKEN", "token is not meant for mock-bank");
  try {
    const reqLike = {
      url: `${req.protocol}://${req.get("host")}${req.originalUrl}`,
      method: req.method,
      headers: { get: (n: string) => (req.headers[n.toLowerCase()] as string | undefined) ?? null },
    };
    await verifyDpop(reqLike, token, payload as any, { trustForwardedHeaders: false });
  } catch (e) {
    throw new AuthError(401, "INVALID_DPOP", e instanceof Error ? e.message : "dpop failed");
  }
  return payload;
}

const bankRoles = (p: JWTPayload): string[] => ((p.resource_access as any)?.[BANK_CLIENT]?.roles as string[]) ?? [];

const hash12 = (b: { txId: string; from: string; to: string; amount: number; nonce: string }) =>
  createHash("sha256").update(`${b.txId}|${b.from}|${b.to}|${b.amount}|${b.nonce}`).digest("hex").slice(0, 12);

// ---- http ----------------------------------------------------------------------------------------
const app = express();
app.use(cors({ origin: APP_ORIGIN, allowedHeaders: ["Authorization", "DPoP", "Content-Type"], methods: ["GET", "POST", "OPTIONS"] }));
app.use(express.json());

app.get("/ledger", (_req, res) => {
  res.json({ account: OWNER_ACCOUNT, balance, threshold: THRESHOLD, bindMode: BIND_MODE, transfers: [...executed].reverse() });
});

app.post("/transfer", async (req, res) => {
  try {
    const claims = await authenticate(req);
    if (!OWNER_SUB || claims.sub !== OWNER_SUB) throw new AuthError(403, "NOT_ACCOUNT_OWNER", "Only the account owner can start a transfer");

    const b = req.body ?? {};
    const amount = Number(b.amount);
    if (typeof b.txId !== "string" || typeof b.to !== "string" || typeof b.nonce !== "string" || !Number.isInteger(amount) || amount <= 0) {
      return res.status(400).json({ code: "BAD_REQUEST", error: "txId, to, amount, nonce required" });
    }
    if (b.from !== OWNER_ACCOUNT) return res.status(400).json({ code: "BAD_REQUEST", error: "unknown source account" });
    if (usedTx.has(b.txId)) return res.status(409).json({ code: "TX_ALREADY_USED", error: "txId was already executed" });
    if (amount > balance) return res.status(422).json({ code: "INSUFFICIENT_FUNDS", error: "not enough balance" });

    const roles = bankRoles(claims);
    let viaRole: string | undefined;
    if (amount >= THRESHOLD) {
      if (BIND_MODE === "per-tx") {
        const need = `tx-${hash12({ txId: b.txId, from: b.from, to: b.to, amount, nonce: b.nonce })}`;
        if (!roles.includes(need)) {
          return res.status(403).json({ code: "NEEDS_FAMILY_APPROVAL", error: "Large transfer: needs family approval for exactly this transaction", needRole: need });
        }
        viaRole = need;
      } else {
        if (!roles.includes(BIG_ROLE)) {
          consumedGrant = false; // owner token without the role: the previous grant (if any) has been revoked
          return res.status(403).json({ code: "NEEDS_FAMILY_APPROVAL", error: "Large transfer: needs family approval" });
        }
        if (consumedGrant) {
          return res.status(403).json({ code: "APPROVAL_ALREADY_USED", error: "The approval was already used for another transfer; ask for a new one" });
        }
        viaRole = BIG_ROLE;
        consumedGrant = true;
      }
    } else if (BIND_MODE === "shared" && !roles.includes(BIG_ROLE)) {
      consumedGrant = false;
    }

    balance -= amount;
    usedTx.add(b.txId);
    const entry: Entry = { txId: b.txId, from: b.from, to: b.to, amount, at: new Date().toISOString(), note: b.note, viaRole };
    executed.push(entry);
    console.log(`[bank] executed ${amount} -> ${b.to}${viaRole ? ` via ${viaRole}` : ""}`);
    return res.json({ ok: true, balance, entry });
  } catch (e) {
    if (e instanceof AuthError) {
      console.log(`[bank] rejected ${e.status} ${e.code}: ${e.message}`);
      return res.status(e.status).json({ code: e.code, error: e.message });
    }
    console.error(e);
    return res.status(500).json({ code: "SERVER_ERROR", error: "internal error" });
  }
});

if (process.env.ALLOW_RESET === "1") {
  app.post("/reset", (_req, res) => {
    reset();
    res.json({ ok: true, balance });
  });
}

app.listen(PORT, () => {
  console.log(`MockBank on :${PORT} | issuer ${ISSUER} | bind mode ${BIND_MODE} | owner sub ${OWNER_SUB ?? "(unset: run infra/export-adapter.mjs)"}`);
});
