import { errResponse, issueTokenFor, requireToken } from "@/lib/sim/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Re-issue the token with the user's CURRENT roles (e.g. after an approval granted the big-transfer role).
export async function POST(req: Request) {
  try {
    const claims = await requireToken(req);
    return Response.json({ token: await issueTokenFor(String(claims.preferred_username)) });
  } catch (e) {
    return errResponse(e);
  }
}
