import { resetState } from "@/lib/sim/state";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Demo helper: reset the simulated world (ledger, change requests, grants). Simulation only.
export async function POST() {
  const s = resetState();
  return Response.json({ ok: true, balance: s.ledger.balance });
}
