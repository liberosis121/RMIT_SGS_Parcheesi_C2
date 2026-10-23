# RMIT_SGS_Parcheesi_C2: KinKey

> **KinKey is a two-key family wallet: an elderly parent's large transfers only go through when a child they chose also approves, and no server, database or admin can fake that approval.**

Submission of **Team Parcheesi** (RMIT Saigon South) for **Challenge 2: Tide UNLOCKED** at RMIT Hackathon 2026.

---

## Project overview

### 1. Vision & originality
Phone scams don't break passwords; they persuade the real owner. Social engineering is prompt injection aimed at humans. KinKey lets elderly parents keep everyday control, while transfers of 10 million VND or more wait for a second key held by a child they chose.

### 2. Trust constraint insight
Biometrics prove it is really Mom pressing "send"; in a scam, that is exactly the problem. Today's only fix is handing power to someone: a child who could drain the account, or a vendor whose "co-sign" rule is a database row any admin can edit.

### 3. Value & impact
Vietnamese lost an estimated 18,900 billion VND (~US$744M) to online scams in 2024. Parents stay independent for small payments; families get a pause button on the one transfer that could wipe out their savings.

### 4. Why TideCloak matters
With ordinary login, the rule lives in our database and the signing key on our server. With TideCloak, the right to move a large sum is a role that only appears after the parent and a child each approve from their own browser (quorum-enforced authorization). Tokens are signed by the Tide Fabric, so no server holds the key, and changing the rule needs the same quorum. The same pattern could let an AI agent safely hold a wallet.

### 5. Prototype & storytelling
Mom sends 2 million VND alone. A fake police officer pushes her to send 200 million; it waits. Our developer, with full server access, forges an approval; the bank rejects it. Her daughter spots the strange recipient and denies it, then approves a real tuition payment, logged.

---

## Demo video

[`demo.mp4`](demo.mp4) _(2 minutes, < 100 MB)_

> **Real vs simulated, in one line.** TideCloak runs for real (realm, licence, IGA, Mom's real Tide sign-in, and MockBank executed a ₫2,000,000 transfer after verifying a real Fabric-signed token). Because the Tide network was overloaded during the event, the organisers asked teams to *"build the app as though TideCloak protects it, use Tide's MCP to plan where TideCloak fits, and simulate TideCloak's sign-in, roles and access checks"*. The full three-person quorum flow therefore runs in **Simulated TideCloak mode** at `/sim`. See [docs/TIDECLOAK_PLAN.md](docs/TIDECLOAK_PLAN.md).

---

## Contents

1. [The problem in detail](#1-the-problem-in-detail)
2. [The solution: KinKey](#2-the-solution-kinkey)
3. [Why this needs Emergent Authority](#3-why-this-needs-emergent-authority)
4. [Architecture](#4-architecture)
5. [How a transfer flows](#5-how-a-transfer-flows)
6. [Security design](#6-security-design)
7. [The app](#7-the-app)
8. [Setup](#8-setup)
9. [Repository layout](#9-repository-layout)
10. [Status, limitations and honest scope](#10-status-limitations-and-honest-scope)
11. [Roadmap](#11-roadmap)
12. [How we built it](#12-how-we-built-it)
13. [Team and sources](#13-team-and-sources)

---

## 1. The problem in detail

**Scams in Vietnam target the owner, not the password.**

- Online scams cost people in Vietnam an estimated **18,900 billion VND (~US$744M) in 2024**; **62%** of survey respondents had received calls from people impersonating police, tax officers or banks (NCA, 2024).
- Police report almost **40,000 billion VND** lost since 2020 across more than 24,000 cases. A 2025 ring pushed victims to install a fake *VNeID* app and took **160 billion VND** from ~400 people.
- Older people are hit hardest: they hold savings, trust "the authorities", and are often alone when the call comes.

**Why existing protections don't help:**

| Today's approach | Who holds the power | Where it breaks |
|---|---|---|
| Bank biometrics for transfers over 10M VND (State Bank of Vietnam rule, since 1 July 2024) | The parent | It proves *it really is Mom*. In a scam, Mom **is** the one pressing "send". Malware can also steal OTPs. |
| A child keeps the parent's login | The child | The child can drain the account; the parent loses independence; elder financial abuse is real. |
| An app or bank adds a "relative co-signs" feature | The app's server | The co-sign rule is **a row in a database**. An admin, an insider, a hacker on the server, or a tech-savvy family "admin" can switch it off or fake an approval. |

The trade-off the challenge asks about is exactly this: **to protect Mom, someone has to be given power, and that someone becomes the new weak point.**

---

## 2. The solution: KinKey

A family wallet with **two keys** for big transfers.

| Rule | Why |
|---|---|
| **Under ₫10,000,000:** the parent sends alone, instantly. | Keeps the parent independent. KinKey is not a control tool. The threshold matches the State Bank's biometric threshold, so it is easy to explain: *"Biometrics prove it's Mom; KinKey proves the family agrees."* |
| **₫10,000,000 or more:** the transfer is **held** until the parent **and at least one child** approve. | The second key sits on a different person's device, out of the scammer's reach. |
| **Children cannot start a transfer** from the parent's account. | They only hold the second key, never the money. |
| **Changing the rules** (removing an approver, lowering the threshold) needs the **same quorum**. | Nobody can quietly disable the protection. |
| Every request, approval and denial is **logged** with who and when. | Transparency for the family. |

**Personas (synthetic data):**
- **Mom (Lan)**, 68, account owner, balance ₫850,000,000
- **Thao** (daughter) and **Minh** (son), the second-key holders
- Recipients: *Bin – grandson's tuition*, *Ben Thanh Market – groceries*, and *Captain Hung – "police holding account"* (the scammer)

---

## 3. Why this needs Emergent Authority

The challenge's test: *"If your app would work the same with ordinary login and backend permissions, develop the idea further."*

| Scenario | Ordinary login + backend permissions | KinKey + TideCloak |
|---|---|---|
| A scammer talks Mom into sending ₫200M | Blocked **only if** the rule on the server is still intact | Blocked: the large-transfer permission only exists after a child's real approval |
| Malware steals Mom's password and OTP | Succeeds if the rule was turned off or edited | Still blocked: the second key is on another person's device |
| A child acting as "family admin" removes the other approver or lowers the threshold | **Succeeds**: admins can do anything | Becomes a **change request waiting for quorum** |
| A developer with root on our server edits the database to "approved" | **Succeeds**: the server is the source of truth | The bank rejects it: no valid Tide-signed token carries the permission |
| A developer steals the auth server's signing key to mint tokens | **Succeeds** with a normal Keycloak (the key lives in its database) | **There is no key to steal**: tokens are signed by the Tide Fabric with a threshold key that is never assembled in one place |

**What TideCloak gives us:**
- **Quorum-Enforced Authorization (QEA / IGA):** any change to roles or permissions becomes a *change request* that only commits after the required number of admins approve it, each in their own browser via the Tide enclave.
- **Fabric-signed tokens:** JWTs are signed by Tide's decentralised network (ORKs). The verifier only needs the realm's public key; nobody holds the private key.
- **BYOiD login:** each family member has their own Tide identity; the app never sees their password.

With ordinary login the screens would look the same, but the promise *"no one can override this rule alone"* would be false. That promise is the product.

---

## 4. Architecture

```
          Browser windows: Mom / Thao / Minh (each signed in with their own Tide identity)
            │                         │                              │
            │ (1) sign in, and        │ (2) UI                       │ (3) transfer request
            │     APPROVE directly    │                              │     + Tide-signed token (DPoP)
            ▼                         ▼                              ▼
  ┌──────────────────────┐   ┌──────────────────────┐   ┌──────────────────────────┐
  │ TideCloak      :8080 │   │ KinKey app     :3000 │   │ MockBank           :4000 │
  │ realm "kinkey2"      │   │ Next.js 16 / React   │   │ Express + jose           │
  │ IGA / quorum ON      │   │ UI + small tx store  │   │ verifies Tide signature  │
  │ client roles on      │   │ (UNTRUSTED by design)│   │ with the realm's public  │
  │ "mock-bank"          │   │                      │   │ key, then moves money    │
  └──────────┬───────────┘   └──────────────────────┘   └──────────────────────────┘
             │ threshold signing
             ▼
     Tide Fabric (independent ORK nodes): no single node holds the key
```

| Component | Tech | Role | Trusted? |
|---|---|---|---|
| **TideCloak** | Docker `tideorg/tidecloak-dev` | Identity, quorum-enforced role changes, Fabric-signed tokens | Trust the **Tide network**, not any single machine |
| **KinKey app** | Next.js 16, React, TypeScript, `@tidecloak/nextjs` | Wallet and approvals UI; stores pending transfers in a JSON file | **No.** Assumed compromisable; it cannot grant itself anything |
| **MockBank** | Node, Express, TypeScript, `jose` | Executes transfers only for valid tokens with the right role | Plays the **real bank** (independent verifier) |

**Realm design (`kinkey2`; scripts default to `khien-nha`, set `REALM` in `.env`):**
- Public client `khien-nha-app` (DPoP-bound tokens), bearer-only client `mock-bank`.
- Client role **`chuyen-khoan-lon`** ("large transfer") on `mock-bank`. Nobody holds it by default.
- Mom, Thao and Minh are the realm's `tide-realm-admin`s → quorum threshold `max(1, floor(0.7 × 3)) = 2`, i.e. **Mom + one child**.
- Registration is off; users join through **invite links** that link their Tide account.

---

## 5. How a transfer flows

**Small transfer (< ₫10M)**
1. Mom picks a recipient and amount on **Wallet**.
2. Her browser calls MockBank `POST /transfer` with her Tide-signed, DPoP-bound token.
3. MockBank verifies the signature locally, checks she is the account owner, and sends the money.

**Large transfer (≥ ₫10M)**
```
Mom ── "send ₫200M" ──► KinKey app (stores tx: WAITING)
Mom's browser ── grant me "chuyen-khoan-lon" ──► TideCloak ──► change request (PENDING, 0/2)
Thao's browser ── sees request + red "new recipient" warning
             ├─ Deny  ──► TideCloak: DENIED ──► nothing moves
             └─ Approve (signs in Tide enclave) ──► TideCloak: 1/2 … Mom approves ──► 2/2 → COMMITTED
Mom's browser ── refresh token (role can take up to ~120 s) ── token now carries the role
Mom's browser ── POST /transfer + token ──► MockBank checks role ──► executed (one use per grant)
Mom ── "Lock approval again" ──► revoke change request (needs quorum again)
```

**Attack: developer forges an approval** (`scripts/attack-forge.mjs` and the in-app *Developer attack demo*)
1. Edits the app's transaction store so the transfer looks "approved".
2. Sends it to MockBank with a token **signed by their own key** → **401 `INVALID_SIGNATURE`**.
3. Sends it with Mom's **real** token that lacks the role → **403 `NEEDS_FAMILY_APPROVAL`**.

**MockBank API**

| Method | Path | Result |
|---|---|---|
| `GET` | `/ledger` | Balance and executed transfers |
| `POST` | `/transfer` | `{txId, from, to, amount, nonce}` + `Authorization` + `DPoP` → `200` |
| | | Forged / wrong signature → `401 INVALID_SIGNATURE` |
| | | ≥ threshold without approval → `403 NEEDS_FAMILY_APPROVAL` |
| | | Approval already used → `403 APPROVAL_ALREADY_USED` |
| | | Same `txId` twice → `409 TX_ALREADY_USED` |
| | | Not enough money → `422 INSUFFICIENT_FUNDS` |
| `POST` | `/reset` | Reset the ledger between demo takes (only with `ALLOW_RESET=1`) |

---

## 6. Security design

Decisions we made on purpose, checked against Tide's agent pack (Raziel MCP) canon:

1. **Approvals go from the approver's browser straight to TideCloak** (`POST /admin/realms/{realm}/iga/change-requests/{id}/approve`) with *their own* DPoP-bound token. They never pass through the Next.js server. A proxied approval is credited to the proxy's identity, which would let one server cast several "votes": the exact weakness KinKey exists to remove.
2. **MockBank verifies tokens offline** with `createLocalJWKSet(adapter.jwk)`: the realm's Fabric public key is pinned from the adapter file, with no network JWKS fetch. It also checks issuer, `azp`, audience `mock-bank`, and the DPoP proof.
3. **The app server is untrusted.** It stores pending transfers for display only; it never holds tokens or keys, and nothing it writes can make the bank move money.
4. **Approval is single-use.** The bank accepts one large transfer per grant and refuses replays (`txId` reuse, re-used grant) until the role is revoked and granted again.
5. **No secrets in the repo.** `.env`, adapter files, invite links and user lists are git-ignored.
6. **Plain wording.** The UI says *"our servers can't fake an approval"*, not *"nobody can ever"* (see limitations).

**Why a shared role and not one role per transaction?** We tested binding each approval to an exact transaction (a role named `tx-<hash of amount|recipient|nonce>`). On TideCloak, *creating* a role is itself a change request, so every transfer would need two approval rounds. That was too slow for a family, so we kept a shared one-use role. Binding approvals to transaction contents is in the roadmap (Forseti policy contracts).

---

## 7. The app

**Brand:** KinKey ("kin" + "key"). The logo is a house whose door is a keyhole. Visual style: warm paper background, ink text, one deep-green accent, serif headings (Source Serif 4) with Inter for UI text.

| Page | Who | What it shows |
|---|---|---|
| `/` | Everyone | Hero *"Two keys for every big transfer."*, a "transfer on hold" slip, how it works, the scam statistic, **Sign in with Tide** |
| `/wallet` | Mom | Balance, new-transfer form (recipient cards, quick amounts, live "needs approval" hint), pending transfer with a 3-step tracker (*Requested → Family approval → Sent*), activity log, **Developer attack demo** |
| `/approvals` | Thao, Minh (and Mom) | Request cards with amount, recipient, red *"First transfer to this account. Call Mom before approving."* warning, approval dots (x of 2), **Approve / Deny**, folded admin changes, history |
| `/sim`, `/sim/signin`, `/sim/wallet`, `/sim/approvals` | Everyone (demo) | **Simulated TideCloak mode**: a Tide-style sign-in (`mom`, `thao`, `minh`, password `demo`), tokens with roles signed by a simulated Fabric key, role-based route guards (*"Access denied · requires role owner"*), a **"Your token (decoded)"** panel, 2-of-3 quorum approvals signed in a Tide-style enclave dialog, a simulated bank that only trusts the Fabric public key, and both attack buttons (*Forge approval* → 403, *Forge a token* → 401) |
| `/preview`, `/preview/wallet`, `/preview/approvals` | Reviewers | The **same components with mock data and no login**, clearly bannered *"UI preview · mock data · not connected to Tide"* |

First sign-in asks *"What should we call you?"* (display name only; Tide accounts carry no name or email by default).

---

## 8. Setup

**Requirements:** Docker Desktop, Node.js 20+ (built on 24), Git Bash or any POSIX shell, internet access (the Tide network).

```bash
git clone https://github.com/liberosis121/RMIT_SGS_Parcheesi_C2.git
cd RMIT_SGS_Parcheesi_C2

# 1. Configuration: copy and fill in. The licence email and terms answer must come from YOU
#    (Tide Terms: https://tide.org/legal). Choose your own admin password.
cp .env.example .env

# 2. TideCloak (port 8080) and the realm
bash infra/start-tidecloak.sh
node infra/bootstrap-realm.mjs        # realm (REALM in .env), clients, role, licence, IGA on
node infra/create-users.mjs           # users ba-lan, thao, minh + one invite link each (saved to data/, git-ignored)

# 3. Open each invite link in a SEPARATE browser (e.g. Chrome Guest, Edge InPrivate, Firefox)
#    → Link Account → Create an account. Then:
node infra/finish-users.mjs           # verifies linking, signs IdP settings, grants tide-realm-admin
                                      # (the 2nd/3rd grants need Mom to approve in the Tide window)
node infra/export-adapter.mjs         # writes the Tide adapter (public key) for app/ and bank/

# 4. Run (two terminals)
cd bank && npm install && ALLOW_RESET=1 npm run dev     # MockBank  → http://localhost:4000
cd app  && npm install && npm run dev                   # KinKey    → http://localhost:3000

# 5. Attack demo (bank must be running)
node scripts/attack-forge.mjs
```

**Without any Tide account (recommended for judges):** run only the app (`cd app && npm install && npm run dev`) and open **`http://localhost:3000/sim`**. Sign in as `mom` in one browser tab and `thao` in another (password `demo`; each tab is its own person). Reset the demo with `curl -X POST localhost:3000/api/sim/reset`, then sign in again. A static mock-data preview is at `/preview`.

> TideCloak keeps its data in `./data`. After a reboot: start Docker Desktop and run `docker start tidecloak`. `bash infra/start-tidecloak.sh --wipe` deletes everything.

---

## 9. Repository layout

```
.
├── README.md                 this file
├── demo.mp4                  2-minute demo video
├── .env.example              configuration template (copy to .env, never commit .env)
├── infra/                    TideCloak bootstrap scripts (Node, no dependencies)
│   ├── start-tidecloak.sh    run the TideCloak dev container
│   ├── bootstrap-realm.mjs   realm, clients, roles, licence, IGA
│   ├── create-users.mjs      users + invite links
│   ├── finish-users.mjs      post-enrollment: IdP signing, tide-realm-admin grants
│   ├── export-adapter.mjs    Tide adapter (jwk, vendorId, homeOrkUrl) → app/ and bank/
│   └── lib.mjs               shared helpers (admin API, change-request drain)
├── app/                      KinKey (Next.js)
│   ├── seed/seed.json        synthetic people, recipients, history
│   ├── public/               logo, Tide silent-SSO and DPoP relay pages
│   └── src/
│       ├── app/(app)/        real pages: /, /wallet, /approvals (inside the TideCloak provider)
│       ├── app/preview/      mock-data pages, no Tide calls
│       ├── app/api/          tx store API, public config
│       ├── components/       NavBar, views (Landing, Wallet, Approvals), onboarding modal
│       └── lib/iga.ts        browser → TideCloak change requests: file, list, approve, deny
├── bank/src/server.ts        MockBank
├── scripts/attack-forge.mjs  forged-approval attack demo
├── tools/tide-mcp.sh         query Tide's MCP (Raziel) from the shell
└── docs/                     plans, proposals, architecture notes (team working documents)
```

---

## 10. Status, limitations and honest scope

**Real TideCloak: working and verified**
- TideCloak dev server, realm with licence, IGA (quorum) and Tide IdP, configured entirely by script.
- **Mom's real Tide account** linked through an invite link and **signed in to KinKey** with the Tide enclave.
- **MockBank executed a real ₫2,000,000 transfer** after verifying Mom's Fabric-signed, DPoP-bound token offline.
- Forged tokens are rejected with `401 INVALID_SIGNATURE`; unauthenticated calls are refused.

**Simulated TideCloak (`/sim`): working and verified end to end**
- Sign-in for all three people, roles in the token, route guards, 2-of-3 quorum with the four-eyes rule (same person twice → `409`), one-use permission, bank verification with the Fabric public key, and both attacks (`401`, `403`). Same views and the same bank rules as the real pages.

**Why part of it is simulated.** Creating Thao's and Minh's Tide accounts failed on the Tide network side during the event, in this order: *"could not reach enough NEW ORKs (7 of 20)"*, *"aggregate shard signature didn't pass"*, *"signature verification didn't pass"*, then *"This action isn't available on your current plan… user limit"* (after only one account on a fresh licence), and finally licence creation itself failed with `Midgard.FinalizeWallet … 500`. The organisers then confirmed the network was overloaded and asked teams to simulate sign-in, roles and access checks. The real approval code (`app/src/lib/iga.ts`, browser → `/iga/change-requests/{id}/approve` with enclave signing) is written but could not be exercised with three real accounts.

**Limitations by design**
- **Session compromise = approver compromise.** Tide attests *whoever holds this session holds this role*. A scammer controlling both Mom's and a child's device would satisfy the rule.
- **Approvals are bound to a one-use permission, not to the exact amount and recipient** (see §6). Details shown to approvers come from the app.
- **MockBank is ours.** It stands in for a real bank that would only trust TideCloak's public key.
- **Bootstrap admin:** the realm was created with TideCloak's `master` admin; whether that account can bypass the realm's quorum was not confirmed with Tide, so we only claim that *the app server and its database* cannot fake an approval.
- With three approvers and a 2-of-3 threshold, the two children together could change the rules without Mom (they still cannot move her money).
- Scammers may adapt (e.g. impersonate a child). KinKey shows the recipient prominently and warns on first-time accounts, but cannot stop a family that is fully deceived.
- All data is synthetic; nothing touches a real bank.

---

## 11. Roadmap

1. **Transaction-bound approvals** with a Forseti policy contract: approvers sign *"₫200,000,000 to account X"*, not a generic permission.
2. **Per-family policy:** parent chooses approvers, threshold and quiet hours; changes need the same quorum.
3. **Bank integration:** a bank verifies the Tide-signed approval before executing; no app server in the trust path.
4. **Scam signals for approvers:** first-time recipient, unusual amount, transfer during a long call.
5. **AI agents with a wallet:** the same two-key pattern lets an AI assistant pay bills without ever being able to move large sums alone (connects to our Challenge 1 work on prompt-injection detection: *detection can fail; authority shouldn't depend on it*).

---

## 12. How we built it

- **Idea selection:** two team members each proposed ideas, then cross-reviewed them. An *AI-agent wallet* idea was dropped after checking Tide's documentation: custom Forseti contracts are not self-service, and autonomous agents cannot hold Tide identities. KinKey uses features available today (IGA/QEA, Fabric-signed tokens).
- **Planned with Tide's MCP:** `tide_choose_scenario` matched KinKey to the `iga-admin-governance` scenario and its playbook sequence; the resulting integration map is in [docs/TIDECLOAK_PLAN.md](docs/TIDECLOAK_PLAN.md).
- **Tide knowledge from the source:** every Tide-specific step followed the official agent-pack playbooks served by Tide's MCP server (`start-tidecloak-dev`, `bootstrap-realm-from-template`, `initialize-admin-and-link-account`, `add-auth-nextjs-fresh`, `setup-iga-admin-panel`, `verify-jwt-server-side`).
- **AI-assisted development:** code was written with Claude Code, with humans owning the idea, the decisions, every Tide account and approval, and the review.

---

## 13. Team and sources

**Team Parcheesi**, RMIT Saigon South

**Sources**
- Tide UNLOCKED challenge: https://tide.org/unlocked/
- TideCloak docs: https://docs.tide.org/ (Core concepts, IGA workflow, Forseti engine)
- 2024 scam losses (NCA): https://tuoitrenews.vn/news/society/20241217/vietnamese-lose-744mn-to-online-scams-in-2024-report/83436.html
- Losses since 2020 (Ministry of Public Security): https://kynguyenvuonminh.vov.vn/en/society/online-scams-cost-vietnamese-victims-nearly-us16-billion-say-police-post1257628.vov
- Fake VNeID ring (2025): https://news.tuoitre.vn/nearly-400-vietnamese-lose-over-6mn-in-cambodia-based-fake-police-scam-103250916132759731.htm
