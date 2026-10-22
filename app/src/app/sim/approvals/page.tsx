"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSim, realmRoles, hasRole } from "@/lib/sim/client";
import type { SimCr } from "@/lib/sim/state";
import { seed } from "@/lib/sim/seedClient";
import { money } from "@/lib/format";
import { ApprovalsView } from "@/components/views/ApprovalsView";
import { AccessDenied, EnclaveModal, TokenPanel } from "@/components/sim/SimWidgets";
import type { HistoryV, Notice, RequestV } from "@/components/views/types";
import type { Tx } from "@/lib/types";

export default function SimApprovals() {
  const { claims, ready, call, token } = useSim();
  const [crs, setCrs] = useState<SimCr[]>([]);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [signing, setSigning] = useState<SimCr | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flash = (n: Notice) => {
    setNotice(n);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setNotice(null), 7000);
  };

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const r = await call("/api/sim/iga");
      if (r.ok) {
        setCrs(await r.json());
        setErr(null);
      } else setErr(((await r.json().catch(() => ({}))) as any).error ?? `Request failed (${r.status})`);
      const t = await call("/api/sim/tx");
      if (t.ok) setTxs(await t.json());
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
  if (!hasRole(claims, "owner") && !hasRole(claims, "approver")) return <AccessDenied need="owner or approver" have={realmRoles(claims)} />;

  const recipientId = (acc: string) => seed.recipients.find((r) => r.account === acc)?.id;
  const known = (cr: SimCr) => {
    const id = recipientId(cr.toAccount);
    return !!id && (seed.history.some((h) => h.to === id) || txs.some((t) => t.to === id && t.status === "EXECUTED"));
  };
  const nameOfUser = (u: string) => (u === "mom" ? "Mom (Lan)" : u.charAt(0).toUpperCase() + u.slice(1));

  const requests: RequestV[] = crs
    .filter((c) => c.status === "PENDING")
    .map((c) => ({
      id: c.id,
      kind: "transfer",
      amount: c.amount,
      toName: c.toName,
      toAccount: c.toAccount,
      note: txs.find((t) => t.txId === c.txId)?.note,
      requestedBy: nameOfUser(c.requestedBy),
      requestedAt: c.createdAt,
      isNewRecipient: !known(c),
      approvals: c.authorizers.length,
      threshold: c.threshold,
      approvers: c.authorizers.map((a) => a.name),
    }));

  const history: HistoryV[] = crs
    .filter((c) => c.status !== "PENDING")
    .slice(0, 10)
    .map((c) => ({
      id: c.id,
      title: `${money(c.amount)} to ${c.toName}`,
      status: c.status === "COMMITTED" ? "approved" : "denied",
      approvers: c.authorizers.map((a) => a.name),
      when: c.createdAt,
    }));

  async function confirmSign() {
    if (!signing) return;
    setBusy(signing.id);
    try {
      const r = await call("/api/sim/iga", { method: "POST", body: JSON.stringify({ action: "approve", id: signing.id }) });
      const j = await r.json();
      if (!r.ok) flash({ ok: false, text: r.status === 409 ? "You already approved this request. A different person has to give the second key." : (j.error ?? "Could not approve") });
      else
        flash({
          ok: true,
          text: j.committed ? "Approved. 2 of 2 keys are in, so the one-time permission was granted." : `Your key is recorded (${j.authorizationCount} of ${j.threshold}). Waiting for one more approver.`,
        });
    } finally {
      setBusy(null);
      setSigning(null);
      await load();
    }
  }

  async function deny(id: string) {
    setBusy(id);
    try {
      const r = await call("/api/sim/iga", { method: "POST", body: JSON.stringify({ action: "deny", id }) });
      flash(r.ok ? { ok: true, text: "Denied. This transfer will not go through." } : { ok: false, text: "Could not deny this request." });
    } finally {
      setBusy(null);
      await load();
    }
  }

  return (
    <>
      <ApprovalsView
        requests={requests}
        adminChanges={[]}
        history={history}
        busyId={busy}
        notice={notice}
        error={err}
        intro="Review requests from your family. Each approval is one key; two different keys are needed. Signing is simulated in this mode."
        onApprove={(id) => setSigning(crs.find((c) => c.id === id) ?? null)}
        onDeny={deny}
      />
      <div className="container">
        <TokenPanel claims={claims} />
      </div>
      {signing && (
        <EnclaveModal
          title="Sign"
          busy={busy === signing.id}
          lines={[
            ["Action", "Grant one-time large-transfer permission"],
            ["Amount", money(signing.amount)],
            ["To", `${signing.toName} (${signing.toAccount})`],
            ["Requested by", nameOfUser(signing.requestedBy)],
            ["Signing as", claims.name],
          ]}
          onConfirm={confirmSign}
          onCancel={() => setSigning(null)}
        />
      )}
    </>
  );
}
