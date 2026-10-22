"use client";
import { useState } from "react";
import { IconArrowUp, IconInfo, IconLock, IconAlert, IconCheck, ICONS } from "../ui/Icons";
import { Pill, type PillKind } from "../ui/Pill";
import { money, maskAccount, timeAgo } from "@/lib/format";
import type { RecipientV, TransferV, Notice } from "./types";

const QUICK = [2000000, 30000000, 200000000];

const pillOf = (s: TransferV["status"]): PillKind =>
  s === "completed" ? "completed" : s === "approved" ? "approved" : s === "denied" ? "denied" : s === "blocked" ? "blocked" : "waiting";

function Progress({ t }: { t: TransferV }) {
  const sent = t.status === "completed";
  const approved = t.status === "approved" || sent;
  return (
    <div className="progress" aria-label="Transfer progress">
      <div className="pstep done">
        <div className="dot">
          <IconCheck width={14} height={14} />
        </div>
        Requested
      </div>
      <div className={`pstep ${approved ? "done" : "now"}`}>
        <div className="dot">{approved ? <IconCheck width={14} height={14} /> : "2"}</div>
        Family approval ({Math.min(t.approvals, t.threshold)} of {t.threshold})
      </div>
      <div className={`pstep ${sent ? "done" : approved ? "now" : ""}`}>
        <div className="dot">{sent ? <IconCheck width={14} height={14} /> : "3"}</div>
        Sent
      </div>
    </div>
  );
}

export function WalletView(props: {
  ownerName: string;
  balance: number | null;
  account: string;
  threshold: number;
  approverNames: string;
  recipients: RecipientV[];
  transfers: TransferV[];
  busy: boolean;
  notice: Notice | null;
  forgeResult: { status: number; code?: string; text: string } | null;
  secondsLeft: (t: TransferV) => number;
  onSubmit: (v: { recipientId: string; amount: number; note: string }) => void;
  onComplete: (t: TransferV) => void;
  onLock: (t: TransferV) => void;
  onForge: (t: TransferV) => void;
}) {
  const [rid, setRid] = useState(props.recipients[0]?.id ?? "");
  const [amount, setAmount] = useState<number>(30000000);
  const [note, setNote] = useState("");
  const big = amount >= props.threshold;
  const open = props.transfers.filter((t) => t.status === "waiting" || t.status === "approved");
  const forgeTarget = props.transfers.find((t) => t.status === "waiting");

  return (
    <main className="container page">
      <div className="page-head">
        <h1>Hello, {props.ownerName}</h1>
        <p className="muted">Your everyday money, with a safety net for the big moves.</p>
      </div>

      <div className="grid-2">
        <div className="stack-lg">
          <section className="card balance-card">
            <div className="label">Available balance</div>
            <div className="balance">{props.balance === null ? "…" : money(props.balance)}</div>
            <div className="meta">
              <span>Checking account</span>
              <span className="num">{maskAccount(props.account)}</span>
            </div>
            <div className="note">
              <IconLock width={18} height={18} /> Transfers of {money(props.threshold)} or more need family approval.
            </div>
          </section>

          {open.map((t) => {
            const left = props.secondsLeft(t);
            return (
              <section className="card" key={t.txId}>
                <div className="row between">
                  <h3>
                    {money(t.amount)} to {t.toName}
                  </h3>
                  <Pill kind={pillOf(t.status)} />
                </div>
                <Progress t={t} />
                {t.status === "waiting" && (
                  <div className="hint hint-wait">
                    <IconInfo width={18} height={18} />
                    <span>
                      Waiting for {props.approverNames} to approve. You can send the money once {t.threshold} approvals are in.
                    </span>
                  </div>
                )}
                {t.status === "approved" && (
                  <>
                    <div className="hint hint-ok">
                      <IconCheck width={18} height={18} />
                      <span>
                        Approved by {t.approvers.join(" and ") || "your family"}. The permission can take up to 2 minutes to reach your
                        session{left > 0 ? ` (about ${left}s left)` : ""}.
                      </span>
                    </div>
                    <div style={{ marginTop: 16 }}>
                      <button className="btn btn-success" disabled={props.busy} onClick={() => props.onComplete(t)}>
                        Complete transfer
                      </button>
                    </div>
                  </>
                )}
              </section>
            );
          })}
        </div>

        <section className="card">
          <h2>New transfer</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              props.onSubmit({ recipientId: rid, amount, note });
            }}
          >
            <label className="field" id="rec-label">
              Who are you paying?
            </label>
            <div className="recipients" role="radiogroup" aria-labelledby="rec-label">
              {props.recipients.map((r) => {
                const Ico = ICONS[r.id] ?? ICONS.bin;
                return (
                  <label key={r.id} className={`recipient ${rid === r.id ? "sel" : ""}`}>
                    <input type="radio" name="recipient" value={r.id} checked={rid === r.id} onChange={() => setRid(r.id)} />
                    <span className="rec-icon">
                      <Ico />
                    </span>
                    <span>
                      <div className="rec-name">{r.name}</div>
                      <div className="rec-acc num">{r.account}</div>
                    </span>
                  </label>
                );
              })}
            </div>
            <label className="field" htmlFor="amount">
              Amount
            </label>
            <div className="amount-wrap">
              <span>₫</span>
              <input
                id="amount"
                className="input"
                type="number"
                min={1000}
                step={1000}
                value={amount || ""}
                onChange={(e) => setAmount(Number(e.target.value))}
              />
            </div>
            <div className="chips">
              {QUICK.map((q) => (
                <button type="button" key={q} className="qchip" onClick={() => setAmount(q)}>
                  {money(q)}
                </button>
              ))}
            </div>
            <label className="field" htmlFor="note">
              Note (optional)
            </label>
            <input
              id="note"
              className="input"
              style={{ fontSize: "1rem" }}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. tuition"
            />
            {big ? (
              <div className="hint hint-wait">
                <IconInfo width={18} height={18} />
                <span>This will need approval from {props.approverNames}.</span>
              </div>
            ) : (
              <div className="hint hint-info">
                <IconInfo width={18} height={18} />
                <span>Under {money(props.threshold)}: sent immediately, no approval needed.</span>
              </div>
            )}
            <div style={{ marginTop: 20 }}>
              <button className="btn btn-primary btn-lg btn-block" disabled={props.busy || !(amount > 0)}>
                <IconArrowUp width={18} height={18} /> {props.busy ? "Working…" : big ? "Request approval" : "Send now"}
              </button>
            </div>
          </form>
        </section>
      </div>

      <section className="card" style={{ marginTop: 24 }}>
        <h2 style={{ marginBottom: 4 }}>Activity</h2>
        {props.transfers.length === 0 && <div className="empty">No transfers yet.</div>}
        <ul className="activity">
          {props.transfers.map((t) => {
            const Ico = ICONS[t.toId] ?? ICONS.bin;
            return (
              <li key={t.txId}>
                <span className="act-icon">
                  <Ico width={20} height={20} />
                </span>
                <div className="act-main">
                  <div className="act-title">{t.toName}</div>
                  <div className="muted small">
                    {timeAgo(t.requestedAt)}
                    {t.note ? ` · ${t.note}` : ""}
                    {t.status === "completed" && t.approvers.length ? ` · approved by ${t.approvers.join(", ")}` : ""}
                  </div>
                  {t.status === "completed" && t.canLock && !t.lockRequested && (
                    <button
                      className="btn btn-ghost"
                      style={{ minHeight: 36, marginTop: 8, padding: "0 12px" }}
                      disabled={props.busy}
                      onClick={() => props.onLock(t)}
                    >
                      Lock approval again
                    </button>
                  )}
                  {t.lockRequested && (
                    <div className="small muted" style={{ marginTop: 4 }}>
                      Lock requested. Your family needs to approve it.
                    </div>
                  )}
                </div>
                <div style={{ textAlign: "right" }}>
                  <div className="act-amount">−{money(t.amount)}</div>
                  <Pill kind={pillOf(t.status)} />
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="demo">
        <h3>Developer attack demo</h3>
        <p className="muted small" style={{ marginTop: 6 }}>
          Pretend someone with root access to this app&apos;s server edits its database to say a pending transfer is
          &quot;approved&quot;, then tries to send it to the bank.
        </p>
        <div style={{ marginTop: 12 }}>
          <button className="btn btn-danger" disabled={props.busy || !forgeTarget} onClick={() => forgeTarget && props.onForge(forgeTarget)}>
            Forge approval and try to send
          </button>
          {!forgeTarget && <span className="small muted" style={{ marginLeft: 12 }}>Needs a transfer that is waiting for approval.</span>}
        </div>
        {props.forgeResult && (
          <div className="result" role="status">
            <div className="row">
              <IconAlert width={18} height={18} /> <strong>The bank said no.</strong>{" "}
              <code>
                HTTP {props.forgeResult.status}
                {props.forgeResult.code ? ` · ${props.forgeResult.code}` : ""}
              </code>
            </div>
            <div style={{ marginTop: 6 }}>{props.forgeResult.text}</div>
          </div>
        )}
      </section>

      {props.notice && (
        <div className={`toast ${props.notice.ok ? "toast-ok" : "toast-err"}`} role="status">
          {props.notice.text}
        </div>
      )}
    </main>
  );
}
