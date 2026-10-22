"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSim, bankWithToken, hasRole, realmRoles } from "@/lib/sim/client";
import type { SimCr } from "@/lib/sim/state";
import { seed } from "@/lib/sim/seedClient";
import { money } from "@/lib/format";
import { bankMessage } from "@/lib/messages";
import { WalletView } from "@/components/views/WalletView";
import { AccessDenied, TokenPanel } from "@/components/sim/SimWidgets";
import type { Notice, RecipientV, TransferV } from "@/components/views/types";
import type { Tx } from "@/lib/types";

const THRESHOLD = seed.threshold_vnd;
const LAG_SECONDS = 0; // the simulated realm re-issues roles immediately on refresh
const RECIPIENTS: RecipientV[] = seed.recipients.map((r) => ({ id: r.id, name: r.name, account: r.account }));
const nameOf = (id: string) => seed.recipients.find((r) => r.id === id)?.name ?? id;
const randHex = (n = 8) => Array.from(crypto.getRandomValues(new Uint8Array(n)), (b) => b.toString(16).padStart(2, "0")).join("");

export default function SimWallet() {
  const { claims, ready, call, refresh, token } = useSim();
  const [ledger, setLedger] = useState<any>(null);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [crs, setCrs] = useState<SimCr[]>([]);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [forge, setForge] = useState<{ status: number; code?: string; text: string } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flash = (n: Notice) => {
    setNotice(n);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setNotice(null), 7000);
  };
  const isOwner = hasRole(claims, "owner");

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setLedger(await (await fetch("/api/sim/bank/ledger")).json());
      const t = await call("/api/sim/tx");
      const list: Tx[] = t.ok ? await t.json() : [];
      const c = await call("/api/sim/iga");
      const crList: SimCr[] = c.ok ? await c.json() : [];
      setCrs(crList);
      // Reflect committed / denied change requests onto the (untrusted) description records.
      for (const tx of list) {
        if (tx.status !== "PENDING" || !tx.crIds.length) continue;
        const cr = crList.find((x) => x.id === tx.crIds[0]);
        if (cr?.status === "COMMITTED")
          await call("/api/sim/tx", { method: "PATCH", body: JSON.stringify({ txId: tx.txId, patch: { status: "APPROVED", approvedAt: new Date().toISOString(), approvers: cr.authorizers.map((a) => a.name) } }) });
        else if (cr?.status === "DENIED")
          await call("/api/sim/tx", { method: "PATCH", body: JSON.stringify({ txId: tx.txId, patch: { status: "DENIED" } }) });
      }
      const t2 = await call("/api/sim/tx");
      setTxs(t2.ok ? await t2.json() : list);
    } catch {}
  }, [token, call]);

  useEffect(() => {
    void load();
    const t = setInterval(load, 4000);
    return () => clearInterval(t);
  }, [load]);

  if (!ready) return <main className="container page"><p className="muted">Loading…</p></main>;
  if (!claims)
    return (
      <main className="container page">
        <div className="card">Please <a href="/sim/signin" style={{ color: "var(--teal)", fontWeight: 600 }}>sign in</a> first.</div>
      </main>
    );
  if (!isOwner) return <AccessDenied need="owner" have={realmRoles(claims)} />;

  const crOf = (tx: Tx) => crs.find((c) => c.id === tx.crIds[0]);
  const transfers: TransferV[] = txs.map((t) => ({
    txId: t.txId,
    toId: t.to,
    toName: nameOf(t.to),
    toAccount: t.toAccount,
    amount: t.amount,
    note: t.note,
    requestedAt: t.requestedAt,
    requestedBy: t.requestedBy,
    status: t.status === "EXECUTED" ? "completed" : t.status === "APPROVED" ? "approved" : t.status === "DENIED" ? "denied" : t.status === "FAILED" ? "blocked" : "waiting",
    approvals: t.status === "APPROVED" || t.status === "EXECUTED" ? 2 : (crOf(t)?.authorizers.length ?? 0),
    threshold: 2,
    approvers: t.approvers ?? [],
    approvedAt: t.approvedAt,
  }));

  async function submit(v: { recipientId: string; amount: number; note: string }) {
    const rec = seed.recipients.find((r) => r.id === v.recipientId)!;
    setBusy(true);
    setNotice(null);
    try {
      const tx: Tx = {
        txId: crypto.randomUUID(), from: seed.owner.account, to: rec.id, toAccount: rec.account, amount: v.amount, nonce: randHex(),
        note: v.note, status: "PENDING", crIds: [], requestedBy: claims!.name, requestedAt: new Date().toISOString(),
      };
      const body = { txId: tx.txId, from: tx.from, to: tx.toAccount, amount: tx.amount, nonce: tx.nonce, note: tx.note };
      if (v.amount < THRESHOLD) {
        const r = await bankWithToken(token, body);
        if (r.status === 200) {
          await call("/api/sim/tx", { method: "POST", body: JSON.stringify({ ...tx, status: "EXECUTED", executedAt: new Date().toISOString() }) });
          flash({ ok: true, text: `Sent ${money(v.amount)} to ${rec.name}.` });
        } else flash({ ok: false, text: bankMessage(r.body?.code, r.body?.error) });
      } else {
        await call("/api/sim/tx", { method: "POST", body: JSON.stringify(tx) });
        const r = await call("/api/sim/iga", { method: "POST", body: JSON.stringify({ action: "create", txId: tx.txId, amount: tx.amount, toName: rec.name, toAccount: rec.account }) });
        const cr = await r.json();
        if (!r.ok) throw new Error(cr.error ?? "Could not file the request");
        await call("/api/sim/tx", { method: "PATCH", body: JSON.stringify({ txId: tx.txId, patch: { crIds: [cr.id] } }) });
        flash({ ok: true, text: `Request sent. ${money(v.amount)} is waiting for family approval.` });
      }
      await load();
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
      // Re-issue the token so it carries the role that the approvals just granted.
      const fresh = await call("/api/sim/token/refresh", { method: "POST" });
      const newToken = fresh.ok ? ((await fresh.json()) as any).token : token;
      await refresh();
      const r = await bankWithToken(newToken, { txId: tx.txId, from: tx.from, to: tx.toAccount, amount: tx.amount, nonce: tx.nonce, note: tx.note });
      if (r.status === 200) {
        await call("/api/sim/tx", { method: "PATCH", body: JSON.stringify({ txId: tx.txId, patch: { status: "EXECUTED", executedAt: new Date().toISOString() } }) });
        flash({ ok: true, text: `Sent ${money(tx.amount)} to ${nameOf(tx.to)}. The one-time permission was used up.` });
      } else flash({ ok: false, text: bankMessage(r.body?.code, r.body?.error) });
      await load();
    } catch (e: any) {
      flash({ ok: false, text: e?.message ?? String(e) });
    } finally {
      setBusy(false);
    }
  }

  // (b) "dev edits DB to approved", then tries the bank with Mom's real token, which has no role.
  async function forgeDb(t: TransferV) {
    const tx = txs.find((x) => x.txId === t.txId)!;
    setBusy(true);
    try {
      await call("/api/sim/tx", { method: "PATCH", body: JSON.stringify({ txId: tx.txId, patch: { status: "APPROVED", approvedAt: new Date().toISOString() } }) });
      const r = await bankWithToken(token, { txId: tx.txId, from: tx.from, to: tx.toAccount, amount: tx.amount, nonce: tx.nonce });
      setForge({ status: r.status, code: r.body?.code, text: bankMessage(r.body?.code, r.body?.error) });
      await load();
    } finally {
      setBusy(false);
    }
  }

  // (a) a token signed with the attacker's own key.
  async function forgeToken() {
    setBusy(true);
    try {
      const f = (await (await fetch("/api/sim/attack/forged-token")).json()) as { token: string };
      const r = await bankWithToken(f.token, { txId: "forged-" + randHex(4), from: seed.owner.account, to: "9704999888777", amount: 200000000, nonce: randHex(4) });
      setForge({ status: r.status, code: r.body?.code, text: bankMessage(r.body?.code, r.body?.error) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <WalletView
        ownerName="Mom"
        balance={ledger ? ledger.balance : null}
        account={seed.owner.account}
        threshold={THRESHOLD}
        approverNames="Thao or Minh"
        recipients={RECIPIENTS}
        transfers={transfers}
        busy={busy}
        notice={notice}
        forgeResult={forge}
        secondsLeft={() => LAG_SECONDS}
        onSubmit={submit}
        onComplete={complete}
        onLock={() => {}}
        onForge={forgeDb}
        onForgeToken={forgeToken}
      />
      <div className="container">
        <TokenPanel claims={claims} />
      </div>
    </>
  );
}
