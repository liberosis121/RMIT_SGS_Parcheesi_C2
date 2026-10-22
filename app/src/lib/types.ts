export type TxStatus = "PENDING" | "APPROVED" | "EXECUTED" | "DENIED" | "FAILED";

/** App-side description of a transaction. The app server is UNTRUSTED by design: the bank decides. */
export interface Tx {
  txId: string;
  from: string; // account
  to: string; // recipient id
  toAccount: string;
  amount: number;
  nonce: string;
  note?: string;
  status: TxStatus;
  crIds: string[]; // TideCloak change requests that grant the approval role
  revokeCrId?: string;
  requestedBy: string; // display
  requestedAt: string;
  approvedAt?: string;
  executedAt?: string;
  deniedBy?: string;
  approvers?: string[];
  error?: string;
}
