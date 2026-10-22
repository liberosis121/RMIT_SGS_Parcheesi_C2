# Phản biện & so sánh: Khiên Nhà vs Unbribable Agent

**Người viết:** Trúc Hằng (soạn cùng Claude) · **Ngày:** 22/10/2026
**So sánh:** [TrucHang_proposal.md](TrucHang_proposal.md) (Khiên Nhà) và ý #1 trong [KimYen_Proposal.md](KimYen_Proposal.md) (Unbribable Agent). Các ý #2–#4 của Yến tự xếp sau #1 nên không so ở đây.

> **Lưu ý về thiên vị:** proposal Khiên Nhà cũng do Claude soạn. Để công bằng, cả hai bị hỏi **cùng một bộ câu hỏi**. Các khẳng định kỹ thuật của **cả hai** đều được kiểm chứng trực tiếp với Raziel MCP (`https://mcp.tide.org/mcp`, bản 1.9.33), không tin lời proposal nào.

---

## 0. Kết luận nhanh

**Chọn Khiên Nhà, và mượn góc "AI" của Yến làm câu chuyện nối với C1.**

Hai ý thực chất **cùng một cơ chế**: một bên có quyền nhưng **bị thao túng** (mẹ bị lừa qua điện thoại / AI bị prompt injection). Khoản chi lớn cần thêm **một chìa của người thứ hai**. Server không giả được lượt duyệt. Vì vậy quyết định nằm ở 3 điểm:

1. **Khả thi (đã kiểm chứng):** thiết kế chính của Unbribable Agent dựa vào **contract Forseti tự viết**. Theo Raziel MCP, loại contract này **không tự deploy được**: phải nhờ team Tide deploy, còn đang thử nghiệm, chỉ chạy trên test network. Khiên Nhà dựa vào **QEA/IGA**, chạy được ngay trên realm của mình.
2. **Mới lạ:** "AI agent có quyền tới đâu?" là một trong 3 tình huống **chính trang Tide UNLOCKED** gợi ý, và cũng nằm sẵn trong plan của nhóm. Khả năng cao nhiều nhóm sẽ làm. Lừa đảo người già ở Việt Nam thì ít nhóm nghĩ tới.
3. **Impact có số liệu:** Khiên Nhà có số liệu thiệt hại thật (18.900 tỷ đồng năm 2024). Unbribable Agent nói về một thị trường tương lai, chưa có số liệu.

Unbribable Agent **thắng rõ ở một điểm**: hợp chủ đề "Security of AI" và nối được với C1. Khiên Nhà lấy lại phần lớn điểm này chỉ bằng một câu chuyện nối (mục 5), không tốn thêm code.

---

## 1. Kiểm chứng khẳng định kỹ thuật

### Proposal của Yến

| Khẳng định | Kết quả kiểm chứng |
|---|---|
| Raziel MCP ở `https://mcp.tide.org/mcp` | ✅ Đúng |
| Có playbook `add-auth-nextjs-fresh`, `add-rbac-nextjs`, `setup-forseti-e2ee` | ✅ Có |
| `policy-governed-signing` là **playbook** | ⚠️ Thực ra là **scenario** (ứng dụng mẫu), không phải playbook có sẵn code |
| "Ví dụ có sẵn: khoản chi trên $10,000 cần quản lý duyệt" | ❓ Không tìm thấy trong scenario, manifest và role matrix của `policy-governed-signing` |
| "Rủi ro trung bình thấp vì đã có playbook" | ❌ **Sai.** Scenario ghi rõ: *"Deploying a custom Forseti contract is not self-service... experimental, test-network only, and done by the Tide team."* Contract có sẵn (`RelationshipAttestation:1`) **chỉ cho mã hoá/giải mã, không ký được**. Luật "≤ 2 triệu tự ký, lớn hơn cần chủ + kế toán" là luật ký nên **bắt buộc phải có contract tự viết** |
| Có governance panel (quorum) | ✅ Có scenario `iga-admin-governance` |

**Hệ quả:** prompt mở đầu cho Claude Code trong proposal của Yến ("apply policy-governed-signing... before the Tide Fabric signs") sẽ **kẹt ở bước deploy contract**. Muốn làm Unbribable Agent hôm nay thì phải **thiết kế lại trên QEA**, giống Hướng B của Khiên Nhà.

### Proposal Khiên Nhà (cũng soi như vậy)

| Khẳng định | Kết quả kiểm chứng |
|---|---|
| QEA cần `max(1, floor(0.7 × N))` admin duyệt | ✅ Đúng, và **app không chỉnh được** ngưỡng này |
| App tự tạo và duyệt change request trong giao diện của mình | ✅ Có API `GET /iga/change-requests?status=PENDING` và `POST /iga/change-requests/{id}/approve`, gọi từ trình duyệt bằng token của admin. Ở chế độ nhiều admin, người duyệt ký trong enclave của Tide. Nếu tự host UI thì cần `CustomAdminUIDomain` + `sign-idp-settings` |
| Một người không được tính 2 lần | ✅ Có cơ chế "four-eyes": trả 409 nếu cùng admin duyệt lại |
| Sau khi duyệt, token có role ngay | ⚠️ **Có thể trễ tới 120 giây.** Demo phải đăng nhập lại hoặc cắt video |
| MockBank verify JWT qua JWKS lấy từ mạng | ⚠️ **Anti-pattern AP-PS05.** Nên dùng `createLocalJWKSet(config.jwk)` từ file adapter. Cần sửa thiết kế |
| Hướng A (Forseti) | ❌ Cùng vấn đề như Yến: không tự deploy được. **Bỏ Hướng A**, chỉ nhắc như hướng phát triển sau |
| "Gỡ admin dev là dev hết quyền" | ❓ **Chưa chắc.** Realm `master` không bị QEA quản. Cần hỏi mentor xem admin `master` có sửa được role của realm `khien-nha` mà không qua quorum không. Đây là rủi ro lớn nhất cho câu "chính nhóm làm app cũng không vượt được" |

---

## 2. Phản biện Unbribable Agent

**Điểm mạnh thật sự**
- Đánh đổi "power vs trust" rất rõ: *muốn AI hữu ích thì phải đưa nó chìa khoá*. Đúng câu hỏi của đề.
- Cảnh "email độc bị chặn" rất "wow" với giám khảo kỹ thuật. Slogan *"It can't fool the math"* hay.
- Nối được với C1 (bộ lọc prompt attack). Cả nhóm có một câu chuyện xuyên suốt.

**Điểm yếu**
1. **Thiết kế chính không chạy được hôm nay** (xem mục 1). Phải thiết kế lại trên QEA. Khi đó luật "≤ 2 triệu tự ký" sẽ thành **luật kiểm tra ở ngân hàng giả**, không còn là "mạng Tide tự ký theo policy".
2. **Agent đăng nhập bằng gì?** Đăng nhập Tide là luồng enclave trên trình duyệt, dành cho con người (BYOiD). Một AI chạy nền khó có danh tính Tide riêng. Nếu agent "mượn" phiên đăng nhập của chủ cửa hàng thì **chính agent đang cầm token của chủ**, đúng điều mà pitch nói là tránh. Proposal chưa trả lời câu này.
3. **AI giả lập là "một hàm ngây thơ làm theo email".** Giám khảo dễ thấy cảnh prompt injection là dàn dựng: hàm được viết ra để bị lừa. Gọi LLM thật thì thêm rủi ro.
4. **Đông nhóm làm.** Tide tự gợi ý khung "AI có quyền tới đâu", và plan của nhóm cũng đã liệt kê sẵn. Tự chấm 5/5 cho originality là quá cao.
5. **Impact khó chứng minh.** Doanh nghiệp nhỏ giao quyền thanh toán cho AI là chuyện tương lai, chưa có số liệu thiệt hại như lừa đảo người già.
6. **Bài test "login thường" bị nói hơi quá:** "server giữ token ngân hàng" không phải điều bắt buộc ở app thường. Khác biệt thật vẫn là *không admin nào giả được lượt duyệt*. Lập luận này Khiên Nhà cũng có.

## 3. Phản biện Khiên Nhà

**Điểm mạnh thật sự**
- Insight sắc: *sinh trắc học chứng minh đúng là mẹ, mà chính mẹ là người bị lừa*.
- Có số liệu thật, nạn nhân rõ ràng, câu chuyện ai cũng hiểu trong 10 giây.
- Thiết kế chính đã dựa trên QEA, tính năng **có API thật**. Cảnh "đổi luật cũng cần quorum" có sẵn mà không tốn thêm code.

**Điểm yếu**
1. **Lượt duyệt gắn với role, không gắn với giao dịch.** Người con đồng ý "cho mẹ một lần chuyển khoản lớn", không ký vào "200 triệu cho tài khoản X". Đây là điểm yếu kỹ thuật lớn nhất. Unbribable Agent cũng sẽ gặp y hệt khi chuyển sang QEA.
2. **Dùng tính năng quản trị cho việc nghiệp vụ:** bà Lan và các con phải là `tide-realm-admin`. Người của Tide có thể thấy đây là cách dùng "lách". Với 2/3, hai người con có thể đổi luật mà không cần bà, dù vẫn không tự chuyển tiền của bà được.
3. **Mỗi khoản lớn tốn 2 change request** (cấp role rồi thu hồi), và **trễ tới 120 giây** trước khi role xuất hiện. Demo phải cắt khéo.
4. **Câu "dev cũng không vượt được" chưa chắc đúng**, vì realm `master` (xem mục 1).
5. **"Khả năng mới" yếu hơn:** Khiên Nhà nghe giống "phiên bản an toàn hơn của cái đã có" hơn là "điều trước đây không làm được". Cần đổi cách kể (mục 5).
6. **Không dính tới AI.** Mất điểm nối với C1 nếu chủ đề chung của hackathon là Security of AI (chưa kiểm chứng được, theo lời Yến).

---

## 4. Chấm điểm theo 5 mục README (= tiêu chí chấm) + khả thi

| Tiêu chí | Khiên Nhà | Unbribable Agent | Ghi chú |
|---|---|---|---|
| 1. Vision & originality | **4** | 3 | Agent đúng khung đề nhưng đông nhóm làm |
| 2. Trust constraint insight | 5 | 5 | Cả hai đều sắc |
| 3. Value & impact | **5** | 3 | Số liệu thật so với thị trường tương lai |
| 4. Why TideCloak matters | 4 | 4 | Cùng lập luận "không admin nào giả được lượt duyệt" |
| 5. Prototype & storytelling | 4 | 4 | Agent "wow" hơn với dân kỹ thuật, nhưng AI giả lập dễ bị xem là dàn dựng. Khiên Nhà dễ cảm hơn, nhưng vướng trễ 120 giây |
| **Khả thi trước 15:30** (đã kiểm chứng) | **3** | 2 | Agent phải thiết kế lại và chưa rõ danh tính của agent |
| *Bonus: nối C1 / chủ đề AI* | 2 → 4 nếu làm mục 5 | **5** | Không phải tiêu chí của C2 |
| **Tổng 6 tiêu chí chính** | **25** | **21** | |

Điểm số chỉ để tham khảo. **Lý do quyết định là khả thi và mức độ đông nhóm làm**, không phải vì Khiên Nhà hơn 4 điểm.

---

## 5. Nếu chọn Khiên Nhà, cần sửa gì (mượn điểm mạnh của Yến)

1. **Nối với AI, không tốn code:** mở video bằng câu *"Lừa đảo qua điện thoại chính là prompt injection nhắm vào con người."* Kết video: *"Cùng cơ chế này cũng là cách duy nhất an toàn để giao ví cho một AI agent."* Như vậy là nối với C1 và lấy lại phần lớn điểm bonus.
2. **Kể theo kiểu "khả năng mới":** *"Lần đầu tiên bố mẹ tự dùng ngân hàng số mà không phải giao quyền cho con hay cho bất kỳ công ty nào."*
3. **Sửa thiết kế:**
   - Bỏ Hướng A (Forseti).
   - MockBank dùng `createLocalJWKSet(config.jwk)`.
   - Làm giao diện duyệt ngay trong app qua `/iga/change-requests/{id}/approve`. Nếu kẹt thì dùng tide-console.
   - Demo: đăng nhập lại sau khi duyệt để tránh trễ 120 giây.
4. **Hỏi mentor ngay** (trước 13:00): *"Admin của realm `master` có sửa role trong realm đã bật IGA mà không qua quorum được không?"* Nếu **được**, đổi câu chữ trong demo từ "chính chúng tôi cũng không vượt được" thành "server của app và DB không vượt được", và ghi rõ giới hạn này trong README.
5. **Yến bắt đầu** bằng `tide_choose_scenario` với mô tả Khiên Nhà (khả năng cao sẽ ra `iga-admin-governance`), thay cho prompt `policy-governed-signing`.

## 6. Khi nào nên chọn Unbribable Agent thay vì Khiên Nhà

- Nếu nhóm coi **câu chuyện chung C1 + C2 về AI** quan trọng hơn điểm mới lạ trong C2.
- Nếu **Yến (người build) hứng thú hẳn với Agent**. Người build có hứng thú là lợi thế thật khi chỉ còn vài tiếng.
- Nếu chọn Agent thì bắt buộc: (a) thiết kế lại trên QEA, (b) trả lời câu "agent đăng nhập bằng gì" **trước 13:00**, (c) không dựa vào việc team Tide deploy contract trong ngày.

*Ghi chú:* nếu team Tide trên Discord nhận deploy contract Forseti trong ngày thì **cả hai ý cùng được lợi** (lượt duyệt gắn đúng giao dịch). Vì vậy đây không phải lý do để chọn ý này hơn ý kia.

---

## Nguồn kiểm chứng
- Raziel MCP `https://mcp.tide.org/mcp` (v1.9.33): `tide_list` (playbooks, scenarios), `tide_scenario` (`policy-governed-signing`, `iga-admin-governance`), `tide_scenario_manifest`, `tide_scenario_roles`
- TideCloak QEA workflow: https://docs.tide.org/Core-Concepts/iga-workflow
- TideCloak Forseti engine: https://docs.tide.org/Core-Concepts/forseti-engine
- Tide UNLOCKED: https://tide.org/unlocked/
