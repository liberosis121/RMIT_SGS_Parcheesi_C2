"use client";
import { useState } from "react";
import { WalletView } from "@/components/views/WalletView";
import type { TransferV, Notice } from "@/components/views/types";
import { MOCK_RECIPIENTS, MOCK_TRANSFERS } from "@/lib/mock";
import { bankMessage } from "@/lib/messages";

// Mock-data wallet: interactive locally, never calls Tide or the bank.
export default function PreviewWallet() {
  const [transfers, setTransfers] = useState<TransferV[]>(MOCK_TRANSFERS);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [forge, setForge] = useState<{ status: number; code?: string; text: string } | null>(null);
  const [balance, setBalance] = useState(847600000);

  const flash = (n: Notice) => {
    setNotice(n);
    setTimeout(() => setNotice(null), 4000);
  };

  return (
    <WalletView
      ownerName="Mom"
      balance={balance}
      account="0071000123456"
      threshold={10000000}
      approverNames="Thao or Minh"
      recipients={MOCK_RECIPIENTS}
      transfers={transfers}
      busy={false}
      notice={notice}
      forgeResult={forge}
      secondsLeft={() => 0}
      onSubmit={({ recipientId, amount, note }) => {
        const r = MOCK_RECIPIENTS.find((x) => x.id === recipientId)!;
        const big = amount >= 10000000;
        const t: TransferV = {
          txId: "p" + Date.now(), toId: r.id, toName: r.name, toAccount: r.account, amount, note,
          requestedAt: new Date().toISOString(), requestedBy: "Mom (Lan)",
          status: big ? "waiting" : "completed", approvals: 0, threshold: 2, approvers: [],
        };
        setTransfers([t, ...transfers]);
        if (!big) setBalance((b) => b - amount);
        flash({ ok: true, text: big ? "Request sent. Waiting for family approval." : "Sent." });
      }}
      onComplete={(t) => {
        setTransfers(transfers.map((x) => (x.txId === t.txId ? { ...x, status: "completed", canLock: true } : x)));
        setBalance((b) => b - t.amount);
        flash({ ok: true, text: "Transfer sent." });
      }}
      onLock={(t) => setTransfers(transfers.map((x) => (x.txId === t.txId ? { ...x, lockRequested: true } : x)))}
      onForge={() =>
        setForge({ status: 403, code: "NEEDS_FAMILY_APPROVAL", text: bankMessage("NEEDS_FAMILY_APPROVAL") + " (mock response)" })
      }
    />
  );
}
