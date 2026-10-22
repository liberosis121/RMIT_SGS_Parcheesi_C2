// Simulated realm state (users, IGA change requests, role grants) + simulated bank ledger.
// Persisted to app/data/sim-state.json (gitignored) so several browser tabs share one world.
import fs from "node:fs";
import path from "node:path";
import seed from "../../../seed/seed.json";
import type { Tx } from "../types";

const FILE = path.join(process.cwd(), "data", "sim-state.json");

export const BIG_ROLE = "chuyen-khoan-lon";
export const BANK_CLIENT = "mock-bank";
export const APP_CLIENT = "khien-nha-app";
export const THRESHOLD_VND: number = seed.threshold_vnd;
/** max(1, floor(0.7 x admins)) with 3 admins */
export const QUORUM = Math.max(1, Math.floor(0.7 * 3));

export interface SimUser {
  username: string;
  sub: string;
  name: string;
  role: "owner" | "approver";
}
export const SIM_USERS: Record<string, SimUser> = {
  mom: { username: "mom", sub: "sim-mom", name: "Mom (Lan)", role: "owner" },
  thao: { username: "thao", sub: "sim-thao", name: "Thao", role: "approver" },
  minh: { username: "minh", sub: "sim-minh", name: "Minh", role: "approver" },
};
export const ADMINS = Object.keys(SIM_USERS); // all three are realm admins

export interface SimCr {
  id: string;
  actionType: "GRANT_ROLE";
  role: string;
  target: string; // username receiving the role
  txId: string;
  amount: number;
  toName: string;
  toAccount: string;
  requestedBy: string; // username
  createdAt: string;
  status: "PENDING" | "COMMITTED" | "DENIED";
  authorizers: { username: string; name: string; at: string }[];
  threshold: number;
  deniedBy?: string;
}

export interface LedgerEntry {
  txId: string;
  from: string;
  to: string;
  amount: number;
  at: string;
  note?: string;
  viaRole?: string;
}

export interface SimState {
  crs: SimCr[];
  txs: Tx[];
  grants: Record<string, string[]>; // username -> mock-bank roles
  ledger: { balance: number; executed: LedgerEntry[]; used: string[]; consumed: boolean };
}

function fresh(): SimState {
  return {
    crs: [],
    txs: [],
    grants: { mom: [], thao: [], minh: [] },
    ledger: {
      balance: seed.owner.balance,
      executed: (seed.history as any[]).map((h) => ({
        txId: h.id,
        from: seed.owner.account,
        to: seed.recipients.find((r: any) => r.id === h.to)?.account ?? h.to,
        amount: h.amount,
        at: h.at,
        note: h.note,
      })),
      used: [],
      consumed: false,
    },
  };
}

export function loadState(): SimState {
  try {
    return JSON.parse(fs.readFileSync(FILE, "utf8")) as SimState;
  } catch {
    const s = fresh();
    saveState(s);
    return s;
  }
}
export function saveState(s: SimState) {
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(s, null, 2));
}
export function resetState() {
  const s = fresh();
  saveState(s);
  return s;
}
export const OWNER_ACCOUNT: string = seed.owner.account;
export { seed };
