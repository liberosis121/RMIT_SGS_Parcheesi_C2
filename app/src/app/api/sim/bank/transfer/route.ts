// Simulated MockBank. Same rules and codes as bank/src/server.ts. It trusts ONLY the Fabric-signed token
// (verified with the public key), never the app's database.
import { HttpError, bankRoles, errResponse, requireToken } from "@/lib/sim/auth";
import { BIG_ROLE, OWNER_ACCOUNT, SIM_USERS, THRESHOLD_VND, loadState, saveState } from "@/lib/sim/state";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const claims = await requireToken(req); // 401 INVALID_SIGNATURE / TOKEN_EXPIRED / MISSING_TOKEN
    const aud = ([] as string[]).concat((claims.aud as any) ?? []);
    if (!aud.includes("mock-bank")) throw new HttpError(401, "INVALID_TOKEN", "token is not meant for mock-bank");
    if (claims.sub !== SIM_USERS.mom.sub) throw new HttpError(403, "NOT_ACCOUNT_OWNER", "Only the account owner can start a transfer");

    const b = (await req.json().catch(() => ({}))) as any;
    const amount = Number(b.amount);
    if (typeof b.txId !== "string" || typeof b.to !== "string" || typeof b.nonce !== "string" || !Number.isInteger(amount) || amount <= 0) {
      return Response.json({ code: "BAD_REQUEST", error: "txId, to, amount, nonce required" }, { status: 400 });
    }
    if (b.from !== OWNER_ACCOUNT) return Response.json({ code: "BAD_REQUEST", error: "unknown source account" }, { status: 400 });

    const s = loadState();
    const L = s.ledger;
    if (L.used.includes(b.txId)) return Response.json({ code: "TX_ALREADY_USED", error: "txId was already executed" }, { status: 409 });
    if (amount > L.balance) return Response.json({ code: "INSUFFICIENT_FUNDS", error: "not enough balance" }, { status: 422 });

    const roles = bankRoles(claims);
    let viaRole: string | undefined;
    if (amount >= THRESHOLD_VND) {
      if (!roles.includes(BIG_ROLE)) {
        L.consumed = false; // owner token without the role: any earlier grant is gone
        saveState(s);
        return Response.json({ code: "NEEDS_FAMILY_APPROVAL", error: "Large transfer: needs family approval" }, { status: 403 });
      }
      if (L.consumed) {
        return Response.json({ code: "APPROVAL_ALREADY_USED", error: "The approval was already used for another transfer" }, { status: 403 });
      }
      viaRole = BIG_ROLE;
      L.consumed = true;
      s.grants.mom = (s.grants.mom ?? []).filter((r) => r !== BIG_ROLE); // one-use grant: revoked automatically in the sim realm
    } else if (!roles.includes(BIG_ROLE)) {
      L.consumed = false;
    }

    L.balance -= amount;
    L.used.push(b.txId);
    const entry = { txId: b.txId, from: b.from, to: b.to, amount, at: new Date().toISOString(), note: b.note, viaRole };
    L.executed.push(entry);
    saveState(s);
    return Response.json({ ok: true, balance: L.balance, entry });
  } catch (e) {
    return errResponse(e);
  }
}
