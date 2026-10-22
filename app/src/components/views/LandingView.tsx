"use client";
import Link from "next/link";
import type { NavUser } from "../ui/NavBar";
import { IconShield, IconUser, IconKey, IconLock, IconAlert } from "../ui/Icons";
import { Pill } from "../ui/Pill";
import { money } from "@/lib/format";

export function LandingView(props: {
  user: NavUser | null;
  loading?: boolean;
  onSignIn: () => void;
  onSignOut: () => void;
  base?: string;
  message?: string;
}) {
  const { user, base = "" } = props;
  return (
    <>
      <main className="container">
        <section className="hero">
          <div>
            <h1>
              Two keys for <em>every big transfer.</em>
            </h1>
            <p className="lead">
              Parents stay in control of everyday money. Big transfers wait for a second key from someone they trust.
            </p>
            {user ? (
              <div className="row">
                {user.role === "owner" && (
                  <Link className="btn btn-primary btn-lg" href={`${base}/wallet`}>
                    Open wallet
                  </Link>
                )}
                <Link className="btn btn-ghost btn-lg" href={`${base}/approvals`}>
                  Review approvals
                </Link>
              </div>
            ) : (
              <button className="btn btn-primary btn-lg" onClick={props.onSignIn}>
                Sign in with Tide
              </button>
            )}
            {props.message && (
              <p className="small" style={{ color: "var(--red)", marginTop: 12 }}>
                {props.message}
              </p>
            )}
            <p className="trust">
              <IconShield /> <span>Approvals are signed by the Tide network. Our own servers can&apos;t fake them.</span>
            </p>
          </div>
          <div className="card" aria-label="Example pending transfer">
            <div className="row between">
              <span className="muted small">Transfer request</span>
              <Pill kind="waiting" />
            </div>
            <div className="amount-big" style={{ marginTop: 8 }}>
              {money(200000000)}
            </div>
            <div className="muted">
              to <strong style={{ color: "var(--text)" }}>Captain Hung</strong> · &quot;police holding account&quot;
            </div>
            <div className="warn-banner">
              <IconAlert /> <span>First transfer to this account. Call Mom before approving.</span>
            </div>
            <div className="row between">
              <div className="dots">
                <span className="adot on" />
                <span className="adot" />
                <span className="small muted" style={{ marginLeft: 6 }}>
                  1 of 2 approvals
                </span>
              </div>
              <span className="small muted">Thao approved</span>
            </div>
          </div>
        </section>

        <h2 className="section-title">How it works</h2>
        <section className="steps">
          <div className="card">
            <div className="step-num">
              <IconUser />
            </div>
            <h3>Everyday spending stays simple</h3>
            <p className="muted" style={{ marginTop: 6 }}>
              Anything under {money(10000000)} goes straight through. No waiting, no extra steps.
            </p>
          </div>
          <div className="card">
            <div className="step-num">
              <IconKey />
            </div>
            <h3>Big transfers need a second key</h3>
            <p className="muted" style={{ marginTop: 6 }}>
              A transfer of {money(10000000)} or more is held until a child you chose approves it.
            </p>
          </div>
          <div className="card">
            <div className="step-num">
              <IconLock />
            </div>
            <h3>No one can skip the rule</h3>
            <p className="muted" style={{ marginTop: 6 }}>
              Not a scammer on the phone, not a stolen phone, not even our own server.
            </p>
          </div>
        </section>
      </main>
      <footer className="footer container">
        Prototype with synthetic data · Secured by TideCloak · RMIT Hackathon 2026, Team Parcheesi
      </footer>
    </>
  );
}
