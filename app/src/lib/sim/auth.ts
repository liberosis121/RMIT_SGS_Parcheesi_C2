// Simulated TideCloak: issues Fabric-signed tokens and verifies them server-side (public key only).
import { signSimToken, verifySimToken } from "./fabric";
import { APP_CLIENT, BANK_CLIENT, SIM_USERS, loadState } from "./state";
import type { JWTPayload } from "jose";

export const DEMO_PASSWORD = "demo";

export async function issueTokenFor(username: string): Promise<string> {
  const u = SIM_USERS[username];
  const state = loadState();
  return signSimToken({
    sub: u.sub,
    preferred_username: u.username,
    name: u.name,
    azp: APP_CLIENT,
    aud: [APP_CLIENT, BANK_CLIENT],
    realm_access: { roles: [u.role] },
    resource_access: {
      [BANK_CLIENT]: { roles: state.grants[username] ?? [] },
      "realm-management": { roles: ["tide-realm-admin"] },
    },
  });
}

export class HttpError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}

export async function requireToken(req: Request): Promise<JWTPayload> {
  const m = /^Bearer (.+)$/i.exec(req.headers.get("authorization") ?? "");
  if (!m) throw new HttpError(401, "MISSING_TOKEN", "Missing Authorization header");
  try {
    return await verifySimToken(m[1]);
  } catch (e: any) {
    throw new HttpError(401, e?.code === "ERR_JWT_EXPIRED" ? "TOKEN_EXPIRED" : "INVALID_SIGNATURE", e?.message ?? "invalid token");
  }
}

export const hasRealmRole = (p: JWTPayload, r: string) => ((p.realm_access as any)?.roles ?? []).includes(r);
export const bankRoles = (p: JWTPayload): string[] => ((p.resource_access as any)?.[BANK_CLIENT]?.roles as string[]) ?? [];
export const isAdmin = (p: JWTPayload) => (((p.resource_access as any)?.["realm-management"]?.roles as string[]) ?? []).includes("tide-realm-admin");

export function errResponse(e: unknown) {
  if (e instanceof HttpError) return Response.json({ code: e.code, error: e.message }, { status: e.status });
  console.error(e);
  return Response.json({ code: "SERVER_ERROR", error: "internal error" }, { status: 500 });
}
