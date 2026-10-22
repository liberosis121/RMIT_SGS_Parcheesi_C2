import { signWithRandomKey } from "@/lib/sim/fabric";
import { APP_CLIENT, BANK_CLIENT, BIG_ROLE, SIM_USERS } from "@/lib/sim/state";
import { SIM_ISSUER } from "@/lib/sim/fabric";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Attack demo: a token for Mom that CLAIMS the big-transfer role but is signed with a random key, not the Fabric key.
export async function GET() {
  const token = await signWithRandomKey({
    sub: SIM_USERS.mom.sub,
    preferred_username: "mom",
    name: SIM_USERS.mom.name,
    azp: APP_CLIENT,
    aud: [APP_CLIENT, BANK_CLIENT],
    realm_access: { roles: ["owner"] },
    resource_access: { [BANK_CLIENT]: { roles: [BIG_ROLE] } },
    iss: SIM_ISSUER,
  });
  return Response.json({ token });
}
