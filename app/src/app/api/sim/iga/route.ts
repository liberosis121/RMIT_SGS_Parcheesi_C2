import { HttpError, errResponse, hasRealmRole, isAdmin, requireToken } from "@/lib/sim/auth";
import { QUORUM, SIM_USERS, BIG_ROLE, loadState, saveState, type SimCr } from "@/lib/sim/state";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Simulated IGA / QEA change requests. Every call needs a valid Fabric-signed token.
export async function GET(req: Request) {
  try {
    const claims = await requireToken(req);
    if (!isAdmin(claims)) throw new HttpError(403, "FORBIDDEN", "Requires role tide-realm-admin");
    const status = new URL(req.url).searchParams.get("status");
    const crs = loadState().crs.filter((c) => !status || c.status === status).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return Response.json(crs);
  } catch (e) {
    return errResponse(e);
  }
}

export async function POST(req: Request) {
  try {
    const claims = await requireToken(req);
    const user = String(claims.preferred_username);
    const body = (await req.json()) as any;
    const state = loadState();

    if (body.action === "create") {
      if (!hasRealmRole(claims, "owner")) throw new HttpError(403, "FORBIDDEN", "Only the account owner can request the large-transfer role");
      const cr: SimCr = {
        id: crypto.randomUUID(),
        actionType: "GRANT_ROLE",
        role: BIG_ROLE,
        target: user,
        txId: String(body.txId),
        amount: Number(body.amount),
        toName: String(body.toName ?? ""),
        toAccount: String(body.toAccount ?? ""),
        requestedBy: user,
        createdAt: new Date().toISOString(),
        status: "PENDING",
        authorizers: [],
        threshold: QUORUM,
      };
      state.crs.push(cr);
      saveState(state);
      return Response.json(cr, { status: 202 });
    }

    if (!isAdmin(claims)) throw new HttpError(403, "FORBIDDEN", "Requires role tide-realm-admin");
    const cr = state.crs.find((c) => c.id === body.id);
    if (!cr) throw new HttpError(404, "NOT_FOUND", "Unknown change request");
    if (cr.status !== "PENDING") throw new HttpError(409, "NOT_PENDING", `Request is already ${cr.status}`);

    if (body.action === "approve") {
      // Four-eyes: the same person counts once.
      if (cr.authorizers.some((a) => a.username === user)) throw new HttpError(409, "ALREADY_APPROVED", "You already approved this request");
      cr.authorizers.push({ username: user, name: SIM_USERS[user].name, at: new Date().toISOString() });
      if (cr.authorizers.length >= cr.threshold) {
        cr.status = "COMMITTED";
        const roles = (state.grants[cr.target] ??= []);
        if (!roles.includes(cr.role)) roles.push(cr.role);
      }
      saveState(state);
      return Response.json({ mode: "recorded", committed: cr.status === "COMMITTED", authorizationCount: cr.authorizers.length, threshold: cr.threshold, cr });
    }
    if (body.action === "deny") {
      cr.status = "DENIED";
      cr.deniedBy = user;
      saveState(state);
      return Response.json({ ok: true, cr });
    }
    throw new HttpError(400, "BAD_REQUEST", "unknown action");
  } catch (e) {
    return errResponse(e);
  }
}
