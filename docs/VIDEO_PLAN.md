# Kế hoạch quay video demo (2 phút) – KinKey

## ⭐ BẢN CHỐT (17:00): phần demo web chỉ còn ~70 giây

Hằng đã dựng xong **intro 48 giây** (tình huống + ý tưởng). Phần demo web nối tiếp từ **0:48 → 2:00**, tối đa **72 giây**.
Quay trên chế độ **Simulated TideCloak** (`http://localhost:3000/sim`), riêng cảnh D1 dùng **đăng nhập Tide thật** của Mom nếu đã quay được.
Quay **từng cảnh riêng** (`Win + Alt + R`), cắt sát khi dựng. Mỗi cảnh **chỉ làm đúng 1 việc**.

**Chuẩn bị:** 2 cửa sổ cạnh nhau. **Trái = Mom** (Chrome), **phải = Thao** (Edge InPrivate). Cả hai mở `http://localhost:3000/sim`.
Mom đăng nhập `mom` / `demo`, Thao đăng nhập `thao` / `demo` trước khi quay. Zoom Chrome 110%, ẩn bookmark.

| Cảnh | Thời gian | Cửa sổ | Bấm gì | Lời thoại (EN) |
|---|---|---|---|---|
| **D1** Đăng nhập | 0:48–0:56 (8s) | Mom | Trang thật `localhost:3000` → **Sign in with Tide** → vào app, chip **Mom (Lan) · Account owner**. (Chưa quay được cảnh thật thì dùng `/sim/signin`) | *"Each family member signs in with their own Tide identity. No one shares a password."* |
| **D2** Chuyển nhỏ | 0:56–1:04 (8s) | Mom · **Wallet** | **Ben Thanh Market** → **₫2,000,000** → **Send now** → *Sent* | *"Groceries under ten million go straight through."* |
| **D3** Bị giữ lại | 1:04–1:14 (10s) | Mom · **Wallet** → **Approvals** | **Captain Hung** → **₫200,000,000** → **Request approval** → thẻ vàng *Waiting for family approval* → Approvals → **Approve** (ký) → **1 of 2** | *"A scammer pushes two hundred million. It's held: Mom's key is only one of two."* |
| **D4** Thảo từ chối | 1:14–1:24 (10s) | Thao · **Approvals** | Thẻ **₫200,000,000 to Captain Hung**, banner đỏ → **Deny** → *Denied* | *"Thao sees a first-time recipient, calls Mom, and denies it."* |
| **D5** Dev gian lận | 1:24–1:36 (12s) | Mom · **Wallet** (cuộn xuống *Developer attack demo*) | **Forge token** → khung đỏ **401 · INVALID_SIGNATURE**. Mở khung **Your token (decoded)** 2 giây cho thấy role | *"Even our own developer can't fake approval. The bank only trusts Tide's signature."* |
| **D6** Học phí qua | 1:36–1:52 (16s) | Mom → Thao → Mom | Mom: **Bin – tuition** → **₫30,000,000** → **Request approval** → Approve. Thao: **Approve** → hộp ký Tide → **Confirm** → **2 of 2**. Mom: **Complete transfer** → *Sent* | *"For real tuition, Thao approves, and only then does the money move."* |
| **D7** Kết | 1:52–2:00 (8s) | Trang chủ `/sim` | Dừng ở tiêu đề + logo | *"KinKey. Two keys for every big transfer."* |

**Tổng lời thoại ~75 chữ**, đọc chậm vẫn vừa 72 giây. Dùng Text-to-speech của Clipchamp cho đều giọng.
**Chèn chữ nhỏ góc dưới** ở D3–D6: *"Simulated TideCloak (Tide network overloaded during the event)"*, cho trung thực.
**Cắt bớt nếu dư giờ:** bỏ D1 trước, rồi rút D6 còn cảnh Thao Approve + Mom Complete transfer.

> Đường dẫn và tên nút trong `/sim` theo bản agent đang làm. Mình sẽ xác nhận lại sau khi kiểm tra, khoảng 17:20.

---

## (Bản cũ, tham khảo)

> Ai: **Yến thao tác trên laptop**, **Hằng đạo diễn + lời thoại + dựng**. Quay lúc **16:00–16:30**, dựng xong **17:00**.
> Nộp: file **`demo.mp4`**, **≤ 2 phút**, **< 100 MB**, đặt ở **thư mục gốc repo**.
> Có 2 kịch bản: **A** (tạo được tài khoản Tide, chạy thật) và **B** (không tạo được tài khoản, dùng trang preview + tấn công thật). **Lời thoại giống nhau 90%**, chỉ khác cảnh 3.

---

## 0. Chuẩn bị (10 phút trước khi quay)

### Máy và màn hình
- [ ] Laptop **cắm sạc**, bật **Do Not Disturb** (tắt thông báo Zalo, Messenger, Windows).
- [ ] Chrome: **ẩn thanh bookmark** (`Ctrl + Shift + B`), đóng các tab không liên quan, **zoom 110%** (`Ctrl` + `+`) để chữ to rõ trong video.
- [ ] Cửa sổ **toàn màn hình** (`F11` nếu cần), độ phân giải 1920×1080.
- [ ] Docker Desktop đang chạy (TideCloak), app `:3000` và MockBank `:4000` đang chạy. Kiểm tra: mở http://localhost:4000/ledger thấy số dư **850,000,000**.

### Công cụ quay
- **Cách dễ nhất:** quay **từng cảnh riêng** bằng **Xbox Game Bar** (`Win + Alt + R` bắt đầu/dừng, chỉ quay được 1 cửa sổ). Video lưu ở `Videos\Captures`.
- Muốn quay liền, chuyển qua lại Chrome ↔ Terminal: dùng **OBS** (Display Capture).
- **Dựng + lồng tiếng:** **Clipchamp** (có sẵn trên Windows 11).
  - Lồng tiếng: tự đọc (*Record → Voiceover*) **hoặc** dùng **Text to speech** giọng tiếng Anh (dán lời thoại ở mục 3, chọn giọng *en-US*, tốc độ 1.0). TTS rõ, đều, không lo phát âm.
  - Xuất: **1080p**. Video 2 phút thường **30–60 MB**. Nếu > 100 MB, xuất **720p**.

### Mở sẵn các tab (theo thứ tự)
| Tab | Kịch bản A | Kịch bản B |
|---|---|---|
| 1 | http://localhost:3000 (Chrome Guest, đã đăng nhập **Mom**) | http://localhost:3000/preview |
| 2 | http://localhost:3000/approvals (Edge InPrivate, đăng nhập **Thao**) | http://localhost:3000/preview/wallet |
| 3 | http://localhost:4000/ledger | http://localhost:3000/preview/approvals |
| 4 | Terminal ở thư mục `challenge2` | Terminal ở thư mục `challenge2` |
| 5 | – | http://localhost:3000 (trang thật, chưa đăng nhập) |

> Mẹo kịch bản B: **tải lại** (`F5`) trang preview ngay trước khi quay mỗi cảnh, để dữ liệu giả về trạng thái ban đầu.

---

## 1. Dàn cảnh tổng (2:00)

| Thời gian | Phần (theo đề) | Cảnh | Màn hình |
|---|---|---|---|
| 0:00–0:20 | **The possibility** | 1 | Trang chủ KinKey |
| 0:20–0:45 | **The constraint** | 2 | Trang chủ, cuộn xuống *How it works* + con số US$744M |
| 0:45–1:40 | **The prototype** | 3a–3e | Ví → Duyệt → Tấn công → Ví |
| 1:40–2:00 | **What changes** | 4 | Trang chủ / logo, kết |

---

## 2. Từng cảnh: bấm gì, ở đâu

### Cảnh 1 (0:00–0:20) – Ý tưởng
- **Màn hình:** trang chủ (A: tab 1 · B: `/preview`). Kịch bản B: **cuộn nhẹ xuống** cho khung "Design preview" ra khỏi màn hình, hoặc cắt khung đó khi dựng.
- **Thao tác:** để yên 3 giây cho thấy tiêu đề *"Two keys for every big transfer."* và phiếu chuyển tiền có con dấu *"Waiting for second key"*. Rê chuột chậm qua con dấu.

### Cảnh 2 (0:20–0:45) – Vấn đề niềm tin
- **Thao tác:** cuộn xuống mục **How it works** (01 02 03), dừng 3 giây; cuộn tiếp tới **US$744M**, dừng 3 giây.

### Cảnh 3 (0:45–1:40) – Prototype

#### Kịch bản A – chạy thật (cần 3 tài khoản Tide)

**3a. Mom chuyển tiền nhỏ (0:45–0:55)**
1. Tab 1 (Mom) → bấm **Wallet** trên thanh menu.
2. Mục **New transfer**: chọn thẻ **Ben Thanh Market – groceries** → bấm nút nhanh **₫2,000,000** → bấm **Send now**.
3. Thông báo **Sent**, số dư giảm, giao dịch hiện ở **Activity** với nhãn **Completed**.

**3b. "Đại úy Hùng" gọi điện, Mom chuyển 200 triệu (0:55–1:05)**
1. Chọn thẻ **Captain Hung – 'police holding account'** → bấm **₫200,000,000** → dòng gợi ý vàng *"This will need approval from Thao or Minh"* → bấm **Request approval**.
2. Thẻ giao dịch mới: nhãn vàng **Waiting for family approval**, thanh 3 bước dừng ở **Family approval**.
3. Bấm **Approvals** → Mom bấm **Approve** trên yêu cầu của chính mình → ký trong cửa sổ Tide (Mom là chìa 1, hiện **1 of 2**).

**3c. Dev gian lận bị ngân hàng chặn (1:05–1:15)**
1. Quay lại **Wallet**, cuộn xuống **Developer attack demo** → bấm **Forge approval and try to send** → khung đỏ: **The bank said no. HTTP 403 · NEEDS_FAMILY_APPROVAL**.
2. Chuyển sang **Terminal** (tab 4), chạy:
   ```bash
   node scripts/attack-forge.mjs
   ```
   Màn hình in ra: `MockBank answered HTTP 401 {"code":"INVALID_SIGNATURE"...}` và `OK: forged approval rejected.`

**3d. Thảo thấy người nhận lạ, từ chối (1:15–1:25)**
1. Tab 2 (Thao, Edge) → trang **Approvals** → thẻ **₫200,000,000 to Captain Hung**, banner đỏ *"First transfer to this account. Call Mom before approving."*
2. Bấm **Deny**. Yêu cầu chuyển xuống **History** với nhãn **Denied**.

**3e. Học phí thật được duyệt (1:25–1:40)**
1. Tab 1 (Mom): **Wallet** → chọn **Bin – grandson's tuition** → **₫30,000,000** → **Request approval** → **Approvals** → **Approve** (ký Tide).
2. Tab 2 (Thao): **Approvals** → yêu cầu **₫30,000,000 to Bin** → **Approve** → ký trong cửa sổ Tide → **2 of 2**.
3. Tab 1 (Mom): **Wallet** → thẻ giao dịch hiện **Approved – ready to send** → bấm **Complete transfer** (nếu báo chưa có quyền, đợi tối đa 2 phút rồi bấm lại; **cắt đoạn chờ khi dựng**).
4. Nhãn **Completed**, Activity ghi *"approved by Mom (Lan), Thao"*. Tab 3 (`/ledger`) tải lại → thấy giao dịch 30,000,000.

#### Kịch bản B – không có tài khoản Tide (preview + tấn công thật)

**3a. Mom chuyển tiền nhỏ (0:45–0:55)**
1. Tab `/preview/wallet` (thanh trên cùng ghi *UI preview*; có thể cắt bỏ khi dựng hoặc để nguyên cho trung thực).
2. **New transfer** → **Ben Thanh Market – groceries** → **₫2,000,000** → **Send now** → thông báo **Sent**, số dư giảm, Activity thêm dòng **Completed**.

**3b. Mom chuyển 200 triệu cho "Đại úy Hùng" (0:55–1:05)**
1. **Captain Hung – 'police holding account'** → **₫200,000,000** → gợi ý vàng → **Request approval**.
2. Thẻ mới hiện **Waiting for family approval**, thanh 3 bước dừng ở **Family approval**.

**3c. Dev gian lận bị ngân hàng THẬT chặn (1:05–1:15)** ⭐ *cảnh này chạy thật, không phải giả lập*
1. Chuyển sang **Terminal** (tab 4), chạy:
   ```bash
   node scripts/attack-forge.mjs
   ```
2. Zoom vào dòng `MockBank answered HTTP 401 ... INVALID_SIGNATURE` và `OK: forged approval rejected.`

**3d. Thảo từ chối (1:15–1:25)**
1. Tab `/preview/approvals` → thẻ **₫200,000,000 to Captain Hung** (banner đỏ, chấm **1 of 2**: Mom đã duyệt).
2. Bấm **Deny** → thông báo *"Denied… The transfer will not go through."* → mục **History** có dòng **Denied**.

**3e. Học phí được duyệt (1:25–1:40)**
1. Vẫn ở `/preview/approvals`: thẻ **₫30,000,000 to Bin** → **Approve** → History thêm dòng **Approved**.
2. Chuyển sang `/preview/wallet` → thẻ **₫30,000,000 to Bin** đang **Approved – ready to send** → bấm **Complete transfer** → **Transfer sent**, nhãn **Completed**.
3. *(5 giây, nếu còn thời gian)* Tab 5: trang thật http://localhost:3000 → bấm **Sign in with Tide** → hiện trang đăng nhập của mạng Tide, chứng minh app đã nối với TideCloak thật.

### Cảnh 4 (1:40–2:00) – Điều gì thay đổi
- **Màn hình:** quay lại trang chủ, dừng ở tiêu đề + logo KinKey. Kết bằng chữ (thêm khi dựng): **KinKey · Team Parcheesi · RMIT Hackathon 2026**.

---

## 3. Lời thoại tiếng Anh (đọc hoặc dán vào Text-to-speech)

> Khoảng 270 chữ, vừa 2 phút ở tốc độ đọc chậm rõ. Đoạn **[A]** / **[B]** chọn theo kịch bản.

**Cảnh 1 – The possibility (0:00–0:20)**
> Phone scams don't hack passwords. They hack people. A caller pretending to be the police convinces Mom to move her savings, and every security check passes, because it really is Mom pressing "send". KinKey gives every big transfer two keys.

**Cảnh 2 – The constraint (0:20–0:45)**
> Last year, people in Vietnam lost around seven hundred and forty million dollars to online scams. Today, protecting a parent means handing power to someone: a child who could drain the account, or an app whose "family approval" is just a row in a database that any admin can edit. The protector becomes the new weak point.

**Cảnh 3 – The prototype (0:45–1:40)**
> Mom pays for groceries on her own. Anything under ten million dong goes straight through.
>
> Then "Captain Hung" calls. Mom tries to send two hundred million. KinKey holds it: big transfers need a second key from Thao or Minh.
>
> Now say our own developer, with full access to the server, fakes the approval. The bank checks the signature, and rejects it. Approvals are signed by the Tide network, not by our server, so there is nothing for us to forge.
>
> Thao sees a first-time recipient, calls Mom, and denies it. When Mom pays her grandson's tuition, Thao approves, and only then does the money move.
>
> **[B, thêm 1 câu]** The full TideCloak flow is wired in; these screens use demo data because Tide account creation was unavailable during our build.

**Cảnh 4 – What changes (1:40–2:00)**
> Parents keep their independence. Families get a pause button on the one transfer that could wipe out a lifetime of savings. And nobody, not a scammer, not a stolen phone, not even us, can skip the second key. KinKey. Two keys for every big transfer.

---

## 4. Dựng video (Hằng, 16:30–17:00)

1. Clipchamp → **Create a new video** → kéo các clip vào timeline theo thứ tự cảnh 1 → 4.
2. **Cắt** phần thừa: lúc gõ lệnh, lúc chờ tải trang, lúc chờ quyền 120 giây (kịch bản A).
3. Lồng tiếng: **Record → Voiceover**, hoặc **Text to speech** (dán từng đoạn ở mục 3, đặt đúng cảnh).
4. **Zoom** (Crop/Zoom) vào: con dấu *Waiting for second key*, dòng **401 INVALID_SIGNATURE** trong terminal, banner đỏ ở trang Duyệt.
5. Thêm chữ tiêu đề nhỏ góc trên mỗi cảnh: *The possibility · The constraint · The prototype · What changes*.
6. Kiểm tra **tổng thời lượng ≤ 2:00**.
7. **Export → 1080p** → đổi tên thành **`demo.mp4`** → kiểm tra dung lượng **< 100 MB**.
8. Gửi file cho Yến → copy vào thư mục gốc `challenge2/` → commit + push.

## 5. Checklist trước khi nộp (17:20)
- [ ] `demo.mp4` nằm ở gốc repo trên GitHub, bấm vào xem/tải được
- [ ] Video ≤ 2:00, < 100 MB, nghe rõ tiếng
- [ ] README mục **Status** khớp với video (A: sửa thành "verified end to end"; B: giữ nguyên)
- [ ] Mở repo bằng **tab ẩn danh**: public, README hiển thị đúng
- [ ] Điền **Google Form** với tên nhóm `RMIT_SGS_Parcheesi_C2`
