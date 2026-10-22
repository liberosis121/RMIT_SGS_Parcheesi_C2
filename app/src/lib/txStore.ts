import fs from "node:fs";
import path from "node:path";
import type { Tx } from "./types";

// A JSON file. Deliberately dumb and UNTRUSTED: nothing in here can approve or execute a transfer.
// Dev with root can edit it freely - MockBank still refuses without a Tide-signed role in the token.
const FILE = path.join(process.cwd(), "data", "tx-store.json");

function readAll(): Tx[] {
  try {
    return JSON.parse(fs.readFileSync(FILE, "utf8")) as Tx[];
  } catch {
    return [];
  }
}
function writeAll(list: Tx[]) {
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(list, null, 2));
}

export function listTx(): Tx[] {
  return readAll().sort((a, b) => b.requestedAt.localeCompare(a.requestedAt));
}
export function addTx(tx: Tx) {
  const all = readAll();
  all.push(tx);
  writeAll(all);
  return tx;
}
export function patchTx(txId: string, patch: Partial<Tx>) {
  const all = readAll();
  const i = all.findIndex((t) => t.txId === txId);
  if (i < 0) return null;
  all[i] = { ...all[i], ...patch };
  writeAll(all);
  return all[i];
}
