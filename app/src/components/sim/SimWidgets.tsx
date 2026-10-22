"use client";
import { IconLock, IconKey } from "../ui/Icons";
import { realmRoles, type SimClaims } from "@/lib/sim/client";

/** Collapsible panel so judges can SEE the roles the Tide token carries. */
export function TokenPanel({ claims }: { claims: SimClaims | null }) {
  if (!claims) return null;
  const aud = ([] as string[]).concat((claims.aud as any) ?? []);
  const bank = claims.resource_access?.["mock-bank"]?.roles ?? [];
  const exp = claims.exp ? new Date(claims.exp * 1000).toLocaleTimeString("en-GB") : "?";
  return (
    <details className="fold card card-flat" style={{ marginTop: 24, padding: "12px 20px" }}>
      <summary>Your token (decoded)</summary>
      <dl className="kv" style={{ marginTop: 12 }}>
        <dt>sub</dt>
        <dd className="num">{claims.sub}</dd>
        <dt>user</dt>
        <dd>
          {claims.name} ({claims.preferred_username})
        </dd>
        <dt>realm roles</dt>
        <dd>{realmRoles(claims).join(", ") || "none"}</dd>
        <dt>mock-bank roles</dt>
        <dd>{bank.length ? bank.join(", ") : "none (no large-transfer permission right now)"}</dd>
        <dt>aud</dt>
        <dd>{aud.join(", ")}</dd>
        <dt>issuer</dt>
        <dd>{claims.iss}</dd>
        <dt>expires</dt>
        <dd>{exp}</dd>
      </dl>
      <p className="small muted" style={{ marginTop: 8 }}>
        Signed by the simulated Tide Fabric key. The bank checks this signature with the public key only.
      </p>
    </details>
  );
}

export function AccessDenied({ need, have }: { need: string; have: string[] }) {
  return (
    <main className="container page">
      <div className="card" style={{ borderColor: "#f7b8b2" }}>
        <div className="row">
          <IconLock style={{ color: "var(--red)" }} />
          <h2 style={{ color: "var(--red)" }}>Access denied</h2>
        </div>
        <p style={{ marginTop: 10 }}>
          Requires role <strong>{need}</strong> (checked from your Tide token).
        </p>
        <p className="muted small" style={{ marginTop: 6 }}>
          Your roles: {have.length ? have.join(", ") : "none"}
        </p>
      </div>
    </main>
  );
}

/** Looks like the Tide enclave approval window. */
export function EnclaveModal(props: { title: string; lines: [string, string][]; busy?: boolean; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="modal-bg" role="dialog" aria-modal="true" aria-labelledby="enc-title">
      <div className="modal">
        <div className="row" style={{ color: "var(--teal)", fontWeight: 700, fontSize: ".8rem", letterSpacing: ".04em", textTransform: "uppercase" }}>
          <IconKey width={16} height={16} /> Tide · simulated enclave
        </div>
        <h2 id="enc-title" style={{ marginTop: 8 }}>
          Sign this approval with your Tide key
        </h2>
        <dl className="kv" style={{ marginTop: 14 }}>
          {props.lines.map(([k, v]) => (
            <div key={k} style={{ display: "contents" }}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
        <p className="small muted" style={{ marginTop: 12 }}>
          In real TideCloak your key never leaves the enclave. Here the signature is simulated.
        </p>
        <div className="row" style={{ justifyContent: "flex-end", marginTop: 20 }}>
          <button className="btn btn-ghost" onClick={props.onCancel} disabled={props.busy}>
            Cancel
          </button>
          <button className="btn btn-success" onClick={props.onConfirm} disabled={props.busy}>
            {props.busy ? "Signing…" : "Confirm and sign"}
          </button>
        </div>
      </div>
    </div>
  );
}
