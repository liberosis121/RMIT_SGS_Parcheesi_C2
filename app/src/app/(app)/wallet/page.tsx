"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useMe, txApi, bankTransfer, bankLedger } from "@/lib/useMe";
import { seed, recipientName } from "@/lib/config";
import { fileGrantRequest, fileRevokeRequest, getCr, approvalCount } from "@/lib/iga";
import { approverNames } from "@/lib/names";
import { money } from "@/lib/format";
import { bankMessage } from "@/lib/messages";
import { WalletView } from "@/components/views/WalletView";
import type { Notice, TransferV, RecipientV } from "@/components/views/types";
import type { Tx } from "@/lib/types";

const LAG_SECONDS = 120;
const THRESHOLD = seed.threshold_vnd;

const randHex = (n = 8) =>
  Array.from(crypto.getRandomValues(new Uint8Array(n)), (b) => b.toString(16).padStart(2, "0")).join("");

const RECIPIENTS: RecipientV[] = seed.recipients.map((r) => ({ id: r.id, name: r.name, account: r.account }));

export default function WalletPage() {
  const { tc, persona, sub, ctx, authenticated, loading } = useMe();
  const [ledger, setLedger] = useState<any>(null);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [forge, setForge] = useState<{ status: number; code?: string; text: string } | null>(null);
  const [now, setNow] = useState(Date.now());
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const api = txApi(ctx);

  const flash = (n: Notice) => {
    setNotice(n);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setNotice(null), 7000);
  };

  const refresh = useCallback(async () => {
    try {
      setLedger(await bankLedger());
    } catch {
      flash({ ok: false, text: "Cannot reach the bank service. Start MockBank first (port 4000)." });
    }
    try {
      setTxs(await api.list());
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx]);

  useEffect(() => {
    if (authenticated) void refresh();
  }, [authenticated, refresh]);

  // Poll TideCloak for the state of the change requests behind pending transfers.
  useEffect(() => {
    if (!authenticated) return;
    const t = setInterval(async () => {
      setNow(Date.now());
      const pending = txs.filter((x) => x.status === "PENDING" && x.crIds.length);
      let changed = false;
      for (const tx of pending) {
        try {
          const crs = await Promise.all(tx.crIds.map((id) => getCr(ctx, id)));
          const n = approvalCount(crs[0]);
          if (n !== null) setProgress((p) => ({ ...p, [tx.txId]: n }));
          if (crs.some((c) => c.status === "DENIED" || c.status === "CANCELLED")) {
            await api.patch(tx.txId, { status: "DENIED" });
            changed = true;
          } else if (crs.every((c) => c.status === "APPROVED")) {
            await api.patch(tx.txId, {
              status: "APPROVED",
              approvedAt: new Date().toISOString(),
              approvers: approverNames(crs.flatMap((c) => c.authorizers ?? [])),
            });
            changed = true;
          }
        } catch {}
      }
      if (changed) setTxs(await api.list());
    }, 5000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticated, txs, ctx]);

  if (loading) return <main className="container page"><p className="muted">Loading…</p></main>;
  if (!authenticated) return <main className="container page"><p>Please sign in first.</p></main>;
  if (persona?.role !== "parent")
    return (
      <main className="container page">
        <div className="card">This page is for the account owner. Family approvers can use the Approvals page.</div>
      </main>
    );

  const transfers: TransferV[] = txs.map((t) => ({
    txId: t.txId,
    toId: t.to,
    toName: recipientName(t.to),
    toAccount: t.toAccount,
    amount: t.amount,
    note: t.note,
    requestedAt: t.requestedAt,
    requestedBy: t.requestedBy,
    status: t.status === "EXECUTED" ? "completed" : t.status === "APPROVED" ? "approved" : t.status === "DENIED" ? "denied" : t.status === "FAILED" ? "blocked" : "waiting",
    approvals: t.status === "APPROVED" || t.status === "EXECUTED" ? 2 : (progress[t.txId] ?? 0),
    threshold: 2,
    approvers: t.approvers ?? [],
    approvedAt: t.approvedAt,
    canLock: t.status === "EXECUTED" && t.amount >= THRESHOLD && t.crIds.length > 0,
    lockRequested: !!t.revokeCrId,
  }));

  async function submit(v: { recipientId: string; amount: number; note: string }) {
    const rec = seed.recipients.find((r) => r.id === v.recipientId)!;
    setBusy(true);
    setNotice(null);
    try {
      const tx: Tx = {
        txId: crypto.randomUUID(),
        from: seed.owner.account,
        to: rec.id,
        toAccount: rec.account,
        amount: v.amount,
        nonce: randHex(),
        note: v.note,
        status: "PENDING",
        crIds: [],
        requestedBy: persona!.display,
        requestedAt: new Date().toISOString(),
      };
      if (v.amount < THRESHOLD) {
        // Small transfer: straight from the owner's browser to the bank with her own token.
        const r = await bankTransfer(ctx, tx);
        if (r.status === 200) {
          await api.add({ ...tx, status: "EXECUTED", executedAt: new Date().toISOString() });
          flash({ ok: true, text: `Sent ${money(v.amount)} to ${rec.name}.` });
        } else {
          flash({ ok: false, text: bankMessage(r.body?.code, r.body?.error) });
        }
      } else {
        await api.add(tx);
        const ids = await fileGrantRequest(ctx, sub!);
        await api.patch(tx.txId, { crIds: ids });
        flash({ ok: true, text: `Request sent. ${money(v.amount)} is waiting for Thao or Minh to approve.` });
      }
      await refresh();
    } catch (e: any) {
      flash({ ok: false, text: e?.message ?? String(e) });
    } finally {
      setBusy(false);
    }
  }

  async function complete(t: TransferV) {
    const tx = txs.find((x) => x.txId === t.txId)!;
    setBusy(true);
    setNotice(null);
    try {
      // The role reaches the token only after a refresh (can lag up to ~120 s after the approval).
      await tc.forceRefreshToken?.();
      const r = await bankTransfer(ctx, tx);
      if (r.status === 200) {
        await api.patch(tx.txId, { status: "EXECUTED", executedAt: new Date().toISOString() });
        flash({ ok: true, text: `Sent ${money(tx.amount)} to ${recipientName(tx.to)}.` });
      } else if (r.status === 403) {
        flash({ ok: false, text: bankMessage(r.body?.code) + " The permission can take up to 2 minutes to reach your session. Wait a moment and try again, or sign out and back in." });
      } else {
        flash({ ok: false, text: bankMessage(r.body?.code, r.body?.error) });
      }
      await refresh();
    } catch (e: any) {
      flash({ ok: false, text: e?.message ?? String(e) });
    } finally {
      setBusy(false);
    }
  }

  async function lock(t: TransferV) {
    setBusy(true);
    try {
      const ids = await fileRevokeRequest(ctx, sub!);
      await api.patch(t.txId, { revokeCrId: ids[0] ?? "pending" });
      flash({ ok: true, text: "Lock requested. Your family needs to approve it." });
      await refresh();
    } catch (e: any) {
      flash({ ok: false, text: e?.message ?? String(e) });
    } finally {
      setBusy(false);
    }
  }

  async function forgeApproval(t: TransferV) {
    const tx = txs.find((x) => x.txId === t.txId)!;
    setBusy(true);
    try {
      await api.patch(tx.txId, { status: "APPROVED", approvedAt: new Date().toISOString() }); // untrusted DB edited by "dev"
      const r = await bankTransfer(ctx, tx);
      setForge({ status: r.status, code: r.body?.code, text: bankMessage(r.body?.code, r.body?.error) });
      await refresh();
    } catch (e: any) {
      flash({ ok: false, text: e?.message ?? String(e) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <WalletView
      ownerName={persona.display.replace(/ \(.*\)$/, "")}
      balance={ledger ? ledger.balance : null}
      account={seed.owner.account}
      threshold={THRESHOLD}
      approverNames={seed.approvers.map((a) => a.display).join(" or ")}
      recipients={RECIPIENTS}
      transfers={transfers}
      busy={busy}
      notice={notice}
      forgeResult={forge}
      secondsLeft={(t) => (t.approvedAt ? Math.max(0, LAG_SECONDS - Math.floor((now - Date.parse(t.approvedAt)) / 1000)) : 0)}
      onSubmit={submit}
      onComplete={complete}
      onLock={lock}
      onForge={forgeApproval}
    />
  );
}
