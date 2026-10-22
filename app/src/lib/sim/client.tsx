"use client";
// Client side of "Simulated TideCloak". The token lives in sessionStorage (per browser tab), so every tab can be a different person.
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const KEY = "sim.token";

export interface SimClaims {
  sub: string;
  preferred_username: string;
  name: string;
  azp?: string;
  aud?: string[] | string;
  iss?: string;
  exp?: number;
  iat?: number;
  realm_access?: { roles: string[] };
  resource_access?: Record<string, { roles: string[] }>;
}

export function decodeClaims(token: string | null): SimClaims | null {
  if (!token) return null;
  try {
    const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(decodeURIComponent(escape(atob(payload)))) as SimClaims;
  } catch {
    return null;
  }
}

export const realmRoles = (c: SimClaims | null) => c?.realm_access?.roles ?? [];
export const hasRole = (c: SimClaims | null, r: string) => realmRoles(c).includes(r);

interface Ctx {
  ready: boolean;
  token: string | null;
  claims: SimClaims | null;
  signIn: (username: string, password: string) => Promise<string | null>; // returns error message or null
  signOut: () => void;
  refresh: () => Promise<boolean>;
  /** fetch with the current token as Bearer */
  call: (path: string, init?: RequestInit) => Promise<Response>;
}

const SimCtx = createContext<Ctx | null>(null);

export function SimProvider({ children }: { children: React.ReactNode }) {
  const [token, setTokenState] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      setTokenState(sessionStorage.getItem(KEY));
    } catch {}
    setReady(true);
  }, []);

  const setToken = useCallback((t: string | null) => {
    setTokenState(t);
    try {
      if (t) sessionStorage.setItem(KEY, t);
      else sessionStorage.removeItem(KEY);
    } catch {}
  }, []);

  const signIn = useCallback(
    async (username: string, password: string) => {
      const r = await fetch("/api/sim/token", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, password }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) return (j as any).error ?? "Sign-in failed";
      setToken((j as any).token);
      return null;
    },
    [setToken]
  );

  const call = useCallback(
    (path: string, init: RequestInit = {}) => {
      const headers = new Headers(init.headers);
      if (token) headers.set("Authorization", `Bearer ${token}`);
      if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
      return fetch(path, { ...init, headers });
    },
    [token]
  );

  const refresh = useCallback(async () => {
    const r = await call("/api/sim/token/refresh", { method: "POST" });
    if (!r.ok) return false;
    setToken(((await r.json()) as any).token);
    return true;
  }, [call, setToken]);

  const value = useMemo<Ctx>(
    () => ({ ready, token, claims: decodeClaims(token), signIn, signOut: () => setToken(null), refresh, call }),
    [ready, token, signIn, setToken, refresh, call]
  );
  return <SimCtx.Provider value={value}>{children}</SimCtx.Provider>;
}

export function useSim() {
  const v = useContext(SimCtx);
  if (!v) throw new Error("useSim outside SimProvider");
  return v;
}

/** Raw call to the simulated bank with an arbitrary token (attack demo). */
export async function bankWithToken(token: string | null, body: object) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const r = await fetch("/api/sim/bank/transfer", { method: "POST", headers, body: JSON.stringify(body) });
  let j: any = null;
  try {
    j = await r.json();
  } catch {}
  return { status: r.status, body: j };
}
