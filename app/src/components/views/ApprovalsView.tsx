"use client";
import { IconAlert, IconInfo } from "../ui/Icons";
import { Pill } from "../ui/Pill";
import { money, timeAgo } from "@/lib/format";
import type { RequestV, AdminChangeV, HistoryV, Notice } from "./types";

function Dots({ n, thr, names }: { n: number | null; thr: number | null; names: string[] }) {
  const total = thr ?? 2;
  return (
    <div className="dots" style={{ marginTop: 14 }}>
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={`adot ${n !== null && i < n ? "on" : ""}`} />
      ))}
      <span className="small muted" style={{ marginLeft: 6 }}>
        {n === null ? "?" : n} of {total} approvals{names.length ? ` · ${names.join(", ")}` : ""}
      </span>
    </div>
  );
}

export function ApprovalsView(props: {
  requests: RequestV[];
  adminChanges: AdminChangeV[];
  history: HistoryV[];
  busyId: string | null;
  notice: Notice | null;
  error?: string | null;
  intro?: string;
  onApprove: (id: string) => void;
  onDeny: (id: string) => void;
}) {
  return (
    <main className="container page">
      <div className="page-head">
        <h1>Approvals</h1>
        <p className="muted">{props.intro ?? "Review requests from your family. Your approval is signed by you through Tide, not by this app."}</p>
      </div>
      {props.error && (
        <div className="hint hint-bad" style={{ marginBottom: 16 }}>
          <IconAlert width={18} height={18} />
          <span>{props.error}</span>
        </div>
      )}

      <h2 style={{ marginBottom: 12 }}>Waiting for you ({props.requests.length})</h2>
      {props.requests.length === 0 && <div className="card empty">Nothing is waiting for approval.</div>}
      <div className="stack">
        {props.requests.map((r) => (
          <section className="card" key={r.id}>
            <div className="row between">
              <span className="muted small">
                {r.kind === "lock" ? "Lock request" : "Transfer request"} · {timeAgo(r.requestedAt)}
              </span>
              <Pill kind="waiting" />
            </div>
            {r.kind === "lock" ? (
              <>
                <div className="amount-big" style={{ fontSize: "1.5rem", marginTop: 6 }}>
                  Lock the large-transfer permission again
                </div>
                <p className="muted" style={{ marginTop: 6 }}>
                  {r.requestedBy} asks to switch off the one-time permission used for the last big transfer.
                </p>
              </>
            ) : (
              <>
                <div className="amount-big" style={{ marginTop: 6 }}>
                  {money(r.amount ?? 0)}
                </div>
                <dl className="kv">
                  <dt>To</dt>
                  <dd>
                    {r.toName} <span className="muted num">({r.toAccount})</span>
                  </dd>
                  <dt>Requested by</dt>
                  <dd>{r.requestedBy}</dd>
                  {r.note && (
                    <>
                      <dt>Note</dt>
                      <dd>{r.note}</dd>
                    </>
                  )}
                </dl>
                {r.isNewRecipient && (
                  <div className="warn-banner">
                    <IconAlert width={20} height={20} />
                    <span>First transfer to this account. Call Mom before approving.</span>
                  </div>
                )}
              </>
            )}
            <Dots n={r.approvals} thr={r.threshold} names={r.approvers} />
            <div className="row" style={{ marginTop: 18 }}>
              <button className="btn btn-success" disabled={props.busyId === r.id} onClick={() => props.onApprove(r.id)}>
                {props.busyId === r.id ? "Working…" : "Approve"}
              </button>
              <button className="btn btn-danger" disabled={props.busyId === r.id} onClick={() => props.onDeny(r.id)}>
                Deny
              </button>
            </div>
            <p className="small muted" style={{ marginTop: 14, display: "flex", gap: 8 }}>
              <IconInfo width={16} height={16} style={{ flex: "none", marginTop: 3 }} /> Details shown by the app; the approval grants a
              one-time large-transfer permission.
            </p>
          </section>
        ))}
      </div>

      {props.adminChanges.length > 0 && (
        <details className="fold">
          <summary>Admin changes ({props.adminChanges.length})</summary>
          <div className="stack" style={{ marginTop: 12 }}>
            {props.adminChanges.map((c) => (
              <section className="card card-flat" key={c.id}>
                <h3>{c.label}</h3>
                <p className="small muted">Not part of a transfer. Changes who can approve or what the realm allows.</p>
                <Dots n={c.approvals} thr={c.threshold} names={c.approvers} />
                <div className="row" style={{ marginTop: 14 }}>
                  <button className="btn btn-success" disabled={props.busyId === c.id} onClick={() => props.onApprove(c.id)}>
                    Approve
                  </button>
                  <button className="btn btn-danger" disabled={props.busyId === c.id} onClick={() => props.onDeny(c.id)}>
                    Deny
                  </button>
                </div>
              </section>
            ))}
          </div>
        </details>
      )}

      <h2 style={{ margin: "40px 0 12px" }}>History</h2>
      <section className="card">
        {props.history.length === 0 && <div className="empty">No decisions yet.</div>}
        <ul className="activity">
          {props.history.map((h) => (
            <li key={h.id}>
              <div className="act-main">
                <div className="act-title">{h.title}</div>
                <div className="muted small">
                  {h.approvers.length ? `Approved by ${h.approvers.join(", ")}` : ""}
                  {h.when ? ` ${timeAgo(h.when)}` : ""}
                </div>
              </div>
              <Pill kind={h.status === "approved" ? "completed" : "denied"} />
            </li>
          ))}
        </ul>
      </section>

      {props.notice && (
        <div className={`toast ${props.notice.ok ? "toast-ok" : "toast-err"}`} role="status">
          {props.notice.text}
        </div>
      )}
    </main>
  );
}
