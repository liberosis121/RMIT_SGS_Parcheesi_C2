"use client";
import { usePathname } from "next/navigation";
import { useMe } from "@/lib/useMe";
import { NavBar, type NavUser } from "./ui/NavBar";
import { ProfileOnboarding } from "./ProfileOnboarding";
import { TC_URL, REALM } from "@/lib/config";

/** Real (logged-in) shell: nav bar with the Tide user, plus the display-name onboarding modal. */
export function Shell({ children }: { children: React.ReactNode }) {
  const { tc, persona, authenticated, loading } = useMe();
  const path = usePathname();
  const given = authenticated ? (tc.getValueFromToken?.("given_name") as string | undefined) : undefined;
  const user: NavUser | null = authenticated
    ? {
        name: given || persona?.display || "Unknown user",
        role: persona ? (persona.role === "parent" ? "owner" : "approver") : "unknown",
      }
    : null;
  const active = path?.startsWith("/wallet") ? "wallet" : path?.startsWith("/approvals") ? "approvals" : "home";
  return (
    <>
      <NavBar
        user={user}
        loading={loading}
        active={active}
        showWallet={user?.role === "owner"}
        onSignIn={() => tc.login()}
        onSignOut={() => tc.logout()}
      />
      {children}
      <ProfileOnboarding baseUrl={TC_URL} realm={REALM} />
    </>
  );
}
