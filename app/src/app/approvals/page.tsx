"use client";

import { useCallback, useEffect, useState } from "react";
import { useMe, txApi } from "@/lib/useMe";
import { seed, vnd, recipientName } from "@/lib/config";
import { approveCrs, approvalCount, denyCr, listCrs, type ChangeRequest } from "@/lib/iga";
import { approverNames } from "@/lib/names";
import type { Tx } from "@/lib/types";

const ACTION_LABEL: Record<string, string> = {
  GRANT_ROLES: "Cấp quyền",
  REVOKE_ROLES: "Thu hồi quyền",
  CREATE_ROLE: "Tạo quyền",
};

export default function ApprovalsPage() {
  const { persona, ctx, authenticated, loading } = useMe();
  const [pending, setPending] = useState<ChangeRequest[]>([]);
  const [done, setDone] = useState<ChangeRequest[]>([]);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const api = txApi(ctx);

  const refresh = useCallback(async () => {
    try {
      const [p, a, d] = await Promise.all([listCrs(ctx, "PENDING"), listCrs(ctx, "APPROVED"), listCrs(ctx, "DENIED")]);
      setPending(p);
      setDone(
        [...a, ...d]
          .filter((c) => !["ADOPT"].some((x) => c.actionType.startsWith(x)))
          .sort((x, y) => String(y.createdAt).localeCompare(String(x.createdAt)))
          .slice(0, 10)
      );
      setErr(null);
    } catch (e: any) {
      setErr(
        "Không đọc được danh sách yêu cầu từ TideCloak: " +
          (e?.message ?? e) +
          " (chỉ tài khoản có quyền tide-realm-admin mới xem và duyệt được)."
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

  if (loading) return <p>Đang tải…</p>;
  if (!authenticated) return <p>Hãy đăng nhập trước.</p>;

  const txOfCr = (id: string) => txs.find((t) => t.crIds.includes(id) || t.revokeCrId === id);
  const pendingIds = new Set(pending.map((c) => c.id));
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

  const knownRecipient = (tx: Tx) =>
    seed.history.some((h) => h.to === tx.to) || txs.some((t) => t.to === tx.to && t.status === "EXECUTED");

  async function approve(g: { key: string; crs: ChangeRequest[] }) {
    setBusy(g.key);
    setMsg(null);
    try {
      const res = await approveCrs(ctx, g.crs.map((c) => c.id));
      const bad = res.filter((r) => !r.ok);
      if (bad.length) setMsg({ ok: false, text: "Chưa duyệt được: " + bad.map((b) => b.detail).join("; ") });
      else setMsg({ ok: true, text: res.every((r) => r.committed) ? "Đã duyệt. Đủ người duyệt, quyền đã được cấp." : "Đã ghi lượt duyệt của bạn. Còn chờ thêm người duyệt." });
    } catch (e: any) {
      setMsg({ ok: false, text: e?.message ?? String(e) });
    } finally {
      setBusy(null);
      await refresh();
    }
  }

  async function deny(g: { key: string; tx?: Tx; crs: ChangeRequest[] }) {
    setBusy(g.key);
    setMsg(null);
    try {
      for (const c of g.crs) await denyCr(ctx, c.id, `Từ chối bởi ${persona?.display ?? "người duyệt"}`);
      if (g.tx) await api.patch(g.tx.txId, { status: "DENIED", deniedBy: persona?.display });
      setMsg({ ok: true, text: "Đã từ chối. Giao dịch này sẽ không được thực hiện." });
    } catch (e: any) {
      setMsg({ ok: false, text: e?.message ?? String(e) });
    } finally {
      setBusy(null);
      await refresh();
    }
  }

  return (
    <>
      <h1>Duyệt giao dịch</h1>
      <p className="warnbox">
        Lượt duyệt của bạn được gửi thẳng từ trình duyệt này tới TideCloak, ký bằng khoá của chính bạn qua Tide. Server của app
        không duyệt thay được. Lưu ý: chi tiết số tiền và người nhận dưới đây do app hiển thị; lượt duyệt hiện gắn với quyền
        &quot;chuyển khoản lớn&quot;, chưa gắn riêng với từng giao dịch.
      </p>
      {err && <p className="err">{err}</p>}
      {msg && <p className={msg.ok ? "okmsg" : "err"}>{msg.text}</p>}

      <h2>Đang chờ duyệt ({groups.length})</h2>
      {groups.length === 0 && <p className="muted">Không có yêu cầu nào đang chờ.</p>}
      {groups.map((g) => {
        const first = g.crs[0];
        const n = approvalCount(first);
        const thr = first.threshold;
        const label = ACTION_LABEL[first.actionType] ?? first.actionType;
        return (
          <div className="card" key={g.key}>
            {g.tx ? (
              <>
                <div className="big">
                  {g.tx.revokeCrId && g.crs.some((c) => c.id === g.tx!.revokeCrId)
                    ? "Khoá lại quyền chuyển khoản lớn"
                    : `${g.tx.requestedBy} muốn chuyển ${vnd(g.tx.amount)}`}
                </div>
                <div>
                  Người nhận: <strong>{recipientName(g.tx.to)}</strong> ({g.tx.toAccount})
                </div>
                {g.tx.note && <div className="note">Ghi chú: {g.tx.note}</div>}
                {!knownRecipient(g.tx) && (
                  <p className="warnbox">Bà chưa từng chuyển tiền cho người nhận này. Hãy gọi điện hỏi lại bà trước khi duyệt.</p>
                )}
              </>
            ) : (
              <>
                <div className="big">Thay đổi quản trị: {label}</div>
                <div className="note">Loại: {first.actionType} · không thuộc giao dịch nào của ví.</div>
              </>
            )}
            <div className="note">
              Đã duyệt: {n === null ? "?" : n}/{thr ?? "?"}
              {first.authorizers && first.authorizers.length > 0 && ` (${approverNames(first.authorizers).join(", ")})`}
              {first.blocked && " · đang chờ yêu cầu phụ thuộc"}
            </div>
            <div className="row" style={{ marginTop: ".5rem" }}>
              <button disabled={busy === g.key} onClick={() => approve(g)}>
                {busy === g.key ? "Đang xử lý…" : "Duyệt"}
              </button>
              <button className="danger" disabled={busy === g.key} onClick={() => deny(g)}>
                Từ chối
              </button>
            </div>
          </div>
        );
      })}

      <h2>Lịch sử gần đây</h2>
      {done.length === 0 && <p className="muted">Chưa có.</p>}
      {done.map((c) => {
        const tx = txOfCr(c.id);
        return (
          <div className="card" key={c.id}>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <strong>
                {tx ? `${vnd(tx.amount)} → ${recipientName(tx.to)}` : ACTION_LABEL[c.actionType] ?? c.actionType}
              </strong>
              <span className={`badge ${c.status === "APPROVED" ? "ok" : "bad"}`}>
                {c.status === "APPROVED" ? "Đã duyệt" : "Bị từ chối"}
              </span>
            </div>
            <div className="note">
              {c.authorizers && c.authorizers.length > 0 ? `Người duyệt: ${approverNames(c.authorizers).join(", ")}` : ""}
              {pendingIds.has(c.id) ? "" : ""}
            </div>
          </div>
        );
      })}
    </>
  );
}
