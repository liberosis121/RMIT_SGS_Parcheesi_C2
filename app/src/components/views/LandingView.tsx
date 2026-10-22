"use client";
import Link from "next/link";
import type { NavUser } from "../ui/NavBar";
import { IconShield } from "../ui/Icons";
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
            <p className="eyebrow">For families with parents who bank on their phone</p>
            <h1 style={{ marginTop: 14 }}>
              Two keys for <em>every big transfer.</em>
            </h1>
            <p className="lead">
              Mom keeps paying for groceries and bills on her own. Anything big waits until a son or daughter she chose turns
              the second key.
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
              <IconShield /> <span>Approvals are signed by the Tide network, so not even our own servers can fake one.</span>
            </p>
          </div>

          <div className="slip" aria-label="Example transfer on hold">
            <div className="slip-head">
              <span className="eyebrow">Transfer on hold · #0419</span>
            </div>
            <span className="stamp">
              Waiting for
              <br />
              second key
            </span>
            <dl>
              <dt>Amount</dt>
              <dd className="slip-amount">{money(200000000)}</dd>
              <dt>To</dt>
              <dd>
                Captain Hung
                <div className="muted small">&ldquo;Police holding account&rdquo;</div>
              </dd>
              <dt>Account</dt>
              <dd className="mono">9704 9998 8877 7</dd>
            </dl>
            <div className="keys">
              <div className="key-row">
                <span>Key 1 · Mom (Lan)</span>
                <span className="ok">Turned</span>
              </div>
              <div className="key-row">
                <span>Key 2 · Thao or Minh</span>
                <span className="wait">Not yet</span>
              </div>
            </div>
          </div>
        </section>

        <section className="band">
          <div className="band-head">
            <h2>How it works</h2>
            <span className="muted small">Threshold: {money(10000000)}</span>
          </div>
          <div className="steps">
            <div className="step">
              <div className="step-num">01</div>
              <h3>Small payments just go</h3>
              <p>Groceries, bills, a gift for a grandchild. Anything under {money(10000000)} is sent at once.</p>
            </div>
            <div className="step">
              <div className="step-num">02</div>
              <h3>Big ones wait for family</h3>
              <p>A larger transfer is held until one of the children she picked looks at it and approves.</p>
            </div>
            <div className="step">
              <div className="step-num">03</div>
              <h3>Nobody can skip the line</h3>
              <p>Not a scammer on the phone, not a stolen phone, not a developer with access to our servers.</p>
            </div>
          </div>
        </section>

        <section className="band">
          <div className="fact">
            <div className="big">US$744M</div>
            <div>
              <p>
                (about ₫18.9 trillion) lost by people in Vietnam to online scams in 2024. Most scams don&apos;t break a password. They talk the real
                owner into pressing &ldquo;send&rdquo;.
              </p>
              <p className="src">Source: National Cybersecurity Association (NCA), 2024 survey</p>
            </div>
          </div>
        </section>
      </main>
      <footer className="footer container">
        <span>KinKey · prototype with synthetic data · secured by TideCloak</span>
        <span>RMIT Hackathon 2026 · Team Parcheesi</span>
      </footer>
    </>
  );
}
