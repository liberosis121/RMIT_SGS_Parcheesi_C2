# Kịch bản video demo – KinKey (bản cuối)

- **Tổng video:** ≤ 2:00. **0:00–0:48** là intro Hằng đã dựng. **0:48–2:00** là phần demo web dưới đây (72 giây).
- **Toàn bộ quay trên chế độ mô phỏng `/sim`.** Không dùng trang thật `localhost:3000` (nút "Sign in with Tide" ở trang thật dẫn tới Tide thật).
- **Nộp:** file **`demo.mp4`** (< 100 MB) đặt trong thư mục gốc repo `challenge2\`.

---

## A. Chạy app

**Trên laptop Yến:** app đang chạy sẵn. Không tắt app Claude.

**Trên máy khác (Hằng / Sỹ):** cần Node.js 20 trở lên và Git.

```bash
git clone https://github.com/liberosis121/RMIT_SGS_Parcheesi_C2.git
cd RMIT_SGS_Parcheesi_C2/app
npm install
npm run dev
```

Thấy `Local: http://localhost:3000` là chạy xong. Trang thật (`/`, `/wallet`) sẽ lỗi trên máy khác, không sao vì video chỉ dùng `/sim`.

**Reset dữ liệu demo** (trước mỗi lần quay, mở terminal thứ 2):

```bash
curl -X POST localhost:3000/api/sim/reset
```

PowerShell: `Invoke-RestMethod -Method Post http://localhost:3000/api/sim/reset`

---

## B. Chuẩn bị (làm 1 lần, KHÔNG quay)

1. Chạy lệnh **reset** ở mục A.
2. Mở **Chrome** → gõ `localhost:3000/sim/signin` → Enter. **Chưa đăng nhập.** Đây là **cửa sổ MOM**.
3. Mở **Edge** → bấm `Ctrl + Shift + N` (InPrivate) → gõ `localhost:3000/sim/signin` → Enter.
4. Ở cửa sổ Edge: ô **Username** gõ `thao`, ô **Password** gõ `demo` → bấm **Sign in**. Đây là **cửa sổ THAO**.
5. Đặt 2 cửa sổ cạnh nhau: **MOM bên trái, THAO bên phải**.
6. Cả 2 cửa sổ: zoom 110% (`Ctrl` và `+`), ẩn thanh bookmark (`Ctrl + Shift + B`). Tắt thông báo Windows, Zalo.

---

## C. Quay (mỗi dòng một thao tác)

Bấm `Win + Alt + R` để **bắt đầu** và **dừng** quay. Video lưu ở `Videos\Captures`.

### Cảnh 1 · Mom đăng nhập (0:48–0:56) · cửa sổ MOM
1. Ô **Username** gõ `mom`.
2. Ô **Password** gõ `demo`.
3. Bấm **Sign in**.
4. Trên menu bấm **Wallet**. Thấy số dư **₫850,000,000**.

### Cảnh 2 · Chuyển 2 triệu (0:56–1:04) · cửa sổ MOM, trang Wallet
5. Khung **New transfer**: bấm thẻ **Ben Thanh Market – groceries**.
6. Bấm nút nhỏ **₫2,000,000** (ngay dưới ô Amount).
7. Bấm nút đen **Send now**.
8. Thấy thông báo **Sent**, số dư giảm.

### Cảnh 3 · 200 triệu bị giữ lại (1:04–1:14) · cửa sổ MOM
9. Bấm thẻ **Captain Hung – 'police holding account'**.
10. Bấm nút nhỏ **₫200,000,000**.
11. Bấm nút đen **Request approval**.
12. Thấy thẻ vàng **Waiting for family approval**.
13. Trên menu bấm **Approvals**.
14. Ở thẻ **₫200,000,000 to Captain Hung** bấm **Approve**.
15. Hộp ký Tide hiện ra, bấm **Confirm and sign**.
16. Thấy **1 of 2**.

### Cảnh 4 · Thảo từ chối (1:14–1:24) · cửa sổ THAO
17. Bấm vào cửa sổ THAO. Trên menu bấm **Approvals** (đang ở đó thì bấm `F5`).
18. Thấy thẻ **₫200,000,000 to Captain Hung** có **dòng cảnh báo đỏ**.
19. Bấm **Deny**.
20. Thấy **Denied**.

### Cảnh 5 · Dev gian lận bị chặn (1:24–1:34) · cửa sổ MOM
21. Bấm vào cửa sổ MOM. Trên menu bấm **Wallet**.
22. Cuộn **xuống cuối trang** tới mục **Developer attack demo**.
23. Bấm **Forge a token**.
24. Thấy khung đỏ **HTTP 401 · INVALID_SIGNATURE**.

### Cảnh 6 · Học phí được duyệt (1:34–1:52) · MOM → THAO → MOM
25. **MOM:** cuộn lên khung **New transfer**, bấm thẻ **Bin – grandson's tuition**.
26. **MOM:** bấm nút nhỏ **₫30,000,000**.
27. **MOM:** bấm **Request approval**.
28. **MOM:** trên menu bấm **Approvals** → ở thẻ **₫30,000,000 to Bin** bấm **Approve** → bấm **Confirm and sign**.
29. **THAO:** bấm `F5` → ở thẻ **₫30,000,000 to Bin** bấm **Approve** → bấm **Confirm and sign**. Thấy **2 of 2**.
30. **MOM:** trên menu bấm **Wallet** → ở thẻ **₫30,000,000 to Bin** bấm **Complete transfer**.
31. Thấy **Sent**, lịch sử ghi *approved by Mom (Lan), Thao*.

### Cảnh 7 · Kết (1:52–2:00) · cửa sổ MOM
32. Gõ `localhost:3000/sim` → Enter.
33. Dừng 3 giây ở tiêu đề **"Two keys for every big transfer."**
34. Bấm `Win + Alt + R` để **dừng quay**.

**Quay hỏng:** chạy lệnh reset (mục A), đăng nhập lại cả 2 cửa sổ (mục B bước 2–4), quay lại từ Cảnh 1.

---

## D. Lời thoại cho Text-to-speech (Hằng copy từng đoạn)

Clipchamp → **Text to speech** → ngôn ngữ **English (United States)** → tốc độ **1.0** → dán từng đoạn, đặt ở đầu cảnh tương ứng.

**Đoạn 1 · đặt ở Cảnh 1 (0:48)**
```
Each family member signs in with their own Tide identity. No one shares a password.
```

**Đoạn 2 · đặt ở Cảnh 2 (0:56)**
```
Groceries under ten million dong go straight through.
```

**Đoạn 3 · đặt ở Cảnh 3 (1:04)**
```
Then a scammer pushes Mom to send two hundred million. KinKey holds it. Mom's key is only one of two.
```

**Đoạn 4 · đặt ở Cảnh 4 (1:14)**
```
Thao sees a first-time recipient, calls Mom, and denies it.
```

**Đoạn 5 · đặt ở Cảnh 5 (1:24)**
```
Even our own developer can't fake an approval. The bank only trusts Tide's signature.
```

**Đoạn 6 · đặt ở Cảnh 6 (1:34)**
```
For her grandson's real tuition, Thao approves. Only with both keys does the money move.
```

**Đoạn 7 · đặt ở Cảnh 7 (1:52)**
```
KinKey. Two keys for every big transfer.
```

---

## E. Dựng video (Clipchamp)

1. Kéo **intro 48 giây** vào đầu timeline, rồi các clip Cảnh 1 → 7 theo thứ tự.
2. **Cắt** đoạn gõ phím, đoạn chờ tải trang. Mỗi cảnh vừa khít thời lượng ghi ở mục C.
3. Thêm 7 đoạn **Text to speech** ở mục D vào đúng cảnh.
4. Thêm **chữ nhỏ góc dưới** từ Cảnh 1 tới Cảnh 6:
   ```
   Simulated TideCloak (Tide network overloaded during the event)
   ```
5. **Zoom** (Crop/Zoom) vào: dòng cảnh báo đỏ (Cảnh 4), khung **401** (Cảnh 5), **2 of 2** (Cảnh 6).
6. Kiểm tra **tổng ≤ 2:00**. Dư thời gian thì bỏ Cảnh 1 trước.
7. **Export → 1080p** → đổi tên thành **`demo.mp4`** → kiểm tra dung lượng **< 100 MB** (lớn hơn thì xuất 720p).
8. Copy `demo.mp4` vào `D:\RMIT hackathon\challenge2\` → báo Yến để push.

---

## F. Trước khi nộp
- [ ] `demo.mp4` đã lên GitHub, bấm vào xem hoặc tải được
- [ ] Mở repo bằng **tab ẩn danh**: public, README hiển thị đúng
- [ ] Điền Google Form https://forms.gle/HRHYjnqB86j1LFS97: tên nhóm `RMIT_SGS_Parcheesi_C2` + link repo https://github.com/liberosis121/RMIT_SGS_Parcheesi_C2
- [ ] Sau 18:00 **không push gì nữa**
