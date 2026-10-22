"use client";
import { usePathname, useRouter } from "next/navigation";
import { SimProvider, useSim, hasRole } from "@/lib/sim/client";
import { NavBar, type NavUser } from "@/components/ui/NavBar";

function SimShell({ children }: { children: React.ReactNode }) {
  const { claims, ready, signOut } = useSim();
  const path = usePathname() ?? "";
  const router = useRouter();
  const user: NavUser | null = claims
    ? { name: claims.name, role: hasRole(claims, "owner") ? "owner" : hasRole(claims, "approver") ? "approver" : "unknown" }
    : null;
  const active = path.startsWith("/sim/wallet") ? "wallet" : path.startsWith("/sim/approvals") ? "approvals" : "home";
  return (
    <>
      <div className="preview-banner" style={{ background: "#7c3a05", color: "#fde68a" }}>
        <b style={{ color: "#fff" }}>Simulated TideCloak</b> · sign-in, roles and quorum approvals are simulated because the Tide network was
        overloaded during the hackathon. Real TideCloak integration: <a href="/wallet" style={{ color: "#fff" }}>/wallet</a>,{" "}
        <a href="/approvals" style={{ color: "#fff" }}>/approvals</a>.
      </div>
      <NavBar
        user={user}
        loading={!ready}
        base="/sim"
        active={active}
        showWallet={user?.role === "owner"}
        extra={<span className="badge" style={{ background: "var(--amber-tint)", color: "var(--amber)" }}>Simulated TideCloak</span>}
        onSignIn={() => router.push("/sim/signin")}
        onSignOut={() => {
          signOut();
          router.push("/sim/signin");
        }}
      />
      {children}
    </>
  );
}

export default function SimLayout({ children }: { children: React.ReactNode }) {
  return (
    <SimProvider>
      <SimShell>{children}</SimShell>
    </SimProvider>
  );
}
