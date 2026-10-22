"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useMe, txApi } from "@/lib/useMe";
import { seed, recipientName } from "@/lib/config";
import { approveCrs, approvalCount, denyCr, listCrs, type ChangeRequest } from "@/lib/iga";
import { approverNames } from "@/lib/names";
import { money } from "@/lib/format";
import { ApprovalsView } from "@/components/views/ApprovalsView";
import type { AdminChangeV, HistoryV, Notice, RequestV } from "@/components/views/types";
import type { Tx } from "@/lib/types";

const ACTION_LABEL: Record<string, string> = {
  GRANT_ROLES: "Grant a role",
  REVOKE_ROLES: "Revoke a role",
  CREATE_ROLE: "Create a role",
  CREATE_USER: "Create a user",
  REGEN_ADMIN_POLICY: "Update the admin approval policy",
};

export default function ApprovalsPage() {
  const { persona, ctx, authenticated, loading } = useMe();
  const [pending, setPending] = useState<ChangeRequest[]>([]);
  const [done, setDone] = useState<ChangeRequest[]>([]);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const api = txApi(ctx);

  const flash = (n: Notice) => {
    setNotice(n);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setNotice(null), 7000);
  };

  const refresh = useCallback(async () => {
    try {
      const [p, a, d] = await Promise.all([listCrs(ctx, "PENDING"), listCrs(ctx, "APPROVED"), listCrs(ctx, "DENIED")]);
      setPending(p);
      setDone(
        [...a, ...d]
          .filter((c) => !c.actionType.startsWith("ADOPT"))
          .sort((x, y) => String(y.createdAt).localeCompare(String(x.createdAt)))
          .slice(0, 10)
      );
      setErr(null);
    } catch (e: any) {
      setErr(
        "Could not read requests from TideCloak: " +
          (e?.message ?? e) +
          " Only accounts with the tide-realm-admin role can view and approve requests."
      );
    }
    try {
      setTxs(await api.list());
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx]);

  useEffect(() => {
    if (!authenticated) return;
    void refresh();
    const t = setInterval(refresh, 8000);
    return () => clearInterval(t);
  }, [authenticated, refresh]);

  if (loading) return <main className="container page"><p className="muted">Loading…</p></main>;
  if (!authenticated) return <main className="container page"><p>Please sign in first.</p></main>;

  const txOfCr = (id: string) => txs.find((t) => t.crIds.includes(id) || t.revokeCrId === id);
  const knownRecipient = (tx: Tx) =>
    seed.history.some((h) => h.to === tx.to) || txs.some((t) => t.to === tx.to && t.status === "EXECUTED");

  // One card per transaction (its CRs grouped), one per unrelated CR.
  const groups: { key: string; tx?: Tx; crs: ChangeRequest[] }[] = [];
  const seen = new Set<string>();
  for (const cr of pending) {
    if (seen.has(cr.id)) continue;
    const tx = txOfCr(cr.id);
    if (tx) {
      const crs = pending.filter((c) => txOfCr(c.id)?.txId === tx.txId);
      crs.forEach((c) => seen.add(c.id));
      groups.push({ key: tx.txId, tx, crs });
    } else {
      seen.add(cr.id);
      groups.push({ key: cr.id, crs: [cr] });
    }
  }
  const groupOf = (id: string) => groups.find((g) => g.key === id)!;

  const requests: RequestV[] = groups
    .filter((g) => g.tx)
    .map((g) => {
      const tx = g.tx!;
      const first = g.crs[0];
      const isLock = !!tx.revokeCrId && g.crs.some((c) => c.id === tx.revokeCrId);
      return {
        id: g.key,
        kind: isLock ? "lock" : "transfer",
        amount: tx.amount,
        toName: recipientName(tx.to),
        toAccount: tx.toAccount,
        note: tx.note,
        requestedBy: tx.requestedBy,
        requestedAt: tx.requestedAt,
        isNewRecipient: !knownRecipient(tx),
        approvals: approvalCount(first),
        threshold: first.threshold ?? 2,
        approvers: approverNames(first.authorizers ?? []),
      };
    });

  const adminChanges: AdminChangeV[] = groups
    .filter((g) => !g.tx)
    .map((g) => ({
      id: g.key,
      label: ACTION_LABEL[g.crs[0].actionType] ?? g.crs[0].actionType,
      approvals: approvalCount(g.crs[0]),
      threshold: g.crs[0].threshold ?? null,
      approvers: approverNames(g.crs[0].authorizers ?? []),
    }));

  const history: HistoryV[] = done.map((c) => {
    const tx = txOfCr(c.id);
    return {
      id: c.id,
      title: tx ? `${money(tx.amount)} to ${recipientName(tx.to)}` : (ACTION_LABEL[c.actionType] ?? c.actionType),
      status: c.status === "APPROVED" ? "approved" : "denied",
      approvers: approverNames(c.authorizers ?? []),
      when: typeof c.createdAt === "number" || typeof c.createdAt === "string" ? String(c.createdAt) : undefined,
    };
  });

  async function approve(key: string) {
    const g = groupOf(key);
    setBusy(key);
    setNotice(null);
    try {
      const res = await approveCrs(ctx, g.crs.map((c) => c.id));
      const bad = res.filter((r) => !r.ok);
      if (bad.length) flash({ ok: false, text: "Could not approve: " + bad.map((b) => b.detail).join("; ") });
      else
        flash({
          ok: true,
          text: res.every((r) => r.committed)
            ? "Approved. Enough approvals are in, so the permission has been granted."
            : "Your approval is recorded. Waiting for one more approver.",
        });
    } catch (e: any) {
      flash({ ok: false, text: e?.message ?? String(e) });
    } finally {
      setBusy(null);
      await refresh();
    }
  }

  async function deny(key: string) {
    const g = groupOf(key);
    setBusy(key);
    setNotice(null);
    try {
      for (const c of g.crs) await denyCr(ctx, c.id, `Denied by ${persona?.display ?? "an approver"}`);
      if (g.tx) await api.patch(g.tx.txId, { status: "DENIED", deniedBy: persona?.display });
      flash({ ok: true, text: "Denied. This transfer will not go through." });
    } catch (e: any) {
      flash({ ok: false, text: e?.message ?? String(e) });
    } finally {
      setBusy(null);
      await refresh();
    }
  }

  return (
    <ApprovalsView
      requests={requests}
      adminChanges={adminChanges}
      history={history}
      busyId={busy}
      notice={notice}
      error={err}
      onApprove={approve}
      onDeny={deny}
    />
  );
}
