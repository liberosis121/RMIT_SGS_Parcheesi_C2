import { withAuth } from "@/lib/auth/protect";
import { addTx, listTx, patchTx } from "@/lib/txStore";
import type { Tx } from "@/lib/types";

// Description store only. No tokens are kept here, and nothing here grants or executes anything.
export const GET = withAuth(async () => Response.json(listTx()));

export const POST = withAuth(async (req) => {
  const tx = (await req.json()) as Tx;
  if (!tx?.txId || typeof tx.amount !== "number") return Response.json({ error: "bad tx" }, { status: 400 });
  return Response.json(addTx(tx), { status: 201 });
});

export const PATCH = withAuth(async (req) => {
  const { txId, patch } = (await req.json()) as { txId: string; patch: Partial<Tx> };
  const out = patchTx(txId, patch);
  return out ? Response.json(out) : Response.json({ error: "not found" }, { status: 404 });
});
