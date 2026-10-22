"use client";

import Link from "next/link";
import { useMe } from "@/lib/useMe";

export default function HomePage() {
  const { tc, persona, authenticated, loading } = useMe();

  return (
    <>
      <h1>Khiên Nhà – ví hai chìa cho gia đình</h1>
      <div className="card">
        <p className="big">Khoản chuyển lớn của bố mẹ chỉ đi được khi có thêm một người con duyệt.</p>
        <p>
          Dưới 10 triệu: bà Lan tự chuyển. Từ 10 triệu trở lên: cần bà Lan và ít nhất một người con (Thảo hoặc Minh)
          cùng duyệt. Lượt duyệt được ký qua mạng Tide; server và cơ sở dữ liệu của app này không giả được lượt duyệt đó.
        </p>
        <p className="note">Đây là bản demo với dữ liệu giả. Ngân hàng (MockBank) là dịch vụ riêng, tự kiểm tra chữ ký Tide.</p>
      </div>

      {loading ? (
        <p>Đang tải…</p>
      ) : !authenticated ? (
        <div className="card">
          <p>Hãy đăng nhập bằng tài khoản Tide của bạn.</p>
          <button onClick={() => tc.login()}>Đăng nhập bằng Tide</button>
        </div>
      ) : (
        <div className="card">
          <p>
            Xin chào <strong>{persona?.display ?? "bạn"}</strong>.
            {!persona && <span className="err"> Tài khoản này chưa có trong danh sách gia đình của demo.</span>}
          </p>
          <div className="row">
            {persona?.role === "parent" && (
              <Link href="/wallet">
                <button>Mở ví</button>
              </Link>
            )}
            <Link href="/approvals">
              <button className="secondary">Duyệt giao dịch</button>
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
