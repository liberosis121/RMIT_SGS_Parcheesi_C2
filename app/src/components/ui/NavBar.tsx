import Link from "next/link";
import Image from "next/image";

export interface NavUser {
  name: string;
  role: "owner" | "approver" | "unknown";
}

export function NavBar(props: {
  user: NavUser | null;
  active?: "wallet" | "approvals" | "home";
  base?: string; // "" for real pages, "/preview" for preview pages
  showWallet?: boolean;
  onSignIn?: () => void;
  onSignOut?: () => void;
  loading?: boolean;
}) {
  const { user, active, base = "", showWallet = true } = props;
  return (
    <nav className="nav">
      <div className="container">
        <Link href={base || "/"} className="brand" aria-label="KinKey home">
          <Image src="/logo.svg" alt="" width={32} height={32} priority />
          <span><span className="kin">Kin</span><span className="key">Key</span></span>
        </Link>
        {user && (
          <div className="nav-links">
            {showWallet && <Link href={`${base}/wallet`} className={active === "wallet" ? "active" : ""}>Wallet</Link>}
            <Link href={`${base}/approvals`} className={active === "approvals" ? "active" : ""}>Approvals</Link>
          </div>
        )}
        <div className="nav-right">
          {props.loading ? (
            <span className="muted small">Loading…</span>
          ) : user ? (
            <>
              <div className="chip">
                <span className="avatar">{user.name.charAt(0).toUpperCase()}</span>
                <span>
                  <div className="name">{user.name}</div>
                  <div className="role">{user.role === "owner" ? "Account owner" : user.role === "approver" ? "Family approver" : "Unknown account"}</div>
                </span>
              </div>
              <button className="btn btn-ghost" onClick={props.onSignOut}>Sign out</button>
            </>
          ) : (
            <button className="btn btn-primary" onClick={props.onSignIn}>Sign in with Tide</button>
          )}
        </div>
      </div>
    </nav>
  );
}
