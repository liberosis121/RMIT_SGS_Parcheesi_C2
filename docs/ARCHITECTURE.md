# Khiên Nhà – Tài liệu kỹ thuật (cho thành viên nhóm)

> Cập nhật: 22/10/2026, khoảng 13:50. Trạng thái: **code xong khoảng 80%, chưa test được luồng có đăng nhập**, vì đang kẹt bước tạo tài khoản Tide (lỗi mạng Tide/4G, xem mục 7).

---

## 1. App làm gì (1 phút)

**Khiên Nhà = "ví hai chìa" cho gia đình.**
- **Bà Lan** (mẹ) chuyển **dưới 10 triệu**: đi ngay.
- Chuyển **từ 10 triệu trở lên**: giao dịch **bị giữ lại**, phải có **Bà Lan + ít nhất 1 người con (Thảo hoặc Minh)** duyệt.
- **Điểm ăn tiền:** quyền duyệt do **TideCloak + mạng Tide** giữ, không phải server của mình. Nhóm mình có root server, sửa database thành "đã duyệt" cũng **không qua được ngân hàng**.

---

## 2. Kiến trúc: 3 phần chạy trên laptop

```
          Trình duyệt (3 cửa sổ riêng: Bà Lan / Thảo / Minh)
           │                    │                         │
           │ (1) đăng nhập      │ (2) xem trang           │ (3) chuyển tiền
           │     + DUYỆT        │                         │     kèm token
           ▼                    ▼                         ▼
 ┌────────────────────┐  ┌────────────────────┐  ┌────────────────────┐
 │ TideCloak  :8080   │  │ Khiên Nhà app :3000│  │ MockBank     :4000 │
 │ (Docker)           │  │ Next.js (frontend  │  │ Express (backend   │
 │ realm khien-nha    │  │ + API nhỏ lưu giao │  │ "ngân hàng giả")   │
 │ bật IGA (quorum)   │  │ dịch chờ)          │  │ kiểm token Tide    │
 └─────────┬──────────┘  └────────────────────┘  └────────────────────┘
           │ ký token phân tán
           ▼
   Mạng Tide (20 máy ORK trên internet), không ai giữ trọn khoá
```

| Thành phần | Cổng | Công nghệ | Vai trò | Có được tin không? |
|---|---|---|---|---|
| **TideCloak** | `http://localhost:8080` | Docker image `tideorg/tidecloak-dev` | Đăng nhập, giữ **luật duyệt nhiều người** (IGA/quorum), cấp token do mạng Tide ký | Tin **mạng Tide**, không tin riêng 1 máy |
| **App Khiên Nhà** | `http://localhost:3000` | Next.js 16 + React, TypeScript, SDK `@tidecloak/nextjs` | Giao diện Ví + Duyệt; lưu danh sách giao dịch chờ | **Không tin** (cố ý: server app có thể bị hack) |
| **MockBank** | `http://localhost:4000` | Node + Express, TypeScript, `jose` | Thực hiện chuyển tiền **chỉ khi token Tide hợp lệ và có quyền** | Đóng vai **ngân hàng thật** (bên kiểm độc lập) |

**Quy tắc bảo mật quan trọng nhất:** nút **Duyệt** gọi **thẳng từ trình duyệt lên TideCloak** bằng token của chính người duyệt, **không đi qua server app**. Đi qua server thì mọi lượt duyệt bị tính cho một tài khoản server, vừa sai vừa phá ý tưởng.

---

## 3. Luồng hoạt động

### 3.1. Chuyển < 10 triệu (ví dụ 2 triệu tiền chợ)
1. Bà Lan đăng nhập, vào **Ví**, chọn người nhận, nhập số tiền.
2. Trình duyệt gửi `POST /transfer` lên **MockBank** kèm token Tide của Bà Lan.
3. MockBank kiểm chữ ký token (bằng khoá công khai của Tide), thấy đúng là chủ tài khoản → **chuyển**.

### 3.2. Chuyển ≥ 10 triệu (ví dụ 200 triệu cho "Đại úy Hùng")
1. Bà Lan bấm chuyển → app lưu giao dịch trạng thái **"Chờ người thân duyệt"**.
2. Trình duyệt Bà Lan gửi lên TideCloak **yêu cầu cấp quyền** `chuyen-khoan-lon` cho chính bà. Đây gọi là **change request (CR)**, sẽ nằm chờ.
3. Thảo / Minh vào trang **Duyệt**: thấy giao dịch + cảnh báo người nhận lạ → bấm **Duyệt** (ký trong cửa sổ Tide) hoặc **Từ chối**.
4. Đủ **2/3 người** (Bà Lan + 1 con) → TideCloak áp dụng thay đổi, quyền xuất hiện trong token của Bà Lan. **Có thể trễ tới 120 giây**, app có đếm ngược và nút làm mới.
5. Bà Lan bấm **"Thực hiện"** → MockBank thấy token có quyền → **chuyển**. Mỗi lượt cấp quyền **chỉ dùng được 1 lần**, sau đó bấm **"Khoá lại quyền"**.

### 3.3. Cảnh tấn công: dev gian lận (demo cảnh 4)
- Dev sửa file dữ liệu của app thành "đã duyệt", rồi gửi token **tự ký bằng khoá riêng** → MockBank trả **401 `INVALID_SIGNATURE`**, vì nó chỉ tin khoá của Tide.
- Gửi token thật của Bà Lan nhưng **chưa được duyệt** → **403 `NEEDS_FAMILY_APPROVAL`**.
- ✅ **Phần này đã chạy thử thành công** (`node scripts/attack-forge.mjs`).

---

## 4. Cấu trúc thư mục

```
challenge2/
├── README.md                 # Bài nộp: mô tả + 5 mục giám khảo chấm (≤300 chữ) + Setup + Limitations
├── .env                      # KHÔNG có trên git: email licence, mật khẩu admin TideCloak (chỉ trên laptop Yến)
├── .mcp.json                 # Kết nối Tide MCP cho Claude Code
├── tools/tide-mcp.sh         # Gọi tài liệu Tide MCP bằng curl
├── infra/                    # Script dựng TideCloak (chạy 1 lần)
│   ├── start-tidecloak.sh    #   chạy Docker TideCloak :8080
│   ├── bootstrap-realm.mjs   #   tạo realm khien-nha, client, role, bật IGA, đăng ký licence
│   ├── create-users.mjs      #   tạo user ba-lan / thao / minh + link mời (lưu ở data/, không lên git)
│   ├── finish-users.mjs      #   SAU khi tạo tài khoản Tide: cấp quyền tide-realm-admin
│   ├── export-adapter.mjs    #   xuất file cấu hình Tide (khoá công khai) cho app + bank
│   └── lib.mjs               #   hàm dùng chung
├── app/                      # FRONTEND + API nhỏ (Next.js) :3000
│   ├── seed/seed.json        #   dữ liệu giả: Bà Lan 850 triệu, 3 người nhận, lịch sử
│   ├── public/               #   file bắt buộc của Tide (silent-check-sso, tide_dpop_auth)
│   └── src/
│       ├── app/page.tsx              # Trang chủ + nút đăng nhập
│       ├── app/wallet/page.tsx       # Trang Ví (Bà Lan)
│       ├── app/approvals/page.tsx    # Trang Duyệt (Thảo, Minh, Bà Lan)
│       ├── app/auth/redirect/        # Trang quay về sau đăng nhập
│       ├── app/api/tx/route.ts       # API lưu / sửa giao dịch chờ (file app/data/tx-store.json)
│       ├── app/api/config/route.ts   # API trả cấu hình công khai
│       ├── components/               # Khung trang, form nhập tên hiển thị
│       └── lib/
│           ├── iga.ts        # Gọi TideCloak từ trình duyệt: tạo/liệt kê/duyệt/từ chối change request
│           ├── txStore.ts    # Lưu giao dịch (JSON, server app, không được tin)
│           ├── config.ts     # Cổng, tên realm, role chuyen-khoan-lon, ánh xạ người dùng
│           └── auth/         # Kiểm token phía server (DPoP)
├── bank/                     # BACKEND "ngân hàng giả" (Express) :4000
│   └── src/server.ts         #   GET /ledger, POST /transfer, (POST /reset nếu ALLOW_RESET=1)
├── scripts/attack-forge.mjs  # Demo: dev giả mạo duyệt → bị từ chối
└── docs/                     # Kế hoạch, proposal, tài liệu này
```

**File không có trên GitHub (gitignore):** `.env`, `data/` (dữ liệu TideCloak, link mời, danh sách user), `app/data/`, `bank/data/` (file cấu hình Tide `tidecloak.json`), `node_modules/`.

---

## 5. API của MockBank

| Method | Đường dẫn | Mô tả | Kết quả |
|---|---|---|---|
| `GET` | `/ledger` | Số dư + lịch sử chuyển | 200 |
| `POST` | `/transfer` | Body `{txId, from, to, amount, nonce}`, header `Authorization` + `DPoP` | 200 thành công |
| | | Token giả / sai chữ ký | **401** `INVALID_SIGNATURE` |
| | | ≥ 10 triệu chưa được duyệt | **403** `NEEDS_FAMILY_APPROVAL` |
| | | Lượt duyệt đã dùng rồi | **403** `APPROVAL_ALREADY_USED` |
| | | `txId` đã chuyển rồi | **409** `TX_ALREADY_USED` |
| | | Không đủ tiền | **422** `INSUFFICIENT_FUNDS` |
| `POST` | `/reset` | Reset sổ cái giữa các lần quay video (chỉ khi chạy với `ALLOW_RESET=1`) | 200 |

---

## 6. Cách chạy (trên laptop của Yến)

Cần có: **Docker Desktop đang mở**, Node 24, **internet** (mạng Tide).

```bash
# 0. Lần đầu (ĐÃ LÀM, không chạy lại trừ khi muốn làm lại từ đầu)
bash infra/start-tidecloak.sh        # chạy TideCloak :8080
node infra/bootstrap-realm.mjs       # tạo realm khien-nha
node infra/create-users.mjs          # tạo 3 user + link mời
# → mở 3 link mời, tạo 3 tài khoản Tide (người thật làm)  ← ĐANG KẸT Ở ĐÂY
node infra/finish-users.mjs          # cấp quyền (có thể cần Bà Lan bấm duyệt)
node infra/export-adapter.mjs        # xuất cấu hình Tide cho app + bank

# 1. Mỗi lần chạy demo (2 cửa sổ terminal)
cd bank && npm install && ALLOW_RESET=1 npm run dev     # MockBank :4000
cd app  && npm install && npm run dev                   # App :3000

# 2. Mở app
#    Bà Lan: Chrome ẩn danh → http://localhost:3000
#    Thảo:   Edge InPrivate → http://localhost:3000
#    Minh:   Chrome Guest   → http://localhost:3000

# Demo tấn công (bank phải đang chạy)
node scripts/attack-forge.mjs
```

> Nếu TideCloak tắt (khởi động lại máy): mở Docker Desktop, chạy `docker start tidecloak`. **Đừng** chạy `start-tidecloak.sh --wipe`, lệnh này xoá sạch dữ liệu.

---

## 7. Tình trạng hiện tại

| Hạng mục | Trạng thái |
|---|---|
| TideCloak chạy, realm `khien-nha`, IGA bật, licence OK | ✅ |
| 3 user + link mời | ✅ |
| **Tạo 3 tài khoản Tide** | ❌ **Kẹt**: lỗi mạng Tide (*"got 7 of 20 ORKs"*, *"aggregate shard signature didn't pass"*). Tên `parcheesi-balan` bị tạo dở, bỏ, dùng tên mới. Đã nhờ hỏi mentor / Discord #support |
| Cấp quyền admin cho 3 người (`finish-users.mjs`) | ⏳ Chờ bước trên |
| App: trang chủ, Ví, Duyệt, form tên | ✅ Code xong, build OK; ❓ chưa test với đăng nhập thật |
| MockBank | ✅ Code xong, các mã lỗi đã chạy thử |
| Demo tấn công (cảnh 4) | ✅ Đã chạy thử thành công |
| README Setup / Limitations | ⏳ Viết sau khi test xong |
| Video | ⏳ Sau feature freeze |

**Quyết định thiết kế:** dùng **role chung `chuyen-khoan-lon`**, dùng 1 lần mỗi lượt cấp. Phương án "mỗi giao dịch một role riêng" đã thử: cần 2 vòng duyệt/giao dịch, quá dài cho video. → README Limitations sẽ ghi: *lượt duyệt gắn với quyền chung, chưa gắn với từng giao dịch cụ thể*.

**Rủi ro sẽ lộ ra khi test thật:** trình duyệt gọi API TideCloak có bị chặn CORS không; token có đủ quyền liệt kê CR không; định dạng ký duyệt trong enclave; token có claim `aud=mock-bank` không. Agent đã ghi chỗ sửa cho từng trường hợp trong [BUILD_PLAN.md](BUILD_PLAN.md) §7.

---

## 8. Ai cần đọc gì

- **Hằng (README, video):** đọc mục 1, 3 và 7. Cảnh demo theo [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) §6.
- **Sỹ (C1):** đọc mục 1 để biết câu chuyện nối C1–C2: *"Phone scams are prompt injection, aimed at humans."*
- **Yến (code):** mục 6 để chạy; chi tiết kỹ thuật và nhật ký agent trong [BUILD_PLAN.md](BUILD_PLAN.md).
