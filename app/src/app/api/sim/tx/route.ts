import { errResponse, requireToken } from "@/lib/sim/auth";
import { loadState, saveState } from "@/lib/sim/state";
import type { Tx } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Description store for the simulated wallet. UNTRUSTED by design, like /api/tx: the bank decides.
export async function GET(req: Request) {
  try {
    await requireToken(req);
    return Response.json([...loadState().txs].sort((a, b) => b.requestedAt.localeCompare(a.requestedAt)));
  } catch (e) {
    return errResponse(e);
  }
}

export async function POST(req: Request) {
  try {
    await requireToken(req);
    const tx = (await req.json()) as Tx;
    const s = loadState();
    s.txs.push(tx);
    saveState(s);
    return Response.json(tx, { status: 201 });
  } catch (e) {
    return errResponse(e);
  }
}

export async function PATCH(req: Request) {
  try {
    await requireToken(req);
    const { txId, patch } = (await req.json()) as { txId: string; patch: Partial<Tx> };
    const s = loadState();
    const i = s.txs.findIndex((t) => t.txId === txId);
    if (i < 0) return Response.json({ error: "not found" }, { status: 404 });
    s.txs[i] = { ...s.txs[i], ...patch };
    saveState(s);
    return Response.json(s.txs[i]);
  } catch (e) {
    return errResponse(e);
  }
}
