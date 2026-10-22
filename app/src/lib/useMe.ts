"use client";
import { useMemo } from "react";
import { useTideCloak } from "@tidecloak/nextjs";
import { personaFor, BANK_URL } from "./config";
import type { Ctx } from "./iga";
import type { Tx } from "./types";

export function useMe() {
  const tc = useTideCloak() as any;
  const sub: string | undefined = tc.authenticated ? tc.getValueFromToken?.("sub") : undefined;
  const persona = personaFor(sub);
  const ctx: Ctx = useMemo(
    () => ({
      secureFetch: (u: string, i?: RequestInit) => tc.secureFetch(u, i),
      approveTideRequests: (r: any) => tc.approveTideRequests(r),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tc.secureFetch, tc.approveTideRequests]
  );
  return { tc, sub, persona, ctx, authenticated: !!tc.authenticated, loading: !!tc.isInitializing };
}

const J = { "Content-Type": "application/json" };

export function txApi(ctx: Ctx) {
  return {
    async list(): Promise<Tx[]> {
      const r = await ctx.secureFetch("/api/tx");
      return r.ok ? ((await r.json()) as Tx[]) : [];
    },
    async add(tx: Tx) {
      await ctx.secureFetch("/api/tx", { method: "POST", headers: J, body: JSON.stringify(tx) });
    },
    async patch(txId: string, patch: Partial<Tx>) {
      await ctx.secureFetch("/api/tx", { method: "PATCH", headers: J, body: JSON.stringify({ txId, patch }) });
    },
  };
}

export async function bankTransfer(
  ctx: Ctx,
  tx: Pick<Tx, "txId" | "from" | "toAccount" | "amount" | "nonce">
): Promise<{ status: number; body: any }> {
  const r = await ctx.secureFetch(`${BANK_URL}/transfer`, {
    method: "POST",
    headers: J,
    body: JSON.stringify({ txId: tx.txId, from: tx.from, to: tx.toAccount, amount: tx.amount, nonce: tx.nonce }),
  });
  let body: any = null;
  try {
    body = await r.json();
  } catch {}
  return { status: r.status, body };
}

export async function bankLedger() {
  const r = await fetch(`${BANK_URL}/ledger`);
  return r.json();
}
