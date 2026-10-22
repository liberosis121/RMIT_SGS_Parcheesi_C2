import type { RecipientV, TransferV, RequestV, AdminChangeV, HistoryV } from "@/components/views/types";

const ago = (min: number) => new Date(Date.now() - min * 60000).toISOString();

export const MOCK_RECIPIENTS: RecipientV[] = [
  { id: "bin", name: "Bin – grandson's tuition", account: "9704000111222" },
  { id: "cho", name: "Ben Thanh Market – groceries", account: "9704000333444" },
  { id: "hung", name: "Captain Hung – 'police holding account'", account: "9704999888777" },
];

export const MOCK_TRANSFERS: TransferV[] = [
  {
    txId: "m1", toId: "hung", toName: "Captain Hung – 'police holding account'", toAccount: "9704999888777", amount: 200000000,
    requestedAt: ago(4), requestedBy: "Mom (Lan)", status: "waiting", approvals: 1, threshold: 2, approvers: ["Thao"],
  },
  {
    txId: "m2", toId: "bin", toName: "Bin – grandson's tuition", toAccount: "9704000111222", amount: 30000000, note: "Semester 1 tuition",
    requestedAt: ago(60 * 26), requestedBy: "Mom (Lan)", status: "completed", approvals: 2, threshold: 2, approvers: ["Thao", "Mom (Lan)"], canLock: true,
  },
  {
    txId: "m3", toId: "cho", toName: "Ben Thanh Market – groceries", toAccount: "9704000333444", amount: 900000, note: "Groceries",
    requestedAt: ago(60 * 24 * 4), requestedBy: "Mom (Lan)", status: "completed", approvals: 0, threshold: 2, approvers: [],
  },
  {
    txId: "m4", toId: "hung", toName: "Captain Hung – 'police holding account'", toAccount: "9704999888777", amount: 150000000,
    requestedAt: ago(60 * 48), requestedBy: "Mom (Lan)", status: "denied", approvals: 0, threshold: 2, approvers: [],
  },
];

export const MOCK_REQUESTS: RequestV[] = [
  {
    id: "r1", kind: "transfer", amount: 200000000, toName: "Captain Hung – 'police holding account'", toAccount: "9704999888777",
    requestedBy: "Mom (Lan)", requestedAt: ago(4), isNewRecipient: true, approvals: 1, threshold: 2, approvers: ["Minh"],
  },
  {
    id: "r2", kind: "transfer", amount: 30000000, toName: "Bin – grandson's tuition", toAccount: "9704000111222", note: "Semester 2 tuition",
    requestedBy: "Mom (Lan)", requestedAt: ago(35), isNewRecipient: false, approvals: 0, threshold: 2, approvers: [],
  },
];

export const MOCK_ADMIN: AdminChangeV[] = [
  { id: "a1", label: "Grant: realm admin to Minh", approvals: 1, threshold: 2, approvers: ["Mom (Lan)"] },
];

export const MOCK_HISTORY: HistoryV[] = [
  { id: "h1", title: "₫30,000,000 to Bin – grandson's tuition", status: "approved", approvers: ["Thao", "Mom (Lan)"], when: ago(60 * 26) },
  { id: "h2", title: "₫150,000,000 to Captain Hung – 'police holding account'", status: "denied", approvers: [], when: ago(60 * 48) },
];
