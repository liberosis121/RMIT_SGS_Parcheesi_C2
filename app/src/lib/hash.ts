/** Same recipe as MockBank: hash12 = sha256("txId|from|to|amount|nonce") first 12 hex chars. */
export async function txHash12(t: { txId: string; from: string; toAccount: string; amount: number; nonce: string }) {
  const data = new TextEncoder().encode(`${t.txId}|${t.from}|${t.toAccount}|${t.amount}|${t.nonce}`);
  const d = new Uint8Array(await crypto.subtle.digest("SHA-256", data));
  return Array.from(d, (b) => b.toString(16).padStart(2, "0")).join("").slice(0, 12);
}
