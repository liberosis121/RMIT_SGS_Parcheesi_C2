# Design brief – UI redesign (English only)

Requested by the team at 14:07: the UI looked plain, mixed Vietnamese and English, and the logo was weak.
Goal: a **polished, trustworthy fintech look**, **100% English**, new brand name. Feature freeze is 15:30.

## Brand
- **Name: KinKey**. Tagline: **"Two keys for every big transfer."**
  Sub-line: *"Parents stay in control of everyday money. Big transfers wait for a second key from someone they trust."*
- **Do not show "Khiên Nhà" anywhere in the UI** (title, metadata, text, alt). Browser title: `KinKey – Two keys for every big transfer`.
- **Logo:** `app/public/logo.svg` (shield, two interlocking rings = two keys, keyhole). Use it in the nav (32px) with a wordmark
  **Kin** (navy) **Key** (teal), and as favicon (`app/src/app/icon.svg` copy).

## Visual system
| Token | Value | Use |
|---|---|---|
| `--navy` | `#0F2A4A` | headings, nav text, primary buttons |
| `--teal` | `#0E7C86` / light `#5EEAD4` / tint `#E6F6F7` | brand accent, approved/success |
| `--amber` | `#B45309` / tint `#FEF3C7` | pending / waiting for approval |
| `--red` | `#B42318` / tint `#FEE4E2` | denied, scam warning, rejected by bank |
| `--bg` | `#F6F8FB` | page background |
| `--card` | `#FFFFFF`, border `#E4E9F0`, radius 16px, shadow `0 1px 2px rgba(15,42,74,.06), 0 8px 24px rgba(15,42,74,.06)` | cards |
| `--text` / `--muted` | `#0B1B2E` / `#5B6B80` | body |
- Font: **Inter** via `next/font/google` (weights 400/500/600/700); numbers use `font-variant-numeric: tabular-nums`.
- Base font 16px, generous spacing (8px grid), max content width 1120px, fully responsive (single column < 768px).
- Buttons: primary (navy fill), success (teal fill), danger (red outline), ghost. 44px min height, clear focus rings.
- Status pills: `Completed` (teal), `Waiting for family approval` (amber), `Denied` (red), `Blocked by bank` (red).
- Icons: inline SVG only (no new heavy deps). Plain CSS (CSS modules or globals.css): no Tailwind install needed.

## Pages
**Nav (all pages):** logo + wordmark left; links *Wallet*, *Approvals*; right: user chip (avatar initial + display name + role
badge `Account owner` / `Family approver`) and *Sign out*.

**Landing `/`:**
- Hero: left = headline "Two keys for every big transfer.", sub-line, primary button **Sign in with Tide**, small trust line
  "Approvals are signed by the Tide network. Our own servers can't fake them."; right = a mock "pending transfer" card
  (₫200,000,000 to "Captain Hung", 1 of 2 approvals, amber).
- "How it works": 3 numbered cards: *Everyday spending stays simple* (under ₫10,000,000 goes straight through) ·
  *Big transfers need a second key* (a child approves) · *No one can skip the rule* (not a scammer, not a stolen phone, not our server).
- Footer: "Prototype with synthetic data · Secured by TideCloak · RMIT Hackathon 2026, Team Parcheesi".

**Wallet `/wallet` (owner):**
- Balance card (large ₫ amount, account number masked `•••• 3456`), threshold note "Transfers of ₫10,000,000 or more need family approval".
- "New transfer" card: recipient selector as **cards** (name, account, icon; scam recipient shows nothing special here, since the
  scammer looks legitimate to Mom), amount input with quick chips (₫2,000,000 / ₫30,000,000 / ₫200,000,000), live hint
  "This will need approval from Thao or Minh" when ≥ threshold, primary button.
- Pending transfer card: **3-step progress** *Requested → Family approval (x of 2) → Sent*; countdown/refresh for the role
  delay; buttons *Complete transfer* / *Lock approval again*.
- Activity list: icon, recipient, amount, time, status pill.
- Keep the demo "forge approval" button but restyle as a subtle **"Developer attack demo"** section at the bottom, with a clear
  result panel (red, shows bank response code).

**Approvals `/approvals` (Thao, Minh, also Mom):**
- Request cards: big amount, recipient, requested by, time; **red warning banner when recipient is new/unusual**
  ("First transfer to this account. Call Mom before approving."); approval progress dots (x of 2) with approver names;
  buttons **Approve** (teal) / **Deny** (red outline). Honest note in small text: "Details shown by the app; the approval
  grants a one-time large-transfer permission."
- Section "Admin changes" (non-transaction CRs) collapsed by default.
- History list of decided requests.

**Onboarding modal:** English ("What should we call you?"), same logic.

## Data / copy (English, keep the Vietnamese setting)
- People: **Mom (Lan)** – account owner; **Thao** – daughter; **Minh** – son.
- Recipients (update `app/seed/seed.json` `name` fields only, keep ids/accounts): "Bin – grandson's tuition",
  "Ben Thanh Market – groceries", "Captain Hung – 'police holding account'" (scam: true).
- Money: Vietnamese dong formatted `₫200,000,000` (`Intl.NumberFormat('en-US', {style:'currency', currency:'VND'})`).
- All error/status messages from the app and bank shown in friendly English (map bank codes:
  `NEEDS_FAMILY_APPROVAL` → "This transfer needs family approval first", `INVALID_SIGNATURE` → "Rejected: the approval
  signature is not from Tide", etc.).

## UI preview with mock data (needed now: Tide accounts are blocked by a Tide network error)
- Add `/preview` (index linking `/preview/wallet` and `/preview/approvals`) that renders **the same components** with mock
  data and **no login**, with a thin top banner "UI preview · mock data · not connected to Tide". Must not call TideCloak
  or the bank. This lets the team review the design and is the video fallback if accounts stay blocked.
- Refactor so real pages and preview pages share presentational components (`components/…`), logic stays in pages.

## Don'ts
- Don't change security behaviour (browser → TideCloak approvals, bank verification, no tokens server-side).
- Don't add Tailwind/UI kits; don't break `npm run build`.
- Don't touch README overview text (the coordinator renames it).
