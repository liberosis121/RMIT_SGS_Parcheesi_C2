"use client";

import { useMe } from "@/lib/useMe";
import { LandingView } from "@/components/views/LandingView";
import type { NavUser } from "@/components/ui/NavBar";

export default function HomePage() {
  const { tc, persona, authenticated, loading } = useMe();
  const user: NavUser | null = authenticated
    ? { name: persona?.display ?? "Unknown user", role: persona ? (persona.role === "parent" ? "owner" : "approver") : "unknown" }
    : null;
  return (
    <LandingView
      user={user}
      loading={loading}
      onSignIn={() => tc.login()}
      onSignOut={() => tc.logout()}
      message={authenticated && !persona ? "This account is not part of the demo family." : undefined}
    />
  );
}
