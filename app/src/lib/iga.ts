// Browser -> TideCloak calls. Every request carries the CALLER'S OWN DPoP-bound token (secureFetch).
// Nothing here goes through the Next.js server: approvals are credited to whoever authenticated the request.
import { ADMIN_API, BANK_CLIENT, BIG_ROLE } from "./config";

export interface Ctx {
  secureFetch: (url: string, init?: RequestInit) => Promise<Response>;
  approveTideRequests: (
    r: { id: string; request: Uint8Array }[]
  ) => Promise<{ id: string; approved?: { request: Uint8Array }; denied?: boolean; pending?: boolean }[]>;
}

export interface ChangeRequest {
  id: string;
  actionType: string;
  entityType?: string;
  status: string;
  requestedBy?: string;
  createdAt?: string | number;
  authorizationCount?: number;
  authorizers?: { username: string; timestamp?: number | string }[];
  threshold?: number;
  readyToCommit?: boolean;
  rows?: unknown;
  entityId?: string;
  blocked?: boolean;
  dependsOn?: string;
}

const J = { "Content-Type": "application/json" };

const b64ToBytes = (b64: string) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
const bytesToB64 = (u: Uint8Array) => {
  let s = "";
  u.forEach((b) => (s += String.fromCharCode(b)));
  return btoa(s);
};

async function jget<T>(ctx: Ctx, path: string): Promise<T> {
  const r = await ctx.secureFetch(`${ADMIN_API}${path}`);
  if (!r.ok) throw new Error(`TideCloak ${path} -> ${r.status} ${(await r.text()).slice(0, 200)}`);
  return (await r.json()) as T;
}

export async function listCrs(ctx: Ctx, status = "PENDING"): Promise<ChangeRequest[]> {
  const j = await jget<ChangeRequest[]>(ctx, `/iga/change-requests?status=${status}`);
  return Array.isArray(j) ? j : [];
}

/** Number of approvals so far. Never default to 0 when the field is absent (see canon: iga-change-requests-api). */
export function approvalCount(cr: ChangeRequest): number | null {
  if (typeof cr.authorizationCount === "number") return cr.authorizationCount;
  if (Array.isArray(cr.authorizers)) return cr.authorizers.length;
  return cr.readyToCommit ? (cr.threshold ?? null) : null;
}

let bankClientUuid: string | null = null;
async function bankClient(ctx: Ctx) {
  if (!bankClientUuid) {
    const l = await jget<{ id: string }[]>(ctx, `/clients?clientId=${BANK_CLIENT}`);
    if (!l[0]) throw new Error("client mock-bank not found");
    bankClientUuid = l[0].id;
  }
  return bankClientUuid;
}

/** Bà Lan's browser files "grant me the big-transfer role" as a change request. Returns the new CR ids. */
export async function fileGrantRequest(ctx: Ctx, userId: string, roleName = BIG_ROLE): Promise<string[]> {
  const before = new Set((await listCrs(ctx)).map((c) => c.id));
  const cid = await bankClient(ctx);
  const role = await jget<{ id: string; name: string }>(ctx, `/clients/${cid}/roles/${encodeURIComponent(roleName)}`);
  const r = await ctx.secureFetch(`${ADMIN_API}/users/${userId}/role-mappings/clients/${cid}`, {
    method: "POST",
    headers: J,
    body: JSON.stringify([role]),
  });
  if (r.status !== 202 && !r.ok) throw new Error(`grant -> ${r.status} ${(await r.text()).slice(0, 200)}`);
  if (r.status === 204) throw new Error("Role was granted immediately (no change request): IGA is not enforcing this realm.");
  const after = await listCrs(ctx);
  const ids = after.filter((c) => !before.has(c.id)).map((c) => c.id);
  if (!ids.length) throw new Error("No change request was created");
  return ids;
}

/** Revoke the shared role again (also needs quorum). */
export async function fileRevokeRequest(ctx: Ctx, userId: string, roleName = BIG_ROLE): Promise<string[]> {
  const before = new Set((await listCrs(ctx)).map((c) => c.id));
  const cid = await bankClient(ctx);
  const role = await jget<{ id: string; name: string }>(ctx, `/clients/${cid}/roles/${encodeURIComponent(roleName)}`);
  const r = await ctx.secureFetch(`${ADMIN_API}/users/${userId}/role-mappings/clients/${cid}`, {
    method: "DELETE",
    headers: J,
    body: JSON.stringify([role]),
  });
  if (!r.ok) throw new Error(`revoke -> ${r.status} ${(await r.text()).slice(0, 200)}`);
  const after = await listCrs(ctx);
  return after.filter((c) => !before.has(c.id)).map((c) => c.id);
}

export interface ApproveResult {
  id: string;
  ok: boolean;
  committed?: boolean;
  detail?: string;
}

async function postApprove(ctx: Ctx, id: string, body: object) {
  const r = await ctx.secureFetch(`${ADMIN_API}/iga/change-requests/${id}/approve`, {
    method: "POST",
    headers: J,
    body: JSON.stringify(body),
  });
  const text = await r.text();
  let j: any;
  try {
    j = JSON.parse(text);
  } catch {
    j = { raw: text };
  }
  return { status: r.status, j };
}

/**
 * Approve one or more CRs with the caller's own identity. In Tide MultiAdmin mode the server answers
 * `needs-approval` and the Tide enclave popup must sign; all such requests are signed in ONE popup.
 */
export async function approveCrs(ctx: Ctx, ids: string[]): Promise<ApproveResult[]> {
  const out: Record<string, ApproveResult> = {};
  const toSign: { id: string; request: Uint8Array }[] = [];
  for (const id of ids) {
    const { status, j } = await postApprove(ctx, id, {});
    if (status >= 400) out[id] = { id, ok: false, detail: `${status} ${j.error ?? j.raw ?? ""}` };
    else if (j.mode === "needs-approval") toSign.push({ id, request: b64ToBytes(j.requestModel) });
    else out[id] = { id, ok: true, committed: !!j.committed };
  }
  if (toSign.length) {
    const res = await ctx.approveTideRequests(toSign);
    for (const item of res) {
      if (item.denied) out[item.id] = { id: item.id, ok: false, detail: "Bạn đã từ chối trong cửa sổ Tide" };
      else if (!item.approved) out[item.id] = { id: item.id, ok: false, detail: "Chưa ký xong trong cửa sổ Tide" };
      else {
        const { status, j } = await postApprove(ctx, item.id, { requestModel: bytesToB64(item.approved.request) });
        out[item.id] =
          status < 400
            ? { id: item.id, ok: true, committed: !!j.committed }
            : { id: item.id, ok: false, detail: `${status} ${j.error ?? j.raw ?? ""}` };
      }
    }
  }
  return ids.map((id) => out[id] ?? { id, ok: false, detail: "no result" });
}

/** Only call on a CR you just read as PENDING: deny does not check the status. */
export async function denyCr(ctx: Ctx, id: string, reason?: string) {
  const fresh = await jget<ChangeRequest>(ctx, `/iga/change-requests/${id}`);
  if (fresh.status !== "PENDING") throw new Error(`Yêu cầu không còn ở trạng thái chờ (${fresh.status})`);
  const r = await ctx.secureFetch(`${ADMIN_API}/iga/change-requests/${id}/deny`, {
    method: "POST",
    headers: J,
    body: JSON.stringify(reason ? { reason } : {}),
  });
  if (!r.ok) throw new Error(`deny -> ${r.status}`);
}

export async function getCr(ctx: Ctx, id: string): Promise<ChangeRequest> {
  return jget<ChangeRequest>(ctx, `/iga/change-requests/${id}`);
}
