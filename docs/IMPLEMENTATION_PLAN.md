# Implementation Plan – Challenge 2 (Tide UNLOCKED)

**Team:** Parcheesi · **Repo / tên nhóm nộp:** `RMIT_SGS_Parcheesi_C2`
**Người làm C2:** Yến + Hằng (Sỹ làm C1)
**Ý tưởng đã chốt (11:50):** **Khiên Nhà – Family Shield**. Chi tiết: [TrucHang_proposal.md](TrucHang_proposal.md), lý do chọn: [KimYen_Rebuttal.md](KimYen_Rebuttal.md)
**Deadline:** **18:00 hôm nay, 22/10/2026**. Từ 18:00 trở đi **không push gì nữa**.

---

## 1. Phải nộp gì (checklist cuối cùng)

- [ ] Repo GitHub **public**, tên `RMIT_SGS_Parcheesi_C2` (repo này)
- [ ] App chạy được, **có tích hợp TideCloak**, dùng dữ liệu giả
- [x] `README.md`: 1 câu mô tả + overview đủ 5 mục (**hiện 297 chữ, giữ ≤ 300**)
- [ ] `README.md`: mục **Setup** và **Limitations** điền xong
- [ ] `demo.mp4`: **2 phút**, **< 100 MB**, nằm ở gốc repo
- [ ] Nộp link repo qua Google Form `forms.gle/HRHYjnqB86j1LFS97`, tên nhóm `RMIT_SGS_Parcheesi_C2`

---

## 2. Spec Khiên Nhà (một trang)

| | |
|---|---|
| **Câu mô tả** | Ví hai chìa cho gia đình: khoản chuyển lớn của bố mẹ chỉ đi được khi có thêm một người con (do bố mẹ chọn) duyệt. Server, DB hay admin đều không giả được lượt duyệt |
| **Vai** | **Bà Lan** (mẹ, 68 tuổi, chủ tài khoản 850.000.000đ) · **Thảo** (con gái, người duyệt) · **Minh** (con trai, người duyệt) · **Dev** (nhóm mình, có root server, *không được tin*) |
| **Hành động nhạy cảm** | Chuyển khoản **≥ 10 triệu** |
| **Luật** | < 10 triệu: bà Lan tự chuyển · ≥ 10 triệu: cần bà Lan **+ ít nhất 1 người con** duyệt · Người con không tự khởi tạo giao dịch · Đổi luật cũng cần quorum |
| **Cơ chế Tide** | QEA/IGA: giao dịch lớn = change request gán role `chuyen-khoan-lon` (hoặc role riêng cho từng giao dịch, xem 4.3) → đủ người duyệt thì role xuất hiện trong token do **Tide Fabric ký** → MockBank kiểm token |
| **Người nhận giả** | "Cháu Bin" (học phí 30 triệu) · "TK tạm giữ – Đại úy Hùng" (lừa đảo, 200 triệu) |

### Kiến trúc
```
[Trình duyệt bà Lan / Thảo / Minh] ── đăng nhập + DUYỆT gọi THẲNG ──► [TideCloak :8080, realm khien-nha, bật IGA]
        │                                                                 │ token ký bởi Tide Fabric
        ▼                                                                 ▼
[Khiên Nhà – Next.js :3000] ── giao dịch + access token ──► [MockBank – Express :4000]
                                                             kiểm JWT bằng createLocalJWKSet(config.jwk)
```

---

## 3. Phân vai

| | **Yến: Builder** | **Hằng: Story & QA** |
|---|---|---|
| Vai chính | Cài TideCloak, điều khiển Claude Code + Tide MCP, viết app, git push | README, kịch bản và dựng video, dữ liệu giả, test app, hỏi mentor |
| README | Mục **Setup** | Giữ overview ≤ 300 chữ, mục **Limitations** |
| Video | Thao tác app khi quay | Kịch bản, đọc lời, dựng, nén < 100MB |
| Nộp bài | Push lần cuối | Kiểm tra repo bằng tab ẩn danh, **điền Google Form** |

---

## 4. Build: Yến làm theo thứ tự này

### 4.1. Các playbook Tide MCP cần dùng (theo thứ tự)
1. `start-tidecloak-dev`: chạy TideCloak bằng Docker
2. `add-auth-nextjs-fresh`: scaffold Next.js + đăng nhập (`npm init @tidecloak/nextjs@latest`, có bước **đăng ký tài khoản Tide**, cần làm cho cả 3 user)
3. `setup-iga-admin-panel`: giao diện xem và **duyệt change request ngay trong app**
4. `verify-jwt-server-side`: MockBank kiểm token

Gợi ý mở đầu cho Claude Code: *"Use the Tide MCP. Call tide_choose_scenario for: a family wallet where an elderly parent's transfers ≥ 10M VND need a child's approval via IGA change requests that grant a role; a separate Express MockBank verifies the Fabric-signed JWT with createLocalJWKSet. Then follow the playbooks start-tidecloak-dev, add-auth-nextjs-fresh, setup-iga-admin-panel, verify-jwt-server-side."*

### 4.2. ⚠️ Ba luật không được phá
1. **Nút "Duyệt" gọi thẳng từ trình duyệt** lên `POST {TideCloak}/admin/realms/khien-nha/iga/change-requests/{id}/approve` bằng token của chính người duyệt. **Không đi qua server Next.js.** Đi qua server thì lượt duyệt bị tính cho tài khoản server và bộ đếm kẹt ở 1/2.
2. **MockBank dùng `createLocalJWKSet(config.jwk)`** từ file adapter, không lấy JWKS qua mạng.
3. **Không lưu doken / token trên server**, không commit file `.env` hay mật khẩu.

### 4.3. Hai thử nghiệm có giới hạn giờ
| Thử | Mục đích | Giới hạn | Nếu không được |
|---|---|---|---|
| Ngưỡng duyệt riêng cho role (`iga.approverRole` + `iga.threshold` trên role `chuyen-khoan-lon`) | Bà Lan và các con không cần làm `tide-realm-admin` | **20 phút**, chốt 14:00 | Dùng thiết kế của Hằng: cả 3 là `tide-realm-admin`, ngưỡng 2/3 |
| Role riêng cho từng giao dịch (`tx-<id>-<số tiền>-to-<TK>`) | Lượt duyệt gắn đúng số tiền + người nhận | Chốt **14:30** | Dùng role chung `chuyen-khoan-lon`, ghi giới hạn vào README |

### 4.4. Lưu ý khi demo
- Sau khi duyệt, role có thể **trễ tới 120 giây** mới vào token: **đăng nhập lại** hoặc cắt đoạn chờ trong video.
- Mỗi người dùng **một cửa sổ ẩn danh / profile trình duyệt riêng** để đăng nhập song song 3 tài khoản.

---

## 5. Timeline (theo agenda, cập nhật 11:55)

| Giờ | Yến (Builder) | Hằng (Story & QA) |
|---|---|---|
| **11:55 – 12:00** | `docker pull tideorg/tidecloak-dev:latest` (để chạy trong giờ ăn) | **Hỏi mentor câu realm `master`** (mục 7) |
| **12:00 – 13:00** | 🍱 Ăn trưa | 🍱 Ăn trưa |
| **13:00 – 13:30** | Playbook 1–2: TideCloak chạy, Next.js đăng nhập được | Tạo **3 tài khoản Tide** cùng Yến (bà Lan, Thảo, Minh); viết **dữ liệu giả** JSON |
| **13:30 – 14:00** | Bật IGA trên realm `khien-nha`, tạo role; thử 4.3 (ngưỡng riêng) | Viết **kịch bản video** từng câu (mục 6) |
| **14:00** | ⛳ **Checkpoint 1:** đăng nhập + tạo được change request. Chưa được thì hỏi Discord #support / mentor **ngay** | |
| **14:00 – 15:30** | Luồng < 10tr → luồng ≥ 10tr (tạo CR → duyệt trong app → token có role → MockBank chuyển) → nút Từ chối → lịch sử → script "dev giả token". Chốt 4.3 role theo giao dịch lúc **14:30** | Test từng phần khi Yến xong, báo lỗi; điền mục **Limitations** theo câu trả lời của mentor |
| **15:30** | ⛳ **Checkpoint 2: FEATURE FREEZE.** Cảnh 1–3 + 6 ở mục 6 phải chạy được. Sau mốc này **không thêm tính năng** | |
| **15:30 – 16:00** | Sửa lỗi; viết mục **Setup** | Chạy thử toàn bộ kịch bản trên app thật; đếm chữ README (≤ 300) |
| **16:00 – 16:30** | 🎬 **CẢ HAI: QUAY VIDEO** (Yến thao tác, Hằng đọc lời). Quay 2–3 lần | |
| **16:30 – 17:00** | Dọn repo (file thừa, `.gitignore`, không có secret) | Dựng video, nén `demo.mp4` < 100MB |
| **17:00 – 17:20** | Push code + README + `demo.mp4` | Đọc lại README lần cuối |
| **17:20 – 17:40** | ⛳ **Checkpoint 3:** mở repo bằng **tab ẩn danh**: public? README đúng? video xem được? | **Điền Google Form** |
| **17:40 – 18:00** | Dự phòng, chỉ sửa typo. **18:00 dừng hẳn** | |

---

## 6. Demo & kịch bản video 2 phút

| # | Cảnh | Bắt buộc? | Chứng minh |
|---|---|---|---|
| 1 | Bà Lan, Thảo, Minh đăng nhập bằng TideCloak | ✅ MVP | Đăng nhập Tide |
| 2 | Bà Lan chuyển 2 triệu cho cháu → xong ngay | ✅ MVP | Bố mẹ vẫn tự chủ |
| 3 | "Đại úy Hùng" gọi điện; bà Lan chuyển 200 triệu → **"Chờ người thân duyệt"** | ✅ MVP | Giao dịch lớn bị giữ lại |
| 4 | Dev sửa DB thành `approved` + gửi token tự ký → MockBank **401** | ⭐ Nên có | Người có root server cũng bị chặn |
| 5 | Thảo thấy người nhận lạ → **Từ chối** | ⭐ Nên có | Chìa thứ hai hoạt động |
| 6 | Bà Lan chuyển 30 triệu học phí, Thảo duyệt → **thành công**, lịch sử ghi ai duyệt | ✅ MVP | Quyền chỉ xuất hiện khi đủ người |
| 7 | Tài khoản Minh bị chiếm, kẻ gian gỡ Thảo khỏi người duyệt → **chờ quorum** | Nếu kịp | Đổi luật cũng cần quorum |

| Thời lượng | Phần | Lời dẫn chính |
|---|---|---|
| 0:00 – 0:20 | **The possibility** | *"Phone scams are prompt injection, aimed at humans."* Lừa đảo không phá mật khẩu, nó thuyết phục chính chủ |
| 0:20 – 0:45 | **The constraint** | Sinh trắc học chỉ chứng minh đúng là mẹ. Cách duy nhất hiện nay là trao quyền cho con hoặc cho một công ty |
| 0:45 – 1:40 | **The prototype** | Cảnh 2 → 6, chỉ rõ TideCloak làm gì |
| 1:40 – 2:00 | **What changes** | *"Scammers don't hack passwords, they hack people. Khiên Nhà makes sure no single person (not Mom under pressure, not a hijacked phone, not even our server) can move a lifetime of savings alone."* |

Công cụ quay: **OBS** hoặc **Xbox Game Bar** (`Win + Alt + R`). Nén: HandBrake hoặc Clipchamp.

---

## 7. Câu hỏi cho mentor / Discord #support (Hằng hỏi trước 13:00)

1. *"Can a `master`-realm admin change roles in a realm with IGA enabled without going through the quorum?"* Nếu **có**: README ghi rõ là giới hạn, video nói "our server and database" chứ không nói "nobody".
2. *"Does a role-level `iga.approverRole` / `iga.threshold` apply in Tide MultiAdmin mode, or only the realm admin policy threshold?"*
3. *"Can the app create a role-assignment change request with a user's own token, and approvers approve it from our own UI?"*

---

## 8. Phương án dự phòng

| Sự cố | Xử lý |
|---|---|
| Tide MCP không cài được vào Claude Code | Dùng template **TideCloak Quickstart**; Tide MCP vẫn gọi được bằng `curl` tới `https://mcp.tide.org/mcp` |
| TideCloak chưa chạy được lúc 14:00 | Hỏi **Discord #support** + mentor ngay, không loay hoay quá 20 phút |
| Duyệt trong app không chạy được | Duyệt trên **tide-console** (hộp QEA Approvals), quay video ở đó |
| Không kịp | Cắt còn cảnh 1, 2, 3, 6 |
| Video > 100MB | Nén lại 720p bằng HandBrake |
| Gần 18:00 vẫn còn lỗi | Ghi chú lỗi trong README, **vẫn nộp đúng giờ** |

---

## 9. Luật quan trọng cần nhớ

- **Không đổi tên repo** sau khi nộp form
- **Không commit mật khẩu, token, file `.env`**
- **Không sửa repo sau 18:00**
- README overview **≤ 300 chữ** (mục Setup và Limitations không tính)
- **Không nói quá** trong README / video: nói đúng những gì app chứng minh được
