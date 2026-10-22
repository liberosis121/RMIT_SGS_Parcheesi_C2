"use client";
import { useRouter } from "next/navigation";
import { LandingView } from "@/components/views/LandingView";
import { useSim, hasRole } from "@/lib/sim/client";
import type { NavUser } from "@/components/ui/NavBar";

export default function SimHome() {
  const { claims, ready, signOut } = useSim();
  const router = useRouter();
  const user: NavUser | null = claims
    ? { name: claims.name, role: hasRole(claims, "owner") ? "owner" : "approver" }
    : null;
  return (
    <LandingView
      user={user}
      loading={!ready}
      base="/sim"
      onSignIn={() => router.push("/sim/signin")}
      onSignOut={() => {
        signOut();
      }}
    />
  );
}
