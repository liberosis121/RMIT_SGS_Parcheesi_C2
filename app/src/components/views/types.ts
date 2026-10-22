export interface RecipientV {
  id: string;
  name: string;
  account: string;
}
export type TransferStatus = "waiting" | "approved" | "completed" | "denied" | "blocked";
export interface TransferV {
  txId: string;
  toId: string;
  toName: string;
  toAccount: string;
  amount: number;
  note?: string;
  requestedAt: string;
  requestedBy: string;
  status: TransferStatus;
  approvals: number;
  threshold: number;
  approvers: string[];
  approvedAt?: string;
  canLock?: boolean;
  lockRequested?: boolean;
}
export interface RequestV {
  id: string; // key for handlers (tx id or CR id)
  kind: "transfer" | "lock";
  amount?: number;
  toName?: string;
  toAccount?: string;
  note?: string;
  requestedBy: string;
  requestedAt: string;
  isNewRecipient?: boolean;
  approvals: number | null;
  threshold: number | null;
  approvers: string[];
}
export interface AdminChangeV {
  id: string;
  label: string;
  approvals: number | null;
  threshold: number | null;
  approvers: string[];
}
export interface HistoryV {
  id: string;
  title: string;
  status: "approved" | "denied";
  approvers: string[];
  when?: string;
}
export interface Notice {
  ok: boolean;
  text: string;
}
