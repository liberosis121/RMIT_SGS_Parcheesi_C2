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

[`demo.mp4`](demo.mp4) _(TBD: 2 minutes, < 100 MB)_

## Setup

_[Full commands are added once the prototype is tested end to end.]_ Architecture, ports and run steps: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). Stack:

- **TideCloak** dev server: Docker image `tideorg/tidecloak-dev`, port `8080`, realm `khien-nha` with quorum-enforced authorization (IGA) enabled
- **KinKey app**: Next.js, port `3000`
- **MockBank**: Express, port `4000`. Verifies TideCloak-issued JWTs against the realm's public key

## Limitations (honest scope of this prototype)

- **Session compromise = approver compromise.** Tide proves *whoever holds this session holds this role*. If a scammer controls both the parent's and the child's devices, the rule is satisfied.
- **MockBank is ours.** It plays the independent verifier that, in real life, would be the bank, and only trusts TideCloak's public key.
- _[TBD after mentor check: whether a `master`-realm admin can bypass the realm's quorum.]_
- All people, accounts and transactions are synthetic.

## Team Parcheesi

- Trần Kim Yến
- Nguyễn Thị Trúc Hằng
- Trà Văn Sỹ

---

## About the challenge

**Tide UNLOCKED:** _"What would you build if trust stopped being the bottleneck?"_ Build a small working prototype with **TideCloak** that demonstrates one new possibility held back by a trade-off between power and trust, where authority only *emerges* when the right identity, policy and approvals line up, and no single administrator, server or vendor can override it.

Resources: [Tide UNLOCKED](https://tide.org/unlocked/#challenge) · [TideCloak Quickstart](https://docs.tide.org/get-started/Tidecloak%20Quickstart) · [Tide agent plugins / MCP](https://tide.org/agent-plugins)
