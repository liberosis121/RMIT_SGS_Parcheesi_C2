"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useSim } from "@/lib/sim/client";

export default function SimSignIn() {
  const { signIn } = useSim();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const m = await signIn(username, password);
    setBusy(false);
    if (m) setErr(m);
    else {
      const next = username.trim().toLowerCase() === "mom" ? "/sim/wallet" : "/sim/approvals";
      router.push(next);
    }
  }

  return (
    <main className="container page" style={{ display: "grid", placeItems: "center" }}>
      <form className="card" style={{ width: "min(26rem, 100%)", marginTop: 24 }} onSubmit={submit}>
        <div className="row" style={{ justifyContent: "center", gap: 10 }}>
          <Image src="/logo.svg" alt="" width={28} height={28} />
          <strong style={{ color: "var(--navy)", fontSize: "1.1rem" }}>Tide</strong>
          <span className="badge" style={{ background: "var(--amber-tint)", color: "var(--amber)" }}>simulated</span>
        </div>
        <h2 style={{ textAlign: "center", marginTop: 14 }}>Sign in to KinKey</h2>
        <p className="muted small" style={{ textAlign: "center", marginTop: 4 }}>You are signing in through a simulated Tide sign-in.</p>
        <label className="field" htmlFor="u">Username</label>
        <input id="u" className="input" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" autoFocus />
        <label className="field" htmlFor="p">Password</label>
        <input id="p" className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
        {err && <p className="small" role="alert" style={{ color: "var(--red)", marginTop: 12 }}>{err}</p>}
        <div style={{ marginTop: 20 }}>
          <button className="btn btn-primary btn-lg btn-block" disabled={busy || !username || !password}>
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </div>
        <p className="small muted" style={{ marginTop: 16, textAlign: "center" }}>
          Demo accounts: <strong>mom</strong>, <strong>thao</strong>, <strong>minh</strong> · password: <strong>demo</strong>
        </p>
      </form>
    </main>
  );
}
