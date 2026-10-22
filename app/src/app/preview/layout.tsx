"use client";
import { usePathname } from "next/navigation";
import { NavBar, type NavUser } from "@/components/ui/NavBar";

// Preview pages: NO TideCloak provider here on purpose. Nothing below calls Tide or the bank.
export default function PreviewLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname() ?? "";
  const onApprovals = path.startsWith("/preview/approvals");
  const onWallet = path.startsWith("/preview/wallet");
  const user: NavUser | null = onApprovals
    ? { name: "Thao", role: "approver" }
    : onWallet
      ? { name: "Mom (Lan)", role: "owner" }
      : null;
  return (
    <>
      <div className="preview-banner">
        <b>UI preview</b> · mock data · not connected to Tide
      </div>
      <NavBar
        user={user}
        base="/preview"
        active={onApprovals ? "approvals" : onWallet ? "wallet" : "home"}
        showWallet={onWallet}
        onSignIn={() => { window.location.href = "/preview/wallet"; }}
        onSignOut={() => { window.location.href = "/preview"; }}
      />
      {children}
    </>
  );
}
