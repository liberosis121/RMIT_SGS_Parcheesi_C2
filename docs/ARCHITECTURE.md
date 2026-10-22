# KinKey – Hiểu toàn bộ dự án trong 10 phút (tiếng Việt)

> Cập nhật 22/10/2026, 17:00. File này thay cho bản cũ. Tên cũ của dự án là "Khiên Nhà", giờ là **KinKey**.

---

## 1. Challenge 2 yêu cầu gì?

- Đề: **Tide UNLOCKED**. Câu hỏi: *"Bạn sẽ xây gì nếu niềm tin không còn là nút thắt?"*
- Làm một **app nhỏ chạy được, có TideCloak**, cho thấy **một điều trước đây không làm được** vì phải tin một người/một bên nắm toàn quyền.
- Khái niệm chính: **Emergent Authority**. Không admin, server hay công ty nào **một mình** vượt được luật. Quyền chỉ "xuất hiện" khi **đủ người duyệt + đúng chính sách**.
- Câu "sống còn" của đề: *nếu thay TideCloak bằng đăng nhập + phân quyền bình thường mà app vẫn y hệt, thì ý tưởng còn yếu.*
- **Nộp:** repo GitHub public (code + README, phần tổng quan ≤ 300 chữ, 5 mục) + **video 2 phút** `demo.mp4` + link qua Google Form. Hạn **18:00 hôm nay**.
- **Cập nhật của BTC trong ngày:** mạng Tide bị quá tải nên BTC cho phép *"làm như thể TideCloak đang bảo vệ app, dùng Tide MCP để lập kế hoạch TideCloak nằm ở đâu, và **mô phỏng** đăng nhập, role, kiểm quyền"*.

---

## 2. Tình huống (vấn đề)

- Lừa đảo qua điện thoại ở Việt Nam: khoảng **18.900 tỷ đồng (~744 triệu USD) năm 2024**. Người già bị nhắm nhiều nhất.
- Kẻ lừa (giả công an, "Đại úy Hùng") **không hack mật khẩu**, mà **thuyết phục chính chủ bấm chuyển tiền**.
- Ngân hàng bắt **sinh trắc học** khi chuyển trên 10 triệu, nhưng chỉ chứng minh *"đúng là mẹ"*. Trong vụ lừa, **chính mẹ là người bấm**.
- Cách bảo vệ hiện nay đều phải **trao quyền cho ai đó**, và người đó thành điểm yếu mới:

| Cách hiện nay | Hỏng ở đâu |
|---|---|
| Con giữ luôn tài khoản của mẹ | Con có toàn quyền rút tiền, mẹ mất tự chủ |
| App/ngân hàng làm tính năng "người thân duyệt" | Luật đó chỉ là **1 dòng trong database**. Admin, nhân viên, hacker chiếm server đều tắt hoặc giả được |

> Ý chính: **lừa đảo qua điện thoại = "prompt injection" nhắm vào con người** (câu này nối với Challenge 1 của Sỹ).

---

## 3. Giải pháp: KinKey, "ví hai chìa" cho gia đình

| Luật | Vì sao |
|---|---|
| **Dưới 10 triệu**: mẹ tự chuyển, đi ngay | Giữ tự chủ cho người già, không biến app thành công cụ kiểm soát |
| **Từ 10 triệu trở lên**: **giữ lại**, cần **mẹ + ít nhất 1 người con** duyệt (2 trên 3) | Chìa thứ hai nằm ở **máy người khác**, kẻ lừa không với tới |
| Con **không tự tạo** giao dịch từ tài khoản của mẹ | Con chỉ giữ chìa, không giữ tiền |
| **Đổi luật** (bỏ người duyệt, hạ ngưỡng) cũng cần 2/3 | Không ai âm thầm tắt bảo vệ |
| Quyền chuyển lớn **chỉ dùng 1 lần**, mọi thao tác **có lịch sử** | Không dùng lại được, cả nhà nhìn thấy |

**Nhân vật (dữ liệu giả):**
- **Mom (Lan)**, 68 tuổi, chủ tài khoản, có **₫850.000.000**
- **Thao** (con gái) và **Minh** (con trai): người giữ chìa thứ hai
- Người nhận: **Bin** (học phí cháu, 30 triệu), **Chợ Bến Thành** (tiền chợ, 2 triệu), **Captain Hung – "police holding account"** (kẻ lừa, 200 triệu)

---

## 4. Vì sao bắt buộc phải là TideCloak (qua bài test của đề)

| Tình huống | App đăng nhập thường | KinKey + TideCloak |
|---|---|---|
| Kẻ lừa thuyết phục mẹ chuyển 200 triệu | Chặn được **nếu** luật trên server còn nguyên | Chặn: quyền chuyển lớn chỉ có khi con duyệt thật |
| Dev/hacker có toàn quyền server sửa DB thành "đã duyệt" | **Làm được** | Ngân hàng từ chối: không có chữ ký hợp lệ của Tide |
| Lấy khoá ký token của hệ thống | **Làm được** (khoá nằm trong DB) | **Không có khoá để lấy**: token do mạng Tide ký phân tán, khoá không bao giờ ghép lại một chỗ |
| Một người con tự gỡ người duyệt khác | **Làm được** nếu là admin | Thành yêu cầu chờ 2/3 duyệt |

**3 tính năng TideCloak dùng:**
1. **Đăng nhập Tide (BYOiD):** mỗi người một danh tính Tide, app không bao giờ thấy mật khẩu.
2. **IGA / Quorum:** mọi thay đổi quyền thành **"change request"**, phải đủ người duyệt (mỗi người ký trong **cửa sổ Tide** trên máy mình) mới có hiệu lực.
3. **Token do mạng Tide ký:** ngân hàng chỉ cần **khoá công khai** để kiểm, không ai giữ khoá bí mật.

---

## 5. Kiến trúc

```
   Trình duyệt Mom / Thao / Minh (mỗi người một cửa sổ)
        │ đăng nhập + DUYỆT         │ xem giao diện          │ chuyển tiền + token
        ▼                           ▼                        ▼
  TideCloak :8080            App KinKey :3000           MockBank :4000
  (giữ luật duyệt 2/3,       (Next.js, giao diện +      (ngân hàng giả: chỉ chuyển
   cấp token do mạng          lưu giao dịch chờ.          khi token Tide hợp lệ
   Tide ký)                   KHÔNG được tin)             và có quyền)
```

| Phần | Công nghệ | Có được tin không? |
|---|---|---|
| **TideCloak** | Docker `tideorg/tidecloak-dev`, realm `kinkey2` | Tin **mạng Tide**, không tin riêng máy nào |
| **App KinKey** | Next.js + React + TypeScript | **Không**: coi như có thể bị hack, nhưng không tự cấp quyền được |
| **MockBank** | Node + Express | Đóng vai **ngân hàng thật**, chỉ tin chữ ký Tide |

**Quy tắc bảo mật quan trọng nhất:** nút **Duyệt** gửi **thẳng từ trình duyệt người duyệt lên TideCloak**, không đi qua server app. Đi qua server thì server có thể "bỏ phiếu thay", đúng lỗ hổng app sinh ra để chặn.

---

## 6. Một giao dịch chạy thế nào

**Chuyển nhỏ (2 triệu):** Mom bấm *Send now* → ngân hàng kiểm token → chuyển ngay.

**Chuyển lớn (200 triệu cho "Captain Hung"):**
1. Mom bấm *Request approval* → giao dịch **"Waiting for family approval"**, tạo yêu cầu cấp quyền chuyển lớn.
2. Mom vào *Approvals* → *Approve* → ký → **1 of 2** (chìa 1).
3. Thao vào *Approvals* → thấy **cảnh báo đỏ "First transfer to this account. Call Mom before approving."**
   - **Deny** → giao dịch bị huỷ, tiền không đi.
   - Hoặc **Approve** → ký → **2 of 2** → quyền được cấp.
4. Mom bấm *Complete transfer* → ngân hàng thấy token có quyền → chuyển. Quyền **tự hết sau 1 lần dùng**.

**Tấn công thử (dev gian lận):**
- *Forge a token* (token tự ký bằng khoá khác) → ngân hàng trả **401 INVALID_SIGNATURE**
- *Forge approval and try to send* (sửa DB thành "đã duyệt", token thật nhưng chưa có quyền) → **403 NEEDS_FAMILY_APPROVAL**

---

## 7. Cái gì thật, cái gì mô phỏng

| Phần | Trạng thái |
|---|---|
| TideCloak, realm, licence, IGA | **Thật**, chạy trên laptop Yến |
| Mom đăng nhập bằng tài khoản Tide | **Thật**, đã chạy |
| Ngân hàng kiểm chữ ký Tide và chuyển **2 triệu** | **Thật**, đã chạy |
| Tài khoản Tide của Thao, Minh | **Không tạo được**: mạng Tide lỗi liên tục (kết nối ORK, chữ ký, giới hạn gói, lỗi 500 khi cấp licence) |
| Duyệt 2/3 với 3 người | **Mô phỏng** ở `/sim`, theo đúng hướng dẫn của BTC |

**Chế độ mô phỏng `/sim`** giả lập đúng các phần TideCloak làm:
- Trang đăng nhập kiểu Tide → cấp **token có role** (`owner` cho Mom, `approver` cho Thao/Minh), ký bằng **"khoá Fabric giả lập"**.
- **Chặn trang theo role:** Thao mở Ví → *"Access denied · requires role owner"*.
- **Duyệt 2/3**, mỗi người 1 phiếu (duyệt lần 2 bị từ chối), hộp ký giống cửa sổ Tide (*Confirm and sign*).
- **Ngân hàng mô phỏng** chỉ dùng **khoá công khai** để kiểm, cùng luật với MockBank thật.
- Khung **"Your token (decoded)"** cho giám khảo thấy role nằm trong token.

Kế hoạch tích hợp TideCloak (lập bằng Tide MCP) ở [TIDECLOAK_PLAN.md](TIDECLOAK_PLAN.md).

---

## 8. Các trang web

| Trang | Dùng để | Đăng nhập |
|---|---|---|
| http://localhost:3000/sim | **Dùng cho video**: trang chủ chế độ mô phỏng | – |
| http://localhost:3000/sim/signin | Đăng nhập mô phỏng | `mom` / `thao` / `minh`, mật khẩu `demo` |
| http://localhost:3000/sim/wallet | **Ví** của Mom: số dư, chuyển tiền, lịch sử, tấn công thử, xem token | Mom |
| http://localhost:3000/sim/approvals | **Duyệt**: yêu cầu chờ, Approve / Deny | Mom, Thao, Minh |
| http://localhost:3000 , `/wallet` | App **thật** với TideCloak thật (chỉ Mom có tài khoản) | Tài khoản Tide thật |
| http://localhost:3000/preview | Bản xem giao diện, dữ liệu giả, không đăng nhập | – |
| http://localhost:4000/ledger | Sổ cái ngân hàng giả (JSON) | – |

**Mỗi tab trình duyệt là một người riêng.** Mom một tab, Thao một tab, đăng nhập riêng.

---

## 9. Cách chạy và test

Đang chạy sẵn trên laptop Yến (đừng tắt app Claude và Docker Desktop). Nếu phải chạy lại:

```bash
docker start tidecloak                          # TideCloak (chỉ cần cho trang thật)
cd app  && npm run dev                          # App :3000
cd bank && npm run dev                          # MockBank :4000 (chỉ cần cho trang thật)
```

**Test trước khi quay:**
1. Reset dữ liệu mô phỏng: `curl -X POST localhost:3000/api/sim/reset`
2. Tab Chrome: `/sim/signin` → đăng nhập `mom` / `demo`
3. Tab Edge: `/sim/signin` → đăng nhập `thao` / `demo`
4. Làm theo bảng **D1–D7** trong [VIDEO_PLAN.md](VIDEO_PLAN.md) (mục "BẢN CHỐT")
5. Xong thì **reset + đăng nhập lại** rồi mới quay thật

---

## 10. Giới hạn (nói thật, đã ghi trong README)

- Ai chiếm được **cả máy mẹ lẫn máy con** thì vẫn đủ 2 chìa. Tide chứng minh "người giữ phiên này có quyền", không chứng minh người đó tỉnh táo.
- Lượt duyệt gắn với **"quyền chuyển lớn dùng 1 lần"**, chưa gắn với **đúng số tiền + đúng người nhận**. Muốn vậy cần hợp đồng Forseti của Tide (chưa mở cho tự triển khai).
- **MockBank là của nhóm**, đóng vai ngân hàng thật.
- 2 người con cùng nhau có thể đổi luật mà không cần mẹ (nhưng không chuyển được tiền của mẹ).
- Mọi dữ liệu là giả.

---

## 11. Thư mục chính

```
challenge2/
├── README.md              bài nộp (tiếng Anh): tổng quan 5 mục + chi tiết
├── demo.mp4               video (sắp có)
├── app/                   App KinKey (Next.js)
│   └── src/app/sim/       chế độ Simulated TideCloak
├── bank/                  MockBank (ngân hàng giả)
├── infra/                 script dựng TideCloak, realm, user
├── scripts/attack-forge.mjs   tấn công thử bằng dòng lệnh
└── docs/                  tài liệu nhóm (file này, kế hoạch, kịch bản video)
```
