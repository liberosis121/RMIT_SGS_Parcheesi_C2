# Where TideCloak fits in KinKey (planned with Tide's MCP)

> Organisers' guidance during the event: *"Build this app as though TideCloak protects it. Use Tide's MCP to plan where
> TideCloak fits, and simulate TideCloak's sign-in, roles and access checks for now."*
> This file is that plan. It was produced by querying Tide's MCP server (Raziel, `https://mcp.tide.org/mcp`, v1.9.33).

## 1. What Tide's MCP recommends

`tide_choose_scenario` with *"family wallet: large transfers need a child's approval via quorum; a separate bank verifies
Tide-signed token roles; the app server is untrusted"* returns:

- **Scenario:** `iga-admin-governance` (IGA Admin Governance Panel)
- **Playbooks, in order:** `start-tidecloak-dev` → `bootstrap-realm-from-template` → `initialize-admin-and-link-account` →
  `add-auth-nextjs-fresh` → `protect-routes-nextjs` → `protect-api-nextjs` → `verify-jwt-server-side` →
  `setup-iga-admin-panel` → `add-rbac-nextjs`
- **Built-in Forseti contract:** none fits (ours governs a transfer permission, not encryption), so the quorum is done with
  **IGA change requests** rather than a custom contract. Custom Forseti contracts are not self-service today
  (canon `custom-contracts`).

## 2. TideCloak touch points in KinKey

| # | Where | TideCloak feature | What it protects | Real build | Simulated build (`/sim`) |
|---|---|---|---|---|---|
| 1 | Sign-in (all pages) | **BYOiD login** via the Tide enclave; DPoP-bound tokens | Only the real Mom/Thao/Minh can act; the app never sees passwords | `@tidecloak/nextjs` provider, realm `kinkey2` | `/sim/signin` issues a token signed by a simulated Fabric key |
| 2 | Roles in the token | `realm_access` / `resource_access["mock-bank"]` | Who may open the wallet (owner) or the approvals (approver) | Realm roles + client role `chuyen-khoan-lon` | Same claims in the simulated token; shown in a *token inspector* |
| 3 | Route guards | `protect-routes-nextjs` | `/wallet` = owner only, `/approvals` = owner or approver | Provider-level checks | "Access denied · requires role …" panel |
| 4 | Large-transfer permission | **IGA change request** granting `chuyen-khoan-lon` | A ₫10M+ transfer cannot happen until 2 of 3 family admins approve | `POST /admin/realms/kinkey2/users/{id}/role-mappings/clients/{bank}` → `202` change request | `/api/sim/iga` with threshold 2, four-eyes rule |
| 5 | Approval signing | **Quorum-enforced authorization** signed in each approver's **Tide enclave**, browser → TideCloak directly | No server can cast a vote for someone else | `POST /iga/change-requests/{id}/approve` + `approveTideRequests` | Enclave-style confirmation modal, one vote per user |
| 6 | Bank verification | **Fabric-signed JWT**, verified offline with the realm's public key (`createLocalJWKSet(adapter.jwk)`) + DPoP | A server admin can't forge "approved" | `bank/` (MockBank :4000) | `/api/sim/bank/*` verifying with the simulated Fabric **public** key only |
| 7 | Changing the rules | Removing an approver / lowering the threshold is itself a change request | Nobody quietly disables the protection | Built into IGA (`tide-realm-admin` changes) | Shown in "Admin changes" |

## 3. Trust boundaries

```
  Trusted for authority: Tide Fabric (threshold key, never assembled)   ← simulated by a key the app code never reads
  Verifier: the bank (pins the realm public key)                         ← MockBank / sim bank
  NOT trusted: KinKey app server and its database                        ← can be hacked; cannot mint approvals
```

The attack demo targets the untrusted part on purpose: editing the app's database to "approved" or minting a token with
another key both fail at the bank (`401 INVALID_SIGNATURE` / `403 NEEDS_FAMILY_APPROVAL`).

## 4. What is real and what is simulated

| Piece | Status on 22/10 |
|---|---|
| TideCloak dev server, realm, licence, IGA, Tide IdP | **Real** (Docker `tideorg/tidecloak-dev`) |
| Mom's Tide account, real sign-in to KinKey | **Real** |
| Small transfer verified by MockBank with a real Fabric-signed token | **Real** (bank executed ₫2,000,000) |
| Thao's and Minh's Tide accounts | **Blocked**: Tide network errors (ORK reachability, signature aggregation, plan limit, licence `FinalizeWallet` 500) |
| Quorum approval round-trip | **Simulated** in `/sim`, real code ready in `app/src/lib/iga.ts` |

## 5. Switching from simulated to real

Nothing in the views changes: `/sim` and the real pages share `WalletView` and `ApprovalsView`. Replace the simulated
token issuer with the TideCloak provider, the simulated IGA API with `lib/iga.ts` (already written against
`/iga/change-requests`), and the simulated bank key with the adapter's `jwk`, which is what the real pages already do.
