"use client";

import { useCallback, useEffect, useState } from "react";
import { useMe, txApi, bankTransfer, bankLedger } from "@/lib/useMe";
import { seed, vnd, recipientName } from "@/lib/config";
import { fileGrantRequest, fileRevokeRequest, getCr } from "@/lib/iga";
import { approverNames } from "@/lib/names";
import type { Tx } from "@/lib/types";

const LAG_SECONDS = 120;

const randHex = (n = 8) =>
  Array.from(crypto.getRandomValues(new Uint8Array(n)), (b) => b.toString(16).padStart(2, "0")).join("");

export default function WalletPage() {
  const { tc, persona, sub, ctx, authenticated, loading } = useMe();
  const [ledger, setLedger] = useState<any>(null);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [rid, setRid] = useState(seed.recipients[0].id);
  const [amount, setAmount] = useState<number>(seed.recipients[0].suggested);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [now, setNow] = useState(Date.now());

  const api = txApi(ctx);

  const refresh = useCallback(async () => {
    try {
      setLedger(await bankLedger());
    } catch {
      setMsg({ ok: false, text: "Không kết nối được MockBank (cổng 4000). Hãy chạy bank trước." });
    }
    try {
      setTxs(await api.list());
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx]);

  useEffect(() => {
    if (authenticated) void refresh();
  }, [authenticated, refresh]);

  // Poll TideCloak for the state of the change requests of pending transactions.
  useEffect(() => {
    if (!authenticated) return;
    const t = setInterval(async () => {
      setNow(Date.now());
      const pending = txs.filter((x) => x.status === "PENDING" && x.crIds.length);
      let changed = false;
      for (const tx of pending) {
        try {
          const crs = await Promise.all(tx.crIds.map((id) => getCr(ctx, id)));
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

  if (loading) return <p>Đang tải…</p>;
  if (!authenticated) return <p>Hãy đăng nhập trước.</p>;
  if (persona?.role !== "parent") return <p className="err">Trang này dành cho chủ tài khoản (Bà Lan). Người duyệt hãy vào mục &quot;Duyệt giao dịch&quot;.</p>;

  const rec = seed.recipients.find((r) => r.id === rid)!;
  const isBig = amount >= seed.threshold_vnd;

  async function submit() {
    setBusy(true);
    setMsg(null);
    try {
      const tx: Tx = {
        txId: crypto.randomUUID(),
        from: seed.owner.account,
        to: rec.id,
        toAccount: rec.account,
        amount,
        nonce: randHex(),
        note,
        status: "PENDING",
        crIds: [],
        requestedBy: persona!.display,
        requestedAt: new Date().toISOString(),
      };
      if (!isBig) {
        // Small transfer: straight from Bà Lan's browser to the bank with her own token.
        const r = await bankTransfer(ctx, tx);
        if (r.status === 200) {
          await api.add({ ...tx, status: "EXECUTED", executedAt: new Date().toISOString() });
          setMsg({ ok: true, text: `Đã chuyển ${vnd(amount)} cho ${rec.name}.` });
        } else {
          setMsg({ ok: false, text: `Ngân hàng từ chối (${r.status}): ${r.body?.error ?? r.body?.code ?? ""}` });
        }
      } else {
        await api.add(tx);
        const ids = await fileGrantRequest(ctx, sub!);
        await api.patch(tx.txId, { crIds: ids });
        setMsg({ ok: true, text: `Khoản ${vnd(amount)} đang chờ người thân duyệt. Hãy nhờ Thảo hoặc Minh vào mục "Duyệt giao dịch".` });
      }
      await refresh();
    } catch (e: any) {
      setMsg({ ok: false, text: e?.message ?? String(e) });
    } finally {
      setBusy(false);
    }
  }

  async function execute(tx: Tx) {
    setBusy(true);
    setMsg(null);
    try {
      // The role reaches the token only after a refresh (can lag up to ~120 s after the approval).
      await tc.forceRefreshToken?.();
      const r = await bankTransfer(ctx, tx);
      if (r.status === 200) {
        await api.patch(tx.txId, { status: "EXECUTED", executedAt: new Date().toISOString() });
        setMsg({ ok: true, text: `Đã chuyển ${vnd(tx.amount)} cho ${recipientName(tx.to)}.` });
      } else if (r.status === 403) {
        setMsg({
          ok: false,
          text: "Quyền duyệt chưa vào token của bạn (có thể trễ tới 2 phút). Đợi một chút rồi bấm lại, hoặc đăng xuất rồi đăng nhập lại.",
        });
      } else {
        setMsg({ ok: false, text: `Ngân hàng từ chối (${r.status}): ${r.body?.error ?? r.body?.code ?? ""}` });
      }
      await refresh();
    } catch (e: any) {
      setMsg({ ok: false, text: e?.message ?? String(e) });
    } finally {
      setBusy(false);
    }
  }

  async function revoke(tx: Tx) {
    setBusy(true);
    try {
      const ids = await fileRevokeRequest(ctx, sub!);
      await api.patch(tx.txId, { revokeCrId: ids[0] ?? "pending" });
      setMsg({ ok: true, text: "Đã gửi yêu cầu khoá lại quyền chuyển khoản lớn. Cần người thân duyệt." });
      await refresh();
    } catch (e: any) {
      setMsg({ ok: false, text: e?.message ?? String(e) });
    } finally {
      setBusy(false);
    }
  }

  const badge = (t: Tx) =>
    t.status === "EXECUTED" ? (
      <span className="badge ok">Đã chuyển</span>
    ) : t.status === "APPROVED" ? (
      <span className="badge ok">Đã được duyệt – chờ thực hiện</span>
    ) : t.status === "DENIED" ? (
      <span className="badge bad">Bị từ chối</span>
    ) : (
      <span className="badge wait">Chờ người thân duyệt</span>
    );

  return (
    <>
      <h1>Ví của {persona.display}</h1>
      <div className="card">
        <div className="muted">Số dư tài khoản {seed.owner.account}</div>
        <div className="balance">{ledger ? vnd(ledger.balance) : "…"}</div>
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Chuyển tiền</h2>
        <label>Người nhận</label>
        <select
          value={rid}
          onChange={(e) => {
            setRid(e.target.value);
            setAmount(seed.recipients.find((r) => r.id === e.target.value)!.suggested);
          }}
        >
          {seed.recipients.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name} – {r.account}
            </option>
          ))}
        </select>
        <label>Số tiền (đồng)</label>
        <input type="number" min={1000} step={1000} value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
        <div className="note">{vnd(amount)}</div>
        <label>Ghi chú</label>
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ví dụ: học phí" />
        {isBig ? (
          <p className="warnbox">
            Khoản này từ {vnd(seed.threshold_vnd)} trở lên: cần Thảo hoặc Minh duyệt cùng bà. Giao dịch sẽ được giữ lại cho đến khi đủ người duyệt.
          </p>
        ) : (
          <p className="note">Dưới {vnd(seed.threshold_vnd)}: chuyển ngay, không cần ai duyệt.</p>
        )}
        <button disabled={busy || !(amount > 0)} onClick={submit}>
          {busy ? "Đang xử lý…" : isBig ? "Gửi xin duyệt" : "Chuyển ngay"}
        </button>
        {msg && <p className={msg.ok ? "okmsg" : "err"}>{msg.text}</p>}
      </div>

      <h2>Lịch sử giao dịch</h2>
      {txs.length === 0 && <p className="muted">Chưa có giao dịch nào trong phiên này.</p>}
      {txs.map((t) => {
        const left = t.approvedAt ? Math.max(0, LAG_SECONDS - Math.floor((now - Date.parse(t.approvedAt)) / 1000)) : 0;
        return (
          <div className="card" key={t.txId}>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <strong>
                {vnd(t.amount)} → {recipientName(t.to)}
              </strong>
              {badge(t)}
            </div>
            <div className="note">
              {new Date(t.requestedAt).toLocaleString("vi-VN")} {t.note ? `· ${t.note}` : ""}
            </div>
            {t.approvers && t.approvers.length > 0 && <div className="note">Đã duyệt bởi: {t.approvers.join(", ")}</div>}
            {t.status === "APPROVED" && (
              <>
                <p className="note">
                  Quyền chuyển khoản lớn có thể mất tới {LAG_SECONDS} giây để vào token.
                  {left > 0 ? ` Gợi ý đợi thêm khoảng ${left} giây.` : " Bạn có thể thử ngay."}
                </p>
                <button disabled={busy} onClick={() => execute(t)}>
                  Thực hiện chuyển tiền (làm mới token)
                </button>
              </>
            )}
            {t.status === "EXECUTED" && t.amount >= seed.threshold_vnd && !t.revokeCrId && t.crIds.length > 0 && (
              <button className="secondary" disabled={busy} onClick={() => revoke(t)}>
                Khoá lại quyền (cần người thân duyệt)
              </button>
            )}
            {t.revokeCrId && <div className="note">Đã gửi yêu cầu khoá lại quyền.</div>}
          </div>
        );
      })}
    </>
  );
}
