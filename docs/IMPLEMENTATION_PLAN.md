# Implementation Plan – Challenge 2 (Tide UNLOCKED)

**Team:** Parcheesi · **Repo / tên nhóm nộp:** `RMIT_SGS_Parcheesi_C2`
**Người làm C2:** Yến + Hằng (Sỹ làm C1)
**Deadline:** **18:00 hôm nay, 22/10/2026**. Từ 18:00 trở đi **không push gì nữa**.

---

## 1. Phải nộp gì (checklist cuối cùng)

- [ ] Repo GitHub **public**, tên `RMIT_SGS_Parcheesi_C2` (repo này)
- [ ] App chạy được, **có tích hợp TideCloak**, dùng dữ liệu giả
- [ ] `README.md`: 1 câu mô tả + overview **≤ 300 chữ** đủ 5 mục + mục **Setup** riêng
- [ ] `demo.mp4`: **2 phút**, **< 100 MB**, nằm trong repo
- [ ] Nộp link repo qua Google Form `forms.gle/HRHYjnqB86j1LFS97`, tên nhóm `RMIT_SGS_Parcheesi_C2`

**Bài test sống còn:** *"Nếu thay TideCloak bằng login + phân quyền bình thường, app có chạy y hệt không?"* Nếu **có**, ý tưởng còn yếu và phải sửa.

---

## 2. Phân vai

| | **Yến: Builder** | **Hằng: Story & QA** |
|---|---|---|
| Vai chính | Cài TideCloak, điều khiển Claude Code để viết app, git push | README, kịch bản và quay video, dữ liệu giả, test app |
| Phụ trách README | Mục **Setup** | Mục **Overview (5 phần)** + câu mô tả |
| Phụ trách video | Chạy app trên máy khi quay | Viết kịch bản, đọc lời, dựng video, nén < 100MB |
| Nộp bài | Push lần cuối | Kiểm tra repo bằng tab ẩn danh, **điền Google Form** |

Cả hai cùng làm phần **lên ý tưởng** (bước 0).

---

## 3. Timeline (theo agenda)

| Giờ | Yến (Builder) | Hằng (Story & QA) |
|---|---|---|
| **11:00 – 11:45** | **CẢ HAI: chốt ý tưởng** (xem mục 4). Trong lúc bàn, Yến cho máy chạy `docker pull` image TideCloak | |
| **11:45 – 12:00** | Chạy container TideCloak (cổng 8080), cài **Tide MCP** vào Claude Code | Viết nháp câu mô tả + mục 1–2 của README |
| **12:00 – 13:00** | 🍱 Ăn trưa | 🍱 Ăn trưa |
| **13:00 – 14:00** | Dựng khung app + login bằng TideCloak (theo Quickstart / MCP) | Tạo **dữ liệu giả** (tên người, giao dịch…), viết **kịch bản video** từng câu |
| **14:00** | ⛳ **Checkpoint 1:** login TideCloak chạy được. Chưa được thì hỏi Discord #support hoặc mentor **ngay** | |
| **14:00 – 15:30** | Làm **luồng demo chính** (mục 5): hành động nhạy cảm cần đủ người duyệt mới chạy | Viết mục 3–5 README; test app lúc Yến xong từng phần, báo lỗi |
| **15:30** | ⛳ **Checkpoint 2: FEATURE FREEZE.** Luồng demo chính chạy từ đầu đến cuối. Sau mốc này **không thêm tính năng** | |
| **15:30 – 16:00** | Sửa lỗi Hằng báo; viết mục **Setup** | Chạy thử toàn bộ kịch bản demo trên app thật; đếm chữ README (≤ 300) |
| **16:00 – 16:30** | 🎬 **CẢ HAI: QUAY VIDEO** (Yến thao tác, Hằng đọc lời / chỉ đạo). Quay 2–3 lần, chọn lần tốt nhất | |
| **16:30 – 17:00** | Dọn repo (xoá file thừa, kiểm tra `.gitignore`, không có mật khẩu/secret) | Cắt ghép video, nén thành `demo.mp4` < 100MB |
| **17:00 – 17:20** | Push code + README + `demo.mp4` | Đọc lại README lần cuối |
| **17:20 – 17:40** | ⛳ **Checkpoint 3:** mở repo bằng **tab ẩn danh**: public? README hiện đúng? video tải về xem được? | **Điền Google Form** |
| **17:40 – 18:00** | Dự phòng. Chỉ sửa lỗi nhỏ (typo). **18:00 dừng hẳn** | |

---

## 4. Bước 0: Lên ý tưởng (cả hai, 11:00 – 11:45)

### 4.1. Brainstorm (15 phút)
Mỗi người nghĩ 2–3 ý theo công thức:
> "Ở đâu đang có **một người/một tổ chức nắm toàn quyền**, và vì phải tin họ nên **có việc hay ho không làm được**?"

Gợi ý sẵn:
| Ý tưởng | Ai đang nắm toàn quyền? | Với TideCloak thì sao? |
|---|---|---|
| ⭐ **Quỹ lớp / quỹ từ thiện cộng đồng**: chi tiền cần 2/3 người trong ban quỹ duyệt | Thủ quỹ, admin app | Không ai tự chi được, kể cả người viết app |
| **Hồ sơ bệnh án**: bác sĩ xem hồ sơ khi bệnh nhân + người phụ trách cùng đồng ý | Admin bệnh viện, DB admin | Admin cũng không đọc trộm được |
| **Sửa điểm sinh viên**: cần giảng viên + trưởng khoa duyệt | IT admin của trường | IT không tự sửa điểm được |
| **AI agent dùng dữ liệu cá nhân**: AI chỉ truy cập khi người dùng duyệt | Server giữ token của AI | AI / server không tự lấy dữ liệu được |

### 4.2. Chấm điểm và chọn 1 (15 phút)
Chấm mỗi ý 1–5 điểm theo:
1. **Qua bài test "login thường"?** (bắt buộc ≥ 4)
2. **Demo dễ hiểu trong 2 phút?** Có cảnh "kẻ xấu/admin thử làm một mình → bị chặn" không?
3. **Đủ nhỏ để code xong trước 15:30?**
4. **Mới lạ?** (ý bệnh viện chắc nhiều nhóm làm)

Có thể hỏi **Hackbot** trên trang tide.org/unlocked để xin nhận xét ý tưởng.

### 4.3. Chốt ra 1 tờ "spec" (15 phút), điền vào đây

- **Tên app:** …
- **Câu mô tả 1 dòng:** …
- **Các vai (role):** … (ví dụ: Thủ quỹ, Thành viên ban quỹ ×2, Người xem)
- **Hành động nhạy cảm:** … (ví dụ: chi tiền từ quỹ)
- **Luật duyệt:** … (ví dụ: cần 2/3 thành viên ban quỹ đồng ý)
- **Cảnh "bị chặn" trong demo:** … (ví dụ: thủ quỹ / admin cố chi một mình → thất bại)
- **Cảnh "thành công":** … (ví dụ: đủ 2 người duyệt → giao dịch được thực hiện)

Spec này là thứ Yến đưa cho Claude Code để build, và Hằng dùng để viết README + video.

---

## 5. Luồng demo chính (định nghĩa "XONG")

App coi là xong khi chạy được **đúng 4 bước** sau, không cần hơn:
1. Đăng nhập bằng TideCloak (ít nhất 2–3 user giả với vai khác nhau)
2. Một người **yêu cầu** hành động nhạy cảm
3. **Một mình** người đó (hoặc admin) cố thực hiện → **bị chặn**
4. Đủ người **duyệt** → hành động **thành công**, có hiển thị lịch sử ai đã duyệt

Giao diện đơn giản là được, **chạy ổn quan trọng hơn đẹp**.

---

## 6. Kịch bản video 2 phút (Hằng viết chi tiết)

| Thời lượng | Phần | Nội dung |
|---|---|---|
| 0:00 – 0:20 | **The possibility** | Chúng tôi xây gì |
| 0:20 – 0:45 | **The constraint** | Hiện nay vướng niềm tin ở đâu, ai đang nắm toàn quyền |
| 0:45 – 1:40 | **The prototype** | Demo 4 bước ở mục 5, chỉ rõ TideCloak làm gì |
| 1:40 – 2:00 | **What changes** | Người dùng được gì |

Công cụ quay: **OBS** hoặc **Xbox Game Bar** (`Win + Alt + R`). Nén video: HandBrake hoặc Clipchamp (có sẵn trên Windows).

---

## 7. Phương án dự phòng

| Sự cố | Xử lý |
|---|---|
| Tide MCP không cài được | Dùng template **TideCloak Quickstart** (docs.tide.org) |
| TideCloak chưa chạy được lúc 14:00 | Hỏi **Discord #support** + mentor tại phòng ngay, không tự loay hoay quá 20 phút |
| Không kịp làm đủ tính năng | Cắt bớt, chỉ giữ 4 bước ở mục 5 |
| Video > 100MB | Nén lại 720p trong HandBrake |
| Gần 18:00 vẫn còn lỗi | Ghi chú lỗi trong README, **vẫn nộp đúng giờ**. Nộp muộn thì mất hết |

---

## 8. Luật quan trọng cần nhớ

- **Không đổi tên repo** sau khi nộp form (đổi tên thì link đổi theo)
- **Không commit mật khẩu, token, file `.env`**
- **Không sửa repo sau 18:00**
- README overview **≤ 300 chữ**; mục Setup để riêng, không tính vào 300 chữ
