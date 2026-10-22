"use client";
import { useState } from "react";
import { ApprovalsView } from "@/components/views/ApprovalsView";
import type { Notice, RequestV, HistoryV } from "@/components/views/types";
import { MOCK_REQUESTS, MOCK_ADMIN, MOCK_HISTORY } from "@/lib/mock";
import { money } from "@/lib/format";

// Mock-data approvals: interactive locally, never calls Tide.
export default function PreviewApprovals() {
  const [requests, setRequests] = useState<RequestV[]>(MOCK_REQUESTS);
  const [history, setHistory] = useState<HistoryV[]>(MOCK_HISTORY);
  const [notice, setNotice] = useState<Notice | null>(null);

  const flash = (n: Notice) => {
    setNotice(n);
    setTimeout(() => setNotice(null), 4000);
  };
  const decide = (id: string, status: "approved" | "denied") => {
    const r = requests.find((x) => x.id === id);
    if (!r) return;
    setRequests(requests.filter((x) => x.id !== id));
    setHistory([
      { id: "d" + id, title: `${money(r.amount ?? 0)} to ${r.toName}`, status, approvers: status === "approved" ? ["Thao", ...r.approvers] : [], when: new Date().toISOString() },
      ...history,
    ]);
    flash({ ok: status === "approved", text: status === "approved" ? "Approved (mock)." : "Denied (mock). The transfer will not go through." });
  };

  return (
    <ApprovalsView
      requests={requests}
      adminChanges={MOCK_ADMIN}
      history={history}
      busyId={null}
      notice={notice}
      onApprove={(id) => decide(id, "approved")}
      onDeny={(id) => decide(id, "denied")}
    />
  );
}
