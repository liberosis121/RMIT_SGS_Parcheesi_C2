"use client";
import Link from "next/link";
import { LandingView } from "@/components/views/LandingView";

function PreviewIndex() {
  return (
    <div className="container" style={{ paddingTop: 24 }}>
      <div className="card card-flat row between">
        <div>
          <strong>Design preview</strong>
          <div className="muted small">Same components as the real pages, filled with mock data.</div>
        </div>
        <div className="row">
          <Link className="btn btn-ghost" href="/preview/wallet">Wallet (Mom)</Link>
          <Link className="btn btn-ghost" href="/preview/approvals">Approvals (Thao)</Link>
        </div>
      </div>
    </div>
  );
}

export default function PreviewHome() {
  return (
    <>
      <PreviewIndex />
      <LandingView user={null} base="/preview" onSignIn={() => {}} onSignOut={() => {}} />
    </>
  );
}
