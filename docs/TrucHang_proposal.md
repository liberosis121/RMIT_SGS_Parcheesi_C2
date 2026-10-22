# Proposal: Khiên Nhà – Lá chắn lừa đảo cho bố mẹ

**Người đề xuất:** Trúc Hằng · **Ngày:** 22/10/2026 · **Cho:** Challenge 2 – Tide UNLOCKED
**Tên tạm:** *Khiên Nhà* (có thể đổi)

---

## 0. Tóm tắt

Khiên Nhà là "ví hai chìa" cho gia đình. Bố mẹ lớn tuổi vẫn tự chi tiêu hằng ngày, nhưng **khoản chuyển từ 10 triệu trở lên chỉ đi được khi có thêm một người con (do chính bố mẹ chọn) duyệt**. Không ai phá được luật này một mình: kẻ lừa đảo, người con, kể cả nhóm làm app có toàn quyền server.

Điểm mấu chốt: lừa đảo giả danh công an **không phá mật khẩu, nó thuyết phục chính chủ bấm chuyển**. Mọi lớp xác thực hiện nay chỉ chứng minh "đúng là mẹ", mà trong vụ lừa thì chính mẹ là người bấm.

---

## 1. Vấn đề

- Theo khảo sát năm 2024 của Hiệp hội An ninh mạng Quốc gia (NCA), thiệt hại do lừa đảo trực tuyến ước tính **18.900 tỷ đồng (~744 triệu USD)**. **62,08%** người tham gia từng nhận cuộc gọi giả danh cơ quan, tổ chức như công an, thuế, ngân hàng.
- Bộ Công an cho biết từ năm 2020 nạn nhân đã mất gần **40.000 tỷ đồng** qua hơn 24.000 vụ lừa đảo trực tuyến. Giả danh công an, viện kiểm sát, toà án là một trong những thủ đoạn phổ biến nhất.
- Năm 2025, công an Cao Bằng triệt phá một đường dây giả danh công an, dụ nạn nhân cài **app VNeID giả có mã độc**, chiếm hơn **160 tỷ đồng** của gần 400 người.
- Các vụ người già bị lừa xuất hiện liên tục, ví dụ một cụ bà bị kẻ giả danh công an lừa gần **2 tỷ đồng**.

Người già bị nhắm tới vì họ có tiền tiết kiệm, tin "cơ quan chức năng", và thường ở một mình khi nhận cuộc gọi.

## 2. Vì sao giải pháp hiện tại không đủ (trust constraint)

| Cách làm hiện nay | Ai nắm quyền | Hỏng ở đâu |
|---|---|---|
| Mẹ tự lo, ngân hàng bắt xác thực sinh trắc học khi chuyển > 10 triệu (QĐ 2345/QĐ-NHNN, từ 1/7/2024) | Mẹ | Sinh trắc học chứng minh **đúng là mẹ**. Nhưng trong vụ lừa, chính mẹ là người bấm chuyển. Mã độc trên điện thoại còn lấy được cả OTP. |
| Con giữ luôn tài khoản, mật khẩu của bố mẹ | Người con | Con có **toàn quyền** rút tiền của bố mẹ. Bố mẹ mất tự chủ. Lạm dụng tài chính người già cũng là chuyện có thật. |
| App hoặc ngân hàng làm tính năng "người thân duyệt chéo" | Server của app/ngân hàng | Luật "phải có người duyệt" chỉ là **một dòng trong database**. Admin, nhân viên nội bộ, hacker chiếm server, hoặc người con rành công nghệ làm admin tài khoản gia đình đều có thể sửa, tắt, hoặc giả lập một lượt duyệt. |

**Kết luận:** muốn bảo vệ bố mẹ thì hiện nay phải **trao quyền cho một ai đó** (con, nhà cung cấp app, ngân hàng). Người được trao quyền lại trở thành điểm yếu mới. Đây đúng là đánh đổi "power vs trust" mà đề bài nói tới.

## 3. Giải pháp: Khiên Nhà

**Luật của app:**
1. **Dưới 10 triệu:** bố mẹ tự chuyển, không cần ai. *(Giữ quyền tự chủ cho người già, không biến app thành công cụ kiểm soát.)*
2. **Từ 10 triệu trở lên:** giao dịch ở trạng thái **chờ**. Phải có **bố mẹ + ít nhất 1 người con** cùng duyệt thì mới có hiệu lực.
3. **Người duyệt không tự khởi tạo** được giao dịch từ tài khoản của bố mẹ. Họ chỉ có quyền "chìa thứ hai".
4. **Đổi luật** (thêm/bớt người duyệt, đổi ngưỡng) cũng phải qua quorum. Không ai tự âm thầm gỡ người duyệt khác.
5. Mọi yêu cầu, lượt duyệt, lượt từ chối đều có **lịch sử**.

**Ngưỡng 10 triệu** khớp với ngưỡng sinh trắc học của NHNN, nên dễ giải thích: *"sinh trắc học xác nhận đúng là mẹ, Khiên Nhà xác nhận cả nhà đồng ý"*.

## 4. Bài test "nếu chỉ dùng login thường thì sao?"

| Tình huống | App dùng login + phân quyền thường | Khiên Nhà + TideCloak |
|---|---|---|
| Kẻ lừa đảo thuyết phục mẹ chuyển 200 triệu | Bị chặn *nếu* luật trên server còn nguyên | Bị chặn: quyền chuyển khoản lớn chỉ xuất hiện khi có lượt duyệt thật của người con |
| Mã độc lấy được mật khẩu, OTP của mẹ | Kẻ gian chuyển được nếu luật bị tắt hoặc bị sửa | Vẫn bị chặn: cần chìa của người con, nằm trên thiết bị khác |
| Người con làm "admin gia đình" tự gỡ người duyệt khác, hạ ngưỡng | **Làm được**, vì admin có toàn quyền | Thành change request **chờ quorum** |
| Dev/nội gián có root server sửa DB thành "đã duyệt" | **Làm được**, server là nguồn sự thật | Ngân hàng từ chối: không có token/chữ ký hợp lệ từ Tide Fabric |
| Dev lấy khoá ký JWT của hệ thống auth để tự ký token | **Làm được** với Keycloak thường (khoá nằm trong DB của Keycloak) | **Không có khoá để lấy**: token được ký phân tán bởi Fabric, khoá không bao giờ được ghép lại |

Vì vậy nếu thay TideCloak bằng login thường, app **vẫn chạy được trên màn hình**, nhưng lời hứa "không ai phá được luật này một mình" **sẽ sai**. Lời hứa đó chính là giá trị của sản phẩm.

## 5. Mô hình tin cậy

| Vai | Tin đến đâu |
|---|---|
| **Bà Lan** (mẹ, 68 tuổi, dữ liệu giả) | Chủ tài khoản. Tin về danh tính, nhưng có thể bị lừa |
| **Thảo** (con gái), **Minh** (con trai) | Người duyệt. Mỗi người riêng lẻ có thể bị hack hoặc có ý xấu |
| **Nhóm làm Khiên Nhà** (server + DB) | **Không tin.** Có root vẫn không được phép tự duyệt hay tự chuyển |
| **MockBank** (ngân hàng giả lập, service riêng) | Bên xác minh. Chỉ tin token/chữ ký kiểm được bằng public key của TideCloak |
| **TideCloak + Tide Fabric** | Không tin một node nào. Quyền chỉ xuất hiện khi đủ ngưỡng node và đủ người duyệt |

## 6. Thiết kế kỹ thuật

```
 [Trình duyệt: bà Lan / Thảo / Minh]
        │  đăng nhập TideCloak (BYOiD)
        ▼
 [Khiên Nhà – Next.js :3000]  ── tạo change request ──►  [TideCloak :8080, realm khien-nha, bật QEA]
        │                                                      │  quorum đạt → role được cấp
        │  gửi giao dịch + access token                        │  token ký bởi Tide Fabric
        ▼                                                      ▼
 [MockBank – Express :4000]  ── verify JWT qua JWKS của realm ──┘
        (sổ cái giả, JSON in-memory)
```

### Hướng B – làm chính (dựa trên QEA, đã có trong docs)

Theo docs, QEA (Quorum-Enforced Authorization) đưa mọi thay đổi role/permission ảnh hưởng tới JWT vào hàng chờ. Ngưỡng là `max(1, floor(0.7 × N))` người có role `tide-realm-admin`. Với 3 admin thì cần 2 người duyệt.

1. **Realm `khien-nha` bật QEA.** Ba user: `ba-lan`, `thao`, `minh`, đều có `tide-realm-admin`. Client `mock-bank` có role `chuyen-khoan-lon`, mặc định không ai có.
2. **Bàn giao realm.** Theo docs, người dựng realm là admin đầu tiên. Sau khi thêm 3 thành viên gia đình, **phải gỡ quyền admin của tài khoản dev** (việc này cũng qua quorum). Còn lại 3 admin, cần 2 người duyệt. Đây là bước làm cho câu "nhóm làm app cũng không làm được" thành sự thật.
3. **Giao dịch < 10 triệu:** Khiên Nhà gửi giao dịch kèm access token của bà Lan. MockBank verify JWT qua JWKS (`/realms/khien-nha/protocol/openid-connect/certs`), kiểm tra `sub` là chủ tài khoản, rồi thực hiện.
4. **Giao dịch ≥ 10 triệu:** Khiên Nhà tạo change request gán role `chuyen-khoan-lon` cho bà Lan. TideCloak trả `202 Accepted`, trạng thái `PENDING`. Chi tiết giao dịch (số tiền, người nhận) được hiển thị cho người duyệt.
5. **Duyệt:** bà Lan và Thảo lần lượt xác thực rồi bấm authorize trong approval enclave của Tide (hoặc hộp "QEA Approvals" trên tide-console). Đủ 2/3 thì change request tự commit.
6. **Thực hiện:** bà Lan refresh token, token mới có role `chuyen-khoan-lon`. MockBank thực hiện giao dịch, ghi lịch sử, đánh dấu lượt cấp quyền đã dùng. Khiên Nhà gửi yêu cầu thu hồi role.

**Cảnh "đổi luật bị chặn" có sẵn, không tốn thêm code:** người duyệt chính là `tide-realm-admin`, nên việc Minh gỡ Thảo khỏi danh sách duyệt là gỡ role admin. QEA tự đưa việc này vào hàng chờ.

### Hướng A – nâng cấp nếu kịp (Forseti)

Viết contract C# `FamilyTransferPolicy` (loại `EXPLICIT`):
- `ValidateData`: kiểm tra payload `{from, to, amount, nonce}`.
- `ValidateApprovers`: yêu cầu ≥ 1 doken có role người duyệt, khác người yêu cầu.

Kết quả là một **chữ ký Ed25519 trên đúng giao dịch đó**, và MockBank verify chữ ký này. Lượt duyệt khi đó **gắn với số tiền và người nhận cụ thể**, chặt hơn Hướng B.

**Chưa chắc làm được:** docs chưa có ví dụ gắn doken của nhiều người duyệt. Cần xem repo KeyleSSH (`sashyo/keylessh`) hoặc hỏi Raziel MCP/mentor. **Chốt dùng A hay B trước 13:30**, không quá 30 phút.

### Dữ liệu giả
- Tài khoản bà Lan: 850.000.000 đ.
- Người nhận: "Cháu Bin" (học phí), "TK tạm giữ – Đại úy Hùng" (lừa đảo).
- Lịch sử: vài giao dịch nhỏ có sẵn.

## 7. Kịch bản demo

**MVP** (đúng 4 bước ở mục 5 của plan):

| # | Cảnh | Chứng minh |
|---|---|---|
| 1 | Bà Lan, Thảo, Minh đăng nhập bằng TideCloak | Đăng nhập Tide |
| 2 | Bà Lan chuyển 2 triệu cho cháu → xong ngay | Không tước quyền tự chủ |
| 3 | "Đại úy Hùng" gọi điện. Bà Lan chuyển 200 triệu → **"Chờ người thân duyệt"** | Hành động nhạy cảm bị giữ lại |
| 4 | Dev mở DB, sửa thành `approved`, gửi kèm token tự ký → MockBank: **401 chữ ký không hợp lệ** | Người có root server cũng bị chặn |
| 5 | Thảo thấy người nhận lạ, gọi mẹ, bấm **Từ chối** | Chìa thứ hai hoạt động |
| 6 | Bà Lan chuyển 30 triệu học phí. Thảo duyệt → **thành công**, lịch sử ghi ai duyệt, lúc nào | Quyền chỉ xuất hiện khi đủ người |

**Thêm nếu kịp:** tài khoản Minh bị chiếm. Kẻ gian dùng nó gỡ Thảo khỏi danh sách duyệt → **chờ quorum**.

**Phân bổ 2 phút:**
- **0:00–0:20:** "Lừa đảo không phá mật khẩu, nó thuyết phục chính chủ."
- **0:20–0:45:** Sinh trắc học chỉ chứng minh đúng là mẹ. Cách duy nhất hiện nay là trao quyền cho ai đó.
- **0:45–1:40:** Cảnh 2 → 6.
- **1:40–2:00:** Bố mẹ vẫn tự chủ, cả nhà có "nút tạm dừng", không ai (kể cả chúng tôi) vượt luật được.

## 8. Kế hoạch build (khớp timeline trong plan)

| Giờ | Việc |
|---|---|
| 11:45–12:00 | Chạy TideCloak bằng Docker, cài Raziel MCP |
| 13:00–13:30 | Scaffold Next.js theo Quickstart, đăng nhập được. **Hỏi mentor 3 câu bên dưới, chốt Hướng A/B** |
| 13:30–14:00 | Bật QEA, tạo 3 user + role, bàn giao realm (gỡ admin dev). MockBank verify JWT |
| 14:00 | ⛳ Checkpoint 1: đăng nhập + MockBank nhận token |
| 14:00–15:30 | Luồng < 10 triệu, luồng ≥ 10 triệu (change request → duyệt → token có role → chuyển), lịch sử, script "token giả" |
| 15:30 | ⛳ Feature freeze |

**3 câu cần hỏi mentor/Raziel MCP trước 13:30:**
1. App có tạo được change request gán role qua Admin REST API, bằng token của user có `tide-realm-admin` không? Người duyệt có duyệt được ngoài tide-console không?
2. Forseti `EXPLICIT`: gắn doken của nhiều người duyệt vào `BaseTideRequest` như thế nào? Có sample không?
3. Khi gỡ admin của tài khoản dev, có bước nào khiến dev vẫn giữ quyền ngầm không (ví dụ realm `master`)?

## 9. Điểm yếu (tự phản biện, mời AI soi kỹ)

1. **Hướng B: lượt duyệt gắn với role, không gắn với giao dịch.** Người duyệt đồng ý "cho mẹ một lần chuyển khoản lớn", không ký vào "200 triệu cho tài khoản X". Chi tiết chỉ hiển thị trên Khiên Nhà, vốn là bên không được tin. Chỉ Hướng A mới gắn chữ ký với giao dịch.
2. **Người duyệt phải là `tide-realm-admin`.** Bà Lan thành "admin", nghe lạ về UX. Với ngưỡng 2/3, **hai người con có thể cùng đổi luật mà không cần bà**, nhưng vẫn không tự chuyển tiền của bà được.
3. **MockBank do chính nhóm viết.** Giám khảo có thể hỏi "bank cũng là của các bạn mà". Trả lời: MockBank đóng vai bên xác minh độc lập, chỉ tin public key của TideCloak. Ngoài đời, đó là ngân hàng.
4. **Kẻ lừa đảo sẽ thích nghi:** giả danh luôn người con, hoặc ép cả người con duyệt. Ngoài phạm vi prototype. Chỉ giảm nhẹ bằng cách hiển thị rõ người nhận và cảnh báo.
5. **Nguy cơ thành công cụ kiểm soát người già.** Giảm nhẹ: dưới ngưỡng bố mẹ tự chủ, bố mẹ tự chọn người duyệt, người duyệt không khởi tạo được giao dịch.
6. **Thực tế triển khai** cần ngân hàng chấp nhận verify token/chữ ký Tide. Đây là hướng tương lai, không demo được.
7. **Pattern "N người duyệt" không mới** (giống ý quỹ lớp). Góc mới nằm ở chỗ **người cần bảo vệ chính là chủ tài khoản**, và mối đe doạ là "chính chủ bị lừa", không phải kẻ trộm.
8. **Rủi ro kỹ thuật lớn nhất:** luồng app tự tạo change request rồi đọc lại token có role chưa ai trong nhóm chạy thử. Nếu tới 14:00 chưa thông, phải cắt còn cảnh 3 + 4 + 6.

## 10. Tự chấm theo tiêu chí 4.2 của plan

| Tiêu chí | Điểm | Lý do |
|---|---|---|
| Qua test "login thường" | **4/5** (5 nếu làm được Hướng A) | 3 trong 5 tình huống ở mục 4 mà app thường chịu thua. Trừ điểm vì điểm yếu #1 |
| Demo 2 phút dễ hiểu | **5/5** | Ai cũng biết lừa đảo giả danh công an. Có cảnh "chính dev bị chặn" |
| Kịp 15:30 | **3/5** | Hướng B dựa trên QEA đã có docs nhưng chưa chạy thử. Hướng A rủi ro cao |
| Mới lạ | **4/5** | Multisig không mới, nhưng góc "bảo vệ chính chủ khỏi bị lừa" và bối cảnh Việt Nam ít gặp |

## 11. Nháp README (tiếng Anh, nếu chọn ý này)

**One-sentence description:** Khiên Nhà is a two-key family wallet: large transfers from an elderly parent's account only go through when a child they trust also approves, and no one else, not even us, can override that rule.

**1. Vision & originality.** Phone scams in Vietnam don't break passwords; they persuade the real owner. Khiên Nhà lets elderly parents keep everyday control of their money, while any transfer of 10 million VND or more waits for a second key held by a child they chose.

**2. Trust constraint insight.** Biometric checks prove it is really Mom pressing "send", and in a scam that is exactly the problem. Today the only fix is handing power to someone: a child who could drain the account, or a vendor whose server can be hacked, bribed or quietly reconfigured.

**3. Value & impact.** Parents stay independent for small payments. Families get a pause button on the one transfer that would wipe out a lifetime of savings. Scammers who steal passwords or plant malware still hit a wall.

**4. Why TideCloak matters.** With ordinary login, the co-sign rule is a row in our database that any admin can edit. With TideCloak, the authority to move a large sum only emerges when the Tide Fabric sees real approvals from the parent and a child, and changing the rule needs the same quorum. There is no master key: not the son, not the scammer, not our developers.

**5. Prototype & storytelling.** Mom sends 2 million VND alone. A fake police officer pushes her to send 200 million; it waits. Our developer, with full server access, marks it approved; the bank rejects the forged token. Her daughter spots the strange recipient and denies it, then approves a real tuition payment, with a full audit trail.

---

## Nguồn

- Tide UNLOCKED: https://tide.org/unlocked/
- TideCloak Core Concepts: https://docs.tide.org/Core-Concepts/core-concepts
- TideCloak QEA workflow: https://docs.tide.org/Core-Concepts/iga-workflow
- TideCloak Forseti engine: https://docs.tide.org/Core-Concepts/forseti-engine
- Thiệt hại lừa đảo 2024 (NCA): https://tuoitrenews.vn/news/society/20241217/vietnamese-lose-744mn-to-online-scams-in-2024-report/83436.html
- Thiệt hại từ 2020 (Bộ Công an): https://kynguyenvuonminh.vov.vn/en/society/online-scams-cost-vietnamese-victims-nearly-us16-billion-say-police-post1257628.vov
- Đường dây VNeID giả (2025): https://news.tuoitre.vn/nearly-400-vietnamese-lose-over-6mn-in-cambodia-based-fake-police-scam-103250916132759731.htm
- Cụ bà bị lừa gần 2 tỷ: https://baonghean.vn/en/cu-ba-bi-ke-gia-danh-cong-an-lua-gan-2-ty-dong-10282550.html
