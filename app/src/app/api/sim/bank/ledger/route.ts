import { THRESHOLD_VND, OWNER_ACCOUNT, loadState } from "@/lib/sim/state";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const L = loadState().ledger;
  return Response.json({ account: OWNER_ACCOUNT, balance: L.balance, threshold: THRESHOLD_VND, transfers: [...L.executed].reverse() });
}
