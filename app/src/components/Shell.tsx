"use client";
import Link from "next/link";
import { useMe } from "@/lib/useMe";
import { ProfileOnboarding } from "./ProfileOnboarding";
import { TC_URL, REALM } from "@/lib/config";

export function Shell({ children }: { children: React.ReactNode }) {
  const { tc, persona, authenticated, loading } = useMe();
  const given = authenticated ? (tc.getValueFromToken?.("given_name") as string | undefined) : undefined;
  const name = given || persona?.display || "";
  return (
    <>
      <header className="top">
        <strong>🛡️ Khiên Nhà</strong>
        <Link href="/">Trang chủ</Link>
        {authenticated && persona?.role === "parent" && <Link href="/wallet">Ví</Link>}
        {authenticated && <Link href="/approvals">Duyệt giao dịch</Link>}
        <span className="who">
          {loading ? (
            "Đang tải…"
          ) : authenticated ? (
            <>
              <span>
                {name || "(chưa nhận diện)"} ·{" "}
                {persona ? (persona.role === "parent" ? "chủ tài khoản" : "người duyệt") : "tài khoản lạ"}
              </span>
              <button className="secondary" onClick={() => tc.logout()}>
                Đăng xuất
              </button>
            </>
          ) : (
            <button className="secondary" onClick={() => tc.login()}>
              Đăng nhập bằng Tide
            </button>
          )}
        </span>
      </header>
      <main>{children}</main>
      <ProfileOnboarding baseUrl={TC_URL} realm={REALM} />
    </>
  );
}
