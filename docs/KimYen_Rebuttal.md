# Phản biện lại & chốt ý tưởng: Khiên Nhà vs Unbribable Agent

**Người viết:** Kim Yến (soạn cùng Claude) · **Ngày:** 22/10/2026 · **Trả lời:** [TrucHang_comparison.md](TrucHang_comparison.md)

> Mình không tin phản biện của Hằng chỉ vì nó thuyết phục. Mình gọi **trực tiếp** Raziel MCP (`https://mcp.tide.org/mcp`, bản 1.9.33) để đọc lại tài liệu gốc: `custom-contracts`, `agent-authority`, `iga-change-requests-api`, playbook `deploy-forseti-policy`.

---

## 0. Kết luận

**✅ Đồng ý chọn Khiên Nhà.** Unbribable Agent **không làm được đúng như pitch** trong ngày hôm nay. Mình tìm thêm một bằng chứng **còn nặng hơn** những gì Hằng đã nêu (mục 1.2).

Nhưng Khiên Nhà cần **3 sửa đổi** trước khi build (mục 3), trong đó có **một lỗi bảo mật dễ mắc** mà proposal của Hằng chưa nhắc tới.

---

## 1. Những điểm Hằng đúng (mình nhận)

### 1.1. Forseti contract không tự deploy được ✅ Xác nhận
Câu này nằm ngay dòng đầu của cả `custom-contracts` lẫn playbook `deploy-forseti-policy`:
> *"Deploying a custom Forseti contract is not self-service... experimental, test-network only, and done by the Tide team."*

Luật "≤ 2 triệu tự ký, lớn hơn cần chủ + kế toán" bắt buộc phải có contract tự viết, nên **thiết kế chính của Unbribable Agent bị chặn**. Mình đã nhầm khi gọi `policy-governed-signing` là "playbook có sẵn": đó là **scenario** mẫu. Ví dụ "$10,000" mình lấy từ trang giới thiệu tide.org/agent-plugins, không phải từ code chạy được.

### 1.2. AI agent không thể có danh tính Tide ✅ Xác nhận, và còn nặng hơn Hằng nói
Hằng hỏi *"agent đăng nhập bằng gì?"*. Canon `agent-authority` trả lời thẳng:
> *"An autonomous process cannot authenticate to Tide, and cannot produce a signature by itself."*

Không có đăng nhập headless, không có service account, và chỉ ký được từ trình duyệt (GAP-063, GAP-064, `STILL_UNRESOLVED`). Muốn agent "có quyền" thì phải có **một người thật ngồi ở trình duyệt**. Như vậy câu chuyện *"AI tự thanh toán"* chỉ còn là *"AI đề xuất, người duyệt"*, mà phần này thì **Khiên Nhà đã làm rồi**.

### 1.3. Đông nhóm làm ✅ Đồng ý
"AI agent có quyền tới đâu" là ví dụ chính trang UNLOCKED đưa ra. Mình tự chấm originality 5/5 là quá tay.

## 2. Những điểm mình phản biện lại Hằng

| Hằng nói | Mình phản biện |
|---|---|
| *"Ví dụ $10,000 không tìm thấy"* | Có trên trang tide.org/agent-plugins. Nhưng đúng là **không có code chạy được**, nên điểm này không đổi kết luận. |
| *"Người duyệt bắt buộc là `tide-realm-admin`"* (điểm yếu #2) | **Chưa chắc phải như vậy.** Tài liệu IGA có luật: *"entity-level `iga.threshold` applies only if that entity also sets `iga.approverRole`"*. Tức là **từng role có thể có người duyệt và ngưỡng riêng**, không nhất thiết bà Lan phải là admin của cả realm. ⚠️ Ở chế độ MultiAdmin, ngưỡng thực thi lấy từ policy admin đã ký, nên **chưa rõ ngưỡng riêng có áp dụng không**. Đáng thử 20 phút; không được thì quay về thiết kế của Hằng. |
| *"Lượt duyệt gắn với role, không gắn với giao dịch"* (điểm yếu #1, lớn nhất) | **Có cách vá mà không cần Forseti** (mục 3.2). |
| Chấm *Khả thi = 3* | Mình chấm **3** nhưng vì lý do khác: rủi ro lớn nhất không phải QEA mà là **lỗi proxy duyệt** (mục 3.1). Tránh được lỗi này thì có thể lên 4. |
| Kết nối với C1 chỉ bằng câu chuyện | Đồng ý, và nên **đẩy mạnh hơn**: dùng đúng chữ *"social engineering = prompt injection on humans"*. Giám khảo hackathon "Security of AI" sẽ bắt được ngay. |

---

## 3. Ba sửa đổi bắt buộc cho Khiên Nhà

### 3.1. ⚠️ Lượt duyệt phải gửi từ trình duyệt của từng người, KHÔNG qua server app
Proposal của Hằng chưa nhắc lỗi này. Tài liệu `iga-change-requests-api` cảnh báo bằng chữ in hoa:
> *"APPROVALS ARE CREDITED TO THE CALLER, NOT THE DOKEN SUBJECT."*

Nếu Next.js server nhận nút "Duyệt" rồi **thay mặt** người dùng gọi `/approve`, mọi lượt duyệt sẽ bị tính cho **một tài khoản server**. Hậu quả:
- Bộ đếm **kẹt ở 1/2** dù cả nhà bấm duyệt.
- Server đứng ra "đề xuất + duyệt" là **đúng lỗ hổng mà app này sinh ra để chặn**. Giám khảo của Tide sẽ thấy ngay.

👉 **Cách làm đúng:** trình duyệt của bà Lan / Thảo / Minh gọi **thẳng** TideCloak `POST /admin/realms/{realm}/iga/change-requests/{id}/approve` bằng token của chính họ. CORS của realm đã cho phép việc này. Có sẵn **playbook `setup-iga-admin-panel`**: Yến dùng playbook này thay vì tự viết.

### 3.2. Gắn lượt duyệt với đúng giao dịch (vá điểm yếu #1, nâng cấp nếu kịp)
Thay vì một role chung `chuyen-khoan-lon`, **mỗi giao dịch lớn tạo một role riêng** có tên chứa mã giao dịch:

```
tx-7f3a-200000000-to-9704xxxx   ← role tạo cho đúng giao dịch "200 triệu → TK X"
```

- Change request mà Thảo ký sẽ ghi rõ "cấp role `tx-7f3a-200000000-to-9704xxxx` cho bà Lan". Lượt duyệt **gắn với số tiền và người nhận**.
- MockBank chỉ chuyển nếu token (do Fabric ký) chứa role **khớp đúng** mã giao dịch đang gửi, và mỗi role dùng 1 lần.
- Server có đổi số tiền hay người nhận thì mã không khớp, MockBank từ chối.

⚠️ **Chưa chạy thử.** Tạo role mới có thể cũng là một change request (phụ thuộc: role phải có trước khi gán). Nếu tới **14:30** chưa thông thì bỏ, dùng role chung như thiết kế của Hằng và ghi rõ giới hạn này trong README.

### 3.3. Nói đúng giới hạn: trung thực là điểm cộng
Canon của Tide liên tục cảnh báo việc **nói quá** (overstatement). Giám khảo là người của Tide, nên README và video:
- **Không** nói "không ai trên đời vượt được". Nói chính xác: *"server app, DB và người giữ root đều không giả được lượt duyệt hay token"*.
- Câu hỏi về realm `master` (Hằng nêu): **hỏi mentor trước 13:00**. Nếu admin `master` vượt được QEA thì ghi rõ trong README là giới hạn của bản prototype.
- Ghi rõ: *"chiếm được phiên đăng nhập của người duyệt = chiếm được người duyệt"*. Câu này lấy đúng từ canon của Tide.

---

## 4. Bảng điểm cuối (sau khi kiểm chứng)

| Tiêu chí | Khiên Nhà (đã sửa) | Unbribable Agent (thực tế làm được hôm nay) |
|---|---|---|
| Vision & originality | 4 | 3 |
| Trust constraint insight | 5 | 4 (mất câu "AI tự hành động") |
| Value & impact | 5 | 3 |
| Why TideCloak matters | **5** nếu làm được 3.2, nếu không thì 4 | 4 |
| Prototype & storytelling | 4 | 3 (AI giả lập, lại phải có người duyệt) |
| Khả thi trước 15:30 | 3–4 | 2 |
| **Tổng** | **26–27** | **19** |

---

## 5. Chốt và việc cần làm ngay

**Ý tưởng chốt: Khiên Nhà** (tên tiếng Anh cho README / video: **Khiên Nhà – Family Shield**).

| Ai | Làm gì | Hạn |
|---|---|---|
| **Cả hai** | Hỏi mentor câu realm `master` | trước 13:00 |
| **Yến** | Đọc playbook `start-tidecloak-dev` → `add-auth-nextjs-fresh` → `setup-iga-admin-panel` → `verify-jwt-server-side` (MockBank dùng `createLocalJWKSet(config.jwk)`) | bắt đầu 13:00 |
| **Yến** | Thử ngưỡng duyệt riêng cho từng role (`iga.approverRole`), tối đa 20 phút | 13:30 – 14:00 |
| **Yến** | Thử role theo từng giao dịch (mục 3.2) | chốt bỏ / giữ lúc **14:30** |
| **Hằng** | Cập nhật README theo nháp tiếng Anh trong proposal của Hằng, thêm câu nối với C1 và mục "Limitations" trung thực | 13:00 – 15:30 |
| **Hằng** | Kịch bản video: mở bằng *"Phone scams are prompt injection, aimed at humans."* | trước 15:30 |

**Câu chốt cho video:** *"Scammers don't hack passwords, they hack people. Khiên Nhà makes sure no single person (not Mom under pressure, not a hijacked phone, not even us) can move a lifetime of savings alone."*

---

## Nguồn kiểm chứng (Raziel MCP v1.9.33, gọi trực tiếp)
- `tide_canon custom-contracts` và `tide_playbook deploy-forseti-policy`: contract không tự deploy được
- `tide_canon agent-authority`: agent không có danh tính Tide (GAP-063, GAP-064)
- `tide_canon iga-change-requests-api`: `/approve`, cảnh báo "credited to the caller", ngưỡng riêng theo entity, `ADMIN_QUORUM_FLOOR`
- `tide_list playbooks`: có `setup-iga-admin-panel`, `verify-jwt-server-side`, `start-tidecloak-dev`
