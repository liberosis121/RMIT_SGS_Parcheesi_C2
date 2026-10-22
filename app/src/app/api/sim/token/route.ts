import { DEMO_PASSWORD, issueTokenFor } from "@/lib/sim/auth";
import { SIM_USERS } from "@/lib/sim/state";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Simulated TideCloak sign-in: username + demo password -> Fabric-signed JWT.
export async function POST(req: Request) {
  const { username, password } = (await req.json().catch(() => ({}))) as { username?: string; password?: string };
  const key = String(username ?? "").trim().toLowerCase();
  if (!SIM_USERS[key] || password !== DEMO_PASSWORD) {
    return Response.json({ code: "INVALID_CREDENTIALS", error: "Wrong username or password." }, { status: 401 });
  }
  return Response.json({ token: await issueTokenFor(key) });
}
