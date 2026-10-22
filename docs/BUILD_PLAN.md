# BUILD PLAN – Khiên Nhà (for the coding agent)

> Written by the planner (Opus) for the builder agent (Sonnet). Read this whole file first, then
> [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) §2 (spec) and §6 (demo scenes).
> Hard deadline: **feature freeze 15:30, submission 18:00 (Vietnam time, 22/10/2026)**. Run `date` often.
> Repo root: `D:\RMIT hackathon\challenge2` (Windows 11, Git Bash + PowerShell, Docker 29, Node 24, gh logged in).

---

## 0. Rules for the builder

1. **Tide knowledge comes from the Tide MCP, not memory.** Call it with
   `tools/tide-mcp.sh <tool> '<json>'` (e.g. `tools/tide-mcp.sh tide_playbook '{"name":"start-tidecloak-dev"}'`).
   Long docs come in parts (`"part":2`). Use `"section":"..."` on canon files. Follow playbooks exactly; where
   this plan and a playbook disagree on a Tide detail, **the playbook wins**: note it in §7.
2. **User answers are already collected** (do NOT ask again, do NOT change): licence email + `TIDE_TERMS_ACCEPTED=yes`
   are in `.env`; branding = keep Tide logo (skip `tide_branding`); onboarding = collect **display name only**
   (call `tide_onboarding` with a display-name field and write the modal it returns).
3. **Human checkpoints (🧑 below): STOP.** End your run with a short report in **Vietnamese** that says exactly
   what the user must click/open (links, which browser profile), then wait to be resumed. Never create Tide
   accounts, never drive the Tide enclave/login with automation, never script a headless browser around it.
4. **Never commit secrets:** `.env`, `data/`, `tidecloak.json`, tokens, invite links. Check `git status` before each commit.
5. **Commit + push after each phase** (`git pull --rebase` first). Plain commit messages, **no Claude/AI attribution
   trailers**. Tick the checkboxes in this file as you go.
6. **Security invariants (the judges are Tide engineers):**
   - IGA approvals are sent **from the approver's browser directly to TideCloak** with their own (DPoP) token.
     **Never proxy `/approve` through the Next.js server** (approvals get credited to the caller).
   - MockBank verifies JWTs with `createLocalJWKSet(tcConfig.jwk)` from the adapter file. No network JWKS fetch.
   - No doken/token stored server-side. App server is **untrusted** by design.
   - Don't overstate: wording in UI/README says "our server/database cannot fake an approval", not "nobody can".
7. **Timebox:** if any step is stuck > 20 min, stop and report (the user will ask Tide on Discord #support).
   Prefer a working MVP over completeness. MVP scenes = 1, 2, 3, 6 of IMPLEMENTATION_PLAN §6.

---

## 1. Target layout

```
challenge2/
├── .env                      # local only (exists): licence email, terms, KC admin password, URLs
├── .mcp.json                 # Tide MCP for future Claude Code sessions (exists)
├── tools/tide-mcp.sh         # Tide MCP over curl (exists)
├── infra/
│   ├── start-tidecloak.sh    # docker run tideorg/tidecloak-dev (playbook start-tidecloak-dev)
│   ├── bootstrap-realm.sh    # realm khien-nha, clients, roles, IGA on (playbook bootstrap-realm-from-template)
│   ├── create-users.sh       # ba-lan, thao, minh + invite links (playbook initialize-admin-and-link-account)
│   └── export-adapter.sh     # vendorResources adapter export → app/data/tidecloak.json + bank/data/tidecloak.json
├── app/                      # Next.js (App Router, TypeScript) :3000
│   ├── seed/seed.json        # synthetic people, recipients, balance (NOT under data/)
│   ├── data/tidecloak.json   # adapter (gitignored)
│   ├── app/                  # pages (see §4)
│   ├── lib/                  # tide provider, iga client, tx store, hashing
│   └── public/silent-check-sso.html
├── bank/                     # MockBank, Express :4000
│   ├── data/tidecloak.json   # adapter copy (gitignored)
│   └── src/server.ts
├── scripts/attack-forge.mjs  # demo scene 4: forged/edited approval rejected
└── docs/                     # plans (exists)
```

---

## 2. Phases

### Phase 1 – TideCloak up (target 13:15)
- [x] Read playbook `start-tidecloak-dev`. Write `infra/start-tidecloak.sh` that sources `.env` and runs the
      container **without `sudo`** (Windows) and **without appending `start-dev`**. Volume: `./data:/opt/keycloak/data/h2`
      (on Git Bash use `MSYS_NO_PATHCONV=1` / `$(pwd -W)` if the mount path breaks).
- [x] Wait until `curl -sf http://localhost:8080` succeeds.

### Phase 2 – Realm bootstrap (target 13:35)
- [x] Read `bootstrap-realm-from-template` + canon `tidecloak-bootstrap`. Write `infra/bootstrap-realm.sh`:
  - realm **`khien-nha`** (never `myrealm`), `registrationAllowed: false` (invite-only)
  - public client **`khien-nha-app`** (redirects `http://localhost:3000/*`, web origins `http://localhost:3000`, DPoP as template)
  - client **`mock-bank`** (bearer-only / no login) holding the transfer roles
  - client role on `mock-bank`: **`chuyen-khoan-lon`** (fallback design, §3.3)
  - initialize Tide realm with `TIDE_LICENSE_EMAIL` / `TIDE_TERMS_ACCEPTED` from `.env`, enable IGA,
    drain pending change requests while still in FirstAdmin mode (the playbook's `approve_all_pending`)
  - make sure the app client's tokens include `mock-bank` client roles (`resource_access.mock-bank.roles`)
- [x] Ask the MCP before going on: `tide_canon '{"name":"iga-change-requests-api","section":"Threshold"}'`.

### Phase 3 – Users + invite links (target 13:50) → 🧑 HUMAN CHECKPOINT H1
- [x] Read `initialize-admin-and-link-account`. Write `infra/create-users.sh` creating **`ba-lan`, `thao`, `minh`**
      and printing one invite link each. Follow the playbook's canonical order
      (create user → drain → mint invite → enroll → drain → sign IdP settings → grant tide-realm-admin → final drain).
- [ ] 🧑 **STOP (H1).** Report the 3 invite links to the user (in chat only, never in a file in git). Tell them:
      open each link in a **separate browser profile or incognito window**, create the Tide account, set display
      names "Bà Lan", "Thảo", "Minh". Wait to be resumed.
- [ ] After resume: verify `tideUserKey` present for all 3, drain CRs, sign IdP settings.
- [ ] Grant `tide-realm-admin` (client role on `realm-management`) to **ba-lan first, then thao, then minh**.
      After the first grant the realm flips to MultiAdmin: the 2nd and 3rd grants need **enclave approvals by the
      existing admin(s)** → 🧑 **STOP (H2)** with exact steps (tide-console `http://localhost:8080` → QEA Approvals),
      or do them from the app's approvals page once Phase 5 exists (then reorder: build Phase 4–5 first). Target:
      3 admins → quorum threshold **2** (`max(1, floor(0.7×3))`), i.e. **Bà Lan + one child**. The dev bootstrap
      admin is **not** a `tide-realm-admin` of `khien-nha`.
- [x] `infra/export-adapter.mjs` (done early; re-run after enrollment): export the adapter with **`vendorResources/get-installations-provider`**
      (not the standard Keycloak path); check `jwk`, `vendorId`, `homeOrkUrl` exist; copy to `app/data/` and `bank/data/`.

### Phase 4 – Next.js app skeleton + login (target 14:15, parallel with H1/H2 waits)
- [ ] Follow `add-auth-nextjs-fresh` (App Router): install per playbook (avoid interactive `create-next-app`),
      `TideCloakProvider` with the adapter, DPoP **on**, `public/silent-check-sso.html` (check the hash the playbook
      gives), post-auth redirect handler, CSP for the SWE iframe, login button. Write the `tide_onboarding` modal (display name).
- [ ] Pages show the logged-in user's display name and role (`parent` if username `ba-lan`, else `child`).
- [ ] ⛳ **Checkpoint 14:00** (IMPLEMENTATION_PLAN): login works + a change request can be created.

### Phase 5 – Core flows (target 15:20)
Read `setup-iga-admin-panel` and `verify-jwt-server-side` first.

**MockBank (`bank/src/server.ts`, Express :4000, in-memory ledger seeded from `app/seed/seed.json`)**
- `POST /transfer` `{txId, from, to, amount, nonce}` + `Authorization`/DPoP headers from Bà Lan's browser:
  1. verify JWT with `createLocalJWKSet(tc.jwk)` (+ DPoP proof per playbook), issuer = realm, `sub` = account owner
  2. `amount < 10_000_000` → execute
  3. `amount ≥ 10_000_000` → require the approval role (§3), else **403 `NEEDS_FAMILY_APPROVAL`**
  4. reject reused `txId` (**409**). Invalid/forged signature → **401 `INVALID_SIGNATURE`**
- `GET /ledger` (balance + executed transfers, with who approved if known). CORS for `http://localhost:3000`.

**App (Next.js)**
- `/` landing: one-line pitch + login.
- `/wallet` (Bà Lan): balance (from MockBank), transfer form (recipient dropdown from seed + amount), history.
  - < 10M → browser sends straight to MockBank with her token → done.
  - ≥ 10M → app stores tx `PENDING` (`lib/txStore.ts`, JSON file; untrusted by design) → **Bà Lan's browser** files the
    role-grant change request on TideCloak (`§3`) → stores CR id on the tx → status "Chờ người thân duyệt".
  - When CR is `APPROVED`: "Thực hiện" button → refresh/re-login token (role can lag up to **120 s**: show a
    "refresh token" button and a countdown) → send to MockBank → executed.
- `/approvals` (Thảo, Minh, and Bà Lan): list pending CRs **fetched from TideCloak in the browser**
  (`GET /admin/realms/khien-nha/iga/change-requests?status=PENDING`), joined with tx details from the app
  (show a banner: "Chi tiết hiển thị bởi app; số tiền & người nhận được khoá trong tên role", if §3.1 works).
  Buttons **Duyệt** → `POST .../{id}/approve` from the browser, handle `mode: needs-approval` via the enclave exactly
  as the playbook shows; **Từ chối** → `.../deny` (only on a CR just read as `PENDING`). Show `authorizationCount`
  / `threshold` (read `authorizationCount`, fall back to `readyToCommit`, never default to 0).
- History: who requested, who approved/denied, when (from CR `authorizers[]`).
- UI: Vietnamese labels, large fonts, mobile-friendly, simple Tailwind or plain CSS. Function over looks.

### Phase 6 – Demo extras (only if MVP works before 15:20)
- [ ] `scripts/attack-forge.mjs` (scene 4): (a) mark a tx `approved` in the app store and send it with Bà Lan's token
      that lacks the role → 403; (b) send a token signed with a locally generated key → 401. Print results clearly.
- [ ] Scene 5 deny flow polished. Scene 7 (remove an approver → pending quorum) only if time remains.

### Phase 7 – Wrap (by 15:30, freeze)
- [ ] README **Setup** section: exact commands to run TideCloak, bootstrap, app, bank (keep the overview ≤ 300 words, don't edit it).
- [ ] Update README **Limitations** with anything learned (e.g. which §3 design was used).
- [ ] Commit + push. Final report to the user in Vietnamese: what works, what's cut, how to start everything for recording.

---

## 3. Approval-to-transaction binding

### 3.1 Primary (experiment, decide by **14:30**): one role per transaction
- Role name on `mock-bank`: `tx-<hash12>` where `hash12 = sha256(txId|from|to|amount|nonce)` first 12 hex chars.
- Bà Lan's browser creates the role and grants it to herself → change request(s) (creating a role may be its own CR;
  approve dependent CRs together, roles must exist before assignment).
- MockBank recomputes the hash from the request body and requires `tx-<hash12>` in `resource_access.mock-bank.roles`.
  Changing amount/recipient on the server breaks the hash → rejected. Each tx id usable once.

### 3.2 Check first (≤ 20 min, by 14:00): per-role approver/threshold
- `iga.approverRole` + `iga.threshold` on the role. If it works in MultiAdmin mode, approvers need not be realm admins.
  If unclear/doesn't work, keep the 3-admin design. Record the result in §7.

### 3.3 Fallback: shared role `chuyen-khoan-lon`
- Grant → approve → execute once → bank logs tx id → app files a **revoke** CR right after (needs quorum again; show it
  as "khoá lại"). README Limitations must say approvals are bound to the role, not the specific transaction.

---

## 4. Seed data (`app/seed/seed.json`)
```json
{
  "owner": {"username": "ba-lan", "display": "Bà Lan", "account": "0071000123456", "balance": 850000000},
  "approvers": [{"username": "thao", "display": "Thảo"}, {"username": "minh", "display": "Minh"}],
  "threshold_vnd": 10000000,
  "recipients": [
    {"id": "bin",  "name": "Cháu Bin (học phí)",          "account": "9704000111222", "suggested": 30000000},
    {"id": "cho",  "name": "Chợ Bến Thành (tiền chợ)",     "account": "9704000333444", "suggested": 2000000},
    {"id": "hung", "name": "TK tạm giữ – Đại úy Hùng",     "account": "9704999888777", "suggested": 200000000, "scam": true}
  ]
}
```

## 5. How to start everything (fill in real commands in README Setup)
```bash
bash infra/start-tidecloak.sh
bash infra/bootstrap-realm.sh
bash infra/create-users.sh      # then the human enrolls via invite links
bash infra/export-adapter.sh
(cd bank && npm i && npm run dev)   # :4000
(cd app && npm i && npm run dev)    # :3000
```

## 6. Definition of done (MVP)
Scenes 1, 2, 3, 6 work end-to-end on `http://localhost:3000` with 3 Tide users in 3 browser profiles, and MockBank
rejects a ≥ 10M transfer without the approval role.

## 7. Builder's log (append findings here)
- 12:25 Docker Desktop was stopped; started it from D:\Docker\DockerDesktop. No `jq` on this machine, so infra scripts after Phase 1 are Node (.mjs) instead of bash+jq. Pack templates fetched to `.tide-pack/` (gitignored) via https://mcp.tide.org/pack/templates.tgz; realm template at `.tide-pack/templates/shared/realm.json.template`.
- Phase 1 done: `infra/start-tidecloak.sh` runs the container without sudo, using `MSYS_NO_PATHCONV=1` and a `pwd -W` host path for the volume; TideCloak answered 302 on :8080 within ~30 s.
- Phase 2 done (12:27): `infra/bootstrap-realm.mjs` (Node, uses `infra/lib.mjs`) -> realm `khien-nha`, app client `khien-nha-app` (DPoP on), bearer-only client `mock-bank` with role `chuyen-khoan-lon`, audience mapper for mock-bank, licensed, IGA on, 0 pending CRs. Licence returned `CREATED`.
- Phase 3 partial (12:30): `infra/create-users.mjs` created ba-lan, thao, minh (HTTP 202 each, drained, 0 pending) and minted invite links (printed to terminal + `data/users.json`, gitignored). Finding: the realm user profile marks `email` as required, which blocks creating Tide users without email (AP-85 forbids fake emails) -> script makes email optional via PUT `/users/profile`. `infra/export-adapter.mjs` already works (jwk, vendorId, homeOrkUrl present; written to app/data and bank/data).
- STOPPED at H1 (waiting for the human to enroll 3 users). Next after resume: `node infra/finish-users.mjs` (verify tideUserKey, drain, sign IdP, grant tide-realm-admin ba-lan first; thao/minh grants may need enclave approval = H2), then `node infra/export-adapter.mjs`, then Phase 4.
- Open question for after enrollment: Tide may set the Keycloak username to the vuid after linking, so personas must be mapped by user id (`data/users.json`) rather than by username `ba-lan`.
